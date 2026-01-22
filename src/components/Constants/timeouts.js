// src/components/Constants/timeouts.js

// Durate timeout per ogni fase/stage del gioco (in millisecondi)
export const PHASE_TIMEOUTS = {
  SETUP_INITIAL: 90000,        // 1min 30s
  INITIAL_REINFORCEMENT: 30000, // 30s
  GAME_REINFORCEMENT: 90000,    // 1min 30s
  GAME_ATTACK: 120000,          // 2min
  GAME_STRATEGIC_MOVEMENT: 30000 // 30s
};
