import React from 'react';
import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';
import Button from '../components/UI/Button';

/**
 * Pagina di errore per React Router
 * Gestisce errori 404, errori di rete e altri errori inaspettati
 */
const ErrorPage = () => {
    const error = useRouteError();
    const navigate = useNavigate();

    // Determina il tipo di errore
    let errorTitle = 'Errore Inaspettato';
    let errorMessage = 'Si è verificato un errore. Riprova più tardi.';
    let errorStatus = '';

    if (isRouteErrorResponse(error)) {
        errorStatus = error.status;
        if (error.status === 404) {
            errorTitle = 'Pagina Non Trovata';
            errorMessage = 'La pagina che stai cercando non esiste.';
        } else if (error.status === 403) {
            errorTitle = 'Accesso Negato';
            errorMessage = 'Non hai i permessi per accedere a questa risorsa.';
        } else if (error.status === 500) {
            errorTitle = 'Errore del Server';
            errorMessage = 'Si è verificato un errore interno. Riprova tra qualche minuto.';
        } else {
            errorMessage = error.statusText || error.data || errorMessage;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1A1F25] to-[#2C333A] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-[#2C333A] rounded-2xl shadow-2xl border border-gray-700 p-8 md:p-12">

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                </div>

                {/* Status Code */}
                {errorStatus && (
                    <div className="text-center mb-4">
                        <span className="text-6xl font-bold text-[#38C7D7]">{errorStatus}</span>
                    </div>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                    {errorTitle}
                </h1>

                {/* Message */}
                <p className="text-gray-400 text-center text-lg mb-8">
                    {errorMessage}
                </p>

                {/* Error Details (solo in development) */}
                {process.env.NODE_ENV === 'development' && error?.stack && (
                    <details className="mb-8 bg-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-auto max-h-40">
                        <summary className="cursor-pointer font-semibold mb-2 text-red-400">
                            Dettagli Tecnici (solo dev)
                        </summary>
                        <pre className="whitespace-pre-wrap break-words">{error.stack}</pre>
                    </details>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Indietro
                    </Button>

                    <Button
                        variant="cyan"
                        size="lg"
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Torna alla Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
