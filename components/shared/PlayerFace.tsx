
import React from 'react';
import { Player, Position } from '../../types';
import { FACE_ASSETS } from '../../constants';

interface PlayerFaceProps {
    player: Player;
    className?: string;
}

const PlayerFace: React.FC<PlayerFaceProps> = ({ player, className = "w-full h-full" }) => {
    const shirtUrl = player.position === Position.GK ? FACE_ASSETS.shirt.gk : FACE_ASSETS.shirt.outfield;

    // Use player.face data if available, otherwise fallback to defaults (for backward compatibility or safety)
    const face = player.face || {
        skin: FACE_ASSETS.skin[0],
        eyes: FACE_ASSETS.eyes[0],
        brows: FACE_ASSETS.brows[0],
        hair: FACE_ASSETS.hair[0]
    };

    return (
        <div className={`relative overflow-hidden bg-slate-200 rounded-lg ${className}`}>
            {/* 1. Skin (Base) */}
            <img src={face.skin} alt="Skin" className="absolute inset-0 w-full h-full object-cover z-10" />
            
            {/* 2. Eyes */}
            <img src={face.eyes} alt="Eyes" className="absolute inset-0 w-full h-full object-cover z-20" />
            
            {/* 3. Brows */}
            <img src={face.brows} alt="Brows" className="absolute inset-0 w-full h-full object-cover z-30" />
            
            {/* 4. Shirt (Sits on neck, usually below hair but above skin neck) */}
            <img src={shirtUrl} alt="Shirt" className="absolute inset-0 w-full h-full object-cover z-40" />

            {/* 5. Hair (Topmost) */}
            <img src={face.hair} alt="Hair" className="absolute inset-0 w-full h-full object-cover z-50" />
        </div>
    );
};

export default PlayerFace;
