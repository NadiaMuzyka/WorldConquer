import React from 'react';
import { Check, Hourglass } from 'lucide-react';

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
        let playerColor = '#38C7D7';
        try {
            playerColor = require('../Constants/colors').PLAYER_COLORS?.[id] || '#38C7D7';
        } catch {}
        avatarProps = {
            size: 'xs',
            showName: false,
            showNickname: false,
            borderColor: playerColor,
            borderWidth: 3,
            showIndicator: id === playerID,
            opacity: 1, // sempre visibile
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
    // Icone stato
    const statusIcon = ready
        ? <Check className="w-4 h-4 text-white stroke-[3]" title="Pronto" />
        : <Hourglass className="w-3 h-3 text-white stroke-[3]" title="In attesa" />;
    // Label "Tu" se è il giocatore locale
    const isMe = id === playerID;
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
                {/* Icona stato in basso a destra, sovrapposta, con sfondo a pallino */}
                <span className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-5 h-5 rounded-full bg-[#2e415a] flex items-center justify-center  shadow-md">
                    {statusIcon}
                </span>
            </div>
            {/* Nickname sotto l'avatar */}
            {nickname && (
                <span className="text-xs text-white font-normal mt-2">{isMe ? 'Tu' : nickname}</span>
            )}
        </div>
    );
};

export default Avatar;
