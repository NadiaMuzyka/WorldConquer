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

// 3. Middleware per validare il join prima di eseguirlo
const validateJoinMiddleware = async (req, res, next) => {
  // Intercetta solo le richieste POST a /games/{gameName}/{matchID}/join
  if (req.method === 'POST' && req.path.includes('/join')) {
    const pathParts = req.path.split('/');
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
          return res.status(409).json({ 
            error: 'Match is full',
            message: 'La partita è già piena. Non è possibile unirsi.'
          });
        }
        
        console.log(`[SERVER] Join validato per ${matchID}: ${currentPlayers + 1}/${maxPlayers}`);
      }
    } catch (error) {
      console.error(`[SERVER] Errore validazione join:`, error);
      // In caso di errore, lascia passare per evitare blocchi
    }
  }
  
  next();
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