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
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <form onSubmit={onSubmit} className={`p-8 bg-gray-800 rounded-2xl shadow-xl w-full max-w-md ${className}`}>
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
