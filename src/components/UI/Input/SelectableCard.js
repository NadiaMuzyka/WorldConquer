import React from 'react';
import { INPUT_ICON_COLOR } from './inputStyles';

export default function SelectableCard({
  label,
  description,
  icon: Icon,
  selected = false,
  onClick,
  activeColor = '#38C7D7', // cyan default
  className = ""
}) {
  const borderColor = selected ? activeColor : '#4B5563'; // gray-600
  const bgColor = selected ? `${activeColor}1A` : '#2A3439'; // /10 opacity
  const iconColor = selected ? activeColor : '#6B7280'; // gray-500
  const hoverBorder = selected ? '' : 'hover:border-gray-500';

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${hoverBorder} ${className}`}
      style={{ 
        borderColor: borderColor,
        backgroundColor: bgColor
      }}
    >
      {Icon && (
        <Icon 
          size={24} 
          style={{ color: iconColor }}
        />
      )}
      <div>
        <div className="font-bold text-sm text-white">{label}</div>
        {description && (
          <div className="text-xs text-gray-400">{description}</div>
        )}
      </div>
    </div>
  );
}
