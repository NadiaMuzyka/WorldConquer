// src/components/Navbar/FriendsDropdown.js
import React, { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import FriendsList from '../UI/FriendsList';
import { getOnlineUsers } from '../../firebase/presence';

const FriendsDropdown = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Aggiorna il conteggio degli utenti online ogni 30 secondi
    const updateOnlineCount = async () => {
      const result = await getOnlineUsers();
      if (result.success) {
        setOnlineCount(result.data.length);
      }
    };

    updateOnlineCount();
    const interval = setInterval(updateOnlineCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
        aria-label="Amici"
      >
        <Users className="w-6 h-6 text-gray-300" />
        {onlineCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
            {onlineCount > 9 ? '9+' : onlineCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-4 py-3">
            <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
              <Users className="w-5 h-5" />
              I tuoi amici
            </h2>
            {onlineCount > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {onlineCount} {onlineCount === 1 ? 'utente online' : 'utenti online'}
              </p>
            )}
          </div>
          
          <div className="p-2">
            <FriendsList currentUserId={currentUser?.uid} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsDropdown;
