

import { GameState, Team, MatchEvent, MatchStats, SeasonSummary, SeasonChampion, IncomingOffer } from '../types';
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
    generateAiOffersForUser, // NEW IMPORT
    getAssistantTrainingConfig, // NEW IMPORT
    applyTraining // NEW IMPORT
} from './gameEngine';
import { isSameDay, addDays, isTransferWindowOpen, generateFixtures } from './calendarAndFixtures';
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
        if (myTeam) {
            summary = archiveSeason(myTeam, currentState.teams, nextDateObj.getFullYear());
        }

        let resetTeams = resetForNewSeason(currentState.teams);
        const newFixtures = generateFixtures(resetTeams, nextDateObj.getFullYear());

        return {
            currentDate: nextDate,
            currentWeek: 1,
            teams: resetTeams,
            fixtures: newFixtures,
            lastSeasonSummary: summary,
            seasonChampion: null,
            incomingOffers: [] // Reset incoming offers on new season
        };
    }

    let updatedTeams = [...currentState.teams];
    let updatedFixtures = [...currentState.fixtures];
    let updatedManager = currentState.manager ? { ...currentState.manager } : null;
    let lastTrainingReport = currentState.lastTrainingReport; // Default to old report if no training today

    // Negatif Bütçe Cezası
    if (currentState.myTeamId && updatedManager) {
        const myTeam = updatedTeams.find(t => t.id === currentState.myTeamId);
        if (myTeam && myTeam.budget < 0) {
            let penalty = 0;
            if (myTeam.budget >= -10) penalty = 10;
            else if (myTeam.budget >= -30) penalty = 15;
            else penalty = 35;
            updatedManager.trust.board = Math.max(0, updatedManager.trust.board - penalty);
        }
    }

    const allEventsForToday: MatchEvent[] = [];
    
    // AI Transferleri
    const { updatedTeams: teamsAfterTransfers, newNews: transferNews } = simulateAiDailyTransfers(
        updatedTeams, 
        nextDate, 
        currentState.currentWeek, 
        currentState.myTeamId
    );
    updatedTeams = teamsAfterTransfers;

    // --- MANAGE INCOMING OFFERS (EXPIRATION & NEW GENERATION) ---
    let newIncomingOffers = [...(currentState.incomingOffers || [])];
    const withdrawnNews: any[] = [];

    // 1. Expire old offers (> 5 days)
    const activeOffers: IncomingOffer[] = [];
    newIncomingOffers.forEach(offer => {
        const offerDate = new Date(offer.date);
        const current = new Date(nextDate);
        const diffTime = Math.abs(current.getTime() - offerDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays <= 5) {
            activeOffers.push(offer);
        } else {
            // Offer Expired
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

    // 2. Generate New Offers
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
         const res = simulateBackgroundMatch(h, a);
         allEventsForToday.push(...res.events);

         const idx = updatedFixtures.findIndex(f => f.id === match.id);
         if(idx >= 0) {
             updatedFixtures[idx] = { 
                 ...match, played: true, homeScore: res.homeScore, awayScore: res.awayScore, 
                 stats: res.stats, matchEvents: res.events 
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

    // Oyuncu İyileşmesi, Rastgele Sakatlıklar, GELİŞİM/YAŞLANMA ve OTOMATİK ANTRENMAN
    updatedTeams = updatedTeams.map(t => {
        const isMyTeam = t.id === currentState.myTeamId;
        
        let didTrain = isMyTeam ? currentState.trainingPerformed : true; // Default AI always trains
        let currentTeam = t;

        // --- AUTOMATIC TRAINING LOGIC FOR USER TEAM ---
        if (isMyTeam && updatedManager && t.isTrainingDelegated) {
            // If delegated, we force a training session for the user team right here
            const aiConfig = getAssistantTrainingConfig(t, updatedManager);
            const { updatedTeam, report } = applyTraining(t, aiConfig);
            
            // Recalculate strength after training
            const recalculated = recalculateTeamStrength(updatedTeam);
            
            currentTeam = recalculated;
            lastTrainingReport = report;
            didTrain = true; // Mark as trained so development happens properly
        }

        return {
            ...currentTeam,
            players: currentTeam.players.map(p => {
                let newP = { ...p };
                
                // 1. Injury Recovery
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
                
                // 2. New Injury Risk
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
                
                // 3. Condition Recovery (UPDATED FOR FASTER RECOVERY)
                if (!newP.injury) {
                    // Temel iyileşme hızını artırdık.
                    // Eskiden: stamina / 4 (Ortalama 3-4 puan/gün) -> 10 günde full.
                    // Yeni: 10 + (stamina / 2) (Ortalama 15-20 puan/gün) -> 3-4 günde full.
                    const baseRecovery = 10 + (newP.stats.stamina * 0.5);
                    
                    let durationMultiplier = 1.0;
                    const lastDur = newP.lastInjuryDurationDays || 0;
                    if (lastDur > 0) {
                        if (lastDur <= 10) durationMultiplier = 1.35;
                        else if (lastDur >= 56) durationMultiplier = 0.45;
                        else if (lastDur >= 28) durationMultiplier = 0.7;
                    }
                    
                    // Antrenman yapıldıysa iyileşme yavaşlar, dinlenildiyse bonus alır
                    if (didTrain) durationMultiplier *= 0.5; 
                    else durationMultiplier *= 1.2; 

                    newP.condition = Math.min(100, (newP.condition || 0) + baseRecovery * durationMultiplier);
                }

                // 4. DEVELOPMENT & AGING LOGIC (NEW)
                // Applies daily checks for skill progression/regression
                newP = simulatePlayerDevelopmentAndAging(newP, didTrain);

                return newP;
            })
        };
    });

    const dailyNews = generateWeeklyNews(currentState.currentWeek, updatedFixtures, updatedTeams, currentState.myTeamId);
    
    // Transfer Listesi Güncelleme
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

    let newWeek = currentState.currentWeek;
    const fixturesThisWeek = updatedFixtures.filter(f => f.week === newWeek);
    const allPlayed = fixturesThisWeek.length > 0 && fixturesThisWeek.every(f => f.played);
    
    let seasonChampion: SeasonChampion | null = null;

    if (allPlayed) {
        if (newWeek === 34) {
            updatedTeams = applySeasonEndReputationUpdates(updatedTeams);
            const finalStandings = [...updatedTeams].sort((a, b) => {
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

            updatedTeams = updatedTeams.map(team => {
                const rank = finalStandings.findIndex(t => t.id === team.id) + 1;
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

    // Game Over Kontrolü
    if (updatedManager && (updatedManager.trust.board < 30 || updatedManager.trust.fans < 35)) {
        if(updatedManager.trust.board < 30) handleGameOver("Yönetim kurulu acil toplantısı sonrası görevine son verildi. Gerekçe: Başarısız sonuçlar ve güven kaybı.");
        else handleGameOver("Taraftar baskısı dayanılmaz hale geldi. Yönetim, taraftarların isteği üzerine sözleşmeni feshetti.");
        return null; // State güncellemesi yapma, Game Over ekranına geçiş MainContent içinde tetiklenecek
    }

    // Include withdrawn offers news
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
        lastTrainingReport: lastTrainingReport, // Persist or update report
        incomingOffers: newIncomingOffers
    };
};