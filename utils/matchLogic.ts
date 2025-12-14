
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

    let homePossession = 50 + ((hStr - aStr) / 2);
    homePossession = Math.min(80, Math.max(20, homePossession + (Math.random() * 10 - 5)));
    
    const hShots = hScore + Math.floor(Math.random() * 5) + (hStr > aStr ? 3 : 1);
    const aShots = aScore + Math.floor(Math.random() * 5) + (aStr > hStr ? 3 : 1);
    
    const hTarget = Math.min(hShots, hScore + Math.floor(Math.random() * (hShots - hScore)));
    const aTarget = Math.min(aShots, aScore + Math.floor(Math.random() * (aShots - aScore)));

    const hCorners = Math.floor(Math.random() * 8) + (hStr > aStr ? 2 : 0);
    const aCorners = Math.floor(Math.random() * 8) + (aStr > hStr ? 2 : 0);
    
    const hFouls = Math.floor(Math.random() * 15);
    const aFouls = Math.floor(Math.random() * 15);

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
        homeYellowCards: Math.floor(Math.random() * 3),
        awayYellowCards: Math.floor(Math.random() * 3),
        homeRedCards: 0,
        awayRedCards: 0,
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

    // Check Aggression Settings
    const isHomeAggressive = home.tackling === Tackling.AGGRESSIVE;
    const isAwayAggressive = away.tackling === Tackling.AGGRESSIVE;
    const isAggressiveMatch = isHomeAggressive || isAwayAggressive;

    // Filter players who are already sent off to avoid events for them
    const sentOffPlayers = new Set(existingEvents.filter(e => e.type === 'CARD_RED').map(e => e.playerId));

    const getPlayer = (team: Team, includeGK = false) => {
        const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
        if (xi.length === 0) return team.players[0]; // Fallback just in case everyone is sent off (unlikely)

        const pool = includeGK ? xi : xi.filter(p => p.position !== Position.GK);
        // If pool is empty (e.g. only GK left and we excluded GK), fallback to xi
        const finalPool = pool.length > 0 ? pool : xi;
        
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    };

    const getScorer = (team: Team) => {
        const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
        if(xi.length === 0) return { scorer: team.players[0], assist: team.players[0] };

        const fwds = xi.filter(p => p.position === Position.FWD);
        const mids = xi.filter(p => p.position === Position.MID);
        let scorerPool = [...fwds, ...fwds, ...fwds, ...mids, ...mids, ...xi];
        const scorer = scorerPool[Math.floor(Math.random() * scorerPool.length)];
        let assist = xi[Math.floor(Math.random() * xi.length)];
        if(assist.id === scorer.id) assist = xi.find(p => p.id !== scorer.id) || assist;
        return { scorer, assist };
    };

    /* 
       DISTRIBUTION PLAN (Cumulative)
       
       Dynamic Goal Probability based on Red Cards:
       0 Reds (Any Side): 5%
       1 Red (Max of any side): 6%
       2 Reds: 8%
       3+ Reds: 12%
    */

    let currentGoalProb = 0.05; // Base
    const maxReds = Math.max(homeReds, awayReds);
    
    if (maxReds === 1) currentGoalProb = 0.06;
    else if (maxReds === 2) currentGoalProb = 0.08;
    else if (maxReds >= 3) currentGoalProb = 0.12;

    const PROB_GOAL = currentGoalProb;
    const PROB_INJURY = 0.01;
    const PROB_FOUL = isAggressiveMatch ? 0.26 : 0.50; // 18% Base, 26% Aggressive adjusted for remaining space
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
    // Remainder is INFO

    // 1. GOAL (Dynamic %)
    if (eventRoll < T_GOAL) { 
        const isHome = Math.random() < homeDominance;
        const activeTeam = isHome ? home : away;
        const d = getScorer(activeTeam);
        
        const text = fillTemplate(pick(GOAL_TEXTS), { scorer: d.scorer.name, assist: d.assist.name, team: activeTeam.name });

        // VAR CHECK Logic
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
            playerId: d.scorer.id // NEW: Added playerId to Goal event
        };
    } 
    // 2. INJURY (1%)
    else if (eventRoll < T_INJURY) {
        const isHomeInj = Math.random() > 0.5;
        const opponentIsAggressive = isHomeInj ? isAwayAggressive : isHomeAggressive;
        const activeTeam = isHomeInj ? home : away;
        const player = getPlayer(activeTeam, true);
        const injuryType = INJURY_TYPES[Math.floor(Math.random() * INJURY_TYPES.length)];
        
        return {
            minute,
            description: `${player.name} (${activeTeam.name}) acı içinde yerde! ${opponentIsAggressive ? 'Rakibin sert müdahalesi!' : 'Ters bastı.'} Sakatlık: ${injuryType.type}`,
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
        
        // Card Probabilities
        // Base Yellow: 9% (0.09)
        // Base Red: 1% (0.01)
        // Aggressive increases these.
        
        const probRed = isFoulingAggressive ? 0.02 : 0.01;
        const probYellow = isFoulingAggressive ? 0.26 : 0.17;
        
        const redThreshold = probRed;
        const yellowThreshold = probRed + probYellow;

        if (cardRoll < redThreshold) { 
             return { minute, description: `${player.name} ${isFoulingAggressive ? 'topla alakası olmayan gaddarca' : 'yaptığı'} hareket sonrası direkt KIRMIZI KART gördü!`, type: 'CARD_RED', teamName: foulingTeam.name, playerId: player.id };
        } else if (cardRoll < yellowThreshold) {
             // CHECK FOR SECOND YELLOW
             const hasYellow = existingEvents.some(e => e.type === 'CARD_YELLOW' && e.playerId === player.id);
             
             if (hasYellow) {
                 // Adjust 2nd Yellow Card Probability
                 // Standard was 17%, now target is 6% (~35% conversion from base chance)
                 // Aggressive was 26%, now target is 13% (~50% conversion from base chance)
                 const conversionChance = isFoulingAggressive ? 0.50 : 0.35;

                 if (Math.random() < conversionChance) {
                    return { 
                        minute, 
                        description: `${player.name} ikinci sarı karttan KIRMIZI KART gördü ve oyun dışı kaldı!`, 
                        type: 'CARD_RED', 
                        teamName: foulingTeam.name, 
                        playerId: player.id 
                    };
                 } else {
                    // Referee spares the player (Downgrade to Foul)
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
         const isHomeSave = Math.random() > homeDominance; 
         const savingTeam = isHomeSave ? away : home; // Defender
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
         const activeTeam = Math.random() < homeDominance ? home : away;
         const player = getPlayer(activeTeam);
         const text = fillTemplate(pick(OFFSIDE_TEXTS), { player: player.name });
         return { minute, description: text, type: 'OFFSIDE', teamName: activeTeam.name };
    }
    // 6. CORNER (13%)
    else if (eventRoll < T_CORNER) {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const player = getPlayer(activeTeam);
        const text = fillTemplate(pick(CORNER_TEXTS), { player: player.name, team: activeTeam.name });
        return { minute, description: text, type: 'CORNER', teamName: activeTeam.name };
    }
    // 7. MISS (15%)
    else if (eventRoll < T_MISS) {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const defenderTeam = activeTeam.id === home.id ? away : home;
        const player = getPlayer(activeTeam);
        const defender = getPlayer(defenderTeam);

        const text = fillTemplate(pick(MISS_TEXTS), { player: player.name, defender: defender.name });
        return { 
            minute, 
            description: text, 
            type: 'MISS', 
            teamName: activeTeam.name,
            playerId: player.id // NEW: Added playerId to Miss event
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

        // Find Opponent Name for Derby Check
        const matchEventsOpponentName = events.find(e => e.teamName !== team.name)?.teamName || '';

        // 2. CHECK TEAM-LEVEL MORALE FACTORS
        let teamMoralePenalty = 0;

        // A. Loss Penalties (Normal & Consecutive)
        const teamPastFixtures = allFixtures
            .filter(f => f.played && f.week < currentWeek && (f.homeTeamId === team.id || f.awayTeamId === team.id))
            .sort((a, b) => b.week - a.week) 
            .slice(0, 4); 

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

        // B. Derby Loss
        const isDerbyLoss = result === 'LOSS' && RIVALRIES.some(pair => pair.includes(team.name) && pair.includes(matchEventsOpponentName));
        if (isDerbyLoss) {
            teamMoralePenalty += 4;
        }

        // C. Heavy Loss (4+ Goal Diff)
        if (result === 'LOSS' && (oppGoals - myGoals) >= 4) {
            teamMoralePenalty += 4; 
        }

        // 3. PROCESS PLAYERS
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
            
            player.seasonStats.ratings.push(matchRating);
            const sum = player.seasonStats.ratings.reduce((a, b) => a + b, 0);
            player.seasonStats.averageRating = Number((sum / player.seasonStats.ratings.length).toFixed(1));

            // --- HEALTH & INJURY CHECK (UPDATED: Happens BEFORE Morale) ---

            // Reset Injection flag
            if (player.hasInjectionForNextMatch) {
                player.hasInjectionForNextMatch = false;
                if (Math.random() < 0.3 && player.injury) {
                    player.injury.weeksRemaining += 4;
                }
            }

            // Check new injuries from match
            const injuryEvent = teamEvents.find(e => e.type === 'INJURY' && e.playerId === p.id);
            let justGotInjured = false;
            let newInjuryWeeks = 0;

            if (injuryEvent) {
                const injuryType = INJURY_TYPES[Math.floor(Math.random() * INJURY_TYPES.length)];
                const duration = Math.floor(Math.random() * (injuryType.maxWeeks - injuryType.minWeeks)) + injuryType.minWeeks;
                player.injury = {
                    type: injuryType.type,
                    weeksRemaining: duration,
                    description: injuryType.desc
                };
                justGotInjured = true;
                newInjuryWeeks = duration;
            }

            // Decrement existing injury (only if not newly injured)
            if (!justGotInjured && player.injury) {
                player.injury.weeksRemaining -= 1;
                if (player.injury.weeksRemaining <= 0) {
                    player.injury = undefined; // Healed
                }
            }

            // --- MORALE CALCULATIONS ---
            
            let moraleChange = 0;
            const currentlyInjured = !!player.injury; // Is player injured NOW (new or old)?

            // 1. New Injury Penalty (Overrides everything)
            if (justGotInjured) {
                // Apply specific morale penalty based on injury duration
                if (newInjuryWeeks < 3) moraleChange -= 5;
                else if (newInjuryWeeks < 6) moraleChange -= 7;
                else if (newInjuryWeeks < 12) moraleChange -= 12;
                else moraleChange -= 18;
            }

            // 2. Standard Penalties
            // CRITICAL CHANGE: Injured players (current or new) DO NOT take morale hits from match results or benching.
            if (!currentlyInjured) {
                
                // Apply Team Level Penalties
                moraleChange -= teamMoralePenalty;

                if (index < 11) {
                    // PLAYER PLAYED THIS MATCH

                    // Rating Based Morale
                    if (matchRating < 5.5) {
                        moraleChange -= 3; 
                    } else if (matchRating < 6.0) {
                        moraleChange -= 1; 
                    }

                    // Penalty Miss
                    const missedPen = teamEvents.some(e => e.type === 'MISS' && e.playerId === p.id && e.description.toLowerCase().includes('penaltı'));
                    if (missedPen) moraleChange -= 4; 

                    // Out of Position
                    const isGkSlot = index === 0;
                    if ((p.position === 'GK' && !isGkSlot) || (p.position !== 'GK' && isGkSlot)) {
                        moraleChange -= 1; 
                    }

                    // Red Cards
                    const redCardEvent = teamEvents.find(e => e.type === 'CARD_RED' && e.playerId === p.id);
                    if (redCardEvent) {
                        if (redCardEvent.description.toLowerCase().includes('ikinci sarı') || redCardEvent.description.toLowerCase().includes('çift sarı')) {
                            moraleChange -= 2; 
                        } else {
                            moraleChange -= 4; 
                        }
                    }

                } else {
                    // PLAYER DID NOT PLAY
                    
                    let matchesMissed = 1; 
                    for (let i = 0; i < 4; i++) {
                        const f = teamPastFixtures[i];
                        if (!f || !f.stats) break;
                        const isHome = f.homeTeamId === team.id;
                        const ratings = isHome ? f.stats.homeRatings : f.stats.awayRatings;
                        const playedThatMatch = ratings.some(r => r.playerId === p.id);
                        if (!playedThatMatch) matchesMissed++;
                        else break; 
                    }

                    if (matchesMissed >= 4) {
                        if (player.morale > 20) {
                            moraleChange -= 3;
                        }
                    }
                }
            }

            // Cap the Morale Drop (-8 Max) - Note: Injury penalty can exceed this if it was applied directly
            if (!justGotInjured && moraleChange < -8) {
                moraleChange = -8;
            }

            // Apply Morale Change
            player.morale = Math.max(0, Math.min(100, player.morale + moraleChange));

            // Check Red Card Suspension (Last step)
            const hasRed = teamEvents.some(e => e.type === 'CARD_RED' && e.playerId === p.id);
            if (hasRed) {
                player.suspendedUntilWeek = currentWeek + 2; 
            }

            return player;
        });

        return { ...team, players: updatedPlayers };
    });
};
