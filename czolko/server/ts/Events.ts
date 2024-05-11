enum Events {
   CONNECTION = 'connection',
   DISCONNECT = 'disconnect',

   CREATE = 'create',
   JOIN = 'join',
   JOINED = 'joined',

   GET_PLAYERS = 'get-players',
   GET_GAME_DATA = 'get-game-data',

   UPDATE_PLAYERS = 'update-players',
   UPDATE_GAME_DATA = 'update-game-data',

   SET_READINESS = 'set-readiness',
   CHANGE_WORD = 'change-word',
   GUESS_WORD = 'guess-word',
   START_GAME = 'start-game',
   GAME_STARTED = 'game-started',
   GAME_OVER = 'game-over',
   WIN = 'win',
}

export default Events;
