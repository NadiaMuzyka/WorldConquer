import React from 'react';

/**
 * Component Avatar riutilizzabile e flessibile
 * Gestisce visualizzazione avatar con nome e nickname, o solo avatar piccolo
 * @param {string} src - URL dell'immagine avatar
 * @param {string} alt - Testo alternativo
 * @param {string} firstName - Nome
 * @param {string} lastName - Cognome
 * @param {string} nickname - Nickname (opzionale)
 * @param {string} size - Dimensione: 'xs' (50px), 'sm' (64px), 'md' (96px), 'lg' (192px)
 * @param {boolean} showName - Mostra nome e cognome (default: true)
 * @param {boolean} showNickname - Mostra nickname (default: true)
 * @param {string} borderColor - Colore del bordo (default: #38C7D7)
 * @param {number} borderWidth - Larghezza del bordo in px (default: 4)
 * @param {boolean} showIndicator - Mostra indicatore (pallino ciano) (default: false)
 * @param {number} opacity - Opacità (0-1) (default: 1)
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
    borderColor = '#38C7D7',
    borderWidth = 4,
    showIndicator = false,
    opacity = 1,
    className = "",
    type,
    id,
    playerID,
    ready
}) => {
    // SetupBar avatar defaults
    let avatarProps = {
        size,
        showName,
        showNickname,
        borderColor,
        borderWidth,
        showIndicator,
        opacity,
        className
    };
    if (type === "setupbar") {
        // Import PLAYER_COLORS only if needed
        let playerColor = '#38C7D7';
        try {
            // Dynamic import for PLAYER_COLORS
            playerColor = require('../Constants/colors').PLAYER_COLORS?.[id] || '#38C7D7';
        } catch {}
        avatarProps = {
            size: 'xs',
            showName: false,
            showNickname: false,
            borderColor: playerColor,
            borderWidth: 3,
            showIndicator: id === playerID,
            opacity: ready ? 1 : 0.5,
            className
        };
    }
    const sizeClasses = {
        xs: "w-[50px] h-[50px]",
        sm: "w-16 h-16",
        md: "w-24 h-24",
        lg: "w-48 h-48"
    };

    const textSizes = {
        xs: { name: "text-xs", nickname: "text-xs" },
        sm: { name: "text-sm", nickname: "text-xs" },
        md: { name: "text-lg", nickname: "text-sm" },
        lg: { name: "text-2xl", nickname: "text-base" }
    };

    const marginBottom = {
        xs: "",
        sm: "mb-2",
        md: "mb-3",
        lg: "mb-4"
    };

    return (
        <div className={`flex flex-col items-center ${avatarProps.className}`} style={{ opacity: avatarProps.opacity }}>
            <div className="relative">
                <img 
                    src={src} 
                    alt={alt}
                    className={`${sizeClasses[avatarProps.size]} rounded-full ${marginBottom[avatarProps.size]} object-cover`}
                    style={{
                        border: `${avatarProps.borderWidth}px solid ${avatarProps.borderColor}`
                    }}
                />
                {avatarProps.showIndicator && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#38C7D7] rounded-full border-2 border-[#1B2227]" />
                )}
            </div>
            {avatarProps.showName && firstName && (
                <h2 className={`${textSizes[avatarProps.size].name} font-bold text-white mb-1`}>
                    {firstName} {lastName}
                </h2>
            )}
            {avatarProps.showNickname && nickname && (
                <p className={`${textSizes[avatarProps.size].nickname} text-gray-400`}>
                    @{nickname}
                </p>
            )}
        </div>
    );
};

export default Avatar;
