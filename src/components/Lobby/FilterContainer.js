import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter, selectFilters } from '../../store/slices/lobbySlice';

// Icone
import { Filter } from 'lucide-react';

// MUI Components
import RangeSlider from './Filters/PlayerCountSlider';
import FilterMode from './Filters/FilterMode';
import FilterVisibility from './Filters/FilterVisibility';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const darkTheme = createTheme({
  typography: { fontFamily: 'Roboto, sans-serif' },
  palette: {
    mode: 'dark',
    primary: { main: '#38C7D7' },
  },
});

const FilterContainer = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);

  // Classe condivisa per i titoli delle sezioni rimanenti
  const SECTION_TITLE_CLASS = "font-bold text-[16px] text-white uppercase tracking-[0.2px] mb-3 block";

  // --- HANDLERS ---
  const handleSwitchChange = (name) => (event) => {
    dispatch(setFilter({ name, value: event.target.checked }));
  };

  const handleModeChange = (event) => {
    dispatch(setFilter({ name: 'mode', value: event.target.value }));
  };

  const handleVisibilityChange = (event) => {
    dispatch(setFilter({ name: 'visibility', value: event.target.value }));
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="flex flex-col items-center w-[323px] bg-[#1B2227] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] rounded-[8px] text-white font-roboto pb-6"
      >
        {/* --- HEADER --- */}
        <div className="w-full px-4 pt-4">
          <div className="flex flex-row items-center gap-2 mb-4 border-b border-gray-600 pb-2">
            <Filter size={24} color="white" />
            <span className="text-xl font-bold text-white">
              Filtri
            </span>
          </div>
        </div>

        {/* --- BODY --- */}
        <div className="w-full px-4 flex flex-col gap-[16px]">

          {/* 1. SEZIONE TIPOLOGIA */}
          <div className="w-full">
            <FilterVisibility value={filters.visibility} onChange={handleVisibilityChange} />
          </div>

          <div className="w-full h-[1px] bg-[#979797] opacity-30"></div>

          {/* 2. SEZIONE GIOCATORI */}
          <div>
            <span className={SECTION_TITLE_CLASS}>
              Giocatori
            </span>
            <div className="px-2">
              <RangeSlider />
            </div>
          </div>

          <div className="w-full h-[1px] bg-[#979797] opacity-30"></div>

          {/* 3. SEZIONE MODALITÀ */}
          <div className="w-full">
            <FilterMode value={filters.mode} onChange={handleModeChange} />
          </div>

        </div>
      </div>
    </ThemeProvider>
  );
};

export default FilterContainer;