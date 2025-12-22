import React from 'react';

// DEFINIZIONE DEGLI STILI (VARIANTI)
// Qui definiamo i colori per ogni "tipo" di bottone che vedi nelle immagini
const VARIANTS = {
  // 1. Stile "Partecipa" (Ciano)
  cyan: "bg-[#38C7D7] text-[#192832] hover:bg-[#2EB0BF] border border-transparent",
  
  // 2. Stile "Crea Nuova Partita" (Giallo Oro) - Basato su Cattura.PNG
  yellow: "bg-[#FEC417] text-[#1B2227] hover:bg-[#E5B000] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] border border-transparent",  

  // 3. Stile "Applica Filtri" (Trasparente con bordo)
  outline: "bg-transparent border border-gray-500 text-white hover:border-white hover:bg-white/10",
  
  // 4. Stile "Ghost/Icona" (Per la freccia nella search bar o usi secondari)
  ghost: "bg-transparent text-gray-400 hover:text-white"
};

// DEFINIZIONE DELLE DIMENSIONI
const SIZES = {
  // Piccolo e compatto (Es. bottone freccia o tag)
  xs: "px-2 py-1 text-xs",

  // Standard 
  sm: "px-6 py-1.5 text-[15px] min-w-[120px] h-[34px]", 
  
  // Medio (Standard generico)
  md: "px-6 py-2 text-base",
  
  // Grande (Es. "Crea Nuova Partita") - Più alto e spazioso
  lg: "px-8 py-3 text-lg font-bold w-full h-[50px]", 

  create: "w-[267px] h-[42px] text-[20px] font-bold tracking-[0.2px]",
};

export const Button = ({ 
  children, 
  onClick, 
  variant = 'cyan', // Default: Ciano
  size = 'sm',      // Default: Piccolo
  className = '',   // Per aggiungere classi extra al volo (es. margin)
  type = 'button',
  disabled = false,
  ...props          // Cattura altre prop (es. id, data-testid)
}) => {
  
  // Stili base comuni a tutti (Arrotondato, Flex, Font)
  const baseStyles = "rounded-full font-bold tracking-wide transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  // Composizione finale delle classi
  const finalClass = `
    ${baseStyles} 
    ${VARIANTS[variant] || VARIANTS.cyan} 
    ${SIZES[size] || SIZES.sm} 
    ${className}
  `.trim();

  return (
    <button 
      type={type}
      className={finalClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;