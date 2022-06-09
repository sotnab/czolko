import Player from './Player.js';

class Lobby {
   public started: boolean;
   public active: number;
   public guessable: boolean;
   public winners: number;
   public players: Player[];

   constructor() {
      this.started = false;
      this.active = 0;
      this.guessable = true;
      this.winners = 0;
      this.players = [];
   }
}

export default Lobby;
