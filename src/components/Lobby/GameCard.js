import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { enterMatch } from '../../store/slices/lobbySlice';
import { getCurrentUser } from '../../utils/getUser';
import { lobbyClient } from '../../client/lobbyClient'; // Import fondamentale per le credenziali
import auth from '../../firebase/auth';

const GameCard = ({ match }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const firebaseUser = auth.currentUser; // Ottieni l'utente Firebase autenticato

  // 1. Destrutturazione Dati
  const { id, name, players, playersMax, image, isPrivate, password } = match; 

  // 2. Calcoli UI
  const currentCount = players ? players.length : 0;
  const maxCount = playersMax || 6;
  const isFull = currentCount >= maxCount;

  // --- LOGICA DI JOIN ---
  const handleJoin = async () => {
    // 1. Rientro Veloce
    const existingPlayer = (players || []).find(p => p.name === currentUser.name);
    if (existingPlayer) {
        console.log("Rientro in partita...");
        dispatch(enterMatch(id));
        navigate(`/game/${id}`, { state: { playerID: existingPlayer.id } });
        return;
    }

    // 2. Controlli Base
    if (isFull) { alert("Partita piena!"); return; }
    if (isPrivate && password) {
        const inputPwd = prompt("🔒 Password:");
        if (!inputPwd || !bcrypt.compareSync(inputPwd, password)) {
            alert("Password errata!"); return;
        }
    }

    // 3. CALCOLO POSTO (Logica Pulita)
    // Ci fidiamo che Firestore contenga ID validi ("0", "1", "2") grazie all'Adapter.
    const takenSeats = (players || []).map(p => String(p.id));
    let mySeatID = null;
    
    for (let i = 0; i < maxCount; i++) {
        if (!takenSeats.includes(String(i))) {
            mySeatID = String(i);
            break;
        }
    }

    if (mySeatID === null) {
        alert("Errore: Nessun posto libero.");
        return;
    }

    try {
        // 4. Join al Server
        const { playerCredentials } = await lobbyClient.joinMatch('risk', id, {
            playerID: mySeatID,
            playerName: currentUser.name,
            data: { 
                avatar: currentUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + currentUser.name 
            }
        });

        dispatch(enterMatch(id)); 
        navigate(`/game/${id}`, { 
            state: { playerID: mySeatID, credentials: playerCredentials } 
        });

    } catch (error) {
        console.error("Join Error:", error);
        alert(error.message.includes("409") ? "Posto già occupato." : error.message);
    }
  };

  // --- RENDER GRAFICO (STILE ORIGINALE) ---
  return (
    <div className="relative w-full h-auto min-h-[103px] bg-[#1B2227] rounded-[8px] shadow-[0px_4px_10px_rgba(0,0,0,0.3)] p-4 flex flex-col md:flex-row items-center justify-between transition hover:bg-[#232c33] gap-4 md:gap-0">
      
      {/* Lato Sinistro: Immagine e Info */}
      <div className="flex items-center gap-5 w-full md:w-auto">
        
        {/* Immagine Partita */}
        <div className="relative w-[72px] h-[72px] shrink-0">
            <img 
              src={image || "https://api.dicebear.com/7.x/shapes/svg?seed=" + id} 
              alt="Game" 
              className="w-full h-full rounded-full object-cover border-4 border-[#F00A0A]" 
            />
             {/* Icona lucchetto se privata */}
             {isPrivate && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 border border-[#1B2227]">
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                </div>
             )}
        </div>

        <div className="flex flex-col gap-1">
          {/* Nome Partita */}
          <h3 className="font-roboto font-bold text-[24px] text-white tracking-[0.2px] leading-tight">
            {name || `PARTITA ${id}`}
          </h3>
          
          {/* Riga Player / Avversari */}
          <div className="flex items-center gap-3 mt-1">
            
            {/* Avatar sovrapposti (Stile che ti piaceva) */}
            <div className="flex -space-x-2">
               {(players || []).map((p, index) => (
                 <img 
                   key={p.id || index} 
                   src={p.avatar} 
                   alt={p.name}
                   title={p.name}
                   // Bordo Giallo per Host (index 0), Verde per gli altri
                   className={`w-[24px] h-[24px] rounded-full border-2 ${index === 0 ? 'border-[#FEC417]' : 'border-[#27CA40]'} bg-gray-500 object-cover`}
                 />
               ))}
               {/* Pallini vuoti per i posti liberi */}
               {Array.from({ length: Math.max(0, maxCount - currentCount) }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-[24px] h-[24px] rounded-full border-2 border-[#979797] bg-gray-600/50"></div>
               ))}
            </div>
            
            {/* Counter Giocatori */}
            <span className="font-roboto font-bold text-[16px] text-[#D9D9D9]">
              {currentCount}/{maxCount}
            </span>
          </div>
        </div>
      </div>

      {/* Lato Destro: ID e Bottone */}
      <div className="flex flex-row items-center gap-4 w-full md:w-auto justify-end">
        
        {/* ID Partita (Visibile su desktop) */}
        <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[#D8D8D8] font-bold text-[16px]">#{id}</span>
            <div className="w-6 border-t-2 border-[#D8D8D8] mt-1 opacity-60"></div>
        </div>

        {/* Bottone Partecipa (Vecchio stile con icona SVG) */}
        <button 
          className={`
            bg-[#38C7D7] hover:bg-[#2dbdc0] text-[#192832] font-roboto font-bold text-[20px] px-8 py-2 rounded-[25px] flex items-center gap-2 shadow-md transition-transform active:scale-95
            ${isFull ? 'opacity-50 cursor-not-allowed filter grayscale' : ''}
          `}
          onClick={handleJoin} 
          disabled={isFull}
        >
          {isFull ? 'PIENA' : (isPrivate ? 'PASSWORD' : 'PARTECIPA')}
          
          {/* Icona Freccia Originale */}
          {!isFull && (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
               <line x1="5" y1="12" x2="19" y2="12"></line>
               <polyline points="12 5 19 12 12 19"></polyline>
             </svg>
          )}
        </button>
      </div>

    </div>
  );
};

export default GameCard;