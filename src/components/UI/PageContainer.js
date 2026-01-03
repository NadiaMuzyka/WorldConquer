import React from 'react';

/**
 * Contenitore di pagina con sfondo decorativo
 * Gestisce lo sfondo con gradiente e decorazioni cyan
 * @param {React.ReactNode} children - Contenuto della pagina
 * @param {boolean} centered - Centra verticalmente il contenuto (default: false)
 * @param {string} className - Classi CSS aggiuntive
 */
export const PageContainer = ({
    children,
    centered = false,
    className = ""
}) => {
    const layoutClasses = centered 
        ? "flex items-center justify-center p-4"
        : "py-8 px-4";

    return (
        <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 relative overflow-hidden ${layoutClasses} ${className}`}>
            {/* Decorazioni sfondo - cerchi sfumati */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#38C7D7] opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#38C7D7] opacity-10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            
            {/* Contenuto */}
            <div className="relative z-10 w-full max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );
};

export default PageContainer;
