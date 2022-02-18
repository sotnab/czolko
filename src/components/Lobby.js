import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../App'
import { ContentCopy } from '@mui/icons-material'
import { IconButton } from '@mui/material'

const Lobby = () => {
   const socket = useContext(SocketContext)
   const [players, setPlayers] = useState([])
   const [ready, setReady] = useState(false)
   const [readyPlayers, setReadyPlayers] = useState(0)
   const [code, setCode] = useState(null)
   const [error, setError] = useState('')
   const nav = useNavigate()

   useEffect(() => {
      if (socket.disconnected) {
         nav('/')
         return
      }

      socket.emit('get-players')
      socket.on('update-players', updatePlayers)
      socket.on('game-started', gameStarted)
      socket.on('error', (message) => setError(message))

      window.addEventListener('popstate', () => socket.disconnect())

      return () => setPlayers([])
   }, [])

   useEffect(() => {
      socket.emit('set-readiness', ready)
   }, [ready])

   const updatePlayers = (newPlayers, newCode) => {
      if (!newPlayers) {
         nav('/')
         return
      }
      if (newCode && !code) setCode(newCode)
      const readyPlayersCount = newPlayers.filter((item) => item.ready).length
      setPlayers(newPlayers)
      setReadyPlayers(readyPlayersCount)
   }

   const updatePlayerWord = (e, id) => {
      socket.emit('change-word', id, e.target.value)
   }

   const copyCode = async () => {
      try {
         await navigator.clipboard.writeText(code)
      } catch (err) {
         console.log(err)
      }
   }

   const startGame = () => socket.emit('start-game')

   const gameStarted = () => nav('/game')

   return (
      <div className="lobby">
         <div className="lobby_wrapper">
            <div className="lobby_head">
               <div className="lobby_info">
                  <div className="lobby_badge">Kod:</div>
                  <div>{code}</div>
                  <div className="lobby_copy">
                     <IconButton color='inherit' onClick={copyCode}>
                        <ContentCopy />
                     </IconButton>
                  </div>
               </div>

               <div className="lobby_info">
                  <div className="lobby_badge">Gotowi:</div>
                  <div>{readyPlayers}/{players.length}</div>
               </div>

               <div className="lobby_info">
                  {players.length >= 2 ? (
                     readyPlayers === players.length ?
                        <button className="btn" onClick={startGame}>Start</button>
                        : 'Gra się rozpocznie gdy wszyscy będą gotowi'
                  ) : 'Aby rozpocząć musi być co najmniej 2 graczy'}
               </div>

               {error.length > 0 && <div className="lobby_error">{error}</div>}
            </div>

            <div className="lobby_name">Gracze</div>

            {players.map((item, index) => {
               const isActual = item.id === socket.id

               return (
                  <div className={`lobby_player${isActual ? ' lobby_player--actual' : ''}`} key={index}>
                     <div className="lobby_name lobby_name--player">{item.nickname}</div>
                     {socket.id === item.id ? (
                        <>
                           <button className="btn btn--word" onClick={() => setReady(ready => !ready)}>
                              {item.ready ? 'Brak gotowości' : 'Gotowy'}
                           </button>
                           <div className="lobby_word">Inni gracze wybierają twoje słowo</div>
                        </>
                     ) : (
                        <>
                           <div className="lobby_ready">
                              {item.ready ? 'Gotowy' : 'Brak gotowości'}
                           </div>
                           <input
                              type="text"
                              placeholder="Słowo..."
                              defaultValue={item.word}
                              onChange={(e) => updatePlayerWord(e, item.id)}
                              className="input input--word"
                           />
                        </>
                     )}
                  </div>
               )
            })}
         </div>
      </div>
   )
}

export default Lobby