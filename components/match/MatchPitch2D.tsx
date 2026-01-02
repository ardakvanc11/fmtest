
import React, { useEffect, useState, useRef } from 'react';
import { Player, Position, Team } from '../../types';

interface MatchPitch2DProps {
    homeTeam: Team;
    awayTeam: Team;
    ballPosition: { x: number, y: number };
    possessionTeamId: string | null;
    lastAction: string;
}

// Formations mapped to percentages (Left 0-100, Bottom 0-100)
// Home plays Bottom -> Up. Away plays Top -> Down (Mirrored).
const FORMATIONS: Record<string, { left: number, bottom: number }[]> = {
    '4-4-2': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 15, bottom: 50 },  // LM
        { left: 35, bottom: 45 },  // LCM
        { left: 65, bottom: 45 },  // RCM
        { left: 85, bottom: 50 },  // RM
        { left: 35, bottom: 75 },  // LST
        { left: 65, bottom: 75 }   // RST
    ],
    '4-3-3': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 50, bottom: 35 },  // DM
        { left: 30, bottom: 55 },  // LCM
        { left: 70, bottom: 55 },  // RCM
        { left: 15, bottom: 75 },  // LW
        { left: 85, bottom: 75 },  // RW
        { left: 50, bottom: 80 }   // ST
    ],
    '4-2-3-1': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 35, bottom: 35 },  // LDM
        { left: 65, bottom: 35 },  // RDM
        { left: 20, bottom: 60 },  // LAM
        { left: 50, bottom: 60 },  // CAM
        { left: 80, bottom: 60 },  // RAM
        { left: 50, bottom: 80 }   // ST
    ],
    // Fallback
    '4-1-4-1': [
        { left: 50, bottom: 5 },
        { left: 15, bottom: 20 }, { left: 35, bottom: 20 }, { left: 65, bottom: 20 }, { left: 85, bottom: 20 },
        { left: 50, bottom: 35 },
        { left: 15, bottom: 55 }, { left: 35, bottom: 55 }, { left: 65, bottom: 55 }, { left: 85, bottom: 55 },
        { left: 50, bottom: 80 }
    ]
};

// Helper to determine role based on index in array
const getRole = (index: number): 'GK' | 'DEF' | 'MID' | 'FWD' => {
    if (index === 0) return 'GK';
    if (index <= 4) return 'DEF';
    if (index <= 8) return 'MID';
    return 'FWD';
};

// Helper for Linear Interpolation
const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

const MatchPitch2D: React.FC<MatchPitch2DProps> = ({ homeTeam, awayTeam, ballPosition, possessionTeamId, lastAction }) => {
    
    // Positions State: Stores current X/Y for all players
    // Key: `${teamId}_${playerIndex}`
    const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});
    
    // Refs for animation loop to avoid dependency staleness
    const requestRef = useRef<number>(0);
    const ballRef = useRef(ballPosition);
    const possessionRef = useRef(possessionTeamId);

    // Update refs when props change
    useEffect(() => { ballRef.current = ballPosition; }, [ballPosition]);
    useEffect(() => { possessionRef.current = possessionTeamId; }, [possessionTeamId]);

    // --- MAIN CALCULATION LOGIC ---
    const calculateTargetPos = (
        anchor: { left: number, bottom: number },
        ball: { x: number, y: number },
        role: 'GK' | 'DEF' | 'MID' | 'FWD',
        isHome: boolean,
        isAttacking: boolean
    ) => {
        let targetX = anchor.left;
        let targetY = anchor.bottom;

        // Coordinates normalization:
        // Home Anchor: Bottom-Up (0-100)
        // Away Anchor: Top-Down (needs mirror for calculation relative to pitch 0-100 bottom-up)
        let baseY = isHome ? anchor.bottom : (100 - anchor.bottom);
        let baseX = isHome ? anchor.left : (100 - anchor.left);

        // Vector to ball
        const dx = ball.x - baseX;
        const dy = ball.y - baseY;
        const distToBall = Math.sqrt(dx * dx + dy * dy);

        // --- BOUNDING BOX & BEHAVIOR LOGIC ---

        if (role === 'GK') {
            // GK stays in box, mirrors ball x slightly
            targetX = baseX + (dx * 0.15); 
            // GK Y: Moves up slightly if ball is far
            targetY = baseY + (ball.y > 50 ? (isHome ? 10 : -10) : 0);
            
            // Clamp to penalty area
            targetX = Math.max(35, Math.min(65, targetX));
            targetY = isHome ? Math.max(2, Math.min(15, targetY)) : Math.max(85, Math.min(98, targetY));
        } 
        else if (role === 'DEF') {
            if (isAttacking) {
                // High Line: Push up to midfield but stay behind ball
                const pushUpLimit = isHome ? 55 : 45; 
                // Move towards ball X slightly
                targetX = baseX + (dx * 0.3);
                // Push Y up but respect limit
                targetY = baseY + (isHome ? 20 : -20);
                
                // Clamp
                if (isHome) targetY = Math.min(Math.min(ball.y - 10, pushUpLimit), targetY);
                else targetY = Math.max(Math.max(ball.y + 10, pushUpLimit), targetY);

            } else {
                // Defending: Get Tight
                // Move heavily towards ball X
                targetX = baseX + (dx * 0.6);
                // Drop back towards goal relative to ball
                targetY = ball.y + (isHome ? -15 : 15);
                
                // Don't drop BEHIND anchor too much (don't sit on goalkeeper)
                if (isHome) targetY = Math.max(10, targetY);
                else targetY = Math.min(90, targetY);
            }
        } 
        else if (role === 'MID') {
            // Box-to-Box: Follow ball aggressively
            // 70% towards ball X, 60% towards ball Y
            targetX = baseX + (dx * 0.7);
            targetY = baseY + (dy * 0.6);

            // Bounds: Don't go into own goal area too deep
            if (isHome) targetY = Math.max(20, Math.min(90, targetY));
            else targetY = Math.min(80, Math.max(10, targetY));
        } 
        else if (role === 'FWD') {
            if (isAttacking) {
                // Run into channels or box
                targetX = baseX + (dx * 0.5);
                // Push high up against defenders
                targetY = isHome ? Math.max(ball.y, 85) : Math.min(ball.y, 15);
                
                // If ball is very close, move to it (receive pass)
                if (distToBall < 20) {
                    targetX = ball.x;
                    targetY = ball.y;
                }
            } else {
                // Defending: Drop to midfield/halfway
                targetX = baseX + (dx * 0.2);
                targetY = isHome ? Math.max(baseY, 45) : Math.min(baseY, 55);
            }
        }

        // --- PRESSING OVERRIDE (Close Proximity) ---
        // If ball is very close (pressing distance) and not GK, lock on
        if (role !== 'GK' && distToBall < 12) {
            // Move 90% towards ball
            targetX = ball.x;
            targetY = ball.y;
        }

        return { x: targetX, y: targetY };
    };

    const updatePositions = () => {
        setPositions(prev => {
            const nextPositions = { ...prev };
            const ball = ballRef.current;
            const possessionId = possessionRef.current;

            const updateTeam = (team: Team, isHome: boolean) => {
                const isAttacking = possessionId === team.id;
                const formation = FORMATIONS[team.formation] || FORMATIONS['4-4-2'];

                team.players.slice(0, 11).forEach((player, idx) => {
                    const key = `${team.id}_${idx}`;
                    const anchor = formation[idx] || formation[0];
                    const role = getRole(idx);
                    
                    // 1. Calculate Target
                    const target = calculateTargetPos(anchor, ball, role, isHome, isAttacking);

                    // 2. Get Current
                    const current = nextPositions[key] || { 
                        x: isHome ? anchor.left : (100 - anchor.left), 
                        y: isHome ? anchor.bottom : (100 - anchor.bottom) 
                    };

                    // 3. Lerp (Randomize speed slightly for organic feel)
                    // Defenders react slower to forward runs, faster to drops
                    // Midfielders react fast
                    let speed = 0.05; 
                    if (role === 'MID') speed = 0.08;
                    if (role === 'FWD' && isAttacking) speed = 0.07;
                    
                    // Add noise to speed
                    speed += (Math.random() * 0.04 - 0.02);

                    const newX = lerp(current.x, target.x, speed);
                    const newY = lerp(current.y, target.y, speed);

                    nextPositions[key] = { x: newX, y: newY };
                });
            };

            updateTeam(homeTeam, true);
            updateTeam(awayTeam, false);

            return nextPositions;
        });

        requestRef.current = requestAnimationFrame(updatePositions);
    };

    // Start/Stop Loop
    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePositions);
        return () => cancelAnimationFrame(requestRef.current);
    }, [homeTeam, awayTeam]); // Re-bind if teams change (subs)

    
    // --- RENDER HELPERS ---
    const renderTeamPlayers = (team: Team, isHome: boolean) => {
        return team.players.slice(0, 11).map((p, idx) => {
            const key = `${team.id}_${idx}`;
            const pos = positions[key];
            const isPossession = possessionTeamId === team.id;

            // Fallback if loop hasn't started yet
            if (!pos) return null;

            // Visual Styling
            const teamColor = isHome ? homeTeam.colors[0] : awayTeam.colors[0];
            const numberColor = isHome ? homeTeam.colors[1] : awayTeam.colors[1];

            return (
                <div 
                    key={p.id}
                    className={`absolute w-4 h-4 md:w-5 md:h-5 rounded-full border border-white shadow-md flex items-center justify-center text-[8px] md:text-[10px] font-bold transition-transform duration-75 z-10 ${teamColor} ${numberColor}`}
                    style={{ 
                        left: `${pos.x}%`, 
                        bottom: `${pos.y}%`, // Using bottom allows standard coordinate system logic 0-100
                        transform: 'translate(-50%, 50%)'
                    }}
                >
                    {/* Number */}
                    <span className="hidden md:block">{idx + 1}</span>
                    
                    {/* Name Label (Visible on possession or hover) */}
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white whitespace-nowrap drop-shadow-md bg-black/40 px-1 rounded pointer-events-none transition-opacity duration-300 ${isPossession && idx > 0 ? 'opacity-100' : 'opacity-0'}`}>
                        {p.name.split(' ').pop()}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="w-full h-full relative bg-[#1a4a35] overflow-hidden select-none shadow-inner border-r border-l border-slate-700">
            {/* Pitch Markings */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                {/* Grass Stripes */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_10%,rgba(0,0,0,0.1)_10%,rgba(0,0,0,0.1)_20%)]"></div>
                
                {/* Center Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/70"></div>
                <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>

                {/* Goals Areas (Home - Bottom) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[16%] border-t-2 border-x-2 border-white/70"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[18%] h-[6%] border-t-2 border-x-2 border-white/70"></div>
                
                {/* Goals Areas (Away - Top) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[16%] border-b-2 border-x-2 border-white/70"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[18%] h-[6%] border-b-2 border-x-2 border-white/70"></div>

                {/* Corner Arcs */}
                <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/70 rounded-br-full"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/70 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/70 rounded-tr-full"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/70 rounded-tl-full"></div>
            </div>

            {/* Render Players */}
            {renderTeamPlayers(homeTeam, true)}
            {renderTeamPlayers(awayTeam, false)}

            {/* Ball */}
            <div 
                className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-50 transition-all duration-300 ease-linear"
                style={{ 
                    left: `${ballPosition.x}%`, 
                    bottom: `${ballPosition.y}%`,
                    transform: 'translate(-50%, 50%)'
                }}
            >
                {/* Ball trailing effect */}
            </div>

            {/* Last Action Popup */}
            {lastAction && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm border border-white/20 shadow-lg animate-pulse whitespace-nowrap z-40">
                    {lastAction}
                </div>
            )}
        </div>
    );
};

export default MatchPitch2D;
