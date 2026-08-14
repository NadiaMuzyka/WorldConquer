import React, { useState } from 'react';
import { GameProvider } from '../context/GameContext';
import { RiskBoardContent } from '../RiskBoard';
import { CONTINENTS_DATA } from '../components/Constants/mapData';

// Funzione helper per assegnare territori ai giocatori in modo pseudo-casuale
const generateMockOwners = () => {
  const owners = {};
  const troops = {};
  const players = ['0', '1', '2'];
  let i = 0;
  
  Object.values(CONTINENTS_DATA).forEach(continent => {
    continent.forEach(country => {
      const owner = players[i % players.length];
      owners[country.id] = owner;
      troops[country.id] = Math.floor(Math.random() * 5) + 1;
      i++;
    });
  });
  
  return { owners, troops };
};

const mockTerritories = generateMockOwners();

const mockG = {
  players: {
    '0': { 
      name: 'Leonardo', 
      cards: [{ id: 'card1', type: 'carrarmato', territory: 'alaska' }, { id: 'card2', type: 'cannone', territory: 'brazil' }],
      secretObjective: { description: 'Conquista 24 territori a tua scelta.' }
    },
    '1': { name: 'Player2', cards: [] },
    '2': { name: 'Player3', cards: [] }
  },
  owners: mockTerritories.owners,
  troops: mockTerritories.troops,
  attackState: null,
  fortifyState: null,
  battleResult: null
};

const mockCtx = {
  numPlayers: 3,
  turn: 1,
  currentPlayer: '0',
  phase: 'GAME',
  activePlayers: { '0': 'attack' },
  gameover: null,
  matchID: 'mock-123'
};

const mockMatchData = {
  players: [
    { id: 0, name: 'Leonardo', photoURL: 'https://ui-avatars.com/api/?name=L&background=random' },
    { id: 1, name: 'Player2', photoURL: 'https://ui-avatars.com/api/?name=P2&background=random' },
    { id: 2, name: 'Player3', photoURL: 'https://ui-avatars.com/api/?name=P3&background=random' }
  ]
};

const mockMoves = {
  resetAttackSelection: () => console.log('Mock move: resetAttackSelection'),
  exchangeCards: (cards) => console.log('Mock move: exchangeCards', cards),
  leaveMatch: () => console.log('Mock move: leaveMatch')
};

const MockGamePage = () => {
  // Stato per la fase corrente
  const [currentStage, setCurrentStage] = useState('attack');
  
  // Stato per i messaggi chat dinamici
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Sistema', message: 'Benvenuto nel mock della partita WorldConquer!', timestamp: Date.now() - 60000 },
    { sender: '1', message: 'Buona fortuna a tutti!', timestamp: Date.now() - 30000 },
    { sender: '2', message: 'Pronto a conquistare l\'Asia! ⚔️', timestamp: Date.now() - 10000 }
  ]);

  // Stato carte personalizzabile
  const [playerCards, setPlayerCards] = useState([
    { id: 'card1', type: 'INFANTRY', territory: 'alaska' },
    { id: 'card2', type: 'CAVALRY', territory: 'brazil' },
    { id: 'card3', type: 'ARTILLERY', territory: 'china' }
  ]);

  const handleSendMessage = (msgObj) => {
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: msgObj.sender || '0',
      message: msgObj.message,
      timestamp: msgObj.timestamp || Date.now()
    }]);
  };

  const simulateBotMessage = () => {
    const bots = ['1', '2'];
    const botId = bots[Math.floor(Math.random() * bots.length)];
    const sampleMsgs = [
      'Stai attento al mio attacco!',
      'Niente male questa mossa... 🎯',
      'Attacco l\'Europa subito! ⚔️',
      'Mi servono rinforzi in Africa! 🚩',
      '😂 Buona fortuna!'
    ];
    const randomText = sampleMsgs[Math.floor(Math.random() * sampleMsgs.length)];
    handleSendMessage({ sender: botId, message: randomText, timestamp: Date.now() });
  };

  const setPresetCards = (type) => {
    if (type === 'INFANTRY_SET') {
      setPlayerCards([
        { id: 'c1', type: 'INFANTRY', territory: 'alaska' },
        { id: 'c2', type: 'INFANTRY', territory: 'brazil' },
        { id: 'c3', type: 'INFANTRY', territory: 'china' }
      ]);
    } else if (type === 'MIXED_SET') {
      setPlayerCards([
        { id: 'c1', type: 'INFANTRY', territory: 'alaska' },
        { id: 'c2', type: 'CAVALRY', territory: 'brazil' },
        { id: 'c3', type: 'ARTILLERY', territory: 'china' }
      ]);
    } else if (type === 'JOLLY_SET') {
      setPlayerCards([
        { id: 'c1', type: 'JOLLY', territory: 'wildcard' },
        { id: 'c2', type: 'CAVALRY', territory: 'brazil' },
        { id: 'c3', type: 'CAVALRY', territory: 'china' }
      ]);
    } else {
      setPlayerCards([]);
    }
  };

  const customCtx = {
    ...mockCtx,
    activePlayers: { '0': currentStage }
  };

  const customG = {
    ...mockG,
    players: {
      ...mockG.players,
      '0': {
        ...mockG.players['0'],
        cards: playerCards
      }
    }
  };

  return (
    <div className="w-full h-screen relative bg-[#173C55]">
      {/* Dev toolbar esteso */}
      <div className="absolute top-24 left-4 z-[100] bg-black/90 p-3 flex flex-col gap-2 rounded-2xl border border-white/20 shadow-2xl origin-top-left scale-[0.70] md:scale-75 lg:scale-75 xl:scale-[0.85] 2xl:scale-100 min-[1920px]:scale-125 w-44 backdrop-blur-xl">
        <div className="text-white text-xs font-bold text-center border-b border-white/20 pb-1">DEV TOOLS</div>
        
        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Fasi Gioco</div>
        <button onClick={() => setCurrentStage('reinforcement')} className="text-white text-[11px] px-2 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold">Rinforzi</button>
        <button onClick={() => setCurrentStage('attack')} className="text-white text-[11px] px-2 py-1 bg-red-600 rounded-lg hover:bg-red-700 font-semibold">Attacco</button>
        <button onClick={() => setCurrentStage('strategicMovement')} className="text-white text-[11px] px-2 py-1 bg-green-600 rounded-lg hover:bg-green-700 font-semibold">Spostamento</button>

        <div className="text-[10px] text-gray-400 font-bold uppercase mt-2">Test Carte</div>
        <button onClick={() => setPresetCards('MIXED_SET')} className="text-gray-900 text-[11px] px-2 py-1 bg-[#FEC417] rounded-lg hover:bg-yellow-400 font-bold">Tris Misto (+10)</button>
        <button onClick={() => setPresetCards('INFANTRY_SET')} className="text-gray-900 text-[11px] px-2 py-1 bg-[#FEC417] rounded-lg hover:bg-yellow-400 font-bold">3 Fanti (+6)</button>
        <button onClick={() => setPresetCards('JOLLY_SET')} className="text-gray-900 text-[11px] px-2 py-1 bg-[#FEC417] rounded-lg hover:bg-yellow-400 font-bold">Jolly Set (+12)</button>

        <div className="text-[10px] text-gray-400 font-bold uppercase mt-2">Test Chat</div>
        <button onClick={simulateBotMessage} className="text-white text-[11px] px-2 py-1 bg-[#38C7D7] text-gray-900 rounded-lg hover:bg-cyan-400 font-bold">Simula Msg Bot 💬</button>
      </div>
      
      <GameProvider 
        G={customG} 
        ctx={customCtx} 
        moves={mockMoves} 
        playerID="0" 
        events={{}} 
        chatMessages={chatMessages}
        sendChatMessage={handleSendMessage}
      >
        <RiskBoardContent bgioMatchData={mockMatchData} isMock={true} />
      </GameProvider>
    </div>
  );
};

export default MockGamePage;
