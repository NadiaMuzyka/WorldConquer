import React from 'react';
import { INPUT_BASE_STYLES, INPUT_ERROR_STYLES, INPUT_CONTAINER_STYLES, INPUT_LABEL_STYLES, INPUT_ERROR_MESSAGE_STYLES, INPUT_ICON_RIGHT, INPUT_ICON_COLOR } from './inputStyles';

const TextInput = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  type = "text",
  icon: Icon,
  className = "",
  required = false,
  disabled = false,
  error
}) => {

  const errorStyles = error ? INPUT_ERROR_STYLES : "";

  return (
    <div className={`${INPUT_CONTAINER_STYLES} ${className}`}>
      {/* Label */}
      {label && (
        <label className={INPUT_LABEL_STYLES}>
          {label} {required && '*'}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${INPUT_BASE_STYLES} ${errorStyles} ${Icon ? 'pr-9' : ''}`}
        />

        {/* Icona posizionata a DESTRA */}
        {Icon && (
          <div className={INPUT_ICON_RIGHT}>
            <Icon size={16} className={INPUT_ICON_COLOR} />
          </div>
        )}
      </div>

      {/* Messaggio di errore */}
      {error && (
        <p className={INPUT_ERROR_MESSAGE_STYLES}>{error}</p>
      )}
    </div>
  );
};

export default TextInput;