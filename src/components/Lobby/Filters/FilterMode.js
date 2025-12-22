import React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

const FilterMode = ({ value, onChange }) => {
  
  // Stile personalizzato per il Radio Button
  const radioSx = {
    color: '#FFFFFF', // Bianco quando spento
    '&.Mui-checked': {
      color: '#38C7D7', // Ciano quando acceso
    },
    '& .MuiSvgIcon-root': {
      fontSize: 20,
    },
    padding: '6px', 
  };

  // Stile per il testo accanto al Radio
  const labelSx = {
    '& .MuiFormControlLabel-label': {
      fontFamily: 'Roboto, sans-serif',
      fontSize: '16px',
      color: '#FFFFFF',
      letterSpacing: '0.2px',
      marginLeft: '4px',
    },
    marginLeft: '0px',
    marginRight: '0px',
    width: '100%',
  };

  return (
    <FormControl className="w-full">
      {/* Titolo integrato nel componente */}
      <FormLabel 
        id="mode-radio-group-label"
        sx={{
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 700,
          fontSize: '16px',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          letterSpacing: '0.2px',
          marginBottom: '12px', // Corrisponde a mb-3
          '&.Mui-focused': {
            color: '#FFFFFF', // Evita che diventi blu al focus
          },
        }}
      >
        Modalità
      </FormLabel>
      
      <RadioGroup
        aria-labelledby="mode-radio-group-label"
        name="game-mode"
        value={value}
        onChange={onChange}
        className="flex flex-col gap-1"
      >
        <FormControlLabel 
          value="classica" 
          control={<Radio sx={radioSx} />} 
          label="Classica" 
          sx={labelSx}
        />
        <FormControlLabel 
          value="veloce" 
          control={<Radio sx={radioSx} />} 
          label="Veloce" 
          sx={labelSx}
        />
        <FormControlLabel 
          value="tutte" 
          control={<Radio sx={radioSx} />} 
          label="Tutte" 
          sx={labelSx}
        />
      </RadioGroup>
    </FormControl>
  );
};

export default FilterMode;