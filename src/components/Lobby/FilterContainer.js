import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter, selectFilters } from '../../store/slices/lobbySlice';

// Icone
import { Filter, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

// MUI Components
import FilterSwitch from './Filters/FilterSwitch';
// Import is named RangeSlider here
import RangeSlider from './Filters/PlayerCountSlider'; 

import { createTheme, ThemeProvider } from '@mui/material/styles';

const darkTheme = createTheme({
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  palette: {
    mode: 'dark', 
    primary: {
      main: '#38C7D7', 
    },
  },
});

const FilterContainer = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);
  const [isOpen, setIsOpen] = useState(true);

  // --- HANDLERS ---
  const handleSwitchChange = (name) => (event) => {
    dispatch(setFilter({ name, value: event.target.checked }));
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div 
        className={`
          flex flex-col items-center w-[360px] bg-[#1B2227] 
          shadow-[0px_4px_4px_rgba(0,0,0,0.25)] rounded-lg 
          text-white font-roboto transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'h-auto pb-6' : 'h-[60px]'}
        `}
      >
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
          <div className="w-[299px] h-[1px] bg-[#979797] mx-auto mt-2 opacity-50"></div>
        </div>

        {isOpen && (
          <div className="w-full px-5 mt-4 flex flex-col gap-6">
            
            {/* 1. SLIDER GIOCATORI - Fixed Component Name */}
            <RangeSlider />

            <div className="w-full h-[1px] bg-[#979797] opacity-30"></div>

            {/* 2. SWITCHES (Tipologia) */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-[16px] tracking-[0.2px] uppercase text-white mb-2">
                Tipologia
              </span>

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