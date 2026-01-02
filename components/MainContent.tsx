


import React, { useState } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats, PendingTransfer, SponsorDeal, IncomingOffer, TrainingConfig, IndividualTrainingType } from '../types';
import { FileWarning, LogOut, Trophy, Building2, BarChart3, ArrowRightLeft, Wallet, Clock, TrendingUp, TrendingDown, Crown } from 'lucide-react';

// Views
import IntroScreen from '../views/IntroScreen';
import TeamSelection from '../views/TeamSelection';
import HomeView from '../views/HomeView';
import SquadView from '../views/SquadView';
import TacticsView from '../views/TacticsView';
import FixturesView from '../views/FixturesView';
import TransferView from '../views/TransferView';
import FinanceView from '../views/FinanceView';
import SocialMediaView from '../views/SocialMediaView';
import TrainingView from '../views/TrainingView';
import DevelopmentCenterView from '../views/DevelopmentCenterView'; // NEW VIEW
import TeamDetailView from '../views/TeamDetailView';
import PlayerDetailView from '../views/PlayerDetailView'; 
import MatchPreview from '../views/MatchPreview';
import LockerRoomView from '../views/LockerRoomView';
import MatchSimulation from '../views/MatchSimulation';
import PostMatchInterview from '../views/PostMatchInterview';
import HealthCenterView from '../views/HealthCenterView';
import ContractNegotiationView from '../views/ContractNegotiationView'; 
import TransferOfferNegotiationView from '../views/TransferOfferNegotiationView';
import LeagueCupView from '../views/LeagueCupView'; // New View

// Layouts & Modals
import Dashboard from '../layout/Dashboard';
import MatchDetailModal from '../modals/MatchDetailModal';
import MatchResultModal from '../modals/MatchResultModal';
import HallOfFameModal from '../modals/HallOfFameModal';
import FixtureDetailPanel from './shared/FixtureDetailPanel';
import ChampionCelebrationModal from '../modals/ChampionCelebrationModal'; 
import SeasonSummaryModal from '../modals/SeasonSummaryModal'; // NEW

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
    selectedFixtureInfo: Fixture | null;
    setSelectedFixtureInfo: React.Dispatch<React.SetStateAction<Fixture | null>>;
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
    handleTrain: (config: TrainingConfig) => void; // UPDATED SIGNATURE
    handleAssignIndividualTraining: (playerId: string, type: IndividualTrainingType) => void; // NEW
    handleMatchFinish: (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats) => void;
    handleFastSimulate: () => void;
    handleShowTeamDetail: (teamId: string) => void;
    handleShowPlayerDetail: (player: Player) => void;
    handleBuyPlayer: (player: Player) => void;
    handleSellPlayer: (player: Player) => void;
    handleMessageReply: (msgId: number, optIndex: number) => void;
    handleInterviewComplete: (effect: any, relatedPlayerId?: string) => void;
    handleSkipInterview: () => void; 
    handleRetire: () => void;
    handleTerminateContract: () => void;
    handlePlayerInteraction: (playerId: string, type: 'POSITIVE' | 'NEGATIVE' | 'HOSTILE') => void;
    handlePlayerUpdate: (playerId: string, updates: Partial<Player>) => void;
    handleReleasePlayer: (player: Player, cost: number) => void; 
    handleTransferOfferSuccess: (player: Player, agreedFee: number) => void; 
    handleSignPlayer: (player: Player, fee: number, contract: any) => void; 
    handleCancelTransfer: (playerId: string) => void; 
    handleUpdateSponsor: (type: 'main' | 'stadium' | 'sleeve', deal: SponsorDeal) => void;
    handleTakeEmergencyLoan: (amount: number) => void; // NEW
    handleAcceptOffer: (offer: IncomingOffer) => void; // NEW
    handleRejectOffer: (offer: IncomingOffer) => void; // NEW
    handleToggleTrainingDelegation: () => void; // NEW
    negotiatingTransferPlayer: Player | null; 
    setNegotiatingTransferPlayer: React.Dispatch<React.SetStateAction<Player | null>>; 
    incomingTransfer: PendingTransfer | null; 
    setIncomingTransfer: React.Dispatch<React.SetStateAction<PendingTransfer | null>>;
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
        selectedFixtureInfo,
        setSelectedFixtureInfo,
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
        handleAssignIndividualTraining,
        handleMatchFinish,
        handleFastSimulate,
        handleShowTeamDetail,
        handleShowPlayerDetail, 
        handleBuyPlayer,
        handleSellPlayer,
        handleMessageReply,
        handleInterviewComplete,
        handleSkipInterview, 
        handleRetire,
        handleTerminateContract,
        handlePlayerInteraction,
        handlePlayerUpdate,
        handleReleasePlayer,
        handleTransferOfferSuccess,
        handleSignPlayer,
        handleCancelTransfer,
        handleUpdateSponsor,
        handleTakeEmergencyLoan,
        handleAcceptOffer,
        handleRejectOffer,
        handleToggleTrainingDelegation,
        negotiatingTransferPlayer,
        setNegotiatingTransferPlayer,
        incomingTransfer,
        setIncomingTransfer,
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
    
    // State for Contract Negotiation (With Own Players)
    const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);
    
    // State for Negotiation Mode (Buying vs Selling)
    const [negotiationMode, setNegotiationMode] = useState<'BUY' | 'SELL'>('BUY');
    const [initialSellOffer, setInitialSellOffer] = useState<number>(0);

    // Function to handle budget updates from Finance View
    const handleBudgetUpdate = (newTransferBudget: number, newWageBudget: number) => {
        if (!myTeam) return;
        
        const updatedTeam = { 
            ...myTeam, 
            budget: newTransferBudget,
            wageBudget: newWageBudget // Explicitly save the wage budget allocation
        };
        
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t)
        }));
        
        alert("Bütçe dağılımı başarıyla güncellendi!"); 
    };

    // Contract Negotiation Handlers
    const handleStartNegotiation = (player: Player) => {
        setNegotiatingPlayer(player);
        navigateTo('contract_negotiation');
    };

    const handleFinishNegotiation = (success: boolean, newContract: any) => {
        if (success && newContract) {
            // Check if this is a NEW transfer or RENEWAL
            if (incomingTransfer && activeNegotiationPlayer && activeNegotiationPlayer.id === incomingTransfer.playerId) {
                // NEW TRANSFER
                handleSignPlayer(activeNegotiationPlayer, incomingTransfer.agreedFee, newContract);
            } else if (negotiatingPlayer) {
                // RENEWAL
                handlePlayerUpdate(negotiatingPlayer.id, {
                    squadStatus: newContract.role,
                    contractExpiry: 2025 + newContract.years, // Simplified
                    activePromises: newContract.promises, // Store promises
                    wage: newContract.wage // Store actual negotiated wage
                });
                alert("Yeni sözleşme imzalandı!");
                setNegotiatingPlayer(null);
                goBack(); // Go back to Player Detail
            }
        } else {
            // Failed negotiation - COOLDOWN LOGIC
            const cooldownWeeks = 4;
            const nextWeek = gameState.currentWeek + cooldownWeeks;

            if (negotiatingPlayer) {
                // Failed renewal
                handlePlayerUpdate(negotiatingPlayer.id, {
                    activePromises: negotiatingPlayer.activePromises,
                    nextNegotiationWeek: nextWeek
                });
                alert(`Görüşmeler başarısız oldu. Oyuncu ${cooldownWeeks} hafta boyunca yeni tekliflere kapalı olacak.`);
                setNegotiatingPlayer(null);
                goBack();
            } else if (incomingTransfer) {
                // Failed signing
                // Update player (who is in other team or transfer list)
                handlePlayerUpdate(incomingTransfer.playerId, {
                    nextNegotiationWeek: nextWeek
                });
                alert(`Anlaşma sağlanamadı. ${cooldownWeeks} hafta boyunca tekrar teklif yapılamaz.`);
                
                handleCancelTransfer(incomingTransfer.playerId);
                navigateTo('home');
            }
        }
    };

    // NEW: Transfer Negotiation Handler (Navigates to new View)
    const handleStartTransferNegotiation = (player: Player) => {
        setNegotiationMode('BUY');
        setInitialSellOffer(0);
        if (player.teamId === 'free_agent') {
            // Direct contract for free agents, skip club negotiation
            
            // Simulating a "Transfer Agreed at 0 Fee" to trigger contract flow
            const dummyTransfer: PendingTransfer = {
                playerId: player.id,
                sourceTeamId: 'free_agent',
                agreedFee: 0,
                date: gameState.currentDate
            };
            setIncomingTransfer(dummyTransfer);
            
            // Navigate to contract directly
            navigateTo('contract_negotiation');
        } else {
            setNegotiatingTransferPlayer(player);
            navigateTo('transfer_negotiation');
        }
    }

    const handleNegotiateOffer = (offer: IncomingOffer) => {
        if (!myTeam) return;
        const player = myTeam.players.find(p => p.id === offer.playerId);
        if (player) {
            setNegotiatingTransferPlayer(player);
            setNegotiationMode('SELL');
            setInitialSellOffer(offer.amount);
            navigateTo('transfer_negotiation');
        }
    };

    const handleFinishTransferNegotiation = (success: boolean, fee: number) => {
        if (negotiationMode === 'BUY') {
            if (success && negotiatingTransferPlayer) {
                handleTransferOfferSuccess(negotiatingTransferPlayer, fee);
            } else if (!success && negotiatingTransferPlayer) {
                // Failed transfer offer
                const cooldown = 3;
                handlePlayerUpdate(negotiatingTransferPlayer.id, {
                    nextNegotiationWeek: gameState.currentWeek + cooldown
                });
                alert(`Kulüp ile anlaşma sağlanamadı. ${cooldown} hafta boyunca yeni teklif yapılamaz.`);
            }
        } else {
            // SELL MODE
            if (negotiatingTransferPlayer) {
                // Find the original offer to ensure we remove the correct notification
                const originalOffer = gameState.incomingOffers.find(o => o.playerId === negotiatingTransferPlayer.id);

                if (success) {
                    // Manually trigger sell logic with agreed fee
                    // Construct a final offer object using the ORIGINAL ID if available, to clear the list correctly
                    const finalOffer: IncomingOffer = {
                        id: originalOffer ? originalOffer.id : 'simulated_' + Date.now(),
                        playerId: negotiatingTransferPlayer.id,
                        playerName: negotiatingTransferPlayer.name,
                        fromTeamName: originalOffer ? originalOffer.fromTeamName : 'Karşı Kulüp',
                        amount: fee,
                        date: gameState.currentDate
                    };
                    
                    handleAcceptOffer(finalOffer);
                    
                } else {
                    // Failed sell negotiation - Remove the offer because the deal collapsed
                    alert("Anlaşma sağlanamadı. Karşı kulüp masadan kalktı.");
                    if (originalOffer) {
                        handleRejectOffer(originalOffer);
                    }
                }
            }
        }
        setNegotiatingTransferPlayer(null);
        goBack();
    };

    // Resolve Player for Incoming Transfer (from Pending ID)
    const getIncomingPlayer = () => {
        if (!incomingTransfer) return null;
        // Search in all teams or transfer list
        for (const t of gameState.teams) {
            const p = t.players.find(x => x.id === incomingTransfer.playerId);
            if(p) return p;
        }
        return gameState.transferList.find(x => x.id === incomingTransfer.playerId) || null;
    };

    const incomingPlayerObj = getIncomingPlayer();
    const activeNegotiationPlayer = negotiatingPlayer || incomingPlayerObj;

    const handleCloseCelebration = () => {
        setGameState(prev => ({ ...prev, seasonChampion: null }));
    };

    const handleCloseSeasonSummary = () => {
        setGameState(prev => ({ ...prev, lastSeasonSummary: null }));
    };

    // Helper to provide a fallback team for foreign/free players in negotiation view
    const getTargetTeamForNegotiation = (teamId: string) => {
        const found = gameState.teams.find(t => t.id === teamId);
        if (found) return found;
        
        // Check if we are in SELL mode and have an active offer for the player
        if (negotiationMode === 'SELL' && negotiatingTransferPlayer) {
            const offer = gameState.incomingOffers.find(o => o.playerId === negotiatingTransferPlayer.id);
            const teamName = offer ? offer.fromTeamName : 'Talip Kulüp';
            
            return {
                id: 'buying_ai_team',
                name: teamName,
                logo: '',
                colors: ['bg-slate-700', 'text-white'],
                players: [],
                championships: 0, fanBase: 0, stadiumName: '', stadiumCapacity: 0, budget: 1000, initialDebt: 0, 
                reputation: 0, financialRecords: { income: {} as any, expense: {} as any }, 
                transferHistory: [], sponsors: {} as any, formation: '', mentality: {} as any, passing: {} as any, 
                tempo: {} as any, width: {} as any, creative: {} as any, finalThird: {} as any, crossing: {} as any, 
                defLine: {} as any, tackling: {} as any, pressFocus: {} as any, timeWasting: {} as any, 
                tactic: {} as any, attackStyle: {} as any, pressingStyle: {} as any, stats: {} as any, strength: 0, morale: 0
            } as unknown as Team;
        }
        
        // Dummy team for foreign clubs (Buying)
        return {
            id: teamId,
            name: teamId === 'free_agent' ? 'Serbest' : 'Yurt Dışı Kulübü',
            logo: '', // Empty logo
            colors: ['bg-slate-700', 'text-white'],
            players: new Array(25).fill({}), // Mock array to simulate squad size
            // Minimal dummy props to satisfy Team type where needed
            championships: 0, fanBase: 0, stadiumName: '', stadiumCapacity: 0, budget: 0, initialDebt: 0, 
            reputation: 0, financialRecords: { income: {} as any, expense: {} as any }, 
            transferHistory: [], sponsors: {} as any, formation: '', mentality: {} as any, passing: {} as any, 
            tempo: {} as any, width: {} as any, creative: {} as any, finalThird: {} as any, crossing: {} as any, 
            defLine: {} as any, tackling: {} as any, pressFocus: {} as any, timeWasting: {} as any, 
            tactic: {} as any, attackStyle: {} as any, pressingStyle: {} as any, stats: {} as any, strength: 0, morale: 0
        } as unknown as Team;
    };

    if (currentView === 'intro') return <IntroScreen onStart={handleStart} />;
    
    if (currentView === 'team_select') return <TeamSelection teams={gameState.teams} onSelect={handleSelectTeam} />;

    // Calculate Dynamic Max Wage for Negotiation
    let maxAllowedWage = 0;
    if (myTeam && activeNegotiationPlayer) {
        const currentTotalWages = myTeam.players.reduce((acc, p) => acc + (p.wage !== undefined ? p.wage : (p.value * 0.005 * 52)), 0);
        // If renewing, subtract current wage to find room. If new transfer, don't subtract anything from current totals.
        const playerCurrentWage = (activeNegotiationPlayer.teamId === myTeam.id) 
            ? (activeNegotiationPlayer.wage !== undefined ? activeNegotiationPlayer.wage : (activeNegotiationPlayer.value * 0.005 * 52))
            : 0;
            
        const committedWagesOthers = currentTotalWages - playerCurrentWage;
        
        // Ensure wageBudget exists, otherwise fallback to currentTotal
        const wageBudgetLimit = myTeam.wageBudget !== undefined ? myTeam.wageBudget : currentTotalWages;
        
        maxAllowedWage = Math.max(0, wageBudgetLimit - committedWagesOthers);
    }

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
            {/* Season Champion Celebration Modal */}
            {gameState.seasonChampion && (
                <ChampionCelebrationModal 
                    champion={gameState.seasonChampion} 
                    onClose={handleCloseCelebration}
                />
            )}

            {/* Season Summary Modal (The Report Card) */}
            {gameState.lastSeasonSummary && (
                <SeasonSummaryModal
                    summary={gameState.lastSeasonSummary}
                    onClose={handleCloseSeasonSummary}
                />
            )}

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

            {/* ... Rest of existing views ... */}
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
            
            {currentView === 'competitions' && myTeam && (
                <LeagueCupView 
                    teams={gameState.teams}
                    fixtures={gameState.fixtures}
                    myTeamId={myTeam.id}
                    currentWeek={gameState.currentWeek}
                    currentDate={gameState.currentDate}
                    onTeamClick={handleShowTeamDetail}
                    onFixtureClick={(f) => setSelectedFixtureForDetail(f)}
                    myTeam={myTeam}
                />
            )}
            
            {/* ... Other existing views unchanged ... */}
            {currentView === 'squad' && myTeam && (
                <SquadView 
                    team={myTeam} 
                    onPlayerClick={handleShowPlayerDetail}
                    manager={gameState.manager!} 
                />
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
                    onPlayerClick={handleShowPlayerDetail}
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
                    onFixtureInfoClick={(f) => setSelectedFixtureInfo(f)}
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
                    onPlayerClick={handleShowPlayerDetail}
                    incomingOffers={gameState.incomingOffers || []}
                    onAcceptOffer={handleAcceptOffer}
                    onRejectOffer={handleRejectOffer}
                    onNegotiateOffer={handleNegotiateOffer} // NEW
                />
            )}

            {currentView === 'finance' && myTeam && (
                <FinanceView 
                    team={myTeam} 
                    manager={gameState.manager!}
                    onUpdateBudget={handleBudgetUpdate}
                    onUpdateSponsor={handleUpdateSponsor} 
                    onTakeLoan={handleTakeEmergencyLoan} // Pass the loan handler
                    fixtures={gameState.fixtures}
                    currentWeek={gameState.currentWeek}
                    currentDate={gameState.currentDate}
                    onPlayerClick={handleShowPlayerDetail} 
                />
            )}

            {currentView === 'social' && (
                <SocialMediaView 
                    news={gameState.news} 
                    teams={gameState.teams}
                    messages={gameState.messages}
                    onUpdateMessages={(msgs) => setGameState(prev => ({ ...prev, messages: msgs }))}
                    onReply={handleMessageReply}
                    isTransferWindowOpen={isTransferWindowOpen}
                />
            )}

            {currentView === 'training' && myTeam && (
                <TrainingView 
                    onTrain={handleTrain} 
                    performed={gameState.trainingPerformed}
                    team={myTeam}
                    manager={gameState.manager!}
                    onGoToDevelopment={() => navigateTo('development')}
                    onToggleDelegation={handleToggleTrainingDelegation}
                />
            )}

            {currentView === 'development' && myTeam && (
                <DevelopmentCenterView 
                    players={myTeam.players}
                    onAssignTraining={handleAssignIndividualTraining}
                />
            )}

            {currentView === 'team_detail' && selectedTeamForDetail && (
                <TeamDetailView 
                    team={selectedTeamForDetail} 
                    allTeams={gameState.teams}
                    fixtures={gameState.fixtures}
                    currentDate={gameState.currentDate}
                    manager={gameState.manager!}
                    onClose={() => {
                        setSelectedTeamForDetail(null);
                        goBack();
                    }}
                    onPlayerClick={handleShowPlayerDetail} 
                    onTeamClick={handleShowTeamDetail}
                />
            )}

            {currentView === 'my_team_detail' && myTeam && (
                <TeamDetailView 
                    team={myTeam} 
                    allTeams={gameState.teams}
                    fixtures={gameState.fixtures}
                    currentDate={gameState.currentDate}
                    manager={gameState.manager!}
                    onClose={() => goBack()}
                    onPlayerClick={handleShowPlayerDetail} 
                    onTeamClick={handleShowTeamDetail}
                />
            )}

            {currentView === 'player_detail' && selectedPlayerForDetail && (
                <PlayerDetailView 
                    player={selectedPlayerForDetail} 
                    onClose={() => goBack()}
                    myTeamId={gameState.myTeamId!} 
                    manager={gameState.manager!}
                    teammates={gameState.teams.find(t => t.id === selectedPlayerForDetail.teamId)?.players || []}
                    onInteract={handlePlayerInteraction}
                    onUpdatePlayer={handlePlayerUpdate}
                    onStartNegotiation={handleStartNegotiation}
                    onStartTransferNegotiation={handleStartTransferNegotiation} 
                    onReleasePlayer={handleReleasePlayer} 
                    currentWeek={gameState.currentWeek} 
                />
            )}

            {currentView === 'contract_negotiation' && activeNegotiationPlayer && (
                <ContractNegotiationView
                    player={activeNegotiationPlayer}
                    onClose={() => {
                        setNegotiatingPlayer(null);
                        if(incomingTransfer) {
                            alert("Sözleşme görüşmesi iptal edildi. Transfer gerçekleşmedi.");
                            handleCancelTransfer(incomingTransfer.playerId); 
                            navigateTo('home');
                        } else {
                            goBack();
                        }
                    }}
                    onFinish={handleFinishNegotiation}
                    maxAllowedWage={maxAllowedWage} 
                />
            )}

            {currentView === 'transfer_negotiation' && negotiatingTransferPlayer && myTeam && (
                <TransferOfferNegotiationView
                    player={negotiatingTransferPlayer}
                    targetTeam={getTargetTeamForNegotiation(negotiatingTransferPlayer.teamId)}
                    myTeamBudget={myTeam.budget}
                    myTeam={myTeam} 
                    onClose={() => {
                        setNegotiatingTransferPlayer(null);
                        goBack();
                    }}
                    onFinish={handleFinishTransferNegotiation}
                    mode={negotiationMode} // Pass mode
                    initialOfferAmount={initialSellOffer} // Pass offer
                />
            )}

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
                        setTeam={(updatedTeam) => {
                            setGameState(prev => ({
                                ...prev,
                                teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t)
                            }));
                        }}
                        onStartMatch={() => navigateTo('match_live')}
                        onSimulateMatch={handleFastSimulate}
                        currentWeek={gameState.currentWeek}
                    />
                </div>
            )}

            {currentView === 'match_live' && myTeam && (
                <div className="h-full w-full bg-black">
                    <MatchSimulation 
                        homeTeam={gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played) ? gameState.teams.find(t => t.id === gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played)!.homeTeamId)! : myTeam}
                        awayTeam={gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played) ? gameState.teams.find(t => t.id === gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played)!.awayTeamId)! : myTeam}
                        userTeamId={myTeam.id}
                        onFinish={handleMatchFinish}
                        allTeams={gameState.teams}
                        fixtures={gameState.fixtures}
                        managerTrust={gameState.manager?.trust.players || 50}
                    />
                </div>
            )}

            {currentView === 'match_result' && matchResultData && (
                <MatchResultModal 
                    homeTeam={matchResultData.homeTeam}
                    awayTeam={matchResultData.awayTeam}
                    homeScore={matchResultData.homeScore}
                    awayScore={matchResultData.awayScore}
                    stats={matchResultData.stats}
                    events={matchResultData.events}
                    onProceed={() => navigateTo('interview')}
                    onSkip={handleSkipInterview}
                />
            )}

            {currentView === 'interview' && matchResultData && (
                <PostMatchInterview 
                    result={matchResultData.homeScore > matchResultData.awayScore ? (matchResultData.homeTeam.id === myTeam?.id ? 'WIN' : 'LOSS') : matchResultData.homeScore < matchResultData.awayScore ? (matchResultData.homeTeam.id === myTeam?.id ? 'LOSS' : 'WIN') : 'DRAW'}
                    onClose={handleSkipInterview}
                    onComplete={handleInterviewComplete}
                    events={matchResultData.events}
                    homeTeam={matchResultData.homeTeam}
                    awayTeam={matchResultData.awayTeam}
                    myTeamId={myTeam?.id || ''}
                    managerTrust={gameState.manager?.trust.players || 50}
                />
            )}

            {/* Modals that can appear on top of other views */}
            {selectedFixtureForDetail && (
                <MatchDetailModal 
                    fixture={selectedFixtureForDetail} 
                    teams={gameState.teams} 
                    onClose={() => setSelectedFixtureForDetail(null)} 
                />
            )}

            {selectedFixtureInfo && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setSelectedFixtureInfo(null)}>
                    <div className="w-full max-w-md h-full" onClick={e => e.stopPropagation()}>
                        <FixtureDetailPanel 
                            fixture={selectedFixtureInfo}
                            homeTeam={gameState.teams.find(t => t.id === selectedFixtureInfo.homeTeamId)!}
                            awayTeam={gameState.teams.find(t => t.id === selectedFixtureInfo.awayTeamId)!}
                            allFixtures={gameState.fixtures}
                            onClose={() => setSelectedFixtureInfo(null)}
                            variant="modal"
                            myTeamId={gameState.myTeamId!}
                            onTeamClick={handleShowTeamDetail} // Pass handler for clicking teams in modal
                        />
                    </div>
                </div>
            )}

        </Dashboard>
    );
};

export default MainContent;