import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Timer from './Timer';         // Assicurati che il file esista (step precedente)
import PhaseInfo from './PhaseInfo'; // Assicurati che il file esista (step precedente)
import { useNavigate } from 'react-router-dom';
import { logout } from '../../firebase/auth';
import auth from '../../firebase/auth';
import { getUserData } from '../../firebase/db';
import ProfileDropdown from './ProfileDropdown';
import Logo from '../UI/Logo';
import Button from '../UI/Button';

export const Navbar = ({
  // Props Partita
  phase,
  gameCode,
  playerTurn,
  onLeave,
  timer = "00:00", // Default se non passato

  // Props Lobby/Generiche
  mode = "lobby",
  userAvatar
}) => {

  const navigate = useNavigate();
  const AVATAR_CACHE_KEY = 'user_avatar_url';
  
  // Inizializza con l'avatar dalla cache se disponibile
  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (userAvatar) return userAvatar;
    const cached = localStorage.getItem(AVATAR_CACHE_KEY);
    return cached || null;
  });
  const [isLoading, setIsLoading] = useState(!userAvatar && !localStorage.getItem(AVATAR_CACHE_KEY));

  // Aggiorna l'avatar quando il prop cambia
  useEffect(() => {
    if (userAvatar) {
      setAvatarUrl(userAvatar);
      localStorage.setItem(AVATAR_CACHE_KEY, userAvatar);
      setIsLoading(false);
    }
  }, [userAvatar]);

  // Carica l'avatar dal database solo se non è stato passato come prop
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (userAvatar) {
        return; // Usa il prop, non caricare dal DB
      }
      
      const currentUser = auth.currentUser;
      if (currentUser) {
        const result = await getUserData(currentUser.uid);
        if (result.success && result.data.photoURL) {
          setAvatarUrl(result.data.photoURL);
          localStorage.setItem(AVATAR_CACHE_KEY, result.data.photoURL);
        }
      }
      setIsLoading(false);
    };

    loadUserAvatar();
  }, [userAvatar]);

  const displayAvatar = avatarUrl;

  // --- LOGICA SMART ---
  // Se è presente la prop 'phase', forza la modalità GAME
  const isGameMode = mode === "game" || !!phase;

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
  };

  // --- STILI BASE (CSS Figma) ---
  const baseClasses = "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 bg-[#1B2227]/95 backdrop-blur-md shadow-[0px_4px_7px_rgba(0,0,0,0.2)] font-roboto transition-all duration-300 h-[82px]";

  // ===========================================================================
  // MODALITÀ: GAME (Timer | Fase | Esci)
  // ===========================================================================
  if (isGameMode) {
    return (
      <nav className={baseClasses}>

        {/* 1. TIMER (Sinistra) */}
        <div className="flex items-center">
          {/* Se vuoi mostrare anche il gameCode, puoi metterlo qui vicino al timer */}
          <div className="flex flex-col items-center">
            <Timer time={timer} />
            {/* Opzionale: Mostra GameCode piccolo sotto il timer se utile */}
            {/* <span className="text-[10px] text-gray-500 mt-1">{gameCode}</span> */}
          </div>
        </div>

        {/* 2. FASE (Centro Assoluto) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <PhaseInfo phase={phase} />
        </div>

        {/* 3. BOTTONE ABBANDONA (Destra) */}
        <div className="flex items-center justify-end">
          <Button
            onClick={onLeave}
            variant="cyan"
            className="w-[160px] h-[34px] gap-2 uppercase group"
          >
            <span>Abbandona</span>
            <ArrowRight className="w-[19px] h-[19px] group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

      </nav>
    );
  }

  // ===========================================================================
  // MODALITÀ: LOBBY (Default)
  // ===========================================================================
  return (
    <nav className={baseClasses}>

      {/* SX: Logo e Brand */}
      <Logo onClick={() => navigate('/lobby')} />

      {/* DX: Profilo Utente */}
      <div className="flex items-center pr-4">
        <ProfileDropdown
          avatarUrl={displayAvatar}
          isLoading={isLoading}
          onProfileClick={() => navigate('/profile')}
          onLogoutClick={handleLogout}
        />
      </div>

    </nav>
  );
};

export default Navbar;