import React from 'react';
import { Flag } from 'lucide-react';

/**
 * Logo dell'applicazione WorldConquer
 * @param {Object} props
 * @param {boolean} props.showText - Se mostrare il testo "WorldConquer" (default: true)
 * @param {string} props.className - Classi CSS aggiuntive per il container
 * @param {Function} props.onClick - Callback per il click sul logo
 */
const Logo = ({ showText = true, className = '', onClick }) => {
    return (
        <div
            className={`flex items-center gap-5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            <div className="relative w-[54px] h-[54px] flex items-center justify-center">
                <Flag className="w-[40px] h-[40px] text-[#38C7D7] fill-current" />
            </div>
            {showText && (
                <span className="font-bold text-[32px] text-white tracking-[0.2px] hidden md:block">
                    WorldConquer
                </span>
            )}
        </div>
    );
};

export default Logo;
