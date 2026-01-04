import React, { useState } from 'react';

/**
 * Componente per input di date con validazione età minima
 * Gestisce internamente calendario e validazione
 * 
 * @param {Object} props
 * @param {string} props.value - Valore della data (formato YYYY-MM-DD)
 * @param {Function} props.onChange - Callback quando la data cambia
 * @param {string} props.name - Nome del campo
 * @param {string} props.label - Etichetta del campo
 * @param {number} props.minAge - Età minima richiesta (default: 13)
 * @param {boolean} props.required - Se il campo è obbligatorio
 */
const DateInput = ({
  value,
  onChange,
  name = 'birthDate',
  label = 'Data di Nascita',
  minAge = 13,
  required = true,
  disabled = false
}) => {
  const [error, setError] = useState('');

  /**
   * Calcola l'età a partire dalla data di nascita
   */
  const calculateAge = (birthDateString) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Aggiusta l'età se il compleanno non è ancora passato quest'anno
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  /**
   * Valida la data e l'età minima
   */
  const validateDate = (dateString) => {
    if (!dateString) {
      if (required) {
        return 'La data di nascita è obbligatoria';
      }
      return null;
    }

    const age = calculateAge(dateString);
    
    if (age < minAge) {
      return `Devi avere almeno ${minAge} anni`;
    }

    return null;
  };

  /**
   * Handler per il cambio di valore
   */
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Valida la nuova data
    const validationError = validateDate(newValue);
    setError(validationError || '');
    
    // Chiama l'onChange del parent
    onChange(e);
  };

  /**
   * Handler per aprire il calendario quando si clicca sul campo
   */
  const handleClick = (e) => {
    if (e.target.showPicker) {
      try {
        e.target.showPicker();
      } catch (error) {
        // Ignora errori se showPicker non è supportato
        console.log('showPicker not supported');
      }
    }
  };

  // Stili base
  const baseStyles = "w-full h-[45px] rounded text-[14px] font-medium transition-all outline-none border px-3 bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:border-[#38C7D7]";
  const errorStyles = error ? "border-red-500 focus:border-red-500" : "";

  return (
    <div className="mb-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium mb-1 text-white pl-2">
          {label} {required && '*'}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <input
          name={name}
          type="date"
          value={value}
          onChange={handleChange}
          onClick={handleClick}
          required={required}
          disabled={disabled}
          className={`${baseStyles} ${errorStyles}`}
        />
      </div>

      {/* Messaggio di errore */}
      {error && (
        <p className="text-red-500 text-xs mt-1 pl-2">{error}</p>
      )}
    </div>
  );
};

export default DateInput;
