import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, ArrowRight } from 'lucide-react';
import { setFilter, selectFilters } from '../../store/slices/lobbySlice';
import TextInput from '../UI/Input/TextInput'; 

const SearchBox = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);

  const handleChange = (e) => {
    dispatch(setFilter({ name: 'search', value: e.target.value }));
  };

  return (
    // CARD ESTERNA: Più ariosa con py-4 e gap-3
    <div className="
      w-[323px] 
      bg-[#1B2227] 
      rounded-[12px] 
      shadow-[0px_4px_10px_rgba(0,0,0,0.3)] 
      flex flex-col
      pb-4
      shrink-0
    ">
      
      {/* Header: Icona + Scritta CERCA */}
      <div className="w-full px-4 pt-4">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-600 pb-2">
          <Search size={24} color="white" />
          <span className="text-xl font-bold text-white">
            Cerca
          </span>
        </div>
      </div>

      {/* Input Field: Spazio laterale (px-5) per non toccare i bordi */}
      <div className="w-full px-4">
        <TextInput
          variant="light" 
          placeholder="Inserisci nome o codice..."
          value={filters.search || ''}
          onChange={handleChange}
          icon={ArrowRight}
        />
      </div>
    </div>
  );
};

export default SearchBox;