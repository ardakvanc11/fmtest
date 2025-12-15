

import React from 'react';
import { Player, Position } from '../../types';
import { FACE_ASSETS } from '../../constants';

interface PlayerFaceProps {
    player: Player;
    className?: string;
}

const PlayerFace: React.FC<PlayerFaceProps> = ({ player, className = "w-full h-full" }) => {
    // Determine Shirt Rendering Logic
    const isGK = player.position === Position.GK;

    // 1. Base Shirt Logic
    // If GK: Always use the generic GK shirt asset as the base.
    // If Outfield: Use team jersey if available, else generic outfield.
    const baseShirtUrl = isGK 
        ? FACE_ASSETS.shirt.gk 
        : (player.jersey || FACE_ASSETS.shirt.outfield);

    // 2. GK Overlay Logic
    // If GK: The `player.jersey` property now holds the *overlay* URL (logo/sponsor) provided in initialization.
    // If Outfield: No overlay (the base shirt is the full kit).
    const gkOverlayUrl = isGK ? player.jersey : null;

    // Use player.face data if available, otherwise fallback to defaults (for backward compatibility or safety)
    const face = player.face || {
        skin: FACE_ASSETS.skin[0],
        eyes: FACE_ASSETS.eyes[0],
        brows: FACE_ASSETS.brows[0],
        hair: FACE_ASSETS.hair[0]
    };

    return (
        <div className={`relative overflow-hidden bg-slate-200 rounded-lg ${className}`}>
            {/* 1. Skin (Base) - Z: 10 */}
            <img src={face.skin} alt="Skin" className="absolute inset-0 w-full h-full object-cover z-10" />
            
            {/* 2. Tattoo (Optional) - Z: 15 */}
            {face.tattoo && (
                <img src={face.tattoo} alt="Tattoo" className="absolute inset-0 w-full h-full object-cover z-15" style={{ zIndex: 15 }} />
            )}

            {/* 3. Freckles (Optional) - Z: 16 */}
            {face.freckles && (
                <img src={face.freckles} alt="Freckles" className="absolute inset-0 w-full h-full object-cover z-16" style={{ zIndex: 16 }} />
            )}

            {/* 4. Eyes - Z: 20 */}
            <img src={face.eyes} alt="Eyes" className="absolute inset-0 w-full h-full object-cover z-20" />
            
            {/* 5. Brows - Z: 30 */}
            <img src={face.brows} alt="Brows" className="absolute inset-0 w-full h-full object-cover z-30" />
            
            {/* 6. Beard (Optional) - Z: 35 - Usually sits on chin/jaw */}
            {face.beard && (
                <img src={face.beard} alt="Beard" className="absolute inset-0 w-full h-full object-cover z-35" style={{ zIndex: 35 }} />
            )}

            {/* 7. Base Shirt (Sits on neck) - Z: 40 */}
            <img src={baseShirtUrl} alt="Shirt Base" className="absolute inset-0 w-full h-full object-cover z-40" />

            {/* 7.5 GK Overlay (Logos/Sponsors on top of GK shirt) - Z: 41 */}
            {gkOverlayUrl && (
                <img src={gkOverlayUrl} alt="GK Overlay" className="absolute inset-0 w-full h-full object-cover z-41" style={{ zIndex: 41 }} />
            )}

            {/* 8. Hair (Topmost) - Z: 50 */}
            <img src={face.hair} alt="Hair" className="absolute inset-0 w-full h-full object-cover z-50" />
        </div>
    );
};

export default PlayerFace;
