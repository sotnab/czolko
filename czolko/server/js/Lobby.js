"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Lobby {
    constructor() {
        this.started = false;
        this.active = 0;
        this.guessable = true;
        this.winners = 0;
        this.players = [];
    }
}
exports.default = Lobby;
