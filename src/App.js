import CreateLobby from './components/CreateLobby'
import Game from './components/Game';
import Lobby from './components/Lobby'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import { createContext } from 'react';
import logo from './logo.svg'
import Results from './components/Results';

const socket = io('https://czolko-server.vercel.app')
export const SocketContext = createContext(socket)
const App = () => {

  return (
    <Router>
      <div className="App">
        <div className="wrapper">
          <header className="header">
            <h1 className="header_title">
              <img src={logo} className="header_logo" alt="logo" />
            </h1>
          </header>

          <main className="content">
            <SocketContext.Provider value={socket}>
              <Routes>
                <Route exact path='/' element={<CreateLobby />} />
                <Route path='/lobby' element={<Lobby />} />
                <Route path='/game' element={<Game />} />
                <Route path='/results' element={<Results />} />
              </Routes>
            </SocketContext.Provider>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App
