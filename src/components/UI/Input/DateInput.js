import React, { useState } from 'react';
import { INPUT_BASE_STYLES, INPUT_ERROR_STYLES, INPUT_CONTAINER_STYLES, INPUT_LABEL_STYLES, INPUT_ERROR_MESSAGE_STYLES } from './inputStyles';

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

  const errorStyles = error ? INPUT_ERROR_STYLES : "";

  return (
    <div className={INPUT_CONTAINER_STYLES}>
      {/* Label */}
      {label && (
        <label className={INPUT_LABEL_STYLES}>
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
          className={`${INPUT_BASE_STYLES} ${errorStyles}`}
        />
      </div>

      {/* Messaggio di errore */}
      {error && (
        <p className={INPUT_ERROR_MESSAGE_STYLES}>{error}</p>
      )}
    </div>
  );
};

export default DateInput;
