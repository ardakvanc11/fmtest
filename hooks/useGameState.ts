import { useState, useEffect } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats, PendingTransfer, SponsorDeal, SeasonChampion, SeasonSummary, IncomingOffer } from '../types';
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
    calculateRatingsFromEvents, 
    determineMVP, 
    recalculateTeamStrength, 
    calculateTransferStrengthImpact, 
    calculateRawTeamStrength,
    calculateManagerSalary,
    generateStarSoldRiotTweets,
    calculatePlayerWage
} from '../utils/gameEngine';
import { addDays, isSameDay } from '../utils/calendarAndFixtures';
import { INITIAL_MESSAGES } from '../data/messagePool';
import { processNextDayLogic } from '../utils/gameStateLogic';

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
        lastSeenInjuryCount: 0,
        pendingTransfers: [],
        incomingOffers: [],
        seasonChampion: null,
        lastSeasonSummary: null
    });
    
    const [viewHistory, setViewHistory] = useState<string[]>(['intro']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const currentView = viewHistory[historyIndex] || 'intro';

    const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<Player | null>(null);
    const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<Team | null>(null);
    const [matchResultData, setMatchResultData] = useState<any>(null);
    const [selectedFixtureForDetail, setSelectedFixtureForDetail] = useState<Fixture | null>(null);
    const [selectedFixtureInfo, setSelectedFixtureInfo] = useState<Fixture | null>(null); 
    const [gameOverReason, setGameOverReason] = useState<string | null>(null);

    const [negotiatingTransferPlayer, setNegotiatingTransferPlayer] = useState<Player | null>(null);
    const [incomingTransfer, setIncomingTransfer] = useState<PendingTransfer | null>(null);

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
                // Uyumluluk kontrolleri
                if (typeof parsed.playTime === 'undefined') parsed.playTime = 0;
                if (typeof parsed.lastSeenInjuryCount === 'undefined') parsed.lastSeenInjuryCount = 0;
                if (!parsed.currentDate) parsed.currentDate = GAME_CALENDAR.START_DATE.toISOString();
                if (!parsed.pendingTransfers) parsed.pendingTransfers = [];
                if (!parsed.incomingOffers) parsed.incomingOffers = [];
                if (!parsed.seasonChampion) parsed.seasonChampion = null;
                if (!parsed.lastSeasonSummary) parsed.lastSeasonSummary = null;
                
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
                        if (!t.transferHistory) t.transferHistory = [];
                        if (!t.sponsors) {
                            t.sponsors = {
                                main: { name: 'HAYVANLAR HOLDING', yearlyValue: 15, expiryYear: 2026 },
                                stadium: { name: t.stadiumName, yearlyValue: 7, expiryYear: 2026 },
                                sleeve: { name: 'Süper Toto', yearlyValue: 3, expiryYear: 2026 }
                            };
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
        const fixtures = generateFixtures(teams, 2025); 
        
        // Rastgele oyuncu sayısı: 5000 ile 6000 arası
        const marketCount = Math.floor(Math.random() * 1001) + 5000;
        const transferList = generateTransferMarket(marketCount, GAME_CALENDAR.START_DATE.toISOString());
        
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
            transferList,
            trainingPerformed: false,
            news,
            playTime: 0,
            lastSeenInjuryCount: 0,
            pendingTransfers: [],
            incomingOffers: [],
            seasonChampion: null,
            lastSeasonSummary: null
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
            news: [], playTime: 0, lastSeenInjuryCount: 0, pendingTransfers: [], incomingOffers: [], seasonChampion: null, lastSeasonSummary: null
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

    const handleTakeEmergencyLoan = (amount: number) => {
        if (!gameState.myTeamId) return;
        
        setGameState(prev => {
            const team = prev.teams.find(t => t.id === prev.myTeamId);
            const manager = prev.manager;
            if (!team || !manager) return prev;

            const debtIncrease = amount + (amount * 0.35);
            const newTrust = { ...manager.trust };
            newTrust.board = Math.max(0, newTrust.board - 10);

            const updatedTeam = {
                ...team,
                budget: team.budget + amount,
                initialDebt: (team.initialDebt || 0) + debtIncrease
            };

            const updatedTeams = prev.teams.map(t => t.id === prev.myTeamId ? updatedTeam : t);
            
            return {
                ...prev,
                teams: updatedTeams,
                manager: { ...manager, trust: newTrust }
            };
        });
        
        alert(`${amount} M€ borç alındı. Toplam geri ödeme (Faiz Dahil): ${ (amount * 1.35).toFixed(1) } M€.\nYönetim güveni sarsıldı (-10).`);
    };

    const handleNextDay = () => {
        const result = processNextDayLogic(gameState, (reason) => {
            setGameOverReason(reason);
            setViewHistory(['game_over']);
            setHistoryIndex(0);
        });

        if (result) {
            setGameState(prev => {
                const nextState = { ...prev, ...result };
                if (nextState.pendingTransfers && nextState.pendingTransfers.length > 0) {
                    const pending = nextState.pendingTransfers[0];
                    setIncomingTransfer(pending);
                    setTimeout(() => navigateTo('contract_negotiation'), 100);
                } else {
                    navigateTo('home');
                }
                return nextState;
            });
        }
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
        
        // Income/Expense from Match
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
        
        if (updatedManager.trust.board < 30) {
             setGameOverReason("Yönetim kurulu acil toplantısı sonrası görevine son verildi. Gerekçe: Başarısız sonuçlar ve güven kaybı.");
             setViewHistory(['game_over']);
             setHistoryIndex(0);
        } else if (updatedManager.trust.fans < 35) {
             setGameOverReason("Taraftar baskısı dayanılmaz hale geldi. Yönetim, taraftarların isteği üzerine sözleşmeni feshetti.");
             setViewHistory(['game_over']);
             setHistoryIndex(0);
        }

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
            updatedTeam = recalculateTeamStrength(updatedTeam);
            
            const updatedManager = { ...gameState.manager! };
            updatedManager.stats.moneySpent += player.value;
            updatedManager.stats.transferSpendThisMonth += player.value;
            updatedManager.stats.playersBought++;
            if (player.value > updatedManager.stats.recordTransferFee) updatedManager.stats.recordTransferFee = player.value;
            
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

    const handleReleasePlayer = (player: Player, cost: number) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        
        if (cost > 0 && myTeam.budget < cost) {
            alert(`Yetersiz Bütçe!\n\nBu oyuncuyu serbest bırakmak için ${cost.toFixed(2)} M€ tazminat ödemeniz gerekiyor ancak kasanızda ${myTeam.budget.toFixed(2)} M€ var.`);
            return;
        }

        const financials = { ...myTeam.financialRecords };
        if (cost > 0) {
            financials.expense.transfers += cost;
        }

        let updatedTeam = { 
            ...myTeam, 
            budget: myTeam.budget - cost, 
            players: myTeam.players.filter(p => p.id !== player.id), 
            financialRecords: financials 
        };

        const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, false);
        const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
        updatedTeam.strength = Number(newVisibleStrength.toFixed(1));
        updatedTeam = recalculateTeamStrength(updatedTeam);

        const dateObj = new Date(gameState.currentDate);
        const record: any = {
            date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
            playerName: player.name,
            type: 'SOLD',
            counterparty: 'Serbest',
            price: cost > 0 ? `-${cost.toFixed(1)} M€ (Fesih)` : 'Bedelsiz (Fesih)'
        };
        updatedTeam.transferHistory = [...(updatedTeam.transferHistory || []), record];

        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t)
        }));

        if (cost > 0) {
            alert(`${player.name} serbest bırakıldı. Tazminat ödendi: ${cost.toFixed(2)} M€`);
        } else {
            alert(`${player.name} ile yollar ayrıldı.`);
        }
        
        goBack(); 
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
        updatedTeam = recalculateTeamStrength(updatedTeam);
        
        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.moneyEarned += player.value;
        updatedManager.stats.transferIncomeThisMonth += player.value;
        updatedManager.stats.playersSold++;
        
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

    const handleAcceptOffer = (offer: IncomingOffer) => {
        // Find actual player
        const player = gameState.teams.find(t => t.id === gameState.myTeamId)?.players.find(p => p.id === offer.playerId);
        if (player) {
            // Re-use logic but force the specific amount
            const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
            const financials = { ...myTeam.financialRecords };
            financials.income.transfers += offer.amount;
            let updatedTeam = { 
                ...myTeam, 
                budget: myTeam.budget + offer.amount, 
                players: myTeam.players.filter(p => p.id !== player.id), 
                financialRecords: financials 
            };
            const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, false);
            const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
            updatedTeam.strength = Number(newVisibleStrength.toFixed(1));
            updatedTeam = recalculateTeamStrength(updatedTeam);
            
            const updatedManager = { ...gameState.manager! };
            updatedManager.stats.moneyEarned += offer.amount;
            updatedManager.stats.transferIncomeThisMonth += offer.amount;
            updatedManager.stats.playersSold++;
            
            const dateObj = new Date(gameState.currentDate);
            const record: any = {
                date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
                playerName: player.name,
                type: 'SOLD',
                counterparty: offer.fromTeamName,
                price: `${offer.amount.toFixed(1)} M€`
            };
            updatedTeam.transferHistory = [...(updatedTeam.transferHistory || []), record];

            // Remove offer from list using PREV STATE to avoid issues
            setGameState(prev => {
                const remainingOffers = prev.incomingOffers.filter(o => o.id !== offer.id);
                return { 
                    ...prev, 
                    teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t), 
                    manager: updatedManager,
                    incomingOffers: remainingOffers 
                };
            });
            
            alert(`${player.name}, ${offer.fromTeamName} takımına satıldı! Gelir: ${offer.amount} M€`);
        }
    };

    const handleRejectOffer = (offer: IncomingOffer) => {
        setGameState(prev => {
            const remainingOffers = prev.incomingOffers.filter(o => o.id !== offer.id);
            return { ...prev, incomingOffers: remainingOffers };
        });
        // Optional: reduce morale if player wanted to leave
    };

    const handleTransferOfferSuccess = (player: Player, agreedFee: number) => {
        if (!gameState.myTeamId) return;
        
        const pending: PendingTransfer = {
            playerId: player.id,
            sourceTeamId: player.teamId,
            agreedFee: agreedFee,
            date: gameState.currentDate
        };

        setGameState(prev => ({
            ...prev,
            pendingTransfers: [...prev.pendingTransfers, pending]
        }));
        
        setNegotiatingTransferPlayer(null);
        alert("Teklif KABUL EDİLDİ!\n\nKulüp ile bonservis konusunda anlaştınız. Oyuncu, bir sonraki gün sözleşme görüşmeleri için kulübe gelecek.");
    };

    const handleCancelTransfer = (playerId: string) => {
        const remainingPending = gameState.pendingTransfers.filter(pt => pt.playerId !== playerId);
        setGameState(prev => ({
            ...prev,
            pendingTransfers: remainingPending
        }));
        
        if (incomingTransfer && incomingTransfer.playerId === playerId) {
            if (remainingPending.length > 0) {
                setIncomingTransfer(remainingPending[0]);
            } else {
                setIncomingTransfer(null);
                navigateTo('home');
            }
        }
    };

    const handleSignPlayer = (player: Player, fee: number, contract: any) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        
        const newBudget = myTeam.budget - fee;
        const oldTeam = gameState.teams.find(t => t.id === player.teamId);
        
        const newPlayer: Player = { 
            ...player, 
            teamId: myTeam.id, 
            jersey: myTeam.jersey,
            squadStatus: contract.role,
            contractExpiry: 2025 + contract.years, 
            wage: contract.wage,
            activePromises: contract.promises
        };
        
        const financials = { ...myTeam.financialRecords };
        financials.expense.transfers += fee;
        
        let updatedMyTeam = { ...myTeam, budget: newBudget, players: [...myTeam.players, newPlayer], financialRecords: financials };
        
        const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, true);
        const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
        updatedMyTeam.strength = Number(newVisibleStrength.toFixed(1));
        updatedMyTeam = recalculateTeamStrength(updatedMyTeam);

        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.moneySpent += fee;
        updatedManager.stats.transferSpendThisMonth += fee;
        updatedManager.stats.playersBought++;
        if (fee > updatedManager.stats.recordTransferFee) updatedManager.stats.recordTransferFee = fee;

        const dateObj = new Date(gameState.currentDate);
        const buyRecord: any = {
            date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
            playerName: newPlayer.name,
            type: 'BOUGHT',
            counterparty: oldTeam ? oldTeam.name : 'Serbest',
            price: `${fee.toFixed(1)} M€`
        };
        updatedMyTeam.transferHistory = [...(updatedMyTeam.transferHistory || []), buyRecord];

        let updatedTeams = gameState.teams.map(t => t.id === myTeam.id ? updatedMyTeam : t);

        // Remove player from OLD team if exists (transfer list logic usually has them in "free_agent" or "foreign")
        // But if we bought from another league team:
        if (oldTeam) {
            let updatedOldTeam = { ...oldTeam, budget: oldTeam.budget + fee, players: oldTeam.players.filter(p => p.id !== player.id) };
            const sellImpact = calculateTransferStrengthImpact(oldTeam.strength, player.skill, false);
            const oldVisibleStrength = Math.min(100, Math.max(0, oldTeam.strength + sellImpact));
            updatedOldTeam.strength = Number(oldVisibleStrength.toFixed(1));
            updatedOldTeam = recalculateTeamStrength(updatedOldTeam);
            
            const sellRecord: any = {
                date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
                playerName: player.name,
                type: 'SOLD',
                counterparty: myTeam.name,
                price: `${fee.toFixed(1)} M€`
            };
            updatedOldTeam.transferHistory = [...(updatedOldTeam.transferHistory || []), sellRecord];
            updatedTeams = updatedTeams.map(t => t.id === oldTeam.id ? updatedOldTeam : t);
        }

        // Also remove from transfer list if they were there (free agents are primarily there)
        const updatedTransferList = gameState.transferList.filter(p => p.id !== player.id);

        const remainingPending = gameState.pendingTransfers.filter(pt => pt.playerId !== player.id);

        setGameState(prev => ({ 
            ...prev, 
            teams: updatedTeams, 
            transferList: updatedTransferList, // Update list
            manager: updatedManager,
            pendingTransfers: remainingPending
        }));
        
        alert(`${player.name} resmen takımda!`);

        if (remainingPending.length > 0) {
            setIncomingTransfer(remainingPending[0]);
        } else {
            setIncomingTransfer(null);
            navigateTo('home');
        }
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

    const handlePlayerInteraction = (playerId: string, type: 'POSITIVE' | 'NEGATIVE' | 'HOSTILE') => {
        setGameState(prev => {
            if (!prev.manager) return prev;
            
            const newManager = { ...prev.manager };
            if (!newManager.playerRelations) newManager.playerRelations = [];
            
            let relationIndex = newManager.playerRelations.findIndex(r => r.playerId === playerId);
            let relationValue = 50; 
            
            if (relationIndex !== -1) {
                relationValue = newManager.playerRelations[relationIndex].value;
            }

            let change = 0;
            if (type === 'POSITIVE') change = 10;
            else if (type === 'NEGATIVE') change = -15;
            else if (type === 'HOSTILE') change = -50;

            relationValue = Math.max(0, Math.min(100, relationValue + change));

            const team = prev.teams.find(t => t.id === prev.myTeamId);
            const player = team?.players.find(p => p.id === playerId);
            const playerName = player?.name || 'Oyuncu';

            if (relationIndex !== -1) {
                newManager.playerRelations[relationIndex] = { ...newManager.playerRelations[relationIndex], value: relationValue };
            } else {
                newManager.playerRelations.push({ playerId, name: playerName, value: relationValue });
            }

            const updatedTeams = prev.teams.map(t => {
                if (t.id === prev.myTeamId) {
                    return {
                        ...t,
                        players: t.players.map(p => {
                            if (p.id === playerId) {
                                let moraleDrop = type === 'POSITIVE' ? 5 : (type === 'HOSTILE' ? -30 : -10);
                                return { ...p, morale: Math.max(0, Math.min(100, p.morale + moraleDrop)) };
                            }
                            return p;
                        })
                    };
                }
                return t;
            });

            return { ...prev, manager: newManager, teams: updatedTeams };
        });
    };

    const handlePlayerUpdate = (playerId: string, updates: Partial<Player>) => {
        if (updates.activePromises && updates.nextNegotiationWeek === undefined) {
            updates.nextNegotiationWeek = gameState.currentWeek + 24; 
        }

        setGameState(prev => {
            let playerRef: Player | undefined;

            const updatedTeams = prev.teams.map(t => {
                if (t.players.some(p => p.id === playerId)) {
                    return {
                        ...t,
                        players: t.players.map(p => {
                            if (p.id === playerId) {
                                const updatedPlayer = { 
                                    ...p, 
                                    ...updates,
                                    nextNegotiationWeek: updates.activePromises ? prev.currentWeek + 24 : (updates.nextNegotiationWeek !== undefined ? updates.nextNegotiationWeek : p.nextNegotiationWeek)
                                };
                                
                                playerRef = updatedPlayer;

                                if (selectedPlayerForDetail?.id === playerId) {
                                    setSelectedPlayerForDetail(updatedPlayer);
                                }
                                return updatedPlayer;
                            }
                            return p;
                        })
                    };
                }
                return t;
            });

            // Handle Transfer List Sync if 'transferListed' changed
            let updatedTransferList = [...prev.transferList];

            // If player is ALREADY in the transfer list (e.g. they are a free agent we are negotiating with), update them there too
            updatedTransferList = updatedTransferList.map(p => {
                if (p.id === playerId) {
                     const updatedPlayer = { 
                        ...p, 
                        ...updates,
                        nextNegotiationWeek: updates.activePromises ? prev.currentWeek + 24 : (updates.nextNegotiationWeek !== undefined ? updates.nextNegotiationWeek : p.nextNegotiationWeek)
                    };
                    
                    if (selectedPlayerForDetail?.id === playerId) {
                        setSelectedPlayerForDetail(updatedPlayer);
                    }
                    return updatedPlayer;
                }
                return p;
            });

            // Specific Logic for "Add to Transfer List" toggle from user team
            if (updates.transferListed !== undefined && playerRef) {
                if (updates.transferListed) {
                    // Add if not already present
                    if (!updatedTransferList.some(p => p.id === playerId)) {
                        updatedTransferList.push(playerRef);
                    }
                } else {
                    // Remove
                    updatedTransferList = updatedTransferList.filter(p => p.id !== playerId);
                }
            }

            return { ...prev, teams: updatedTeams, transferList: updatedTransferList };
        });
    };

    const handleUpdateSponsor = (type: 'main' | 'stadium' | 'sleeve', deal: SponsorDeal) => {
        if (!gameState.myTeamId) return;
        
        setGameState(prev => {
            const updatedTeams = prev.teams.map(t => {
                if (t.id === prev.myTeamId) {
                    return {
                        ...t,
                        sponsors: {
                            ...t.sponsors,
                            [type]: deal
                        }
                    };
                }
                return t;
            });
            return { ...prev, teams: updatedTeams };
        });
        
        alert(`Sponsor anlaşması güncellendi!\nYeni ${type === 'main' ? 'Ana' : type === 'stadium' ? 'Stadyum' : 'Kol'} Sponsoru: ${deal.name}`);
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
        handleInterviewComplete, handleSkipInterview, handleRetire, handleTerminateContract, handlePlayerInteraction,
        handlePlayerUpdate, handleReleasePlayer, handleTransferOfferSuccess, handleSignPlayer, handleCancelTransfer,
        handleUpdateSponsor, handleTakeEmergencyLoan, handleAcceptOffer, handleRejectOffer,
        negotiatingTransferPlayer, setNegotiatingTransferPlayer,
        incomingTransfer, setIncomingTransfer,
        myTeam, injuredBadgeCount: Math.max(0, injuredBadgeCount),
        isTransferWindowOpen: isTransferWindowOpen(gameState.currentDate)
    };
};