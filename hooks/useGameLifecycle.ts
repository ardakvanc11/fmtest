
import { useEffect } from 'react';
import { GameState } from '../types';
import { initializeTeams } from '../data/teamConstants';
import { GAME_CALENDAR } from '../data/gameConstants';
import { generateFixtures, generateTransferMarket, generateWeeklyNews } from '../utils/gameEngine';
import { calculateManagerSalary } from '../utils/teamCalculations';
import { processNextDayLogic } from '../utils/gameStateLogic';
import { INITIAL_MESSAGES } from '../data/messagePool';

export const useGameLifecycle = (
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    navigation: any,
    coreSetters: any
) => {
    // Timer Logic
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
    }, [gameState.isGameStarted, setGameState]);

    // Load Game Logic
    useEffect(() => {
        const saved = localStorage.getItem('sthl_save_v3_daily');
        if(saved) {
            try {
                const parsed = JSON.parse(saved);
                // Basic migration checks
                if (typeof parsed.playTime === 'undefined') parsed.playTime = 0;
                if (typeof parsed.lastSeenInjuryCount === 'undefined') parsed.lastSeenInjuryCount = 0;
                if (!parsed.currentDate) parsed.currentDate = GAME_CALENDAR.START_DATE.toISOString();
                if (!parsed.pendingTransfers) parsed.pendingTransfers = [];
                if (!parsed.incomingOffers) parsed.incomingOffers = [];
                if (!parsed.seasonChampion) parsed.seasonChampion = null;
                
                // Manager Stats Checks
                if (parsed.manager && parsed.manager.stats) {
                    if (typeof parsed.manager.stats.leagueTitles === 'undefined') parsed.manager.stats.leagueTitles = 0;
                    if (typeof parsed.manager.stats.domesticCups === 'undefined') parsed.manager.stats.domesticCups = 0;
                    if (typeof parsed.manager.stats.europeanCups === 'undefined') parsed.manager.stats.europeanCups = 0;
                    if (typeof parsed.manager.stats.careerEarnings === 'undefined') parsed.manager.stats.careerEarnings = 0;
                    if (typeof parsed.manager.stats.transferSpendThisMonth === 'undefined') parsed.manager.stats.transferSpendThisMonth = 0;
                    if (typeof parsed.manager.stats.transferIncomeThisMonth === 'undefined') parsed.manager.stats.transferIncomeThisMonth = 0;
                }
                
                // Staff Relations Check
                if (parsed.manager && !parsed.manager.staffRelations) {
                    parsed.manager.staffRelations = [
                        { id: '1', name: 'Ahmet Arslan', role: 'Kulüp Başkanı', value: 50, avatarColor: 'bg-indigo-600' },
                        { id: '2', name: 'Mert Yılmaz', role: 'Yardımcı Antrenör', value: 50, avatarColor: 'bg-emerald-600' },
                        { id: '3', name: 'Caner Kurt', role: 'Sportif Direktör', value: 50, avatarColor: 'bg-blue-600' },
                        { id: '4', name: 'Hüseyin Çelik', role: 'Şef Gözlemci', value: 50, avatarColor: 'bg-amber-600' },
                        { id: '5', name: 'Selim Özer', role: 'Kondisyoner', value: 50, avatarColor: 'bg-rose-600' }
                    ];
                }

                // Financial & Team Checks
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
                    navigation.setViewHistory(['home']);
                    navigation.setHistoryIndex(0);
                }
            } catch(e) { console.error("Save load failed", e); }
        }
    }, []);

    const handleStart = (name: string, year: string, country: string) => {
        const teams = initializeTeams();
        const fixtures = generateFixtures(teams, 2025); 
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
                staffRelations: [
                    { id: '1', name: 'Ahmet Arslan', role: 'Kulüp Başkanı', value: 50, avatarColor: 'bg-indigo-600' },
                    { id: '2', name: 'Mert Yılmaz', role: 'Yardımcı Antrenör', value: 50, avatarColor: 'bg-emerald-600' },
                    { id: '3', name: 'Caner Kurt', role: 'Sportif Direktör', value: 50, avatarColor: 'bg-blue-600' },
                    { id: '4', name: 'Hüseyin Çelik', role: 'Şef Gözlemci', value: 50, avatarColor: 'bg-amber-600' },
                    { id: '5', name: 'Selim Özer', role: 'Kondisyoner', value: 50, avatarColor: 'bg-rose-600' }
                ],
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
        navigation.navigateTo('team_select');
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
        navigation.setViewHistory(['home']);
        navigation.setHistoryIndex(0);
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
        
        // Reset Selection States via coreSetters
        coreSetters.setSelectedPlayerForDetail(null);
        coreSetters.setSelectedTeamForDetail(null);
        coreSetters.setMatchResultData(null);
        coreSetters.setSelectedFixtureForDetail(null);
        coreSetters.setSelectedFixtureInfo(null);
        coreSetters.setGameOverReason(null);
        
        navigation.setViewHistory(['intro']);
        navigation.setHistoryIndex(0);
    };

    const handleNextDay = () => {
        const result = processNextDayLogic(gameState, (reason) => {
            coreSetters.setGameOverReason(reason);
            navigation.setViewHistory(['game_over']);
            navigation.setHistoryIndex(0);
        });

        if (result) {
            setGameState(prev => {
                const nextState = { ...prev, ...result };
                if (nextState.pendingTransfers && nextState.pendingTransfers.length > 0) {
                    const pending = nextState.pendingTransfers[0];
                    coreSetters.setIncomingTransfer(pending);
                    setTimeout(() => navigation.navigateTo('contract_negotiation'), 100);
                } else {
                    navigation.navigateTo('home');
                }
                return nextState;
            });
        }
    };

    const handleRetire = () => {
        coreSetters.setGameOverReason("Kendi isteğinle emekliye ayrıldın. Futbol dünyası başarılarını asla unutmayacak.");
        navigation.setViewHistory(['game_over']);
        navigation.setHistoryIndex(0);
    };

    const handleTerminateContract = () => {
        coreSetters.setGameOverReason("Sözleşmeni tek taraflı feshettin. Kulüp yönetimi ve taraftarlar bu ani ayrılık karşısında şokta.");
        navigation.setViewHistory(['game_over']);
        navigation.setHistoryIndex(0);
    };

    return {
        handleStart,
        handleSelectTeam,
        handleSave,
        handleNewGame,
        handleNextDay,
        handleRetire,
        handleTerminateContract
    };
};
