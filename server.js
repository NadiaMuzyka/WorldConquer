// server.js
const { Server, Origins } = require('boardgame.io/server');
const { RiskGame } = require('./src/game');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const FirebaseAdapter = require('./FirebaseAdapter');
const cors = require('@koa/cors');

// 1. Configurazione Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://worldconquer-6d325-default-rtdb.europe-west1.firebasedatabase.app"
});

// 2. Creazione istanze DB
const rtdb = admin.database();
const firestore = admin.firestore();

// 3. Creazione Server BoardGame.io (PRIMA dei middleware che lo usano)
const server = Server({
  games: [RiskGame],
  origins: [Origins.LOCALHOST],
  db: new FirebaseAdapter(rtdb, firestore),
});

// 4. Middleware Koa per validare il join prima di eseguirlo
const validateJoinMiddleware = async (ctx, next) => {
  // Intercetta solo le richieste POST a /games/{gameName}/{matchID}/join
  if (ctx.method === 'POST' && ctx.path.includes('/join')) {
    const pathParts = ctx.path.split('/');
    const matchID = pathParts[pathParts.length - 2];
    
    try {
      // Leggi il body per ottenere playerID (senza consumarlo per boardgame.io)
      let bodyData = null;
      if (ctx.request.body) {
        bodyData = ctx.request.body;
      }
      
      // Controlla se la partita esiste in Firestore
      const docRef = firestore.collection('matches').doc(matchID);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const matchData = doc.data();
        const currentPlayers = matchData.playersCurrent || 0;
        const maxPlayers = matchData.playersMax || 6;
        
        // Verifica 1: Partita piena
        if (currentPlayers >= maxPlayers) {
          console.log(`[SERVER] Join bloccato per ${matchID}: partita piena (${currentPlayers}/${maxPlayers})`);
          ctx.status = 409;
          ctx.body = { 
            error: 'Match is full',
            message: 'La partita è già piena. Non è possibile unirsi.'
          };
          return;
        }
        
        // Verifica 2: Player con hasLeft=true (ha abbandonato volontariamente)
        if (bodyData && bodyData.playerID !== undefined) {
          const playerID = String(bodyData.playerID);
          
          try {
            // Recupera lo stato dal database
            const { state } = await server.db.fetch(matchID, { state: true });
            
            if (state && state.G && state.G.players && state.G.players[playerID]) {
              if (state.G.players[playerID].hasLeft === true) {
                console.log(`[SERVER] Join bloccato per ${matchID}: Player ${playerID} ha abbandonato (hasLeft=true)`);
                ctx.status = 403;
                ctx.body = {
                  error: 'Player has left',
                  message: 'Hai abbandonato questa partita. Non è possibile rientrare.'
                };
                return;
              }
            }
          } catch (stateError) {
            console.warn(`[SERVER] Impossibile verificare hasLeft per player ${playerID}:`, stateError.message);
            // Continua il join se non riesci a verificare (evita blocchi)
          }
        }
        
        console.log(`[SERVER] Join validato per ${matchID}: ${currentPlayers + 1}/${maxPlayers}`);
      }
    } catch (error) {
      console.error(`[SERVER] Errore validazione join:`, error);
      // In caso di errore, lascia passare per evitare blocchi
    }
  }
  
  await next();
};

// 5. Configurazione middleware sul server
// CORS middleware - DEVE essere il primo
server.app.use(cors());

// Aggiungi il middleware di validazione join
server.app.use(validateJoinMiddleware);

// Middleware per intercettare il leave di boardgame.io e impostare hasLeft=true
server.app.use(async (ctx, next) => {
  // Salva il path e method per dopo
  const isLeaveRequest = ctx.method === 'POST' && ctx.path.match(/\/games\/\w+\/[\w-]+\/leave/);
  
  if (isLeaveRequest) {
    const pathParts = ctx.path.split('/');
    const matchID = pathParts[pathParts.length - 2];
    
    // Lascia che boardgame.io gestisca il leave normalmente (popola ctx.request.body)
    await next();
    
    // Dopo che boardgame.io ha processato il leave, leggi il body parsato
    if (ctx.status === 200 && ctx.request.body && ctx.request.body.playerID !== undefined) {
      try {
        const playerID = ctx.request.body.playerID.toString();
        
        console.log(`[LEAVE] Player ${playerID} ha lasciato match ${matchID}`);
        
        // IMPOSTA hasLeft=true nel CTX (non in G!)
        const { state } = await server.db.fetch(matchID, { state: true });
        
        if (state && state.ctx) {
          console.log(`🤖 [LEAVE] Imposto ctx.hasLeft[${playerID}] = true`);
          
          // Inizializza ctx.hasLeft se non esiste (retrocompatibilità)
          if (!state.ctx.hasLeft) {
            state.ctx.hasLeft = {};
            for (let i = 0; i < state.ctx.numPlayers; i++) {
              state.ctx.hasLeft[String(i)] = false;
            }
          }
          
          state.ctx.hasLeft[playerID] = true;
          
          // Se il giocatore che abbandona è il currentPlayer, passa al prossimo turno
          if (state.ctx.currentPlayer === playerID) {
            console.log(`🔄 [LEAVE] Player ${playerID} abbandona durante il suo turno - passo al prossimo`);
            
            // Trova il prossimo giocatore attivo usando la stessa logica del TurnOrder
            const currentPos = state.ctx.playOrderPos;
            const numPlayers = state.ctx.numPlayers;
            let foundNext = false;
            
            for (let i = 1; i <= numPlayers; i++) {
              const nextPos = (currentPos + i) % numPlayers;
              const nextPlayer = state.ctx.playOrder[nextPos];
              
              // Se il prossimo giocatore non ha abbandonato, passa a lui
              if (!state.ctx.hasLeft[nextPlayer]) {
                state.ctx.currentPlayer = nextPlayer;
                state.ctx.playOrderPos = nextPos;
                state.ctx.turn = state.ctx.turn + 1;
                
                // Reset activePlayers per il nuovo turno
                state.ctx.activePlayers = null;
                
                // Se siamo nella fase INITIAL_REINFORCEMENT, reset turnPlacements
                if (state.ctx.phase === 'INITIAL_REINFORCEMENT') {
                  state.G.turnPlacements = [];
                  console.log(`✅ [LEAVE] INITIAL_REINFORCEMENT - Reset turnPlacements`);
                }
                
                // Se siamo nella fase GAME, reset stati e calcola rinforzi
                if (state.ctx.phase === 'GAME') {
                  state.G.attackState = null;
                  state.G.fortifyState = null;
                  state.G.battleResult = null;
                  state.G.turnPlacements = [];
                  
                  // Calcola rinforzi per il nuovo giocatore
                  const territoriesOwned = Object.values(state.G.owners).filter(
                    owner => owner === nextPlayer
                  ).length;
                  
                  let reinforcements = Math.max(3, Math.floor(territoriesOwned / 3));
                  
                  // Aggiungi bonus continenti (semplificato)
                  const CONTINENT_BONUSES = {
                    'NORD_AMERICA': 5,
                    'SUD_AMERICA': 2,
                    'EUROPA': 5,
                    'AFRICA': 3,
                    'ASIA': 7,
                    'OCEANIA': 2
                  };
                  
                  state.G.reinforcementsToPlace = state.G.reinforcementsToPlace || {};
                  state.G.reinforcementsToPlace[nextPlayer] = reinforcements;
                  
                  // Imposta stage reinforcement
                  state.ctx.activePlayers = { [nextPlayer]: 'reinforcement' };
                  
                  console.log(`✅ [LEAVE] GAME - Calcolati ${reinforcements} rinforzi per player ${nextPlayer}`);
                }
                
                console.log(`✅ [LEAVE] Turno passato a player ${nextPlayer} (pos ${nextPos}, turn ${state.ctx.turn})`);
                foundNext = true;
                break;
              }
            }
            
            if (!foundNext) {
              console.log(`⚠️ [LEAVE] Nessun giocatore attivo trovato dopo player ${playerID}`);
            }
          } else {
            console.log(`📌 [LEAVE] Player ${playerID} non è il currentPlayer (${state.ctx.currentPlayer}), nessun cambio turno`);
          }
          
          // Salva lo stato aggiornato
          await server.db.setState(matchID, state);
          
          // Ricarica lo stato dal database per ottenere _stateID aggiornato
          const { state: updatedState } = await server.db.fetch(matchID, { state: true });
          
          // Notifica i client via Socket.IO con lo stato aggiornato
          const io = server.app.context.io;
          if (io) {
            // Invia a tutti i client nella room del match
            io.in(matchID).emit('sync', matchID, updatedState);
            console.log(`📡 [LEAVE] Stato aggiornato notificato ai client (turn: ${updatedState.ctx.turn}, currentPlayer: ${updatedState.ctx.currentPlayer}, _stateID: ${updatedState._stateID})`);
            
            // Disconnetti forzatamente il socket del giocatore che abbandona
            // BoardGame.io usa room format: "{matchID}:{playerID}"
            const roomName = `${matchID}:${playerID}`;
            
            // Itera su tutti i socket connessi per trovare quelli nella room del player
            if (io.sockets && io.sockets.sockets) {
              io.sockets.sockets.forEach((socket) => {
                if (socket.rooms.has(roomName)) {
                  console.log(`🔌 [LEAVE] Disconnetto socket ${socket.id} per player ${playerID}`);
                  socket.disconnect(true);
                }
              });
            }
            
            console.log(`📡 [LEAVE] Player ${playerID} disconnesso - isConnected verrà aggiornato da BoardGame.io`);
          }
          
          // Controlla vittoria Last Man Standing
          const activePlayers = [];
          for (let i = 0; i < state.ctx.numPlayers; i++) {
            const pid = String(i);
            if (!state.ctx.hasLeft[pid]) {
              activePlayers.push(pid);
            }
          }
          
          console.log(`[LEAVE] Last Man Standing check: ${activePlayers.length} giocatori attivi su ${state.ctx.numPlayers}`);
          
          if (activePlayers.length === 1 && state.ctx.numPlayers > 1) {
            const winner = activePlayers[0];
            console.log(`🏆 [LEAVE] Last Man Standing - Winner: ${winner}`);
            state.ctx.gameover = { winner };
            await server.db.setState(matchID, state);
            
            // Ricarica lo stato aggiornato
            const { state: gameoverState } = await server.db.fetch(matchID, { state: true });
            
            // Notifica gameover ai client via Socket.IO
            if (io) {
              io.in(matchID).emit('sync', matchID, gameoverState);
              console.log(`📡 [LEAVE-GAMEOVER] Vittoria notificata ai client via Socket.IO`);
            }
            
            // Aggiorna Firestore per notificare frontend
            const docRef = firestore.collection('matches').doc(matchID);
            await docRef.update({ status: 'FINISHED' });
          }
        }
        
        // SINCRONIZZA FIRESTORE
        const metadata = await server.db.getMetadata(matchID);
        
        if (metadata) {
          // Estrai i giocatori attivi
          const playersArray = Object.values(metadata.players || {})
            .filter(p => p && p.name)
            .map(p => ({
              id: p.id,
              name: p.name,
              avatar: p.data?.avatar || "",
              isHost: p.id === 0
            }));
          
          const docRef = firestore.collection('matches').doc(matchID);
          
          // Se non ci sono più giocatori, elimina il match
          if (playersArray.length === 0) {
            console.log(`[SERVER] Nessun giocatore rimasto, eliminazione match ${matchID}`);
            await docRef.delete();
            await rtdb.ref(`matches/${matchID}`).remove();
          } else {
            // Aggiorna il contatore giocatori in Firestore
            await docRef.update({
              playersCurrent: playersArray.length,
              players: playersArray
            });
            console.log(`[SERVER] Match ${matchID} aggiornato dopo leave: ${playersArray.length} giocatori rimanenti`);
          }
        }
      } catch (error) {
        console.error(`[SERVER] Errore sincronizzazione dopo leave:`, error);
      }
    }
  } else {
    await next();
  }
});

server.run(8000, () => {
  console.log("🚀 SERVER RISIKO ATTIVO");
  
  // Accesso al socket.io per gestire disconnessioni custom
  if (server.app && server.app.context && server.app.context.io) {
    const io = server.app.context.io;
    
    // Map per tracciare i timeout di disconnessione
    const disconnectTimers = new Map();
    
    io.on('connection', (socket) => {
      console.log(`[SOCKET] Client connesso: ${socket.id}`);
      
    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnesso: ${socket.id}`);
      
      // Estrai matchID e playerID dai rooms del socket
      // BoardGame.io usa room names come "{matchID}:{playerID}"
      const rooms = Array.from(socket.rooms);
      const gameRoom = rooms.find(r => r.includes(':'));
      
      if (!gameRoom) {
        console.log(`[SOCKET] Nessuna room game trovata per ${socket.id}`);
        return;
      }
      
      const [matchID, playerID] = gameRoom.split(':');
      console.log(`[DISCONNECT] Player ${playerID} disconnesso da match ${matchID}`);
        
        // Cancella eventuali timer precedenti per questo player
        const timerKey = `${matchID}:${playerID}`;
        if (disconnectTimers.has(timerKey)) {
          clearTimeout(disconnectTimers.get(timerKey));
        }
        
        // Imposta timeout di 12 secondi per permettere refresh
        const timer = setTimeout(async () => {
          console.log(`[DISCONNECT] Timeout scaduto per player ${playerID} in match ${matchID}`);
          
          try {
            // Recupera metadata per verificare se player è ancora disconnesso
            const metadata = await server.db.getMetadata(matchID);
            
            if (!metadata || !metadata.players || !metadata.players[playerID]) {
              console.log(`[DISCONNECT] Player ${playerID} non trovato nei metadata`);
              disconnectTimers.delete(timerKey);
              return;
            }
            
            const playerMeta = metadata.players[playerID];
            
            // Se il player si è riconnesso nel frattempo, annulla
            if (playerMeta.isConnected) {
              console.log(`[DISCONNECT] Player ${playerID} si è riconnesso, timeout annullato`);
              disconnectTimers.delete(timerKey);
              return;
            }
            
            // Recupera lo stato di gioco
            const { state } = await server.db.fetch(matchID, { state: true });
            
            if (!state || !state.ctx) {
              console.log(`[DISCONNECT] Stato gioco non valido per match ${matchID}`);
              disconnectTimers.delete(timerKey);
              return;
            }
            
            // Inizializza ctx.hasLeft se non esiste
            if (!state.ctx.hasLeft) {
              state.ctx.hasLeft = {};
              for (let i = 0; i < state.ctx.numPlayers; i++) {
                state.ctx.hasLeft[String(i)] = false;
              }
            }
            
            // Verifica se il player ha già abbandonato (hasLeft)
            if (state.ctx.hasLeft[playerID]) {
              console.log(`[DISCONNECT] Player ${playerID} ha già flag ctx.hasLeft=true`);
              disconnectTimers.delete(timerKey);
              return;
            }
            
            // PLAYER DEFINITIVAMENTE DISCONNESSO: Imposta hasLeft=true
            console.log(`[DISCONNECT] Player ${playerID} definitivamente disconnesso`);
            
            state.ctx.hasLeft[playerID] = true;
            
            // Salva lo stato aggiornato
            await server.db.setState(matchID, state);
            
            // Ricarica lo stato dal database per ottenere _stateID aggiornato
            const { state: disconnectState } = await server.db.fetch(matchID, { state: true });
            
            // Notifica i client via Socket.IO
            io.in(matchID).emit('sync', matchID, disconnectState);
            console.log(`📡 [DISCONNECT] Stato notificato ai client via Socket.IO`);
            
            // Controlla vittoria Last Man Standing
            const activePlayers = [];
            for (let i = 0; i < state.ctx.numPlayers; i++) {
              const pid = String(i);
              if (!state.ctx.hasLeft[pid]) {
                activePlayers.push(pid);
              }
            }
            
            if (activePlayers.length === 1 && state.ctx.numPlayers > 1) {
              const winner = activePlayers[0];
              console.log(`🏆 [DISCONNECT] Last Man Standing - Winner: ${winner}`);
              state.ctx.gameover = { winner };
              await server.db.setState(matchID, state);
              
              // Ricarica lo stato aggiornato
              const { state: gameoverState } = await server.db.fetch(matchID, { state: true });
              
              // Notifica gameover ai client via Socket.IO
              io.in(matchID).emit('sync', matchID, gameoverState);
              console.log(`📡 [DISCONNECT-GAMEOVER] Vittoria notificata ai client via Socket.IO`);
            }
            
            disconnectTimers.delete(timerKey);
            
          } catch (error) {
            console.error(`[DISCONNECT] Errore gestione timeout per ${playerID}:`, error);
            disconnectTimers.delete(timerKey);
          }
        }, 12000); // 12 secondi di timeout
        
        disconnectTimers.set(timerKey, timer);
        console.log(`[DISCONNECT] Timer di 12s avviato per player ${playerID}`);
      });
    });
    
    console.log('✅ [SOCKET] Listener disconnect handler configurato');
  } else {
    console.warn('⚠️ [SOCKET] Socket.IO non disponibile - disconnect handler non configurato');
  }
  
});