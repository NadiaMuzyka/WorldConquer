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
        sender: playerID,
        timestamp: Date.now()
      });
      setNewMessage('');
      scrollToBottom();
    }
  };

  const handleQuickEmoji = (emoji) => {
    if (sendChatMessage) {
      sendChatMessage({
        message: emoji,
        sender: playerID,
        timestamp: Date.now()
      });
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
        className="fixed right-4 bottom-4 md:right-6 md:bottom-6 lg:right-8 lg:bottom-8 z-30 flex items-center gap-3 px-6 py-4 bg-[#0b1622]/40 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-[#0b1622]/60 transition-all duration-300 text-white font-bold text-base origin-bottom-right scale-[0.70] md:scale-75 lg:scale-75 xl:scale-[0.85] 2xl:scale-100 min-[1920px]:scale-125"
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
      <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 lg:right-8 lg:bottom-8 z-30 flex items-center gap-3 origin-bottom-right scale-[0.70] md:scale-75 lg:scale-75 xl:scale-[0.85] 2xl:scale-100 min-[1920px]:scale-125">
        <button
          onClick={handleNotificationClick}
          className="flex items-center gap-3 px-6 py-4 bg-[#0b1622]/40 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-[#0b1622]/60 transition-all duration-300 text-white font-bold text-base"
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
    <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 lg:right-8 lg:bottom-8 z-30 w-[300px] md:w-[350px] max-h-96 backdrop-blur-2xl bg-[#0b1622]/40 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2 origin-bottom-right scale-[0.70] md:scale-75 lg:scale-75 xl:scale-[0.85] 2xl:scale-100 min-[1920px]:scale-125 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/5 px-4 py-3 border-b border-white/10">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-transparent max-h-[220px]">
        {chatMessages.length === 0 ? (
          <div className="text-gray-400 text-xs text-center py-8 bg-white/5 rounded-xl border border-white/5 my-2">
            Nessun messaggio ancora. Inizia una conversazione! 💭
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isOwnMessage = String(msg.sender) === String(playerID) || msg.sender === playerName || msg.sender === 'Tu';
            const senderName = getSenderName(msg.sender);
            const payload = typeof msg.payload === 'string' ? msg.payload : msg.payload?.message || msg.message || '';
            const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${isOwnMessage ? 'text-[#38C7D7]' : 'text-[#FEC417]'}`}>
                    {senderName}
                  </span>
                  {timeStr && <span className="text-[9px] text-gray-400">{timeStr}</span>}
                </div>
                <div
                  className={`px-3 py-1.5 rounded-2xl max-w-[240px] text-xs leading-relaxed break-words shadow-sm ${
                    isOwnMessage
                      ? 'bg-[#38C7D7] text-gray-900 font-semibold rounded-br-none'
                      : 'bg-white/15 backdrop-blur border border-white/10 text-gray-100 rounded-bl-none'
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

      {/* Quick Emojis Bar */}
      <div className="flex items-center justify-around px-2 py-1 bg-black/40 border-t border-white/5 text-sm">
        {['👍', '⚔️', '🚩', '😂', '🎯'].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="hover:scale-125 transition-transform p-1"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-white/10 bg-black/30 p-2.5 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Scrivi un messaggio..."
          className="flex-1 bg-white/10 text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#38C7D7] focus:ring-1 focus:ring-[#38C7D7] placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-[#38C7D7] text-gray-900 px-3 py-2 rounded-xl font-extrabold text-xs hover:bg-[#2aa5b3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export default GameChat;
