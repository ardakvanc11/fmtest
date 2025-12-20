
import { Team, Player, Fixture, MatchEvent, MatchStats, Position, Message, TransferRecord, NewsItem } from '../types';
import { generateId, generatePlayer, INJURY_TYPES, RIVALRIES, GAME_CALENDAR } from '../constants';
import { FAN_NAMES, DERBY_TWEETS_WIN, DERBY_TWEETS_LOSS, FAN_TWEETS_WIN, FAN_TWEETS_LOSS, FAN_TWEETS_DRAW } from '../data/tweetPool';
import { MATCH_INFO_MESSAGES } from '../data/infoPool';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';
import { generatePlayer as createNewPlayer, calculateMarketValue } from '../data/playerConstants';

export * from './helpers';
export * from './ratingsAndStats';
export * from './teamCalculations';
export * from './calendarAndFixtures';
export * from './matchLogic';
export * from './newsAndSocial';
export * from './gameFlow';

import { calculateRating } from './ratingsAndStats'; // Import for use here
import { getWeightedInjury } from './matchLogic'; 
import { recalculateTeamStrength, calculateRawTeamStrength } from './teamCalculations';

// --- AI TRANSFER SIMULATION LOGIC ---
export const simulateAiDailyTransfers = (teams: Team[], currentDate: string, currentWeek: number, myTeamId: string | null): { updatedTeams: Team[], newNews: NewsItem[] } => {
    const dateObj = new Date(currentDate);
    const day = dateObj.getDate();
    const month = dateObj.getMonth(); // 6 = July, 7 = Aug, 8 = Sept

    // RULE: No transfers on July 1st (Preparation Day)
    // Month is 0-indexed. July is month 6.
    // Start Date: 1 July. 
    if (month === 6 && day === 1) {
        return { updatedTeams: teams, newNews: [] };
    }

    // RULE: Window closes Sept 1st.
    // Allow if July (6), August (7) or Sept 1st (8/1)
    const isWindowOpen = (month === 6) || (month === 7) || (month === 8 && day === 1);
    
    if (!isWindowOpen) {
        return { updatedTeams: teams, newNews: [] };
    }

    let resultTeams = [...teams];
    const generatedNews: NewsItem[] = [];

    // Calculate days remaining until Sept 1st (approx)
    // Sept 1st is target.
    const deadline = new Date(dateObj.getFullYear(), 8, 1);
    const diffTime = deadline.getTime() - dateObj.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Safety check
    if (daysRemaining <= 0) return { updatedTeams: teams, newNews: [] };

    // Iterate through teams to simulate activity
    resultTeams = resultTeams.map(team => {
        // Skip user team (user controls their own transfers)
        if (team.id === myTeamId) return team;

        let modifiedTeam = { ...team };
        const transfersInCount = team.transferHistory.filter(t => t.type === 'BOUGHT').length;
        
        // Target: Minimum 6, Max 17 transfers
        // Probability Logic:
        // We need to make roughly (6 - current) transfers in (daysRemaining) days.
        // Base chance increases as deadline approaches if below min.
        // Also allow some randomness to reach up to 17.
        
        // Buying Probability
        let buyChance = 0.15; // Base daily chance
        if (transfersInCount < 6) {
            buyChance = Math.min(0.8, (6 - transfersInCount) / daysRemaining * 2); // Accelerate if behind
        } else if (transfersInCount >= 17) {
            buyChance = 0; // Stop buying
        }

        // Selling Probability
        // Sell if squad is too big (>25) or randomly to generate funds/churn
        const squadSize = team.players.length;
        let sellChance = 0.10;
        if (squadSize > 25) sellChance = 0.40;
        if (squadSize < 18) sellChance = 0; // Don't deplete too much

        // --- EXECUTE BUY ---
        if (Math.random() < buyChance) {
            // Determine position need (simplified: random weighted by squad gaps)
            // For AI simplicity, we generate a player fitting the team's strength level
            
            // Target Strength: Current Team Strength +/- variance
            // If rich, aim higher.
            const budgetFactor = team.budget > 20 ? 3 : team.budget > 5 ? 0 : -2;
            const targetSkill = Math.floor(team.strength + budgetFactor + (Math.random() * 6 - 3));
            
            // Pick a position (random for now, could be smarter)
            const positions = [Position.GK, Position.STP, Position.SLB, Position.SGB, Position.OS, Position.SLK, Position.SGK, Position.SNT];
            const targetPos = positions[Math.floor(Math.random() * positions.length)];

            // Generate "Inbound" Player (Simulates buying from foreign/lower leagues)
            // Use existing generator but force reasonable value
            const newPlayer = createNewPlayer(targetPos, targetSkill, team.id, true, team.jersey);
            
            // Check Budget
            if (team.budget >= newPlayer.value) {
                // BUY SUCCESS
                modifiedTeam.budget -= newPlayer.value;
                modifiedTeam.players = [...modifiedTeam.players, newPlayer];
                
                // Add History
                const record: TransferRecord = {
                    date: `${day} ${month === 6 ? 'Tem' : month === 7 ? 'Ağu' : 'Eyl'}`,
                    playerName: newPlayer.name,
                    type: 'BOUGHT',
                    counterparty: newPlayer.nationality === 'Türkiye' ? 'Alt Lig' : 'Yurt Dışı',
                    price: `${newPlayer.value} M€`
                };
                modifiedTeam.transferHistory = [...modifiedTeam.transferHistory, record];

                // Recalculate Strength
                modifiedTeam = recalculateTeamStrength(modifiedTeam);

                // Add News (If significant)
                if (newPlayer.value > 5) {
                    generatedNews.push({
                        id: generateId(),
                        week: currentWeek,
                        title: `Transfer: ${team.name}`,
                        content: `${team.name}, kadrosunu ${newPlayer.name} (${newPlayer.position}, ${newPlayer.skill}) ile güçlendirdi. Bonservis: ${newPlayer.value} M€`,
                        type: 'TRANSFER'
                    });
                }
            }
        }

        // --- EXECUTE SELL ---
        if (Math.random() < sellChance) {
            // Pick a player to sell (Not the best ones usually, unless big offer logic added)
            // Random index
            if (modifiedTeam.players.length > 18) {
                const sellIdx = Math.floor(Math.random() * modifiedTeam.players.length);
                const playerToSell = modifiedTeam.players[sellIdx];
                
                // Don't sell newly bought players (check history)
                const justBought = modifiedTeam.transferHistory.some(h => h.playerName === playerToSell.name && h.type === 'BOUGHT');
                
                if (!justBought) {
                    // Sell Value (Market Value +/- 10%)
                    const sellPrice = Number((playerToSell.value * (0.9 + Math.random() * 0.2)).toFixed(1));
                    
                    modifiedTeam.budget += sellPrice;
                    modifiedTeam.players = modifiedTeam.players.filter(p => p.id !== playerToSell.id);
                    
                    const record: TransferRecord = {
                        date: `${day} ${month === 6 ? 'Tem' : month === 7 ? 'Ağu' : 'Eyl'}`,
                        playerName: playerToSell.name,
                        type: 'SOLD',
                        counterparty: 'Yurt Dışı', // Simplified destination
                        price: `${sellPrice} M€`
                    };
                    modifiedTeam.transferHistory = [...modifiedTeam.transferHistory, record];
                    
                    // Recalculate Strength
                    modifiedTeam = recalculateTeamStrength(modifiedTeam);

                    if (sellPrice > 5) {
                        generatedNews.push({
                            id: generateId(),
                            week: currentWeek,
                            title: `Ayrılık: ${team.name}`,
                            content: `${team.name}, ${playerToSell.name} ile yollarını ayırdı. Oyuncu yurt dışına transfer oldu. Gelir: ${sellPrice} M€`,
                            type: 'TRANSFER'
                        });
                    }
                }
            }
        }

        return modifiedTeam;
    });

    return { updatedTeams: resultTeams, newNews: generatedNews };
};

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
                    yellowCards: (player.seasonStats.yellowCards || 0) + yellowCards,
                    redCards: (player.seasonStats.redCards || 0) + redCards,
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
                    // Riskli iğne sonucu sakatlık 30 gün uzar
                    player.injury.daysRemaining += 30;
                }
            }

            const injuryEvent = teamEvents.find(e => e.type === 'INJURY' && e.playerId === p.id);
            let justGotInjured = false;
            let newInjuryDays = 0;

            if (injuryEvent) {
                const injuryType = getWeightedInjury(); 
                // Calculate random duration in DAYS based on minDays and maxDays
                const durationDays = Math.floor(Math.random() * (injuryType.maxDays - injuryType.minDays + 1)) + injuryType.minDays;
                
                player.injury = {
                    type: injuryType.type,
                    daysRemaining: durationDays,
                    description: injuryType.desc
                };
                
                // RULE: If injured, condition immediately drops to 0.
                player.condition = 0;
                
                if (!player.injuryHistory) player.injuryHistory = [];
                player.injuryHistory.push({
                    type: injuryType.type,
                    week: currentWeek,
                    durationDays: durationDays
                });

                justGotInjured = true;
                newInjuryDays = durationDays;
            }

            // Decrement existing injuries (Usually handled in Daily Update, but safe to check here)
            // Note: We primarily handle this in handleNextDay now. Removing decrement here to avoid double counting if match day counts as a day.
            // Leaving it commented out or removed for logic consistency.
            // if (!justGotInjured && player.injury) { ... } 

            // --- MORALE CALCULATIONS ---
            
            let moraleChange = 0;
            const currentlyInjured = !!player.injury; 

            if (justGotInjured) {
                if (newInjuryDays < 14) moraleChange -= 5;
                else if (newInjuryDays < 45) moraleChange -= 10;
                else moraleChange -= 20;
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