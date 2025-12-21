import React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter, selectFilters } from '../../../store/slices/lobbySlice';

export default function PlayerRangeFilter() {
  const dispatch = useDispatch();
  const { playerRange } = useSelector(selectFilters);

  const handleChange = (event, newValue) => {
    // Aggiorniamo Redux
    dispatch(setFilter({ name: 'playerRange', value: newValue }));
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Typography gutterBottom>Numero Giocatori ({playerRange[0]} - {playerRange[1]})</Typography>
      <Slider
        getAriaLabel={() => 'Range giocatori'}
        value={playerRange}
        onChange={handleChange}
        valueLabelDisplay="auto"
        min={2}
        max={6}
        marks
      />
    </Box>
  );
}