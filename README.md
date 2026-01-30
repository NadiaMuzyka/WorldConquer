<div align="center">

# 🌍 WorldConquer

### *Conquista il mondo, un territorio alla volta*

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Boardgame.io](https://img.shields.io/badge/Boardgame.io-Multiplayer-FF6B6B?style=for-the-badge)](https://boardgame.io/)

[**🎮 Gioca Ora**](https://worldconquer.onrender.com) • [**📖 Regole**](#-come-si-gioca) • [**🚀 Features**](#-caratteristiche-principali)

</div>

---

## 🎯 Cos'è WorldConquer?

**WorldConquer** è un'**applicazione web multiplayer real-time** che porta il classico gioco da tavolo **RISK** direttamente nel tuo browser. Sfida i tuoi amici o giocatori da tutto il mondo in epiche battaglie strategiche per la conquista del pianeta!

Sviluppata da tre studenti della **Magistrale in Ingegneria Informatica** dell'Università dell'Aquila con l'obiettivo di creare un'esperienza di gioco fluida, moderna e fruibile.

### 👥 Per chi è WorldConquer?

- ✅ **Veterani di RISK** - Conosci già il gioco? Goditi una versione moderna e digitalizzata senza dover configurare plance e dadi fisici
- ✅ **Nuovi giocatori** - Mai giocato a RISK? Nessun problema! Abbiamo una **sezione dedicata alle regole** accessibile direttamente dalla home
- ✅ **Giocatori sociali** - Crea **partite private** con password per giocare con amici o unisciti a **partite pubbliche** per sfidare giocatori da tutto il mondo
- ✅ **Strateghi digitali** - Ami i giochi di strategia? WorldConquer offre tutto il divertimento tattico di RISK con la comodità del cloud

---

## ✨ Caratteristiche Principali

### 🔥 Tecnologia All'Avanguardia

#### **Frontend Real-Time in React**
L'intera applicazione è costruita con **React 18**, garantendo un'interfaccia utente **reattiva, fluida e istantanea**. Ogni mossa, ogni conquista, ogni cambio di turno viene sincronizzato in **tempo reale** tra tutti i giocatori connessi.

#### **Architettura Modulare e Scalabile**
Il codice è **organizzato in componenti riutilizzabili**, facilitando manutenzione, testing e futuri aggiornamenti. Ogni elemento dell'interfaccia è un componente indipendente che può essere facilmente modificato o esteso.

#### **Design Moderno con Tailwind CSS**
Abbiamo adottato **Tailwind CSS** per creare un'interfaccia **pulita, elegante e responsive**. 

### 🎮 Esperienza di Gioco Superiore

| Feature | Descrizione |
|---------|-------------|
| ⚡ **Sincronizzazione Real-Time** | Firebase Realtime Database + Firestore per aggiornamenti istantanei dello stato di gioco |
| 🎲 **Animazioni Fluide** | Battaglie animate con dadi 3D e transizioni smooth |
| 🗺️ **Mappa Interattiva** | Mappa del mondo vettoriale completamente zoomabile e navigabile |
| 👤 **Sistema di Account** | Autenticazione Firebase con login Email/Password e Google OAuth |
| 🏆 **Obiettivi Segreti** | Ogni giocatore riceve un obiettivo segreto personalizzato per variare le strategie di vittoria |
| 💬 **Chat In-Game** | Comunica con gli altri giocatori durante la partita |
| 👥 **Sistema di Presenza** | Vedi in tempo reale chi è online e chi è connesso alla partita |
| 📊 **Statistiche Personali** | Traccia le tue vittorie, sconfitte e territori conquistati |

### 🔐 Modalità di Gioco Flessibili

- **🌐 Partite Pubbliche** - Unisciti a partite aperte e sfida giocatori casuali
- **🔒 Partite Private** - Crea partite protette da password per giocare solo con i tuoi amici
- **⚙️ Configurazione Personalizzabile** - Scegli il numero di giocatori (3-6) e personalizza le impostazioni di gioco
- **⏱️ Timeout Automatici** - Sistema intelligente di timeout per gestire giocatori AFK senza bloccare la partita

### 🏗️ Infrastruttura Robusta

- **Boardgame.io** - Framework multiplayer professionale per garantire coerenza dello stato di gioco
- **Firebase Backend** - 
  - **Realtime Database** per lo stato di gioco in tempo reale
  - **Firestore** per lobby, profili utenti e statistiche
  - **Authentication** per gestione sicura degli account
- **Custom Firebase Adapter** - Adapter personalizzato per integrare Boardgame.io con Firebase
- **Server Node.js** - Backend dedicato su Render per gestire la logica di gioco e le connessioni WebSocket
- **Gestione Errori Avanzata** - Sistema robusto di error handling e retry automatici per garantire stabilità

### 🎨 UX/UI di Qualità

- **Avatar Personalizzabili** - Ogni giocatore può scegliere o generare il proprio avatar
- **Indicatori Visivi Chiari** - Colori distintivi per ogni giocatore, indicatori di turno, timer visibili
- **Feedback Visivo Immediato** - Ogni azione produce un feedback visivo chiaro (hover, click, selezioni)
- **Loading States Eleganti** - Spinner e animazioni di caricamento per una UX fluida
- **Modal Intuitivi** - Interfacce chiare per selezione dadi, scambio carte, fine partita

---

## 🚀 Come Iniziare

### Prerequisiti

- Node.js (v14 o superiore)
- npm o yarn
- Account Firebase (per sviluppo locale)

### Installazione

```bash
# Clona il repository
git clone https://github.com/tuouser/worldconquer.git

# Entra nella directory
cd worldconquer

# Installa le dipendenze
npm install

# Configura le variabili d'ambiente
# Crea un file .env con le tue credenziali Firebase
cp .env.example .env

# Avvia il server di sviluppo
npm start
```

L'applicazione sarà disponibile su `http://localhost:3000`

### Avvio del Server Backend

```bash
# In una nuova finestra del terminale
node server.js
```

Il server sarà in ascolto sulla porta `8000` (o sulla porta specificata in `process.env.PORT`)

---

## 🎲 Come Si Gioca

WorldConquer segue le **regole classiche di RISK**:

1. **Obiettivo** - Ogni giocatore riceve un obiettivo segreto (conquistare continenti, eliminare avversari, o controllare un numero di territori)
2. **Rinforzi** - All'inizio di ogni turno, ricevi truppe bonus in base ai territori e continenti controllati
3. **Attacco** - Attacca territori adiacenti nemici lanciando i dadi. L'attaccante può usare fino a 3 dadi, il difensore fino a 2
4. **Spostamento Strategico** - Alla fine del turno, sposta le tue truppe per rafforzare le tue posizioni
5. **Carte Territorio** - Conquista almeno un territorio per ricevere una carta. Scambia 3 carte per truppe bonus
6. **Vittoria** - Il primo giocatore che completa il suo obiettivo segreto vince la partita!

> 💡 **Suggerimento**: Accedi alla sezione **Regole** dalla homepage per una guida completa e illustrata

---

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** - Libreria UI moderna e performante
- **Redux Toolkit** - State management centralizzato
- **React Router 6 (Data Mode)** - Routing dichiarativo
- **Tailwind CSS** - CSS framework
- **Lucide React** - Icone moderne e leggere
- **Boardgame.io Client** - Client multiplayer

### Backend
- **Node.js** - Runtime JavaScript
- **Boardgame.io Server** - Framework multiplayer
- **Koa** - Web framework minimalista
- **Firebase Admin SDK** - Integrazione backend Firebase
- **Custom Firebase Adapter** - Storage persistente per Boardgame.io

### Database & Auth
- **Firebase Realtime Database** - Stato di gioco in tempo reale
- **Cloud Firestore** - Lobby, profili, statistiche
- **Firebase Authentication** - Gestione utenti con Email e Google OAuth

### DevOps & Hosting
- **Render** - Hosting server backend
- **Git** - Version control

---

## 📂 Struttura del Progetto

```
worldconquer/
├── src/
│   ├── components/        # Componenti React riutilizzabili
│   │   ├── UI/           # Componenti UI generici (Button, Modal, Card, etc.)
│   │   ├── Map/          # Componenti della mappa di gioco
│   │   ├── Navbar/       # Barra di navigazione e info partita
│   │   └── Lobby/        # Componenti lobby e matchmaking
│   ├── pages/            # Pagine dell'applicazione
│   ├── firebase/         # Configurazione e utilità Firebase
│   ├── store/            # Redux store e slices
│   ├── client/           # Client Boardgame.io e lobby
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Funzioni di utilità
├── server.js             # Server Boardgame.io
├── FirebaseAdapter.js    # Adapter custom per Firebase
├── game.js               # Logica di gioco RISK
└── gameHelpers.js        # Funzioni helper per il gioco
```

---

## 🤝 Contributi

Questo progetto è stato sviluppato come parte di un progetto universitario. Se desideri contribuire o segnalare bug:

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 👨‍💻 Team di Sviluppo

Sviluppato da tre studenti della **Magistrale in Ingegneria Informatica**

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

---



<div align="center">

**⭐ Se ti piace WorldConquer, lascia una stella su GitHub! ⭐**

[🎮 Inizia a Giocare](https://worldconquer.onrender.com)

</div>
