
import { GameState, Team, MatchEvent, MatchStats, SeasonSummary, SeasonChampion, IncomingOffer, Position, Fixture } from '../types';
import { 
    simulateAiDailyTransfers, 
    simulateBackgroundMatch, 
    processMatchPostGame, 
    generateWeeklyNews, 
    generateTransferMarket, 
    calculatePlayerWage, 
    applySeasonEndReputationUpdates,
    archiveSeason,
    resetForNewSeason,
    recalculateTeamStrength,
    simulatePlayerDevelopmentAndAging,
    generateAiOffersForUser, 
    getAssistantTrainingConfig, 
    applyTraining 
} from './gameEngine';
import { isSameDay, addDays, isTransferWindowOpen, generateFixtures, generateSuperCupFixtures } from './calendarAndFixtures';
import { getWeightedInjury } from './matchLogic';
import { generateId } from '../constants';

// Bir sonraki günün işlenmesi mantığı
export const processNextDayLogic = (
    currentState: GameState,
    handleGameOver: (reason: string) => void
): Partial<GameState> | null => {
    const currentDateObj = new Date(currentState.currentDate);
    const nextDate = addDays(currentState.currentDate, 1);
    const nextDateObj = new Date(nextDate);

    // --- YENİ SEZON (1 TEMMUZ) ---
    if (nextDateObj.getDate() === 1 && nextDateObj.getMonth() === 6) { 
        const myTeam = currentState.teams.find(t => t.id === currentState.myTeamId);
        let summary: SeasonSummary | null = null;
        let lastSeasonGoalAchieved = false;
        
        // --- PROMOTION & RELEGATION LOGIC ---
        // 1. Süper Lig'den Düşenleri Belirle (Son 3)
        const superLeagueTeams = currentState.teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        const sortedSL = [...superLeagueTeams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });
        
        const relegatedTeams = sortedSL.slice(sortedSL.length - 3); // Son 3 (16, 17, 18)

        // 2. 1. Lig'den Direkt Çıkanları Belirle (İlk 2)
        const league1Teams = currentState.teams.filter(t => t.leagueId === 'LEAGUE_1');
        const sortedL1 = [...league1Teams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });
        
        const directPromoted = sortedL1.slice(0, 2); // 1. ve 2.

        // 3. Play-Off Kazananını Belirle
        // Play-Off Final Maçını Bul
        const playoffFinal = currentState.fixtures.find(f => f.competitionId === 'PLAYOFF_FINAL' && f.played);
        let playoffWinner: Team | null = null;
        
        if (playoffFinal && playoffFinal.homeScore !== null && playoffFinal.awayScore !== null) {
            const winnerId = playoffFinal.homeScore > playoffFinal.awayScore 
                ? playoffFinal.homeTeamId 
                : (playoffFinal.awayScore > playoffFinal.homeScore ? playoffFinal.awayTeamId 
                : (playoffFinal.pkHome! > playoffFinal.pkAway! ? playoffFinal.homeTeamId : playoffFinal.awayTeamId));
            
            playoffWinner = currentState.teams.find(t => t.id === winnerId) || null;
        } else {
            // Eğer Play-Off oynanmadıysa (eski save vs), 3.yü al
            playoffWinner = sortedL1[2];
        }

        // --- TAKIMLARI GÜNCELLE ---
        const teamsToUpdate = [...currentState.teams];
        
        // Düşenleri 1. Lig'e At
        relegatedTeams.forEach(rt => {
            const idx = teamsToUpdate.findIndex(t => t.id === rt.id);
            if (idx !== -1) teamsToUpdate[idx].leagueId = 'LEAGUE_1';
        });

        // Çıkanları Süper Lig'e At
        directPromoted.forEach(pt => {
            const idx = teamsToUpdate.findIndex(t => t.id === pt.id);
            if (idx !== -1) teamsToUpdate[idx].leagueId = 'LEAGUE';
        });

        // Play-Off Şampiyonunu Çıkar
        if (playoffWinner) {
            const idx = teamsToUpdate.findIndex(t => t.id === playoffWinner!.id);
            if (idx !== -1) teamsToUpdate[idx].leagueId = 'LEAGUE';
        }

        // Süper Kupa için Sıralama (Lig 1, 2, 3 + Kupa Şampiyonu)
        // Not: Lig 1, 2, 3'ü mevcut sezondan alıyoruz (değişiklikler uygulanmadan önceki sortedSL)
        const qualifiedTeams = [sortedSL[0], sortedSL[1], sortedSL[2], sortedSL[3]];

        if (myTeam) {
            summary = archiveSeason(myTeam, currentState.teams, nextDateObj.getFullYear());
            
            // Check if goal achieved (Rank logic)
            // Need to re-sort based on user league
            const userLeague = myTeam.leagueId || 'LEAGUE';
            const relevantTeams = currentState.teams.filter(t => (t.leagueId || 'LEAGUE') === userLeague);
            const sorted = [...relevantTeams].sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
            });
            const rank = sorted.findIndex(t => t.id === myTeam.id) + 1;
            const exp = myTeam.board.expectations;
            if (exp === 'Şampiyonluk' && rank === 1) lastSeasonGoalAchieved = true;
            else if (exp === 'Üst Sıralar' && rank <= 5) lastSeasonGoalAchieved = true;
            else if (exp === 'Ligde Kalmak' && rank <= 15) lastSeasonGoalAchieved = true;
        }

        // Reset işlemi (Güncellenmiş lig ID'leri ile)
        let resetTeams = resetForNewSeason(teamsToUpdate);
        
        // Fikstürleri Oluştur
        const slTeams = resetTeams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        const l1Teams = resetTeams.filter(t => t.leagueId === 'LEAGUE_1');
        
        const fixturesSL = generateFixtures(slTeams, nextDateObj.getFullYear());
        const fixturesL1 = generateFixtures(l1Teams, nextDateObj.getFullYear());
        
        const reFoundQualified = qualifiedTeams.map(qt => resetTeams.find(rt => rt.id === qt.id)!);
        const fixturesSuperCup = generateSuperCupFixtures(reFoundQualified, nextDateObj.getFullYear(), false);

        const newFixtures = [...fixturesSL, ...fixturesL1, ...fixturesSuperCup];

        // Tracking updates
        let newFfpYears = currentState.consecutiveFfpYears;
        if (myTeam) {
            const annualWages = myTeam.players.reduce((s, p) => s + (p.wage || 0), 0);
            if (myTeam.wageBudget && annualWages <= myTeam.wageBudget) {
                newFfpYears++;
            } else {
                newFfpYears = 0;
            }
        }

        return {
            currentDate: nextDate,
            currentWeek: 1,
            teams: resetTeams,
            fixtures: newFixtures,
            lastSeasonSummary: summary,
            seasonChampion: null,
            incomingOffers: [],
            yearsAtCurrentClub: currentState.yearsAtCurrentClub + 1,
            consecutiveFfpYears: newFfpYears,
            lastSeasonGoalAchieved: lastSeasonGoalAchieved
        };
    }

    let updatedTeams = [...currentState.teams];
    let updatedFixtures = [...currentState.fixtures];
    let updatedManager = currentState.manager ? { ...currentState.manager } : null;
    let lastTrainingReport = currentState.lastTrainingReport || [];
    let newWeek = currentState.currentWeek;

    // --- PLAY-OFF FIXTURE GENERATION ---
    // Lig maçları (Hafta 34) bittiğinde devreye girer
    const leagueFixtures = updatedFixtures.filter(f => (f.competitionId === 'LEAGUE_1') && f.week === 34);
    const allLeague1Played = leagueFixtures.length > 0 && leagueFixtures.every(f => f.played);
    
    // Yarı Finaller Oluşturulmadıysa ve Lig Bitiyorsa
    const hasPlayoffSemis = updatedFixtures.some(f => f.competitionId === 'PLAYOFF');
    
    if (newWeek === 34 && allLeague1Played && !hasPlayoffSemis) {
        // 1. Lig Sıralaması
        const league1Teams = updatedTeams.filter(t => t.leagueId === 'LEAGUE_1');
        const sortedL1 = [...league1Teams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });

        // 3. 4. 5. 6. Takımları Al
        const t3 = sortedL1[2];
        const t4 = sortedL1[3];
        const t5 = sortedL1[4];
        const t6 = sortedL1[5];

        if (t3 && t4 && t5 && t6) {
            // Eşleşmeler: 3. vs 5. ve 4. vs 6.
            const dateSemi = new Date(currentDateObj.getFullYear(), 4, 15); // May 15 approx (After week 34)
            const semi1: Fixture = {
                id: generateId(),
                week: 35,
                date: dateSemi.toISOString(),
                homeTeamId: t3.id,
                awayTeamId: t5.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'PLAYOFF'
            };
            const semi2: Fixture = {
                id: generateId(),
                week: 35,
                date: dateSemi.toISOString(),
                homeTeamId: t4.id,
                awayTeamId: t6.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'PLAYOFF'
            };
            updatedFixtures.push(semi1, semi2);
        }
    }

    // Play-off Finali Oluşturma (Yarı finaller bittiğinde)
    const playoffSemis = updatedFixtures.filter(f => f.competitionId === 'PLAYOFF');
    const allSemisPlayed = playoffSemis.length === 2 && playoffSemis.every(f => f.played);
    const hasFinal = updatedFixtures.some(f => f.competitionId === 'PLAYOFF_FINAL');

    if (newWeek === 35 && allSemisPlayed && !hasFinal) {
        // Kazananları Bul
        const winners = playoffSemis.map(f => {
            if (f.homeScore! > f.awayScore!) return f.homeTeamId;
            if (f.awayScore! > f.homeScore!) return f.awayTeamId;
            return f.pkHome! > f.pkAway! ? f.homeTeamId : f.awayTeamId;
        });

        const w1 = updatedTeams.find(t => t.id === winners[0]);
        const w2 = updatedTeams.find(t => t.id === winners[1]);

        if (w1 && w2) {
            const dateFinal = new Date(currentDateObj.getFullYear(), 4, 22); // May 22
            const finalMatch: Fixture = {
                id: generateId(),
                week: 36,
                date: dateFinal.toISOString(),
                homeTeamId: w1.id,
                awayTeamId: w2.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'PLAYOFF_FINAL'
            };
            updatedFixtures.push(finalMatch);
        }
    }

    // --- SUPER CUP FINAL GENERATION (JAN 7) ---
    if (nextDateObj.getMonth() === 0 && nextDateObj.getDate() === 7) {
        const semis = updatedFixtures.filter(f => f.competitionId === 'SUPER_CUP' && f.played);
        
        if (semis.length >= 2) {
            const winners: Team[] = [];
            semis.forEach(match => {
                if (match.homeScore !== null && match.awayScore !== null) {
                    const winnerId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
                    const winner = updatedTeams.find(t => t.id === winnerId);
                    if (winner) winners.push(winner);
                }
            });

            if (winners.length === 2) {
                const finalFixture: Fixture = {
                    id: generateId(),
                    week: 91,
                    date: new Date(nextDateObj.getFullYear(), 0, 10).toISOString(),
                    homeTeamId: winners[0].id,
                    awayTeamId: winners[1].id,
                    played: false,
                    homeScore: null,
                    awayScore: null,
                    competitionId: 'SUPER_CUP'
                };
                updatedFixtures.push(finalFixture);
            }
        }
    }

    // --- BOARD TRUST UPDATES (DAILY) ---
    if (currentState.myTeamId && updatedManager) {
        const myTeam = updatedTeams.find(t => t.id === currentState.myTeamId);
        if (myTeam) {
            let trustChange = 0;
            if (myTeam.budget < 0) {
                let penalty = 0.5;
                if (myTeam.budget >= -10) penalty = 0.2;
                else if (myTeam.budget >= -30) penalty = 0.5;
                else penalty = 1.0;
                trustChange -= penalty;
            }
            const currentTotalWages = myTeam.players.reduce((a, b) => a + (b.wage || 0), 0);
            if (myTeam.wageBudget && currentTotalWages > myTeam.wageBudget) {
                trustChange -= 0.3; 
            }
            if (myTeam.initialReputation && myTeam.reputation >= myTeam.initialReputation + 0.1) {
                trustChange += 0.1;
            }
            if (trustChange !== 0) {
                updatedManager.trust.board = Math.max(0, Math.min(100, updatedManager.trust.board + trustChange));
            }
        }
    }

    const allEventsForToday: MatchEvent[] = [];
    
    const { updatedTeams: teamsAfterTransfers, newNews: transferNews } = simulateAiDailyTransfers(
        updatedTeams, 
        nextDate, 
        currentState.currentWeek, 
        currentState.myTeamId
    );
    updatedTeams = teamsAfterTransfers;

    // --- MANAGE INCOMING OFFERS ---
    let newIncomingOffers = [...(currentState.incomingOffers || [])];
    const withdrawnNews: any[] = [];
    const activeOffers: IncomingOffer[] = [];
    newIncomingOffers.forEach(offer => {
        const offerDate = new Date(offer.date);
        const current = new Date(nextDate);
        const diffTime = Math.abs(current.getTime() - offerDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays <= 5) {
            activeOffers.push(offer);
        } else {
            withdrawnNews.push({
                id: generateId(),
                week: currentState.currentWeek,
                type: 'TRANSFER',
                title: `${offer.fromTeamName}|@Transfer|OFFICIAL`,
                content: `${offer.fromTeamName}, ${offer.playerName} için yaptığı teklifi geri çekti. Süre doldu.`
            });
        }
    });
    newIncomingOffers = activeOffers;

    if (isTransferWindowOpen(nextDate) && currentState.myTeamId) {
        const myTeam = updatedTeams.find(t => t.id === currentState.myTeamId);
        if (myTeam) {
            const freshOffers = generateAiOffersForUser(myTeam, nextDate);
            if (freshOffers.length > 0) {
                newIncomingOffers = [...newIncomingOffers, ...freshOffers];
            }
        }
    }

    // Arka Plan Maçları
    const todaysMatches = updatedFixtures.filter(f => isSameDay(f.date, nextDate) && !f.played);
    todaysMatches.forEach(match => {
         if (match.homeTeamId === currentState.myTeamId || match.awayTeamId === currentState.myTeamId) return;

         const h = updatedTeams.find(t => t.id === match.homeTeamId)!;
         const a = updatedTeams.find(t => t.id === match.awayTeamId)!;
         // Play-off matches are knockouts
         const isKnockout = match.competitionId === 'PLAYOFF' || match.competitionId === 'PLAYOFF_FINAL' || match.competitionId === 'SUPER_CUP' || match.competitionId === 'CUP';
         const res = simulateBackgroundMatch(h, a, isKnockout);
         allEventsForToday.push(...res.events);

         const idx = updatedFixtures.findIndex(f => f.id === match.id);
         if(idx >= 0) {
             updatedFixtures[idx] = { 
                 ...match, played: true, homeScore: res.homeScore, awayScore: res.awayScore, 
                 stats: res.stats, matchEvents: res.events, pkHome: res.pkScore?.h, pkAway: res.pkScore?.a 
             };
         }
    });

    if (allEventsForToday.length > 0) {
        updatedTeams = processMatchPostGame(updatedTeams, allEventsForToday, currentState.currentWeek, updatedFixtures);
    }

    // Finansal Güncellemeler (Kullanıcı Takımı)
    if (currentState.myTeamId) {
        const teamIndex = updatedTeams.findIndex(t => t.id === currentState.myTeamId);
        if (teamIndex !== -1) {
            const userTeam = updatedTeams[teamIndex];
            const financials = { ...userTeam.financialRecords };
            
            const annualSponsorValue = userTeam.sponsors.main.yearlyValue + userTeam.sponsors.stadium.yearlyValue + userTeam.sponsors.sleeve.yearlyValue;
            const dailySponsor = annualSponsorValue / 365; 
            
            const annualWages = userTeam.players.reduce((acc, p) => {
                const playerWage = p.wage !== undefined ? p.wage : calculatePlayerWage(p);
                return acc + playerWage;
            }, 0);
            
            const dailyWages = annualWages / 365;

            financials.income.sponsor += dailySponsor;
            financials.expense.wages += dailyWages;
            financials.expense.staff += (dailyWages * 0.15); 
            financials.expense.maint += ((userTeam.stadiumCapacity / 100000) * 0.5) / 30;
            financials.expense.academy += (userTeam.strength/100 * 0.4) / 30;
            financials.expense.admin += 0.05 / 30;

            updatedTeams[teamIndex] = { ...userTeam, financialRecords: financials };
        }
    }

    // Puan Durumu Cache Güncelleme
    updatedTeams = updatedTeams.map(team => {
         const playedFixtures = updatedFixtures.filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id));
         let played=0, won=0, drawn=0, lost=0, gf=0, ga=0, points=0;
         playedFixtures.forEach(f => {
             // Only count LEAGUE games for points table
             if (f.competitionId !== 'LEAGUE' && f.competitionId !== 'LEAGUE_1' && f.competitionId) return;

             played++;
             const isHome = f.homeTeamId === team.id;
             const myScore = isHome ? f.homeScore! : f.awayScore!;
             const oppScore = isHome ? f.awayScore! : f.homeScore!;
             gf += myScore; ga += oppScore;
             if(myScore > oppScore) { won++; points += 3; }
             else if(myScore === oppScore) { drawn++; points += 1; }
             else lost++;
         });
         return { ...team, stats: { played, won, drawn, lost, gf, ga, points } };
    });

    updatedTeams = updatedTeams.map(t => {
        const isMyTeam = t.id === currentState.myTeamId;
        let didTrain = isMyTeam ? currentState.trainingPerformed : true; 
        let currentTeam = t;

        if (isMyTeam && updatedManager && t.isTrainingDelegated) {
            const aiConfig = getAssistantTrainingConfig(t, updatedManager);
            const { updatedTeam, report } = applyTraining(t, aiConfig);
            const recalculated = recalculateTeamStrength(updatedTeam);
            currentTeam = recalculated;
            lastTrainingReport = report;
            didTrain = true;
        }

        return {
            ...currentTeam,
            players: currentTeam.players.map(p => {
                let newP = { ...p };
                if (newP.injury) {
                    newP.condition = 0;
                    newP.injury.daysRemaining -= 1;
                    if (newP.injury.daysRemaining <= 0) {
                        const history = newP.injuryHistory || [];
                        const lastRecord = history[history.length - 1];
                        newP.lastInjuryDurationDays = lastRecord ? lastRecord.durationDays : 14;
                        newP.injury = undefined;
                    }
                }
                
                if (!newP.injury) {
                    const totalDailyRisk = 0.001 + ((newP.injurySusceptibility || 0) * 0.00005);
                    if (Math.random() < totalDailyRisk) { 
                        const injuryType = getWeightedInjury();
                        const durationDays = Math.floor(Math.random() * (injuryType.maxDays - injuryType.minDays + 1)) + injuryType.minDays;
                        newP.injury = { type: injuryType.type, daysRemaining: durationDays, description: "Antrenmanda talihsiz bir sakatlık yaşadı." };
                        newP.condition = 0;
                        if (!newP.injuryHistory) newP.injuryHistory = [];
                        newP.injuryHistory.push({ type: injuryType.type, week: currentState.currentWeek, durationDays: durationDays });
                    }
                }
                
                if (!newP.injury) {
                    const baseRecovery = 10 + (newP.stats.stamina * 0.5);
                    let durationMultiplier = 1.0;
                    const lastDur = newP.lastInjuryDurationDays || 0;
                    if (lastDur > 0) {
                        if (lastDur <= 10) durationMultiplier = 1.35;
                        else if (lastDur >= 56) durationMultiplier = 0.45;
                        else if (lastDur >= 28) durationMultiplier = 0.7;
                    }
                    if (didTrain) durationMultiplier *= 0.5; 
                    else durationMultiplier *= 1.2; 
                    newP.condition = Math.min(100, (newP.condition || 0) + baseRecovery * durationMultiplier);
                }

                newP = simulatePlayerDevelopmentAndAging(newP, didTrain);

                if (isMyTeam && newP.positionTrainingTarget) {
                    const baseProgress = 1/7;
                    const tickProgress = didTrain ? baseProgress : baseProgress * 0.5;
                    newP.positionTrainingProgress = Number(((newP.positionTrainingProgress || 0) + tickProgress).toFixed(3));
                    if (newP.positionTrainingProgress >= (newP.positionTrainingRequired || 12)) {
                        const oldPos = newP.position;
                        const newPos = newP.positionTrainingTarget;
                        if (newP.secondaryPosition === newPos) { newP.position = newPos; newP.secondaryPosition = oldPos; } else { newP.secondaryPosition = newPos; }
                        lastTrainingReport.push({ playerId: newP.id, playerName: newP.name, message: `YENİ MEVKİ! Artık ${newPos} mevkisinde de görev alabilir.`, type: 'POSITIVE' });
                        newP.positionTrainingTarget = undefined; newP.positionTrainingProgress = undefined; newP.positionTrainingRequired = undefined;
                    }
                }

                return newP;
            })
        };
    });

    const dailyNews = generateWeeklyNews(currentState.currentWeek, updatedFixtures, updatedTeams, currentState.myTeamId);
    
    let newTransferList = [...currentState.transferList];
    if (isTransferWindowOpen(nextDate)) {
        if (newTransferList.length > 5 && Math.random() > 0.7) newTransferList.shift(); 
        if (Math.random() > 0.6) newTransferList = [...newTransferList, ...generateTransferMarket(1, nextDate)];
    }

    if (updatedManager) {
        updatedManager.stats.careerEarnings += (updatedManager.contract.salary / 365);
        if (currentDateObj.getMonth() !== nextDateObj.getMonth()) {
            updatedManager.stats.transferSpendThisMonth = 0;
            updatedManager.stats.transferIncomeThisMonth = 0;
        }
    }

    // CHECK NEXT WEEK PROGRESS
    // Advance week number if all league games (or playoffs) for current week are played
    const leagueFixturesThisWeek = updatedFixtures.filter(f => 
        f.week === newWeek && 
        (f.competitionId === 'LEAGUE' || f.competitionId === 'LEAGUE_1' || f.competitionId === 'PLAYOFF' || f.competitionId === 'PLAYOFF_FINAL' || !f.competitionId)
    );
    const allPlayed = leagueFixturesThisWeek.length > 0 && leagueFixturesThisWeek.every(f => f.played);
    
    let seasonChampion: SeasonChampion | null = null;

    if (allPlayed) {
        // Handle Season End Championship (Week 34)
        if (newWeek === 34) {
            // Apply Reputation but DO NOT promote/relegate yet (Wait for July 1st)
            updatedTeams = applySeasonEndReputationUpdates(updatedTeams);
            
            // Determine Super League Champion for Display
            const slTeams = updatedTeams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
            const finalStandings = [...slTeams].sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
            });
            const champion = finalStandings[0];
            const seasonYear = `${currentDateObj.getFullYear()}/${currentDateObj.getFullYear() + 1}`;

            const champIndex = updatedTeams.findIndex(t => t.id === champion.id);
            if (champIndex !== -1) {
                updatedTeams[champIndex] = {
                    ...updatedTeams[champIndex],
                    championships: updatedTeams[champIndex].championships + 1
                };
            }

            // Archive History for everyone
            updatedTeams = updatedTeams.map(team => {
                // Find rank within THEIR league
                const league = team.leagueId || 'LEAGUE';
                const compTeams = updatedTeams.filter(t => (t.leagueId || 'LEAGUE') === league);
                const sortedComp = [...compTeams].sort((a, b) => {
                    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                    return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
                });
                const rank = sortedComp.findIndex(t => t.id === team.id) + 1;

                const historyEntry = { year: seasonYear, rank: rank };
                return {
                    ...team,
                    leagueHistory: [...(team.leagueHistory || []), historyEntry]
                };
            });

            if (updatedManager && updatedManager.contract.teamName === champion.name) {
                updatedManager.stats.trophies += 1;
                updatedManager.stats.leagueTitles += 1;
                updatedManager.trust.board = 100;
                updatedManager.trust.fans = 100;
            }

            seasonChampion = {
                teamId: champion.id,
                teamName: champion.name,
                logo: champion.logo,
                colors: champion.colors,
                season: seasonYear
            };
        }
        newWeek++;
    }

    if (updatedManager && (updatedManager.trust.board < 30 || updatedManager.trust.fans < 35)) {
        if(updatedManager.trust.board < 30) handleGameOver("Yönetim kurulu acil toplantısı sonrası görevine son verildi. Gerekçe: Başarısız sonuçlar ve güven kaybı.");
        else handleGameOver("Taraftar baskısı dayanılmaz hale geldi. Yönetim, taraftarların isteği üzerine sözleşmeni feshetti.");
        return null;
    }

    const filteredNews = [...withdrawnNews, ...transferNews, ...dailyNews, ...currentState.news].slice(0, 30);

    return {
        currentDate: nextDate,
        currentWeek: newWeek,
        teams: updatedTeams,
        fixtures: updatedFixtures,
        news: filteredNews,
        manager: updatedManager,
        transferList: newTransferList,
        trainingPerformed: false,
        seasonChampion: seasonChampion,
        lastTrainingReport: lastTrainingReport,
        incomingOffers: newIncomingOffers
    };
};
