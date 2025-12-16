
import { Team, Player, MatchEvent, MatchStats, Position, Tackling, PlayerPerformance, Fixture } from '../types';
import { INJURY_TYPES, RIVALRIES } from '../constants';
import { MATCH_INFO_MESSAGES } from '../data/infoPool';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';
import { calculateTeamStrength } from './teamCalculations';
import { calculateRating, determineMVP, calculateRatingsFromEvents } from './ratingsAndStats';
import { fillTemplate, pick } from './helpers';

// Used for instant simulation generation where we don't have events yet
// Uses the new calculateRating function with dummy "0" events but relies on the internal
// granular stats simulation of that function to produce the rating.
export const generateRandomPlayerRatings = (players: Player[], teamGoals: number, goalsConceded: number, isWinner: boolean, isDraw: boolean): PlayerPerformance[] => {
    const lineup = [...players].slice(0, 11); 
    
    let ratings = lineup.map(p => {
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'LOSS';
        if (isWinner) result = 'WIN';
        else if (isDraw) result = 'DRAW';

        // Goals are distributed randomly in full simulation, here we just pass 0 for individual goals
        // unless we want to simulate scorers. For quick sim ratings, we rely on the base logic + result.
        // We assume 0 cards and 0 individual goals for this quick generation to let the internal
        // variance logic handle the distribution.
        const rating = calculateRating(
            p.position,
            p.skill,
            0, // goals
            0, // assists
            0, // yellow
            0, // red
            goalsConceded,
            result,
            90, // minutes played
            0   // bonus (can't determine winner accurately here)
        );

        return {
            playerId: p.id,
            name: p.name,
            position: p.position,
            rating,
            goals: 0, 
            assists: 0
        };
    });

    // Apply strict team limits
    const poorPerformers = ratings.filter(r => r.rating < 5.5);
    if (poorPerformers.length > 2) {
        poorPerformers.sort((a, b) => a.rating - b.rating);
        const idsToBump = poorPerformers.slice(2).map(p => p.playerId);
        ratings = ratings.map(r => {
            if (idsToBump.includes(r.playerId)) return { ...r, rating: 5.5 };
            return r;
        });
    }

    return ratings;
};

export const generateMatchStats = (homePlayers: Player[], awayPlayers: Player[], hScore: number, aScore: number): MatchStats => {
    // Initial ratings using the new logic
    const homeRatings = generateRandomPlayerRatings(homePlayers, hScore, aScore, hScore > aScore, hScore === aScore);
    const awayRatings = generateRandomPlayerRatings(awayPlayers, aScore, hScore, aScore > hScore, hScore === aScore);

    const hStr = calculateTeamStrength({ players: homePlayers, morale: 50 } as any);
    const aStr = calculateTeamStrength({ players: awayPlayers, morale: 50 } as any);

    // Calculate Possession based on strength difference
    let homePossession = 50 + ((hStr - aStr) / 2);
    homePossession = Math.min(80, Math.max(20, homePossession + (Math.random() * 10 - 5)));
    
    const possessionAdvantage = homePossession - 50; 
    
    const homeShotBonus = possessionAdvantage > 0 ? Math.ceil(possessionAdvantage / 3.0) : 0;
    const awayShotBonus = possessionAdvantage < 0 ? Math.ceil(Math.abs(possessionAdvantage) / 3.0) : 0;

    const hShots = hScore + Math.floor(Math.random() * 4) + homeShotBonus + (hStr > aStr ? 2 : 0);
    const aShots = aScore + Math.floor(Math.random() * 4) + awayShotBonus + (aStr > hStr ? 2 : 0);
    
    const hTarget = Math.min(hShots, hScore + Math.floor(Math.random() * (hShots - hScore)));
    const aTarget = Math.min(aShots, aScore + Math.floor(Math.random() * (aShots - aScore)));

    const hCorners = Math.floor(Math.random() * 6) + (possessionAdvantage > 5 ? 3 : 0);
    const aCorners = Math.floor(Math.random() * 6) + (possessionAdvantage < -5 ? 3 : 0);
    
    const hFouls = Math.floor(Math.random() * 15);
    const aFouls = Math.floor(Math.random() * 15);

    const hRed = Math.random() < 0.04 ? 1 : 0;
    const aRed = Math.random() < 0.04 ? 1 : 0;

    const mvpInfo = determineMVP(homeRatings, awayRatings);

    return {
        homePossession: Math.round(homePossession),
        awayPossession: Math.round(100 - homePossession),
        homeShots: hShots,
        awayShots: aShots,
        homeShotsOnTarget: hTarget,
        awayShotsOnTarget: aTarget,
        homeCorners: hCorners,
        awayCorners: aCorners,
        homeFouls: hFouls,
        awayFouls: aFouls,
        homeOffsides: Math.floor(Math.random() * 5),
        awayOffsides: Math.floor(Math.random() * 5),
        homeYellowCards: Math.floor(Math.random() * 4),
        awayYellowCards: Math.floor(Math.random() * 4),
        homeRedCards: hRed,
        awayRedCards: aRed,
        mvpPlayerId: mvpInfo.id,
        mvpPlayerName: mvpInfo.name,
        homeRatings,
        awayRatings
    };
};

export const getEmptyMatchStats = (): MatchStats => ({
    homePossession: 50, awayPossession: 50,
    homeShots: 0, awayShots: 0,
    homeShotsOnTarget: 0, awayShotsOnTarget: 0,
    homeCorners: 0, awayCorners: 0,
    homeFouls: 0, awayFouls: 0,
    homeOffsides: 0, awayOffsides: 0,
    homeYellowCards: 0, awayYellowCards: 0,
    homeRedCards: 0, awayRedCards: 0,
    mvpPlayerId: '', mvpPlayerName: '',
    homeRatings: [], awayRatings: []
});

// New Helper: Generate Synthetic Events for Background Matches
export const simulateBackgroundMatch = (home: Team, away: Team): { homeScore: number, awayScore: number, stats: MatchStats, events: MatchEvent[] } => {
    // 1. Determine Score
    const homeStr = calculateTeamStrength(home) + 5; 
    const awayStr = calculateTeamStrength(away);
    const luckHome = Math.random() * 20;
    const luckAway = Math.random() * 20;
    const diff = (homeStr + luckHome) - (awayStr + luckAway);
    
    let homeScore = 0;
    let awayScore = 0;
    
    if (diff > 15) { homeScore = Math.floor(Math.random() * 4) + 2; awayScore = Math.floor(Math.random() * 2); }
    else if (diff > 5) { homeScore = Math.floor(Math.random() * 3) + 1; awayScore = Math.floor(Math.random() * 2); }
    else if (diff < -15) { homeScore = Math.floor(Math.random() * 2); awayScore = Math.floor(Math.random() * 4) + 2; }
    else if (diff < -5) { homeScore = Math.floor(Math.random() * 2); awayScore = Math.floor(Math.random() * 3) + 1; }
    else { homeScore = Math.floor(Math.random() * 3); awayScore = Math.floor(Math.random() * 3); }

    // 2. Generate Events (Goals, Cards) to populate stats
    const events: MatchEvent[] = [];

    const generateEventsForTeam = (team: Team, score: number, isHome: boolean) => {
        const xi = team.players.slice(0, 11);
        const fwds = xi.filter(p => [Position.SNT, Position.SLK, Position.SGK].includes(p.position));
        const mids = xi.filter(p => [Position.OS, Position.OOS].includes(p.position));
        const defs = xi.filter(p => [Position.STP, Position.SLB, Position.SGB].includes(p.position));
        
        // Goals
        // Scorers weighted by position
        const scorerPool = [...fwds, ...fwds, ...fwds, ...mids, ...mids, ...defs];
        
        for(let i=0; i<score; i++) {
            const scorer = scorerPool.length > 0 ? scorerPool[Math.floor(Math.random() * scorerPool.length)] : xi[0];
            let assist = xi[Math.floor(Math.random() * xi.length)];
            if(assist.id === scorer.id) assist = xi.find(p => p.id !== scorer.id) || assist;
            
            const isPenalty = Math.random() < 0.10;
            
            events.push({
                minute: Math.floor(Math.random() * 90) + 1,
                type: 'GOAL',
                description: isPenalty ? 'Penaltı Golü' : 'Gol',
                teamName: team.name,
                scorer: scorer.name,
                assist: isPenalty ? 'Penaltı' : assist.name,
                playerId: scorer.id
            });
        }

        // Yellow Cards (Random 0-3 per team)
        const yellowCount = Math.floor(Math.random() * 4);
        for(let i=0; i<yellowCount; i++) {
            const sinner = xi[Math.floor(Math.random() * xi.length)];
            events.push({
                minute: Math.floor(Math.random() * 90) + 1,
                type: 'CARD_YELLOW',
                description: 'Sarı Kart',
                teamName: team.name,
                playerId: sinner.id
            });
        }

        // Red Cards (Low chance)
        if(Math.random() < 0.05) {
            const sinner = xi[Math.floor(Math.random() * xi.length)];
            events.push({
                minute: Math.floor(Math.random() * 90) + 1,
                type: 'CARD_RED',
                description: 'Kırmızı Kart',
                teamName: team.name,
                playerId: sinner.id
            });
        }
    };

    generateEventsForTeam(home, homeScore, true);
    generateEventsForTeam(away, awayScore, false);

    // Sort events
    events.sort((a,b) => a.minute - b.minute);

    // 3. Generate Stats
    const stats = generateMatchStats(home.players, away.players, homeScore, awayScore);
    
    // 4. Overwrite Random Stats with Actual Event Data for better accuracy in MVP calculation
    const { homeRatings, awayRatings } = calculateRatingsFromEvents(home, away, events, homeScore, awayScore);
    const mvpInfo = determineMVP(homeRatings, awayRatings);
    
    stats.homeRatings = homeRatings;
    stats.awayRatings = awayRatings;
    stats.mvpPlayerId = mvpInfo.id;
    stats.mvpPlayerName = mvpInfo.name;
    stats.homeRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === home.name).length;
    stats.awayRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === away.name).length;
    stats.homeYellowCards = events.filter(e => e.type === 'CARD_YELLOW' && e.teamName === home.name).length;
    stats.awayYellowCards = events.filter(e => e.type === 'CARD_YELLOW' && e.teamName === away.name).length;

    return { homeScore, awayScore, stats, events };
};

// Deprecated wrapper kept for compatibility if needed, but simulateBackgroundMatch is preferred
export const simulateMatchInstant = (home: Team, away: Team): { homeScore: number, awayScore: number, stats: MatchStats } => {
    const res = simulateBackgroundMatch(home, away);
    return { homeScore: res.homeScore, awayScore: res.awayScore, stats: res.stats };
};

// Helper function to get injury based on weighted probability
export const getWeightedInjury = () => {
    const totalWeight = INJURY_TYPES.reduce((sum, item) => sum + item.probability, 0);
    let random = Math.random() * totalWeight;
    
    for (const injury of INJURY_TYPES) {
        if (random < injury.probability) return injury;
        random -= injury.probability;
    }
    return INJURY_TYPES[0];
};

export const simulateMatchStep = (
    minute: number, 
    home: Team, 
    away: Team, 
    currentScore: {h:number, a:number},
    existingEvents: MatchEvent[] = []
): MatchEvent | null => {
    // Frequency: Events happen in ~55% of minutes
    if (Math.random() > 0.55) return null; 

    // --- RED CARD LOGIC ---
    const homeReds = existingEvents.filter(e => e.type === 'CARD_RED' && e.teamName === home.name).length;
    const awayReds = existingEvents.filter(e => e.type === 'CARD_RED' && e.teamName === away.name).length;

    // Apply strength calculations with penalties for red cards
    // Base strength
    let homeStr = calculateTeamStrength(home) + 5;
    let awayStr = calculateTeamStrength(away);

    // Strength Penalty: 15% reduction per red card
    if (homeReds > 0) homeStr *= (1 - (homeReds * 0.15));
    if (awayReds > 0) awayStr *= (1 - (awayReds * 0.15));

    const total = homeStr + awayStr;
    const homeDominance = homeStr / total;
    const eventRoll = Math.random();

    // --- OFFENSIVE DOMINANCE FACTOR ---
    let offensiveDominance = homeDominance;
    if (homeDominance > 0.55) {
        offensiveDominance = Math.min(0.90, homeDominance + 0.15);
    } else if (homeDominance < 0.45) {
        offensiveDominance = Math.max(0.10, homeDominance - 0.15);
    }

    // Check Aggression Settings
    const isHomeAggressive = home.tackling === Tackling.AGGRESSIVE;
    const isAwayAggressive = away.tackling === Tackling.AGGRESSIVE;
    const isAggressiveMatch = isHomeAggressive || isAwayAggressive;

    // Filter players who are already sent off to avoid events for them
    const sentOffPlayers = new Set(existingEvents.filter(e => e.type === 'CARD_RED').map(e => e.playerId));

    // --- NEW: WEIGHTED PLAYER SELECTION FOR INJURIES ---
    // UPDATED: Allows healthy players to be injured, but increases risk for tired/susceptible players
    const getPlayerForInjury = (team: Team): Player => {
        const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
        if (xi.length === 0) return team.players[0];

        const weightedPool: Player[] = [];
        
        xi.forEach(p => {
            // Determine current condition (Use dynamic condition if available, else stat as fallback)
            const currentCondition = p.condition !== undefined ? p.condition : p.stats.stamina;
            
            // Base weight: Every player has a baseline chance (e.g., 15 tickets)
            let weight = 15; 
            
            // 1. Susceptibility Factor (0-100)
            // A player with 80 susceptibility adds ~16 tickets.
            weight += (p.injurySusceptibility || 10) / 5;

            // 2. Fatigue Factor
            // If condition is perfect (100), no added risk.
            // If condition is 50, added risk.
            if (currentCondition < 50) {
                weight += 40; // Massive risk for exhausted players
            } else if (currentCondition < 70) {
                weight += 15; // Moderate risk
            } else if (currentCondition < 90) {
                weight += 5;  // Slight risk
            }

            // Add player to pool 'weight' times
            const entries = Math.max(1, Math.floor(weight));
            for(let i=0; i<entries; i++) {
                weightedPool.push(p);
            }
        });

        const finalPool = weightedPool.length > 0 ? weightedPool : xi;
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    };

    const getPlayer = (team: Team, includeGK = false) => {
        const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
        if (xi.length === 0) return team.players[0];

        const pool = includeGK ? xi : xi.filter(p => p.position !== Position.GK);
        const finalPool = pool.length > 0 ? pool : xi;
        
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    };

    const getScorer = (team: Team) => {
        const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
        if(xi.length === 0) return { scorer: team.players[0], assist: team.players[0] };

        const fwds = xi.filter(p => [Position.SNT, Position.SLK, Position.SGK].includes(p.position));
        const mids = xi.filter(p => [Position.OS, Position.OOS].includes(p.position));
        let scorerPool = [...fwds, ...fwds, ...fwds, ...mids, ...mids, ...xi];
        const scorer = scorerPool[Math.floor(Math.random() * scorerPool.length)];
        let assist = xi[Math.floor(Math.random() * xi.length)];
        if(assist.id === scorer.id) assist = xi.find(p => p.id !== scorer.id) || assist;
        return { scorer, assist };
    };

    /* 
       DISTRIBUTION PLAN (Cumulative)
    */

    let currentGoalProb = 0.05; // Base
    const maxReds = Math.max(homeReds, awayReds);
    if (maxReds === 1) currentGoalProb = 0.06;
    else if (maxReds === 2) currentGoalProb = 0.08;
    else if (maxReds >= 3) currentGoalProb = 0.12;

    // --- DYNAMIC INJURY PROBABILITY ---
    // Count how many players have < 50 condition (critical fatigue)
    const homeExhausted = home.players.slice(0, 11).filter(p => (p.condition !== undefined ? p.condition : p.stats.stamina) < 50).length;
    const awayExhausted = away.players.slice(0, 11).filter(p => (p.condition !== undefined ? p.condition : p.stats.stamina) < 50).length;
    const totalExhausted = homeExhausted + awayExhausted;
    
    // Base 1.2% chance per minute (High frequency)
    // + 0.2% per exhausted player
    const calculatedInjuryProb = 0.012 + (totalExhausted * 0.002);

    const PROB_GOAL = currentGoalProb;
    const PROB_INJURY = calculatedInjuryProb;
    const PROB_FOUL = isAggressiveMatch ? 0.26 : 0.50; 
    const PROB_SAVE = 0.07;
    const PROB_OFFSIDE = 0.10;
    const PROB_CORNER = 0.13;
    const PROB_MISS = 0.15;
    
    const T_GOAL = PROB_GOAL;
    const T_INJURY = T_GOAL + PROB_INJURY;
    const T_FOUL = T_INJURY + PROB_FOUL;
    const T_SAVE = T_FOUL + PROB_SAVE;
    const T_OFFSIDE = T_SAVE + PROB_OFFSIDE;
    const T_CORNER = T_OFFSIDE + PROB_CORNER;
    const T_MISS = T_CORNER + PROB_MISS;

    // 1. GOAL (Dynamic %)
    if (eventRoll < T_GOAL) { 
        const isHome = Math.random() < offensiveDominance;
        const activeTeam = isHome ? home : away;
        const d = getScorer(activeTeam);
        
        const text = fillTemplate(pick(GOAL_TEXTS), { scorer: d.scorer.name, assist: d.assist.name, team: activeTeam.name });

        let varOutcome: 'GOAL' | 'NO_GOAL' | undefined = undefined;
        if (Math.random() < 0.25) { 
            varOutcome = Math.random() > 0.3 ? 'GOAL' : 'NO_GOAL'; 
        }

        return { 
            minute, 
            description: text, 
            type: 'GOAL', 
            teamName: activeTeam.name, 
            scorer: d.scorer.name, 
            assist: d.assist.name,
            varOutcome: varOutcome,
            playerId: d.scorer.id 
        };
    } 
    // 2. INJURY (Weighted Random)
    else if (eventRoll < T_INJURY) {
        // Decide which team gets injured. 
        const isHomeInj = Math.random() < 0.5; // Randomize which team first
        const activeTeam = isHomeInj ? home : away;
        const opponentIsAggressive = isHomeInj ? isAwayAggressive : isHomeAggressive;
        
        // USE WEIGHTED SELECTOR (Allows full stamina players to get injured too)
        const player = getPlayerForInjury(activeTeam);
        
        // Use weighted injury selection
        const injuryType = getWeightedInjury();
        
        let desc = `${player.name} (${activeTeam.name}) acı içinde yerde!`;
        const currentCond = player.condition !== undefined ? player.condition : player.stats.stamina;
        
        if (currentCond < 40) {
            desc += " Yorgunluk nedeniyle kas sakatlığı yaşadı.";
        } else {
            // Random reason for healthy/normal players
            const reasons = [
                opponentIsAggressive ? 'Rakibin sert müdahalesi!' : 'Ters bastı.',
                'İkili mücadelede darbe aldı.',
                'Ani hızlanma sırasında sakatlandı.',
                'Zemine takıldı.'
            ];
            desc += ` ${reasons[Math.floor(Math.random() * reasons.length)]}`;
        }
        desc += ` Sakatlık: ${injuryType.type}`;

        return {
            minute,
            description: desc,
            type: 'INJURY',
            teamName: activeTeam.name,
            playerId: player.id
        };
    }
    // 3. FOULS & CARDS (Variable %)
    else if (eventRoll < T_FOUL) {
        const isHomeFoul = Math.random() > homeDominance;
        const foulingTeam = isHomeFoul ? home : away;
        const fouledTeam = isHomeFoul ? away : home;
        const isFoulingAggressive = foulingTeam.tackling === Tackling.AGGRESSIVE;
        const player = getPlayer(foulingTeam);
        const victim = getPlayer(fouledTeam);

        const cardRoll = Math.random();
        
        let probRed = isFoulingAggressive ? 0.02 : 0.01;
        let probYellow = isFoulingAggressive ? 0.26 : 0.17;

        const isDerby = RIVALRIES.some(pair => pair.includes(home.name) && pair.includes(away.name));
        if (isDerby) {
            probRed += 0.03;
            probYellow += 0.06;
        }
        
        const redThreshold = probRed;
        const yellowThreshold = probRed + probYellow;

        if (cardRoll < redThreshold) { 
             return { minute, description: `${player.name} ${isFoulingAggressive ? 'topla alakası olmayan gaddarca' : 'yaptığı'} hareket sonrası direkt KIRMIZI KART gördü!`, type: 'CARD_RED', teamName: foulingTeam.name, playerId: player.id };
        } else if (cardRoll < yellowThreshold) {
             const hasYellow = existingEvents.some(e => e.type === 'CARD_YELLOW' && e.playerId === player.id);
             
             if (hasYellow) {
                 const conversionChance = isFoulingAggressive ? 0.50 : 0.35;

                 if (Math.random() < conversionChance) {
                    return { 
                        minute, 
                        description: `${player.name} (2. Sarı Kart) 🟥`, 
                        type: 'CARD_RED', 
                        teamName: foulingTeam.name, 
                        playerId: player.id 
                    };
                 } else {
                    const text = fillTemplate(pick(FOUL_TEXTS), { player: player.name, victim: victim.name });
                    return { minute, description: `${text} (Hakem son kez uyardı)`, type: 'FOUL', teamName: foulingTeam.name };
                 }
             } else {
                 const pool = isFoulingAggressive ? YELLOW_CARD_AGGRESSIVE_TEXTS : YELLOW_CARD_TEXTS;
                 const text = fillTemplate(pick(pool), { player: player.name });
                 return { minute, description: text, type: 'CARD_YELLOW', teamName: foulingTeam.name, playerId: player.id };
             }
        } else {
             const text = fillTemplate(pick(FOUL_TEXTS), { player: player.name, victim: victim.name });
             return { minute, description: text, type: 'FOUL', teamName: foulingTeam.name };
        }
    }
    // 4. SAVE (7%)
    else if (eventRoll < T_SAVE) {
         const isHomeSave = Math.random() > offensiveDominance; 
         const savingTeam = isHomeSave ? away : home; 
         const attackingTeam = isHomeSave ? home : away;
         const keeper = savingTeam.players.find(p => p.position === Position.GK && !sentOffPlayers.has(p.id)) || savingTeam.players.find(p => !sentOffPlayers.has(p.id));
         
         if (!keeper) return null; 

         const defender = getPlayer(savingTeam);
         const attacker = getPlayer(attackingTeam);

         const text = fillTemplate(pick(SAVE_TEXTS), { keeper: keeper.name, defender: defender.name, attacker: attacker.name });
         return { minute, description: text, type: 'SAVE', teamName: savingTeam.name };
    }
    // 5. OFFSIDE (10%)
    else if (eventRoll < T_OFFSIDE) {
         const activeTeam = Math.random() < offensiveDominance ? home : away;
         const player = getPlayer(activeTeam);
         const text = fillTemplate(pick(OFFSIDE_TEXTS), { player: player.name });
         return { minute, description: text, type: 'OFFSIDE', teamName: activeTeam.name };
    }
    // 6. CORNER (13%)
    else if (eventRoll < T_CORNER) {
        const activeTeam = Math.random() < offensiveDominance ? home : away;
        const player = getPlayer(activeTeam);
        const text = fillTemplate(pick(CORNER_TEXTS), { player: player.name, team: activeTeam.name });
        return { minute, description: text, type: 'CORNER', teamName: activeTeam.name };
    }
    // 7. MISS (15%)
    else if (eventRoll < T_MISS) {
        const activeTeam = Math.random() < offensiveDominance ? home : away;
        const defenderTeam = activeTeam.id === home.id ? away : home;
        const player = getPlayer(activeTeam);
        const defender = getPlayer(defenderTeam);

        const text = fillTemplate(pick(MISS_TEXTS), { player: player.name, defender: defender.name });
        return { 
            minute, 
            description: text, 
            type: 'MISS', 
            teamName: activeTeam.name,
            playerId: player.id 
        };
    }
    // 8. INFO (Remainder)
    else {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const opponentTeam = activeTeam.id === home.id ? away : home;
        const player = getPlayer(activeTeam);
        const opponentPlayer = getPlayer(opponentTeam);

        const text = fillTemplate(pick(MATCH_INFO_MESSAGES), { player: player.name, opponent: opponentPlayer.name, team: activeTeam.name });
        return { minute, description: text, type: 'INFO' };
    }
}
