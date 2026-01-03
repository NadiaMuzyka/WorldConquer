import React from 'react';

/**
 * Componente wrapper per form di autenticazione
 * Include layout con sfondo e centratura
 * @param {string} title - Titolo del form
 * @param {string} error - Messaggio di errore da visualizzare
 * @param {function} onSubmit - Handler per il submit del form
 * @param {React.ReactNode} children - Contenuto del form (campi input, bottoni, etc.)
 * @param {string} className - Classi CSS aggiuntive per il form
 */
export const AuthForm = ({
    title,
    error,
    onSubmit,
    children,
    className = ""
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorazioni sfondo - cerchi sfumati */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#38C7D7] opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#38C7D7] opacity-10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            
            {/* Form container */}
            <form onSubmit={onSubmit} className={`relative p-8 bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md ${className}`}>
                <h2 className="text-3xl font-bold mb-6 text-center text-white">{title}</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {children}
            </form>
        </div>
    );
};

export default AuthForm;
