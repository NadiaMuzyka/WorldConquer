// server.js
const { Server, Origins } = require('boardgame.io/server');
const { RiskGame } = require('./src/game');
const admin = require('firebase-admin');
// Prova prima il percorso specifico di Render, se non esiste usa quello locale
const serviceAccount = process.env.RENDER 
  ? require('/etc/secrets/serviceAccountKey.json') 
  : require('./serviceAccountKey.json');
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

// 3. Middleware Koa per validare il join prima di eseguirlo
const validateJoinMiddleware = async (ctx, next) => {
  // Intercetta solo le richieste POST a /games/{gameName}/{matchID}/join
  if (ctx.method === 'POST' && ctx.path.includes('/join')) {
    const pathParts = ctx.path.split('/');
    const matchID = pathParts[pathParts.length - 2];
    
    try {
      const docRef = firestore.collection('matches').doc(matchID);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const matchData = doc.data();
        const currentPlayers = matchData.playersCurrent || 0;
        const maxPlayers = matchData.playersMax || 6;
        
        // Verifica solo se la partita è piena
        // NON leggiamo il body per evitare di consumare lo stream
        if (currentPlayers >= maxPlayers) {
          console.log(`[SERVER] Join bloccato per ${matchID}: partita piena (${currentPlayers}/${maxPlayers})`);
          ctx.status = 409;
          ctx.body = { 
            error: 'Match is full',
            message: 'La partita è già piena. Non è possibile unirsi.'
          };
          return; // Non chiamare next() per bloccare la richiesta
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

// 4. Avvio Server con middleware
const server = Server({
  games: [RiskGame],
  
  // MODIFICA QUI:
  origins: [
    Origins.LOCALHOST, 
    "https://worldconquer-static.onrender.com" // <--- Sostituisci con l'URL del tuo sito React
  ], 

  // Passiamo le istanze al costruttore dell'Adapter
  db: new FirebaseAdapter(rtdb, firestore),
});

// CORS middleware - DEVE essere il primo
server.app.use(cors());

// Aggiungi il middleware PRIMA di avviare il server
server.app.use(validateJoinMiddleware);

// Middleware per intercettare il leave di boardgame.io e sincronizzare Firestore
server.app.use(async (ctx, next) => {
  // Salva il path e method per dopo
  const isLeaveRequest = ctx.method === 'POST' && ctx.path.match(/\/games\/\w+\/[\w-]+\/leave/);
  
  if (isLeaveRequest) {
    const pathParts = ctx.path.split('/');
    const matchID = pathParts[pathParts.length - 2];
    
    // Lascia che boardgame.io gestisca il leave normalmente
    await next();
    
    // Dopo che boardgame.io ha processato il leave, sincronizza Firestore
    if (ctx.status === 200) {
      try {
        // Leggi i metadati aggiornati da boardgame.io
        const metadata = await server.db.getMetadata(matchID);
        
        if (metadata) {
          // Estrai i giocatori attivi
          const playersArray = Object.values(metadata.players || {})
            .filter(p => p && p.name)
            .map(p => ({
              id: p.id,
              name: p.name,
              avatar: p.data?.avatar || "",
              isHost: p.id === 0 // Il primo player è l'host
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
        console.error(`[SERVER] Errore sincronizzazione Firestore dopo leave:`, error);
      }
    }
  } else {
    await next();
  }
});

// Deve essere server.run e non server.listen (visto che usi boardgame.io)
const PORT = process.env.PORT || 8000;
server.run(PORT, () => {
  console.log(`🚀 SERVER ATTIVO sulla porta ${PORT}`);
});