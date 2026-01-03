import React , { createContext, useContext } from 'react';

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
export const GameProvider = ({G, ctx, moves, playerID, events, children })=> {
    // Qui viene passato lo stato del gioco, le metainformazioni, le mosse, l'ID del giocatore e gli eventi come valore del contesto del risiko
    // In questo modo, tutti i componenti figli avranno accesso a questi dati tramite il contesto
    // PER CHI LEGGE IL CODICE: G è lo stato del gioco, ctx sono le metainformazioni del gioco, moves sono le mosse disponibili, 
    //                          playerID è l'ID del giocatore corrente, events sono gli eventi di gioco
    // In Boardgame.io, questi parametri sono comunemente usati per gestire lo stato e le interazioni del gioco ma venivano passate come props
    // causando prop drilling. Ora con il contesto, i componenti possono accedere direttamente a questi dati senza doverli passare attraverso ogni
    // livello della gerarchia dei componenti.
    const value = { 
        G, 
        ctx, 
        moves, 
        playerID, 
        events,
        currentPlayer: ctx.currentPlayer,
        isMyTurn: ctx.currentPlayer === playerID,
    };

    return (
        <RiskContext.Provider value={value}>
            {children}
        </RiskContext.Provider>
    );
}