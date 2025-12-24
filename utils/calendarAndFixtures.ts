
import { Team, Fixture } from '../types';
import { generateId, GAME_CALENDAR } from '../constants';

const MONTH_NAMES = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const getFormattedDate = (dateStr: string): { label: string, dateObj: Date } => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    
    return {
        dateObj: date,
        label: `${day} ${MONTH_NAMES[monthIndex]} ${year}`
    };
};

export const addDays = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

export const isTransferWindowOpen = (dateStr: string): boolean => {
    const current = new Date(dateStr);
    const year = current.getFullYear();
    const month = current.getMonth();
    const day = current.getDate();

    // Summer: July 1 to Sept 1
    // Month 6 (July), Month 7 (Aug), Month 8 (Sept) up to day 1
    if ((month === 6) || (month === 7) || (month === 8 && day <= 1)) {
        return true;
    }
    
    // Winter: Jan 1 to Feb 1
    // Month 0 (Jan), Month 1 (Feb) up to day 1
    if ((month === 0) || (month === 1 && day <= 1)) {
        return true;
    }

    return false;
};

export const isSameDay = (d1Str: string, d2Str: string): boolean => {
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
};

// Generates weekly dates dynamically for a given start year
const getSeasonDates = (startYear: number): Date[] => {
    // League Starts: August 8th roughly
    const dates = [];
    let current = new Date(startYear, 7, 8); // Aug 8

    // 1st Half: 17 Weeks
    for (let i = 0; i < 17; i++) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 7);
    }

    // Winter Break: Skip to Feb 2nd approx
    current = new Date(startYear + 1, 1, 2); // Feb 2

    // 2nd Half: 17 Weeks
    for (let i = 0; i < 17; i++) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 7);
    }

    return dates;
};

export const generateFixtures = (teams: Team[], year: number = 2025): Fixture[] => {
    const fixtures: Fixture[] = [];
    const teamIds = teams.map(t => t.id);
    const numTeams = teamIds.length;
    const numMatchesPerTeam = (numTeams - 1) * 2; 
    const matchesPerRound = numTeams / 2; // 18 teams -> 9 matches per week

    const rotation = [...teamIds]; 
    const fixed = rotation.shift()!;
    
    const seasonDates = getSeasonDates(year);
    
    for (let round = 0; round < numMatchesPerTeam; round++) {
        // Use dynamically generated dates
        let baseDate = new Date();
        if (round < seasonDates.length) {
            baseDate = new Date(seasonDates[round]);
        } else {
            // Fallback just in case
            baseDate = new Date(seasonDates[seasonDates.length - 1]);
            baseDate.setDate(baseDate.getDate() + 7);
        }

        const roundFixtures: Fixture[] = [];
        
        const p1 = fixed;
        const p2 = rotation[rotation.length - 1];
        
        if (round % 2 === 0) roundFixtures.push(createFixture(round + 1, '', p1, p2));
        else roundFixtures.push(createFixture(round + 1, '', p2, p1));

        for (let i = 0; i < (rotation.length - 1) / 2; i++) {
            const t1 = rotation[i];
            const t2 = rotation[rotation.length - 2 - i];
            if (round % 2 === 0) roundFixtures.push(createFixture(round + 1, '', t1, t2));
            else roundFixtures.push(createFixture(round + 1, '', t2, t1));
        }

        // --- SPLIT MATCHES TO 2 DAYS (50% / 50%) ---
        // 9 matches: First 5 on Day 1, Last 4 on Day 2
        const splitIndex = Math.ceil(matchesPerRound / 2); // 5
        
        roundFixtures.forEach((fix, index) => {
            const matchDate = new Date(baseDate);
            // If index is >= splitIndex, add 1 day
            if (index >= splitIndex) {
                matchDate.setDate(matchDate.getDate() + 1);
            }
            fix.date = matchDate.toISOString();
        });

        fixtures.push(...roundFixtures);
        rotation.unshift(rotation.pop()!);
    }
    
    return fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const createFixture = (week: number, date: string, homeId: string, awayId: string): Fixture => ({
    id: generateId(),
    week,
    date,
    homeTeamId: homeId,
    awayTeamId: awayId,
    played: false,
    homeScore: null,
    awayScore: null
});
