import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Timer from './Timer';         // Assicurati che il file esista (step precedente)
import PhaseInfo from './PhaseInfo'; // Assicurati che il file esista (step precedente)
import { useNavigate } from 'react-router-dom';
import { logout } from '../../firebase/auth';
import auth from '../../firebase/auth';
import { useSelector } from 'react-redux';
import ProfileDropdown from './ProfileDropdown';
import Logo from '../UI/Logo';
import Button from '../UI/Button';
import Modal from '../UI/Modal';

export const Navbar = ({
  // Props Partita
  phase,
  gameCode,
  playerTurn,
  onLeave,
  timer = "00:00", // Default se non passato
  ctx, // Contesto per stage

  // Props Lobby/Generiche
  mode = "lobby",
  userAvatar
}) => {

  const navigate = useNavigate();
  const { currentUser, status: userStatus } = useSelector(state => state.user || { currentUser: null, status: 'loading' });

  const displayAvatar = userAvatar || currentUser?.avatar || null;
  const isLoading = userStatus === 'loading' && !userAvatar;

  // --- LOGICA SMART ---
  // Se è presente la prop 'phase', forza la modalità GAME
  const isGameMode = mode === "game" || !!phase;


  // Stato per mostrare il modal di conferma logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Trigger apertura modal
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // Conferma logout
  const confirmLogout = async () => {
    setIsLoggingOut(true);
    const result = await logout();
    setIsLoggingOut(false);
    setShowLogoutModal(false);
    if (result.success) {
      navigate('/');
    }
  };

  // Chiudi modal
  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  // --- STILI BASE (CSS Figma) ---
  const baseClasses = `fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 font-roboto transition-all duration-300 ${
    isGameMode 
      ? 'h-[80px] bg-gradient-to-b from-gray-900/80 to-transparent pointer-events-none' 
      : 'h-[80px] bg-[#1B2227]/95 backdrop-blur-md shadow-[0px_4px_7px_rgba(0,0,0,0.2)]'
  }`;
  // ===========================================================================
  // MODALITÀ: GAME (Timer | Fase | Esci)
  // ===========================================================================
  if (isGameMode) {
    // Determina lo stage corrente
    const currentStage = ctx?.activePlayers?.[ctx?.currentPlayer];

    return (
      <nav className={baseClasses}>

        {/* Layout a 3 colonne: Timer (sx) | PhaseInfo (centro) | Abbandona (dx) */}
        <div className="flex items-center justify-between w-full h-full px-8">
          
          {/* 1. TIMER (Sinistra) */}
          <div className="flex items-center origin-top-left scale-[0.70] md:scale-75 lg:scale-75 xl:scale-[0.85] 2xl:scale-100 min-[1920px]:scale-125">
            <Timer />
          </div>

          {/* 2. FASE + STAGE (Centro Assoluto - mantiene il posizionamento esistente) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-top scale-[0.70] md:scale-75 lg:scale-75 xl:scale-[0.85] 2xl:scale-100 min-[1920px]:scale-125">
            <PhaseInfo phase={phase} stage={currentStage} />
          </div>

          {/* 3. BOTTONE ABBANDONA (Destra) */}
          <div className="flex items-center justify-end pointer-events-auto origin-top-right scale-[0.70] md:scale-75 lg:scale-75 xl:scale-[0.85] 2xl:scale-100 min-[1920px]:scale-125">
            <Button
              onClick={onLeave}
              className="w-[140px] h-[34px] gap-2 uppercase group !bg-red-600 hover:!bg-red-700 !border-red-600 text-white shadow-[0_4px_16px_rgba(220,38,38,0.5)] transition-all duration-300"
            >
              <span>Abbandona</span>
              <ArrowRight className="w-[20px] h-[20px] group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        
        </div>

      </nav>
    );
  }

  // ===========================================================================
  // MODALITÀ: LOBBY (Default)
  // ===========================================================================
  return (
    <>
      <nav className={baseClasses}>
        {/* SX: Logo e Brand */}
        <Logo onClick={() => navigate('/lobby')} />
        {/* DX: Profilo Utente */}
        <div className="flex items-center pr-4">
          <ProfileDropdown
            avatarUrl={displayAvatar}
            isLoading={isLoading}
            onProfileClick={() => navigate('/profile')}
            onStatsClick={() => navigate('/stats')}
            onRulesClick={() => navigate('/rules')}
            onLogoutClick={handleLogout}
          />
        </div>
      </nav>
      {showLogoutModal && (
        <Modal
          // Props per il controllo
          onClose={closeLogoutModal}

          // Titolo formale
          title="Conferma Logout"

          // Dimensione piccola (perfetta per le conferme)
          size="sm"

          // Contenuto testuale (Children)
          children={
            <div className="text-gray-300 text-center">
              Sei sicuro di voler uscire dal gioco?
            </div>
          }

          // Bottoni (ActionBar)
          actionBar={
            <>
              <Button onClick={closeLogoutModal} variant="outline" className="mr-2">
                Annulla
              </Button>
              <Button onClick={confirmLogout} disabled={isLoggingOut} variant="primary">
                Esci
              </Button>
            </>
          }
        />
      )}
    </>
  );
};

export default Navbar;