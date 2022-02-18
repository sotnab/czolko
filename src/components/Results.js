import { EmojiEvents } from '@mui/icons-material'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../App'

const Results = () => {
   const [players, setPlayers] = useState([])
   const socket = useContext(SocketContext)
   const nav = useNavigate()

   useEffect(() => {
      if (socket.disconnected) {
         nav('/')
         return
      }

      socket.emit('get-players')
      socket.on('update-players', updatePlayers)
   }, [])

   const updatePlayers = (newPlayers, code) => {
      if (players.length) return

      newPlayers.sort((first, second) => first.place - second.place)
      setPlayers(newPlayers)
   }

   const navToLobby = () => {
      socket.disconnect()
      nav('/')
   }

   return (
      <div className="results">
         <button className="results_link" onClick={navToLobby}>Wróć na stronę główną</button>
         <div className="results_podium">
            {players.length >= 3 && (
               <div className="results_stand results_stand--third">
                  <div className="results_place">3</div>
                  <EmojiEvents style={{ fontSize: '60px' }} />
                  <div className="results_name">{players[2].nickname}</div>
               </div>
            )}
            {players.length >= 1 && (
               <div className="results_stand results_stand--first">
                  <div className="results_place">1</div>
                  <EmojiEvents style={{ fontSize: '180px' }} />
                  <div className="results_name">{players[0].nickname}</div>
               </div>
            )}
            {players.length >= 2 && (
               <div className="results_stand results_stand--second">
                  <div className="results_place">2</div>
                  <EmojiEvents style={{ fontSize: '100px' }} />
                  <div className="results_name">{players[1].nickname}</div>
               </div>
            )}
         </div>
         {players.length > 3 && (
            <div className="results_rest">
               {players.slice(3).map((item, index) => (
                  <div className="results_item" key={index}>
                     {`${item.place}. ${item.nickname}`}
                  </div>
               ))}
            </div>
         )}
      </div>
   )
}

export default Results