import { EmojiEvents } from '@mui/icons-material'

const Players = ({ players, id }) => {
   return (
      <div className="game">
         <h3 className="section-title section-title--margin">Lobby</h3>
         <div className="game_wrapper">
            {players.map((item, index) => {
               const isActual = item.id === id

               return (
                  <div className={`game_player${isActual ? ' game_player--actual' : ''}`} key={index}>
                     {(isActual || item.won) && (
                        <div className="game_badges">
                           {isActual && <div className="game_badge">You</div>}
                           {item.won && (
                              <div className="game_badge game_badge--won">
                                 <EmojiEvents fontSize='12px' />
                                 {item.place && item.place}
                              </div>
                           )}
                        </div>
                     )}
                     <div className="game_nick">{item.nickname}</div>
                     {item.id === id ?
                        <div className="game_word game_word--disabled">???</div>
                        : <div className="game_word">{item.word}</div>
                     }
                  </div>
               )
            })}
         </div>
      </div>
   )
}

export default Players