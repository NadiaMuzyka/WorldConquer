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
import { getGameUser } from '../utils/getUser';
import { auth } from '../firebase/firebaseConfig';
import { enterMatch } from '../store/slices/lobbySlice'; // <--- 2. IMPORT AZIONE
import { useSelector } from 'react-redux';

const CreateMatchPage = () => {
   const navigate = useNavigate();
   const dispatch = useDispatch(); // <--- 3. HOOK

   const { currentUser, status: userStatus } = useSelector(state => state.user);

   // --- STATI DEL FORM ---
   const [matchName, setMatchName] = useState('');
   const [playersMax, setPlayersMax] = useState(3);
   const [gameMode, setGameMode] = useState('classica');
   const [isPrivate, setIsPrivate] = useState(false);
   const [password, setPassword] = useState('');
   const [passwordError, setPasswordError] = useState('');
   const [loading, setLoading] = useState(false);
   // Il backend Render (piano gratuito) va in sleep dopo inattività e può
   // impiegare fino a ~30-40s a risvegliarsi sulla prima richiesta: senza
   // questo messaggio l'attesa sembra un'app bloccata invece di un cold start.
   const [slowServer, setSlowServer] = useState(false);

   // Redirigi se non loggato
   React.useEffect(() => {
      if (userStatus === 'unauthenticated') {
         navigate('/login');
      }
   }, [userStatus, navigate]);

   // --- LOGICA DI CREAZIONE ---
   const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!currentUser) {
         alert('Errore: Utente non caricato');
         return;
      }

      // Validazione password
      if (isPrivate) {
         if (!password) {
            setPasswordError('Password richiesta per partita privata');
            setLoading(false);
            return;
         }
         if (password.length < 6) {
            setPasswordError('Password deve avere almeno 6 caratteri');
            setLoading(false);
            return;
         }
      }
      
      // Cancella errori precedenti
      setPasswordError('');

      setLoading(true);
      setSlowServer(false);
      const slowServerTimer = setTimeout(() => setSlowServer(true), 6000);

      try {
         // 1. PREPARA I DATI PER IL SERVER
         // Passiamo tutto ciò che serve a Firestore dentro 'setupData'
         // Hash della password prima di inviarla
         const hashedPassword = isPrivate && password ? bcrypt.hashSync(password, 10) : null;
         
         const matchData = {
            matchName,
            playersMax,
            mode: gameMode,
            isPrivate,
            password: hashedPassword,
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
         clearTimeout(slowServerTimer);

         // 3. NAVIGAZIONE ALLA WAITING PAGE
         // L'host entra nella waiting page come player 0
         // Il join verrà fatto automaticamente dalla waiting page
         navigate(`/waiting/${matchID}`, {
            state: {
               playerID: "0",
               currentUser: currentUser
            }
         });

      } catch (error) {
         clearTimeout(slowServerTimer);
         console.error("Errore creazione:", error);
         alert("Impossibile contattare il server. Controlla la connessione e riprova.");
         setLoading(false);
         setSlowServer(false);
      }
   };


   return (
      <>
         {/* NAVBAR */}
         <Navbar mode="lobby" user={currentUser} />

         <PageContainer className="font-roboto text-white">
            {/* LAYOUT */}
            <div className="flex w-full max-w-[1920px] mx-auto pt-[90px] px-6 xl:px-12 pb-10 gap-8 items-start min-h-[calc(100vh-90px)]">

            {/* COLONNA SX */}
            <aside className="hidden lg:flex flex-col w-[20%] shrink-0 items-end">
               <Button
                  variant="secondary"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-4 bg-[#1B2227] hover:bg-[#2A3439] border border-gray-600 text-[#173C55] text-sm font-bold shadow-md"
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
                  className="w-full max-w-2xl"
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
                              onChange={(e) => {
                                 setPassword(e.target.value);
                                 setPasswordError('');
                              }}
                              minLength={6}
                              required={true}
                           />
                           {passwordError && (
                              <p className="text-red-400 text-sm font-medium mt-2">{passwordError}</p>
                           )}
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
                        {loading && slowServer && (
                           <p className="text-center text-sm text-gray-400 mt-3">
                              Il server si sta avviando dopo un periodo di inattività: può volerci fino a circa 30-40 secondi. Attendi, non ricaricare la pagina.
                           </p>
                        )}
                     </div>

                  </div>

               </Form>
            </main>

            <aside className="hidden lg:block w-[20%] shrink-0"></aside>
         </div>
         </PageContainer>
      </>
   );
};

export default CreateMatchPage;