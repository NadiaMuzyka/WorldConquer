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
    <div className="w-full bg-[#1B2227] rounded-[12px] shadow-sm p-4 flex flex-col md:flex-row items-center gap-4 mb-6">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Search size={20} color="white" />
        <span className="text-lg font-bold text-white whitespace-nowrap">
          Cerca Partita
        </span>
      </div>
      <div className="flex-1 w-full">
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