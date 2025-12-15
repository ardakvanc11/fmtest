

import { Player, Team, Position } from '../types';
import { generatePlayer } from '../constants';
import { getGameDate } from './calendarAndFixtures';
import { calculateTeamStrength } from './teamCalculations';

export const generateTransferMarket = (count: number, week: number): Player[] => {
    const players: Player[] = [];
    const { month } = getGameDate(week);
    const priceMultiplier = month === 0 ? 1.5 : 1.0;

    for(let i=0; i<count; i++) {
        // Detailed positions for transfer market
        const positions = [
            Position.GK, 
            Position.STP, Position.STP, Position.SLB, Position.SGB,
            Position.OS, Position.OS, Position.OOS, 
            Position.SLK, Position.SGK, Position.SNT
        ];
        const randomPos = positions[Math.floor(Math.random() * positions.length)];
        
        // 80% chance for low tier (40-65), 20% chance for high tier (70-85)
        const isStar = Math.random() > 0.8;
        const targetSkill = isStar 
            ? Math.floor(Math.random() * 16) + 70 // 70-85
            : Math.floor(Math.random() * 26) + 40; // 40-65

        const player = generatePlayer(randomPos, targetSkill, 'free_agent');
        
        let marketValue = (player.value * (0.8 + Math.random() * 0.4));
        marketValue = marketValue * priceMultiplier;
        
        player.value = Number(marketValue.toFixed(1));
        players.push(player);
    }
    return players;
};

export const applyTraining = (team: Team, type: 'ATTACK' | 'DEFENSE' | 'PHYSICAL'): Team => {
    const updatedPlayers = team.players.map(p => {
        const improve = Math.random() > 0.4; // 60% chance for improve
        if (!improve) return p;

        let stats = { ...p.stats };
        let skill = p.skill;
        let morale = p.morale;

        if (type === 'ATTACK') {
            stats.shooting = Math.min(99, stats.shooting + 1);
            stats.finishing = Math.min(99, stats.finishing + 1);
            stats.passing = Math.min(99, stats.passing + 1);
            if(Math.random() > 0.8) skill = Math.min(99, skill + 1);
        } else if (type === 'DEFENSE') {
            stats.defending = Math.min(99, stats.defending + 1);
            stats.heading = Math.min(99, stats.heading + 1);
            stats.physical = Math.min(99, stats.physical + 1);
            if(Math.random() > 0.8) skill = Math.min(99, skill + 1);
        } else if (type === 'PHYSICAL') {
            stats.pace = Math.min(99, stats.pace + 1);
            stats.stamina = Math.min(99, stats.stamina + 1);
            morale = Math.min(100, morale + 5); // Physical training boosts morale/team spirit
        }

        return { ...p, stats, skill, morale };
    });

    const newTeam = { ...team, players: updatedPlayers };
    newTeam.strength = calculateTeamStrength(newTeam);
    return newTeam;
};