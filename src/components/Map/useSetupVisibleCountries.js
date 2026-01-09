import { useSelector } from 'react-redux';
import { useRisk } from '../../context/GameContext';

// Hook che restituisce l'elenco dei paesi da mostrare per il setup animato
export function useSetupVisibleCountries() {
  const { G, playerID, ctx } = useRisk();
  const visibleCount = useSelector(state => state.setupAnimation.visibleCount);
  const isSetupPhase = ctx?.phase === 'SETUP_INITIAL';

  if (!isSetupPhase || !G.setupAssignmentOrder) return null;

  // Prendi solo i territori del player corrente
  const myTerritories = G.setupAssignmentOrder.filter(
    countryId => G.owners[countryId] === playerID
  );

  // Restituisci solo quelli "visibili" secondo l'animazione
  return new Set(myTerritories.slice(0, visibleCount));
}
