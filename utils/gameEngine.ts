
import { Team, Player, Fixture, MatchEvent, MatchStats, Position, Message, TransferRecord, NewsItem, SeasonSummary, TransferImpact, IncomingOffer } from '../types';
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

// --- NEW MECHANIC: DYNAMIC DEVELOPMENT & AGING ---
export const simulatePlayerDevelopmentAndAging = (player: Player, trainingIntensity: boolean): Player => {
    let newSkill = player.skill;
    let stats = { ...player.stats };
    let changed = false;

    // 1. AGING (Regression) - Yaşlı oyuncular güç kaybeder
    // Başlangıç: 30 Yaş
    // Kritik: 35+ (Hızlanır)
    // Çöküş: 38+ (Çok agresif düşüş)
    if (player.age >= 30) {
        let dropChance = 0;

        if (player.age >= 38) {
            dropChance = 0.05; // Günlük %5 (Çok hızlı - Ayda ~1.5 puan düşer)
        } else if (player.age >= 35) {
            dropChance = 0.015; // Günlük %1.5 (Hızlı)
        } else if (player.age >= 33) {
            dropChance = 0.005; // Günlük %0.5 (Orta)
        } else {
            dropChance = 0.001; // Günlük %0.1 (Yavaş - 30-32 yaş arası)
        }

        // Rastgele düşüş tetiklendi mi?
        if (Math.random() < dropChance) {
            // Düşecek özelliği seç (Yaşlılarda fiziksel özellikler daha çabuk ölür)
            const physicals = ['pace', 'acceleration', 'stamina', 'agility', 'balance', 'naturalFitness'] as const;
            
            // %80 Fiziksel, %20 Teknik/Zihinsel düşüş (Eskiden %70 idi)
            let targetStat: keyof typeof stats;
            
            if (Math.random() < 0.80) {
                targetStat = physicals[Math.floor(Math.random() * physicals.length)];
            } else {
                const allKeys = Object.keys(stats) as (keyof typeof stats)[];
                targetStat = allKeys[Math.floor(Math.random() * allKeys.length)];
            }

            // Özellik değerini düşür (Min 1)
            // @ts-ignore
            if (stats[targetStat] > 1) {
                // @ts-ignore
                stats[targetStat] = Math.max(1, stats[targetStat] - 1);
                changed = true;
                
                // Genel Güç (Skill) düşüşü
                // Yaşa göre OVR düşüş ihtimali
                let ovrDropChance = 0.1;
                if (player.age >= 38) ovrDropChance = 1.0; // 38+ ise özellik düştüğünde Skill KESİN düşer
                else if (player.age >= 35) ovrDropChance = 0.7; // %70 ihtimalle düşer
                else if (player.age >= 33) ovrDropChance = 0.4; // %40 ihtimalle düşer

                if (Math.random() < ovrDropChance) {
                    newSkill = Math.max(1, newSkill - 1);
                }
            }
        }
    }

    // 2. DEVELOPMENT (Progression) - Gençler potansiyellerine koşar
    // Şart: Skill < Potansiyel ve Yaş <= 29 (Prime dönemi sonu)
    else if (player.skill < player.potential && player.age <= 29) {
        let growthChance = 0.005; // Base %0.5 Günlük (24-29 yaş)

        if (player.age <= 21) {
            growthChance = 0.015; // Günlük %1.5 (Genç yetenek - Çok hızlı gelişim)
        } else if (player.age <= 23) {
            growthChance = 0.010; // Günlük %1.0 (Gelişim çağı)
        }

        // Antrenman yapıldıysa gelişim hızı artar (+%50)
        if (trainingIntensity) {
            growthChance *= 1.5;
        }

        // Oynama süresi faktörü (Basitleştirilmiş: Skill potansiyelden çok düşükse daha hızlı gelişir)
        if ((player.potential - player.skill) > 10) {
            growthChance *= 1.2;
        }

        if (Math.random() < growthChance) {
            const allKeys = Object.keys(stats) as (keyof typeof stats)[];
            const targetStat = allKeys[Math.floor(Math.random() * allKeys.length)];

            // @ts-ignore
            if (stats[targetStat] < 99) {
                // @ts-ignore
                stats[targetStat] = Math.min(99, stats[targetStat] + 1);
                changed = true;

                // Genel Güç Artışı
                // Gençlerde gelişim OVR'ye daha hızlı yansır (%30 şans)
                if (Math.random() < 0.30) {
                    newSkill = Math.min(player.potential, newSkill + 1);
                }
            }
        }
    }

    // 3. APPLY CHANGES & RECALCULATE VALUE
    if (changed) {
        // Legacy alanları güncelle
        stats.shooting = stats.finishing;
        stats.defending = Math.floor(((stats.marking || 50) + (stats.tackling || 50)) / 2);

        // Yeni Piyasa Değeri Hesabı
        const newValue = calculateMarketValue(player.position, newSkill, player.age);

        return {
            ...player,
            skill: newSkill,
            stats: stats,
            value: newValue
        };
    }

    return player;
};

// Generates incoming offers for user's team players
export const generateAiOffersForUser = (myTeam: Team, currentDate: string): IncomingOffer[] => {
    const newOffers: IncomingOffer[] = [];
    
    // Only proceed if window is open (check happens in gameStateLogic)
    
    // Iterate through all players
    myTeam.players.forEach(p => {
        let offerChance = 0;

        // Base Chance for Transfer Listed Players: High
        if (p.transferListed) {
            offerChance = 0.15; // 15% daily chance
        } 
        // Small chance for unwanted players (Surplus) even if not listed
        else if (p.squadStatus === 'SURPLUS') {
            offerChance = 0.05; // Slightly higher than regular
        }
        // --- NEW: Chance for ANY unlisted player ---
        // Good performance increases chance significantly
        else {
            offerChance = 0.005; // 0.5% base daily chance for random offers (Very low but possible)
            
            // If performing well, increase interest
            if (p.seasonStats.averageRating > 7.0) {
                offerChance += 0.01; // +1% chance
            }
            if (p.seasonStats.averageRating > 7.5) {
                offerChance += 0.015; // +1.5% extra chance for stars
            }
            
            // Young wonderkids attract more interest
            if (p.age < 22 && p.potential > 85) {
                offerChance += 0.01;
            }
        }

        if (Math.random() < offerChance) {
            // Generate Offer
            // GENERIC CLUB NAME AS REQUESTED
            const clubName = 'Yurt Dışı Kulübü';
            
            // Offer Amount
            // If transfer listed, offers might be slightly below value
            // If unsolicited star, offers might be above value
            let offerAmount = p.value;
            
            if (p.transferListed) {
                // 90% to 110% of value
                offerAmount = p.value * (0.9 + Math.random() * 0.2);
            } else {
                // Unlisted players require tempting offers (110% to 160% of value)
                offerAmount = p.value * (1.1 + Math.random() * 0.5);
            }

            newOffers.push({
                id: generateId(),
                playerId: p.id,
                playerName: p.name,
                fromTeamName: clubName,
                amount: parseFloat(offerAmount.toFixed(1)),
                date: currentDate
            });
        }
    });

    return newOffers;
};

// KEEP EXISTING simulateAiDailyTransfers
export const simulateAiDailyTransfers = (teams: Team[], currentDate: string, currentWeek: number, myTeamId: string | null): { updatedTeams: Team[], newNews: NewsItem[] } => {
    const dateObj = new Date(currentDate);
    const day = dateObj.getDate();
    const month = dateObj.getMonth(); 

    // Month is 0-indexed. July is month 6.
    if (month === 6 && day === 1) {
        return { updatedTeams: teams, newNews: [] };
    }

    const isWindowOpen = (month === 6) || (month === 7) || (month === 8 && day === 1);
    
    if (!isWindowOpen) {
        return { updatedTeams: teams, newNews: [] };
    }

    let resultTeams = [...teams];
    const generatedNews: NewsItem[] = [];

    const deadline = new Date(dateObj.getFullYear(), 8, 1);
    const diffTime = deadline.getTime() - dateObj.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) return { updatedTeams: teams, newNews: [] };

    resultTeams = resultTeams.map(team => {
        if (team.id === myTeamId) return team;

        let modifiedTeam = { ...team };
        const transfersInCount = team.transferHistory.filter(t => t.type === 'BOUGHT').length;
        
        let buyChance = 0.15; 
        if (transfersInCount < 6) {
            buyChance = Math.min(0.8, (6 - transfersInCount) / daysRemaining * 2); 
        } else if (transfersInCount >= 17) {
            buyChance = 0; 
        }

        const squadSize = team.players.length;
        let sellChance = 0.10;
        if (squadSize > 25) sellChance = 0.40;
        if (squadSize < 18) sellChance = 0; 

        if (Math.random() < buyChance) {
            const budgetFactor = team.budget > 20 ? 3 : team.budget > 5 ? 0 : -2;
            const targetSkill = Math.floor(team.strength + budgetFactor + (Math.random() * 6 - 3));
            
            const positions = [Position.GK, Position.STP, Position.SLB, Position.SGB, Position.OS, Position.SLK, Position.SGK, Position.SNT];
            const targetPos = positions[Math.floor(Math.random() * positions.length)];

            // Uses new generator with potential logic automatically
            const newPlayer = createNewPlayer(targetPos, targetSkill, team.id, true, team.jersey);
            
            if (team.budget >= newPlayer.value) {
                modifiedTeam.budget -= newPlayer.value;
                modifiedTeam.players = [...modifiedTeam.players, newPlayer];
                
                const record: TransferRecord = {
                    date: `${day} ${month === 6 ? 'Tem' : month === 7 ? 'Ağu' : 'Eyl'}`,
                    playerName: newPlayer.name,
                    type: 'BOUGHT',
                    counterparty: newPlayer.nationality === 'Türkiye' ? 'Alt Lig' : 'Yurt Dışı',
                    price: `${newPlayer.value} M€`
                };
                modifiedTeam.transferHistory = [...modifiedTeam.transferHistory, record];

                modifiedTeam = recalculateTeamStrength(modifiedTeam);

                if (newPlayer.value > 5) {
                    const handle = `@${team.name.replace(/\s/g, '').toLowerCase()}`;
                    generatedNews.push({
                        id: generateId(),
                        week: currentWeek,
                        title: `${team.name}|${handle}|OFFICIAL`,
                        content: `✍️ Ailemize hoş geldin ${newPlayer.name}! Kulübümüz, başarılı oyuncu ile anlaşma sağlamıştır. Camiamıza hayırlı olsun.`,
                        type: 'TRANSFER'
                    });
                }
            }
        }

        if (Math.random() < sellChance) {
            if (modifiedTeam.players.length > 18) {
                const sellIdx = Math.floor(Math.random() * modifiedTeam.players.length);
                const playerToSell = modifiedTeam.players[sellIdx];
                
                const justBought = modifiedTeam.transferHistory.some(h => h.playerName === playerToSell.name && h.type === 'BOUGHT');
                
                if (!justBought) {
                    const sellPrice = Number((playerToSell.value * (0.9 + Math.random() * 0.2)).toFixed(1));
                    
                    modifiedTeam.budget += sellPrice;
                    modifiedTeam.players = modifiedTeam.players.filter(p => p.id !== playerToSell.id);
                    
                    const record: TransferRecord = {
                        date: `${day} ${month === 6 ? 'Tem' : month === 7 ? 'Ağu' : 'Eyl'}`,
                        playerName: playerToSell.name,
                        type: 'SOLD',
                        counterparty: 'Yurt Dışı', 
                        price: `${sellPrice} M€`
                    };
                    modifiedTeam.transferHistory = [...modifiedTeam.transferHistory, record];
                    
                    modifiedTeam = recalculateTeamStrength(modifiedTeam);

                    if (sellPrice > 5) {
                        const handle = `@${team.name.replace(/\s/g, '').toLowerCase()}`;
                        generatedNews.push({
                            id: generateId(),
                            week: currentWeek,
                            title: `${team.name}|${handle}|OFFICIAL`,
                            content: `👋 Oyuncumuz ${playerToSell.name} ile yollarımızı ayırdık. Oyuncumuzun ${sellPrice} M€ bedelle yurt dışı kulübüne transferi gerçekleşmiştir. Kendisine emekleri için teşekkür eder, bundan sonraki kariyerinde başarılar dileriz.`,
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

// KEEP EXISTING processMatchPostGame
export const processMatchPostGame = (teams: Team[], events: MatchEvent[], currentWeek: number, allFixtures: Fixture[] = []): Team[] => {
    return teams.map(team => {
        const teamEvents = events.filter(e => e.teamName === team.name);
        
        const myGoals = events.filter(e => e.type === 'GOAL' && e.teamName === team.name).length;
        const oppGoals = events.filter(e => e.type === 'GOAL' && e.teamName !== team.name).length;
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        if (myGoals > oppGoals) result = 'WIN';
        else if (myGoals < oppGoals) result = 'LOSS';

        const teamPastFixtures = allFixtures
            .filter(f => f.played && f.week < currentWeek && (f.homeTeamId === team.id || f.awayTeamId === team.id))
            .sort((a, b) => b.week - a.week); 

        const currentFixture = allFixtures.find(f => f.week === currentWeek && (f.homeTeamId === team.id || f.awayTeamId === team.id));
        const mvpId = currentFixture?.stats?.mvpPlayerId;

        let teamMoraleBonus = 0; 
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
            if (consecutiveLosses > 1) teamMoralePenalty += 1;
        }
        if (result === 'LOSS' && (oppGoals - myGoals) >= 4) teamMoralePenalty += 2; 

        let winningGoalScorerName: string | null = null;
        let isOneZeroWin = false;

        if (result === 'WIN') {
            const myGoalsEvents = events
                .filter(e => e.type === 'GOAL' && e.teamName === team.name)
                .sort((a,b) => a.minute - b.minute);
            
            const winningGoalEvent = myGoalsEvents[oppGoals];
            if (winningGoalEvent && winningGoalEvent.scorer) {
                winningGoalScorerName = winningGoalEvent.scorer;
            }
            if (myGoals === 1 && oppGoals === 0) isOneZeroWin = true;
        }

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

            const goals = teamEvents.filter(e => e.type === 'GOAL' && e.scorer === p.name).length;
            const assists = teamEvents.filter(e => e.type === 'GOAL' && e.assist === p.name).length;
            const yellowCards = teamEvents.filter(e => e.type === 'CARD_YELLOW' && e.playerId === p.id).length;
            const redCards = teamEvents.filter(e => e.type === 'CARD_RED' && e.playerId === p.id).length;
            
            let bonus = 0;
            if (playedCurrentMatch && winningGoalScorerName && p.name === winningGoalScorerName) {
                if (isOneZeroWin) bonus = 0.5;
                else bonus = 0.3;
            }

            const matchRating = calculateRating(
                p.position, p.skill, goals, assists, yellowCards, redCards, oppGoals, result, 90, bonus
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
                
                const maxDrop = 65;
                const minDrop = 40;
                const staminaFactor = Math.max(0, Math.min(1, (player.stats.stamina - 20) / 79)); 
                const totalPotentialDrop = maxDrop - (staminaFactor * (maxDrop - minDrop));
                
                let minutesPlayed = 90;
                if (isSub && subInEvent) minutesPlayed = 90 - subInEvent.minute;
                else if (isStarter) {
                    const subOutEvent = teamEvents.find(e => 
                        e.type === 'SUBSTITUTION' && 
                        e.description.includes('🔄') &&
                        e.description.split('🔄')[0].trim() === p.name
                    );
                    if (subOutEvent) minutesPlayed = subOutEvent.minute;
                }

                let posMult = 1.0;
                switch (p.position) {
                    case Position.GK: posMult = 0.2; break; 
                    case Position.STP: posMult = 0.6; break;
                    case Position.SLB:
                    case Position.SGB: posMult = 1.1; break;
                    case Position.OS:
                    case Position.OOS: posMult = 1.0; break;
                    case Position.SLK:
                    case Position.SGK: posMult = 1.2; break;
                    case Position.SNT: posMult = 0.9; break; 
                    default: posMult = 1.0;
                }

                let contextMult = 1.0;
                if (currentFixture) {
                    const opponentId = currentFixture.homeTeamId === team.id ? currentFixture.awayTeamId : currentFixture.homeTeamId;
                    const opponentTeam = teams.find(t => t.id === opponentId);
                    if (opponentTeam) {
                        const isDerby = RIVALRIES.some(pair => pair.includes(team.name) && pair.includes(opponentTeam.name));
                        const isFinal = currentFixture.week === 34; 
                        if (isDerby || isFinal) contextMult = 1.2; 
                    }
                }

                const actualDrop = (minutesPlayed / 90) * totalPotentialDrop * posMult * contextMult;
                player.condition = Math.max(0, player.condition - actualDrop);
            } 
            
            const recentRatings = player.seasonStats.ratings.slice(-5);
            if (recentRatings.length > 0) {
                 const sum = recentRatings.reduce((a, b) => a + b, 0);
                 player.seasonStats.averageRating = Number((sum / recentRatings.length).toFixed(1));
            } else {
                 player.seasonStats.averageRating = 0;
            }

            if (player.hasInjectionForNextMatch) {
                player.hasInjectionForNextMatch = false;
                if (Math.random() < 0.3 && player.injury) {
                    player.injury.daysRemaining += 30;
                }
            }

            const injuryEvent = teamEvents.find(e => e.type === 'INJURY' && e.playerId === p.id);
            let justGotInjured = false;
            let newInjuryDays = 0;

            if (injuryEvent) {
                const injuryType = getWeightedInjury(); 
                const durationDays = Math.floor(Math.random() * (injuryType.maxDays - injuryType.minDays + 1)) + injuryType.minDays;
                
                player.injury = {
                    type: injuryType.type,
                    daysRemaining: durationDays,
                    description: injuryType.desc
                };
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

// --- NEW FUNCTIONS FOR SEASON RESET & SUMMARY ---

export const archiveSeason = (myTeam: Team, teams: Team[], currentYear: number): SeasonSummary => {
    // 1. Determine Rank
    const sortedTeams = [...teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const rank = sortedTeams.findIndex(t => t.id === myTeam.id) + 1;

    // 2. Identify Trophies Won (Based on last season data logic)
    const trophiesWon: string[] = [];
    if (rank === 1) trophiesWon.push("Süper Toto Ligi Şampiyonluğu");
    // Cup logic would go here if cup simulation exists (currently mocked or simple)

    // 3. Best XI (Sort by rating)
    const bestXI = [...myTeam.players]
        .sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating)
        .slice(0, 11);

    // 4. Top Stats
    const topScorerP = [...myTeam.players].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0];
    const topAssisterP = [...myTeam.players].sort((a, b) => b.seasonStats.assists - a.seasonStats.assists)[0];
    const topRatedP = [...myTeam.players].sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating)[0];

    // 5. Transfer Impacts (Filter history for 'BOUGHT' in this season timeframe)
    // In this game flow, transferHistory accumulates. We filter by year logic or just take recent if simple.
    // For robustness, let's look at players who were bought.
    const transfersIn: TransferImpact[] = [];
    myTeam.transferHistory.forEach(th => {
        if (th.type === 'BOUGHT') {
            // Find player current stats
            const p = myTeam.players.find(pl => pl.name === th.playerName);
            if (p) {
                transfersIn.push({
                    name: p.name,
                    fee: parseFloat(th.price.replace(' M€','')),
                    goals: p.seasonStats.goals,
                    assists: p.seasonStats.assists,
                    rating: p.seasonStats.averageRating,
                    type: 'BOUGHT'
                });
            }
        }
    });

    return {
        season: `${currentYear - 1}/${currentYear}`,
        teamName: myTeam.name,
        rank,
        stats: {
            wins: myTeam.stats.won,
            draws: myTeam.stats.drawn,
            losses: myTeam.stats.lost,
            goalsFor: myTeam.stats.gf,
            goalsAgainst: myTeam.stats.ga,
            points: myTeam.stats.points
        },
        bestXI: JSON.parse(JSON.stringify(bestXI)), // Deep copy to preserve stats
        topScorer: { name: topScorerP?.name || '-', count: topScorerP?.seasonStats.goals || 0 },
        topAssister: { name: topAssisterP?.name || '-', count: topAssisterP?.seasonStats.assists || 0 },
        topRated: { name: topRatedP?.name || '-', rating: topRatedP?.seasonStats.averageRating || 0 },
        trophiesWon,
        transfersIn
    };
};

export const resetForNewSeason = (teams: Team[]): Team[] => {
    return teams.map(team => {
        // Reset Team Stats
        const newStats = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
        
        // Reset Financial Cumulative (Income/Expense buckets reset to 0 for new season tracking)
        // Note: Budget remains.
        const newFinancials = {
            income: { transfers: 0, tv: 0, merch: 0, loca: 0, gate: 0, sponsor: 0 },
            expense: { wages: 0, transfers: 0, staff: 0, maint: 0, academy: 0, debt: 0, matchDay: 0, travel: 0, scouting: 0, admin: 0, bonus: 0, fines: 0 }
        };

        // Reset Player Season Stats & Aging
        const newPlayers = team.players.map(p => {
            // Aging: Players get 1 year older
            const newAge = p.age + 1;
            
            // --- NEW POTENTIAL & SKILL AGING LOGIC (SEASON RESET) ---
            let newSkill = p.skill;
            let newPotential = p.potential;

            // 1. Potential Adjustment based on Age
            if (newAge >= 31) {
                // 30+: Potential is capped at current skill (declining phase)
                newPotential = newSkill;
            } else if (newAge >= 25) {
                // 25-30: Potential growth slows drastically. 
                // Potential becomes current skill + 1 or 2 at max.
                newPotential = Math.min(95, newSkill + Math.floor(Math.random() * 2) + 1);
            } else if (newAge >= 22) {
                // 22-25: Potential "Correction". If they haven't reached high potential yet, it drops.
                // Max potential capped at 90 unless skill is already higher
                if (newPotential > 90 && newSkill < 85) {
                    newPotential = 90; // "Failed wonderkid" scenario
                }
            } 
            // 16-21: Potential remains high, they are still developing.

            // 2. Skill Development / Regression (Aggressive End-of-Season Drop for Old Players)
            if (newAge <= 21) {
                // Young growth
                const growth = Math.floor(Math.random() * 3);
                newSkill = Math.min(newPotential, newSkill + growth);
            } else if (newAge >= 22 && newAge <= 29) {
                // Prime age: Slow growth towards potential
                if (newSkill < newPotential) {
                    const growth = Math.floor(Math.random() * 2);
                    newSkill = Math.min(newPotential, newSkill + growth);
                }
            } else if (newAge > 32) {
                // Decline (More aggressive)
                let declineBase = 1;
                
                if (newAge >= 38) declineBase = 4; // Çok hızlı düşüş
                else if (newAge >= 35) declineBase = 3;
                else declineBase = 1;

                const decline = Math.floor(Math.random() * 2) + declineBase;
                newSkill = Math.max(40, newSkill - decline);
            }
            
            // Ensure potential never drops below current skill
            newPotential = Math.max(newSkill, newPotential);

            return {
                ...p,
                age: newAge,
                skill: Math.min(99, Math.max(30, newSkill)),
                potential: newPotential,
                seasonStats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratings: [], averageRating: 0, matchesPlayed: 0 },
                suspendedUntilWeek: 0 // Clear suspensions
            };
        });

        const newTransferHistory: TransferRecord[] = []; 

        return {
            ...team,
            stats: newStats,
            financialRecords: newFinancials,
            players: newPlayers,
            transferHistory: newTransferHistory
        };
    });
};