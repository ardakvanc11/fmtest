import { Team, Player, Fixture, MatchEvent, MatchStats, Position, Message } from '../types';
import { generateId, generatePlayer, INJURY_TYPES, RIVALRIES } from '../constants';
import { FAN_NAMES, DERBY_TWEETS_WIN, DERBY_TWEETS_LOSS, FAN_TWEETS_WIN, FAN_TWEETS_LOSS, FAN_TWEETS_DRAW } from '../data/tweetPool';
import { MATCH_INFO_MESSAGES } from '../data/infoPool';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';

export * from './helpers';
export * from './ratingsAndStats';
export * from './teamCalculations';
export * from './calendarAndFixtures';
export * from './matchLogic';
export * from './newsAndSocial';
export * from './gameFlow';

import { calculateRating } from './ratingsAndStats'; // Import for use here
import { getWeightedInjury } from './matchLogic'; 

// ... existing code ...

// Process Matches: Disciplines, Injuries AND Update Season Stats
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

        // Find Current Match Fixture (to get MVP info and Opponent info)
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
            teamMoralePenalty += 1; 
            if (consecutiveLosses > 1) {
                teamMoralePenalty += 1;
            }
        }

        if (result === 'LOSS' && (oppGoals - myGoals) >= 4) teamMoralePenalty += 2; 

        // --- DETERMINE WINNING GOAL SCORER (For Rating Bonus) ---
        let winningGoalScorerName: string | null = null;
        let isOneZeroWin = false;

        if (result === 'WIN') {
            const myGoalsEvents = events
                .filter(e => e.type === 'GOAL' && e.teamName === team.name)
                .sort((a,b) => a.minute - b.minute);
            
            // The winning goal index is equal to the opponent's score (e.g. 2-1, opp has 1, winning goal is index 1 which is the 2nd goal)
            const winningGoalEvent = myGoalsEvents[oppGoals];
            
            if (winningGoalEvent && winningGoalEvent.scorer) {
                winningGoalScorerName = winningGoalEvent.scorer;
            }

            if (myGoals === 1 && oppGoals === 0) {
                isOneZeroWin = true;
            }
        }

        // 4. PROCESS PLAYERS
        const updatedPlayers = team.players.map((p, index) => {
            let player = { ...p };

            const isStarter = index < 11;
            const subInEvent = teamEvents.find(e => 
                e.type === 'SUBSTITUTION' && 
                e.description.includes('🔄') &&
                e.description.split('🔄')[1].trim() === p.name
            );
            const isSub = !isStarter && !!subInEvent;
            const playedCurrentMatch = isStarter || isSub;

            // Calculate Stats for this match
            const goals = teamEvents.filter(e => e.type === 'GOAL' && e.scorer === p.name).length;
            const assists = teamEvents.filter(e => e.type === 'GOAL' && e.assist === p.name).length;
            const yellowCards = teamEvents.filter(e => e.type === 'CARD_YELLOW' && e.playerId === p.id).length;
            const redCards = teamEvents.filter(e => e.type === 'CARD_RED' && e.playerId === p.id).length;
            
            // Calculate Rating Bonus
            let bonus = 0;
            if (playedCurrentMatch && winningGoalScorerName && p.name === winningGoalScorerName) {
                if (isOneZeroWin) bonus = 0.5;
                else bonus = 0.3;
            }

            // Calculate Rating using Updated Logic (Passing Skill)
            const matchRating = calculateRating(
                p.position,
                p.skill, // Pass skill here
                goals,
                assists,
                yellowCards,
                redCards,
                oppGoals,
                result,
                90,
                bonus
            );
            
            if (playedCurrentMatch) {
                player.seasonStats = {
                    ...player.seasonStats,
                    goals: player.seasonStats.goals + goals,
                    assists: player.seasonStats.assists + assists,
                    matchesPlayed: player.seasonStats.matchesPlayed + 1,
                    ratings: [...player.seasonStats.ratings, matchRating]
                };
                
                // NEW CONDITION DROP LOGIC
                // Drop between 40 and 65 based on Stamina Stat (20-99)
                // High Stamina (99) -> Drops ~40
                // Low Stamina (20) -> Drops ~65
                const maxDrop = 65;
                const minDrop = 40;
                // Normalize stamina (20 to 99) to 0-1
                const staminaFactor = Math.max(0, Math.min(1, (player.stats.stamina - 20) / 79)); 
                // Invert factor: Higher stamina means LOWER drop (closer to minDrop)
                const totalPotentialDrop = maxDrop - (staminaFactor * (maxDrop - minDrop));
                
                // If sub, approximate minutes played (simplified)
                let minutesPlayed = 90;
                if (isSub && subInEvent) minutesPlayed = 90 - subInEvent.minute;
                else if (isStarter) {
                    // Check if subbed OUT
                    const subOutEvent = teamEvents.find(e => 
                        e.type === 'SUBSTITUTION' && 
                        e.description.includes('🔄') &&
                        e.description.split('🔄')[0].trim() === p.name
                    );
                    if (subOutEvent) minutesPlayed = subOutEvent.minute;
                }

                // --- POSITIONAL MULTIPLIERS (User Request) ---
                let posMult = 1.0;
                switch (p.position) {
                    case Position.GK: posMult = 0.2; break; // Kaleci (Az yorulur)
                    case Position.STP: posMult = 0.6; break; // Stoper (Orta)
                    case Position.SLB:
                    case Position.SGB: posMult = 1.1; break; // Bekler (Çok yorulur)
                    case Position.OS:
                    case Position.OOS: posMult = 1.0; break; // Orta Saha (Standart)
                    case Position.SLK:
                    case Position.SGK: posMult = 1.2; break; // Kanatlar (En çok yorulur)
                    case Position.SNT: posMult = 0.9; break; // Forvet (Orta-Az)
                    default: posMult = 1.0;
                }

                // --- MATCH CONTEXT MULTIPLIER (Derby/Final) ---
                let contextMult = 1.0;
                if (currentFixture) {
                    const opponentId = currentFixture.homeTeamId === team.id ? currentFixture.awayTeamId : currentFixture.homeTeamId;
                    const opponentTeam = teams.find(t => t.id === opponentId);
                    if (opponentTeam) {
                        const isDerby = RIVALRIES.some(pair => pair.includes(team.name) && pair.includes(opponentTeam.name));
                        // Week 34 considered "Final" atmosphere
                        const isFinal = currentFixture.week === 34; 
                        
                        if (isDerby || isFinal) {
                            contextMult = 1.2; // %20 more fatigue in Derby/Finals
                        }
                    }
                }

                const actualDrop = (minutesPlayed / 90) * totalPotentialDrop * posMult * contextMult;
                player.condition = Math.max(0, player.condition - actualDrop);

            } else {
                // Bench players recover slightly during match day (rest)
                // Moved to daily update loop in useGameState generally, but can keep small boost here
            }
            
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
                const injuryType = getWeightedInjury(); // Use getWeightedInjury for more variation
                const duration = Math.floor(Math.random() * (injuryType.maxWeeks - injuryType.minWeeks + 1)) + injuryType.minWeeks;
                player.injury = {
                    type: injuryType.type,
                    weeksRemaining: duration,
                    description: injuryType.desc
                };
                
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
                    player.injury = undefined;
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
                moraleChange -= teamMoralePenalty;
                moraleChange += teamMoraleBonus; 

                if (playedCurrentMatch) {
                    if (isStarter) moraleChange += 3;
                    else if (isSub) moraleChange += 2;

                    const recentTeamMatches = teamPastFixtures.slice(0, 5);
                    if (recentTeamMatches.length >= 5) {
                        let playedInLast5 = false;
                        for (const fixture of recentTeamMatches) {
                            const isHomeF = fixture.homeTeamId === team.id;
                            const ratingsList = isHomeF ? fixture.stats?.homeRatings : fixture.stats?.awayRatings;
                            if (ratingsList && ratingsList.some(r => r.playerId === p.id)) {
                                playedInLast5 = true;
                                break;
                            }
                        }
                        if (!playedInLast5) moraleChange += 15; 
                    }

                    if (result === 'WIN') moraleChange += 2;
                    if (goals > 0) moraleChange += goals;

                    const penaltyGoals = teamEvents.filter(e => e.type === 'GOAL' && e.scorer === p.name && (e.assist === 'Penaltı' || e.description.toLowerCase().includes('penaltı'))).length;
                    if (penaltyGoals > 0) moraleChange += penaltyGoals;

                    if (p.position === Position.GK && oppGoals === 0) moraleChange += 3;

                    // Consecutive Appearances (Logic simplified for update)
                    // ... (keeping existing logic here roughly same)

                    // Rating based morale
                    if (matchRating > 8.0) moraleChange += 1;
                    if (mvpId && p.id === mvpId) moraleChange += 2; 

                    if (matchRating < 5.5) moraleChange -= 2; 
                    else if (matchRating < 6.0) moraleChange -= 1; 

                    const missedPen = teamEvents.some(e => e.type === 'MISS' && e.playerId === p.id && e.description.toLowerCase().includes('penaltı'));
                    if (missedPen) moraleChange -= 3;

                    const isGkSlot = index === 0;
                    if ((p.position === 'GK' && !isGkSlot) || (p.position !== 'GK' && isGkSlot)) moraleChange -= 1; 

                    const redCardEvent = teamEvents.find(e => e.type === 'CARD_RED' && e.playerId === p.id);
                    if (redCardEvent) {
                        if (redCardEvent.description.toLowerCase().includes('ikinci sarı')) moraleChange -= 2; 
                        else moraleChange -= 4; 
                    }
                }
            }

            if (!justGotInjured && moraleChange < -8) {
                moraleChange = -8;
            }

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