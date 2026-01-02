import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // <--- 1. IMPORT REDUX
import { ArrowLeft, Users, Lock, Globe, Swords, Zap, Shield } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { doc, setDoc } from 'firebase/firestore'; 

// Components
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/UI/Button';
import TextInput from '../components/UI/TextInput';

// Utils & Config
import { db } from '../firebase/firebaseConfig';
import { lobbyClient } from '../client/lobbyClient';
import { getCurrentUser } from '../utils/getUser';
import { enterMatch } from '../store/slices/lobbySlice'; // <--- 2. IMPORT AZIONE

const CreateMatchPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // <--- 3. HOOK
  
  // --- STATI DEL FORM ---
  const [matchName, setMatchName] = useState('');
  const [playersMax, setPlayersMax] = useState(3);
  const [gameMode, setGameMode] = useState('classica');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUser = getCurrentUser();

  // --- LOGICA DI CREAZIONE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        // 1. CREA SU SERVER BOARDGAME.IO (RAM)
        const { matchID } = await lobbyClient.createMatch('risk', {
            numPlayers: playersMax,
            setupData: { mode: gameMode }
        });

        // 2. GESTIONE PASSWORD
        let finalPassword = null;
        if (isPrivate && password) {
            const salt = bcrypt.genSaltSync(10);
            finalPassword = bcrypt.hashSync(password, salt);
        }

        // 3. SCRIVI SU FIREBASE (PERSISTENZA)
        // Nota: Qui definisci l'Host come player "0"
        await setDoc(doc(db, 'matches', matchID), {
            matchID: matchID,
            name: matchName,
            players: [{
                id: "0", 
                name: currentUser.name, 
                avatar: currentUser.avatar
            }],
            playersMax: playersMax,
            createdAt: new Date().toISOString(),
            gameover: false,
            status: 'OPEN',
            mode: gameMode,
            isPrivate: isPrivate,
            password: finalPassword 
        });

        console.log(`Partita ${matchID} creata e sincronizzata.`);

        // 4. JOIN AUTOMATICO (Ottieni credenziali Boardgame.io)
        const { playerCredentials } = await lobbyClient.joinMatch('risk', matchID, {
            playerID: "0",
            playerName: currentUser.name,
        });

        // 5. AGGIORNA REDUX (Importante!)
        dispatch(enterMatch(matchID)); // <--- 4. DISPATCH AZIONE

        // 6. VAI AL GIOCO
        navigate(`/game/${matchID}`, { 
            state: { 
                playerID: "0", 
                credentials: playerCredentials 
            } 
        });

    } catch (error) {
        console.error("Errore creazione partita:", error);
        alert("Errore durante la creazione. Assicurati che il server di gioco (porta 8000) sia attivo.");
        setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-[#173C55] font-roboto text-white overflow-y-auto">
      
      {/* NAVBAR */}
      <Navbar mode="lobby" user={currentUser} />

      {/* LAYOUT */}
      <div className="flex w-full max-w-[1920px] mx-auto pt-[120px] px-6 xl:px-12 pb-10 gap-8 items-start min-h-[calc(100vh-120px)]">

        {/* COLONNA SX */}
        <aside className="hidden lg:flex flex-col w-[20%] shrink-0">
          <Button 
             variant="secondary" 
             onClick={() => navigate('/')}
             className="flex items-center gap-2 self-start px-4 py-2 bg-[#1B2227] hover:bg-[#2A3439] border border-gray-600 text-black text-sm font-bold shadow-md"
          >
             <ArrowLeft size={18} />
             TORNA ALLA LOBBY
          </Button>
        </aside>

        {/* COLONNA CENTRALE */}
        <main className="flex-1 w-full lg:w-[60%] flex justify-center">
            
          <div className="w-full max-w-3xl bg-[#1B2227] rounded-xl shadow-[0px_4px_4px_rgba(0,0,0,0.25)] p-8 border border-gray-700/50">
            
            <h1 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white border-b border-gray-600 pb-4">
               <Swords className="text-[#38C7D7]" size={28} />
               CREA NUOVA PARTITA
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* INPUT VARI (Nome, Slider, Mode, Password...) - invariati */}
              <div className="space-y-2">
                 <label className="text-gray-400 font-bold text-xs uppercase tracking-wider">Nome Tavolo</label>
                 <TextInput 
                    variant="light"
                    value={matchName}
                    onChange={(e) => setMatchName(e.target.value)}
                    placeholder="Es. La Resa dei Conti"
                    required
                 />
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <label className="text-gray-400 font-bold text-xs uppercase tracking-wider">Giocatori Max</label>
                    <span className="text-xl font-bold text-[#38C7D7]">{playersMax}</span>
                 </div>
                 <div className="flex items-center gap-4 bg-[#2A3439] p-3 rounded-lg border border-transparent hover:border-gray-600 transition-colors">
                    <Users size={20} className="text-gray-400"/>
                    <input 
                      type="range" 
                      min="3" 
                      max="6" 
                      step="1"
                      value={playersMax}
                      onChange={(e) => setPlayersMax(Number(e.target.value))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#38C7D7]"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-gray-400 font-bold text-xs uppercase tracking-wider">Modalità</label>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setGameMode('classica')}
                      className={`cursor-pointer p-3 rounded-lg border-2 flex items-center gap-3 transition-all
                        ${gameMode === 'classica' ? 'border-[#38C7D7] bg-[#38C7D7]/10' : 'border-gray-600 bg-[#2A3439] hover:border-gray-500'}`}
                    >
                        <Shield className={gameMode === 'classica' ? "text-[#38C7D7]" : "text-gray-500"} size={24}/>
                        <div>
                           <div className="font-bold text-sm text-white">CLASSICA</div>
                           <div className="text-[11px] text-gray-400">Obiettivi segreti</div>
                        </div>
                    </div>

                    <div 
                      onClick={() => setGameMode('veloce')}
                      className={`cursor-pointer p-3 rounded-lg border-2 flex items-center gap-3 transition-all
                        ${gameMode === 'veloce' ? 'border-[#EAB308] bg-[#EAB308]/10' : 'border-gray-600 bg-[#2A3439] hover:border-gray-500'}`}
                    >
                        <Zap className={gameMode === 'veloce' ? "text-[#EAB308]" : "text-gray-500"} size={24}/>
                        <div>
                           <div className="font-bold text-sm text-white">VELOCE</div>
                           <div className="text-[11px] text-gray-400">Conquista rapida</div>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-gray-400 font-bold text-xs uppercase tracking-wider">Accesso</label>
                 <div className="flex bg-[#2A3439] p-1 rounded-lg border border-gray-600 h-[40px]">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`flex-1 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all 
                        ${!isPrivate ? 'bg-[#38C7D7] text-[#173C55] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Globe size={14} /> PUBBLICA
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`flex-1 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all 
                        ${isPrivate ? 'bg-[#EAB308] text-[#173C55] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Lock size={14} /> PRIVATA
                    </button>
                 </div>
              </div>

              {isPrivate && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[#EAB308] font-bold text-xs uppercase flex items-center gap-2">
                       Password Richiesta
                    </label>
                    <TextInput 
                       variant="light"
                       type="text"
                       icon={Lock}
                       placeholder="Inserisci la password..."
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="border-2 border-transparent focus-within:border-[#EAB308]/50 rounded-[15px]" 
                    />
                 </div>
              )}

              <div className="pt-6 border-t border-gray-600">
                  <Button 
                    type="submit" 
                    variant="yellow" 
                    size="lg"
                    className="w-full py-4 text-lg shadow-lg uppercase tracking-widest font-black hover:scale-[1.01] transition-transform"
                    disabled={loading}
                  >
                     {loading ? "CREAZIONE IN CORSO..." : "CREA PARTITA"}
                  </Button>
              </div>

            </form>
          </div>
        </main>

        <aside className="hidden lg:block w-[20%] shrink-0"></aside>
      </div>
    </div>
  );
};

export default CreateMatchPage;