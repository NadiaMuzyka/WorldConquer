import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { enterMatch } from '../../store/slices/lobbySlice';
import { getCurrentUser } from '../../utils/getUser';
import { lobbyClient } from '../../client/lobbyClient';
import Button from '../UI/Button';
import { FULL_MATCH_ICON, ARROW_RIGHT_ICON } from '../Constants/icons';

const GameCard = ({ match }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // 1. Destrutturazione
  const { id, name, players, playersMax, image, isPrivate, password } = match;

  // 2. UI Utils
  const currentCount = players ? players.length : 0;
  const maxCount = playersMax || 6;
  const isFull = currentCount >= maxCount;

  // --- LOGICA DI JOIN ---
  const handleJoin = async () => {

    // A. Rientro veloce (Sei già in partita?)
    const existingPlayer = (players || []).find(p => p.name === currentUser.name);
    if (existingPlayer) {
      console.log("Giocatore già presente, rientro...");
      dispatch(enterMatch(id));
      // Se Firestore ha un ID valido usiamo quello, altrimenti proviamo a indovinare o navigare
      const resumeID = existingPlayer.id && existingPlayer.id !== "unknown" ? existingPlayer.id : null;

      // Se resumeID è nullo, boardgame.io potrebbe avere problemi, ma proviamo cmq a navigare
      navigate(`/game/${id}`, { state: { playerID: resumeID } });
      return;
    }

    // B. Controlli
    if (isFull) { alert("La partita è piena!"); return; }
    if (isPrivate && password) {
      const inputPwd = prompt("🔒 Password:");
      if (!inputPwd || !bcrypt.compareSync(inputPwd, password)) {
        alert("❌ Password errata!"); return;
      }
    }

    // C. CALCOLO POSTO LIBERO (ANTI-CONFLICT FIX)
    // ---------------------------------------------------------
    const takenSeats = (players || []).map(p => String(p.id));

    // Se troviamo "unknown", "host" o undefined, significa che l'Host (Player 0) 
    // è stato salvato male su Firestore. In tal caso, consideriamo il posto "0" BLOCCATO.
    const isHostDataDirty = takenSeats.some(sid => sid === "unknown" || sid === "host" || sid === "undefined");

    console.log(`[JOIN DEBUG] Posti presi: ${takenSeats} | Dati sporchi? ${isHostDataDirty}`);

    let mySeatID = null;

    for (let i = 0; i < maxCount; i++) {
      const candidate = String(i);

      // È occupato se: 
      // 1. L'ID è esplicitamente nella lista
      // 2. OPPURE stiamo puntando allo "0" e sappiamo che i dati dell'Host sono sporchi
      const isTaken = takenSeats.includes(candidate);
      const isBlockedZero = (candidate === "0" && isHostDataDirty);

      if (!isTaken && !isBlockedZero) {
        mySeatID = candidate;
        break; // Trovato!
      }
    }
    // ---------------------------------------------------------

    if (mySeatID === null) {
      alert("Errore: Nessun posto libero trovato (Tutti occupati o bloccati).");
      return;
    }

    console.log("Tentativo Join sul posto:", mySeatID);

    try {
      // D. Chiamata al Server
      const { playerCredentials } = await lobbyClient.joinMatch('risk', id, {
        playerID: mySeatID,
        playerName: currentUser.name,
        data: {
          avatar: currentUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + currentUser.name
        }
      });

      // E. Successo
      dispatch(enterMatch(id));
      navigate(`/game/${id}`, {
        state: {
          playerID: mySeatID,
          credentials: playerCredentials
        }
      });

    } catch (error) {
      console.error("Errore Join:", error);
      // Messaggio più chiaro per l'utente
      if (error.message.includes("409")) {
        alert("Errore di sincronizzazione: Il posto sembrava libero ma non lo è. Riprova tra un istante.");
      } else {
        alert("Impossibile entrare: " + error.message);
      }
    }
  };

  // --- RENDER (Uguale a prima) ---
  return (
    <div className="relative w-full h-auto min-h-[103px] bg-[#1B2227] rounded-[8px] shadow-[0px_4px_10px_rgba(0,0,0,0.3)] p-4 flex flex-col md:flex-row items-center justify-between transition hover:bg-[#232c33] gap-4 md:gap-0">
      <div className="flex items-center gap-5 w-full md:w-auto">

        <div className="relative w-[72px] h-[72px] shrink-0">
          {/*Mostro immagine della partita */}
          <img
            src={image || "https://api.dicebear.com/7.x/shapes/svg?seed=" + id}
            alt="Game"
            className="w-full h-full rounded-full object-cover border-4 border-[#F00A0A]"
          />
          {/*Mostro lucchetto */}
          {isPrivate && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 border border-[#1B2227]">
              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">

          {/* Mostra id partita */}
          <div className="flex items-center gap-2">
            <h3 className="font-roboto font-bold text-[24px] text-white tracking-[0.2px] leading-tight">
              {name || `PARTITA ${id}`}
            </h3>
            <span className="text-gray-500 text-sm font-medium">#{id}</span>
          </div>

          {/* Giocatori: Avatar + Contatore */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex -space-x-2">
              {(players || []).map((p, index) => (
                <img
                  key={p.id || index}
                  src={p.avatar}
                  alt={p.name}
                  title={p.name}
                  className={`w-[24px] h-[24px] rounded-full border-2 ${index === 0 ? 'border-[#FEC417]' : 'border-[#27CA40]'} bg-gray-500 object-cover`}
                />
              ))}
              {Array.from({ length: Math.max(0, maxCount - currentCount) }).map((_, i) => (
                <div key={`empty-${i}`} className="w-[24px] h-[24px] rounded-full border-2 border-[#979797] bg-gray-600/50"></div>
              ))}
            </div>

            <span className="font-roboto font-bold text-[16px] text-[#D9D9D9]">
              {currentCount}/{maxCount}
            </span>
          </div>
        </div>
      </div>
      

      {/* Bottone per partecipare */}
      <div className="flex flex-row items-center gap-4 w-full md:w-auto justify-end">
        <Button
          variant="cyan"
          size="md"
          onClick={handleJoin}
          disabled={isFull}
          className={`gap-2 min-w-[140px] ${isFull ? 'filter grayscale' : ''}`}
        >
          {isFull ? (
            <>
              Piena {FULL_MATCH_ICON}
            </>
          ) : (
            <>
              {isPrivate ? 'Password' : 'Partecipa'}
              {ARROW_RIGHT_ICON}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GameCard;