import React from 'react';

/**
 * Component Avatar riutilizzabile
 * Gestisce visualizzazione avatar con nome e nickname
 * @param {string} src - URL dell'immagine avatar
 * @param {string} alt - Testo alternativo
 * @param {string} firstName - Nome
 * @param {string} lastName - Cognome
 * @param {string} nickname - Nickname (opzionale)
 * @param {string} size - Dimensione: 'sm' (64px), 'md' (96px), 'lg' (192px)
 * @param {boolean} showName - Mostra nome e cognome (default: true)
 * @param {boolean} showNickname - Mostra nickname (default: true)
 * @param {string} className - Classi CSS aggiuntive per il contenitore
 */
export const Avatar = ({
    src,
    alt,
    firstName,
    lastName,
    nickname,
    size = 'lg',
    showName = true,
    showNickname = true,
    className = ""
}) => {
    const sizeClasses = {
        sm: "w-16 h-16",
        md: "w-24 h-24",
        lg: "w-48 h-48"
    };

    const textSizes = {
        sm: { name: "text-sm", nickname: "text-xs" },
        md: { name: "text-lg", nickname: "text-sm" },
        lg: { name: "text-2xl", nickname: "text-base" }
    };

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <img 
                src={src} 
                alt={alt}
                className={`${sizeClasses[size]} rounded-full mb-4 border-4 border-[#38C7D7]`}
            />
            {showName && (
                <h2 className={`${textSizes[size].name} font-bold text-white mb-1`}>
                    {firstName} {lastName}
                </h2>
            )}
            {showNickname && nickname && (
                <p className={`${textSizes[size].nickname} text-gray-400`}>
                    @{nickname}
                </p>
            )}
        </div>
    );
};

export default Avatar;
