import React from 'react';

/**
 * Contenitore card generico
 * Gestisce lo stile base dei contenitori (bg-gray-800, rounded, shadow)
 * @param {React.ReactNode} children - Contenuto della card
 * @param {string} className - Classi CSS aggiuntive
 * @param {string} padding - Padding: 'none', 'sm' (p-4), 'md' (p-6), 'lg' (p-8)
 */
export const Card = ({
    children,
    className = "",
    padding = "md"
}) => {
    const paddingClasses = {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8"
    };

    return (
        <div className={`bg-[#1B2227] rounded-xl shadow-xl ${paddingClasses[padding]} ${className}`}>
            {children}
        </div>
    );
};

export default Card;
