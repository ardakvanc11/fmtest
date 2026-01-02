
import { useCoreState } from './useCoreState';
import { useNavigation } from './useNavigation';
import { useGameLifecycle } from './useGameLifecycle';
import { useMatchLogic } from './useMatchLogic';
import { usePlayerActions } from './usePlayerActions';
import { useFinance } from './useFinance';
import { isTransferWindowOpen } from '../utils/calendarAndFixtures';
import { Team, Player, Fixture } from '../types';

export const useGameState = () => {
    // 1. Core State (The single source of truth)
    const core = useCoreState();

    // 2. Navigation (Handles View switching)
    const nav = useNavigation(
        (count) => core.setGameState(prev => ({ ...prev, lastSeenInjuryCount: count })),
        core.gameState
    );

    // Helpers to show details (UI setters)
    const handleShowTeamDetail = (teamId: string) => {
        const t = core.gameState.teams.find(x => x.id === teamId);
        if (t) { core.setSelectedTeamForDetail(t); nav.navigateTo('team_detail'); }
    };

    const handleShowPlayerDetail = (player: Player) => {
        core.setSelectedPlayerForDetail(player);
        nav.navigateTo('player_detail');
    };

    // 3. Sub-Hooks (Logic separated by domain)
    const lifecycle = useGameLifecycle(core.gameState, core.setGameState, nav, core);
    const matchLogic = useMatchLogic(core.gameState, core.setGameState, nav, core);
    const playerActions = usePlayerActions(core.gameState, core.setGameState, nav, core);
    const finance = useFinance(core.gameState, core.setGameState);

    // Derived State
    const myTeam = core.gameState.teams.find(t => t.id === core.gameState.myTeamId);
    const injuredBadgeCount = myTeam ? myTeam.players.filter(p => p.injury && p.injury.daysRemaining > 0).length - core.gameState.lastSeenInjuryCount : 0;

    return {
        // State
        gameState: core.gameState,
        setGameState: core.setGameState,
        viewHistory: nav.viewHistory,
        historyIndex: nav.historyIndex,
        currentView: nav.currentView,
        selectedPlayerForDetail: core.selectedPlayerForDetail,
        setSelectedPlayerForDetail: core.setSelectedPlayerForDetail,
        selectedTeamForDetail: core.selectedTeamForDetail,
        setSelectedTeamForDetail: core.setSelectedTeamForDetail,
        matchResultData: core.matchResultData,
        setMatchResultData: core.setMatchResultData,
        selectedFixtureForDetail: core.selectedFixtureForDetail,
        setSelectedFixtureForDetail: core.setSelectedFixtureForDetail,
        selectedFixtureInfo: core.selectedFixtureInfo,
        setSelectedFixtureInfo: core.setSelectedFixtureInfo,
        gameOverReason: core.gameOverReason,
        theme: core.theme,
        toggleTheme: core.toggleTheme,
        negotiatingTransferPlayer: core.negotiatingTransferPlayer,
        setNegotiatingTransferPlayer: core.setNegotiatingTransferPlayer,
        incomingTransfer: core.incomingTransfer,
        setIncomingTransfer: core.setIncomingTransfer,
        myTeam,
        injuredBadgeCount: Math.max(0, injuredBadgeCount),
        isTransferWindowOpen: isTransferWindowOpen(core.gameState.currentDate),

        // Navigation
        navigateTo: nav.navigateTo,
        goBack: nav.goBack,
        goForward: nav.goForward,

        // Handlers (Aggregated from sub-hooks)
        handleStart: lifecycle.handleStart,
        handleSelectTeam: lifecycle.handleSelectTeam,
        handleSave: lifecycle.handleSave,
        handleNewGame: lifecycle.handleNewGame,
        handleNextWeek: lifecycle.handleNextDay,
        handleRetire: lifecycle.handleRetire,
        handleTerminateContract: lifecycle.handleTerminateContract,

        handleMatchFinish: matchLogic.handleMatchFinish,
        handleFastSimulate: matchLogic.handleFastSimulate,
        handleInterviewComplete: matchLogic.handleInterviewComplete,
        handleSkipInterview: matchLogic.handleSkipInterview,

        handleTrain: playerActions.handleTrain,
        handleAssignIndividualTraining: playerActions.handleAssignIndividualTraining, // NEW
        handleToggleTrainingDelegation: playerActions.handleToggleTrainingDelegation, // Added missing handler
        handleBuyPlayer: playerActions.handleBuyPlayer,
        handleSellPlayer: playerActions.handleSellPlayer,
        handleAcceptOffer: playerActions.handleAcceptOffer,
        handleRejectOffer: playerActions.handleRejectOffer,
        handleTransferOfferSuccess: playerActions.handleTransferOfferSuccess,
        handleSignPlayer: playerActions.handleSignPlayer,
        handleReleasePlayer: playerActions.handleReleasePlayer,
        handlePlayerInteraction: playerActions.handlePlayerInteraction,
        handlePlayerUpdate: playerActions.handlePlayerUpdate,
        handleCancelTransfer: playerActions.handleCancelTransfer,
        handleMessageReply: playerActions.handleMessageReply,

        handleTakeEmergencyLoan: finance.handleTakeEmergencyLoan,
        handleUpdateSponsor: finance.handleUpdateSponsor,

        // UI Handlers
        handleShowTeamDetail,
        handleShowPlayerDetail
    };
};
