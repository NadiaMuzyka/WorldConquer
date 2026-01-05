import React from 'react';
import { INPUT_CONTAINER_STYLES, INPUT_LABEL_STYLES, INPUT_ICON_COLOR } from './inputStyles';

export default function RangeInput({
    label,
    value,
    onChange,
    min = 3,
    max = 6,
    icon: Icon,
    displayValue,
    className = ""
}) {
    return (
        <div className={`${INPUT_CONTAINER_STYLES} ${className}`}>
            <div className="flex justify-between items-end mb-1">
                <label className={INPUT_LABEL_STYLES}>{label}</label>
                <span className="text-xl text-[#38C7D7] pr-2">{displayValue || value}</span>
            </div>
            <div className="flex items-center gap-4 bg-[#2A3439] p-3 rounded-lg border border-gray-600 focus-within:border-[#38C7D7] transition-all">
                {Icon && <Icon size={20} className={INPUT_ICON_COLOR} />}
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={onChange}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#38C7D7] [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                />
            </div>
        </div>
    );
}
