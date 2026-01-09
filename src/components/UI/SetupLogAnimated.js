import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRisk } from '../../context/GameContext';
import { incrementVisible, setFinished, resetVisible } from '../../store/slices/setupAnimationSlice';
import { CONTINENTS_DATA } from '../Constants/mapData';
import { PLAYER_COLORS } from '../Constants/colors';

// Helper per nome territorio
const getTerritoryName = (countryId) => {
    for (const continent of Object.values(CONTINENTS_DATA)) {
        const territory = continent.find(t => t.id === countryId);
        if (territory) return territory.name;
    }
    return countryId;
};

export default function SetupLogAnimated() {
    const dispatch = useDispatch();
    const { G, playerID } = useRisk();
    const visibleCount = useSelector(state => state.setupAnimation.visibleCount);
    const finished = useSelector(state => state.setupAnimation.finished);

    // Territori assegnati a me
    const myTerritories = G.setupAssignmentOrder?.filter(
        countryId => G.owners[countryId] === playerID
    ) || [];

    // Animazione: incrementa visibleCount ogni 500ms
    useEffect(() => {
        if (finished) return;
        if (visibleCount >= myTerritories.length) {
            dispatch(setFinished(true));
            return;
        }
        const timer = setTimeout(() => {
            dispatch(incrementVisible());
        }, 2000);
        return () => clearTimeout(timer);
    }, [visibleCount, finished, myTerritories.length, dispatch]);

    // Reset all'inizio fase SOLO se siamo in fase di setup
    useEffect(() => {
        if (G?.ctx?.phase === 'SETUP_INITIAL') {
            dispatch(resetVisible());
        }
    }, [G?.setupAssignmentOrder, playerID, dispatch, G?.ctx?.phase]);

    // Mostra solo l'ultimo territorio animato
    const lastCountryId = myTerritories[visibleCount - 1];
    const myColor = PLAYER_COLORS[playerID];

    if (!lastCountryId) return null;

    return (
        <div className="fixed left-8 bottom-32 z-30 bg-[#1B2227]/90 px-6 py-3 rounded-xl shadow-xl border-l-4" style={{ borderColor: myColor }}>
            <span className="text-lg font-bold" style={{ color: myColor }}>+ {getTerritoryName(lastCountryId)}</span>
            <span className="text-gray-300 ml-2">ti è stato assegnato</span>
        </div>
    );
}
