class Player {
   public word: string;
   public ready: boolean;
   public won: boolean;
   public lastGuess: string;
   public place: number | null;

   constructor(public nickname: string, public id: string) {
      this.word = '';
      this.ready = false;
      this.won = false;
      this.lastGuess = '';
      this.place = null;
   }
}

export default Player;
