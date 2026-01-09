import React from 'react';
import { useSelector } from 'react-redux'; // Importiamo per leggere i nomi dei player
import { useRisk } from '../../context/GameContext';
import { Button } from './Button';
import { PLAYER_COLORS } from '../Constants/colors'; // Importiamo i colori

export function ReinforcementPanel() {
  const { G, ctx, playerID, moves } = useRisk();

  // Recuperiamo i dati della partita (nomi giocatori) da Redux
  const matchData = useSelector((state) => state.match?.data);

  // Verifica che siamo nella fase corretta
  if (ctx?.phase !== 'INITIAL_REINFORCEMENT') return null;

  // Info Giocatore Corrente (di chi è il turno)
  const currentPlayerID = ctx.currentPlayer;
  const isMyTurn = currentPlayerID === playerID;

  // Recupera Nome e Colore del giocatore di turno
  // Assumiamo che matchData.playersCurrent sia un array o oggetto con i dati
  const playersList = matchData?.players || [];
  const currentPlayerObj = playersList.find(p => String(p.id) === String(currentPlayerID));
  const currentPlayerName = currentPlayerObj ? currentPlayerObj.username : `Player ${currentPlayerID}`;
  const currentPlayerColor = PLAYER_COLORS[currentPlayerID] || '#ffffff';

  // --- LOGICA MODIFICATA PER VISIBILITÀ ---

  // 1. Truppe Rimanenti: Mostra SEMPRE E SOLO le "mie" (del client locale), indipendentemente dal turno
  const myReinforcements = G.reinforcementsRemaining?.[playerID] || 0;

  // 2. Logica turno corrente (solo se è il mio turno calcolo i limiti per il bottone)
  const turnPlacements = G.turnPlacements?.length || 0;
  // Nota: G.reinforcementsRemaining[currentPlayerID] serve per calcolare se IL GIOCATORE ATTIVO ha finito
  const activePlayerRem = G.reinforcementsRemaining?.[currentPlayerID] || 0;

  // Calcolo per il bottone (solo se è il mio turno)
  // Se è il mio turno, uso le mie truppe, altrimenti 0 per sicurezza visuale
  const troopsForLogic = isMyTurn ? myReinforcements : 0;
  const maxTroopsThisTurn = Math.min(3, troopsForLogic + turnPlacements);

  const canEndTurn = isMyTurn && turnPlacements === maxTroopsThisTurn;

  const handleEndTurn = () => {
    if (canEndTurn && moves && typeof moves.endPlayerTurn === 'function') {
      moves.endPlayerTurn();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-20 bg-gradient-to-r from-[#1e3a4f] to-[#2a4a5f] border-t-2 border-cyan-500/50 py-4 px-6 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">

        {/* SX: LE MIE INFORMAZIONI (Sempre visibili) */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Le Mie Truppe
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {myReinforcements}
              </span>
              <span className="text-sm text-gray-400">
                da piazzare totali
              </span>
            </div>
          </div>

          {/* Mostriamo i dettagli del piazzamento SOLO se è il mio turno */}
          {isMyTurn && (
            <>
              <div className="h-10 w-px bg-cyan-500/30 mx-2"></div>
              <div className="flex flex-col">
                <span className="text-xs text-green-400 uppercase tracking-wide mb-1">
                  Questo Turno
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${turnPlacements === maxTroopsThisTurn ? 'text-green-400' : 'text-cyan-400'
                    }`}>
                    {turnPlacements}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-xl font-semibold text-gray-300">
                    {maxTroopsThisTurn}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* DX: STATO DEL TURNO E BOTTONE */}
        <div className="flex items-center gap-4 ml-auto">
          {!isMyTurn ? (
            // Messaggio "In attesa" migliorato con Nome e Colore
            <div className="text-right">
              <span className="block text-xs text-gray-400 uppercase">Tocca a</span>
              <div className="text-lg font-bold flex items-center gap-2" style={{ color: currentPlayerColor }}>
                {/* Pallino colorato */}
                <span className="w-3 h-3 rounded-full bg-current inline-block"></span>
                {currentPlayerName}
              </div>
            </div>
          ) : (
            // Bottone Azione
            <Button
              variant="cyan"
              size="lg"
              onClick={handleEndTurn}
              disabled={!canEndTurn}
              className={`
                min-w-[200px] 
                transition-all duration-200
                ${canEndTurn
                  ? 'shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                  : 'opacity-50 cursor-not-allowed'
                }
              `}
            >
              {canEndTurn
                ? 'Conferma Fine Turno'
                : `Piazza ancora ${maxTroopsThisTurn - turnPlacements}`
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReinforcementPanel;