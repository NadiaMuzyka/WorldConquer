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
      let bodyData = null;
      if (ctx.request.body) {
        bodyData = ctx.request.body;
      }
      
      const docRef = firestore.collection('matches').doc(matchID);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const matchData = doc.data();
        const currentPlayers = matchData.playersCurrent || 0;
        const maxPlayers = matchData.playersMax || 6;
        
        if (currentPlayers >= maxPlayers) {
          console.log(`[SERVER] Join bloccato per ${matchID}: partita piena (${currentPlayers}/${maxPlayers})`);
          ctx.status = 409;
          ctx.body = { 
            error: 'Match is full',
            message: 'La partita è già piena. Non è possibile unirsi.'
          };
          return;
        }
        
        if (bodyData && bodyData.playerID !== undefined) {
          const playerID = String(bodyData.playerID);
          
          try {
            const { state } = await server.db.fetch(matchID, { state: true });
            
            if (state && state.G && state.G.players && state.G.players[playerID]) {
              // Verifica se il giocatore ha già abbandonato nel G o nel ctx
              const hasLeftInG = state.G.players[playerID].hasLeft === true;
              const hasLeftInCtx = state.ctx.hasLeft && state.ctx.hasLeft[playerID] === true;

              if (hasLeftInG || hasLeftInCtx) {
                console.log(`[SERVER] Join bloccato per ${matchID}: Player ${playerID} ha abbandonato`);
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
          }
        }
      }
    } catch (error) {
      console.error(`[SERVER] Errore validazione join:`, error);
    }
  }
  
  await next();
};

// 5. Configurazione middleware sul server
server.app.use(cors());
server.app.use(validateJoinMiddleware);

// Middleware per intercettare il leave e gestire il cambio turno immediato
server.app.use(async (ctx, next) => {
  const isLeaveRequest = ctx.method === 'POST' && ctx.path.match(/\/games\/\w+\/[\w-]+\/leave/);
  
  if (isLeaveRequest) {
    const pathParts = ctx.path.split('/');
    const matchID = pathParts[pathParts.length - 2];
    
    await next();
    
    if (ctx.status === 200 && ctx.request.body && ctx.request.body.playerID !== undefined) {
      try {
        const playerID = ctx.request.body.playerID.toString();
        const { state } = await server.db.fetch(matchID, { state: true });
        
        if (state && state.ctx) {
          // Inizializza hasLeft
          if (!state.ctx.hasLeft) {
            state.ctx.hasLeft = {};
            for (let i = 0; i < state.ctx.numPlayers; i++) {
              state.ctx.hasLeft[String(i)] = false;
            }
          }
          
          state.ctx.hasLeft[playerID] = true;
          
          // Gestione cambio turno immediato se chi esce è il currentPlayer
          if (state.ctx.currentPlayer === playerID) {
            const currentPos = state.ctx.playOrderPos;
            const numPlayers = state.ctx.numPlayers;
            
            for (let i = 1; i <= numPlayers; i++) {
              const nextPos = (currentPos + i) % numPlayers;
              const nextPlayer = state.ctx.playOrder[nextPos];
              
              if (!state.ctx.hasLeft[nextPlayer]) {
                state.ctx.currentPlayer = nextPlayer;
                state.ctx.playOrderPos = nextPos;
                state.ctx.turn = state.ctx.turn + 1;
                state.ctx.activePlayers = null;
                break;
              }
            }
          }

          // Check Last Man Standing
          const activePlayers = Object.keys(state.ctx.hasLeft).filter(pid => !state.ctx.hasLeft[pid]);
          if (activePlayers.length === 1 && state.ctx.numPlayers > 1) {
            state.ctx.gameover = { winner: activePlayers[0] };
            const docRef = firestore.collection('matches').doc(matchID);
            await docRef.update({ status: 'FINISHED' });
          }
          
          await server.db.setState(matchID, state);
          
          // Sincronizzazione Real-Time via Socket.IO
          const io = server.app.context.io;
          if (io) {
            const { state: updatedState } = await server.db.fetch(matchID, { state: true });
            io.in(matchID).emit('sync', matchID, updatedState);
          }
        }
      } catch (error) {
        console.error(`[SERVER] Errore gestione leave:`, error);
      }
    }
  } else {
    await next();
  }
});

server.run(8000, () => {
  console.log("🚀 SERVER RISIKO ATTIVO");
  
  if (server.app && server.app.context && server.app.context.io) {
    const io = server.app.context.io;
    const disconnectTimers = new Map();
    
    io.on('connection', (socket) => {
      socket.on('disconnect', () => {
        const rooms = Array.from(socket.rooms);
        const gameRoom = rooms.find(r => r.includes(':'));
        if (!gameRoom) return;
        
        const [matchID, playerID] = gameRoom.split(':');
        const timerKey = `${matchID}:${playerID}`;
        
        if (disconnectTimers.has(timerKey)) clearTimeout(disconnectTimers.get(timerKey));
        
        const timer = setTimeout(async () => {
          try {
            const metadata = await server.db.getMetadata(matchID);
            if (!metadata || !metadata.players[playerID] || metadata.players[playerID].isConnected) return;
            
            const { state } = await server.db.fetch(matchID, { state: true });
            if (!state || !state.ctx) return;
            
            if (!state.ctx.hasLeft) {
              state.ctx.hasLeft = {};
              for (let i = 0; i < state.ctx.numPlayers; i++) state.ctx.hasLeft[String(i)] = false;
            }
            
            if (state.ctx.hasLeft[playerID]) return;
            
            state.ctx.hasLeft[playerID] = true;
            await server.db.setState(matchID, state);
            
            const { state: updatedState } = await server.db.fetch(matchID, { state: true });
            io.in(matchID).emit('sync', matchID, updatedState);
            
          } catch (error) {
            console.error(`[DISCONNECT] Errore:`, error);
          }
        }, 12000);
        
        disconnectTimers.set(timerKey, timer);
      });
    });
  }
});