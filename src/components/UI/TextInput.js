import React from 'react';

const TextInput = ({ 
  label,
  name,
  placeholder, 
  value, 
  onChange, 
  type = "text", 
  icon: Icon, 
  className = "", 
  variant = "light", // Default "light" come richiesto (sfondo chiaro)
  required = false
}) => {
  
  // Stili base: Altezza fissa 45px, bordi arrotondati 13px, font 14px
  const baseStyles = "w-full h-[45px] rounded-[13px] text-[14px] font-medium transition-all outline-none border border-transparent px-3";
  
  // Definiamo i colori per le varianti
  const variants = {
    // Stile "SearchBox" (chiaro su scuro)
    light: "bg-[#D9D9D9] text-[#5F6368] placeholder-[#5F6368] focus:border-[#38C7D7]",
    
    // Stile "Dark" (se mai servisse in futuro)
    dark: "bg-[#2A3439] text-white placeholder-gray-500 focus:border-[#38C7D7]",
    
    // Stile "Auth" (per form di login/registrazione)
    auth: "bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-[#38C7D7] rounded"
  };

  return (
    <div className={`${variant === 'auth' ? 'mb-3' : ''} ${className}`}>
      {/* Label opzionale per variant auth */}
      {label && variant === 'auth' && (
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
          placeholder={placeholder}
          required={required}
          // Applichiamo lo stile base + la variante colore + padding a destra se c'è l'icona
          className={`${baseStyles} ${variants[variant]} ${Icon ? 'pr-9' : ''}`} 
        />

        {/* Icona posizionata a DESTRA (come la freccetta/lente nel design) */}
        {Icon && (
          <div className="absolute right-3 pointer-events-none flex items-center justify-center">
            <Icon 
              size={16} 
              className={variant === 'light' ? "text-[#5F6368]" : "text-gray-400"} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TextInput;