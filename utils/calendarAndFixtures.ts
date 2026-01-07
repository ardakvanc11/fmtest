

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

// USER DEFINED SPECIFIC SCHEDULE
// Month is 0-indexed (0=Jan, 7=Aug, 11=Dec)
const WEEK_DEFINITIONS = [
    // --- 1. YARI ---
    { week: 1, month: 7, day: 8 },   // 8 Aug
    { week: 2, month: 7, day: 15 },  // 15 Aug
    { week: 3, month: 7, day: 22 },  // 22 Aug
    { week: 4, month: 7, day: 29 },  // 29 Aug
    { week: 5, month: 8, day: 5 },   // 5 Sep
    { week: 6, month: 8, day: 12 },  // 12 Sep
    { week: 7, month: 8, day: 19 },  // 19 Sep
    { week: 8, month: 9, day: 6 },   // 6 Oct
    { week: 9, month: 9, day: 13 },  // 13 Oct
    { week: 10, month: 9, day: 27 }, // 27 Oct
    { week: 11, month: 10, day: 2 }, // 2 Nov
    { week: 12, month: 10, day: 9 }, // 9 Nov
    { week: 13, month: 10, day: 16 },// 16 Nov
    { week: 14, month: 11, day: 1 }, // 1 Dec
    { week: 15, month: 11, day: 7 }, // 7 Dec
    { week: 16, month: 11, day: 15 },// 15 Dec
    { week: 17, month: 11, day: 22 },// 22 Dec (Half Time)
    
    // --- 2. YARI (NEXT YEAR) ---
    { week: 18, month: 1, day: 2 },  // 2 Feb
    { week: 19, month: 1, day: 9 },  // 9 Feb
    { week: 20, month: 1, day: 16 }, // 16 Feb
    { week: 21, month: 1, day: 23 }, // 23 Feb
    { week: 22, month: 2, day: 2 },  // 2 Mar
    { week: 23, month: 2, day: 9 },  // 9 Mar
    { week: 24, month: 2, day: 16 }, // 16 Mar
    { week: 25, month: 2, day: 23 }, // 23 Mar
    { week: 26, month: 3, day: 6 },  // 6 Apr
    { week: 27, month: 3, day: 13 }, // 13 Apr
    { week: 28, month: 3, day: 20 }, // 20 Apr
    { week: 29, month: 3, day: 27 }, // 27 Apr
    { week: 30, month: 4, day: 4 },  // 4 May
    { week: 31, month: 4, day: 11 }, // 11 May
    { week: 32, month: 4, day: 18 }, // 18 May
    { week: 33, month: 4, day: 25 }, // 25 May
    { week: 34, month: 5, day: 1 },  // 1 Jun
];

// Generates specific weekly dates based on the user provided list
const getSpecificSeasonDates = (startYear: number): Date[] => {
    return WEEK_DEFINITIONS.map(def => {
        // If month is earlier than August (month < 7), it's the next year
        const year = def.month < 6 ? startYear + 1 : startYear;
        return new Date(year, def.month, def.day);
    });
};

export const generateFixtures = (teams: Team[], year: number = 2025): Fixture[] => {
    const fixtures: Fixture[] = [];
    const teamIds = teams.map(t => t.id);
    const numTeams = teamIds.length;
    const numMatchesPerTeam = (numTeams - 1) * 2; 
    const matchesPerRound = numTeams / 2; // 18 teams -> 9 matches per week

    // Round Robin Logic
    const rotation = [...teamIds]; 
    const fixed = rotation.shift()!;
    
    // Get the specific dates from the definition
    const seasonDates = getSpecificSeasonDates(year);
    
    for (let round = 0; round < numMatchesPerTeam; round++) {
        // Use dynamically generated dates
        let baseDate = new Date();
        if (round < seasonDates.length) {
            baseDate = new Date(seasonDates[round]);
        } else {
            // Safety Fallback
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
        // Matches are already randomized by the round robin rotation somewhat,
        // but splitting by index ensures distinct days.
        
        const splitIndex = Math.ceil(matchesPerRound / 2); // 9 matches -> 5 on first day, 4 on second
        
        roundFixtures.forEach((fix, index) => {
            const matchDate = new Date(baseDate);
            // If index is >= splitIndex (e.g. index 5,6,7,8), add 1 day
            if (index >= splitIndex) {
                matchDate.setDate(matchDate.getDate() + 1);
            }
            fix.date = matchDate.toISOString();
            fix.competitionId = 'LEAGUE'; // Explicitly set competition ID for league matches
        });

        fixtures.push(...roundFixtures);
        rotation.unshift(rotation.pop()!);
    }
    
    // Sort chronologically
    return fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Generates Super Cup Fixtures (Semi-Finals)
export const generateSuperCupFixtures = (teams: Team[], year: number, isInitialSeason: boolean = false): Fixture[] => {
    const fixtures: Fixture[] = [];
    
    let t1: Team | undefined, t2: Team | undefined, t3: Team | undefined, t4: Team | undefined;

    // Pick a random stadium with capacity > 30,000 for Semi Finals
    // Note: We need a pool of teams to pick stadium from.
    // In game context, we usually have access to all teams. 
    // Here we will pick one of the participants' stadium if > 30k or fallback.
    // Actually, prompt says "random stadium > 30k".
    const suitableStadiums = teams.filter(t => t.stadiumCapacity > 30000);
    const getVenue = () => {
        if (suitableStadiums.length > 0) return suitableStadiums[Math.floor(Math.random() * suitableStadiums.length)].id; // Use Team ID as venue placeholder logic or handle in simulation
        return teams[0].id; // Fallback
    };
    
    // Note: The game engine uses HomeTeam's stadium by default. 
    // For Neutral venues, we might need to handle this in simulation logic, 
    // but typically "Home Team" in fixture determines venue visually. 
    // To simulate neutral, we can assume the "Home Team" in the fixture IS the venue owner for display, 
    // but for Super Cup, usually it's Team A vs Team B at Venue C. 
    // Current architecture simplifies to Home vs Away.
    // Let's stick to Home/Away structure but acknowledge it's neutral.
    // We will just assign T1 as home, T3 as away etc.
    
    if (isInitialSeason) {
        // 1. Arıspor
        // 2. Eşşekboğanspor FK
        // 3. Köpekspor
        // 4. Kedispor (Cup Winner)
        t1 = teams.find(t => t.name === 'Arıspor');
        t2 = teams.find(t => t.name === 'Eşşekboğanspor FK');
        t3 = teams.find(t => t.name === 'Köpekspor');
        t4 = teams.find(t => t.name === 'Kedispor');
    } else {
        // Logic for subsequent seasons
        // 1. Sort by League Points (Previous Season)
        // Since we reset stats at season start, we rely on 'leagueHistory' or last season summary.
        // Assuming this function is called right at season transition where stats might be fresh OR we use a passed summary.
        // Simplified: We'll assume the `teams` array passed here has the relevant order or we find them.
        // However, in `resetForNewSeason`, stats are wiped.
        // This function is best called BEFORE reset or using a snapshot.
        // For now, let's assume teams are sorted by their `initialReputation` or power as a proxy if stats are wiped,
        // OR better: The Game Loop should pass the qualified teams explicitly.
        // But to keep signature simple, let's assume the calling code sorts `teams` passed in as [1st, 2nd, 3rd, CupWinner].
        
        if (teams.length >= 4) {
            t1 = teams[0];
            t2 = teams[1];
            t3 = teams[2];
            t4 = teams[3];
        }
    }

    if (t1 && t2 && t3 && t4) {
        // Semi 1: 1 vs 3 -> Jan 5
        // Note: Year is the "Next Year" (e.g. Start 2025 -> Jan 2026)
        const d1 = new Date(year + 1, 0, 5); // Jan 5
        fixtures.push({
            id: generateId(),
            week: 90, // Special Week ID for Super Cup
            date: d1.toISOString(),
            homeTeamId: t1.id,
            awayTeamId: t3.id,
            played: false,
            homeScore: null,
            awayScore: null,
            competitionId: 'SUPER_CUP'
        });

        // Semi 2: 2 vs 4 -> Jan 6
        const d2 = new Date(year + 1, 0, 6); // Jan 6
        fixtures.push({
            id: generateId(),
            week: 90,
            date: d2.toISOString(),
            homeTeamId: t2.id,
            awayTeamId: t4.id,
            played: false,
            homeScore: null,
            awayScore: null,
            competitionId: 'SUPER_CUP'
        });
    }

    return fixtures;
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
