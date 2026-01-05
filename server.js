// server.js
const { Server, Origins } = require('boardgame.io/server');
const { RiskGame } = require('./src/game');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const FirebaseAdapter = require('./FirebaseAdapter'); // <--- Importiamo la classe

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
        
        // Verifica che ci sia ancora spazio
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
  
  // Per produzione sostituisci con il dominio reale o process.env.ORIGINS
  origins: [Origins.LOCALHOST], 

  // Passiamo le istanze al costruttore dell'Adapter
  db: new FirebaseAdapter(rtdb, firestore),
});

// Aggiungi il middleware PRIMA di avviare il server
server.app.use(validateJoinMiddleware);

server.run(8000, () => {
  console.log("🚀 SERVER RISIKO ATTIVO (Modular Adapter + Join Validation)");
});