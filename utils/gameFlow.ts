import { Player, Team, Position } from '../types';
import { generatePlayer } from '../constants';
import { calculateTeamStrength } from './teamCalculations';

export const generateTransferMarket = (count: number, dateStr: string): Player[] => {
    const players: Player[] = [];
    const date = new Date(dateStr);
    const month = date.getMonth(); // 0 = Jan, 6 = July
    const priceMultiplier = month === 0 ? 1.5 : 1.0; // Winter transfer premium

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

        // Transfer market players can be foreign without restriction
        const player = generatePlayer(randomPos, targetSkill, 'free_agent', true);
        
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
            stats.finishing = Math.min(99, stats.finishing + 1);
            stats.technique = Math.min(99, stats.technique + 1);
            stats.passing = Math.min(99, stats.passing + 1);
            stats.offTheBall = Math.min(99, stats.offTheBall + 1);
            stats.vision = Math.min(99, stats.vision + 1);
            if(Math.random() > 0.8) skill = Math.min(99, skill + 1);
        } else if (type === 'DEFENSE') {
            stats.tackling = Math.min(99, stats.tackling + 1);
            stats.marking = Math.min(99, stats.marking + 1);
            stats.positioning = Math.min(99, stats.positioning + 1);
            stats.heading = Math.min(99, stats.heading + 1);
            stats.bravery = Math.min(99, stats.bravery + 1);
            if(Math.random() > 0.8) skill = Math.min(99, skill + 1);
        } else if (type === 'PHYSICAL') {
            stats.pace = Math.min(99, stats.pace + 1);
            stats.acceleration = Math.min(99, stats.acceleration + 1);
            stats.stamina = Math.min(99, stats.stamina + 1);
            stats.physical = Math.min(99, stats.physical + 1);
            morale = Math.min(100, morale + 5); // Physical training boosts morale/team spirit
        }

        // Sync legacy fields
        stats.shooting = stats.finishing;
        stats.defending = Math.floor((stats.marking + stats.tackling) / 2);

        return { ...p, stats, skill, morale };
    });

    const newTeam = { ...team, players: updatedPlayers };
    newTeam.strength = calculateTeamStrength(newTeam);
    return newTeam;
};