<div align="center">

# 🌍 WorldConquer

### *Conquer the world, one territory at a time*

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Boardgame.io](https://img.shields.io/badge/Boardgame.io-Multiplayer-FF6B6B?style=for-the-badge)](https://boardgame.io/)

[**🎮 Play Now**](https://worldconquer.onrender.com) • [**📖 Rules**](#-how-to-play) • [**🚀 Features**](#-key-features)

</div>

---

## 🎯 What is WorldConquer?

**WorldConquer** is a **real-time multiplayer web application** that brings the classic board game **RISK** straight to your browser. Challenge your friends or players from all over the world in epic strategic battles for global domination!

Developed by three students of the **Master's Degree in Computer Engineering** at the University of L'Aquila with the goal of creating a smooth, modern, and accessible gaming experience.

### 👥 Who is WorldConquer for?

- ✅ **RISK Veterans** - Already know the game? Enjoy a modern, digitized version without having to set up physical boards and dice
- ✅ **New Players** - Never played RISK? No problem! We have a **dedicated rules section** accessible straight from the home page
- ✅ **Social Gamers** - Create **private matches** with passwords to play with friends or join **public matches** to challenge players worldwide
- ✅ **Digital Strategists** - Love strategy games? WorldConquer offers all the tactical fun of RISK with the convenience of the cloud

---

## ✨ Key Features

### 🔥 Cutting-edge Technology

#### **Real-Time React Frontend**
The entire application is built with **React 18**, ensuring a **responsive, smooth, and instant** user interface. Every move, every conquest, and every turn change is synchronized in **real-time** across all connected players.

#### **Modular and Scalable Architecture**
The codebase is **organized into reusable components**, easing maintenance, testing, and future updates. Each interface element is an independent component that can be easily modified or extended.

#### **Modern Design with Tailwind CSS**
We adopted **Tailwind CSS** to create a **clean, elegant, and responsive** interface.

### 🎮 Superior Gaming Experience

| Feature | Description |
|---------|-------------|
| ⚡ **Real-Time Synchronization** | Firebase Realtime Database + Firestore for instant game state updates |
| 🎲 **Smooth Animations** | Animated battles with 3D dice and sleek transitions |
| 🗺️ **Interactive Map** | Fully zoomable and navigable vector world map |
| 👤 **Account System** | Firebase Authentication via Email/Password and Google OAuth |
| 🏆 **Secret Objectives** | Each player receives a personalized secret objective for varied victory strategies |
| 💬 **In-Game Chat** | Communicate with other players during the match |
| 👥 **Presence System** | See who is online and connected to the match in real-time |
| 📊 **Personal Stats** | Track your wins, losses, and conquered territories |

### 🔐 Flexible Game Modes

- **🌐 Public Matches** - Join open games and challenge random players
- **🔒 Private Matches** - Create password-protected matches to play exclusively with your friends
- **⚙️ Customizable Settings** - Choose the number of players (3-6) and tweak game settings
- **⏱️ Auto-Timeouts** - Smart timeout system to handle AFK players without freezing the match

### 🏗️ Robust Infrastructure

- **Boardgame.io** - Professional multiplayer framework ensuring game state consistency
- **Firebase Backend** - 
  - **Realtime Database** for live game state
  - **Firestore** for lobbies, user profiles, and stats
  - **Authentication** for secure account management
- **Custom Firebase Adapter** - Tailored adapter connecting Boardgame.io with Firebase
- **Node.js Server** - Dedicated backend on Render handling game logic and WebSocket connections
- **Advanced Error Management** - Robust error handling UI and auto-retry to guarantee stability

### 🎨 High-quality UX/UI

- **Custom Avatars** - Each player can choose or generate their own avatar
- **Clear Visual Indicators** - Distinct colors for every player, turn indicators, visible timers
- **Immediate Visual Feedback** - Every action provides clear visual feedback (hover, clicks, selections)
- **Elegant Loading States** - Spinners and loading animations for a smooth UX
- **Intuitive Modals** - Clear interfaces for dice selection, card trading, and endgame screens

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase Account (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/youruser/worldconquer.git

# Enter the directory
cd worldconquer

# Install dependencies
npm install

# Configure environment variables
# Create a .env file with your Firebase credentials
cp .env.example .env

# Start the development server
npm start
```

The application will be available at `http://localhost:3000`

### Starting the Backend Server

```bash
# In a new terminal window
node server.js
```

The server will listen on port `8000` (or the port specified in `process.env.PORT`)

---

## 🎲 How to Play

WorldConquer follows the **classic RISK rules**:

1. **Objective** - Each player receives a secret objective (conquer continents, eliminate opponents, or control a set number of territories)
2. **Reinforcements** - At the start of each turn, you receive bonus troops based on controlled territories and continents
3. **Attack** - Attack adjacent enemy territories by rolling dice. The attacker can roll up to 3 dice, the defender up to 2
4. **Strategic Move** - At the end of the turn, shift your troops to fortify your positions
5. **Territory Cards** - Conquer at least one territory to receive a card. Trade a set of 3 cards for bonus troops
6. **Victory** - The first player to complete their secret objective wins the match!

> 💡 **Tip**: Check out the **Rules** section from the homepage for a complete, illustrated guide

---

## 🛠️ Technologies Used

### Frontend
- **React 18** - Modern and performant UI library
- **Redux Toolkit** - Centralized state management
- **React Router 6 (Data Mode)** - Declarative routing
- **Tailwind CSS** - CSS framework
- **Lucide React** - Clean and lightweight icons
- **Boardgame.io Client** - Multiplayer client

### Backend
- **Node.js** - JavaScript runtime
- **Boardgame.io Server** - Multiplayer framework
- **Koa** - Minimalist web framework
- **Firebase Admin SDK** - Firebase backend integration
- **Custom Firebase Adapter** - Persistent storage for Boardgame.io

### Database & Auth
- **Firebase Realtime Database** - Real-time game state
- **Cloud Firestore** - Lobbies, profiles, stats
- **Firebase Authentication** - User management with Email and Google OAuth

### DevOps & Hosting
- **Render** - Backend hosting
- **Git** - Version control

---

## 📂 Project Structure

```
worldconquer/
├── src/
│   ├── components/        # Reusable React components
│   │   ├── UI/           # Generic UI components (Button, Modal, Card, etc.)
│   │   ├── Map/          # Game map components
│   │   ├── Navbar/       # Navigation bar and match info
│   │   └── Lobby/        # Lobby and matchmaking components
│   ├── pages/            # Application pages
│   ├── firebase/         # Firebase configuration and utilities
│   ├── store/            # Redux store and slices
│   ├── client/           # Boardgame.io client and lobby
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── server.js             # Boardgame.io server
├── FirebaseAdapter.js    # Custom Boardgame.io database adapter for Firebase
├── game.js               # RISK game logic
└── gameHelpers.js        # Game helper functions
```

---

## 🤝 Contributing

This project was developed as part of a university project. If you wish to contribute or report a bug:

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Development Team

Developed by three students of the **Master's Degree in Computer Engineering**

---

## 📄 License

This project is licensed under the GNU Affero General Public License v3 - see the `LICENSE` file for details.

---



<div align="center">

**⭐ If you like WorldConquer, please leave a star on GitHub! ⭐**

[🎮 Start Playing](https://worldconquer.onrender.com)

</div>
