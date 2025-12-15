

import { Position, Team, MatchEvent, PlayerPerformance } from '../types';

// --- RATINGS CALCULATOR ---
export const calculateRating = (
    position: Position,
    goals: number,
    assists: number,
    yellowCards: number,
    redCards: number,
    goalsConceded: number,
    matchResult: 'WIN' | 'DRAW' | 'LOSS'
): number => {
    // Base rating
    let rating = 6.0;

    // 1. Position Weights for Goals & Assists
    let goalWeight = 0;
    let assistWeight = 0;

    switch (position) {
        case Position.SNT: // Forvet
            goalWeight = 1.0;
            assistWeight = 0.6;
            break;
        case Position.SLK: // Kanatlar
        case Position.SGK:
        case Position.OOS: // Ofansif Orta Saha
            goalWeight = 0.95;
            assistWeight = 0.8;
            break;
        case Position.OS: // Merkez Orta Saha
            goalWeight = 0.9;
            assistWeight = 0.7;
            break;
        case Position.STP: // Defanslar
        case Position.SLB:
        case Position.SGB:
        case Position.GK:
            goalWeight = 0.8;
            assistWeight = 0.5;
            break;
    }

    rating += (goals * goalWeight);
    rating += (assists * assistWeight);

    // 2. Match Result Impact
    if (matchResult === 'WIN') rating += 0.3;
    else if (matchResult === 'LOSS') rating -= 0.3;
    // Draw is +0.0

    // 3. Defensive Bonuses & Penalties (GK & DEF Only)
    if ([Position.GK, Position.STP, Position.SLB, Position.SGB].includes(position)) {
        if (goalsConceded === 0) {
            // Clean Sheet Bonus
            if (position === Position.GK) rating += 1.5;
            else rating += 0.5;
        } else {
            // Penalty per goal conceded
            const penaltyPerGoal = position === Position.GK ? 0.2 : 0.1;
            rating -= (goalsConceded * penaltyPerGoal);
        }
    }

    // 4. Discipline Penalties
    rating -= (yellowCards * 0.3);
    rating -= (redCards * 1.2);

    // 5. Random Fluctuation (Simulate "contribution without stats")
    // Adds a random value between -0.2 and +0.4
    const randomFluctuation = (Math.random() * 0.6) - 0.2;
    rating += randomFluctuation;

    // Clamp rating between 1.0 and 10.0
    return Math.max(1.0, Math.min(10.0, Number(rating.toFixed(1))));
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

        // Only First 11 gets ratings usually, but we check everyone who had an event
        // For simplicity in this engine, we assume the first 11 played.
        const lineup = team.players.slice(0, 11);

        return lineup.map(player => {
            const playerEvents = events.filter(e => e.teamName === team.name);
            
            const goals = playerEvents.filter(e => e.type === 'GOAL' && e.scorer === player.name).length;
            const assists = playerEvents.filter(e => e.type === 'GOAL' && e.assist === player.name).length;
            const yellowCards = playerEvents.filter(e => e.type === 'CARD_YELLOW' && e.playerId === player.id).length;
            const redCards = playerEvents.filter(e => e.type === 'CARD_RED' && e.playerId === player.id).length;
            
            const rating = calculateRating(
                player.position,
                goals,
                assists,
                yellowCards,
                redCards,
                oppScore, // Goals Conceded
                result
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