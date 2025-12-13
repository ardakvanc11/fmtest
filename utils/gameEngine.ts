
import { Team, Player, Fixture, Position, MatchEvent, MatchStats, NewsItem, PlayerPerformance, BettingOdds, Tackling, Message } from '../types';
import { generateId, generatePlayer, INJURY_TYPES } from '../constants';
import { FAN_NAMES, DERBY_TWEETS_WIN, DERBY_TWEETS_LOSS, FAN_TWEETS_WIN, FAN_TWEETS_LOSS, FAN_TWEETS_DRAW } from '../data/tweetPool';
import { MATCH_INFO_MESSAGES } from '../data/infoPool';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';

// --- HELPERS ---

// Replaces placeholders like {player} with values from data object
const fillTemplate = (template: string, data: Record<string, string>) => {
    return template.replace(/{(\w+)}/g, (_, k) => data[k] || `{${k}}`);
};

// Pick random item from array
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// --- RATINGS CALCULATOR ---
export const calculateRating = (
    position: Position,
    goals: number,
    assists: number,
    yellowCards: number,
    redCards: number,
    goalsConceded: number,
    matchResult: 'WIN' | 'DRAW' | 'LOSS'
): number => {
    // Base rating
    let rating = 6.0;

    // 1. Position Weights for Goals & Assists
    let goalWeight = 0;
    let assistWeight = 0;

    switch (position) {
        case Position.FWD:
            goalWeight = 1.0;
            assistWeight = 0.6;
            break;
        case Position.MID:
            goalWeight = 0.9;
            assistWeight = 0.7;
            break;
        case Position.DEF:
        case Position.GK:
            goalWeight = 0.8;
            assistWeight = 0.5;
            break;
    }

    rating += (goals * goalWeight);
    rating += (assists * assistWeight);

    // 2. Match Result Impact
    if (matchResult === 'WIN') rating += 0.3;
    else if (matchResult === 'LOSS') rating -= 0.3;
    // Draw is +0.0

    // 3. Defensive Bonuses & Penalties (GK & DEF Only)
    if (position === Position.GK || position === Position.DEF) {
        if (goalsConceded === 0) {
            // Clean Sheet Bonus
            if (position === Position.GK) rating += 1.5;
            else rating += 0.5;
        } else {
            // Penalty per goal conceded
            const penaltyPerGoal = position === Position.GK ? 0.2 : 0.1;
            rating -= (goalsConceded * penaltyPerGoal);
        }
    }

    // 4. Discipline Penalties
    rating -= (yellowCards * 0.3);
    rating -= (redCards * 1.2);

    // 5. Random Fluctuation (Simulate "contribution without stats")
    // Adds a random value between -0.2 and +0.4
    const randomFluctuation = (Math.random() * 0.6) - 0.2;
    rating += randomFluctuation;

    // Clamp rating between 1.0 and 10.0
    return Math.max(1.0, Math.min(10.0, Number(rating.toFixed(1))));
};

export const calculateRatingsFromEvents = (
    homeTeam: Team, 
    awayTeam: Team, 
    events: MatchEvent[], 
    homeScore: number, 
    awayScore: number
): { homeRatings: PlayerPerformance[], awayRatings: PlayerPerformance[] } => {
    
    const calculateForTeam = (team: Team, isHome: boolean): PlayerPerformance[] => {
        const myScore = isHome ? homeScore : awayScore;
        const oppScore = isHome ? awayScore : homeScore;
        
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        if (myScore > oppScore) result = 'WIN';
        else if (myScore < oppScore) result = 'LOSS';

        // Only First 11 gets ratings usually, but we check everyone who had an event
        // For simplicity in this engine, we assume the first 11 played.
        const lineup = team.players.slice(0, 11);

        return lineup.map(player => {
            const playerEvents = events.filter(e => e.teamName === team.name);
            
            const goals = playerEvents.filter(e => e.type === 'GOAL' && e.scorer === player.name).length;
            const assists = playerEvents.filter(e => e.type === 'GOAL' && e.assist === player.name).length;
            const yellowCards = playerEvents.filter(e => e.type === 'CARD_YELLOW' && e.playerId === player.id).length;
            const redCards = playerEvents.filter(e => e.type === 'CARD_RED' && e.playerId === player.id).length;
            
            const rating = calculateRating(
                player.position,
                goals,
                assists,
                yellowCards,
                redCards,
                oppScore, // Goals Conceded
                result
            );

            return {
                playerId: player.id,
                name: player.name,
                position: player.position,
                rating,
                goals,
                assists
            };
        });
    };

    return {
        homeRatings: calculateForTeam(homeTeam, true),
        awayRatings: calculateForTeam(awayTeam, false)
    };
};

export const determineMVP = (homeRatings: PlayerPerformance[], awayRatings: PlayerPerformance[]): { id: string, name: string } => {
    const allPlayers = [...homeRatings, ...awayRatings];
    
    // Sort logic: Rating > Goals > Assists
    allPlayers.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.assists - a.assists;
    });

    const best = allPlayers[0];
    return {
        id: best?.playerId || '',
        name: best?.name || 'Bilinmiyor'
    };
};

// --- DATE & CALENDAR SYSTEM ---

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

// --- GAME LOGIC ---

export const calculateTeamStrength = (team: Team): number => {
    const xi = team.players.slice(0, 11);
    
    if (xi.length === 0) return 0;
    
    let totalSkill = 0;

    xi.forEach((p, index) => {
        // Injury Check
        if (p.injury && !p.hasInjectionForNextMatch) {
            // Injured player in XI contributes 0 strength (huge penalty)
            totalSkill += 0;
            return;
        }

        if (p.suspendedUntilWeek && p.suspendedUntilWeek > 0) { 
             totalSkill += 0; 
             return;
        }

        let effectiveSkill = p.skill;

        if (index === 0) {
            if (p.position !== Position.GK) effectiveSkill = effectiveSkill * 0.1; 
        } else {
            if (p.position === Position.GK) effectiveSkill = effectiveSkill * 0.5;
        }

        totalSkill += effectiveSkill;
    });
    
    let baseStrength = totalSkill / 11;
    const moraleFactor = 1 + ((team.morale - 50) / 500); 
    
    return baseStrength * moraleFactor;
};

export const calculateForm = (teamId: string, fixtures: Fixture[]): string[] => {
    const played = fixtures
        .filter(f => f.played && (f.homeTeamId === teamId || f.awayTeamId === teamId))
        .sort((a, b) => b.week - a.week)
        .slice(0, 5);

    return played.map(f => {
        if (f.homeTeamId === teamId) {
            return f.homeScore! > f.awayScore! ? 'W' : f.homeScore! === f.awayScore! ? 'D' : 'L';
        } else {
            return f.awayScore! > f.homeScore! ? 'W' : f.awayScore! === f.homeScore! ? 'D' : 'L';
        }
    }).reverse(); 
};

export const calculateOdds = (home: Team, away: Team): BettingOdds => {
    const hStr = calculateTeamStrength(home) + 5; // Home advantage
    const aStr = calculateTeamStrength(away);
    
    if (hStr + aStr === 0) return { home: 1, draw: 1, away: 1 };

    const total = hStr + aStr;
    
    // Dynamic Draw Probability calculation
    // Determines how "close" the teams are. 1 = Equal, 0 = Infinite difference.
    const strengthRatio = Math.min(hStr, aStr) / Math.max(hStr, aStr); 
    
    // Draw probability scales with closeness
    // Ranges from ~15% (huge mismatch) to ~30% (equal teams)
    const dProb = 0.15 + (0.15 * strengthRatio);

    const remainingProb = 1 - dProb;
    
    const hProb = (hStr / total) * remainingProb;
    const aProb = (aStr / total) * remainingProb;

    // House edge (margin)
    const margin = 1.12;

    // Helper to format
    const fmt = (p: number) => {
        const val = margin / p;
        return Number(Math.max(1.01, val).toFixed(2));
    };

    return {
        home: fmt(hProb),
        draw: fmt(dProb),
        away: fmt(aProb)
    };
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

// Used for instant simulation generation where we don't have events yet
const generateRandomPlayerRatings = (players: Player[], teamGoals: number, isWinner: boolean): PlayerPerformance[] => {
    const lineup = [...players].slice(0, 11); 
    
    return lineup.map(p => {
        let rating = 6.0 + (Math.random() * 2.0); 
        if (isWinner) rating += 0.5;
        rating += (p.skill / 200); 
        if (Math.random() > 0.8) rating += 1.0;
        rating = Math.min(10, Number(rating.toFixed(1)));

        return {
            playerId: p.id,
            name: p.name,
            position: p.position,
            rating,
            goals: 0, 
            assists: 0
        };
    });
};

const generateMatchStats = (homePlayers: Player[], awayPlayers: Player[], hScore: number, aScore: number): MatchStats => {
    // Initial random ratings for instant sim (will be overwritten if events are generated later)
    const homeRatings = generateRandomPlayerRatings(homePlayers, hScore, hScore > aScore);
    const awayRatings = generateRandomPlayerRatings(awayPlayers, aScore, aScore > hScore);

    const hStr = calculateTeamStrength({ players: homePlayers, morale: 50 } as any);
    const aStr = calculateTeamStrength({ players: awayPlayers, morale: 50 } as any);

    let homePossession = 50 + ((hStr - aStr) / 2);
    homePossession = Math.min(80, Math.max(20, homePossession + (Math.random() * 10 - 5)));
    
    const hShots = hScore + Math.floor(Math.random() * 5) + (hStr > aStr ? 3 : 1);
    const aShots = aScore + Math.floor(Math.random() * 5) + (aStr > hStr ? 3 : 1);
    
    const hTarget = Math.min(hShots, hScore + Math.floor(Math.random() * (hShots - hScore)));
    const aTarget = Math.min(aShots, aScore + Math.floor(Math.random() * (aShots - aScore)));

    const hCorners = Math.floor(Math.random() * 8) + (hStr > aStr ? 2 : 0);
    const aCorners = Math.floor(Math.random() * 8) + (aStr > hStr ? 2 : 0);
    
    const hFouls = Math.floor(Math.random() * 15);
    const aFouls = Math.floor(Math.random() * 15);

    // DETERMINISTIC MVP SELECTION
    const mvpInfo = determineMVP(homeRatings, awayRatings);

    return {
        homePossession: Math.round(homePossession),
        awayPossession: Math.round(100 - homePossession),
        homeShots: hShots,
        awayShots: aShots,
        homeShotsOnTarget: hTarget,
        awayShotsOnTarget: aTarget,
        homeCorners: hCorners,
        awayCorners: aCorners,
        homeFouls: hFouls,
        awayFouls: aFouls,
        homeOffsides: Math.floor(Math.random() * 5),
        awayOffsides: Math.floor(Math.random() * 5),
        homeYellowCards: Math.floor(Math.random() * 3),
        awayYellowCards: Math.floor(Math.random() * 3),
        homeRedCards: 0,
        awayRedCards: 0,
        mvpPlayerId: mvpInfo.id,
        mvpPlayerName: mvpInfo.name,
        homeRatings,
        awayRatings
    };
};

export const getEmptyMatchStats = (): MatchStats => ({
    homePossession: 50, awayPossession: 50,
    homeShots: 0, awayShots: 0,
    homeShotsOnTarget: 0, awayShotsOnTarget: 0,
    homeCorners: 0, awayCorners: 0,
    homeFouls: 0, awayFouls: 0,
    homeOffsides: 0, awayOffsides: 0,
    homeYellowCards: 0, awayYellowCards: 0,
    homeRedCards: 0, awayRedCards: 0,
    mvpPlayerId: '', mvpPlayerName: '',
    homeRatings: [], awayRatings: []
});

export const simulateMatchInstant = (home: Team, away: Team): { homeScore: number, awayScore: number, stats: MatchStats } => {
    const homeStr = calculateTeamStrength(home) + 5; 
    const awayStr = calculateTeamStrength(away);
    const luckHome = Math.random() * 20;
    const luckAway = Math.random() * 20;
    const diff = (homeStr + luckHome) - (awayStr + luckAway);
    
    let homeScore = 0;
    let awayScore = 0;
    
    if (diff > 15) { homeScore = Math.floor(Math.random() * 4) + 2; awayScore = Math.floor(Math.random() * 2); }
    else if (diff > 5) { homeScore = Math.floor(Math.random() * 3) + 1; awayScore = Math.floor(Math.random() * 2); }
    else if (diff < -15) { homeScore = Math.floor(Math.random() * 2); awayScore = Math.floor(Math.random() * 4) + 2; }
    else if (diff < -5) { homeScore = Math.floor(Math.random() * 2); awayScore = Math.floor(Math.random() * 3) + 1; }
    else { homeScore = Math.floor(Math.random() * 3); awayScore = Math.floor(Math.random() * 3); }
    
    const stats = generateMatchStats(home.players, away.players, homeScore, awayScore);

    return { homeScore, awayScore, stats };
};

// --- RICH MATCH EVENTS (VAR, CARDS, DRAMA, INJURIES) ---

export const simulateMatchStep = (minute: number, home: Team, away: Team, currentScore: {h:number, a:number}): MatchEvent | null => {
    // Frequency: Events happen in ~55% of minutes
    if (Math.random() > 0.55) return null; 

    const homeStr = calculateTeamStrength(home) + 5;
    const awayStr = calculateTeamStrength(away);
    const total = homeStr + awayStr;
    const homeDominance = homeStr / total;
    const eventRoll = Math.random();

    // Check Aggression Settings
    const isHomeAggressive = home.tackling === Tackling.AGGRESSIVE;
    const isAwayAggressive = away.tackling === Tackling.AGGRESSIVE;

    const getPlayer = (team: Team, includeGK = false) => {
        const xi = team.players.slice(0, 11);
        const pool = includeGK ? xi : xi.filter(p => p.position !== Position.GK);
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const getScorer = (team: Team) => {
        const xi = team.players.slice(0, 11);
        const fwds = xi.filter(p => p.position === Position.FWD);
        const mids = xi.filter(p => p.position === Position.MID);
        let scorerPool = [...fwds, ...fwds, ...fwds, ...mids, ...mids, ...xi];
        const scorer = scorerPool[Math.floor(Math.random() * scorerPool.length)];
        let assist = xi[Math.floor(Math.random() * xi.length)];
        if(assist.id === scorer.id) assist = xi.find(p => p.id !== scorer.id) || assist;
        return { scorer, assist };
    };

    /* 
       DISTRIBUTION PLAN (Cumulative):
       GOAL:    0.00 - 0.05 (5%)
       INJURY:  0.05 - 0.06 (1%)
       CARDS:   0.06 - 0.10 (4%)
       SAVE:    0.10 - 0.17 (7%)
       OFFSIDE: 0.17 - 0.28 (11%)
       CORNER:  0.28 - 0.41 (13%)
       MISS:    0.41 - 0.59 (18%)
       INFO:    0.59 - 1.00 (41%)
    */

    // 1. GOAL (5%)
    if (eventRoll < 0.05) { 
        const isHome = Math.random() < homeDominance;
        const activeTeam = isHome ? home : away;
        const d = getScorer(activeTeam);
        
        const text = fillTemplate(pick(GOAL_TEXTS), { scorer: d.scorer.name, assist: d.assist.name, team: activeTeam.name });

        // VAR CHECK Logic
        // Modified: Return GOAL type always, attach varOutcome for UI to handle the delay/reveal
        let varOutcome: 'GOAL' | 'NO_GOAL' | undefined = undefined;
        if (Math.random() < 0.25) { 
            varOutcome = Math.random() > 0.3 ? 'GOAL' : 'NO_GOAL'; 
        }

        return { 
            minute, 
            description: text, 
            type: 'GOAL', 
            teamName: activeTeam.name, 
            scorer: d.scorer.name, 
            assist: d.assist.name,
            varOutcome: varOutcome
        };
    } 
    // 2. INJURY (1%)
    else if (eventRoll < 0.06) {
        const isHomeInj = Math.random() > 0.5;
        const opponentIsAggressive = isHomeInj ? isAwayAggressive : isHomeAggressive;
        const activeTeam = isHomeInj ? home : away;
        const player = getPlayer(activeTeam, true);
        const injuryType = INJURY_TYPES[Math.floor(Math.random() * INJURY_TYPES.length)];
        
        return {
            minute,
            description: `${player.name} (${activeTeam.name}) acı içinde yerde! ${opponentIsAggressive ? 'Rakibin sert müdahalesi!' : 'Ters bastı.'} Sakatlık: ${injuryType.type}`,
            type: 'INJURY',
            teamName: activeTeam.name,
            playerId: player.id
        };
    }
    // 3. FOULS & CARDS (4%)
    else if (eventRoll < 0.10) {
        const isHomeFoul = Math.random() > homeDominance;
        const foulingTeam = isHomeFoul ? home : away;
        const fouledTeam = isHomeFoul ? away : home;
        const isAggressive = isHomeFoul ? isHomeAggressive : isAwayAggressive;
        const player = getPlayer(foulingTeam);
        const victim = getPlayer(fouledTeam);

        const cardRoll = Math.random();
        const yellowThreshold = isAggressive ? 0.45 : 0.25;
        const redThreshold = isAggressive ? 0.10 : 0.05;

        if (cardRoll < redThreshold) { 
             return { minute, description: `${player.name} ${isAggressive ? 'topla alakası olmayan gaddarca' : 'yaptığı'} hareket sonrası direkt KIRMIZI KART gördü!`, type: 'CARD_RED', teamName: foulingTeam.name, playerId: player.id };
        } else if (cardRoll < yellowThreshold) { 
             const pool = isAggressive ? YELLOW_CARD_AGGRESSIVE_TEXTS : YELLOW_CARD_TEXTS;
             const text = fillTemplate(pick(pool), { player: player.name });
             return { minute, description: text, type: 'CARD_YELLOW', teamName: foulingTeam.name, playerId: player.id };
        } else {
             const text = fillTemplate(pick(FOUL_TEXTS), { player: player.name, victim: victim.name });
             return { minute, description: text, type: 'FOUL', teamName: foulingTeam.name };
        }
    }
    // 4. SAVE (7%)
    else if (eventRoll < 0.17) {
         const isHomeSave = Math.random() > homeDominance; 
         const savingTeam = isHomeSave ? away : home; // Defender
         const attackingTeam = isHomeSave ? home : away;
         const keeper = savingTeam.players.find(p => p.position === Position.GK) || savingTeam.players[0];
         const defender = getPlayer(savingTeam);
         const attacker = getPlayer(attackingTeam);

         const text = fillTemplate(pick(SAVE_TEXTS), { keeper: keeper.name, defender: defender.name, attacker: attacker.name });
         return { minute, description: text, type: 'SAVE', teamName: savingTeam.name };
    }
    // 5. OFFSIDE (11%)
    else if (eventRoll < 0.28) {
         const activeTeam = Math.random() < homeDominance ? home : away;
         const player = getPlayer(activeTeam);
         const text = fillTemplate(pick(OFFSIDE_TEXTS), { player: player.name });
         return { minute, description: text, type: 'OFFSIDE', teamName: activeTeam.name };
    }
    // 6. CORNERS (13%)
    else if (eventRoll < 0.41) {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const player = getPlayer(activeTeam);
        const text = fillTemplate(pick(CORNER_TEXTS), { player: player.name, team: activeTeam.name });
        return { minute, description: text, type: 'CORNER', teamName: activeTeam.name };
    }
    // 7. MISS (18%)
    else if (eventRoll < 0.59) {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const defenderTeam = activeTeam.id === home.id ? away : home;
        const player = getPlayer(activeTeam);
        const defender = getPlayer(defenderTeam);

        const text = fillTemplate(pick(MISS_TEXTS), { player: player.name, defender: defender.name });
        return { minute, description: text, type: 'MISS', teamName: activeTeam.name };
    }
    // 8. INFO (~41%)
    else {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const opponentTeam = activeTeam.id === home.id ? away : home;
        const player = getPlayer(activeTeam);
        const opponentPlayer = getPlayer(opponentTeam);

        const text = fillTemplate(pick(MATCH_INFO_MESSAGES), { player: player.name, opponent: opponentPlayer.name, team: activeTeam.name });
        return { minute, description: text, type: 'INFO' };
    }
}

export const generateTransferMarket = (count: number, week: number): Player[] => {
    const players: Player[] = [];
    const { month } = getGameDate(week);
    const priceMultiplier = month === 0 ? 1.5 : 1.0;

    for(let i=0; i<count; i++) {
        const positions = [Position.GK, Position.DEF, Position.MID, Position.FWD];
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

// --- FAN TWEETS LOGIC ---

// Rivalry Definitions
const RIVALRIES = [
    ['Ayıboğanspor SK', 'Kedispor'],
    ['Kedispor', 'Eşşekboğanspor FK'],
    ['Eşşekboğanspor FK', 'Ayıboğanspor SK'],
    ['Kedispor', 'Köpekspor'],
    ['Bedirspor', 'Yakhubspor']
];

export const generateMatchTweets = (fixture: Fixture, teams: Team[], isUserTeam: boolean = false): NewsItem[] => {
    const home = teams.find(t => t.id === fixture.homeTeamId);
    const away = teams.find(t => t.id === fixture.awayTeamId);
    
    if (!home || !away || fixture.homeScore === null || fixture.awayScore === null) return [];

    const isDerby = RIVALRIES.some(pair => 
        (pair.includes(home.name) && pair.includes(away.name))
    );

    const tweets: NewsItem[] = [];
    const tweetCount = isUserTeam ? 4 : (isDerby ? 3 : 2); 

    const getRandomFan = () => FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
    
    // Shuffle helper to avoid consecutive duplicates
    const shuffle = (array: string[]) => array.sort(() => 0.5 - Math.random());

    let homePool: string[] = [];
    let awayPool: string[] = [];
    
    // Merge standard and derby tweets if it's a derby
    const winSource = isDerby ? [...DERBY_TWEETS_WIN, ...DERBY_TWEETS_WIN, ...FAN_TWEETS_WIN] : [...FAN_TWEETS_WIN];
    const lossSource = isDerby ? [...DERBY_TWEETS_LOSS, ...DERBY_TWEETS_LOSS, ...FAN_TWEETS_LOSS] : [...FAN_TWEETS_LOSS];
    const drawSource = [...FAN_TWEETS_DRAW];

    if (fixture.homeScore > fixture.awayScore) {
        // Home Won: Home fans Happy, Away fans Angry
        homePool = shuffle(winSource);
        awayPool = shuffle(lossSource);
    } else if (fixture.homeScore < fixture.awayScore) {
        // Away Won: Home fans Angry, Away fans Happy
        homePool = shuffle(lossSource);
        awayPool = shuffle(winSource);
    } else {
        // Draw: Both mixed
        homePool = shuffle(drawSource);
        awayPool = shuffle(drawSource);
    }

    // We alternate creating tweets for home and away fans to keep the feed diverse
    for (let i = 0; i < tweetCount; i++) {
        // Even index = Home Fan Tweet, Odd index = Away Fan Tweet
        const isHomeFan = i % 2 === 0;
        
        const fan = getRandomFan();
        const content = isHomeFan ? homePool[i % homePool.length] : awayPool[i % awayPool.length];
        const fanTeam = isHomeFan ? home : away;
        
        // Format: "Name|Handle|TeamName" to pass structure to UI
        const fanTitle = `${fan.name}|${fan.handle}|${fanTeam.name}`;

        tweets.push({
            id: generateId(),
            week: fixture.week,
            type: 'MATCH', // Re-using MATCH type for tweets related to matches
            title: fanTitle, 
            content: content
        });
    }

    return tweets;
};

export const generateWeeklyNews = (week: number, fixtures: Fixture[], teams: Team[], myTeamId?: string | null): NewsItem[] => {
    const socialFeed: NewsItem[] = [];
    
    // Filter for played matches this week
    const playedFixtures = fixtures.filter(f => f.week === week && f.played);

    playedFixtures.forEach(fixture => {
        // If it's the user's match, skip it because tweets were generated instantly after match
        if (myTeamId && (fixture.homeTeamId === myTeamId || fixture.awayTeamId === myTeamId)) {
            return;
        }

        // For other computer matches, generate tweets
        const matchTweets = generateMatchTweets(fixture, teams, false);
        socialFeed.push(...matchTweets);
    });

    // --- TRANSFER WINDOW FAN REACTIONS ---
    if (isTransferWindowOpen(week)) {
        
        // 1. Generic Rumors & Demands
        const genericRumors = [
            "Yönetim uyuma transfer yap! Takımın takviyeye ihtiyacı var.",
            "Orta saha çöktü, transfer lazım!",
            "Bir tane golcü almamız şart!",
            "Bu takıma 10 numara lazım, oyun kuramıyoruz.",
            "Savunma evlere şenlik, stoper alın.",
            "Kanatlar çalışmıyor, hızlı bir açık oyuncusu şart.",
            "Transfer dönemi bitiyor hala ses yok, sabrımız taşıyor.",
            "Genç yeteneklere yönelmemiz lazım.",
            "Yıldız transferi bekliyoruz başkan!",
            "Başkan, kasayı açma zamanı geldi!",
            "Bir tane oyun kurucu getirseniz yeter lan SİKERİM BÖYLE YÖNETİMİ!",
            "Transfer istiyoruz, açıklama değil!",
            "Bu takıma lider stoper lazım.",
            "Transfer yoksa başarı da yok.",
            "Başkan bu taraftarın sabrı kalmadı.",
            "Genç değil direkt oynayacak adam lazım!",
            "Rakipler çağı yakaladı biz hala bekliyoruz.",
            "Lige damga vuracak bir yıldız lazım.",
            "Yönetim bu transfer işini ciddiye alsın.",
        ];

        // Only generate user-specific transfer demands if user team is known
        if (myTeamId) {
            const myTeam = teams.find(t => t.id === myTeamId);
            const myLastFixture = playedFixtures.find(f => f.homeTeamId === myTeamId || f.awayTeamId === myTeamId);

            if (myTeam) {
                const fan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                
                // Logic 1: Bad Performance Targeting
                if (myLastFixture && myLastFixture.stats) {
                    const myRatings = myLastFixture.homeTeamId === myTeamId ? myLastFixture.stats.homeRatings : myLastFixture.stats.awayRatings;
                    // Find a player with bad rating (< 6.0)
                    const badPlayer = myRatings.find(p => p.rating < 6.0);
                    
                    if (badPlayer && Math.random() > 0.5) {
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan.name}|${fan.handle}|${myTeam.name}`,
                            content: `${badPlayer.name} bu takımın oyuncusu değil. Derhal gönderilmeli ve yerine adam alınmalı!`
                        });
                    }
                }

                // Logic 2: Need Striker (If scored 0 goals in last match)
                if (myLastFixture) {
                    const myScore = myLastFixture.homeTeamId === myTeamId ? myLastFixture.homeScore : myLastFixture.awayScore;
                    if (myScore === 0 && Math.random() > 0.6) {
                        const fan2 = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan2.name}|${fan2.handle}|${myTeam.name}`,
                            content: "İleri uçta çoğalamıyoruz, gol yollarında etkisiziz. Acil forvet transferi şart!"
                        });
                    }
                    
                    // Logic 3: Need Defender (If conceded 2+ goals)
                    const oppScore = myLastFixture.homeTeamId === myTeamId ? myLastFixture.awayScore : myLastFixture.homeScore;
                    if (oppScore !== null && oppScore >= 2 && Math.random() > 0.6) {
                        const fan3 = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan3.name}|${fan3.handle}|${myTeam.name}`,
                            content: "Savunma yol geçen hanı oldu. Yönetim stoper almıyor mu, bizi mi sınıyor?"
                        });
                    }
                }

                // Logic 4: Don't Sell Star Player
                if (Math.random() > 0.7) {
                    const starPlayer = [...myTeam.players].sort((a,b) => b.value - a.value)[0];
                    if (starPlayer) {
                         const fan4 = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                         socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan4.name}|${fan4.handle}|${myTeam.name}`,
                            content: `${starPlayer.name} kırmızı çizgimizdir! Ona gelen teklifleri reddedin, takımı sırtlayan o.`
                        });
                    }
                }
            }
        }

        // Add a random generic rumor from another team
        if (Math.random() > 0.3) {
            const randomFan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            const content = genericRumors[Math.floor(Math.random() * genericRumors.length)];
            
            socialFeed.push({
                id: generateId(),
                week,
                type: 'TRANSFER',
                title: `${randomFan.name}|${randomFan.handle}|${randomTeam.name}`,
                content: content
            });
        }
    }

    return socialFeed.reverse(); // Newest first
};

// Process Matches: Disciplines, Injuries AND Update Season Stats
export const processMatchPostGame = (teams: Team[], events: MatchEvent[], currentWeek: number): Team[] => {
    return teams.map(team => {
        const teamEvents = events.filter(e => e.teamName === team.name);
        
        // Determine if team won based on goal events (simplified reconstruction of score)
        const myGoals = events.filter(e => e.type === 'GOAL' && e.teamName === team.name).length;
        const oppGoals = events.filter(e => e.type === 'GOAL' && e.teamName !== team.name).length;
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        if (myGoals > oppGoals) result = 'WIN';
        else if (myGoals < oppGoals) result = 'LOSS';

        const updatedPlayers = team.players.map(p => {
            let player = { ...p };

            // 1. Calculate Stats
            const goals = teamEvents.filter(e => e.type === 'GOAL' && e.scorer === p.name).length;
            const assists = teamEvents.filter(e => e.type === 'GOAL' && e.assist === p.name).length;
            const yellowCards = teamEvents.filter(e => e.type === 'CARD_YELLOW' && e.playerId === p.id).length;
            const redCards = teamEvents.filter(e => e.type === 'CARD_RED' && e.playerId === p.id).length;
            
            // 2. Calculate Rating (Deterministic)
            const matchRating = calculateRating(
                p.position,
                goals,
                assists,
                yellowCards,
                redCards,
                oppGoals, // Goals Conceded
                result
            );
            
            // 3. Update Season Stats
            player.seasonStats = {
                ...player.seasonStats,
                goals: player.seasonStats.goals + goals,
                assists: player.seasonStats.assists + assists,
                matchesPlayed: player.seasonStats.matchesPlayed + 1
            };
            
            player.seasonStats.ratings.push(matchRating);
            const sum = player.seasonStats.ratings.reduce((a, b) => a + b, 0);
            player.seasonStats.averageRating = Number((sum / player.seasonStats.ratings.length).toFixed(1));


            // 4. Reset Injection flag
            if (player.hasInjectionForNextMatch) {
                player.hasInjectionForNextMatch = false;
                if (Math.random() < 0.3 && player.injury) {
                    player.injury.weeksRemaining += 4;
                }
            }

            // 5. Decrement existing injury
            if (player.injury) {
                player.injury.weeksRemaining -= 1;
                if (player.injury.weeksRemaining <= 0) {
                    player.injury = undefined; // Healed
                }
            }

            // 6. Check new injuries from match
            const injuryEvent = teamEvents.find(e => e.type === 'INJURY' && e.playerId === p.id);
            if (injuryEvent) {
                const injuryType = INJURY_TYPES[Math.floor(Math.random() * INJURY_TYPES.length)];
                const duration = Math.floor(Math.random() * (injuryType.maxWeeks - injuryType.minWeeks)) + injuryType.minWeeks;
                player.injury = {
                    type: injuryType.type,
                    weeksRemaining: duration,
                    description: injuryType.desc
                };
            }

            // 7. Check Red Card Suspension
            const hasRed = teamEvents.some(e => e.type === 'CARD_RED' && e.playerId === p.id);
            if (hasRed) {
                player.suspendedUntilWeek = currentWeek + 2; 
            }

            return player;
        });

        return { ...team, players: updatedPlayers };
    });
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

// --- PLAYER COMPLAINTS GENERATOR ---
export const generatePlayerMessages = (week: number, myTeam: Team): Message[] => {
    const messages: Message[] = [];
    if (week < 5) return []; // Need at least 4 games to judge playing time stats

    myTeam.players.forEach(player => {
        // Don't complain if injured or suspended (they know why they aren't playing)
        if (player.injury || (player.suspendedUntilWeek && player.suspendedUntilWeek > week)) return;

        const matchesPlayed = player.seasonStats.matchesPlayed;
        // Calculate percentage played. Week-1 because current week's match might just finished or about to start.
        // We use Math.max(1) to avoid division by zero
        const totalPossibleMatches = Math.max(1, week - 1);
        const playRatio = matchesPlayed / totalPossibleMatches;

        // Logic: High skill players complain earlier. Low skill players accept bench more.
        let expectedRatio = 0.3; // Bench players expect ~30%
        if (player.skill > 80) expectedRatio = 0.75; // Star players expect ~75%
        else if (player.skill > 70) expectedRatio = 0.5; // Good players expect ~50%

        if (playRatio < expectedRatio) {
            // Random chance (e.g. 10% per week for unhappy players) to avoid spamming 10 messages at once
            // Also higher chance if morale is already low
            const complaintChance = player.morale < 70 ? 0.2 : 0.05;
            
            if (Math.random() < complaintChance) {
                const isStar = player.skill > 80;
                
                let subject = "Forma Şansı";
                let text = "Hocam, son haftalarda yeterince süre alamıyorum. Ben oynamak istiyorum.";
                let options = [
                    "Çok çalış, formayı kap.",
                    "Sıran gelecek, sabırlı ol.",
                    "Şu an kadro planlamamda yoksun."
                ];

                if (isStar) {
                    subject = "Durumum Hakkında Acil";
                    text = "Hocam, ben yedek kulübesinde oturmak için gelmedim. Eğer oynamayacaksam menajerimle konuşacağım.";
                    options = [
                        "Sen bu takımın yıldızısın, haklısın. İlk maçta sahadasın.",
                        "Kimse bu takımda formayı garanti göremez, çalışacaksın.",
                        "Kapı orada, gitmek istersen tutmam."
                    ];
                } else if (playRatio === 0) {
                    subject = "Hiç Oynamadım...";
                    text = "Hocam lig başladı ama hala siftahım yok. Bir şansı hak etmiyor muyum?";
                    options = [
                        "Kupa maçlarında şans vereceğim.",
                        "Antrenman performansın yetersiz.",
                        "Seni kiralık göndermeyi düşünüyoruz."
                    ];
                }

                messages.push({
                    id: parseInt(generateId() + Math.floor(Math.random() * 1000).toString(), 36) || Date.now() + Math.random(),
                    sender: player.name,
                    subject: subject,
                    preview: text,
                    date: 'Bugün',
                    read: false,
                    avatarColor: player.position === 'GK' ? 'bg-yellow-600' : player.position === 'DEF' ? 'bg-blue-600' : player.position === 'MID' ? 'bg-green-600' : 'bg-red-600',
                    history: [
                        { id: Date.now(), text: text, time: '09:00', isMe: false }
                    ],
                    options: options
                });
            }
        }
    });
    return messages;
};
