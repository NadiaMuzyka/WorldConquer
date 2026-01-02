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

// 3. Avvio Server
const server = Server({
  games: [RiskGame],
  
  // Per produzione sostituisci con il dominio reale o process.env.ORIGINS
  origins: [Origins.LOCALHOST], 

  // Passiamo le istanze al costruttore dell'Adapter
  db: new FirebaseAdapter(rtdb, firestore),
});

server.run(8000, () => {
  console.log("🚀 SERVER RISIKO ATTIVO (Modular Adapter)");
});