// src/components/UI/FriendsList.js
import React, { useState, useEffect } from 'react';
import { getUserFriends } from '../../firebase/db';
import { watchMultipleUsersPresence } from '../../firebase/presence';
import { Users, UserCheck, Clock } from 'lucide-react';
import Avatar from './Avatar';

const FriendsList = ({ currentUserId }) => {
  const [friends, setFriends] = useState([]);
  const [friendsPresence, setFriendsPresence] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    // Carica la lista degli amici
    const loadFriends = async () => {
      const result = await getUserFriends(currentUserId);
      if (result.success) {
        setFriends(result.data);
        setError('');
      } else {
        setError(result.error);
      }
      setLoading(false);
    };

    loadFriends();
  }, [currentUserId]);

  useEffect(() => {
    if (friends.length === 0) return;

    // Monitora lo stato di presenza di tutti gli amici
    const friendIds = friends.map(friend => friend.uid);
    
    const unsubscribe = watchMultipleUsersPresence(friendIds, (uid, presenceData) => {
      setFriendsPresence(prev => ({
        ...prev,
        [uid]: presenceData
      }));
    });

    return () => unsubscribe();
  }, [friends]);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Mai visto';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Proprio ora';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return date.toLocaleDateString('it-IT');
  };

  const onlineFriends = friends.filter(friend => 
    friendsPresence[friend.uid]?.state === 'online'
  );

  const offlineFriends = friends.filter(friend => 
    friendsPresence[friend.uid]?.state !== 'online'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="p-8 text-center">
        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Nessun amico ancora</p>
        <p className="text-gray-500 text-xs mt-1">Cerca utenti per aggiungerli come amici!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Amici Online */}
      {onlineFriends.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 rounded-t-lg border-b border-green-700">
            <UserCheck className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-green-400">
              Online ({onlineFriends.length})
            </h3>
          </div>
          <div className="space-y-1">
            {onlineFriends.map(friend => (
              <FriendItem
                key={friend.uid}
                friend={friend}
                presence={friendsPresence[friend.uid]}
                isOnline={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Amici Offline */}
      {offlineFriends.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-t-lg border-b border-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-400">
              Offline ({offlineFriends.length})
            </h3>
          </div>
          <div className="space-y-1">
            {offlineFriends.map(friend => (
              <FriendItem
                key={friend.uid}
                friend={friend}
                presence={friendsPresence[friend.uid]}
                isOnline={false}
                formatLastSeen={formatLastSeen}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FriendItem = ({ friend, presence, isOnline, formatLastSeen }) => {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-800/50 rounded-lg transition-colors group">
      <div className="relative">
        <Avatar 
          src={friend.photoURL} 
          alt={friend.username || friend.displayName || 'Amico'} 
          size="md"
        />
        {/* Indicatore di stato */}
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
          isOnline ? 'bg-green-500' : 'bg-gray-600'
        }`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">
          {friend.username || friend.displayName || 'Utente'}
        </p>
        {!isOnline && presence?.lastSeen && (
          <p className="text-xs text-gray-500">
            Ultimo accesso: {formatLastSeen(presence.lastSeen)}
          </p>
        )}
        {isOnline && (
          <p className="text-xs text-green-400">Online</p>
        )}
      </div>
    </div>
  );
};

export default FriendsList;
