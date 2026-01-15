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

    // 2. FIRESTORE (Lobby) - Usa transazione per creazione atomica
    const setupData = metadata.setupData || {};
    const docRef = this.firestore.collection('matches').doc(matchID);
    
    try {
        await this.firestore.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            
            // Verifica che la partita non esista già
            if (doc.exists) {
                console.warn(`[ADAPTER] Match ${matchID} già esistente, skip creazione`);
                return;
            }
            
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
                }]
            };
            
            transaction.set(docRef, firestoreData);
        });
        
        // Inizializziamo la cache per evitare update inutili immediati
        this.statusCache.set(matchID, 'OPEN'); 
        console.log(`[ADAPTER] Match ${matchID} creato con transazione.`);
    } catch (error) {
        console.error(`[ADAPTER ERROR] Create Firestore: ${error.message}`);
        throw error; // Propaga l'errore per far fallire la creazione
    }
  }

  // --- AGGIORNAMENTO STATO (Cuore della logica) ---
  async setState(matchID, state, deltalog) {
    // 1. SANIFICAZIONE TOTALE (Rimuove undefined che fanno crashare Firebase)
    const cleanState = JSON.parse(JSON.stringify(state));

    // 2. SCRITTURA RTDB (Lo stato del gioco)
    try {
        await this.rtdb.ref(`matches/${matchID}/state`).set(cleanState);
    } catch (e) {
        console.error(`[ADAPTER FATAL] Errore scrittura RTDB per ${matchID}:`, e);
        // Se fallisce qui, non possiamo procedere
        return state; 
    }

    // 3. AGGIORNAMENTO FIRESTORE (Lo stato della Lobby)
    // Calcoliamo lo status: la partita è PLAYING quando BoardGame.io ha avviato le fasi
    let currentStatus = 'OPEN';
    
    if (state.ctx.gameover) {
        currentStatus = 'FINISHED';
    } else if (state.ctx.phase) {
        // Se esiste una fase, significa che la partita è partita
        currentStatus = 'PLAYING';
    }

    // Verifica cache per evitare scritture inutili
    const lastKnownStatus = this.statusCache.get(matchID);

    if (currentStatus !== lastKnownStatus) {
        console.log(`[ADAPTER] Cambio Status rilevato: ${lastKnownStatus} -> ${currentStatus}`);
        
        const updateData = { status: currentStatus };
        
        if (currentStatus === 'FINISHED') {
            // Estrai winnerID: ctx.gameover può essere { winner: "0" } o direttamente "0"
            const winnerID = state.ctx.gameover?.winner || state.ctx.gameover;
            updateData.winner = winnerID;
            
            // Calcola statistiche territori per ogni giocatore
            const territoryStats = {};
            if (state.G && state.G.owners) {
                // Conta i territori per ogni giocatore
                for (const [territoryId, ownerID] of Object.entries(state.G.owners)) {
                    if (!territoryStats[ownerID]) {
                        territoryStats[ownerID] = 0;
                    }
                    territoryStats[ownerID]++;
                }
            }
            updateData.statistics = {
                territoriesPerPlayer: territoryStats,
                completedAt: new Date().toISOString()
            };
            
            // Recupera informazioni complete del vincitore da Firestore
            try {
                const matchDoc = await this.firestore.collection('matches').doc(matchID).get();
                if (matchDoc.exists()) {
                    const matchDataFS = matchDoc.data();
                    const winnerPlayer = matchDataFS.players?.find(p => p.id === winnerID);
                    
                    if (winnerPlayer) {
                        updateData.winnerInfo = {
                            id: winnerPlayer.id,
                            name: winnerPlayer.name || 'Unknown',
                            email: winnerPlayer.email || '',
                            nickname: winnerPlayer.nickname || winnerPlayer.name || 'Unknown',
                            firebaseAuthId: winnerPlayer.firebaseAuthId || winnerPlayer.id
                        };
                        console.log(`[ADAPTER] Winner info recuperate:`, updateData.winnerInfo);
                    }
                }
            } catch (e) {
                console.error(`[ADAPTER WARN] Impossibile recuperare info vincitore:`, e.message);
            }
            
            // Cancella la partita dal Real Time Database
            console.log(`[ADAPTER] Cancellazione partita ${matchID} da RTDB...`);
            try {
                await this.rtdb.ref(`matches/${matchID}`).remove();
                console.log(`[ADAPTER] Partita ${matchID} rimossa da RTDB con successo`);
            } catch (e) {
                console.error(`[ADAPTER ERROR] Impossibile cancellare ${matchID} da RTDB:`, e.message);
            }
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

  // --- METADATI (Con transazioni per evitare race conditions) ---
  async setMetadata(matchID, metadata) {
    // Non scrivere su RTDB se la partita è FINISHED (è già stata cancellata)
    const cachedStatus = this.statusCache.get(matchID);
    if (cachedStatus !== 'FINISHED') {
      await this.rtdb.ref(`matches/${matchID}/metadata`).set(metadata);
    } else {
      console.log(`[ADAPTER] Skip RTDB write for FINISHED match ${matchID}`);
    }

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
        const docRef = this.firestore.collection('matches').doc(matchID);
        
        try {
            // Usa una transazione per aggiornare atomicamente i giocatori
            await this.firestore.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                
                if (!doc.exists) {
                    console.warn(`[ADAPTER] Match ${matchID} non esiste in Firestore durante setMetadata`);
                    return;
                }

                const currentData = doc.data();
                const currentPlayersMax = currentData.playersMax || 6;
                
                // Verifica che non si superi il numero massimo di giocatori
                if (playersArray.length > currentPlayersMax) {
                    throw new Error(`Troppi giocatori: ${playersArray.length}/${currentPlayersMax}`);
                }

                // Determina il nuovo status
                let newStatus = currentData.status || 'OPEN';
                
                // NON sovrascrivere lo status se la partita è già FINISHED
                if (currentData.status === 'FINISHED') {
                    newStatus = 'FINISHED';
                    console.log(`[ADAPTER] Match ${matchID} già FINISHED, status mantenuto`);
                } else if (playersArray.length === currentPlayersMax && currentData.status === 'OPEN') {
                    // Se tutti i giocatori si sono uniti, la partita passa a PLAYING
                    newStatus = 'PLAYING';
                    this.statusCache.set(matchID, 'PLAYING');
                    console.log(`[ADAPTER] Match ${matchID} passa a PLAYING (tutti i giocatori uniti)`);
                }

                // Aggiorna atomicamente
                transaction.update(docRef, {
                    playersCurrent: playersArray.length,
                    players: playersArray,
                    status: newStatus
                });
            });
            
            console.log(`[ADAPTER] Metadata aggiornato con transazione: ${playersArray.length} giocatori`);
        } catch (error) {
            console.error(`[ADAPTER ERROR] Transazione fallita per ${matchID}:`, error.message);
            
            // Fallback senza transazione (meno sicuro ma evita crash)
            // Rileggi i dati per calcolare lo status
            try {
                const doc = await docRef.get();
                if (doc.exists) {
                    const currentData = doc.data();
                    const currentPlayersMax = currentData.playersMax || 6;
                    const newStatus = playersArray.length === currentPlayersMax ? 'PLAYING' : (currentData.status || 'OPEN');
                    
                    await docRef.set({
                        playersCurrent: playersArray.length,
                        players: playersArray,
                        status: newStatus
                    }, { merge: true });
                    
                    if (newStatus === 'PLAYING') {
                        this.statusCache.set(matchID, 'PLAYING');
                        console.log(`[ADAPTER] Match ${matchID} passa a PLAYING (fallback)`);
                    }
                } else {
                    console.warn(`[ADAPTER] Match ${matchID} non esiste, evito ricreazione in fallback`);
                }
            } catch (fallbackError) {
                console.error(`[ADAPTER ERROR] Fallback fallito:`, fallbackError);
            }
        }
    }
  }

  // --- LETTURE ---
  async getState(matchID) {
    const s = await this.rtdb.ref(`matches/${matchID}/state`).once('value');
    const val = s.val();
    
    // FIX: Return undefined if state doesn't exist
    if (!val) {
      console.warn(`[ADAPTER] State not found for match ${matchID}`);
      return undefined;
    }
    
    // FIX: Assicuriamo che troops e owners esistano anche se vuoti su DB
    if (val.G) {
        if (!val.G.troops) val.G.troops = {};
        if (!val.G.owners) val.G.owners = {};
    }
    
    return val; 
  }

  async getMetadata(matchID) {
    const s = await this.rtdb.ref(`matches/${matchID}/metadata`).once('value');
    const metadata = s.val();
    
    // FIX: Return undefined if metadata doesn't exist (boardgame.io expects undefined, not null)
    if (!metadata) {
      console.warn(`[ADAPTER] Metadata not found for match ${matchID}`);
      return undefined;
    }
    
    return metadata;
  }

  async fetch(matchID, { state, metadata }) {
      const result = {};
      if (state) {
        const fetchedState = await this.getState(matchID);
        if (fetchedState !== undefined) {
          result.state = fetchedState;
        }
      }
      if (metadata) {
        const fetchedMetadata = await this.getMetadata(matchID);
        if (fetchedMetadata !== undefined) {
          result.metadata = fetchedMetadata;
        }
      }
      return result;
  }

  async wipe(matchID) {
    // Elimina da Realtime Database
    await this.rtdb.ref(`matches/${matchID}`).remove();
    
    // Elimina da Firestore (FONDAMENTALE per evitare documenti zombie)
    try {
      await this.firestore.collection('matches').doc(matchID).delete();
      console.log(`[ADAPTER] Match ${matchID} rimosso da Firestore.`);
    } catch (error) {
      console.error(`[ADAPTER ERROR] Impossibile eliminare ${matchID} da Firestore:`, error.message);
    }
    
    // Pulizia memoria cache
    this.statusCache.delete(matchID);
    console.log(`[ADAPTER] Match ${matchID} rimosso completamente.`);
  }

  // --- LEAVE MATCH (Sincronizza Firestore quando un player esce) ---
  async leaveMatch(matchID, playerID) {
    try {
      console.log(`[ADAPTER] Player ${playerID} sta lasciando match ${matchID}`);
      
      // Aggiorna Firestore con transazione
      const docRef = this.firestore.collection('matches').doc(matchID);
      
      await this.firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        
        if (!doc.exists) {
          console.warn(`[ADAPTER] Match ${matchID} non trovato in Firestore`);
          return;
        }
        
        const matchData = doc.data();
        const players = matchData.players || [];
        
        // Rimuovi il giocatore dall'array - converti tutto a stringa per il confronto
        const updatedPlayers = players.filter(p => String(p.id) !== String(playerID));
        const playersCurrent = updatedPlayers.length;
        
        // Se non ci sono più giocatori, elimina il match
        if (playersCurrent === 0) {
          console.log(`[ADAPTER] Nessun giocatore rimasto, eliminazione match ${matchID}`);
          transaction.delete(docRef);
          
          // Elimina anche da RTDB
          await this.rtdb.ref(`matches/${matchID}`).remove();
        } else {
          // Aggiorna il contatore e l'array giocatori
          transaction.update(docRef, {
            players: updatedPlayers,
            playersCurrent: playersCurrent
          });
          
          console.log(`[ADAPTER] Match ${matchID} aggiornato: ${playersCurrent} giocatori rimanenti`);
        }
      });
      
      // Pulisci anche il player da RTDB (metadata)
      await this.rtdb.ref(`matches/${matchID}/players/${playerID}`).remove();
      console.log(`[ADAPTER] Player ${playerID} rimosso da RTDB`);
      
    } catch (error) {
      console.error(`[ADAPTER ERROR] Leave match: ${error.message}`);
    }
  }
}

module.exports = FirebaseAdapter;