import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { INPUT_BASE_STYLES, INPUT_ERROR_STYLES, INPUT_CONTAINER_STYLES, INPUT_LABEL_STYLES, INPUT_ERROR_MESSAGE_STYLES, INPUT_ICON_LEFT, INPUT_ICON_RIGHT_CLICKABLE, INPUT_ICON_COLOR } from './inputStyles';

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

    // Stili base con padding per le icone
    const baseStyles = INPUT_BASE_STYLES.replace('px-3', 'pl-10 pr-10');
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
                <div className={INPUT_ICON_LEFT}>
                    <Lock size={16} className={INPUT_ICON_COLOR} />
                </div>

                {/* Icona Eye/EyeOff a destra (cliccabile) */}
                <div
                    className={INPUT_ICON_RIGHT_CLICKABLE}
                    onClick={() => !disabled && setShowPassword(!showPassword)}
                >
                    {showPassword ? (
                        <EyeOff size={16} className={INPUT_ICON_COLOR} />
                    ) : (
                        <Eye size={16} className={INPUT_ICON_COLOR} />
                    )}
                </div>
            </div>

            {/* Messaggio di errore */}
            {error && (
                <p className={INPUT_ERROR_MESSAGE_STYLES}>{error}</p>
            )}
        </div>
    );
};

export default PasswordInput;
