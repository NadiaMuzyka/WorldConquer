import React , { createContext, useContext, useMemo } from 'react';

const RiskContext = createContext();

// Questo è un Hook personalizzato per utilizzare il contesto del gioco
export const useRisk = () => {
    const context = useContext(RiskContext);
    if (!context) {
        throw new Error('useRisk deve essere utilizzato dentro GameProvider');
    }
    return context;
}

// Creazione di un provider per il contesto del gioco
export const GameProvider = ({G, ctx, moves, playerID, events, chatMessages, sendChatMessage, children })=> {
    // Qui viene passato lo stato del gioco, le metainformazioni, le mosse, l'ID del giocatore e gli eventi come valore del contesto del risiko
    // In questo modo, tutti i componenti figli avranno accesso a questi dati tramite il contesto
    // PER CHI LEGGE IL CODICE: G è lo stato del gioco, ctx sono le metainformazioni del gioco, moves sono le mosse disponibili, 
    //                          playerID è l'ID del giocatore corrente, events sono gli eventi di gioco
    // In Boardgame.io, questi parametri sono comunemente usati per gestire lo stato e le interazioni del gioco ma venivano passate come props
    // causando prop drilling. Ora con il contesto, i componenti possono accedere direttamente a questi dati senza doverli passare attraverso ogni
    // livello della gerarchia dei componenti.
    
    // Usa useMemo per garantire che il value si aggiorni quando cambiano le dipendenze
    const value = useMemo(() => {
        console.log('[GAMEPROVIDER] Context aggiornato:', {
            playerID,
            currentPlayer: ctx?.currentPlayer,
            attackState: G?.attackState,
            phase: ctx?.phase,
            activeStage: ctx?.activePlayers?.[playerID]
        });
        
        return { 
            G, 
            ctx, 
            moves, 
            playerID, 
            events,
            chatMessages,
            sendChatMessage,
            currentPlayer: ctx?.currentPlayer,
            isMyTurn: ctx?.currentPlayer === playerID,
        };
    }, [G, ctx, moves, playerID, events, chatMessages, sendChatMessage]);

    return (
        <RiskContext.Provider value={value}>
            {children}
        </RiskContext.Provider>
    );
}