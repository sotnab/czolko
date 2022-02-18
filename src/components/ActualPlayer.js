import { EmojiEvents } from '@mui/icons-material'
import { useEffect, useRef } from 'react'
import logo from '../logo.svg'

let timeout

const ActualPlayer = ({ player, id, winner }) => {
   const slider = useRef(Element)
   const myTurn = player.id === id

   useEffect(() => {
      if (!player.lastGuess.length) return

      slider.current?.animate([
         { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)', offset: 0 },
         { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', offset: 0.05 },
         { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', offset: 0.95 },
         { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)', offset: 1 }
      ], {
         duration: 2000,
         easing: 'ease-in-out'
      })

      timeout = setTimeout(() => {
         winner.setWinner(null)
      }, 2000)

   }, [player.lastGuess])

   useEffect(() => {
      return () => clearTimeout(timeout)
   }, [])

   return (
      <div className="actual">
         <div className="actual_slider" ref={slider}>
            {winner.winner ? (
               <div className="actual_win">
                  <EmojiEvents style={{ fontSize: '2.4rem' }} />
                  <div className="actual_nick">
                     {`${winner.winner.place}. ${winner.winner.nickname}`}
                  </div>
               </div>
            ) : (
               <img src={logo} className="actual_logo" alt="logo" />
            )}
         </div>
         <div className="actual_player">
            <strong className="actual_nick">{player.nickname}</strong>
            <div className="actual_word">{myTurn ? "???" : player.word}</div>
            <div className="actual_guess">
               <strong className="actual_guess-label">
                  <span className="actual_guess-player">{myTurn ? 'Twoje obstawienie: ' : `Obstawienie: `}</span>
               </strong>
               <span className="actual_guess-value">{player.lastGuess.length ? player.lastGuess : '...'}</span>
            </div>
         </div>
      </div>
   )
}

export default ActualPlayer