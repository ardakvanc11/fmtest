

import { Team, Position, Fixture, BettingOdds, ManagerStats, Player } from '../types';

// --- CONSTANTS FOR WEIGHTED CALCULATIONS ---

// KRK (Kadro Rolü Katsayısı)
const KRK = {
    STARTER: 1.00,
    RESERVE: 0.35,
    ROTATION: 0.10
};

// PÖK (Pozisyon Önemi Katsayısı)
const POK = {
    OS: 1.10, // CM, DM, AM
    ST: 1.05, // SNT
    GK: 1.00, // GK
    DEF: 0.95, // STP
    WING: 0.90, // SLK, SGK
    FULLBACK: 0.80 // SLB, SGB
};

const getPokForPosition = (pos: Position): number => {
    switch (pos) {
        case Position.OS:
        case Position.OOS: return POK.OS;
        case Position.SNT: return POK.ST;
        case Position.GK: return POK.GK;
        case Position.STP: return POK.DEF;
        case Position.SLK:
        case Position.SGK: return POK.WING;
        case Position.SLB:
        case Position.SGB: return POK.FULLBACK;
        default: return 1.0;
    }
};

/**
 * Calculates the RAW Weighted Team Strength (THG) based on squad roles.
 * Does not apply the "Visible Strength" (GTÜ) delta logic.
 */
export const calculateRawTeamStrength = (players: Player[]): number => {
    if (players.length === 0) return 0;

    // 1. Sort all players by skill (descending)
    const sorted = [...players].sort((a, b) => b.skill - a.skill);

    // 2. Identify Starters (Best fitting 4-4-2)
    // We assume a standard structure for calculation stability:
    // 1 GK, 1 SLB, 1 SGB, 2 STP, 1 SLK, 1 SGK, 2 OS, 2 SNT = 11 Starters
    const starters: Player[] = [];
    const pool = [...sorted];

    const pickBest = (pos: Position, count: number) => {
        const found = [];
        for (let i = 0; i < count; i++) {
            const idx = pool.findIndex(p => p.position === pos);
            if (idx !== -1) {
                found.push(pool[idx]);
                pool.splice(idx, 1); // Remove from pool
            }
        }
        // If we can't find specific position, we will handle them as reserves later
        // But for "Starters" logic in a rigid system, we take what we have.
        // To prevent crash if no GK, we just take best remaining.
        return found;
    };

    // Pick 11 Starters precisely
    starters.push(...pickBest(Position.GK, 1));
    starters.push(...pickBest(Position.SLB, 1));
    starters.push(...pickBest(Position.SGB, 1));
    starters.push(...pickBest(Position.STP, 2));
    starters.push(...pickBest(Position.SLK, 1));
    starters.push(...pickBest(Position.SGK, 1));
    starters.push(...pickBest(Position.OS, 1)); // Try OS first
    starters.push(...pickBest(Position.OOS, 1)); // Try OOS next
    
    // Fill remaining starter slots from best remaining MID/FWD if OS/OOS distinct not found
    // Or simpler: Just prioritize specific roles.
    // Let's ensure we get 2 Central Mids (OS or OOS) total if we missed above.
    const currentMids = starters.filter(p => p.position === Position.OS || p.position === Position.OOS).length;
    if (currentMids < 2) {
        // Find best remaining mid
        const midIdx = pool.findIndex(p => p.position === Position.OS || p.position === Position.OOS);
        if (midIdx !== -1) { starters.push(pool[midIdx]); pool.splice(midIdx, 1); }
    }

    starters.push(...pickBest(Position.SNT, 2));

    // If we still don't have 11 starters (due to missing positions), fill with best remaining
    while (starters.length < 11 && pool.length > 0) {
        starters.push(pool.shift()!);
    }

    // 3. Identify Key Reserves (Next best 7 players)
    const keyReserves: Player[] = [];
    for (let i = 0; i < 7; i++) {
        if (pool.length > 0) keyReserves.push(pool.shift()!);
    }

    // 4. Identify Rotation (Everyone else)
    const rotation = [...pool];

    // 5. Calculate Weighted Average
    let totalContribution = 0;
    let totalWeight = 0;

    const addToCalc = (p: Player, roleCoef: number) => {
        const pok = getPokForPosition(p.position);
        const weight = pok * roleCoef;
        const contribution = p.skill * weight;
        
        totalContribution += contribution;
        totalWeight += weight;
    };

    starters.forEach(p => addToCalc(p, KRK.STARTER));
    keyReserves.forEach(p => addToCalc(p, KRK.RESERVE));
    rotation.forEach(p => addToCalc(p, KRK.ROTATION));

    if (totalWeight === 0) return 0;

    // Round to 1 decimal place
    const thg = totalContribution / totalWeight;
    return Math.round(thg * 10) / 10;
};

/**
 * Calculates the immediate impact on Visible Team Strength based on a transfer.
 * Uses the logic: Reference Strength = Visible Strength - 4.
 */
export const calculateTransferStrengthImpact = (currentVisibleStrength: number, playerSkill: number, isBuying: boolean): number => {
    // Kural: Takım gücü referansı, görünen gücün 4 puan eksiğidir.
    // Örnek: Güç 82 ise referans 78'dir.
    const referenceStrength = currentVisibleStrength - 4;

    if (isBuying) {
        // OYUNCU ALIMI
        if (playerSkill > referenceStrength) {
            // Referansın üzerinde oyuncu alındı -> Güç Artar
            // Fark ne kadar büyükse artış o kadar fazla olur
            const diff = playerSkill - referenceStrength;
            // Örn: Ref 78, Oyuncu 85 (Fark 7) -> 0.3 + (7 * 0.05) = +0.65 güç
            return 0.3 + (diff * 0.05);
        } else {
            // Referansın altında oyuncu alındı -> Güç Artmaz (veya ihmal edilebilir)
            return 0;
        }
    } else {
        // OYUNCU SATIŞI
        if (playerSkill < referenceStrength) {
            // Referansın altında oyuncu satıldı -> Güç Az Düşer
            return -0.1;
        } else {
            // Referansın üzerinde oyuncu satıldı -> Güç Daha Fazla Düşer
            const diff = playerSkill - referenceStrength;
            // Örn: Ref 78, Oyuncu 82 (Fark 4) -> -(0.4 + (4 * 0.1)) = -0.8 güç
            return -(0.4 + (diff * 0.1));
        }
    }
};

/**
 * Updates a team's strength after a roster change.
 * Applies the "Never Drop" rule using Strength Delta.
 */
export const recalculateTeamStrength = (team: Team): Team => {
    // 1. Calculate New Raw Strength (THG)
    const newRawStrength = calculateRawTeamStrength(team.players);
    
    // 2. Calculate Potential Visible Strength
    // If delta is missing (e.g. legacy data), default to 0
    const delta = team.strengthDelta !== undefined ? team.strengthDelta : 0;
    const potentialVisible = Math.round((newRawStrength + delta) * 10) / 10;

    // 3. Apply "Never Drop" Rule
    // Visible Strength (GTÜ) only updates if the new potential > current
    // Note: Use a small epsilon for float comparison safety or just direct
    const currentVisible = team.strength;
    
    let finalVisible = currentVisible;
    if (potentialVisible > currentVisible) {
        finalVisible = potentialVisible;
    }

    // Ensure it's rounded neatly
    finalVisible = Math.round(finalVisible); 

    // Update Team Object
    return {
        ...team,
        rawStrength: newRawStrength,
        strength: finalVisible
    };
};

/**
 * Compatibility wrapper for legacy code if needed, but we mostly use recalculateTeamStrength now.
 * Returns the VISIBLE strength.
 */
export const calculateTeamStrength = (team: Team): number => {
    return team.strength;
};

export const calculateForm = (teamId: string, fixtures: Fixture[]): string[] => {
    const played = fixtures
        .filter(f => f.played && (f.homeTeamId === teamId || f.awayTeamId === teamId))
        .sort((a, b) => b.week - a.week)
        .slice(0, 5);

    return played.map(f => {
        if (f.homeTeamId === teamId) {
            return f.homeScore! > f.awayScore! ? 'W' : f.homeScore! === f.awayScore! ? 'D' : 'L';
        } else {
            return f.awayScore! > f.homeScore! ? 'W' : f.awayScore! === f.homeScore! ? 'D' : 'L';
        }
    }).reverse(); 
};

export const calculateOdds = (home: Team, away: Team): BettingOdds => {
    // Uses Visible Strength for odds calculation
    const hStr = home.strength + 5; // Home advantage
    const aStr = away.strength;
    
    if (hStr + aStr === 0) return { home: 1, draw: 1, away: 1 };

    const total = hStr + aStr;
    
    const strengthRatio = Math.min(hStr, aStr) / Math.max(hStr, aStr); 
    const dProb = 0.15 + (0.15 * strengthRatio);

    const remainingProb = 1 - dProb;
    
    const hProb = (hStr / total) * remainingProb;
    const aProb = (aStr / total) * remainingProb;

    const margin = 1.12;

    const fmt = (p: number) => {
        const val = margin / p;
        return Number(Math.max(1.01, val).toFixed(2));
    };

    return {
        home: fmt(hProb),
        draw: fmt(dProb),
        away: fmt(aProb)
    };
};

export const calculateManagerPower = (stats: ManagerStats): number => {
    let power = 50; 

    const leagueBase = 3;
    const leagueMultipliers = [1.50, 1.20, 1.00, 0.80, 0.60, 0.45, 0.35, 0.25];
    for (let i = 0; i < stats.leagueTitles; i++) {
        const mult = i < 7 ? leagueMultipliers[i] : 0.25;
        power += (leagueBase * mult);
    }

    const cupBase = 1;
    const cupMultipliers = [1.50, 1.20, 1.00, 0.80, 0.60, 0.45, 0.35, 0.25];
    for (let i = 0; i < stats.domesticCups; i++) {
        const mult = i < 7 ? cupMultipliers[i] : 0.25;
        power += (cupBase * mult);
    }

    const euroValues = [9, 3, 2, 1]; 
    for (let i = 0; i < stats.europeanCups; i++) {
        if (i < 3) power += euroValues[i];
        else power += 1;
    }

    return Math.round(power);
};

export const calculateManagerSalary = (strength: number): number => {
    if (strength >= 90) return 2.5;
    if (strength >= 88) return 2.25;
    if (strength >= 86) return 2.0;
    if (strength >= 84) return 1.8;
    if (strength >= 82) return 1.5;
    if (strength >= 80) return 1.25;
    if (strength >= 78) return 1.0;
    if (strength >= 76) return 0.75;
    if (strength >= 75) return 0.6;
    if (strength >= 73) return 0.46;
    if (strength >= 72) return 0.39;
    if (strength >= 71) return 0.32;
    if (strength >= 70) return 0.25;
    if (strength >= 68) return 0.20;
    if (strength >= 60) return 0.15; 
    return 0.10; 
};
