
import { useState, useEffect } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats, Position, Message } from '../types';
import { initializeTeams, RIVALRIES } from '../constants';
import { 
    simulateMatchInstant, 
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
    generateResignationTweets 
} from '../utils/gameEngine';
import { INITIAL_MESSAGES } from '../data/messagePool';

export const useGameState = () => {
    const [gameState, setGameState] = useState<GameState>({
        managerName: null,
        manager: null,
        myTeamId: null,
        currentWeek: 1,
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
    const [gameOverReason, setGameOverReason] = useState<string | null>(null);

    // Theme State
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Navigation Functions
    const navigateTo = (view: string) => {
        if (view === currentView) return;

        // NEW: Clear injury notification when visiting health center
        if (view === 'health_center') {
            const t = gameState.teams.find(t => t.id === gameState.myTeamId);
            const currentInjured = t ? t.players.filter(p => p.injury && p.injury.weeksRemaining > 0).length : 0;
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

    // PLAY TIME TRACKER
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
        const saved = localStorage.getItem('sthl_save_v2');
        if(saved) {
            try {
                const parsed = JSON.parse(saved);
                if (typeof parsed.playTime === 'undefined') parsed.playTime = 0;
                if (typeof parsed.lastSeenInjuryCount === 'undefined') parsed.lastSeenInjuryCount = 0;
                
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

    const checkWarnings = (currentManager: any): Message[] => {
        const newMessages: Message[] = [];
        if (currentManager.trust.board < 35) {
            const warningMsg: Message = {
                id: Date.now() + Math.random(),
                sender: 'Başkan',
                subject: 'ACİL DURUM: Son Uyarı',
                preview: 'Hocam, yönetim kurulunun sabrı taşıyor. Acil toparlanmamız lazım.',
                date: 'Bugün',
                read: false,
                avatarColor: 'bg-red-700',
                history: [
                    { id: Date.now(), text: 'Sayın hocam, yönetim kurulundaki son toplantıda krediniz ciddi şekilde tartışıldı. Eğer sonuçlar ve oyun düzelmezse yolları ayırmak zorunda kalacağız. Lütfen bunu son ikaz olarak alın.', time: '09:00', isMe: false }
                ],
                options: [
                    "Mesaj alındı başkanım, her şeyi düzelteceğim.",
                    "Bu baskı altında çalışamam, takımı rahat bırakın.",
                    "Kadro yetersiz, elimden geleni yapıyorum."
                ]
            };
            newMessages.push(warningMsg);
        }
        return newMessages;
    }

    const handleStart = (name: string, year: string, country: string) => {
        const teams = initializeTeams();
        const fixtures = generateFixtures(teams);
        const transferList = generateTransferMarket(10, 1);
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
                stats: { matchesManaged: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, trophies: 0, playersBought: 0, playersSold: 0, moneySpent: 0, moneyEarned: 0, recordTransferFee: 0 },
                contract: { salary: 1.5, expires: 2028, teamName: '' },
                trust: { board: 50, fans: 50, players: 50, referees: 50 },
                playerRelations: [],
                history: []
            },
            myTeamId: null,
            currentWeek: 1,
            teams,
            fixtures,
            messages: INITIAL_MESSAGES,
            isGameStarted: false,
            transferList,
            trainingPerformed: false,
            news,
            playTime: 0,
            lastSeenInjuryCount: 0
        };
        setGameState(newState);
        navigateTo('team_select');
    };

    const handleSelectTeam = (id: string) => {
        setGameState(prev => ({
            ...prev,
            myTeamId: id,
            isGameStarted: true,
            manager: prev.manager ? { ...prev.manager, contract: { ...prev.manager.contract, teamName: prev.teams.find(t => t.id === id)?.name || '' } } : null
        }));
        setViewHistory(['home']);
        setHistoryIndex(0);
    };
    
    const handleSave = () => {
        localStorage.setItem('sthl_save_v2', JSON.stringify(gameState));
    };

    const handleNewGame = () => {
        localStorage.removeItem('sthl_save_v2');
        
        setGameState({
            managerName: null,
            manager: null,
            myTeamId: null,
            currentWeek: 1,
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
        
        setSelectedPlayerForDetail(null);
        setSelectedTeamForDetail(null);
        setMatchResultData(null);
        setSelectedFixtureForDetail(null);
        setGameOverReason(null);
        
        setViewHistory(['intro']);
        setHistoryIndex(0);
    };

    const handleNextWeek = () => {
        let updatedTeams = [...gameState.teams];
        let updatedFixtures = [...gameState.fixtures];
        
        const weekMatches = updatedFixtures.filter(f => f.week === gameState.currentWeek && !f.played);
        weekMatches.forEach(match => {
             const h = updatedTeams.find(t => t.id === match.homeTeamId)!;
             const a = updatedTeams.find(t => t.id === match.awayTeamId)!;
             const res = simulateMatchInstant(h, a);
             
             const idx = updatedFixtures.findIndex(f => f.id === match.id);
             if(idx >= 0) {
                 updatedFixtures[idx] = { ...match, played: true, homeScore: res.homeScore, awayScore: res.awayScore, stats: res.stats };
             }
        });
        
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
             const newStats = { played, won, drawn, lost, gf, ga, points };
             return { ...team, stats: newStats };
        });

        const matchNews = generateWeeklyNews(gameState.currentWeek, updatedFixtures, updatedTeams, gameState.myTeamId);

        const nextWeek = gameState.currentWeek + 1;
        const newTransferList = isTransferWindowOpen(nextWeek) ? generateTransferMarket(10, nextWeek) : [];
        
        updatedTeams = updatedTeams.map(t => ({
            ...t,
            players: t.players.map(p => {
                const newP = { ...p };
                if (newP.suspendedUntilWeek && newP.suspendedUntilWeek <= nextWeek) {
                    newP.suspendedUntilWeek = undefined;
                }
                return newP;
            })
        }));

        const updatedMyTeam = updatedTeams.find(t => t.id === gameState.myTeamId);
        const playerMessages = (gameState.myTeamId && updatedMyTeam) ? generatePlayerMessages(nextWeek, updatedMyTeam, updatedFixtures) : [];

        let specialNews: any[] = [];
        let specialMessages: Message[] = [];

        if (gameState.manager) {
            if (gameState.manager.trust.fans < 40 && updatedMyTeam) {
                const resignationTweets = generateResignationTweets(nextWeek, updatedMyTeam);
                specialNews = [...resignationTweets];
            }
            const warningMessages = checkWarnings(gameState.manager);
            specialMessages = [...warningMessages];
        }

        const allNews = [...specialNews, ...matchNews, ...gameState.news];
        const retentionThreshold = nextWeek - 2;
        const filteredNews = allNews.filter(n => n.week > retentionThreshold);

        setGameState(prev => ({
            ...prev,
            currentWeek: nextWeek,
            teams: updatedTeams,
            fixtures: updatedFixtures,
            news: filteredNews,
            transferList: isTransferWindowOpen(nextWeek) ? newTransferList : [],
            trainingPerformed: false,
            messages: [...specialMessages, ...playerMessages, ...prev.messages],
        }));
        
        navigateTo('home');
    };

    const handleTrain = (type: 'ATTACK' | 'DEFENSE' | 'PHYSICAL') => {
        if(gameState.trainingPerformed) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const trainedTeam = applyTraining(myTeam, type);
        
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === trainedTeam.id ? trainedTeam : t),
            trainingPerformed: true
        }));
    };

    const handleMatchFinish = async (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats) => {
        const fixtureIdx = gameState.fixtures.findIndex(f => 
            f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId)
        );
        const myTeamId = gameState.myTeamId!;
        const currentFixture = gameState.fixtures[fixtureIdx];
        const isHome = currentFixture.homeTeamId === myTeamId;
        const opponentId = isHome ? currentFixture.awayTeamId : currentFixture.homeTeamId;
        const opponent = gameState.teams.find(t => t.id === opponentId)!;
        const homeTeam = isHome ? gameState.teams.find(t => t.id === myTeamId)! : opponent;
        const awayTeam = isHome ? opponent : gameState.teams.find(t => t.id === myTeamId)!;
        const myTeam = isHome ? homeTeam : awayTeam;

        const myScore = isHome ? hScore : aScore;
        const oppScore = isHome ? aScore : hScore;
        let res: 'WIN'|'DRAW'|'LOSS' = 'DRAW';
        if(myScore > oppScore) res = 'WIN';
        if(myScore < oppScore) res = 'LOSS';
        
        const { homeRatings, awayRatings } = calculateRatingsFromEvents(homeTeam, awayTeam, events, hScore, aScore);
        const mvpInfo = determineMVP(homeRatings, awayRatings);

        const updatedStats: MatchStats = { 
            ...stats,
            homeRatings,
            awayRatings,
            mvpPlayerId: mvpInfo.id,
            mvpPlayerName: mvpInfo.name
        };

        const updatedFixtures = [...gameState.fixtures];
        const completedFixture = { 
            ...updatedFixtures[fixtureIdx], 
            played: true, 
            homeScore: hScore, 
            awayScore: aScore,
            matchEvents: events,
            stats: updatedStats
        };
        updatedFixtures[fixtureIdx] = completedFixture;
        
        const processedTeams = processMatchPostGame(gameState.teams, events, gameState.currentWeek, updatedFixtures);

        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.matchesManaged++;
        updatedManager.stats.goalsFor += myScore;
        updatedManager.stats.goalsAgainst += oppScore;
        
        const pastMatchesForStreak = updatedFixtures
            .filter(f => f.played && f.week <= gameState.currentWeek && (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId))
            .sort((a, b) => b.week - a.week);

        let currentLossStreak = 0;
        for (const f of pastMatchesForStreak) {
             const isH = f.homeTeamId === myTeamId;
             const mS = isH ? f.homeScore! : f.awayScore!;
             const oS = isH ? f.awayScore! : f.homeScore!;
             if (mS < oS) currentLossStreak++;
             else break;
        }

        const currentStrength = calculateTeamStrength(myTeam);
        const opponentStrength = calculateTeamStrength(opponent);
        const isUnderdogBonus = currentStrength < 80 && opponentStrength >= 80;
        const isDerby = RIVALRIES.some(pair => pair.includes(myTeam.name) && pair.includes(opponent.name));
        const goalDiff = myScore - oppScore;
        
        let fanTrustChange = 0;

        if (res === 'WIN') {
            if (isUnderdogBonus) {
                 updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 4);
            } else {
                 updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 2);
            }
        } else if (res === 'DRAW') {
            if (isUnderdogBonus) {
                updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 2);
            } else if (currentStrength < 80) {
                updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 0);
            } else {
                updatedManager.trust.board = Math.max(0, updatedManager.trust.board - 1);
            }
        } else if (res === 'LOSS') {
            if (currentStrength < 80) {
                let penalty = 2;
                if (currentLossStreak >= 5) penalty = 4;
                updatedManager.trust.board = Math.max(0, updatedManager.trust.board - penalty);
            } else {
                let lossPenalty = 3; 
                if (goalDiff <= -3) lossPenalty = 5;
                updatedManager.trust.board = Math.max(0, updatedManager.trust.board - lossPenalty);
            }
        }

        if (isDerby) {
            if (res === 'WIN') {
                if (goalDiff >= 4) fanTrustChange += 10;
                else fanTrustChange += 5;
            } else if (res === 'DRAW') {
                fanTrustChange += -4; 
            } else if (res === 'LOSS') {
                if (currentStrength < 80) {
                     let penalty = 2;
                     if (currentLossStreak >= 5) penalty = 4;
                     fanTrustChange -= penalty;
                } else {
                    fanTrustChange += -10;
                    if (goalDiff <= -3) fanTrustChange += -5;
                }
            }
        } else {
            if (res === 'WIN') {
                if (isUnderdogBonus) {
                    fanTrustChange += 4;
                } else {
                    fanTrustChange += 3;
                }
            } else if (res === 'DRAW') {
                if (isUnderdogBonus) {
                    fanTrustChange += 2;
                } else if (currentStrength >= 80) {
                    fanTrustChange += -3;
                } else {
                    fanTrustChange += -1;
                }
            } else if (res === 'LOSS') {
                if (currentStrength < 80) {
                     let penalty = 2;
                     if (currentLossStreak >= 5) penalty = 4;
                     fanTrustChange -= penalty;
                } else {
                    fanTrustChange += -5;
                }
            }
        }

        let streakDrawCount = 0;
        for(let i=0; i<3; i++) {
            const f = pastMatchesForStreak[i]; 
            if (!f) break;
            const isH = f.homeTeamId === myTeamId;
            const mS = isH ? f.homeScore! : f.awayScore!;
            const oS = isH ? f.awayScore! : f.homeScore!;
            
            if (mS === oS) streakDrawCount++;
            else break;
        }
        
        if (streakDrawCount >= 3) fanTrustChange += -3;

        updatedManager.trust.fans = Math.max(0, Math.min(100, updatedManager.trust.fans + fanTrustChange));

        if (res === 'WIN') {
            updatedManager.stats.wins++;
            updatedManager.trust.players = Math.min(100, updatedManager.trust.players + 1);
        } else if (res === 'DRAW') {
            updatedManager.stats.draws++;
        } else if (res === 'LOSS') {
            updatedManager.stats.losses++;
            updatedManager.trust.players = Math.max(0, updatedManager.trust.players - 2);
        }

        let consecutiveWinCount = 0;
        for(let i=0; i<5; i++) {
             const f = pastMatchesForStreak[i];
             if (!f) break;
             const isH = f.homeTeamId === myTeamId;
             if ((isH ? f.homeScore! : f.awayScore!) > (isH ? f.awayScore! : f.homeScore!)) consecutiveWinCount++;
             else break;
        }
        if (consecutiveWinCount === 5) {
            updatedManager.trust.players = Math.min(100, updatedManager.trust.players + 5);
        }

        if (stats.managerCards === 'YELLOW') {
            updatedManager.trust.referees = Math.max(0, updatedManager.trust.referees - 3);
        } else if (stats.managerCards === 'RED') {
            updatedManager.trust.referees = Math.max(0, updatedManager.trust.referees - 6);
        }

        const matchTweets = generateMatchTweets(completedFixture, processedTeams, true);

        if (checkGameOver(updatedManager)) {
            setViewHistory(['game_over']);
            setHistoryIndex(0);
        }

        setGameState(prev => ({
            ...prev,
            fixtures: updatedFixtures,
            teams: processedTeams,
            manager: updatedManager,
            news: [...matchTweets, ...prev.news]
        }));
        
        setMatchResultData({
             homeTeam: homeTeam,
             awayTeam: awayTeam,
             homeScore: hScore,
             awayScore: aScore,
             stats: updatedStats,
             events: events
        });

        const newHistory = viewHistory.slice(0, historyIndex);
        newHistory.push('match_result');
        setViewHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleFastSimulate = () => {
        const fixtureIdx = gameState.fixtures.findIndex(f => 
            f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId)
        );
        if (fixtureIdx === -1 || !gameState.myTeamId) return;

        const currentFixture = gameState.fixtures[fixtureIdx];
        const homeTeam = gameState.teams.find(t => t.id === currentFixture.homeTeamId)!;
        const awayTeam = gameState.teams.find(t => t.id === currentFixture.awayTeamId)!;

        const { homeScore, awayScore, stats } = simulateMatchInstant(homeTeam, awayTeam);

        const events: MatchEvent[] = [];
        
        const generateGoalEvents = (team: Team, count: number) => {
            const xi = team.players.slice(0, 11);
            const scorers = [
                ...xi.filter(p => [Position.SNT, Position.SLK, Position.SGK].includes(p.position)), 
                ...xi.filter(p => [Position.OS, Position.OOS].includes(p.position)), 
                ...xi
            ];
            
            for(let i=0; i<count; i++) {
                const scorer = scorers[Math.floor(Math.random() * scorers.length)];
                let assist = xi[Math.floor(Math.random() * xi.length)];
                if(assist.id === scorer.id) assist = xi.find(p => p.id !== scorer.id) || assist;
                
                const isPenalty = Math.random() < 0.15;
                const description = isPenalty ? `GOL! ${scorer.name} (Penaltı)` : `GOL! ${scorer.name}`;
                const assistName = isPenalty ? 'Penaltı' : assist.name;

                events.push({
                    minute: Math.floor(Math.random() * 90) + 1,
                    type: 'GOAL',
                    description: description,
                    teamName: team.name,
                    scorer: scorer.name,
                    assist: assistName
                });
            }
        };

        const generateCardEvents = (team: Team, yellowCount: number, redCount: number) => {
            const xi = team.players.slice(0, 11);
            for(let i=0; i<yellowCount; i++) {
                 const player = xi[Math.floor(Math.random() * xi.length)];
                 events.push({
                    minute: Math.floor(Math.random() * 90) + 1,
                    type: 'CARD_YELLOW',
                    description: `${player.name} sarı kart gördü.`,
                    teamName: team.name,
                    playerId: player.id
                });
            }
            for(let i=0; i<redCount; i++) {
                 const player = xi[Math.floor(Math.random() * xi.length)];
                 const isSecondYellow = Math.random() > 0.5;
                 events.push({
                    minute: Math.floor(Math.random() * 90) + 1,
                    type: 'CARD_RED',
                    description: isSecondYellow ? `${player.name} (2. Sarıdan Kırmızı)` : `${player.name} (Kırmızı Kart)`,
                    teamName: team.name,
                    playerId: player.id
                });
            }
        };

        const generateSubEvents = (team: Team) => {
            const subCount = Math.floor(Math.random() * 3) + 3; 
            const xi = team.players.slice(0, 11);
            const bench = team.players.slice(11);
            const actualSubs = Math.min(subCount, bench.length);

            for(let i=0; i<actualSubs; i++) {
                const minute = 45 + Math.floor(Math.random() * 45); 
                const outP = xi[i]; 
                const inP = bench[i];
                
                if (outP && inP) {
                    events.push({
                        minute,
                        type: 'SUBSTITUTION',
                        description: `${outP.name} 🔄 ${inP.name}`,
                        teamName: team.name,
                    });
                }
            }
        };

        generateGoalEvents(homeTeam, homeScore);
        generateGoalEvents(awayTeam, awayScore);
        generateCardEvents(homeTeam, stats.homeYellowCards, stats.homeRedCards);
        generateCardEvents(awayTeam, stats.awayYellowCards, stats.awayRedCards);
        generateSubEvents(homeTeam);
        generateSubEvents(awayTeam);

        events.sort((a,b) => a.minute - b.minute);

        handleMatchFinish(homeScore, awayScore, events, stats);
    };

    const handleShowTeamDetail = (teamId: string) => {
        const t = gameState.teams.find(x => x.id === teamId);
        if (t) {
            setSelectedTeamForDetail(t);
            navigateTo('team_detail');
        }
    };

    const handleBuyPlayer = (player: Player) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        
        if (myTeam.budget >= player.value) {
            const newTransferList = gameState.transferList.filter(p => p.id !== player.id);
            const newPlayer = { ...player, teamId: myTeam.id };
            const updatedTeam = { 
                ...myTeam, 
                budget: myTeam.budget - player.value,
                players: [...myTeam.players, newPlayer]
            };
            const updatedManager = { ...gameState.manager! };
            updatedManager.stats.moneySpent += player.value;
            updatedManager.stats.playersBought++;
            if (player.value > updatedManager.stats.recordTransferFee) {
                updatedManager.stats.recordTransferFee = player.value;
            }

            setGameState(prev => ({
                ...prev,
                transferList: newTransferList,
                teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t),
                manager: updatedManager
            }));
            alert(`${player.name} takımınıza katıldı!`);
        } else {
            alert("Bütçeniz yetersiz!");
        }
    };

    const handleSellPlayer = (player: Player) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        
        if (myTeam.players.length <= 16) {
            alert("Kadro derinliği çok düşük, oyuncu satamazsınız!");
            return;
        }

        const updatedTeam = {
            ...myTeam,
            budget: myTeam.budget + player.value,
            players: myTeam.players.filter(p => p.id !== player.id)
        };

        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.moneyEarned += player.value;
        updatedManager.stats.playersSold++;

        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t),
            manager: updatedManager
        }));
        alert(`${player.name} satıldı! Gelir: ${player.value} M€`);
    };

    const handleMessageReply = (msgId: number, optIndex: number) => {
        // Placeholder for message reply logic if needed
    };

    const handleInterviewComplete = (effect: any, relatedPlayerId?: string) => {
        let newGameState = { ...gameState };
        let myTeam = newGameState.teams.find(t => t.id === gameState.myTeamId)!;
        
        if (effect.teamMorale) {
            myTeam = {
                ...myTeam,
                players: myTeam.players.map(p => ({
                    ...p,
                    morale: Math.max(0, Math.min(100, p.morale + effect.teamMorale))
                })),
                morale: Math.max(0, Math.min(100, myTeam.morale + effect.teamMorale))
            };
        }

        if (effect.playerMorale && relatedPlayerId) {
            const pIndex = myTeam.players.findIndex(p => p.id === relatedPlayerId);
            if (pIndex !== -1) {
                const p = myTeam.players[pIndex];
                const newMorale = Math.max(0, Math.min(100, p.morale + effect.playerMorale));
                myTeam.players[pIndex] = { ...p, morale: newMorale };
            }
        }

        if (effect.trustUpdate && newGameState.manager) {
            const trust = { ...newGameState.manager.trust };
            if (effect.trustUpdate.board) trust.board = Math.max(0, Math.min(100, trust.board + effect.trustUpdate.board));
            if (effect.trustUpdate.fans) trust.fans = Math.max(0, Math.min(100, trust.fans + effect.trustUpdate.fans));
            if (effect.trustUpdate.players) trust.players = Math.max(0, Math.min(100, trust.players + effect.trustUpdate.players));
            if (effect.trustUpdate.referees) trust.referees = Math.max(0, Math.min(100, trust.referees + effect.trustUpdate.referees));
            newGameState.manager = { ...newGameState.manager, trust };
        }

        newGameState.teams = newGameState.teams.map(t => t.id === myTeam.id ? myTeam : t);
        setGameState(newGameState);

        navigateTo('home');
        setMatchResultData(null);
    };

    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    const injuredBadgeCount = myTeam ? myTeam.players.filter(p => p.injury && p.injury.weeksRemaining > 0).length - gameState.lastSeenInjuryCount : 0;

    return {
        gameState,
        setGameState,
        viewHistory,
        historyIndex,
        currentView,
        selectedPlayerForDetail,
        setSelectedPlayerForDetail,
        selectedTeamForDetail,
        setSelectedTeamForDetail,
        matchResultData,
        setMatchResultData,
        selectedFixtureForDetail,
        setSelectedFixtureForDetail,
        gameOverReason,
        theme,
        toggleTheme,
        navigateTo,
        goBack,
        goForward,
        handleStart,
        handleSelectTeam,
        handleSave,
        handleNewGame,
        handleNextWeek,
        handleTrain,
        handleMatchFinish,
        handleFastSimulate,
        handleShowTeamDetail,
        handleBuyPlayer,
        handleSellPlayer,
        handleMessageReply,
        handleInterviewComplete,
        myTeam,
        injuredBadgeCount: Math.max(0, injuredBadgeCount),
        isTransferWindowOpen: isTransferWindowOpen(gameState.currentWeek)
    };
};
