// FirebaseAdapter.js
const admin = require('firebase-admin');

class FirebaseAdapter {
  constructor(rtdb, firestore) {
    this.rtdb = rtdb;
    this.firestore = firestore;
    
    // CACHE LOCALE: Mappa matchID -> 'STATUS' (es. 'PLAYING')
    // Serve per non scrivere su Firestore a ogni singolo click
    this.statusCache = new Map();
  }

  type() { return 'ASYNC'; }
  async connect() { return true; }
  async ping() { return true; }

async createMatch(matchID, { initialState, metadata }) {
    // 1. RTDB (Stato Grezzo)
    await this.rtdb.ref(`matches/${matchID}`).set({ 
        initialState, 
        state: initialState, 
        metadata 
    });

    // 2. FIRESTORE (Dati Puliti per la Lobby)
    const setupData = metadata.setupData || {};
    
    const firestoreData = {
      matchID: matchID,
      name: setupData.matchName || `Partita ${matchID}`,
      playersMax: setupData.playersMax || 6,
      status: 'OPEN',
      // ... altri campi ...
      playersCurrent: 1, 
      players: [{
          id: "0", // <--- FORZATURA FONDAMENTALE: L'Host è SEMPRE "0"
          name: setupData.hostName || "Host",
          avatar: setupData.hostAvatar || "",
          isHost: true
      }],
      // ...
    };

    try {
        await this.firestore.collection('matches').doc(matchID).set(firestoreData);
        this.statusCache.set(matchID, 'OPEN'); 
    } catch (error) {
        console.error(`[ADAPTER ERROR] Create Firestore: ${error.message}`);
    }
  }

  // --- AGGIORNAMENTO STATO (Cuore della logica) ---
  async setState(matchID, state, deltalog) {
    // 1. RTDB: Scriviamo SEMPRE (è la memoria "viva" del gioco)
    await this.rtdb.ref(`matches/${matchID}/state`).set(state);

    // 2. CALCOLO STATUS ATTUALE
    let currentStatus = 'OPEN';
    if (state.ctx.gameover) {
        currentStatus = 'FINISHED';
    } else if (state.G.isGameStarted) {
        currentStatus = 'PLAYING';
    }

    // 3. CHECK CACHE: Dobbiamo aggiornare Firestore?
    const lastKnownStatus = this.statusCache.get(matchID);

    // Aggiorna SOLO se lo stato è cambiato rispetto all'ultima volta che abbiamo controllato
    // (O se la cache è vuota causa riavvio server)
    if (currentStatus !== lastKnownStatus) {
        
        console.log(`[ADAPTER] Aggiorno Firestore: ${matchID} -> ${currentStatus}`);
        
        const updateData = { status: currentStatus };
        
        // Se è finita, salviamo anche il vincitore
        if (currentStatus === 'FINISHED') {
            updateData.gameover = true;
            updateData.winner = state.ctx.gameover;
        }

        // Scrittura Firestore (Idempotente)
        await this.firestore.collection('matches').doc(matchID).update(updateData)
            .catch(e => console.error(`[ADAPTER WARN] Err update ${currentStatus}:`, e.message));
        
        // Aggiorniamo la cache
        this.statusCache.set(matchID, currentStatus);
    }
    
    return state;
  }

  // --- METADATI (Con fix anti-fantasmi) ---
  async setMetadata(matchID, metadata) {
    await this.rtdb.ref(`matches/${matchID}/metadata`).set(metadata);

    // Filtra solo i giocatori che hanno un nome (esclude i posti prenotati vuoti)
    const playersRaw = Object.values(metadata.players || {});
    const playersArray = playersRaw
        .filter(p => p && p.name) 
        .map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.data?.avatar || "",
        }));

    if (playersArray.length > 0) {
        await this.firestore.collection('matches').doc(matchID).set({
            playersCurrent: playersArray.length,
            players: playersArray
        }, { merge: true }).catch(err => console.error(err));
    }
  }

  // --- LETTURE ---
  async getState(matchID) {
    const s = await this.rtdb.ref(`matches/${matchID}/state`).once('value');
    return s.val(); 
  }

  async getMetadata(matchID) {
    const s = await this.rtdb.ref(`matches/${matchID}/metadata`).once('value');
    return s.val();
  }

  async fetch(matchID, { state, metadata }) {
      const result = {};
      if (state) result.state = await this.getState(matchID);
      if (metadata) result.metadata = await this.getMetadata(matchID);
      return result;
  }

  async wipe(matchID) {
    await this.rtdb.ref(`matches/${matchID}`).remove();
    this.statusCache.delete(matchID); // Pulizia memoria
    console.log(`[ADAPTER] Match ${matchID} rimosso.`);
  }
}

module.exports = FirebaseAdapter;