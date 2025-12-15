

import { Team, Player, MatchEvent, MatchStats, Position, Tackling, PlayerPerformance, Fixture } from '../types';
import { INJURY_TYPES, RIVALRIES } from '../constants';
import { MATCH_INFO_MESSAGES } from '../data/infoPool';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';
import { calculateTeamStrength } from './teamCalculations';
import { calculateRating, determineMVP } from './ratingsAndStats';
import { fillTemplate, pick } from './helpers';

// Used for instant simulation generation where we don't have events yet
export const generateRandomPlayerRatings = (players: Player[], teamGoals: number, isWinner: boolean): PlayerPerformance[] => {
    const lineup = [...players].slice(0, 11); 
    
    return lineup.map(p => {
        let rating = 6.0 + (Math.random() * 2.0); 
        if (isWinner) rating += 0.5;
        rating += (p.skill / 200); 
        if (Math.random() > 0.8) rating += 1.0;
        rating = Math.min(10, Number(rating.toFixed(1)));

        return {
            playerId: p.id,
            name: p.name,
            position: p.position,
            rating,
            goals: 0, 
            assists: 0
        };
    });
};

export const generateMatchStats = (homePlayers: Player[], awayPlayers: Player[], hScore: number, aScore: number): MatchStats => {
    // Initial random ratings for instant sim (will be overwritten if events are generated later)
    const homeRatings = generateRandomPlayerRatings(homePlayers, hScore, hScore > aScore);
    const awayRatings = generateRandomPlayerRatings(awayPlayers, aScore, aScore > hScore);

    const hStr = calculateTeamStrength({ players: homePlayers, morale: 50 } as any);
    const aStr = calculateTeamStrength({ players: awayPlayers, morale: 50 } as any);

    // Calculate Possession based on strength difference
    let homePossession = 50 + ((hStr - aStr) / 2);
    homePossession = Math.min(80, Math.max(20, homePossession + (Math.random() * 10 - 5)));
    
    // --- UPDATED SHOT LOGIC BASED ON POSSESSION ---
    // Calculate shot bonus derived directly from possession percentage.
    // Logic: Every ~3% possession advantage gives roughly 1 extra shot attempt.
    const possessionAdvantage = homePossession - 50; 
    
    // If Home has 60% possession -> +10 advantage -> ~3 extra shots
    // If Away has 60% possession (Home 40%) -> -10 advantage -> Away gets ~3 extra shots
    const homeShotBonus = possessionAdvantage > 0 ? Math.ceil(possessionAdvantage / 3.0) : 0;
    const awayShotBonus = possessionAdvantage < 0 ? Math.ceil(Math.abs(possessionAdvantage) / 3.0) : 0;

    // Base shots + Score (goals are shots) + Random Factor + Strength Factor + POSSESSION BONUS
    const hShots = hScore + Math.floor(Math.random() * 4) + homeShotBonus + (hStr > aStr ? 2 : 0);
    const aShots = aScore + Math.floor(Math.random() * 4) + awayShotBonus + (aStr > hStr ? 2 : 0);
    
    const hTarget = Math.min(hShots, hScore + Math.floor(Math.random() * (hShots - hScore)));
    const aTarget = Math.min(aShots, aScore + Math.floor(Math.random() * (aShots - aScore)));

    // Corners also influenced slightly by dominance
    const hCorners = Math.floor(Math.random() * 6) + (possessionAdvantage > 5 ? 3 : 0);
    const aCorners = Math.floor(Math.random() * 6) + (possessionAdvantage < -5 ? 3 : 0);
    
    const hFouls = Math.floor(Math.random() * 15);
    const aFouls = Math.floor(Math.random() * 15);

    // Random Red Card Logic for Instant Sim (approx 3-4% chance per team to spice things up)
    const hRed = Math.random() < 0.04 ? 1 : 0;
    const aRed = Math.random() < 0.04 ? 1 : 0;

    // DETERMINISTIC MVP SELECTION
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

export const simulateMatchInstant = (home: Team, away: Team): { homeScore: number, awayScore: number, stats: MatchStats } => {
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
    
    const stats = generateMatchStats(home.players, away.players, homeScore, awayScore);

    return { homeScore, awayScore, stats };
};

// Helper function to get injury based on weighted probability
const getWeightedInjury = () => {
    const totalWeight = INJURY_TYPES.reduce((sum, item) => sum + item.probability, 0);
    let random = Math.random() * totalWeight;
    
    for (const injury of INJURY_TYPES) {
        if (random < injury.probability) return injury;
        random -= injury.probability;
    }
    // Fallback to the first one (most common usually) if something goes wrong
    return INJURY_TYPES[0];
};

// --- RICH MATCH EVENTS (VAR, CARDS, DRAMA, INJURIES) ---

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
    // Specifically targets players with Low Stamina (<40) and High Susceptibility
    const getPlayerForInjury = (team: Team): Player => {
        const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
        if (xi.length === 0) return team.players[0];

        const weightedPool: Player[] = [];
        
        xi.forEach(p => {
            let weight = 1;
            
            // --- CRITICAL STAMINA LOGIC ---
            // If stamina is below 40%, risk increases drastically based on susceptibility
            if (p.stats.stamina < 40) {
                // Base weight + (Susceptibility Factor)
                // e.g. Susceptibility 80 -> weight += 15 (Very high chance)
                // e.g. Susceptibility 20 -> weight += 3
                weight += 5 + (p.injurySusceptibility / 8); 
            } else if (p.stats.stamina < 60) {
                // Slight risk increase for tired players
                weight += 2;
            }

            // Add player to pool 'weight' times
            for(let i=0; i<Math.floor(weight); i++) {
                weightedPool.push(p);
            }
        });

        // Fallback to XI if pool is empty (shouldn't happen)
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
    // Count how many players have < 40 stamina
    const homeExhausted = home.players.slice(0, 11).filter(p => p.stats.stamina < 40).length;
    const awayExhausted = away.players.slice(0, 11).filter(p => p.stats.stamina < 40).length;
    const totalExhausted = homeExhausted + awayExhausted;
    
    // Base 1% chance + 0.3% per exhausted player on field
    // If 3 players are exhausted, injury chance becomes ~2% (Double the normal rate)
    const calculatedInjuryProb = 0.01 + (totalExhausted * 0.003);

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
    // 2. INJURY (Variable based on Stamina)
    else if (eventRoll < T_INJURY) {
        // Decide which team gets injured. 
        // If one team has significantly more exhausted players, they are more likely to get injured.
        let injuryHomeProb = 0.5;
        if (totalExhausted > 0) {
            injuryHomeProb = (homeExhausted + 1) / (totalExhausted + 2); // Smoothing
        }
        
        const isHomeInj = Math.random() < injuryHomeProb;
        const activeTeam = isHomeInj ? home : away;
        const opponentIsAggressive = isHomeInj ? isAwayAggressive : isHomeAggressive;
        
        // USE WEIGHTED SELECTOR
        const player = getPlayerForInjury(activeTeam);
        
        // Use weighted injury selection
        const injuryType = getWeightedInjury();
        
        let desc = `${player.name} (${activeTeam.name}) acı içinde yerde!`;
        if (player.stats.stamina < 40) {
            desc += " Yorgunluk nedeniyle kas sakatlığı yaşadı.";
        } else {
            desc += ` ${opponentIsAggressive ? 'Rakibin sert müdahalesi!' : 'Ters bastı.'}`;
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

// Process Matches: Disciplines, Injuries AND Update Season Stats
// IMPORTANT: Now accepts allFixtures to calculate streaks and playing time history
export const processMatchPostGame = (teams: Team[], events: MatchEvent[], currentWeek: number, allFixtures: Fixture[] = []): Team[] => {
    return teams.map(team => {
        const teamEvents = events.filter(e => e.teamName === team.name);
        
        // 1. DETERMINE MATCH RESULT FOR TEAM
        const myGoals = events.filter(e => e.type === 'GOAL' && e.teamName === team.name).length;
        const oppGoals = events.filter(e => e.type === 'GOAL' && e.teamName !== team.name).length;
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        if (myGoals > oppGoals) result = 'WIN';
        else if (myGoals < oppGoals) result = 'LOSS';

        // 2. FETCH HISTORICAL CONTEXT (Past Matches)
        const teamPastFixtures = allFixtures
            .filter(f => f.played && f.week < currentWeek && (f.homeTeamId === team.id || f.awayTeamId === team.id))
            .sort((a, b) => b.week - a.week); // Descending (Newest first)

        // Find Current Match Fixture (to get MVP info)
        const currentFixture = allFixtures.find(f => f.week === currentWeek && (f.homeTeamId === team.id || f.awayTeamId === team.id));
        const mvpId = currentFixture?.stats?.mvpPlayerId;

        // 3. CHECK TEAM-LEVEL STREAKS & FACTORS
        
        let teamMoraleBonus = 0; 

        // B. Loss Penalties (Normal & Consecutive)
        let teamMoralePenalty = 0;
        let consecutiveLosses = result === 'LOSS' ? 1 : 0;
        if (consecutiveLosses > 0) {
            for (let i = 0; i < 2; i++) { 
                const f = teamPastFixtures[i];
                if (!f) break;
                const isHome = f.homeTeamId === team.id;
                const fMyScore = isHome ? f.homeScore! : f.awayScore!;
                const fOppScore = isHome ? f.awayScore! : f.homeScore!;
                if (fMyScore < fOppScore) consecutiveLosses++;
                else break;
            }
        }

        if (result === 'LOSS') {
            teamMoralePenalty += 2; 
            if (consecutiveLosses > 1) {
                teamMoralePenalty += 1;
            }
        }

        // Find Opponent Name for Derby Check
        const matchEventsOpponentName = events.find(e => e.teamName !== team.name)?.teamName || '';
        const isDerbyLoss = result === 'LOSS' && RIVALRIES.some(pair => pair.includes(team.name) && pair.includes(matchEventsOpponentName));
        if (isDerbyLoss) teamMoralePenalty += 4;

        if (result === 'LOSS' && (oppGoals - myGoals) >= 4) teamMoralePenalty += 4; 

        // 4. PROCESS PLAYERS
        const updatedPlayers = team.players.map((p, index) => {
            let player = { ...p };

            // Calculate Stats for this match
            const goals = teamEvents.filter(e => e.type === 'GOAL' && e.scorer === p.name).length;
            const assists = teamEvents.filter(e => e.type === 'GOAL' && e.assist === p.name).length;
            const yellowCards = teamEvents.filter(e => e.type === 'CARD_YELLOW' && e.playerId === p.id).length;
            const redCards = teamEvents.filter(e => e.type === 'CARD_RED' && e.playerId === p.id).length;
            
            // Calculate Rating
            const matchRating = calculateRating(
                p.position,
                goals,
                assists,
                yellowCards,
                redCards,
                oppGoals,
                result
            );
            
            // Update Season Stats
            player.seasonStats = {
                ...player.seasonStats,
                goals: player.seasonStats.goals + goals,
                assists: player.seasonStats.assists + assists,
                matchesPlayed: player.seasonStats.matchesPlayed + (index < 11 ? 1 : 0) 
            };
            
            // Only add rating and calculate average if player was in the starting XI (played)
            if (index < 11) {
                player.seasonStats.ratings.push(matchRating);
                
                // DECREASE STAMINA FOR PLAYING A MATCH
                // Base drop + Random
                const staminaDrop = Math.floor(Math.random() * 5) + 3; // 3-7 points drop per match
                player.stats.stamina = Math.max(0, player.stats.stamina - staminaDrop);
            } else {
                // RECOVER STAMINA FOR BENCH/RESERVE (If not injured)
                if (!player.injury) {
                    const staminaRecovery = Math.floor(Math.random() * 10) + 10; // 10-20 points recovery
                    player.stats.stamina = Math.min(100, player.stats.stamina + staminaRecovery);
                }
            }
            
            // Calculate Average based on LAST 5 Matches (Form Rating)
            const recentRatings = player.seasonStats.ratings.slice(-5);
            if (recentRatings.length > 0) {
                 const sum = recentRatings.reduce((a, b) => a + b, 0);
                 player.seasonStats.averageRating = Number((sum / recentRatings.length).toFixed(1));
            } else {
                 player.seasonStats.averageRating = 0;
            }

            // --- HEALTH & INJURY CHECK ---
            if (player.hasInjectionForNextMatch) {
                player.hasInjectionForNextMatch = false;
                if (Math.random() < 0.3 && player.injury) {
                    player.injury.weeksRemaining += 4;
                }
            }

            const injuryEvent = teamEvents.find(e => e.type === 'INJURY' && e.playerId === p.id);
            let justGotInjured = false;
            let newInjuryWeeks = 0;

            if (injuryEvent) {
                // Use weighted injury selection here as well
                const injuryType = getWeightedInjury();
                const duration = Math.floor(Math.random() * (injuryType.maxWeeks - injuryType.minWeeks + 1)) + injuryType.minWeeks;
                player.injury = {
                    type: injuryType.type,
                    weeksRemaining: duration,
                    description: injuryType.desc
                };
                
                // SAVE HISTORY
                if (!player.injuryHistory) player.injuryHistory = [];
                player.injuryHistory.push({
                    type: injuryType.type,
                    week: currentWeek,
                    duration: duration
                });

                justGotInjured = true;
                newInjuryWeeks = duration;
            }

            if (!justGotInjured && player.injury) {
                player.injury.weeksRemaining -= 1;
                if (player.injury.weeksRemaining <= 0) {
                    player.injury = undefined; // Healed
                }
            }

            // --- MORALE CALCULATIONS ---
            
            let moraleChange = 0;
            const currentlyInjured = !!player.injury; 

            if (justGotInjured) {
                if (newInjuryWeeks < 3) moraleChange -= 5;
                else if (newInjuryWeeks < 6) moraleChange -= 7;
                else if (newInjuryWeeks < 12) moraleChange -= 12;
                else moraleChange -= 18;
            }

            if (!currentlyInjured) {
                
                // General Team Effects
                moraleChange -= teamMoralePenalty;
                moraleChange += teamMoraleBonus; 

                if (index < 11) {
                    // --- PLAYER PLAYED ---

                    // 1. Win Bonus (+2)
                    if (result === 'WIN') moraleChange += 2;

                    // 2. Goal Bonus (+1 per goal)
                    if (goals > 0) moraleChange += goals;

                    // 4. Penalty Bonus (+1 per penalty scored)
                    const penaltyGoals = teamEvents.filter(e => e.type === 'GOAL' && e.scorer === p.name && (e.assist === 'Penaltı' || e.description.toLowerCase().includes('penaltı'))).length;
                    if (penaltyGoals > 0) moraleChange += penaltyGoals;

                    // 5. Clean Sheet (+3 for GK)
                    if (p.position === Position.GK && oppGoals === 0) {
                        moraleChange += 3;
                    }

                    // 6. Consecutive Appearances (5 matches = +3) (Changed from +4)
                    // Needs to have played in previous 4 matches + current match (which is true here)
                    let consecutiveApps = 1;
                    for(let i=0; i<4; i++) {
                        const f = teamPastFixtures[i];
                        if (!f || !f.stats) break;
                        const isHomeF = f.homeTeamId === team.id;
                        const ratingsList = isHomeF ? f.stats.homeRatings : f.stats.awayRatings;
                        const playedInPrev = ratingsList.some(r => r.playerId === p.id);
                        if (playedInPrev) consecutiveApps++;
                        else break;
                    }
                    if (consecutiveApps >= 5) moraleChange += 3; // UPDATED

                    // 7. High Rating (+1 for > 8.0)
                    if (matchRating > 8.0) moraleChange += 1;

                    // 8. MVP (+2) (Changed from +3)
                    if (mvpId && p.id === mvpId) moraleChange += 2; // UPDATED

                    // --- NEGATIVE FACTORS ---
                    if (matchRating < 5.5) moraleChange -= 3; 
                    else if (matchRating < 6.0) moraleChange -= 1; 

                    const missedPen = teamEvents.some(e => e.type === 'MISS' && e.playerId === p.id && e.description.toLowerCase().includes('penaltı'));
                    if (missedPen) moraleChange -= 4; 

                    const isGkSlot = index === 0;
                    if ((p.position === 'GK' && !isGkSlot) || (p.position !== 'GK' && isGkSlot)) moraleChange -= 1; 

                    const redCardEvent = teamEvents.find(e => e.type === 'CARD_RED' && e.playerId === p.id);
                    if (redCardEvent) {
                        if (redCardEvent.description.toLowerCase().includes('ikinci sarı')) moraleChange -= 2; 
                        else moraleChange -= 4; 
                    }

                } else {
                    // --- PLAYER DID NOT PLAY ---
                    let matchesMissed = 1; 
                    for (let i = 0; i < 4; i++) {
                        const f = teamPastFixtures[i];
                        if (!f || !f.stats) break;
                        const isHomeF = f.homeTeamId === team.id;
                        const ratingsList = isHomeF ? f.stats.homeRatings : f.stats.awayRatings;
                        const playedThatMatch = ratingsList.some(r => r.playerId === p.id);
                        if (!playedThatMatch) matchesMissed++;
                        else break; 
                    }

                    if (matchesMissed >= 4 && player.morale > 20) {
                        moraleChange -= 3;
                    }
                }
            }

            if (!justGotInjured && moraleChange < -8) {
                moraleChange = -8;
            }

            // Cap at 100
            player.morale = Math.max(0, Math.min(100, player.morale + moraleChange));

            const hasRed = teamEvents.some(e => e.type === 'CARD_RED' && e.playerId === p.id);
            if (hasRed) {
                player.suspendedUntilWeek = currentWeek + 2; 
            }

            return player;
        });

        return { ...team, players: updatedPlayers };
    });
};