import { useContext, useState } from 'react'
import { HourglassTop } from '@mui/icons-material';
import { SocketContext } from '../App';

const Guess = ({ id, activeId, guessable }) => {
   const socket = useContext(SocketContext)
   const [word, setWord] = useState('')
   const cantGuess = (id !== activeId || !guessable)

   const handleSubmit = (event) => {
      event.preventDefault()
      socket.emit('guess-word', word)
   }

   const skipTurn = () => {
      socket.emit('guess-word', null)
   }

   return (
      <div className={`guess${cantGuess ? ' guess--disabled' : ''}`}>
         <h4 className="guess_title">Odgadnij lub pomiń</h4>
         <form className="guess_form" onSubmit={handleSubmit}>
            <input
               type="text"
               className="guess_input"
               value={word}
               onChange={(e) => setWord(e.target.value)}
               placeholder="Pablo..."
               disabled={cantGuess}
            />
         </form>
         <button
            className="btn btn--skip"
            onClick={skipTurn}
            disabled={cantGuess}
         >Pomiń</button>
         <div className="guess_disabled">
            <HourglassTop />
            Czekaj Na swoją rundę
         </div>
      </div>
   )
}

export default Guess