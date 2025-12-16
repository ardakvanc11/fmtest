
import { Position, Team, MatchEvent, PlayerPerformance } from '../types';

// Helper to generate simulated granular stats based on skill
const simulateGranularStats = (position: Position, skill: number, minutesPlayed: number) => {
    // Skill factor (0.5 to 1.5)
    const f = skill / 70; 
    const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const chance = (pct: number) => Math.random() < pct;

    // Base stats
    let passAcc = Math.min(100, Math.max(50, r(65, 90) + (skill - 60)));
    let groundDuelWinRate = Math.min(100, r(30, 70) + (skill > 80 ? 10 : 0));
    let aerialDuelWinRate = Math.min(100, r(30, 70) + (skill > 80 ? 10 : 0));
    
    // Position biases
    if (position === Position.STP || position === Position.OS) passAcc += 5;
    if (position === Position.STP) aerialDuelWinRate += 10;

    return {
        passAcc,
        groundDuelWinRate,
        aerialDuelWinRate,
        tacklesWon: r(0, 3) * f,
        interceptions: r(0, 3) * f,
        clearances: position === Position.STP ? r(2, 8) : r(0, 2),
        blockedShots: position === Position.STP ? r(0, 3) : 0,
        recoveries: r(2, 8),
        keyPasses: (position === Position.OS || position === Position.OOS || position === Position.SLK || position === Position.SGK) ? r(0, 4) * f : r(0, 1),
        successfulDribbles: (position === Position.SLK || position === Position.SGK || position === Position.OOS) ? r(0, 5) * f : r(0, 1),
        accurateCrosses: (position === Position.SLK || position === Position.SGK || position === Position.SLB || position === Position.SGB) ? r(0, 4) * f : 0,
        foulsCommitted: r(0, 2),
        possessionLost: r(5, 15) - (skill > 80 ? 3 : 0),
        bigChanceMissed: 0, // Handled by main event logic mostly, but added here for flavor
        errorLeadingToShot: chance(0.02) ? 1 : 0, // Rare
        errorLeadingToGoal: chance(0.005) ? 1 : 0, // Very Rare
        saves: position === Position.GK ? r(2, 6) : 0,
        highClaims: position === Position.GK ? r(0, 3) : 0,
        savePct: position === Position.GK ? r(50, 100) : 0,
    };
};

export const calculateRating = (
    position: Position,
    skill: number,
    goals: number,
    assists: number,
    yellowCards: number,
    redCards: number,
    goalsConceded: number, // For GK/Defenders
    matchResult: 'WIN' | 'DRAW' | 'LOSS',
    minutesPlayed: number = 90,
    ratingBonus: number = 0 // NEW: Bonus parameter for match deciding goals
): number => {
    
    // --- 1. BASELINE ---
    // GK Starts higher as baseline "No mistakes" value
    let rating = position === Position.GK ? 6.8 : 6.5;

    // --- 2. RESULT IMPACT ---
    // RULE: Win bonus (+0.25) does NOT stack with match impact bonus (ratingBonus).
    if (matchResult === 'WIN' && ratingBonus === 0) rating += 0.25;
    else if (matchResult === 'DRAW') rating += 0.05;
    else if (matchResult === 'LOSS') rating -= 0.25;

    // --- 3. SIMULATE HIDDEN STATS ---
    const s = simulateGranularStats(position, skill, minutesPlayed);

    let positives = 0;
    let negatives = 0;

    // --- 4. POSITION SPECIFIC LOGIC ---

    // 🛡️ SAVUNMACI (STP)
    if (position === Position.STP) {
        positives += (goals * 0.60);
        positives += (assists * 0.40);
        
        positives += (s.tacklesWon * 0.15);
        positives += (s.interceptions * 0.15);
        positives += (s.clearances * 0.10);
        positives += (s.blockedShots * 0.15);
        positives += (s.recoveries * 0.05);
        if (s.groundDuelWinRate >= 60) positives += 0.20;
        if (s.aerialDuelWinRate >= 60) positives += 0.15;
        if (s.passAcc >= 90) positives += 0.20;
        if (s.passAcc >= 95) positives += 0.35;

        negatives -= (s.possessionLost * 0.05);
        negatives -= (s.foulsCommitted * 0.05);
        if (s.passAcc < 80) negatives -= 0.30;
        if (s.passAcc < 70) negatives -= 0.50;
        
        // RULE: Clean sheet bonus changed to 0.4
        if (goalsConceded === 0) positives += 0.40;
        else negatives -= (goalsConceded * 0.15);
    }

    // ⚔️ ORTA SAHA (OS, OOS)
    else if (position === Position.OS || position === Position.OOS) {
        positives += (goals * 0.20);
        positives += (assists * 0.25);
        positives += (s.keyPasses * 0.15);
        positives += (s.interceptions * 0.15);
        positives += (s.tacklesWon * 0.15);
        positives += (s.recoveries * 0.05);
        if (s.passAcc >= 90) positives += 0.20;
        if (s.passAcc >= 95) positives += 0.35;
        if (s.groundDuelWinRate >= 55) positives += 0.20;

        negatives -= (s.possessionLost * 0.05);
        negatives -= (s.foulsCommitted * 0.05);
        if (s.passAcc < 80) negatives -= 0.30;
        if (s.passAcc < 70) negatives -= 0.50;
    }

    // 🟠 KANAT (SLK, SGK)
    else if (position === Position.SLK || position === Position.SGK) {
        positives += (goals * 0.30);
        positives += (assists * 0.30);
        positives += (s.keyPasses * 0.15);
        positives += (s.successfulDribbles * 0.15);
        positives += (s.accurateCrosses * 0.10);
        
        if (s.successfulDribbles > 2) positives += 0.20; 
        if (s.passAcc >= 85) positives += 0.20;

        negatives -= (s.possessionLost * 0.05);
        negatives -= (s.foulsCommitted * 0.05);
        if (s.passAcc < 75) negatives -= 0.30;
    }

    // 🔵 BEK (SLB, SGB)
    else if (position === Position.SLB || position === Position.SGB) {
        positives += (goals * 0.72);
        positives += (assists * 0.52);

        positives += (s.tacklesWon * 0.15);
        positives += (s.interceptions * 0.15);
        positives += (s.clearances * 0.10);
        positives += (s.blockedShots * 0.15);
        
        positives += (s.accurateCrosses * 0.12);
        
        positives += (s.keyPasses * 0.10);
        if (s.groundDuelWinRate >= 60) positives += 0.20;
        if (s.aerialDuelWinRate >= 55) positives += 0.15;
        if (s.passAcc >= 90) positives += 0.20;

        negatives -= (s.possessionLost * 0.05 * 0.7);
        if (s.passAcc < 80) negatives -= (0.30 * 0.7);
        negatives -= (s.foulsCommitted * 0.05);

        // RULE: Clean sheet bonus changed to 0.4
        if (goalsConceded === 0) positives += 0.40; 
        else negatives -= (goalsConceded * 0.10);
    }

    // 🔴 FORVET (SNT)
    else if (position === Position.SNT) {
        positives += (goals * 0.50);
        positives += (assists * 0.30);
        const shotsOnTarget = goals + Math.floor(Math.random() * 2);
        positives += (shotsOnTarget * 0.15);
        positives += (s.keyPasses * 0.10);
        positives += (s.successfulDribbles * 0.10);
        if (goals >= 2) positives += 0.20;

        let rawNegatives = 0;
        if (goals === 0 && Math.random() < 0.3) rawNegatives -= 0.20;
        
        rawNegatives -= (s.possessionLost * 0.05 * 0.5);
        rawNegatives -= (s.foulsCommitted * 0.05);
        
        if (s.groundDuelWinRate < 40) rawNegatives -= (0.20 * 0.5);
        if (s.passAcc < 75) rawNegatives -= (0.30 * 0.5);

        // STRIKER NEGATIVE CAP: Adjusted to -0.9
        negatives = Math.max(rawNegatives, -0.9);
    }

    // 🧤 KALECİ (GK)
    else if (position === Position.GK) {
        // RULE: GK assists count as 0.5 assist
        positives += (assists * 0.50);

        positives += (s.saves * 0.20);
        // RULE: Clean sheet bonus
        if (goalsConceded === 0) positives += 0.40;
        
        // RULE: Quiet Clean Sheet Bonus (+0.2)
        if (s.saves === 0 && goalsConceded === 0) {
            positives += 0.20;
        }

        positives += (s.highClaims * 0.15);
        if (s.savePct >= 75) positives += 0.20;

        negatives -= (goalsConceded * 0.40);
        if (s.errorLeadingToShot) negatives -= 0.70;
        if (s.errorLeadingToGoal) negatives -= 1.20;
        if (s.savePct < 60) negatives -= 0.30;
    }

    // Combine Base + Pos + Neg
    rating += positives + negatives;

    // --- 5. RARE BIG MISTAKES (Global) & CARDS ---
    if (position !== Position.GK) {
        if (s.errorLeadingToShot) rating -= 0.60;
        if (s.errorLeadingToGoal) rating -= 1.20;
    }
    
    if (redCards > 0) rating -= 2.00;
    if (yellowCards > 0) rating -= 0.20;

    // --- 6. FLOOR THRESHOLDS ---
    // SNT moved to end. Kept others.
    
    if (position === Position.SLB || position === Position.SGB) {
        // UPDATED: Fullback Assist Floors
        if (assists >= 5) rating = Math.max(rating, 8.1);
        else if (assists >= 4) rating = Math.max(rating, 7.8);
        else if (assists >= 3) rating = Math.max(rating, 7.4);
        // Existing
        else if (assists >= 2) rating = Math.max(rating, 7.2);
        else if (assists >= 1) rating = Math.max(rating, 6.8);

        if (goals >= 1 && assists >= 1) rating = Math.max(rating, 7.6);
        else if (goals >= 1) rating = Math.max(rating, 7.2);
    }

    // --- 7. CLAMPING & RULES ---
    const hasMajorError = redCards > 0 || s.errorLeadingToGoal > 0;
    if (!hasMajorError) {
        rating = Math.max(5.8, rating);
    }

    // --- 8. APPLY BONUS (Match Decider) ---
    rating += ratingBonus;

    // --- 9. STRIKER GOAL FLOOR (Applied AFTER everything) ---
    if (position === Position.SNT) {
        if (goals >= 4) rating = Math.max(rating, 9.0);
        else if (goals === 3) rating = Math.max(rating, 8.8);
        else if (goals === 2) rating = Math.max(rating, 8.3);
        else if (goals === 1) rating = Math.max(rating, 7.8);
    }

    // --- 10. RULE: > 8.5 CEILING CHECK ---
    // A player can exceed 8.5 ONLY IF:
    // - scored 2+ goals
    // OR
    // - scored 1 goal + 1 assist
    // OR
    // - goalkeeper with 5+ saves AND clean sheet
    if (rating > 8.5) {
        const twoGoals = goals >= 2;
        const goalAndAssist = goals >= 1 && assists >= 1;
        const gkSuperPerformance = position === Position.GK && goalsConceded === 0 && s.saves >= 5;
        
        if (!twoGoals && !goalAndAssist && !gkSuperPerformance) {
            rating = 8.5;
        }
    }

    // Standard clamping 3.0 to 10.0
    return Math.max(3.0, Math.min(10.0, Number(rating.toFixed(1))));
};

export const calculateRatingsFromEvents = (
    homeTeam: Team, 
    awayTeam: Team, 
    events: MatchEvent[], 
    homeScore: number, 
    awayScore: number
): { homeRatings: PlayerPerformance[], awayRatings: PlayerPerformance[] } => {
    
    const calculateForTeam = (team: Team, isHome: boolean): PlayerPerformance[] => {
        const myScore = isHome ? homeScore : awayScore;
        const oppScore = isHome ? awayScore : homeScore;
        
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        if (myScore > oppScore) result = 'WIN';
        else if (myScore < oppScore) result = 'LOSS';

        // --- DETERMINE WINNING GOAL SCORER ---
        let winningGoalScorerName: string | null = null;
        let isOneZeroWin = false;

        if (result === 'WIN') {
            const myGoalsEvents = events
                .filter(e => e.type === 'GOAL' && e.teamName === team.name)
                .sort((a,b) => a.minute - b.minute);
            
            const winningGoalEvent = myGoalsEvents[oppScore];
            
            if (winningGoalEvent && winningGoalEvent.scorer) {
                winningGoalScorerName = winningGoalEvent.scorer;
            }

            if (myScore === 1 && oppScore === 0) {
                isOneZeroWin = true;
            }
        }

        const lineup = team.players.slice(0, 11);

        let ratings = lineup.map(player => {
            const playerEvents = events.filter(e => e.teamName === team.name);
            
            const goals = playerEvents.filter(e => e.type === 'GOAL' && e.scorer === player.name).length;
            const assists = playerEvents.filter(e => e.type === 'GOAL' && e.assist === player.name).length;
            const yellowCards = playerEvents.filter(e => e.type === 'CARD_YELLOW' && e.playerId === player.id).length;
            const redCards = playerEvents.filter(e => e.type === 'CARD_RED' && e.playerId === player.id).length;
            
            // Determine Bonus
            let bonus = 0;
            if (winningGoalScorerName && player.name === winningGoalScorerName) {
                if (isOneZeroWin) bonus = 0.5;
                else bonus = 0.3;
            }

            const rating = calculateRating(
                player.position,
                player.skill,
                goals,
                assists,
                yellowCards,
                redCards,
                oppScore,
                result,
                90,
                bonus // Pass the bonus
            );

            return {
                playerId: player.id,
                name: player.name,
                position: player.position,
                rating,
                goals,
                assists
            };
        });

        // --- RULE: Do NOT allow more than 2 players per team to go below 5.5 ---
        const poorPerformers = ratings.filter(r => r.rating < 5.5);
        if (poorPerformers.length > 2) {
            poorPerformers.sort((a, b) => a.rating - b.rating);
            const idsToBump = poorPerformers.slice(2).map(p => p.playerId);
            ratings = ratings.map(r => {
                if (idsToBump.includes(r.playerId)) {
                    return { ...r, rating: 5.5 };
                }
                return r;
            });
        }

        // --- RULE: Maximum ONE player per team can exceed 9.0 rating ---
        const highPerformers = ratings.filter(r => r.rating > 9.0);
        if (highPerformers.length > 1) {
            // Sort to find highest
            highPerformers.sort((a, b) => b.rating - a.rating);
            // The best player keeps their rating
            const bestId = highPerformers[0].playerId;
            
            // Clamp others to 9.0
            ratings = ratings.map(r => {
                if (r.rating > 9.0 && r.playerId !== bestId) {
                    return { ...r, rating: 9.0 };
                }
                return r;
            });
        }

        return ratings;
    };

    return {
        homeRatings: calculateForTeam(homeTeam, true),
        awayRatings: calculateForTeam(awayTeam, false)
    };
};

export const determineMVP = (homeRatings: PlayerPerformance[], awayRatings: PlayerPerformance[]): { id: string, name: string } => {
    const allPlayers = [...homeRatings, ...awayRatings];
    
    // Sort logic: Rating > Goals > Assists
    allPlayers.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.assists - a.assists;
    });

    const best = allPlayers[0];
    return {
        id: best?.playerId || '',
        name: best?.name || 'Bilinmiyor'
    };
};
