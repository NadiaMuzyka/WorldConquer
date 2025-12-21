import React from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

const FilterSwitch = ({ label, checked, onChange }) => {
  return (
    <div className="flex justify-between items-center w-full">
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={onChange}
            sx={{
              // Stile Base quando è "acceso"
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#38C7D7', // Colore Pallino
                '&:hover': {
                  backgroundColor: 'rgba(56, 199, 215, 0.08)', // Alone al passaggio mouse
                },
              },
              // Stile Traccia quando è "acceso"
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#38C7D7', 
                opacity: 0.5,
              },
              // Stile Traccia quando è "spento"
              '& .MuiSwitch-track': {
                backgroundColor: '#979797', 
              },
              // Stile Pallino quando è "spento" (default MUI è grigio chiaro, va bene)
            }}
          />
        }
        // Stile della Label (il testo a destra)
        label={<span className="text-[16px] text-white font-roboto">{label}</span>}
      />
    </div>
  );
};

export default FilterSwitch;