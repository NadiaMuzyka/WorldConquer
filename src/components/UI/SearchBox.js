import React from 'react';
import './SearchBox.css'; // Assumo tu abbia un file CSS per lo stile dell'input

const SearchBox = ({ value, onChange, onEnter, text }) => {
  
  // Gestiamo il tasto Invio per comodità, anche se il bottone è fuori
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter();
    }
  };

  return (
    <div className="search-box-container">
      <input
        type="text"
        className="search-input"
        placeholder="Cerca una lobby..."
        value={value}         // Controllato dal genitore
        onChange={onChange}   // Notifica il genitore
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default SearchBox;