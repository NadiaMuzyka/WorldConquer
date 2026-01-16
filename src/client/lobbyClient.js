import { LobbyClient } from 'boardgame.io/client';

export const lobbyClient = new LobbyClient({ 
  server: '' 
});

/**
 * Gestisce il join alla partita con retry automatici e verifica
 */
export const joinGameWithRetry = async (matchId, playerID, playerName, avatar, retryCount = 0) => {
  const MAX_RETRIES = 3;
  
  try {
    console.log(`[LOBBY_CLIENT] Tentativo join match ${matchId} come ${playerName} (${playerID}) - Retry ${retryCount}/${MAX_RETRIES}`);
    
    // 1. Esegui il join
    const { playerCredentials } = await lobbyClient.joinMatch('risk', matchId, {
      playerID: String(playerID),
      playerName: playerName,
      data: { avatar: avatar }
    });

    // 2. Verifica che il server abbia registrato il giocatore
    let retries = 0;
    const maxRetries = 10;
    let matchInfo = null;

    while (retries < maxRetries) {
      matchInfo = await lobbyClient.getMatch('risk', matchId);
      const playerExists = matchInfo.players.some(p => p.id === Number(playerID) && p.name);
      
      if (playerExists) {
        console.log(`[LOBBY_CLIENT] ✅ Player confermato dal server`);
        return { playerCredentials, matchInfo };
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      retries++;
    }

    throw new Error("Timeout: Il server non ha confermato l'ingresso del giocatore.");

  } catch (error) {
    console.error("[LOBBY_CLIENT] Join Error:", error);
    
    // Gestisci conflitto 409: il player è ancora registrato lato boardgame.io
    // LobbyClientError ha la proprietà message nel formato "HTTP status 409"
    const is409Error = error.message?.includes('409') || 
                       error.message?.includes('Conflict') ||
                       error.statusCode === 409 ||
                       error.status === 409;
    
    if (is409Error && retryCount < MAX_RETRIES) {
      console.warn(`[LOBBY_CLIENT] ⚠️ Conflitto 409 rilevato, cleanup e retry in 1.5s...`);
      
      // Attendi che il server completi eventuali operazioni pendenti
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Prova a fare leave forzato (potrebbe fallire se il player non è più nel match)
      try {
        await lobbyClient.leaveMatch('risk', matchId, {
          playerID: String(playerID),
          credentials: '' // Anche senza credenziali, prova a rimuovere
        });
        console.log(`[LOBBY_CLIENT] Cleanup forzato eseguito per player ${playerID}`);
      } catch (leaveError) {
        console.log(`[LOBBY_CLIENT] Cleanup fallito (normale se player già rimosso):`, leaveError.message);
      }
      
      // Attendi ancora un po' prima di riprovare
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Riprova ricorsivamente
      return joinGameWithRetry(matchId, playerID, playerName, avatar, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * Gestisce l'uscita dalla partita
 */
export const leaveMatch = async (matchId, playerID, playerCredentials) => {
  try {
    console.log(`[LOBBY_CLIENT] Player ${playerID} sta lasciando match ${matchId}`);
    
    await lobbyClient.leaveMatch('risk', matchId, {
      playerID: String(playerID),
      credentials: playerCredentials
    });
    
    console.log(`[LOBBY_CLIENT] ✅ Player ${playerID} ha lasciato il match`);
  } catch (error) {
    console.error("[LOBBY_CLIENT] Leave Error:", error);
    throw error;
  }
};

export default lobbyClient;
