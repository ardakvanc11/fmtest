
import React, { useState, useEffect } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats, Position, Mentality, Message } from './types';
import { initializeTeams, RIVALRIES, generateId } from './constants';
import { simulateMatchInstant, generateFixtures, generateTransferMarket, generateWeeklyNews, isTransferWindowOpen, processMatchPostGame, applyTraining, generateMatchTweets, generatePlayerMessages, calculateRatingsFromEvents, determineMVP, calculateTeamStrength, generateResignationTweets } from './utils/gameEngine';
import { INITIAL_MESSAGES } from './data/messagePool';

// Views
import IntroScreen from './views/IntroScreen';
import TeamSelection from './views/TeamSelection';
import HomeView from './views/HomeView';
import SquadView from './views/SquadView';
import TacticsView from './views/TacticsView';
import FixturesView from './views/FixturesView';
import TransferView from './views/TransferView';
import SocialMediaView from './views/SocialMediaView';
import TrainingView from './views/TrainingView';
import TeamDetailView from './views/TeamDetailView';
import MatchPreview from './views/MatchPreview';
import LockerRoomView from './views/LockerRoomView';
import MatchSimulation from './views/MatchSimulation';
import PostMatchInterview from './views/PostMatchInterview';

// Layouts & Modals
import Dashboard from './layout/Dashboard';
import PlayerDetailModal from './modals/PlayerDetailModal';
import MatchDetailModal from './modals/MatchDetailModal';
import MatchResultModal from './modals/MatchResultModal';
import { FileWarning, LogOut } from 'lucide-react';

const App: React.FC = () => {
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
        news: []
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
        const saved = localStorage.getItem('sthl_save_v2');
        if(saved) {
            try {
                const parsed = JSON.parse(saved);
                setGameState(parsed);
                if(parsed.isGameStarted) {
                    // Reset history to home on load if game started
                    setViewHistory(['home']);
                    setHistoryIndex(0);
                }
            } catch(e) { console.error("Save load failed", e); }
        }
    }, []);

    // Check for Game Over conditions
    const checkGameOver = (currentManager: any) => {
        if (!currentManager) return false;

        // Board Trust < 30 -> Fired
        if (currentManager.trust.board < 30) {
            setGameOverReason("Yönetim kurulu acil toplantısı sonrası görevine son verildi. Gerekçe: Başarısız sonuçlar ve güven kaybı.");
            return true;
        }

        // Fan Trust < 35 -> Fired (Pressure)
        if (currentManager.trust.fans < 35) {
            setGameOverReason("Taraftar baskısı dayanılmaz hale geldi. Yönetim, taraftarların isteği üzerine sözleşmeni feshetti.");
            return true;
        }

        return false;
    };

    // Warning System Check
    const checkWarnings = (currentManager: any): Message[] => {
        const newMessages: Message[] = [];

        // Board Warning (Trust < 35)
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
            news
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
        // Reset navigation history when entering main game
        setViewHistory(['home']);
        setHistoryIndex(0);
    };
    
    const handleSave = () => {
        localStorage.setItem('sthl_save_v2', JSON.stringify(gameState));
    };

    const handleNewGame = () => {
        // Direct reset without window.confirm to avoid browser blocking issues
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
            news: []
        });
        
        setSelectedPlayerForDetail(null);
        setSelectedTeamForDetail(null);
        setMatchResultData(null);
        setSelectedFixtureForDetail(null);
        setGameOverReason(null);
        
        // Reset navigation
        setViewHistory(['intro']);
        setHistoryIndex(0);
    };

    const handleNextWeek = () => {
        let updatedTeams = [...gameState.teams];
        let updatedFixtures = [...gameState.fixtures];
        
        // 1. Simulate remaining matches for the CURRENT week
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
        
        // 2. Update standings
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

        // 3. Generate news for the COMPLETED week (simulated results)
        // We pass myTeamId to skip generating duplicate tweets for the user match
        const matchNews = generateWeeklyNews(gameState.currentWeek, updatedFixtures, updatedTeams, gameState.myTeamId);

        // 4. Advance week
        const nextWeek = gameState.currentWeek + 1;
        const newTransferList = isTransferWindowOpen(nextWeek) ? generateTransferMarket(10, nextWeek) : [];
        
        // 5. Player Complaints / Messages
        const updatedMyTeam = updatedTeams.find(t => t.id === gameState.myTeamId);
        // PASS FIXTURES HERE
        const playerMessages = (gameState.myTeamId && updatedMyTeam) ? generatePlayerMessages(nextWeek, updatedMyTeam, updatedFixtures) : [];

        // 6. Special Checks: Fan Resignation Tweets & Board Warning
        let specialNews: any[] = [];
        let specialMessages: Message[] = [];

        if (gameState.manager) {
            // Fan Trust < 40: Generate "Resign" tweets
            if (gameState.manager.trust.fans < 40 && updatedMyTeam) {
                const resignationTweets = generateResignationTweets(nextWeek, updatedMyTeam);
                specialNews = [...resignationTweets];
            }

            // Board Trust < 35: Warning Message
            // We check this every week to keep pressure, but rely on random chance or check if already warned to avoid spamming?
            // For now, let's allow it to regenerate if condition persists, but user handles it.
            // Simplified: Add warning if low.
            const warningMessages = checkWarnings(gameState.manager);
            specialMessages = [...warningMessages];
        }

        // 7. Cleanup & Update State
        // Combine new tweets with existing news
        const allNews = [...specialNews, ...matchNews, ...gameState.news];
        
        // Filter to keep only the last 2 weeks (current finished week and the one before it)
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
            messages: [...specialMessages, ...playerMessages, ...prev.messages], // Prepend new messages
            // manager updates handled in previous steps or remains same
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

        // Get Match Result
        const myScore = isHome ? hScore : aScore;
        const oppScore = isHome ? aScore : hScore;
        let res: 'WIN'|'DRAW'|'LOSS' = 'DRAW';
        if(myScore > oppScore) res = 'WIN';
        if(myScore < oppScore) res = 'LOSS';
        
        // Calculate Accurate Ratings based on Events
        const { homeRatings, awayRatings } = calculateRatingsFromEvents(homeTeam, awayTeam, events, hScore, aScore);
        
        // DETERMINE MVP
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
        
        // Process Post Game (Injuries, Morale, Suspensions)
        const processedTeams = processMatchPostGame(gameState.teams, events, gameState.currentWeek, updatedFixtures);

        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.matchesManaged++;
        updatedManager.stats.goalsFor += myScore;
        updatedManager.stats.goalsAgainst += oppScore;
        
        // --- COMPLEX FAN & BOARD TRUST LOGIC ---
        // 1. Determine Team Strength Tier
        const currentStrength = calculateTeamStrength(myTeam);
        const opponentStrength = calculateTeamStrength(opponent);
        const isHighTier = currentStrength >= 80;
        
        // 2. Determine Derby Status
        const isDerby = RIVALRIES.some(pair => pair.includes(myTeam.name) && pair.includes(opponent.name));
        
        // 3. Analyze Scores
        const goalDiff = myScore - oppScore;
        
        let fanTrustChange = 0;

        // A. Match Result Logic (Fans & Board)
        
        // --- HARDER BOARD TRUST LOGIC ---
        if (res === 'WIN') {
            updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 2);
        } else if (res === 'DRAW') {
            if (currentStrength < 80) {
                // Beraberlik nötr, ödül yok.
                updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 0);
            } else {
                // Güçlü takım berabere kalırsa yönetim mutsuz (-1)
                updatedManager.trust.board = Math.max(0, updatedManager.trust.board - 1);
            }
        } else if (res === 'LOSS') {
            // YENİLGİ CEZASI: Artık tolerans yok. Yenilgi yönetim güvenini sert düşürür.
            // Eskiden -1 veya -2 idi, şimdi standart -3.
            // Eğer fark yendiyse -5.
            let lossPenalty = 3; 
            if (goalDiff <= -3) lossPenalty = 5;
            updatedManager.trust.board = Math.max(0, updatedManager.trust.board - lossPenalty);
        }

        // --- HARDER FAN TRUST LOGIC ---
        if (isDerby) {
            if (res === 'WIN') {
                if (goalDiff >= 4) fanTrustChange += 10;
                else fanTrustChange += 5;
            } else if (res === 'DRAW') {
                fanTrustChange += -4; 
            } else if (res === 'LOSS') {
                // Derby Loss is HUGE
                fanTrustChange += -10;
                if (goalDiff <= -3) fanTrustChange += -5; // Farklı yenilgi
            }
        } else {
            // Normal Match
            if (res === 'WIN') {
                fanTrustChange += 3;
            } else if (res === 'DRAW') {
                // High tier draw penalty
                if (isHighTier) fanTrustChange += -3;
                else fanTrustChange += -1; // Even weak teams lose fan trust on draw
            } else if (res === 'LOSS') {
                // UNDERDOG EXCUSE REMOVED
                // Taraftar güçsüz takım da olsa yenilgiyi kabul etmez.
                if (currentStrength < 80 && opponentStrength > 85) {
                    // Rakip ÇOK güçlüyse biraz az düşer
                    fanTrustChange += -2; 
                } else {
                    // Standart Yenilgi Cezası
                    fanTrustChange += -5;
                }
            }
        }

        // B. Streak Logic
        // Get past matches including current one implicitly by using `updatedFixtures`
        const pastMatchesForStreak = updatedFixtures
            .filter(f => f.played && f.week <= gameState.currentWeek && (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId))
            .sort((a, b) => b.week - a.week); // Descending (Newest first)

        let streakLossCount = 0;
        let streakDrawCount = 0;

        for(let i=0; i<3; i++) {
            const f = pastMatchesForStreak[i]; 
            if (!f) break;
            const isH = f.homeTeamId === myTeamId;
            const mS = isH ? f.homeScore! : f.awayScore!;
            const oS = isH ? f.awayScore! : f.homeScore!;
            
            if (mS < oS) streakLossCount++;
            else if (mS === oS) streakDrawCount++;
            else break;
        }

        // ADDED CONSECUTIVE LOSS PENALTIES
        if (streakLossCount >= 2) {
            fanTrustChange += -5; // Seri mağlubiyet taraftarı çıldırtır
            updatedManager.trust.board = Math.max(0, updatedManager.trust.board - 3); // Yönetim güveni ekstra düşer
        }
        
        if (streakDrawCount >= 3) fanTrustChange += -3;

        // C. League Standing (Leader Logic)
        const tempTeams = processedTeams.map(t => {
             const playedF = updatedFixtures.filter(f => f.played && (f.homeTeamId === t.id || f.awayTeamId === t.id));
             let pts = 0, gf = 0, ga = 0;
             playedF.forEach(f => {
                 const isH = f.homeTeamId === t.id;
                 const s1 = isH ? f.homeScore! : f.awayScore!;
                 const s2 = isH ? f.awayScore! : f.homeScore!;
                 gf += s1; ga += s2;
                 if(s1 > s2) pts+=3; else if(s1===s2) pts+=1;
             });
             return { id: t.id, pts, diff: gf - ga, gf };
        });
        tempTeams.sort((a,b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            return b.diff - a.diff;
        });
        if (tempTeams[0].id === myTeamId) {
            fanTrustChange += isHighTier ? 2 : 3;
        }

        // D. Youth Usage (<20 years old in Starting XI)
        const startingXI = myTeam.players.slice(0, 11);
        const youthPlayers = startingXI.filter(p => p.age < 20).length;
        if (youthPlayers >= 2) {
            fanTrustChange += 2;
        }

        // Apply Fan Trust Change
        updatedManager.trust.fans = Math.max(0, Math.min(100, updatedManager.trust.fans + fanTrustChange));

        // --- EXISTING MANAGER STATS LOGIC ---
        if (res === 'WIN') {
            updatedManager.stats.wins++;
            updatedManager.trust.players = Math.min(100, updatedManager.trust.players + 1);
        } else if (res === 'DRAW') {
            updatedManager.stats.draws++;
        } else if (res === 'LOSS') {
            updatedManager.stats.losses++;
            updatedManager.trust.players = Math.max(0, updatedManager.trust.players - 2); // Players lose trust faster on loss
        }

        // 5 Match Win Streak Player Trust Bonus (+5)
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

        // Generate Instant Social Media Reaction for User Match
        const matchTweets = generateMatchTweets(completedFixture, processedTeams, true);

        // CHECK GAME OVER HERE (Instant Firing Logic after match)
        if (checkGameOver(updatedManager)) {
            // Trigger UI update to show game over
            setViewHistory(['game_over']);
            setHistoryIndex(0);
        }

        setGameState(prev => ({
            ...prev,
            fixtures: updatedFixtures,
            teams: processedTeams,
            manager: updatedManager,
            news: [...matchTweets, ...prev.news] // Prepend new tweets immediately
        }));
        
        // Prepare data for result modal
        setMatchResultData({
             homeTeam: homeTeam,
             awayTeam: awayTeam,
             homeScore: hScore,
             awayScore: aScore,
             stats: updatedStats, // Pass stats to the result modal
             events: events // Pass events to the result modal
        });

        // Replace 'match_live' in history with 'match_result' to prevent going back to the live match
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

        // Simulate
        const { homeScore, awayScore, stats } = simulateMatchInstant(homeTeam, awayTeam);

        // Generate synthetic events for goals to ensure stats update
        const events: MatchEvent[] = [];
        
        const generateGoalEvents = (team: Team, count: number) => {
            const xi = team.players.slice(0, 11);
            const scorers = [...xi.filter(p => p.position === Position.FWD), ...xi.filter(p => p.position === Position.MID), ...xi];
            
            for(let i=0; i<count; i++) {
                const scorer = scorers[Math.floor(Math.random() * scorers.length)];
                let assist = xi[Math.floor(Math.random() * xi.length)];
                if(assist.id === scorer.id) assist = xi.find(p => p.id !== scorer.id) || assist;
                
                events.push({
                    minute: Math.floor(Math.random() * 90) + 1,
                    type: 'GOAL',
                    description: `GOL! ${scorer.name}`,
                    teamName: team.name,
                    scorer: scorer.name,
                    assist: assist.name
                });
            }
        };

        // Generate Card Events based on stats to populate the timeline
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
                 events.push({
                    minute: Math.floor(Math.random() * 90) + 1,
                    type: 'CARD_RED',
                    description: `${player.name} kırmızı kart gördü!`,
                    teamName: team.name,
                    playerId: player.id
                });
            }
        };

        generateGoalEvents(homeTeam, homeScore);
        generateGoalEvents(awayTeam, awayScore);
        
        generateCardEvents(homeTeam, stats.homeYellowCards, stats.homeRedCards);
        generateCardEvents(awayTeam, stats.awayYellowCards, stats.awayRedCards);
        
        // Random Injury Logic for simulation depth
        if (Math.random() < 0.2) { // 20% chance of injury in simulated match
            const targetTeam = Math.random() > 0.5 ? homeTeam : awayTeam;
            const xi = targetTeam.players.slice(0, 11);
            const injuredPlayer = xi[Math.floor(Math.random() * xi.length)];
             events.push({
                minute: Math.floor(Math.random() * 90) + 1,
                type: 'INJURY',
                description: `${injuredPlayer.name} sakatlandı.`,
                teamName: targetTeam.name,
                playerId: injuredPlayer.id
            });
        }
        
        events.sort((a,b) => a.minute - b.minute);

        handleMatchFinish(homeScore, awayScore, events, stats);
    };

    const handleShowTeamDetail = (teamId: string) => {
        const t = gameState.teams.find(t => t.id === teamId);
        if(t) {
            setSelectedTeamForDetail(t);
            navigateTo('team_detail');
        }
    };

    const handleBuyPlayer = (player: Player) => {
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        if (!myTeam) return;
        if (myTeam.budget < player.value) {
            alert("Bütçe yetersiz!");
            return;
        }
        const newBudget = myTeam.budget - player.value;
        const newPlayer = { ...player, teamId: myTeam.id };
        const updatedTeam = { ...myTeam, players: [...myTeam.players, newPlayer], budget: newBudget };
        
        // Remove from transfer list
        const newTransferList = gameState.transferList.filter(p => p.id !== player.id);

        let trustUpdateFans = 0;
        if (player.skill >= 90) {
            const currentStrength = calculateTeamStrength(myTeam);
            const isHighTier = currentStrength >= 80;
            trustUpdateFans = isHighTier ? 4 : 5;
        }

        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t),
            transferList: newTransferList,
            manager: prev.manager ? {
                ...prev.manager,
                trust: {
                    ...prev.manager.trust,
                    fans: Math.min(100, prev.manager.trust.fans + trustUpdateFans)
                },
                stats: {
                    ...prev.manager.stats,
                    playersBought: prev.manager.stats.playersBought + 1,
                    moneySpent: prev.manager.stats.moneySpent + player.value,
                    recordTransferFee: Math.max(prev.manager.stats.recordTransferFee, player.value)
                }
            } : null
        }));
        
        if (player.skill >= 90) {
            alert(`${player.name} takıma katıldı! Taraftarlar yıldız transferi nedeniyle çok mutlu.`);
        } else {
            alert(`${player.name} takıma katıldı!`);
        }
    };

    const handleSellPlayer = (player: Player) => {
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        if (!myTeam) return;
        if (myTeam.players.length <= 11) {
             alert("Kadro yetersiz, oyuncu satılamaz.");
             return;
        }
        const newBudget = myTeam.budget + player.value;
        const updatedTeam = {
            ...myTeam,
            players: myTeam.players.filter(p => p.id !== player.id),
            budget: newBudget
        };
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t),
            manager: prev.manager ? {
                ...prev.manager,
                stats: {
                    ...prev.manager.stats,
                    playersSold: prev.manager.stats.playersSold + 1,
                    moneyEarned: prev.manager.stats.moneyEarned + player.value
                }
            } : null
        }));
        alert(`${player.name} satıldı!`);
    };

    const handleMessageReply = (msgId: number, optIndex: number) => {
        setGameState(prev => {
            const myTeam = prev.teams.find(t => t.id === prev.myTeamId);
            if (!myTeam) return prev;

            const msg = prev.messages.find(m => m.id === msgId);
            if (!msg) return prev;

            let updatedTeam = myTeam;
            let updatedManager = prev.manager ? { ...prev.manager } : null;

            // Option 0: Positive (+2 Trust)
            if (optIndex === 0) {
                if (updatedManager) {
                    if (msg.sender === 'Başkan') {
                        updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 2);
                    } else if (msg.sender === 'Takım Kaptanı' || msg.sender.includes(myTeam.players[0]?.name || 'Player')) {
                        updatedManager.trust.players = Math.min(100, updatedManager.trust.players + 2);
                    }
                }
            }
            // Option 2: Negative/Dismissive (Morale penalty)
            else if (optIndex === 2) {
                // Find the player who sent the message
                const playerIndex = myTeam.players.findIndex(p => p.name === msg.sender);
                
                if (playerIndex !== -1) {
                    const updatedPlayers = [...myTeam.players];
                    const updatedPlayer = { ...updatedPlayers[playerIndex] };
                    
                    // Decrease Morale by 20
                    updatedPlayer.morale = Math.max(0, updatedPlayer.morale - 20);
                    updatedPlayers[playerIndex] = updatedPlayer;

                    updatedTeam = { ...myTeam, players: updatedPlayers };
                }
            }

            return {
                ...prev,
                teams: prev.teams.map(t => t.id === prev.myTeamId ? updatedTeam : t),
                manager: updatedManager
            };
        });
    };

    const handleInterviewComplete = (effect: any, relatedPlayerId?: string) => {
        if (!gameState.myTeamId) {
            setMatchResultData(null);
            setViewHistory(['home']);
            setHistoryIndex(0);
            return;
        }

        setGameState(prev => {
            const myTeam = prev.teams.find(t => t.id === prev.myTeamId);
            if (!myTeam) return prev;

            const updatedPlayers = myTeam.players.map(p => {
                let newMorale = p.morale;

                if (effect.teamMorale) {
                    newMorale += effect.teamMorale;
                }

                if (relatedPlayerId && p.id === relatedPlayerId && effect.playerMorale) {
                    newMorale += effect.playerMorale;
                }
                
                return { ...p, morale: Math.max(0, Math.min(100, newMorale)) };
            });

            // Update trust stats if present
            let newTrust = { ...prev.manager?.trust! };
            if (prev.manager && effect.trustUpdate) {
                if (effect.trustUpdate.board) newTrust.board = Math.max(0, Math.min(100, newTrust.board + effect.trustUpdate.board));
                if (effect.trustUpdate.fans) newTrust.fans = Math.max(0, Math.min(100, newTrust.fans + effect.trustUpdate.fans));
                if (effect.trustUpdate.players) newTrust.players = Math.max(0, Math.min(100, newTrust.players + effect.trustUpdate.players));
                if (effect.trustUpdate.referees) newTrust.referees = Math.max(0, Math.min(100, newTrust.referees + effect.trustUpdate.referees));
            }

            const updatedTeam = { ...myTeam, players: updatedPlayers };
            const updatedManager = prev.manager ? { ...prev.manager, trust: newTrust } : null;

            // Check Game Over after interview effects
            if (checkGameOver(updatedManager)) {
                setViewHistory(['game_over']);
                setHistoryIndex(0);
            }
            
            return {
                ...prev,
                teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t),
                manager: updatedManager
            };
        });

        setMatchResultData(null);
        if (currentView !== 'game_over') {
            setViewHistory(['home']);
            setHistoryIndex(0);
        }
    };

    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);

    if (currentView === 'intro') return <IntroScreen onStart={handleStart} />;
    
    // --- GAME OVER SCREEN ---
    if (currentView === 'game_over' || gameOverReason) {
        return (
            <div className="h-screen flex items-center justify-center bg-red-950 text-white p-8">
                <div className="max-w-2xl w-full bg-red-900 border-4 border-red-700 p-12 rounded-2xl text-center shadow-2xl animate-in zoom-in duration-500">
                    <FileWarning size={80} className="mx-auto mb-6 text-red-300 animate-pulse"/>
                    <h1 className="text-5xl font-bold mb-6 tracking-widest uppercase">Kovuldunuz</h1>
                    <p className="text-2xl font-serif italic mb-8 border-l-4 border-red-500 pl-4 text-left bg-red-800/50 p-4 rounded">
                        "{gameOverReason}"
                    </p>
                    <div className="flex justify-center gap-6">
                        <button 
                            onClick={handleNewGame} 
                            className="bg-white text-red-900 hover:bg-slate-200 px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center gap-2"
                        >
                            <LogOut size={24}/> YENİ KARİYER
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'team_select') return <TeamSelection teams={gameState.teams} onSelect={handleSelectTeam} />;

    return (
        <Dashboard 
            state={gameState} 
            onNavigate={(view) => navigateTo(view)} 
            onSave={handleSave} 
            onNewGame={handleNewGame}
            onNextWeek={handleNextWeek}
            currentView={currentView}
            theme={theme}
            toggleTheme={toggleTheme}
            onBack={goBack}
            onForward={goForward}
            canBack={historyIndex > 0}
            canForward={historyIndex < viewHistory.length - 1}
        >
            {currentView === 'home' && myTeam && (
                <HomeView 
                    manager={gameState.manager!} 
                    team={myTeam} 
                    teams={gameState.teams} 
                    myTeamId={myTeam.id} 
                    currentWeek={gameState.currentWeek} 
                    fixtures={gameState.fixtures}
                    onTeamClick={handleShowTeamDetail}
                    onFixtureClick={(f) => setSelectedFixtureForDetail(f)}
                />
            )}
            
            {currentView === 'squad' && myTeam && (
                <SquadView team={myTeam} onPlayerClick={(p) => setSelectedPlayerForDetail(p)} />
            )}

            {currentView === 'tactics' && myTeam && (
                <TacticsView 
                    team={myTeam} 
                    setTeam={(updatedTeam) => {
                        setGameState(prev => ({
                            ...prev,
                            teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t)
                        }));
                    }} 
                />
            )}

            {currentView === 'fixtures' && myTeam && (
                <FixturesView 
                    fixtures={gameState.fixtures} 
                    teams={gameState.teams} 
                    myTeamId={myTeam.id} 
                    currentWeek={gameState.currentWeek}
                    onTeamClick={handleShowTeamDetail}
                    onFixtureClick={(f) => setSelectedFixtureForDetail(f)}
                />
            )}
            
            {currentView === 'transfer' && myTeam && (
                <TransferView 
                    transferList={gameState.transferList} 
                    team={myTeam} 
                    budget={myTeam.budget}
                    isWindowOpen={isTransferWindowOpen(gameState.currentWeek)}
                    onBuy={handleBuyPlayer}
                    onSell={handleSellPlayer}
                    onPlayerClick={(p) => setSelectedPlayerForDetail(p)}
                />
            )}

            {currentView === 'social' && (
                <SocialMediaView 
                    news={gameState.news} 
                    teams={gameState.teams}
                    messages={gameState.messages}
                    onUpdateMessages={(msgs) => setGameState(prev => ({ ...prev, messages: msgs }))}
                    onReply={handleMessageReply}
                />
            )}

            {currentView === 'training' && (
                <TrainingView 
                    onTrain={handleTrain} 
                    performed={gameState.trainingPerformed}
                />
            )}

            {/* Team Detail View as a full page view */}
            {currentView === 'team_detail' && selectedTeamForDetail && (
                <TeamDetailView 
                    team={selectedTeamForDetail} 
                    onClose={() => {
                        setSelectedTeamForDetail(null);
                        goBack();
                    }}
                    onPlayerClick={(p) => setSelectedPlayerForDetail(p)} 
                />
            )}

            {/* FULL SCREEN VIEWS INTEGRATED INTO DASHBOARD (NO OVERLAY) */}

            {currentView === 'match_preview' && myTeam && (
                <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 transition-colors duration-300">
                    <MatchPreview 
                        fixture={gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))!}
                        homeTeam={gameState.teams.find(t => t.id === (gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))?.homeTeamId))!}
                        awayTeam={gameState.teams.find(t => t.id === (gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))?.awayTeamId))!}
                        onProceed={() => navigateTo('locker_room')}
                    />
                </div>
            )}

            {currentView === 'locker_room' && myTeam && (
                <div className="h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                    <LockerRoomView 
                        team={myTeam} 
                        setTeam={(t) => setGameState(prev => ({ ...prev, teams: prev.teams.map(team => team.id === t.id ? t : team) }))}
                        onStartMatch={() => navigateTo('match_live')}
                        onSimulateMatch={handleFastSimulate}
                    />
                </div>
            )}

            {currentView === 'match_live' && myTeam && (
                <div className="h-full bg-slate-900">
                    <MatchSimulation 
                        homeTeam={gameState.teams.find(t => t.id === (gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))?.homeTeamId))!}
                        awayTeam={gameState.teams.find(t => t.id === (gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))?.awayTeamId))!}
                        userTeamId={myTeam.id}
                        onFinish={handleMatchFinish}
                        allTeams={gameState.teams}
                        fixtures={gameState.fixtures}
                    />
                </div>
            )}

            {/* Modals and Overlays */}
            
            {selectedPlayerForDetail && (
                <PlayerDetailModal 
                    player={selectedPlayerForDetail} 
                    onClose={() => setSelectedPlayerForDetail(null)} 
                />
            )}
            
            {selectedFixtureForDetail && (
                <MatchDetailModal 
                    fixture={selectedFixtureForDetail} 
                    teams={gameState.teams} 
                    onClose={() => setSelectedFixtureForDetail(null)} 
                />
            )}

             {currentView === 'match_result' && matchResultData && (
                <MatchResultModal 
                    homeTeam={matchResultData.homeTeam}
                    awayTeam={matchResultData.awayTeam}
                    homeScore={matchResultData.homeScore}
                    awayScore={matchResultData.awayScore}
                    stats={matchResultData.stats}
                    events={matchResultData.events}
                    onProceed={() => {
                        let result: 'WIN'|'LOSS'|'DRAW' = 'DRAW';
                        const isHome = matchResultData.homeTeam.id === gameState.myTeamId;
                        const myScore = isHome ? matchResultData.homeScore : matchResultData.awayScore;
                        const oppScore = isHome ? matchResultData.awayScore : matchResultData.homeScore;
                        if(myScore > oppScore) result = 'WIN';
                        if(myScore < oppScore) result = 'LOSS';
                        setMatchResultData({ ...matchResultData, result });
                        navigateTo('interview');
                    }}
                />
            )}
            
            {currentView === 'interview' && matchResultData && (
                <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-50 p-4 transition-colors duration-300">
                    <PostMatchInterview 
                        result={matchResultData.result}
                        events={matchResultData.events}
                        homeTeam={matchResultData.homeTeam}
                        awayTeam={matchResultData.awayTeam}
                        myTeamId={gameState.myTeamId!}
                        onClose={() => {
                            setMatchResultData(null);
                            // Reset history to ensure user cannot go back to interview or match
                            setViewHistory(['home']);
                            setHistoryIndex(0);
                        }}
                        onComplete={handleInterviewComplete}
                    />
                </div>
            )}
        </Dashboard>
    );
};

export default App;
