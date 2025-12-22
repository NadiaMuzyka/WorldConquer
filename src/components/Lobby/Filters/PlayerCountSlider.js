import React from 'react';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter, selectFilters } from '../../../store/slices/lobbySlice';

export default function RangeSlider() {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);
  const { playerRange } = filters;

  const handleChange = (event, newValue) => {
    dispatch(setFilter({ name: 'playerRange', value: newValue }));
  };

  // Definiamo i passi possibili
  const marks = [3, 4, 5, 6];

  // Funzione helper per capire se un numero è incluso nel range selezionato
  const isValueInRange = (val) => {
    return val >= playerRange[0] && val <= playerRange[1];
  };

  return (
    <Box className="flex flex-col gap-2">

      {/* --- 2. RIGA DEI NUMERETTI --- */}
      <Box className="flex justify-between px-[10px] mb-[-5px]">
        {marks.map((num) => (
          <Typography 
            key={num}
            className={`text-[14px] font-bold transition-colors duration-200
              ${isValueInRange(num) ? 'text-white' : 'text-[#979797]'}
            `}
          >
            {num}
          </Typography>
        ))}
      </Box>
      
      <Slider
        value={playerRange}
        onChange={handleChange}
        valueLabelDisplay="auto"
        min={3}
        max={6}
        step={1}
        disableSwap
        // Stile custom per matchare Figma
        sx={{
          width: '92%',
          margin: '0 auto',
          color: '#38C7D7',
          height: 8,
          '& .MuiSlider-track': {
            border: 'none',
          },
          '& .MuiSlider-thumb': {
            height: 24,
            width: 22,
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
    </Box>
  );
}