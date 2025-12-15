

import { Team, Position, Fixture, BettingOdds, ManagerStats } from '../types';

export const calculateTeamStrength = (team: Team): number => {
    const xi = team.players.slice(0, 11);
    
    if (xi.length === 0) return 0;
    
    let totalSkill = 0;

    xi.forEach((p, index) => {
        // Injury Check
        if (p.injury && !p.hasInjectionForNextMatch) {
            // Injured player in XI contributes 0 strength (huge penalty)
            totalSkill += 0;
            return;
        }

        if (p.suspendedUntilWeek && p.suspendedUntilWeek > 0) { 
             totalSkill += 0; 
             return;
        }

        let effectiveSkill = p.skill;

        if (index === 0) {
            if (p.position !== Position.GK) effectiveSkill = effectiveSkill * 0.1; 
        } else {
            if (p.position === Position.GK) effectiveSkill = effectiveSkill * 0.5;
        }

        totalSkill += effectiveSkill;
    });
    
    let baseStrength = totalSkill / 11;
    const moraleFactor = 1 + ((team.morale - 50) / 500); 
    
    return baseStrength * moraleFactor;
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
    const hStr = calculateTeamStrength(home) + 5; // Home advantage
    const aStr = calculateTeamStrength(away);
    
    if (hStr + aStr === 0) return { home: 1, draw: 1, away: 1 };

    const total = hStr + aStr;
    
    // Dynamic Draw Probability calculation
    // Determines how "close" the teams are. 1 = Equal, 0 = Infinite difference.
    const strengthRatio = Math.min(hStr, aStr) / Math.max(hStr, aStr); 
    
    // Draw probability scales with closeness
    // Ranges from ~15% (huge mismatch) to ~30% (equal teams)
    const dProb = 0.15 + (0.15 * strengthRatio);

    const remainingProb = 1 - dProb;
    
    const hProb = (hStr / total) * remainingProb;
    const aProb = (aStr / total) * remainingProb;

    // House edge (margin)
    const margin = 1.12;

    // Helper to format
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
    let power = 50; // Base Power

    // 1. League Titles Logic (Diminishing Returns)
    const leagueBase = 3;
    const leagueMultipliers = [1.50, 1.20, 1.00, 0.80, 0.60, 0.45, 0.35, 0.25];
    for (let i = 0; i < stats.leagueTitles; i++) {
        const mult = i < 7 ? leagueMultipliers[i] : 0.25;
        power += (leagueBase * mult);
    }

    // 2. Domestic Cups Logic (Diminishing Returns)
    const cupBase = 1;
    const cupMultipliers = [1.50, 1.20, 1.00, 0.80, 0.60, 0.45, 0.35, 0.25];
    for (let i = 0; i < stats.domesticCups; i++) {
        const mult = i < 7 ? cupMultipliers[i] : 0.25;
        power += (cupBase * mult);
    }

    // 3. European Cups Logic (Fixed Values)
    // 1st: +9, 2nd: +3, 3rd: +2, 4th+: +1
    const euroValues = [9, 3, 2, 1]; // 4th is 1, and subsequent are also 1
    for (let i = 0; i < stats.europeanCups; i++) {
        if (i < 3) power += euroValues[i];
        else power += 1;
    }

    return Math.round(power);
};