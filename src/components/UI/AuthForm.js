import React from 'react';

/**
 * Componente wrapper per form di autenticazione
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white py-8">
      <form onSubmit={onSubmit} className={`p-8 bg-gray-800 rounded shadow-xl w-full max-w-md ${className}`}>
        <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {children}
      </form>
    </div>
  );
};

export default AuthForm;
