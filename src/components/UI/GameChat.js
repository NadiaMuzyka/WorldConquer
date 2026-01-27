import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Send } from 'lucide-react';
import { IoIosChatboxes } from 'react-icons/io';
import { useRisk } from '../../context/GameContext';
import Card from './Card';
import Button from './Button';

const GameChat = ({ chatMessages = [], sendChatMessage }) => {
  const { playerID, G } = useRisk();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadIndex, setLastReadIndex] = useState(-1);
  const messagesEndRef = useRef(null);

  // Recupera il nome del giocatore corrente
  const playerName = G?.players?.[playerID]?.name || `Player ${playerID}`;

  // Auto-scroll ai nuovi messaggi
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
      setLastReadIndex(chatMessages.length - 1);
      setUnreadCount(0);
    }
  }, [chatMessages, isExpanded]);

  // Calcola messaggi non letti quando chat è chiusa
  useEffect(() => {
    if (!isExpanded && lastReadIndex < chatMessages.length - 1) {
      setUnreadCount(chatMessages.length - lastReadIndex - 1);
    }
  }, [chatMessages, lastReadIndex, isExpanded]);

  // Apri chat quando arrivano messaggi da chiusa
  const handleNotificationClick = () => {
    setIsExpanded(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && sendChatMessage) {
      sendChatMessage({
        message: newMessage,
        sender: playerName,
        timestamp: Date.now()
      });
      setNewMessage('');
      scrollToBottom();
    }
  };

  const getSenderName = (senderId) => {
    if (senderId === playerID) {
      return 'Tu';
    }
    return G?.players?.[senderId]?.name || `Player ${senderId}`;
  };

  // Se chat è chiusa e non ci sono messaggi non letti, mostra solo il tasto collassato
  if (!isExpanded && unreadCount === 0) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed right-4 bottom-8 z-20 flex items-center gap-3 px-6 py-4 bg-[#1B2227] rounded-lg shadow-lg hover:bg-[#2A3439] transition-all border border-gray-600 text-white font-bold text-base"
        title="Apri chat"
      >
        <IoIosChatboxes size={24} className="text-[#38C7D7]" />
        Chat
      </button>
    );
  }

  // Se chat è chiusa ma ci sono messaggi non letti, mostra pallino con conteggio
  if (!isExpanded && unreadCount > 0) {
    return (
      <div className="fixed right-4 bottom-8 z-20 flex items-center gap-3">
        <button
          onClick={handleNotificationClick}
          className="flex items-center gap-3 px-6 py-4 bg-[#1B2227] rounded-lg shadow-lg hover:bg-[#2A3439] transition-all border border-gray-600 text-white font-bold text-base"
          title={`${unreadCount} nuovi messaggi`}
        >
          <IoIosChatboxes size={24} className="text-[#38C7D7]" />
          Chat
        </button>
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      </div>
    );
  }

  // Chat espansa
  return (
    <div className="fixed right-4 bottom-8 z-20 w-80 max-h-96 bg-[#1B2227] rounded-lg shadow-2xl border border-gray-600 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#2A3439] px-4 py-3 border-b border-gray-600">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <IoIosChatboxes size={18} className="text-[#38C7D7]" />
          Chat Partita
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white transition-colors p-1"
          title="Chiudi chat"
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#1B2227]">
        {chatMessages.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-6">
            Nessun messaggio ancora. Inizia una conversazione! 💭
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isOwnMessage = msg.sender === playerID;
            const senderName = getSenderName(msg.sender);
            const payload = typeof msg.payload === 'string' ? msg.payload : msg.payload?.message || '';

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}
              >
                <span className={`text-xs font-semibold ${isOwnMessage ? 'text-[#38C7D7]' : 'text-[#FEC417]'}`}>
                  {senderName}
                </span>
                <div
                  className={`px-3 py-2 rounded-lg max-w-xs text-sm break-words ${
                    isOwnMessage
                      ? 'bg-[#38C7D7] text-[#1B2227] rounded-br-none'
                      : 'bg-[#2A3439] text-white rounded-bl-none'
                  }`}
                >
                  {payload}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-600 bg-[#2A3439] p-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Scrivi un messaggio..."
          className="flex-1 bg-[#1B2227] text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-[#38C7D7] focus:ring-1 focus:ring-[#38C7D7]"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-[#38C7D7] text-[#1B2227] px-3 py-2 rounded font-bold text-sm hover:bg-[#2aa5b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export default GameChat;
