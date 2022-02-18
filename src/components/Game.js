import Players from './Players'
import Guess from './Guess'
import ActualPlayer from './ActualPlayer'
import { useContext, useEffect, useState } from 'react'
import { SocketContext } from '../App'
import { useNavigate } from 'react-router-dom'

const Game = () => {
   const socket = useContext(SocketContext)
   const nav = useNavigate()
   const [data, setData] = useState({})
   const [winner, setWinner] = useState(null)

   useEffect(() => {
      if (socket.disconnected) {
         nav('/')
         return
      }

      socket.emit('get-game-data')
      socket.on('update-game-data', updateData)
      socket.on('win', (player) => setWinner(player))
      socket.on('game-over', gameOver)
      window.addEventListener('popstate', () => socket.disconnect())

      return () => setData({})
   }, [])

   const updateData = (newData) => {
      if (!newData) {
         nav('/')
         return
      }
      setData(newData)
   }

   const gameOver = () => {
      nav('/results')
   }

   return (
      <div className="content_wrapper">
         {data?.players && (
            <>
               <Players players={data.players} id={socket.id} />
               <ActualPlayer
                  player={data.players[data.active]}
                  winner={{ winner, setWinner }}
                  id={socket.id} />
               <Guess
                  id={socket.id}
                  activeId={data.players[data.active].id}
                  guessable={data.guessable}
               />
            </>
         )}
      </div>
   )
}

export default Game