import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../App'

const CreateLobby = () => {
   const [code, setCode] = useState('')
   const [nickname, setNickname] = useState('')
   const [error, setError] = useState('')
   const socket = useContext(SocketContext)
   const nav = useNavigate()

   useEffect(() => {
      // if (socket.disconnected) socket.connect()

      socket.on('error', (message) => {
         setError(message)
      })

      return () => {
         setCode('')
         setNickname('')
      }
   }, [])


   const handleCreate = () => {
      if (!isNickPassed()) return

      socket.emit('create', nickname)
      nav('lobby')
   }

   const handleJoin = (e) => {
      e.preventDefault()
      if (!isNickPassed() || !isCodePassed()) return

      socket.emit('join', code, nickname, (status) => {
         if (status) nav('lobby')
      })
   }

   const isNickPassed = () => {
      if (!nickname.length) {
         setError('Podaj nick')
         return false
      }
      return true
   }

   const isCodePassed = () => {
      if (!code.length) {
         setError('Podaj kod')
         return false
      }
      return true
   }

   return (
      <>
         <div className="create">
            <h2 className="create_title">Dołącz lub Utwórz Lobby</h2>
            <button className="btn btn--create" onClick={handleCreate}>Utwórz lobby</button>
            <input
               type="text"
               className="input input--nick"
               value={nickname}
               onChange={(e) => setNickname(e.target.value)}
               placeholder="Nick..."
            />
            <form className="create_join" onSubmit={handleJoin}>
               <input
                  type="text"
                  className="input input--join"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Kod lobby..."
               />
               <button className="btn btn--join">Dołącz</button>
            </form>
            {error.length > 1 && <h3 className="create_error">{error}</h3>}
         </div>
      </>
   )
}

export default CreateLobby