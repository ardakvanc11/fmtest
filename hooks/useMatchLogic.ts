import React from 'react';
import { MatchEvent, MatchStats, GameState } from '../types';
import { simulateBackgroundMatch, processMatchPostGame, generateMatchTweets, calculateRatingsFromEvents, determineMVP } from '../utils/gameEngine';

export const useMatchLogic = (
    gameState: GameState,
    // Add comment above the fix
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    navigation: any,
    coreSetters: any
) => {

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
             coreSetters.setGameOverReason("Yönetim kurulu acil toplantısı sonrası görevine son verildi. Gerekçe: Başarısız sonuçlar ve güven kaybı.");
             navigation.setViewHistory(['game_over']);
             navigation.setHistoryIndex(0);
        } else if (updatedManager.trust.fans < 35) {
             coreSetters.setGameOverReason("Taraftar baskısı dayanılmaz hale geldi. Yönetim, taraftarların isteği üzerine sözleşmeni feshetti.");
             navigation.setViewHistory(['game_over']);
             navigation.setHistoryIndex(0);
        }

        setGameState(prev => ({ ...prev, fixtures: updatedFixtures, teams: teamsWithUpdatedStats, manager: updatedManager, news: [...matchTweets, ...prev.news] }));
        coreSetters.setMatchResultData({ homeTeam: homeTeam, awayTeam: awayTeam, homeScore: hScore, awayScore: aScore, stats: updatedStats, events: events });
        
        // Manual history push for match result to preserve flow
        const newHistory = navigation.viewHistory.slice(0, navigation.historyIndex);
        newHistory.push('match_result');
        navigation.setViewHistory(newHistory);
        navigation.setHistoryIndex(newHistory.length - 1);
    };

    const handleFastSimulate = () => {
        const currentFixture = gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played);
        if (!currentFixture || !gameState.myTeamId) return;
        const homeTeam = gameState.teams.find(t => t.id === currentFixture.homeTeamId)!;
        const awayTeam = gameState.teams.find(t => t.id === currentFixture.awayTeamId)!;
        const { homeScore, awayScore, stats, events } = simulateBackgroundMatch(homeTeam, awayTeam);
        handleMatchFinish(homeScore, awayScore, events, stats);
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
        navigation.navigateTo('home');
        coreSetters.setMatchResultData(null);
    };

    const handleSkipInterview = () => {
        if (!gameState.manager) return;
        const newManager = { ...gameState.manager };
        newManager.trust.media = Math.max(0, newManager.trust.media - 3);
        setGameState(prev => ({ ...prev, manager: newManager }));
        navigation.navigateTo('home');
        coreSetters.setMatchResultData(null);
    };

    return {
        handleMatchFinish,
        handleFastSimulate,
        handleInterviewComplete,
        handleSkipInterview
    };
};