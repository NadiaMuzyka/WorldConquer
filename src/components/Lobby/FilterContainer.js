import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter, selectFilters } from '../../store/slices/lobbySlice';

// Icone
import { Filter, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

// MUI Components
import Slider from '@mui/material/Slider';
import FilterSwitch from './Filters/FilterSwitch';

import { createTheme, ThemeProvider } from '@mui/material/styles';

// Creiamo un mini-tema MUI locale per forzare il font Roboto e i colori
const darkTheme = createTheme({
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  palette: {
    mode: 'dark', // Ottimizza i colori per sfondo scuro
    primary: {
      main: '#38C7D7', // Il CIANO del tuo design
    },
  },
});

const FilterContainer = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);
  const [isOpen, setIsOpen] = useState(true);

  // --- HANDLERS ---
  const handleRangeChange = (event, newValue) => {
    dispatch(setFilter({ name: 'playerRange', value: newValue }));
  };

  const handleSwitchChange = (name) => (event) => {
    dispatch(setFilter({ name, value: event.target.checked }));
  };

  // Definiamo i passi possibili
  const marks = [3, 4, 5, 6];

  // Funzione helper per capire se un numero è incluso nel range selezionato
  const isValueInRange = (val) => {
    return val >= filters.playerRange[0] && val <= filters.playerRange[1];
  };

  return (
    <ThemeProvider theme={darkTheme}>
      {/* Contenitore principale stile FIGMA (Tailwind) */}
      <div 
        className={`
          flex flex-col items-center w-[360px] bg-[#1B2227] 
          shadow-[0px_4px_4px_rgba(0,0,0,0.25)] rounded-lg 
          text-white font-roboto transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'h-auto pb-6' : 'h-[60px]'}
        `}
      >
        {/* --- HEADER (Accordion Trigger) --- */}
        <div 
          className="w-full h-[60px] flex flex-col justify-center cursor-pointer relative flex-shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-row items-center gap-2 px-4 pt-4 pb-2">
            <Filter size={24} color="white" />
            <span className="font-bold text-[20px] leading-[23px] tracking-[0.2px] flex-grow uppercase">
              Filtri
            </span>
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          {/* Linea Divisoria */}
          <div className="w-[299px] h-[1px] bg-[#979797] mx-auto mt-2 opacity-50"></div>
        </div>

        {/* --- BODY (MUI Controls) --- */}
        {isOpen && (
          <div className="w-full px-5 mt-4 flex flex-col gap-6">
            
            {/* 1. SLIDER GIOCATORI */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[16px] tracking-[0.2px] uppercase text-white">
                  Giocatori
                </span>
              </div>

              {/* --- 2. RIGA DEI NUMERETTI --- */}
              <div className="flex justify-between px-[10px] mb-[-5px]">
                {marks.map((num) => (
                  <span 
                    key={num}
                    className={`text-[14px] font-bold transition-colors duration-200
                      ${isValueInRange(num) ? 'text-white' : 'text-[#979797]'}
                    `}
                  >
                    {num}
                  </span>
                ))}
              </div>
              
              <Slider
                value={filters.playerRange}
                onChange={handleRangeChange}
                valueLabelDisplay="auto"
                min={3}
                max={6}
                step={1}
                disableSwap
                // Stile custom per matchare Figma
                sx={{
                  color: '#38C7D7',
                  height: 8,
                  '& .MuiSlider-track': {
                    border: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    height: 24,
                    width: 24,
                    backgroundColor: '#fff',
                    border: '2px solid currentColor',
                    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                      boxShadow: 'inherit',
                    },
                  },
                  '& .MuiSlider-rail': {
                    opacity: 1,
                    backgroundColor: '#bfbfbf',
                  },
                  '& .MuiSlider-mark': {
                    backgroundColor: '#bfbfbf',
                    height: 8,
                    width: 1,
                    '&.MuiSlider-markActive': {
                      opacity: 1,
                      backgroundColor: 'currentColor',
                    },
                  },
                }}
              />
            </div>

            {/* Linea Divisoria */}
            <div className="w-full h-[1px] bg-[#979797] opacity-30"></div>

            {/* 2. SWITCHES (Tipologia) */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-[16px] tracking-[0.2px] uppercase text-white mb-2">
                Tipologia
              </span>

              {/* Switch Custom Component per pulizia codice */}
              <FilterSwitch 
                label="Partite Pubbliche" 
                checked={filters.public} 
                onChange={handleSwitchChange('public')} 
              />
              <FilterSwitch 
                label="Partite Private" 
                checked={filters.private} 
                onChange={handleSwitchChange('private')} 
              />
              <FilterSwitch 
                label="Create da amici" 
                checked={filters.friends} 
                onChange={handleSwitchChange('friends')} 
              />
            </div>

            {/* 3. BUTTON APPLICA (Tailwind puro come da design) */}
            <div className="mt-2 flex justify-center">
              <button className="flex flex-row items-center justify-center gap-2 px-6 py-2 bg-[#38C7D7] rounded-[25px] hover:bg-[#2caab8] transition-colors w-full">
                <span className="font-bold text-[16px] text-[#1B2227] tracking-[0.2px]">
                  APPLICA FILTRI
                </span>
                <ArrowRight size={20} color="#1B2227" />
              </button>
            </div>

          </div>
        )}
      </div>
    </ThemeProvider>
  );
};

export default FilterContainer;