// FirebaseAdapter.js
const admin = require('firebase-admin');

class FirebaseAdapter {
  constructor(rtdb, firestore) {
    this.rtdb = rtdb;
    this.firestore = firestore;
    this.statusCache = new Map();
  }

  type() { return 'ASYNC'; }
  async connect() { return true; }
  async ping() { return true; }

  // --- CREAZIONE ---
  async createMatch(matchID, { initialState, metadata }) {
    // FIX 1: Sanifichiamo lo stato iniziale per rimuovere undefined
    const cleanState = JSON.parse(JSON.stringify(initialState));

    console.log(`[ADAPTER DEBUG] Saving state. Started? ${cleanState.G?.isGameStarted}`);

    // 1. RTDB (Stato iniziale)
    await this.rtdb.ref(`matches/${matchID}`).set({ 
        initialState: cleanState, 
        state: cleanState, 
        metadata 
    });

    // 2. FIRESTORE (Lobby)
    const setupData = metadata.setupData || {};
    const firestoreData = {
      matchID: matchID,
      name: setupData.matchName || `Partita ${matchID}`,
      playersMax: setupData.playersMax || 6,
      mode: setupData.mode || 'classica',
      status: 'OPEN', // Nasce sempre OPEN
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      playersCurrent: 1, 
      isPrivate: setupData.isPrivate || false,
      password: setupData.password || null,
      players: [{
          id: setupData.hostId || "host",
          name: setupData.hostName || "Host",
          avatar: setupData.hostAvatar || "",
          isHost: true
      }],
      gameover: false
    };

    try {
        await this.firestore.collection('matches').doc(matchID).set(firestoreData);
        // Inizializziamo la cache per evitare update inutili immediati
        this.statusCache.set(matchID, 'OPEN'); 
        console.log(`[ADAPTER] Match ${matchID} creato.`);
    } catch (error) {
        console.error(`[ADAPTER ERROR] Create Firestore: ${error.message}`);
    }
  }

  // --- AGGIORNAMENTO STATO (Cuore della logica) ---
  async setState(matchID, state, deltalog) {
    // 1. SANIFICAZIONE TOTALE (Rimuove undefined che fanno crashare Firebase)
    const cleanState = JSON.parse(JSON.stringify(state));
    
    // Log di debug per vedere se cleanState ha i dati giusti
    // console.log(`[ADAPTER DEBUG] Saving state. Started? ${cleanState.G?.isGameStarted}`);

    // 2. SCRITTURA RTDB (Lo stato del gioco)
    try {
        await this.rtdb.ref(`matches/${matchID}/state`).set(cleanState);
    } catch (e) {
        console.error(`[ADAPTER FATAL] Errore scrittura RTDB per ${matchID}:`, e);
        // Se fallisce qui, non possiamo procedere
        return state; 
    }

    // 3. AGGIORNAMENTO FIRESTORE (Lo stato della Lobby)
    // Calcoliamo lo status basandoci su cleanState che è sicuro
    let currentStatus = 'OPEN';
    
    if (state.ctx.gameover) {
        currentStatus = 'FINISHED';
    } else if (cleanState.G && cleanState.G.isGameStarted === true) {
        currentStatus = 'PLAYING';
    }

    // Verifica cache per evitare scritture inutili
    const lastKnownStatus = this.statusCache.get(matchID);

    if (currentStatus !== lastKnownStatus) {
        console.log(`[ADAPTER] Cambio Status rilevato: ${lastKnownStatus} -> ${currentStatus}`);
        
        const updateData = { status: currentStatus };
        if (currentStatus === 'FINISHED') {
             updateData.gameover = true;
             updateData.winner = state.ctx.gameover;
        }

        try {
            await this.firestore.collection('matches').doc(matchID).update(updateData);
            this.statusCache.set(matchID, currentStatus);
            console.log(`[ADAPTER] Firestore aggiornato con successo a ${currentStatus}`);
        } catch (e) {
            console.error(`[ADAPTER WARN] Impossibile aggiornare Firestore:`, e.message);
        }
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
    const val = s.val();
    
    // FIX: Assicuriamo che troops e owners esistano anche se vuoti su DB
    if (val && val.G) {
        if (!val.G.troops) val.G.troops = {};
        if (!val.G.owners) val.G.owners = {};
    }
    
    return val; 
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