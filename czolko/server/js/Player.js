"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Player {
    constructor(nickname, id) {
        this.nickname = nickname;
        this.id = id;
        this.word = '';
        this.ready = false;
        this.won = false;
        this.lastGuess = '';
        this.place = null;
    }
}
exports.default = Player;
