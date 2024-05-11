import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import Events from './Events.js';
import Lobby from './Lobby.js';
import Player from './Player.js';

const removeDiacritics = require('diacritics').remove;
const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 30177;

app.use(express.static(path.join(__dirname, '..', '..', 'build')));

app.get('*', (req, res) => res.redirect('/'));

const lobbies: Map<string, Lobby> = new Map();
let timeout: NodeJS.Timeout | null = null;

io.on(Events.CONNECTION, (socket: any) => {
   socket.on(Events.CREATE, (nickname: string) => {
      socket.nickname = nickname;
      socket.lobby = socket.id;

      lobbies.set(socket.id, new Lobby());
      lobbies.get(socket.id)?.players.push(new Player(nickname, socket.id));
   });

   socket.on(Events.JOIN, (code: string, nickname: string) => {
      const lobby = lobbies.get(code) as Lobby;

      if (!lobby) {
         socket.emit('error', 'Lobby nie istnieje');
         return;
      } else if (lobby.started) {
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

      lobby.players.push(new Player(nickname, socket.id));

      io.to(socket.lobby).emit(Events.UPDATE_PLAYERS, lobby.players);
      socket.emit(Events.JOINED);
   });

   socket.on(Events.DISCONNECT, () => {
      if (!hasLobby()) return;

      const lobby = lobbies.get(socket.lobby) as Lobby;

      if (lobby.started) {
         const index = lobby.players.findIndex((item) => item.id === socket.id);
         const newLastIndex = lobby.players.length - 2;
         const active = lobby.active;

         // If index of disconnected person is before active index decrement active
         if (index < active) {
            lobby.active = active - 1;

            // If disconnected person is active and there is nobody on next index set active to 0
         } else if (index === active && active > newLastIndex) {
            lobby.active = 0;
         }

         if (index <= active && timeout) {
            clearTimeout(timeout);
            lobby.guessable = true;
         }
      }

      lobby.players = lobby.players.filter(
         (item) => item.nickname !== socket.nickname
      );
      socket.leave(socket.lobby);

      if (lobby.started) {
         io.to(socket.lobby).emit(Events.UPDATE_GAME_DATA, lobby);
      } else {
         io.to(socket.lobby).emit(Events.UPDATE_PLAYERS, lobby.players);
      }
   });

   socket.on(Events.GET_PLAYERS, () => {
      if (!hasLobby()) return;

      const lobby = lobbies.get(socket.lobby) as Lobby;

      socket.emit(Events.UPDATE_PLAYERS, lobby.players, socket.lobby);
   });

   socket.on(Events.SET_READINESS, (ready: boolean) => {
      if (!hasLobby()) return;

      const lobby = lobbies.get(socket.lobby) as Lobby;

      lobby.players = lobby.players.map((item) => {
         if (item.id === socket.id) {
            item.ready = ready;
         }
         return item;
      });

      io.to(socket.lobby).emit(Events.UPDATE_PLAYERS, lobby.players);
   });

   socket.on(Events.CHANGE_WORD, (id: string, word: string) => {
      if (!hasLobby()) return;

      const lobby = lobbies.get(socket.lobby) as Lobby;

      lobby.players = lobby.players.map((item) => {
         if (item.id === id) {
            item.word = word;
         }
         return item;
      });

      io.to(socket.lobby).emit(Events.UPDATE_PLAYERS, lobby.players);
   });

   socket.on(Events.START_GAME, () => {
      const lobby = lobbies.get(socket.lobby) as Lobby;

      if (lobby.started) return;

      let everyoneHaveWord = true;

      lobby.players.forEach((item) => {
         if (!item.word.length) everyoneHaveWord = false;
      });

      if (everyoneHaveWord) {
         io.to(socket.lobby).emit(Events.GAME_STARTED);
         lobby.started = true;
         lobby.active = 0;
      } else {
         io.to(socket.lobby).emit('error', 'Każdy musi mieć swoje słowo');
      }
   });

   socket.on(Events.GET_GAME_DATA, () => {
      if (!hasLobby()) return;

      socket.emit(Events.UPDATE_GAME_DATA, lobbies.get(socket.lobby));
   });

   socket.on(Events.GUESS_WORD, (word: string) => {
      if (!hasLobby()) return;

      const lobby = lobbies.get(socket.lobby) as Lobby;
      const active = lobby.active;

      lobby.guessable = false;
      const normalizedWord = normalizeWord(word);
      const normalizedPlayerWord = normalizeWord(lobby.players[active].word);

      if (word && normalizedWord === normalizedPlayerWord) {
         lobby.winners++;
         lobby.players[active].place = lobby.winners;
         lobby.players[active].won = true;
         lobby.players[active].lastGuess = word;

         const doesEverybodyWon = lobby.players.filter(
            (item) => !item.won
         ).length;

         if (doesEverybodyWon === 0) {
            io.to(socket.lobby).emit(Events.UPDATE_GAME_DATA, lobby);
            setTimeout(() => {
               io.to(socket.lobby).emit(Events.GAME_OVER);
            }, 1500);
            return;
         }

         io.to(socket.lobby).emit(Events.WIN, lobby.players[active]);
      } else if (word) {
         lobby.players[active].lastGuess = `${word} źle`;
      } else {
         lobby.players[active].lastGuess = 'pominięto rundę';
      }

      io.to(socket.lobby).emit(Events.UPDATE_GAME_DATA, lobby);

      timeout = setTimeout(() => {
         setNextPlayer(lobby);

         lobby.guessable = true;
         lobby.players[lobby.active].lastGuess = '';

         io.to(socket.lobby).emit(Events.UPDATE_GAME_DATA, lobby);
      }, 1500);
   });

   const hasLobby = () => {
      return socket.lobby && lobbies.has(socket.lobby);
   };

   const normalizeWord = (word: string) => {
      if (!word?.length) return;

      word = word.trim();
      word = removeDiacritics(word);
      word = word.toLowerCase();

      return word;
   };

   const setNextPlayer = (lobby: Lobby) => {
      const lastIndex = lobby.players.length - 1;
      let newActive = lobby.active;

      do {
         if (newActive < lastIndex) newActive++;
         else newActive = 0;
      } while (lobby.players[newActive].won);

      lobby.active = newActive;
   };
});

server.listen(PORT);
