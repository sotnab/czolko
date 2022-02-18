const express = require('express')
const removeDiacritics = require('diacritics').remove
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const PORT = process.env.PORT || 3231

app.use(express.static(__dirname + '/../../build'))
app.get('*', (req, res) => {
   res.redirect('/')
})

const lobbies = []
let timeout = null

io.on('connection', (socket) => {
   socket.on('create', (nickname) => {
      socket.nickname = nickname
      socket.lobby = socket.id
      lobbies[socket.id] = {
         started: false,
         active: null,
         guessable: true,
         winners: 0,
         players: []
      }
      lobbies[socket.id].players.push({
         nickname,
         id: socket.id,
         word: '',
         ready: false,
         won: false,
         lastGuess: '',
         place: null,
      })
   })



   socket.on('join', (code, nickname, cb) => {
      if (!lobbies[code]) {
         cb(false)
         socket.emit('error', 'Lobby nie istnieje')
         return
      }
      if (lobbies[code].players.filter((item) => item.nickname === nickname).length) {
         cb(false)
         socket.emit('error', 'W lobby jest już gracz o takim nicku')
         return
      }

      socket.nickname = nickname
      socket.lobby = code
      socket.join(code)

      lobbies[socket.lobby].players.push({
         nickname,
         id: socket.id,
         word: '',
         ready: false,
         won: false,
         lastGuess: '',
         place: null,
      })
      io.to(socket.lobby).emit('update-players', lobbies[socket.lobby].players)
      cb(true)
   })



   socket.on('disconnect', () => {
      if (!hasLobby()) return

      if (lobbies[socket.lobby].started) {
         const index = lobbies[socket.lobby].players.findIndex((item) => item.id === socket.id)
         const newLastIndex = lobbies[socket.lobby].players.length - 2
         const active = lobbies[socket.lobby].active

         if (index < active) {
            lobbies[socket.lobby].active = active - 1
         } else if (index === active && active > newLastIndex) {
            lobbies[socket.lobby].active = 0
         }

         if (index <= active && timeout) {
            clearTimeout(timeout)
            lobbies[socket.lobby].guessable = true
         }
      }

      lobbies[socket.lobby].players = lobbies[socket.lobby].players.filter((item) => item.nickname !== socket.nickname)
      socket.leave(socket.lobby)

      if (lobbies[socket.lobby].started) {
         io.to(socket.lobby).emit('update-game-data', lobbies[socket.lobby])
      } else {
         io.to(socket.lobby).emit('update-players', lobbies[socket.lobby].players)
      }
   })



   socket.on('get-players', () => {
      socket.emit('update-players', lobbies[socket.lobby]?.players, socket?.lobby)
   })



   socket.on('set-readiness', (ready) => {
      if (!hasLobby()) return

      lobbies[socket.lobby].players = lobbies[socket.lobby].players.map((item) => {
         if (item.id === socket.id) {
            item.ready = ready
         }
         return item
      })
      io.to(socket.lobby).emit('update-players', lobbies[socket.lobby].players)
   })



   socket.on('change-word', (id, word) => {
      if (!hasLobby()) return

      lobbies[socket.lobby].players = lobbies[socket.lobby].players.map((item) => {
         if (item.id === id) {
            item.word = word
         }
         return item
      })
      io.to(socket.lobby).emit('update-players', lobbies[socket.lobby].players)
   })



   socket.on('start-game', () => {
      if (lobbies[socket.lobby].started) return

      let everyoneHaveWord = true

      lobbies[socket.lobby].players.forEach((item) => {
         if (!item.word.length) everyoneHaveWord = false
      })

      if (everyoneHaveWord) {
         io.to(socket.lobby).emit('game-started')
         lobbies[socket.lobby].started = true
         lobbies[socket.lobby].active = 0
      } else {
         io.to(socket.lobby).emit('error', 'Każdy musi mieć swoje słowo')
      }
   })



   socket.on('get-game-data', () => {
      socket.emit('update-game-data', lobbies[socket.lobby])
   })



   socket.on('guess-word', (word) => {
      const active = lobbies[socket.lobby].active

      lobbies[socket.lobby].guessable = false
      const normalizedWord = normalizeWord(word)
      const normalizedPlayerWord = lobbies[socket.lobby].players[active].word

      if (word && normalizedWord === normalizedPlayerWord) {
         lobbies[socket.lobby].winners++
         lobbies[socket.lobby].players[active].place = lobbies[socket.lobby].winners
         lobbies[socket.lobby].players[active].won = true
         lobbies[socket.lobby].players[active].lastGuess = word

         const doEverybodyWon = lobbies[socket.lobby].players.filter((item) => !item.won).length

         if (doEverybodyWon === 0) {
            io.to(socket.lobby).emit('update-game-data', lobbies[socket.lobby])
            setTimeout(() => {
               io.to(socket.lobby).emit('game-over')
            }, 1500)
            return
         }

         io.to(socket.lobby).emit('win', lobbies[socket.lobby].players[active])
      } else if (word) {
         lobbies[socket.lobby].players[active].lastGuess = `${word} źle`
      } else {
         lobbies[socket.lobby].players[active].lastGuess = 'pominięto rundę'
      }

      io.to(socket.lobby).emit('update-game-data', lobbies[socket.lobby])

      timeout = setTimeout(() => {
         const lastIndex = lobbies[socket.lobby].players.length - 1
         const active = lobbies[socket.lobby].active

         let newActive = active
         do {
            newActive = newActive < lastIndex ? newActive + 1 : 0
         } while (lobbies[socket.lobby].players[newActive].won)

         lobbies[socket.lobby].active = newActive

         lobbies[socket.lobby].guessable = true
         lobbies[socket.lobby].players[active].lastGuess = ''

         io.to(socket.lobby).emit('update-game-data', lobbies[socket.lobby])
      }, 1500)
   })



   const hasLobby = () => {
      if (socket.lobby) return true
      return false
   }



   const normalizeWord = (word) => {
      if (!word) return null

      word = word.trim()
      word = removeDiacritics(word)
      word = word.toLowerCase()

      return word
   }
})

server.listen(PORT)