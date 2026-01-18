// server.js
const { Server, Origins } = require('boardgame.io/server');
const { RiskGame } = require('./src/game');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const FirebaseAdapter = require('./FirebaseAdapter'); // <--- Importiamo la classe
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
          
          // Salva lo stato aggiornato
          await server.db.setState(matchID, state);
          console.log(`✅ [BOT] Player ${playerID} convertito in Bot - ctx.hasLeft[${playerID}]=true salvato`);
          
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
            
            // PLAYER DEFINITIVAMENTE DISCONNESSO: Forza hasLeft=true
            console.log(`🤖 [DISCONNECT] Player ${playerID} definitivamente disconnesso - subentra Bot AI`);
            
            state.ctx.hasLeft[playerID] = true;
            
            // Salva lo stato aggiornato
            await server.db.setState(matchID, state);
            
            console.log(`✅ [BOT] Player ${playerID} convertito in Bot - ctx.hasLeft[${playerID}]=true salvato`);
            
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
  
  // BOT AI AUTO-PLAY SYSTEM
  // Monitora tutte le partite attive e fa giocare i bot automaticamente
  const botPlayInterval = setInterval(async () => {
    try {
      // Ottieni lista di tutte le partite attive
      const matchesSnapshot = await firestore.collection('matches')
        .where('status', '==', 'PLAYING')
        .get();
      
      // Se non ci sono partite attive, skippa
      if (matchesSnapshot.empty) return;
      
      for (const matchDoc of matchesSnapshot.docs) {
        const matchID = matchDoc.id;
        
        try {
          // Verifica che il match esista prima di fetchare
          const matchData = matchDoc.data();
          if (!matchData) {
            console.warn(`[BOT-AI] Match ${matchID} senza dati, skip`);
            continue;
          }
          
          // Recupera lo stato della partita
          const fetchResult = await server.db.fetch(matchID, { state: true });
          
          // Se lo stato non esiste, skippa (match probabilmente terminato)
          if (!fetchResult || !fetchResult.state) {
            // Aggiorna status in Firestore se mismatch
            if (matchData.status === 'PLAYING') {
              await firestore.collection('matches').doc(matchID).update({ status: 'FINISHED' });
              console.log(`[BOT-AI] Match ${matchID} senza stato - marcato FINISHED`);
            }
            continue;
          }
          
          const { state } = fetchResult;
          
          if (!state || !state.ctx || !state.G) continue;
          
          // Se la partita è finita, aggiorna Firestore e skippa
          if (state.ctx.gameover) {
            if (matchData.status !== 'FINISHED') {
              await firestore.collection('matches').doc(matchID).update({ status: 'FINISHED' });
              console.log(`[BOT-AI] Match ${matchID} terminato - status aggiornato`);
            }
            continue;
          }
          
          const { ctx, G } = state;
          const currentPlayer = ctx.currentPlayer;
          
          // Verifica se il giocatore corrente è un bot (usa ctx.hasLeft)
          if (!ctx.hasLeft || !ctx.hasLeft[currentPlayer]) continue;
          
          // È un bot! Esegui la sua mossa
          console.log(`🤖 [BOT-AI] Player ${currentPlayer} è un bot - eseguo mossa automatica`);
          
          // Chiama enumerate per ottenere le mosse possibili
          const aiMoves = RiskGame.ai.enumerate(G, ctx);
          
          if (aiMoves.length === 0) {
            console.warn(`⚠️ [BOT-AI] Nessuna mossa disponibile per bot ${currentPlayer}`);
            continue;
          }
          
          // Prendi la prima mossa (l'AI restituisce già la mossa migliore/casuale)
          const { move: moveName, args } = aiMoves[0];
          
          console.log(`🎮 [BOT-AI] Eseguo mossa: ${moveName}(${args?.join(', ') || ''})`);
          
          // Delay breve per evitare race conditions
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // USA BoardGame.io lobbyAPI per eseguire la mossa
          try {
            // Ottieni l'istanza del match dal database
            const matchInstance = await server.db.fetch(matchID, { state: true, metadata: true });
            
            if (!matchInstance || !matchInstance.state) {
              console.error(`⚠️ [BOT-AI] Match ${matchID} non trovato`);
              continue;
            }
            
            // Esegui la mossa usando la game logic di BoardGame.io
            const game = RiskGame;
            let move = null;
            
            // Cerca la move prima a livello globale, poi nelle phases
            if (game.moves && game.moves[moveName]) {
              move = game.moves[moveName];
            } else if (matchInstance.state.ctx.phase && game.phases && game.phases[matchInstance.state.ctx.phase]) {
              const currentPhase = game.phases[matchInstance.state.ctx.phase];
              if (currentPhase.moves && currentPhase.moves[moveName]) {
                move = currentPhase.moves[moveName];
              }
            }
            
            if (!move) {
              console.error(`⚠️ [BOT-AI] Move ${moveName} non trovata nella fase ${matchInstance.state.ctx.phase}`);
              continue;
            }
            
            // Crea un contesto mock per la move
            const { G, ctx } = matchInstance.state;
            const events = {
              endGame: (result) => {
                matchInstance.state.ctx.gameover = result;
              },
              endTurn: () => {
                // Passa al prossimo giocatore
                const nextPlayer = (parseInt(currentPlayer) + 1) % ctx.numPlayers;
                matchInstance.state.ctx.currentPlayer = String(nextPlayer);
                matchInstance.state.ctx.turn = (matchInstance.state.ctx.turn || 0) + 1;
              },
              setActivePlayers: (config) => {
                matchInstance.state.ctx.activePlayers = config;
              },
              endPhase: () => {
                // Implementa se necessario
              },
              setPhase: (phaseName) => {
                matchInstance.state.ctx.phase = phaseName;
              }
            };
            
            // Esegui la move (passa il contesto completo)
            const moveToExecute = typeof move === 'function' ? move : move.move;
            moveToExecute({ G, ctx, playerID: currentPlayer, events }, ...(args || []));
            
            // Salva lo stato aggiornato
            await server.db.setState(matchID, matchInstance.state);
            console.log(`✅ [BOT-AI] Mossa ${moveName} eseguita - stato salvato`);
            
          } catch (botError) {
            console.error(`⚠️ [BOT-AI] Errore esecuzione mossa:`, botError.message);
          }
          
        } catch (matchError) {
          console.error(`[BOT-AI] Errore processando match ${matchID}:`, matchError.message);
        }
      }
      
    } catch (error) {
      console.error('[BOT-AI] Errore nel bot play interval:', error);
    }
  }, 2000); // Controlla ogni 2 secondi
  
  console.log('✅ [BOT-AI] Sistema auto-play bot attivato (check ogni 2s)');
  
  // Cleanup interval on server shutdown
  process.on('SIGINT', () => {
    clearInterval(botPlayInterval);
    console.log('🛑 [BOT-AI] Sistema auto-play fermato');
    process.exit(0);
  });
  
});