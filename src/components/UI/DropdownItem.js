import React from 'react';

/**
 * Elemento singolo di un menu dropdown
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icona dell'elemento (componente Lucide React)
 * @param {string} props.label - Testo dell'elemento
 * @param {Function} props.onClick - Callback per il click
 * @param {string} [props.variant='default'] - Variante dello stile ('default' | 'danger')
 */
const DropdownMenuItem = ({ icon: Icon, label, onClick, variant = 'default' }) => {
  const variants = {
    default: {
      hoverBg: 'hover:bg-[#38C7D7] hover:bg-opacity-20',
      iconColor: 'text-[#38C7D7]'
    },
    danger: {
      hoverBg: 'hover:bg-red-600 hover:bg-opacity-20',
      iconColor: 'text-red-500'
    }
  };

  const style = variants[variant] || variants.default;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-white ${style.hoverBg} transition-colors text-left`}
    >
      <Icon className={`w-5 h-5 ${style.iconColor}`} />
      <span className="font-medium">{label}</span>
    </button>
  );
};

export default DropdownMenuItem;
