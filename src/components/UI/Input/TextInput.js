import React from 'react';

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

  // Stili base
  const baseStyles = "w-full h-[45px] rounded text-[14px] font-medium transition-all outline-none border px-3 bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:border-[#38C7D7]";
  const errorStyles = error ? "border-red-500 focus:border-red-500" : "";

  return (
    <div className={`mb-3 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium mb-1 text-white pl-2">
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
          className={`${baseStyles} ${errorStyles} ${Icon ? 'pr-9' : ''}`}
        />

        {/* Icona posizionata a DESTRA */}
        {Icon && (
          <div className="absolute right-3 flex items-center justify-center pointer-events-none">
            <Icon size={16} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Messaggio di errore */}
      {error && (
        <p className="text-red-500 text-xs mt-1 pl-2">{error}</p>
      )}
    </div>
  );
};

export default TextInput;