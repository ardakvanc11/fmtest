
import { useState, useEffect } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats, Position, Message } from '../types';
import { initializeTeams, RIVALRIES, GAME_CALENDAR } from '../constants';
import { 
    simulateBackgroundMatch, 
    generateFixtures, 
    generateTransferMarket, 
    generateWeeklyNews, 
    isTransferWindowOpen, 
    processMatchPostGame, 
    applyTraining, 
    generateMatchTweets, 
    generatePlayerMessages, 
    calculateRatingsFromEvents, 
    determineMVP, 
    calculateTeamStrength, 
    recalculateTeamStrength, 
    calculateRawTeamStrength, 
    calculateTransferStrengthImpact, 
    generateResignationTweets,
    calculateManagerSalary,
    generateStarSoldRiotTweets,
    applySeasonEndReputationUpdates,
    simulateAiDailyTransfers
} from '../utils/gameEngine';
import { getWeightedInjury } from '../utils/matchLogic';
import { addDays, isSameDay } from '../utils/calendarAndFixtures';
import { INITIAL_MESSAGES } from '../data/messagePool';

export const useGameState = () => {
    const [gameState, setGameState] = useState<GameState>({
        managerName: null,
        manager: null,
        myTeamId: null,
        currentWeek: 1,
        currentDate: GAME_CALENDAR.START_DATE.toISOString(),
        teams: [],
        fixtures: [],
        messages: [],
        isGameStarted: false,
        transferList: [],
        trainingPerformed: false,
        news: [],
        playTime: 0,
        lastSeenInjuryCount: 0
    });
    
    // NAVIGATION HISTORY STATE
    const [viewHistory, setViewHistory] = useState<string[]>(['intro']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const currentView = viewHistory[historyIndex] || 'intro';

    const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<Player | null>(null);
    const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<Team | null>(null);
    const [matchResultData, setMatchResultData] = useState<any>(null);
    const [selectedFixtureForDetail, setSelectedFixtureForDetail] = useState<Fixture | null>(null);
    const [selectedFixtureInfo, setSelectedFixtureInfo] = useState<Fixture | null>(null); 
    const [gameOverReason, setGameOverReason] = useState<string | null>(null);

    // Theme State
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Navigation Functions
    const navigateTo = (view: string) => {
        if (view === currentView) return;

        if (view === 'health_center') {
            const t = gameState.teams.find(t => t.id === gameState.myTeamId);
            const currentInjured = t ? t.players.filter(p => p.injury && p.injury.daysRemaining > 0).length : 0;
            setGameState(prev => ({ ...prev, lastSeenInjuryCount: currentInjured }));
        }

        const newHistory = viewHistory.slice(0, historyIndex + 1);
        newHistory.push(view);
        setViewHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const goBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const goForward = () => {
        if (historyIndex < viewHistory.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('hlm26_theme') as 'dark' | 'light';
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('hlm26_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        let interval: any;
        if (gameState.isGameStarted) {
            interval = setInterval(() => {
                setGameState(prev => ({
                    ...prev,
                    playTime: (prev.playTime || 0) + 1
                }));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState.isGameStarted]);

    useEffect(() => {
        const saved = localStorage.getItem('sthl_save_v3_daily');
        if(saved) {
            try {
                const parsed = JSON.parse(saved);
                if (typeof parsed.playTime === 'undefined') parsed.playTime = 0;
                if (typeof parsed.lastSeenInjuryCount === 'undefined') parsed.lastSeenInjuryCount = 0;
                if (!parsed.currentDate) parsed.currentDate = GAME_CALENDAR.START_DATE.toISOString();
                
                if (parsed.manager && parsed.manager.stats) {
                    if (typeof parsed.manager.stats.leagueTitles === 'undefined') parsed.manager.stats.leagueTitles = 0;
                    if (typeof parsed.manager.stats.domesticCups === 'undefined') parsed.manager.stats.domesticCups = 0;
                    if (typeof parsed.manager.stats.europeanCups === 'undefined') parsed.manager.stats.europeanCups = 0;
                    if (typeof parsed.manager.stats.careerEarnings === 'undefined') parsed.manager.stats.careerEarnings = 0;
                    if (typeof parsed.manager.stats.transferSpendThisMonth === 'undefined') parsed.manager.stats.transferSpendThisMonth = 0;
                    if (typeof parsed.manager.stats.transferIncomeThisMonth === 'undefined') parsed.manager.stats.transferIncomeThisMonth = 0;
                }

                if (parsed.manager && parsed.manager.trust) {
                    if (typeof parsed.manager.trust.media === 'undefined') parsed.manager.trust.media = 50;
                }

                if (parsed.teams) {
                    parsed.teams = parsed.teams.map((t: any) => {
                        if (!t.financialRecords) {
                            t.financialRecords = {
                                income: { transfers: 0, tv: 0, merch: 0, loca: 0, gate: 0, sponsor: 0 },
                                expense: { wages: 0, transfers: 0, staff: 0, maint: 0, academy: 0, debt: 0, matchDay: 0, travel: 0, scouting: 0, admin: 0, bonus: 0, fines: 0 }
                            };
                        }
                        // Ensure transferHistory exists
                        if (!t.transferHistory) {
                            t.transferHistory = [];
                        }
                        return t;
                    });
                }

                setGameState(parsed);
                if(parsed.isGameStarted) {
                    setViewHistory(['home']);
                    setHistoryIndex(0);
                }
            } catch(e) { console.error("Save load failed", e); }
        }
    }, []);

    const checkGameOver = (currentManager: any) => {
        if (!currentManager) return false;
        if (currentManager.trust.board < 30) {
            setGameOverReason("Yönetim kurulu acil toplantısı sonrası görevine son verildi. Gerekçe: Başarısız sonuçlar ve güven kaybı.");
            return true;
        }
        if (currentManager.trust.fans < 35) {
            setGameOverReason("Taraftar baskısı dayanılmaz hale geldi. Yönetim, taraftarların isteği üzerine sözleşmeni feshetti.");
            return true;
        }
        return false;
    };

    const handleRetire = () => {
        setGameOverReason("Kendi isteğinle emekliye ayrıldın. Futbol dünyası başarılarını asla unutmayacak.");
        setViewHistory(['game_over']);
        setHistoryIndex(0);
    };

    const handleTerminateContract = () => {
        setGameOverReason("Sözleşmeni tek taraflı feshettin. Kulüp yönetimi ve taraftarlar bu ani ayrılık karşısında şokta.");
        setViewHistory(['game_over']);
        setHistoryIndex(0);
    };

    const handleStart = (name: string, year: string, country: string) => {
        const teams = initializeTeams();
        const fixtures = generateFixtures(teams);
        const transferList = generateTransferMarket(500, GAME_CALENDAR.START_DATE.toISOString());
        const news = generateWeeklyNews(1, fixtures, teams);

        const birthYear = parseInt(year) || 1980;
        const currentAge = 2025 - birthYear;

        const newState: GameState = {
            managerName: name,
            manager: {
                name,
                age: Math.max(18, Math.min(100, currentAge)),
                nationality: country,
                power: 50,
                stats: { 
                    matchesManaged: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, 
                    trophies: 0, leagueTitles: 0, domesticCups: 0, europeanCups: 0,
                    playersBought: 0, playersSold: 0, moneySpent: 0, moneyEarned: 0,
                    transferSpendThisMonth: 0, transferIncomeThisMonth: 0, recordTransferFee: 0, careerEarnings: 0
                },
                contract: { salary: 1.5, expires: 2028, teamName: '' },
                trust: { board: 50, fans: 50, players: 50, referees: 50, media: 50 },
                playerRelations: [],
                history: []
            },
            myTeamId: null,
            currentWeek: 1,
            currentDate: GAME_CALENDAR.START_DATE.toISOString(),
            teams,
            fixtures,
            messages: INITIAL_MESSAGES,
            isGameStarted: false,
            transferList: [],
            trainingPerformed: false,
            news,
            playTime: 0,
            lastSeenInjuryCount: 0
        };
        setGameState(newState);
        navigateTo('team_select');
    };

    const handleSelectTeam = (id: string) => {
        const selectedTeam = gameState.teams.find(t => t.id === id);
        const salary = selectedTeam ? calculateManagerSalary(selectedTeam.strength) : 1.5;

        setGameState(prev => ({
            ...prev,
            myTeamId: id,
            isGameStarted: true,
            manager: prev.manager ? { 
                ...prev.manager, 
                contract: { 
                    ...prev.manager.contract, 
                    teamName: selectedTeam?.name || '',
                    salary: salary
                } 
            } : null
        }));
        setViewHistory(['home']);
        setHistoryIndex(0);
    };
    
    const handleSave = () => {
        localStorage.setItem('sthl_save_v3_daily', JSON.stringify(gameState));
    };

    const handleNewGame = () => {
        localStorage.removeItem('sthl_save_v3_daily');
        setGameState({
            managerName: null, manager: null, myTeamId: null, currentWeek: 1,
            currentDate: GAME_CALENDAR.START_DATE.toISOString(), teams: [], fixtures: [],
            messages: [], isGameStarted: false, transferList: [], trainingPerformed: false,
            news: [], playTime: 0, lastSeenInjuryCount: 0
        });
        setSelectedPlayerForDetail(null);
        setSelectedTeamForDetail(null);
        setMatchResultData(null);
        setSelectedFixtureForDetail(null);
        setSelectedFixtureInfo(null);
        setGameOverReason(null);
        setViewHistory(['intro']);
        setHistoryIndex(0);
    };

    const handleNextDay = () => {
        const currentDateObj = new Date(gameState.currentDate);
        const nextDate = addDays(gameState.currentDate, 1);
        const nextDateObj = new Date(nextDate);

        let updatedTeams = [...gameState.teams];
        let updatedFixtures = [...gameState.fixtures];
        const allEventsForToday: MatchEvent[] = [];
        
        // --- 1. REALISTIC AI TRANSFER SIMULATION ---
        const { updatedTeams: teamsAfterTransfers, newNews: transferNews } = simulateAiDailyTransfers(
            updatedTeams, 
            nextDate, 
            gameState.currentWeek, 
            gameState.myTeamId
        );
        updatedTeams = teamsAfterTransfers;

        // --- 2. MATCH SIMULATION ---
        const todaysMatches = updatedFixtures.filter(f => isSameDay(f.date, nextDate) && !f.played);
        
        todaysMatches.forEach(match => {
             if (match.homeTeamId === gameState.myTeamId || match.awayTeamId === gameState.myTeamId) return;

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
            updatedTeams = processMatchPostGame(updatedTeams, allEventsForToday, gameState.currentWeek, updatedFixtures);
        }

        if (gameState.myTeamId) {
            const teamIndex = updatedTeams.findIndex(t => t.id === gameState.myTeamId);
            if (teamIndex !== -1) {
                const userTeam = updatedTeams[teamIndex];
                const financials = { ...userTeam.financialRecords };
                const fanFactor = userTeam.fanBase / 1000000;
                const totalMonthlySponsorValue = ((userTeam.championships * 2) + (fanFactor * 0.5)) / 12;
                const dailySponsor = totalMonthlySponsorValue / 30; 
                const totalSquadValue = userTeam.players.reduce((acc, p) => acc + p.value, 0);
                const annualWages = totalSquadValue * 0.005 * 52;
                const dailyWages = annualWages / 365;

                financials.income.sponsor += dailySponsor;
                financials.expense.wages += dailyWages;
                financials.expense.staff += (dailyWages * 0.15); 
                financials.expense.maint += ((userTeam.stadiumCapacity / 100000) * 0.5) / 30;
                financials.expense.academy += (userTeam.strength/100 * 0.4) / 30;
                financials.expense.admin += 0.05 / 30;

                updatedTeams[teamIndex] = {
                    ...userTeam,
                    financialRecords: financials
                };
            }
        }

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

        updatedTeams = updatedTeams.map(t => ({
            ...t,
            players: t.players.map(p => {
                const newP = { ...p };
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
                        newP.injuryHistory.push({ type: injuryType.type, week: gameState.currentWeek, durationDays: durationDays });
                    }
                }
                if (!newP.injury) {
                    const baseRecovery = newP.stats.stamina / 4;
                    let durationMultiplier = 1.0;
                    const lastDur = newP.lastInjuryDurationDays || 0;
                    if (lastDur > 0) {
                        if (lastDur <= 10) durationMultiplier = 1.35;
                        else if (lastDur >= 56) durationMultiplier = 0.45;
                        else if (lastDur >= 28) durationMultiplier = 0.7;
                    }
                    if (gameState.trainingPerformed) durationMultiplier *= 0.8; 
                    else durationMultiplier *= 1.1; 
                    newP.condition = Math.min(100, (newP.condition || 0) + baseRecovery * durationMultiplier);
                }
                return newP;
            })
        }));

        const dailyNews = generateWeeklyNews(gameState.currentWeek, updatedFixtures, updatedTeams, gameState.myTeamId);
        
        let newTransferList = [...gameState.transferList];
        if (isTransferWindowOpen(nextDate)) {
            if (newTransferList.length > 5 && Math.random() > 0.7) newTransferList.shift(); 
            if (Math.random() > 0.6) newTransferList = [...newTransferList, ...generateTransferMarket(1, nextDate)];
        }

        let updatedManager = gameState.manager;
        if (updatedManager) {
            updatedManager = { ...updatedManager };
            updatedManager.stats.careerEarnings += (updatedManager.contract.salary / 365);
            if (currentDateObj.getMonth() !== nextDateObj.getMonth()) {
                updatedManager.stats.transferSpendThisMonth = 0;
                updatedManager.stats.transferIncomeThisMonth = 0;
            }
        }

        let newWeek = gameState.currentWeek;
        const fixturesThisWeek = updatedFixtures.filter(f => f.week === newWeek);
        const allPlayed = fixturesThisWeek.length > 0 && fixturesThisWeek.every(f => f.played);
        
        if (allPlayed) {
            // Check for Season End (Week 34 finishes)
            if (newWeek === 34) {
                updatedTeams = applySeasonEndReputationUpdates(updatedTeams);
            }
            newWeek++;
        }

        // Combine standard news + transfer news
        const filteredNews = [...transferNews, ...dailyNews, ...gameState.news].slice(0, 30);

        if (checkGameOver(updatedManager)) {
            setGameState(prev => ({
                ...prev, currentDate: nextDate, currentWeek: newWeek, teams: updatedTeams, fixtures: updatedFixtures,
                news: filteredNews, manager: updatedManager, transferList: newTransferList, trainingPerformed: false,
            }));
            setViewHistory(['game_over']);
            setHistoryIndex(0);
            return; 
        }

        setGameState(prev => ({
            ...prev, currentDate: nextDate, currentWeek: newWeek, teams: updatedTeams, fixtures: updatedFixtures,
            news: filteredNews, manager: updatedManager, transferList: newTransferList, trainingPerformed: false,
        }));
        navigateTo('home');
    };

    const handleTrain = (type: 'ATTACK' | 'DEFENSE' | 'PHYSICAL') => {
        if(gameState.trainingPerformed) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const trainedTeam = applyTraining(myTeam, type);
        const recalculatedTeam = recalculateTeamStrength(trainedTeam);
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === recalculatedTeam.id ? recalculatedTeam : t),
            trainingPerformed: true
        }));
    };

    const handleMatchFinish = async (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats) => {
        const currentFixture = gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played);
        if (!currentFixture) return;
        const fixtureIdx = gameState.fixtures.findIndex(f => f.id === currentFixture.id);
        const myTeamId = gameState.myTeamId!;
        const isHome = currentFixture.homeTeamId === myTeamId;
        const opponentId = isHome ? currentFixture.awayTeamId : currentFixture.homeTeamId;
        const opponent = gameState.teams.find(t => t.id === opponentId)!;
        const homeTeam = isHome ? gameState.teams.find(t => t.id === myTeamId)! : opponent;
        const awayTeam = isHome ? opponent : gameState.teams.find(t => t.id === myTeamId)!;
        const myScore = isHome ? hScore : aScore;
        const oppScore = isHome ? aScore : hScore;
        let res: 'WIN'|'DRAW'|'LOSS' = 'DRAW';
        if(myScore > oppScore) res = 'WIN';
        if(myScore < oppScore) res = 'LOSS';
        const { homeRatings, awayRatings } = calculateRatingsFromEvents(homeTeam, awayTeam, events, hScore, aScore);
        const mvpInfo = determineMVP(homeRatings, awayRatings);
        const updatedStats: MatchStats = { ...stats, homeRatings, awayRatings, mvpPlayerId: mvpInfo.id, mvpPlayerName: mvpInfo.name };
        const updatedFixtures = [...gameState.fixtures];
        const completedFixture = { ...updatedFixtures[fixtureIdx], played: true, homeScore: hScore, awayScore: aScore, matchEvents: events, stats: updatedStats };
        updatedFixtures[fixtureIdx] = completedFixture;
        const processedTeams = processMatchPostGame(gameState.teams, events, gameState.currentWeek, updatedFixtures);
        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.matchesManaged++;
        updatedManager.stats.goalsFor += myScore;
        updatedManager.stats.goalsAgainst += oppScore;
        let teamsWithBudget = processedTeams;
        if (isHome) {
            const userTeamIndex = processedTeams.findIndex(t => t.id === myTeamId);
            if (userTeamIndex !== -1) {
                const userTeam = processedTeams[userTeamIndex];
                const financials = { ...userTeam.financialRecords };
                const fanMillions = userTeam.fanBase / 1000000;
                const gateReceipts = fanMillions * 0.01944444; 
                const locaIncome = gateReceipts * 0.45;
                const matchDayExpense = 0.15 / 4; 
                financials.income.gate += gateReceipts;
                financials.income.loca += locaIncome;
                financials.expense.matchDay += matchDayExpense;
                processedTeams[userTeamIndex] = { ...userTeam, financialRecords: financials };
            }
        } else {
            const userTeamIndex = processedTeams.findIndex(t => t.id === myTeamId);
            if (userTeamIndex !== -1) {
                const userTeam = processedTeams[userTeamIndex];
                const financials = { ...userTeam.financialRecords };
                financials.expense.travel += 0.1 / 4;
                processedTeams[userTeamIndex] = { ...userTeam, financialRecords: financials };
            }
        }
        const teamsWithUpdatedStats = teamsWithBudget.map(team => {
             const teamFixtures = updatedFixtures.filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id));
             let played=0, won=0, drawn=0, lost=0, gf=0, ga=0, points=0;
             teamFixtures.forEach(f => {
                 played++;
                 const isHomeFix = f.homeTeamId === team.id;
                 const tMyScore = isHomeFix ? f.homeScore! : f.awayScore!;
                 const tOppScore = isHomeFix ? f.awayScore! : f.homeScore!;
                 gf += tMyScore; ga += tOppScore;
                 if(tMyScore > tOppScore) { won++; points += 3; }
                 else if(tMyScore === tOppScore) { drawn++; points += 1; }
                 else lost++;
             });
             return { ...team, stats: { played, won, drawn, lost, gf, ga, points } };
        });
        if (res === 'WIN') {
            updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 2);
            updatedManager.trust.fans = Math.min(100, updatedManager.trust.fans + 3);
            updatedManager.stats.wins++;
        } else if (res === 'DRAW') updatedManager.stats.draws++;
        else {
            updatedManager.trust.board = Math.max(0, updatedManager.trust.board - 2);
            updatedManager.trust.fans = Math.max(0, updatedManager.trust.fans - 5);
            updatedManager.stats.losses++;
        }
        const matchTweets = generateMatchTweets(completedFixture, teamsWithUpdatedStats, true);
        if (checkGameOver(updatedManager)) { setViewHistory(['game_over']); setHistoryIndex(0); }
        setGameState(prev => ({ ...prev, fixtures: updatedFixtures, teams: teamsWithUpdatedStats, manager: updatedManager, news: [...matchTweets, ...prev.news] }));
        setMatchResultData({ homeTeam: homeTeam, awayTeam: awayTeam, homeScore: hScore, awayScore: aScore, stats: updatedStats, events: events });
        const newHistory = viewHistory.slice(0, historyIndex);
        newHistory.push('match_result');
        setViewHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleFastSimulate = () => {
        const currentFixture = gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played);
        if (!currentFixture || !gameState.myTeamId) return;
        const homeTeam = gameState.teams.find(t => t.id === currentFixture.homeTeamId)!;
        const awayTeam = gameState.teams.find(t => t.id === currentFixture.awayTeamId)!;
        const { homeScore, awayScore, stats, events } = simulateBackgroundMatch(homeTeam, awayTeam);
        handleMatchFinish(homeScore, awayScore, events, stats);
    };

    const handleShowTeamDetail = (teamId: string) => {
        const t = gameState.teams.find(x => x.id === teamId);
        if (t) { setSelectedTeamForDetail(t); navigateTo('team_detail'); }
    };

    const handleShowPlayerDetail = (player: Player) => {
        setSelectedPlayerForDetail(player);
        navigateTo('player_detail');
    };

    const handleBuyPlayer = (player: Player) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        if (myTeam.budget >= player.value) {
            const newTransferList = gameState.transferList.filter(p => p.id !== player.id);
            const newPlayer = { ...player, teamId: myTeam.id, jersey: myTeam.jersey };
            const financials = { ...myTeam.financialRecords };
            financials.expense.transfers += player.value;
            let updatedTeam = { ...myTeam, budget: myTeam.budget - player.value, players: [...myTeam.players, newPlayer], financialRecords: financials };
            const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, true);
            const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
            updatedTeam.strength = Number(newVisibleStrength.toFixed(1));
            const newRawStrength = calculateRawTeamStrength(updatedTeam.players);
            updatedTeam.rawStrength = newRawStrength;
            updatedTeam.strengthDelta = updatedTeam.strength - newRawStrength;
            const updatedManager = { ...gameState.manager! };
            updatedManager.stats.moneySpent += player.value;
            updatedManager.stats.transferSpendThisMonth += player.value;
            updatedManager.stats.playersBought++;
            if (player.value > updatedManager.stats.recordTransferFee) updatedManager.stats.recordTransferFee = player.value;
            
            // Add to History
            const dateObj = new Date(gameState.currentDate);
            const record: any = {
                date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
                playerName: newPlayer.name,
                type: 'BOUGHT',
                counterparty: 'Serbest/Liste',
                price: `${newPlayer.value} M€`
            };
            updatedTeam.transferHistory = [...(updatedTeam.transferHistory || []), record];

            setGameState(prev => ({ ...prev, transferList: newTransferList, teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t), manager: updatedManager }));
            alert(`${player.name} takımınıza katıldı!`);
        } else alert("Bütçeniz yetersiz!");
    };

    const handleSellPlayer = (player: Player) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        if (myTeam.players.length <= 16) { alert("Kadro derinliği çok düşük, oyuncu satamazsınız!"); return; }
        const financials = { ...myTeam.financialRecords };
        financials.income.transfers += player.value;
        let updatedTeam = { ...myTeam, budget: myTeam.budget + player.value, players: myTeam.players.filter(p => p.id !== player.id), financialRecords: financials };
        const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, false);
        const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
        updatedTeam.strength = Number(newVisibleStrength.toFixed(1));
        const newRawStrength = calculateRawTeamStrength(updatedTeam.players);
        updatedTeam.rawStrength = newRawStrength;
        updatedTeam.strengthDelta = updatedTeam.strength - newRawStrength;
        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.moneyEarned += player.value;
        updatedManager.stats.transferIncomeThisMonth += player.value;
        updatedManager.stats.playersSold++;
        
        // Add to History
        const dateObj = new Date(gameState.currentDate);
        const record: any = {
            date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
            playerName: player.name,
            type: 'SOLD',
            counterparty: 'Yurt Dışı',
            price: `${player.value} M€`
        };
        updatedTeam.transferHistory = [...(updatedTeam.transferHistory || []), record];

        const sortedPlayers = [...myTeam.players].sort((a, b) => b.skill - a.skill);
        const rank = sortedPlayers.findIndex(p => p.id === player.id);
        const isStarPlayer = rank < 3; 
        let riotNews: any[] = [];
        if (isStarPlayer) {
            updatedManager.trust.fans = Math.max(0, updatedManager.trust.fans - 3);
            updatedManager.trust.board = Math.max(0, updatedManager.trust.board - 5);
            riotNews = generateStarSoldRiotTweets(gameState.currentWeek, myTeam, player.name);
        }
        setGameState(prev => ({ ...prev, teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t), manager: updatedManager, news: [...riotNews, ...prev.news] }));
        if (isStarPlayer) alert(`TARAFTAR TEPKİLİ!\n\nTakımın yıldızı ${player.name} satıldığı için taraftarlar sosyal medyada tepki gösterdi. Güven seviyeniz düştü (-3).`);
        else alert(`${player.name} satıldı! Gelir: ${player.value} M€`);
    };

    const handleMessageReply = (msgId: number, optIndex: number) => {};

    const handleSkipInterview = () => {
        if (!gameState.manager) return;
        const newManager = { ...gameState.manager };
        newManager.trust.media = Math.max(0, newManager.trust.media - 3);
        setGameState(prev => ({ ...prev, manager: newManager }));
        navigateTo('home');
        setMatchResultData(null);
    };

    const handleInterviewComplete = (effect: any, relatedPlayerId?: string) => {
        let newGameState = { ...gameState };
        let myTeam = newGameState.teams.find(t => t.id === gameState.myTeamId)!;
        if (effect.teamMorale) {
            myTeam = { ...myTeam, players: myTeam.players.map(p => ({ ...p, morale: Math.max(0, Math.min(100, p.morale + effect.teamMorale)) })), morale: Math.max(0, Math.min(100, myTeam.morale + effect.teamMorale)) };
        }
        if (effect.playerMorale && relatedPlayerId) {
            const pIndex = myTeam.players.findIndex(p => p.id === relatedPlayerId);
            if (pIndex !== -1) {
                const p = myTeam.players[pIndex];
                myTeam.players[pIndex] = { ...p, morale: Math.max(0, Math.min(100, p.morale + effect.playerMorale)) };
            }
        }
        if (effect.trustUpdate && newGameState.manager) {
            const trust = { ...newGameState.manager.trust };
            if (effect.trustUpdate.board) trust.board = Math.max(0, Math.min(100, trust.board + effect.trustUpdate.board));
            if (effect.trustUpdate.fans) trust.fans = Math.max(0, Math.min(100, trust.fans + effect.trustUpdate.fans));
            if (effect.trustUpdate.players) trust.players = Math.max(0, Math.min(100, trust.players + effect.trustUpdate.players));
            if (effect.trustUpdate.referees) trust.referees = Math.max(0, Math.min(100, trust.referees + effect.trustUpdate.referees));
            if (effect.trustUpdate.media) trust.media = Math.max(0, Math.min(100, (trust.media || 50) + effect.trustUpdate.media));
            newGameState.manager = { ...newGameState.manager, trust };
        }
        newGameState.teams = newGameState.teams.map(t => t.id === myTeam.id ? myTeam : t);
        setGameState(newGameState);
        navigateTo('home');
        setMatchResultData(null);
    };

    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    const injuredBadgeCount = myTeam ? myTeam.players.filter(p => p.injury && p.injury.daysRemaining > 0).length - gameState.lastSeenInjuryCount : 0;

    return {
        gameState, setGameState, viewHistory, historyIndex, currentView,
        selectedPlayerForDetail, setSelectedPlayerForDetail, selectedTeamForDetail, setSelectedTeamForDetail,
        matchResultData, setMatchResultData, selectedFixtureForDetail, setSelectedFixtureForDetail,
        selectedFixtureInfo, setSelectedFixtureInfo, gameOverReason, theme, toggleTheme,
        navigateTo, goBack, goForward, handleStart, handleSelectTeam, handleSave, handleNewGame,
        handleNextWeek: handleNextDay, handleTrain, handleMatchFinish, handleFastSimulate,
        handleShowTeamDetail, handleShowPlayerDetail, handleBuyPlayer, handleSellPlayer, handleMessageReply,
        handleInterviewComplete, handleSkipInterview, handleRetire, handleTerminateContract,
        myTeam, injuredBadgeCount: Math.max(0, injuredBadgeCount),
        isTransferWindowOpen: isTransferWindowOpen(gameState.currentDate)
    };
};
