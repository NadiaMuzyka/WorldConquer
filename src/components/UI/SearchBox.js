import React from 'react';
import { Search } from 'lucide-react';

const SearchBox = ({ placeholder = "Inserisci nome e codice partita..." }) => {
  return (
    <div className="bg-[#1B2227] p-4 rounded-lg shadow-[0px_4px_4px_rgba(0,0,0,0.25)] flex flex-col gap-2">
      
      {/* Header: Icona + Scritta CERCA */}
      <div className="flex items-center gap-2 mb-1">
         <Search className="w-6 h-6 text-white" />
         <span className="font-roboto font-bold text-[20px] tracking-[0.2px] text-white">
           CERCA
         </span>
      </div>

      {/* Input Field Stile Figma */}
      <div className="relative w-full h-[31px]">
         <input
           type="text"
           placeholder={placeholder}
           className="w-full h-full bg-[#D9D9D9] rounded-[13px] px-4 text-[12px] text-[#5F6368] font-medium placeholder-[#5F6368] focus:outline-none focus:ring-2 focus:ring-[#38C7D7]"
         />
      </div>
      
    </div>
  );
};

export default SearchBox;