// server.js
const { Server, Origins } = require('boardgame.io/server');
const { RiskGame } = require('./src/game'); 
// 1. Importiamo Firestore di Admin (per inizializzare il DB)
const { Firestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// 2. CORREZIONE IMPORTANTE:
// La libreria esporta 'Firestore', ma noi la rinominiamo 'FirebaseAdapter'
// per non fare confusione con quella sopra.
const { Firestore: FirebaseAdapter } = require('bgio-firebase');

const serviceAccount = require('./serviceAccountKey.json'); 

// 3. Inizializza Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// 4. Configura l'Adapter usando la classe rinominata
const firebaseAdapter = new FirebaseAdapter({
  firestore: db,
  root: 'matches', 
});

const server = Server({
  games: [RiskGame],
  origins: [Origins.LOCALHOST], 
  db: firebaseAdapter, 
});

server.run(8000, () => {
  console.log("🚀 SERVER RISIKO ATTIVO sulla porta 8000 (Connesso a Firebase)");
});