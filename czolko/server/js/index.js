"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const Events_js_1 = __importDefault(require("./Events.js"));
const Lobby_js_1 = __importDefault(require("./Lobby.js"));
const Player_js_1 = __importDefault(require("./Player.js"));
const removeDiacritics = require('diacritics').remove;
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server);
const PORT = process.env.PORT || 30177;
app.use(express_1.default.static(path_1.default.join(__dirname, '..', '..', 'build')));
app.get('*', (req, res) => res.redirect('/'));
const lobbies = new Map();
let timeout = null;
io.on(Events_js_1.default.CONNECTION, (socket) => {
    socket.on(Events_js_1.default.CREATE, (nickname) => {
        var _a;
        socket.nickname = nickname;
        socket.lobby = socket.id;
        lobbies.set(socket.id, new Lobby_js_1.default());
        (_a = lobbies.get(socket.id)) === null || _a === void 0 ? void 0 : _a.players.push(new Player_js_1.default(nickname, socket.id));
    });
    socket.on(Events_js_1.default.JOIN, (code, nickname) => {
        const lobby = lobbies.get(code);
        if (!lobby) {
            socket.emit('error', 'Lobby nie istnieje');
            return;
        }
        else if (lobby.started) {
            socket.emit('error', 'Gra się rozpoczęła');
            return;
        }
        if (lobby.players.filter((item) => item.nickname === nickname).length) {
            socket.emit('error', 'W lobby jest już gracz o takim nicku');
            return;
        }
        socket.nickname = nickname;
        socket.lobby = code;
        socket.join(code);
        lobby.players.push(new Player_js_1.default(nickname, socket.id));
        io.to(socket.lobby).emit(Events_js_1.default.UPDATE_PLAYERS, lobby.players);
        socket.emit(Events_js_1.default.JOINED);
    });
    socket.on(Events_js_1.default.DISCONNECT, () => {
        if (!hasLobby())
            return;
        const lobby = lobbies.get(socket.lobby);
        if (lobby.started) {
            const index = lobby.players.findIndex((item) => item.id === socket.id);
            const newLastIndex = lobby.players.length - 2;
            const active = lobby.active;
            // If index of disconnected person is before active index decrement active
            if (index < active) {
                lobby.active = active - 1;
                // If disconnected person is active and there is nobody on next index set active to 0
            }
            else if (index === active && active > newLastIndex) {
                lobby.active = 0;
            }
            if (index <= active && timeout) {
                clearTimeout(timeout);
                lobby.guessable = true;
            }
        }
        lobby.players = lobby.players.filter((item) => item.nickname !== socket.nickname);
        socket.leave(socket.lobby);
        if (lobby.started) {
            io.to(socket.lobby).emit(Events_js_1.default.UPDATE_GAME_DATA, lobby);
        }
        else {
            io.to(socket.lobby).emit(Events_js_1.default.UPDATE_PLAYERS, lobby.players);
        }
    });
    socket.on(Events_js_1.default.GET_PLAYERS, () => {
        if (!hasLobby())
            return;
        const lobby = lobbies.get(socket.lobby);
        socket.emit(Events_js_1.default.UPDATE_PLAYERS, lobby.players, socket.lobby);
    });
    socket.on(Events_js_1.default.SET_READINESS, (ready) => {
        if (!hasLobby())
            return;
        const lobby = lobbies.get(socket.lobby);
        lobby.players = lobby.players.map((item) => {
            if (item.id === socket.id) {
                item.ready = ready;
            }
            return item;
        });
        io.to(socket.lobby).emit(Events_js_1.default.UPDATE_PLAYERS, lobby.players);
    });
    socket.on(Events_js_1.default.CHANGE_WORD, (id, word) => {
        if (!hasLobby())
            return;
        const lobby = lobbies.get(socket.lobby);
        lobby.players = lobby.players.map((item) => {
            if (item.id === id) {
                item.word = word;
            }
            return item;
        });
        io.to(socket.lobby).emit(Events_js_1.default.UPDATE_PLAYERS, lobby.players);
    });
    socket.on(Events_js_1.default.START_GAME, () => {
        const lobby = lobbies.get(socket.lobby);
        if (lobby.started)
            return;
        let everyoneHaveWord = true;
        lobby.players.forEach((item) => {
            if (!item.word.length)
                everyoneHaveWord = false;
        });
        if (everyoneHaveWord) {
            io.to(socket.lobby).emit(Events_js_1.default.GAME_STARTED);
            lobby.started = true;
            lobby.active = 0;
        }
        else {
            io.to(socket.lobby).emit('error', 'Każdy musi mieć swoje słowo');
        }
    });
    socket.on(Events_js_1.default.GET_GAME_DATA, () => {
        if (!hasLobby())
            return;
        socket.emit(Events_js_1.default.UPDATE_GAME_DATA, lobbies.get(socket.lobby));
    });
    socket.on(Events_js_1.default.GUESS_WORD, (word) => {
        if (!hasLobby())
            return;
        const lobby = lobbies.get(socket.lobby);
        const active = lobby.active;
        lobby.guessable = false;
        const normalizedWord = normalizeWord(word);
        const normalizedPlayerWord = normalizeWord(lobby.players[active].word);
        if (word && normalizedWord === normalizedPlayerWord) {
            lobby.winners++;
            lobby.players[active].place = lobby.winners;
            lobby.players[active].won = true;
            lobby.players[active].lastGuess = word;
            const doesEverybodyWon = lobby.players.filter((item) => !item.won).length;
            if (doesEverybodyWon === 0) {
                io.to(socket.lobby).emit(Events_js_1.default.UPDATE_GAME_DATA, lobby);
                setTimeout(() => {
                    io.to(socket.lobby).emit(Events_js_1.default.GAME_OVER);
                }, 1500);
                return;
            }
            io.to(socket.lobby).emit(Events_js_1.default.WIN, lobby.players[active]);
        }
        else if (word) {
            lobby.players[active].lastGuess = `${word} źle`;
        }
        else {
            lobby.players[active].lastGuess = 'pominięto rundę';
        }
        io.to(socket.lobby).emit(Events_js_1.default.UPDATE_GAME_DATA, lobby);
        timeout = setTimeout(() => {
            setNextPlayer(lobby);
            lobby.guessable = true;
            lobby.players[lobby.active].lastGuess = '';
            io.to(socket.lobby).emit(Events_js_1.default.UPDATE_GAME_DATA, lobby);
        }, 1500);
    });
    const hasLobby = () => {
        return socket.lobby && lobbies.has(socket.lobby);
    };
    const normalizeWord = (word) => {
        if (!(word === null || word === void 0 ? void 0 : word.length))
            return;
        word = word.trim();
        word = removeDiacritics(word);
        word = word.toLowerCase();
        return word;
    };
    const setNextPlayer = (lobby) => {
        const lastIndex = lobby.players.length - 1;
        let newActive = lobby.active;
        do {
            if (newActive < lastIndex)
                newActive++;
            else
                newActive = 0;
        } while (lobby.players[newActive].won);
        lobby.active = newActive;
    };
});
server.listen(PORT);
