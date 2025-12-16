
import React, { useState } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats } from '../types';
import { FileWarning, LogOut, Trophy, Building2, BarChart3, ArrowRightLeft, Wallet, Clock, TrendingUp, TrendingDown, Crown } from 'lucide-react';

// Views
import IntroScreen from '../views/IntroScreen';
import TeamSelection from '../views/TeamSelection';
import HomeView from '../views/HomeView';
import SquadView from '../views/SquadView';
import TacticsView from '../views/TacticsView';
import FixturesView from '../views/FixturesView';
import TransferView from '../views/TransferView';
import SocialMediaView from '../views/SocialMediaView';
import TrainingView from '../views/TrainingView';
import TeamDetailView from '../views/TeamDetailView';
import MatchPreview from '../views/MatchPreview';
import LockerRoomView from '../views/LockerRoomView';
import MatchSimulation from '../views/MatchSimulation';
import PostMatchInterview from '../views/PostMatchInterview';
import HealthCenterView from '../views/HealthCenterView';

// Layouts & Modals
import Dashboard from '../layout/Dashboard';
import PlayerDetailModal from '../modals/PlayerDetailModal';
import MatchDetailModal from '../modals/MatchDetailModal';
import MatchResultModal from '../modals/MatchResultModal';
import HallOfFameModal from '../modals/HallOfFameModal';

// Types definition for props
interface MainContentProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    viewHistory: string[];
    historyIndex: number;
    currentView: string;
    selectedPlayerForDetail: Player | null;
    setSelectedPlayerForDetail: React.Dispatch<React.SetStateAction<Player | null>>;
    selectedTeamForDetail: Team | null;
    setSelectedTeamForDetail: React.Dispatch<React.SetStateAction<Team | null>>;
    matchResultData: any;
    setMatchResultData: React.Dispatch<React.SetStateAction<any>>;
    selectedFixtureForDetail: Fixture | null;
    setSelectedFixtureForDetail: React.Dispatch<React.SetStateAction<Fixture | null>>;
    gameOverReason: string | null;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    navigateTo: (view: string) => void;
    goBack: () => void;
    goForward: () => void;
    handleStart: (name: string, year: string, country: string) => void;
    handleSelectTeam: (id: string) => void;
    handleSave: () => void;
    handleNewGame: () => void;
    handleNextWeek: () => void;
    handleTrain: (type: 'ATTACK' | 'DEFENSE' | 'PHYSICAL') => void;
    handleMatchFinish: (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats) => void;
    handleFastSimulate: () => void;
    handleShowTeamDetail: (teamId: string) => void;
    handleBuyPlayer: (player: Player) => void;
    handleSellPlayer: (player: Player) => void;
    handleMessageReply: (msgId: number, optIndex: number) => void;
    handleInterviewComplete: (effect: any, relatedPlayerId?: string) => void;
    handleRetire: () => void;
    handleTerminateContract: () => void;
    myTeam?: Team;
    injuredBadgeCount: number;
    isTransferWindowOpen: boolean;
}

const MainContent: React.FC<MainContentProps> = (props) => {
    const {
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
        handleRetire,
        handleTerminateContract,
        myTeam,
        injuredBadgeCount,
        isTransferWindowOpen
    } = props;

    // Helper for formatting time
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        
        if (h > 0) return `${h} Sa ${m} Dk`;
        return `${m} Dk`;
    };

    // State for showing Hall of Fame inside Game Over screen
    const [showGameOverHoF, setShowGameOverHoF] = useState(false);

    if (currentView === 'intro') return <IntroScreen onStart={handleStart} />;
    
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
            injuredCount={injuredBadgeCount}
        >
            {/* Game Over Screen */}
            {(currentView === 'game_over' || gameOverReason) && (
                <div className={`h-full flex items-center justify-center p-8 absolute inset-0 z-50 overflow-y-auto ${gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? 'bg-slate-900' : 'bg-red-950'} text-white`}>
                    
                    {/* Render Hall of Fame Modal ON TOP of Game Over screen if active */}
                    {showGameOverHoF && gameState.manager && (
                        <HallOfFameModal manager={gameState.manager} onClose={() => setShowGameOverHoF(false)} />
                    )}

                    <div className={`max-w-4xl w-full border-4 p-8 rounded-2xl text-center shadow-2xl animate-in zoom-in duration-500 ${gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? 'bg-slate-800 border-slate-600' : 'bg-red-900 border-red-700'}`}>
                        {gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? (
                            <Trophy size={80} className="mx-auto mb-6 text-yellow-400 animate-bounce"/>
                        ) : (
                            <FileWarning size={80} className="mx-auto mb-6 text-red-300 animate-pulse"/>
                        )}
                        
                        <h1 className="text-5xl font-bold mb-6 tracking-widest uppercase">
                            {gameOverReason?.includes('emekli') ? "Efsanevi Veda" : gameOverReason?.includes('feshettin') ? "Sözleşme Feshi" : "Kovuldunuz"}
                        </h1>
                        
                        <p className={`text-2xl font-serif italic mb-8 border-l-4 pl-4 text-left p-4 rounded ${gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? 'border-yellow-500 bg-slate-700/50' : 'border-red-500 bg-red-800/50'}`}>
                            "{gameOverReason}"
                        </p>

                        {/* CAREER STATS GRID */}
                        {gameState.manager && (
                            <div className="bg-black/30 p-6 rounded-xl mb-8">
                                <h3 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-left uppercase text-slate-300">Kariyer İstatistikleri</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-2xl font-bold flex items-center justify-center gap-1">{gameState.manager.stats.leagueTitles} <Trophy size={16} className="text-yellow-400"/></div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Lig Şampiyonluğu</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-2xl font-bold flex items-center justify-center gap-1">{gameState.manager.stats.domesticCups} <Trophy size={16} className="text-blue-400"/></div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Kupa</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-2xl font-bold text-green-400">{gameState.manager.stats.wins}</div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Galibiyet</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-2xl font-bold text-slate-200">{gameState.manager.stats.matchesManaged}</div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Maç Sayısı</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1"><Wallet size={16}/> {gameState.manager.stats.careerEarnings.toFixed(1)} M€</div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Toplam Kazanç</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-xl font-bold flex items-center justify-center gap-1"><Clock size={16}/> {formatTime(gameState.playTime)}</div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Oynama Süresi</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-6">
                            <button 
                                onClick={() => setShowGameOverHoF(true)} 
                                className="px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center gap-2 bg-yellow-600 text-white hover:bg-yellow-500"
                            >
                                <Crown size={24}/> ONUR TABLOSU
                            </button>
                            
                            <button 
                                onClick={handleNewGame} 
                                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center gap-2 ${gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-white text-red-900 hover:bg-slate-200'}`}
                            >
                                <LogOut size={24}/> YENİ KARİYER
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    playTime={gameState.playTime}
                    onRetire={handleRetire}
                    onTerminateContract={handleTerminateContract}
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
                    currentWeek={gameState.currentWeek}
                />
            )}

            {currentView === 'health_center' && myTeam && (
                <HealthCenterView 
                    team={myTeam} 
                    currentWeek={gameState.currentWeek} 
                    onPlayerClick={(p) => setSelectedPlayerForDetail(p)}
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
                    isWindowOpen={isTransferWindowOpen}
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
                        currentWeek={gameState.currentWeek}
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
                <div className="fixed inset-0 z-50 p-4 bg-[url('https://i.imgur.com/xfBpLhO.png')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
                    <div className="relative z-10 h-full">
                        <PostMatchInterview 
                            result={matchResultData.result}
                            events={matchResultData.events}
                            homeTeam={matchResultData.homeTeam}
                            awayTeam={matchResultData.awayTeam}
                            myTeamId={gameState.myTeamId!}
                            onClose={() => {
                                // Use handleInterviewComplete to perform necessary cleanup and navigation
                                // passing empty object as effect
                                handleInterviewComplete({});
                            }}
                            onComplete={handleInterviewComplete}
                        />
                    </div>
                </div>
            )}
        </Dashboard>
    );
};

export default MainContent;
