

import { Team, Fixture } from '../types';
import { generateId, GAME_CALENDAR } from '../constants';

const MONTH_NAMES = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Specific Start Dates for each of the 34 Weeks
// Month is 0-indexed (0=Jan, 7=Aug, etc.)
const WEEK_START_DATES = [
    // --- 1. YARI (2025) ---
    new Date(2025, 7, 8),   // W1: 8 Aug
    new Date(2025, 7, 15),  // W2: 15 Aug
    new Date(2025, 7, 22),  // W3: 22 Aug
    new Date(2025, 7, 29),  // W4: 29 Aug
    
    new Date(2025, 8, 5),   // W5: 5 Sep
    new Date(2025, 8, 12),  // W6: 12 Sep
    new Date(2025, 8, 19),  // W7: 19 Sep
    
    new Date(2025, 9, 6),   // W8: 6 Oct
    new Date(2025, 9, 13),  // W9: 13 Oct
    new Date(2025, 9, 27),  // W10: 27 Oct
    
    new Date(2025, 10, 2),  // W11: 2 Nov
    new Date(2025, 10, 9),  // W12: 9 Nov
    new Date(2025, 10, 16), // W13: 16 Nov
    
    new Date(2025, 11, 1),  // W14: 1 Dec
    new Date(2025, 11, 7),  // W15: 7 Dec
    new Date(2025, 11, 15), // W16: 15 Dec
    new Date(2025, 11, 22), // W17: 22 Dec

    // --- KIŞ ARASI (Ocak Boş) ---

    // --- 2. YARI (2026) ---
    new Date(2026, 1, 2),   // W18: 2 Feb
    new Date(2026, 1, 9),   // W19: 9 Feb
    new Date(2026, 1, 16),  // W20: 16 Feb
    new Date(2026, 1, 23),  // W21: 23 Feb
    
    new Date(2026, 2, 2),   // W22: 2 Mar
    new Date(2026, 2, 9),   // W23: 9 Mar
    new Date(2026, 2, 16),  // W24: 16 Mar
    new Date(2026, 2, 23),  // W25: 23 Mar
    
    new Date(2026, 3, 6),   // W26: 6 Apr
    new Date(2026, 3, 13),  // W27: 13 Apr
    new Date(2026, 3, 20),  // W28: 20 Apr
    new Date(2026, 3, 27),  // W29: 27 Apr
    
    new Date(2026, 4, 4),   // W30: 4 May
    new Date(2026, 4, 11),  // W31: 11 May
    new Date(2026, 4, 18),  // W32: 18 May
    new Date(2026, 4, 25),  // W33: 25 May
    new Date(2026, 5, 1)    // W34: 1 Jun
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
    
    if (current >= GAME_CALENDAR.START_DATE && current <= GAME_CALENDAR.SUMMER_TRANSFER_DEADLINE) {
        return true;
    }
    
    if (current >= GAME_CALENDAR.WINTER_TRANSFER_OPEN && current <= GAME_CALENDAR.WINTER_TRANSFER_CLOSE) {
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

export const generateFixtures = (teams: Team[]): Fixture[] => {
    const fixtures: Fixture[] = [];
    const teamIds = teams.map(t => t.id);
    const numTeams = teamIds.length;
    const numMatchesPerTeam = (numTeams - 1) * 2; 
    const matchesPerRound = numTeams / 2; // 18 teams -> 9 matches per week

    const rotation = [...teamIds]; 
    const fixed = rotation.shift()!;
    
    for (let round = 0; round < numMatchesPerTeam; round++) {
        // Use predefined dates, fallback to weekly if array runs out
        let baseDate = new Date(GAME_CALENDAR.LEAGUE_START_DATE);
        if (round < WEEK_START_DATES.length) {
            baseDate = new Date(WEEK_START_DATES[round]);
        } else {
            baseDate.setDate(baseDate.getDate() + (round * 7));
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