import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Loader2, BarChart2 } from 'lucide-react';
import DropdownMenuItem from '../UI/DropdownItem';
import Avatar from '../UI/Avatar';

/**
 * Menu dropdown del profilo utente
 * @param {Object} props
 * @param {string} props.avatarUrl - URL dell'avatar dell'utente
 * @param {boolean} props.isLoading - Se l'avatar sta caricando
 * @param {Function} props.onProfileClick - Callback per il click su "Profilo"
 * @param {Function} props.onLogoutClick - Callback per il click su "Logout"
 */
const ProfileDropdown = ({ avatarUrl, isLoading = false, onProfileClick, onStatsClick, onLogoutClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={toggleDropdown}
        className="w-[64px] h-[64px] rounded-full border-2 border-[#38C7D7] bg-[#2C333A] overflow-hidden shadow-lg hover:border-[#2eb4c4] transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#38C7D7] focus:ring-offset-2 focus:ring-offset-[#1A1F25] flex items-center justify-center"
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 text-[#38C7D7] animate-spin" />
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt="User"
            className="w-full h-full object-cover"
          />
        ) : null}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#2C333A] rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50 animate-fadeIn">
          {/* Menu Item: Profilo */}
          <DropdownMenuItem
            icon={User}
            label="Profilo"
            variant="default"
            onClick={() => {
              onProfileClick();
              setIsOpen(false);
            }}
          />

          {/* Menu Item: Statistiche */}
          <DropdownMenuItem
            icon={BarChart2}
            label="Statistiche"
            variant="default"
            onClick={() => {
              if (onStatsClick) onStatsClick();
              setIsOpen(false);
            }}
          />

          {/* Divider */}
          <div className="h-px bg-gray-700" />

          {/* Menu Item: Logout */}
          <DropdownMenuItem
            icon={LogOut}
            label="Logout"
            variant="danger"
            onClick={() => {
              onLogoutClick();
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
