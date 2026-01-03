import React from 'react';
import Card from './Card';

/**
 * Componente Form - Card che wrappa un form HTML
 * @param {string} title - Titolo del form (opzionale)
 * @param {string} error - Messaggio di errore
 * @param {string} success - Messaggio di successo
 * @param {function} onSubmit - Handler submit
 * @param {React.ReactNode} children - Contenuto del form
 * @param {string} className - Classi CSS aggiuntive
 * @param {string} maxWidth - Larghezza massima: 'sm' (max-w-md), 'md' (max-w-2xl), 'lg' (max-w-4xl)
 */
export const Form = ({
    title,
    error,
    success,
    onSubmit,
    children,
    className = "",
    maxWidth = "sm"
}) => {
    const maxWidthClasses = {
        sm: "max-w-md",
        md: "max-w-2xl",
        lg: "max-w-4xl"
    };

    return (
        <form onSubmit={onSubmit} className={`${maxWidthClasses[maxWidth]} mx-auto ${className}`}>
            <Card padding="lg">
                {title && (
                    <h2 className="text-3xl font-bold mb-6 text-center text-white">{title}</h2>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400 text-sm">
                        {success}
                    </div>
                )}

                {children}
            </Card>
        </form>
    );
};

export default Form;
