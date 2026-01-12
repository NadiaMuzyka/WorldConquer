import { LobbyClient } from 'boardgame.io/client';

export const lobbyClient = new LobbyClient({ 
  server: '' 
});

/**
 * Gestisce il join alla partita con retry automatici e verifica
 */
export const joinGameWithRetry = async (matchId, playerID, playerName, avatar) => {
  try {
    console.log(`[LOBBY_CLIENT] Tentativo join match ${matchId} come ${playerName} (${playerID})`);
    
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
