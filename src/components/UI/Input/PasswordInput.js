import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * Componente per input di password con toggle visibilità
 * Gestisce internamente lo stato di visibilità e la validazione
 * 
 * @param {Object} props
 * @param {string} props.value - Valore della password
 * @param {Function} props.onChange - Callback quando la password cambia
 * @param {string} props.name - Nome del campo (default: "password")
 * @param {string} props.label - Etichetta del campo
 * @param {string} props.placeholder - Placeholder
 * @param {number} props.minLength - Lunghezza minima richiesta (default: 6)
 * @param {boolean} props.required - Se il campo è obbligatorio
 * @param {Function} props.onBlur - Callback per blur event
 * @param {boolean} props.disabled - Se il campo è disabilitato
 */
const PasswordInput = ({
    value,
    onChange,
    name = 'password',
    label = 'Password',
    placeholder = '',
    minLength = 6,
    required = true,
    onBlur,
    disabled = false
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    /**
     * Valida la password
     */
    const validatePassword = (password) => {
        if (!password && required) {
            return 'La password è obbligatoria';
        }

        if (password && password.length < minLength) {
            return `La password deve contenere almeno ${minLength} caratteri`;
        }

        return null;
    };

    /**
     * Gestisci errore solo dopo che l'utente ha cliccato fuori dal campo
     */
    const handleBlur = (e) => {
        const validationError = validatePassword(value);
        setError(validationError || '');

        if (onBlur) {
            onBlur(e);
        }
    };

    /**
     * Handler per il cambio di valore
     */
    const handleChange = (e) => {
        // Pulisci l'errore quando l'utente digita
        if (error) {
            setError('');
        }

        onChange(e);
    };

    // Stili base
    const baseStyles = "w-full h-[45px] rounded text-[14px] font-medium transition-all outline-none border pl-10 pr-10 bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:border-[#38C7D7]";
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
                {/* Input */}
                <input
                    name={name}
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`${baseStyles} ${errorStyles}`}
                />

                {/* Icona Lock a sinistra */}
                <div className="absolute left-3 flex items-center justify-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                </div>

                {/* Icona Eye/EyeOff a destra (cliccabile) */}
                <div
                    className="absolute right-3 flex items-center justify-center cursor-pointer"
                    onClick={() => !disabled && setShowPassword(!showPassword)}
                >
                    {showPassword ? (
                        <EyeOff size={16} className="text-gray-400" />
                    ) : (
                        <Eye size={16} className="text-gray-400" />
                    )}
                </div>
            </div>

            {/* Messaggio di errore */}
            {error && (
                <p className="text-red-500 text-xs mt-1 pl-2">{error}</p>
            )}
        </div>
    );
};

export default PasswordInput;
