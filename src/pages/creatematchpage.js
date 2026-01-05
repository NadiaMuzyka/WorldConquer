import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, Users, Lock, Globe, Swords, Zap, Shield } from 'lucide-react';
import bcrypt from 'bcryptjs';
// import { doc, setDoc } from 'firebase/firestore'; 

// Components
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/UI/Button';
import TextInput from '../components/UI/Input/TextInput';
import PasswordInput from '../components/UI/Input/PasswordInput';
import RangeInput from '../components/UI/Input/RangeInput';
import SelectableCard from '../components/UI/Input/SelectableCard';
import { INPUT_LABEL_STYLES } from '../components/UI/Input/inputStyles';
import PageContainer from '../components/UI/PageContainer';
import Form from '../components/UI/Form';

// Utils & Config
import { db } from '../firebase/firebaseConfig';
import { lobbyClient } from '../client/lobbyClient';
import { getCurrentUser } from '../utils/getUser';
import { auth } from '../firebase/firebaseConfig';
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
   const firebaseUser = auth.currentUser;

   // --- LOGICA DI CREAZIONE ---
   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
         // 1. PREPARA I DATI PER IL SERVER
         // Passiamo tutto ciò che serve a Firestore dentro 'setupData'
         const matchData = {
            matchName,
            playersMax,
            mode: gameMode,
            isPrivate,
            password: isPrivate ? password : null,
            hostId: currentUser.id,
            hostName: currentUser.name,
            hostAvatar: currentUser.avatar
         };

         // 2. CHIAMA IL SERVER (Lui creerà RTDB e Firestore)
         const { matchID } = await lobbyClient.createMatch('risk', {
            numPlayers: playersMax,
            setupData: matchData
         });

         console.log(`Partita ${matchID} creata dal server.`);

         // 3. JOIN AUTOMATICO
         // Importante: Passiamo 'avatar' dentro 'data' perché boardgame.io salva 'name' e 'data'
         const { playerCredentials } = await lobbyClient.joinMatch('risk', matchID, {
            playerID: "0",
            playerName: currentUser.name,
            data: { avatar: currentUser.avatar }
         });

         // 4. REDUX E NAVIGAZIONE 
         dispatch(enterMatch(matchID)); // salvo nello stato id della partita in cui mi trovo
         //navigo alla partita con playerID 0
         navigate(`/game/${matchID}`, {
            state: {
               playerID: "0",
               credentials: playerCredentials
            }
         });

      } catch (error) {
         console.error("Errore creazione:", error);
         alert("Impossibile contattare il server (porta 8000).");
         setLoading(false);
      }
   };


   return (
      <PageContainer className="font-roboto text-white">

         {/* NAVBAR */}
         <Navbar mode="lobby" user={currentUser} />

         {/* LAYOUT */}
         <div className="flex w-full max-w-[1920px] mx-auto pt-[120px] px-6 xl:px-12 pb-10 gap-8 items-start min-h-[calc(100vh-120px)]">

            {/* COLONNA SX */}
            <aside className="hidden lg:flex flex-col w-[20%] shrink-0 items-end">
               <Button
                  variant="secondary"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1B2227] hover:bg-[#2A3439] border border-gray-600 text-[#173C55] text-sm font-bold shadow-md"
               >
                  <ArrowLeft size={18} />
                  Lobby
               </Button>
            </aside>

            {/* COLONNA CENTRALE */}
            <main className="flex-1 w-full lg:w-[60%] flex justify-center">

               <Form 
                  onSubmit={handleSubmit}
                  title="Crea Nuova Partita"
                  maxWidth="md"
                  className="w-full max-w-3xl"
               >

                  <div className="space-y-6">

                     {/* INPUT VARI (Nome, Slider, Mode, Password...) - invariati */}
                     <TextInput
                        label="Nome Tavolo"
                        variant="light"
                        value={matchName}
                        onChange={(e) => setMatchName(e.target.value)}
                        placeholder="Es. La Resa dei Conti"
                        required
                     />

                     <RangeInput
                        label="Giocatori Max"
                        value={playersMax}
                        onChange={(e) => setPlayersMax(parseInt(e.target.value))}
                        min={3}
                        max={6}
                        icon={Users}
                        displayValue={playersMax}
                     />

                     <div>
                        <label className={INPUT_LABEL_STYLES}>Modalità</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <SelectableCard
                              label="Classica"
                              description="Obiettivi segreti"
                              icon={Shield}
                              selected={gameMode === 'classica'}
                              onClick={() => setGameMode('classica')}
                              activeColor="#38C7D7"
                           />

                           <SelectableCard
                              label="Veloce"
                              description="Conquista rapida"
                              icon={Zap}
                              selected={gameMode === 'veloce'}
                              onClick={() => setGameMode('veloce')}
                              activeColor="#EAB308"
                           />
                        </div>
                     </div>

                     <div>
                        <label className={INPUT_LABEL_STYLES}>Accesso</label>
                        <div className="flex bg-[#2A3439] p-1 rounded-lg border border-gray-600 h-[40px]">
                           <button
                              type="button"
                              onClick={() => setIsPrivate(false)}
                              className={`flex-1 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all 
                        ${!isPrivate ? 'bg-[#38C7D7] text-[#173C55] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                           >
                              <Globe size={14} /> Pubblica
                           </button>
                           <button
                              type="button"
                              onClick={() => setIsPrivate(true)}
                              className={`flex-1 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all 
                        ${isPrivate ? 'bg-[#EAB308] text-[#173C55] shadow-sm' : 'text-gray-400 hover:text-white'}`}
                           >
                              <Lock size={14} /> Privata
                           </button>
                        </div>
                     </div>

                     {isPrivate && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                           <PasswordInput
                              label="Password Richiesta"
                              placeholder="Inserisci la password..."
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              defaultVisible={true}
                           />
                        </div>
                     )}

                     <div className="pt-4">
                        <Button
                           type="submit"
                           variant="yellow"
                           size="lg"
                           className="w-full py-4 text-lg shadow-lg font-bold hover:scale-[1.01] transition-transform"
                           disabled={loading}
                        >
                           {loading ? "Creazione in corso..." : "Crea Partita"}
                        </Button>
                     </div>

                  </div>

               </Form>
            </main>

            <aside className="hidden lg:block w-[20%] shrink-0"></aside>
         </div>
      </PageContainer>
   );
};

export default CreateMatchPage;