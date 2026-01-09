import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

function Modal({ 
    onClose, 
    children, 
    actionBar,    
    title, 
    size = 'sm', 
    preventClose = false, // La feature per bloccare i dadi
    className = ''
}) {
    // Stato per l'animazione
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setAnimate(true));
    }, []);

    // Gestione ESC (Disabilitata se preventClose è true)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !preventClose) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, preventClose]);

    // Gestione dimensioni
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95%]'
    };

    const handleOverlayClick = (e) => {
        if (!preventClose && e.target === e.currentTarget) onClose();
    };

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300
                ${animate ? 'backdrop-blur-[2px] bg-black/60' : 'backdrop-blur-none bg-transparent'}`}
            onMouseDown={handleOverlayClick}
        >
            <div
                className={`
                    relative w-full flex flex-col
                    bg-[#232A31] text-white rounded-2xl shadow-2xl border border-gray-700
                    transform transition-all duration-300
                    ${sizeClasses[size]}
                    ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
                    ${className}
                `}
                onMouseDown={e => e.stopPropagation()}
            >
                {/* 1. Header (Titolo + X chiusura) */}
                {(title || !preventClose) && (
                    <div className="flex items-center justify-between px-7 py-4 border-b border-gray-700">
                        {title && <h3 className="text-lg font-bold">{title}</h3>}
                        {!preventClose && (
                            <button onClick={onClose} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        )}
                    </div>
                )}

                {/* 2. Children (Contenuto scrollabile) */}
                <div className="p-7 overflow-y-auto max-h-[70vh]">
                    {children}
                </div>

                {/* 3. ActionBar (Bottoni in basso) */}
                {actionBar && (
                    <div className="px-7 py-4 border-t border-gray-700 bg-black/20 rounded-b-2xl flex justify-center gap-2">
                        {actionBar}
                    </div>
                )}
            </div>
        </div>,
        document.querySelector('.modal-container') || document.body
    );
}

export default Modal;