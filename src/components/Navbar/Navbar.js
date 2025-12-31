import React from 'react';
import { Flag, ArrowRight, LogOut } from 'lucide-react';
import Timer from './Timer';         // Assicurati che il file esista (step precedente)
import PhaseInfo from './PhaseInfo'; // Assicurati che il file esista (step precedente)
import { useNavigate } from 'react-router-dom';
import { logout } from '../../firebase/auth'; 

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
  const baseClasses = "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 bg-[#1c1c1c]/80 backdrop-blur-md shadow-[0px_4px_7px_rgba(0,0,0,0.2)] font-roboto transition-all duration-300";

  // Altezza: 102px per Game, 86px per Lobby
  const heightClass = isGameMode ? "h-[102px]" : "h-[86px]";

  // ===========================================================================
  // MODALITÀ: GAME (Layout Timer | Fase | Esci)
  // ===========================================================================
  if (isGameMode) {
    return (
      <nav className={`${baseClasses} ${heightClass}`}>

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
          <button
            onClick={onLeave}
            className="group w-[160px] h-[34px] bg-[#38C7D7] hover:bg-[#2dbdc0] rounded-[25px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <span className="font-bold text-[16px] text-[#192832] tracking-[0.2px] uppercase">
              Abbandona
            </span>
            <ArrowRight className="w-[19px] h-[19px] text-[#192832] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </nav>
    );
  }

  // ===========================================================================
  // MODALITÀ: LOBBY (Default)
  // ===========================================================================
  return (
    <nav className={`${baseClasses} ${heightClass}`}>

      {/* SX: Logo e Brand */}
      <div className="flex items-center gap-5">
        <div className="relative w-[54px] h-[54px] flex items-center justify-center">
          <Flag className="w-[40px] h-[40px] text-[#38C7D7] fill-current" />
        </div>
        <span className="font-bold text-[32px] text-white tracking-[0.2px] hidden md:block">
          WorldConquer
        </span>
      </div>

      {/* DX: Profilo Utente */}
      <div className="flex items-center gap-4 pr-4">
        {/* Bottone Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all active:scale-95 shadow-md"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-white" />
          <span className="text-white font-medium text-sm">Logout</span>
        </button>

        {/* Avatar */}
        <div className="w-[64px] h-[64px] rounded-full border-2 border-[#38C7D7] bg-[#2C333A] overflow-hidden shadow-lg">
          <img
            src={userAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

    </nav>
  );
};

export default Navbar;