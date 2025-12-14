
import { Team, Fixture } from '../types';
import { generateId } from '../constants';

const START_DATE = new Date(2025, 6, 1); 

export const getGameDate = (week: number): { date: Date, label: string, month: number, isMatchWeek: boolean } => {
    const gameDate = new Date(START_DATE.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const monthIndex = gameDate.getMonth();
    const year = gameDate.getFullYear();
    const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    // This helper is for general info, but fixture existence dictates gameplay now
    const isMatchWeek = monthIndex !== 6 && monthIndex !== 0;

    return {
        date: gameDate,
        month: monthIndex,
        label: `${monthNames[monthIndex]} ${year} - ${week}. Hafta`,
        isMatchWeek
    };
};

export const isTransferWindowOpen = (week: number): boolean => {
    const { month } = getGameDate(week);
    return month === 6 || month === 7 || month === 0;
};

export const generateFixtures = (teams: Team[]): Fixture[] => {
    const fixtures: Fixture[] = [];
    const teamIds = teams.map(t => t.id);
    const numTeams = teamIds.length;
    const numMatchesPerTeam = (numTeams - 1) * 2; 
    
    const matchWeeks: number[] = [];
    for (let w = 5; w <= 21; w++) matchWeeks.push(w);
    for (let w = 26; w <= 42; w++) matchWeeks.push(w);

    const rotation = [...teamIds]; 
    const fixed = rotation.shift()!;
    
    for (let round = 0; round < numMatchesPerTeam; round++) {
        const weekNumber = matchWeeks[round];
        if (!weekNumber) break; 

        const roundFixtures: Fixture[] = [];
        
        const p1 = fixed;
        const p2 = rotation[rotation.length - 1];
        
        if (round % 2 === 0) roundFixtures.push(createFixture(weekNumber, p1, p2));
        else roundFixtures.push(createFixture(weekNumber, p2, p1));

        for (let i = 0; i < (rotation.length - 1) / 2; i++) {
            const t1 = rotation[i];
            const t2 = rotation[rotation.length - 2 - i];
            if (round % 2 === 0) roundFixtures.push(createFixture(weekNumber, t1, t2));
            else roundFixtures.push(createFixture(weekNumber, t2, t1));
        }

        fixtures.push(...roundFixtures);
        rotation.unshift(rotation.pop()!);
    }
    
    return fixtures.sort((a, b) => a.week - b.week);
};

const createFixture = (week: number, homeId: string, awayId: string): Fixture => ({
    id: generateId(),
    week,
    homeTeamId: homeId,
    awayTeamId: awayId,
    played: false,
    homeScore: null,
    awayScore: null
});
