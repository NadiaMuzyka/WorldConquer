import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search } from 'lucide-react';
import { setFilter, selectFilters } from '../../store/slices/lobbySlice';
import TextInput from '../UI/Input/TextInput'; 

const SearchBox = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);

  const handleChange = (e) => {
    dispatch(setFilter({ name: 'search', value: e.target.value }));
  };

  return (
    // CARD ESTERNA: Più ariosa con py-5 e gap-3
    <div className="
      w-[323px] 
      bg-[#1B2227] 
      rounded-[12px] 
      shadow-[0px_4px_10px_rgba(0,0,0,0.3)] 
      flex flex-col items-center justify-center
      py-5 
      gap-3 
      shrink-0
    ">
      
      {/* Header: Icona + Scritta CERCA */}
      <div className="w-full flex items-center px-4 gap-3">
        <span className="font-roboto font-bold text-[18px] text-white tracking-widest">
          CERCA
        </span>
      </div>

      {/* Input Field: Spazio laterale (px-3) per non toccare i bordi */}
      <div className="w-full px-3">
        <TextInput
          variant="light" 
          placeholder="Inserisci nome o codice..."
          value={filters.search || ''}
          onChange={handleChange}
          icon={Search} 
        />
      </div>
    </div>
  );
};

export default SearchBox;