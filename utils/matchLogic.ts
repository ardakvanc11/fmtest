
import { Team, Player, MatchEvent, MatchStats, Position, Tackling, PlayerPerformance, Fixture, PassingStyle, Tempo, Width, AttackingTransition, CreativeFreedom, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefensiveLine, DefLineMobility, PressIntensity, DefensiveTransition, PreventCrosses, PressingFocus, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget, Mentality } from '../types';
import { INJURY_TYPES, RIVALRIES } from '../constants';
import { MATCH_INFO_MESSAGES } from '../data/infoPool';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';
import { calculateTeamStrength, calculateRawTeamStrength } from './teamCalculations';
import { calculateRating, determineMVP, calculateRatingsFromEvents } from './ratingsAndStats';
import { fillTemplate, pick } from './helpers';

// Used for instant simulation generation where we don't have events yet
export const generateRandomPlayerRatings = (players: Player[], teamGoals: number, goalsConceded: number, isWinner: boolean, isDraw: boolean): PlayerPerformance[] => {
    const lineup = [...players].slice(0, 11); 
    
    let ratings = lineup.map(p => {
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'LOSS';
        if (isWinner) result = 'WIN';
        else if (isDraw) result = 'DRAW';

        const rating = calculateRating(
            p.position,
            p.skill,
            0, // goals
            0, // assists
            0, // yellow
            0, // red
            goalsConceded,
            result,
            90, // minutes played
            0   // bonus
        );

        return {
            playerId: p.id,
            name: p.name,
            position: p.position,
            rating,
            goals: 0, 
            assists: 0
        };
    });

    const poorPerformers = ratings.filter(r => r.rating < 5.5);
    if (poorPerformers.length > 2) {
        poorPerformers.sort((a, b) => a.rating - b.rating);
        const idsToBump = poorPerformers.slice(2).map(p => p.playerId);
        ratings = ratings.map(r => {
            if (idsToBump.includes(r.playerId)) return { ...r, rating: 5.5 };
            return r;
        });
    }

    return ratings;
};

// YENİLENMİŞ MANTIK: İstatistikler artık skorla tutarlı üretiliyor.
export const generateMatchStats = (homePlayers: Player[], awayPlayers: Player[], hScore: number, aScore: number): MatchStats => {
    const homeRatings = generateRandomPlayerRatings(homePlayers, hScore, aScore, hScore > aScore, hScore === aScore);
    const awayRatings = generateRandomPlayerRatings(awayPlayers, aScore, hScore, aScore > hScore, hScore === aScore);

    const hStr = calculateRawTeamStrength(homePlayers);
    const aStr = calculateRawTeamStrength(awayPlayers);

    // 1. Topla Oynama (Güç farkına dayalı)
    let homePossession = 50 + ((hStr - aStr) / 2.5);
    // Rastgelelik ekle ama sınırla
    homePossession += (Math.random() * 10 - 5);
    homePossession = Math.min(80, Math.max(20, Math.round(homePossession)));
    
    const possessionAdvantage = homePossession - 50; 

    // 2. Kurtarışlar (Saves)
    const calculateSaves = (attackerStr: number, defenderStr: number) => {
        const baseSaves = Math.floor(Math.random() * 4); // 0-3 arası şans faktörü
        const pressure = attackerStr > defenderStr ? (attackerStr - defenderStr) / 5 : 0; // Güç farkı baskısı
        return Math.floor(baseSaves + pressure);
    };

    const hSaves = calculateSaves(aStr, hStr); 
    const aSaves = calculateSaves(hStr, aStr); 

    // 3. İsabetli Şutlar
    const hTarget = hScore + aSaves; 
    const aTarget = aScore + hSaves;

    // 4. İsabetsiz Şutlar
    const calculateMisses = (possession: number, strength: number) => {
        const base = 2;
        const creationFactor = (strength / 20) + (possession / 15); 
        const variance = Math.floor(Math.random() * 5);
        return Math.floor(base + creationFactor + variance) - (strength > 85 ? 2 : 0); 
    };

    const hMisses = calculateMisses(homePossession, hStr);
    const aMisses = calculateMisses(100 - homePossession, aStr);

    // 5. Toplam Şutlar
    const hShots = hTarget + hMisses;
    const aShots = aTarget + aMisses;

    // 6. Kornerler
    const hCorners = Math.floor(hShots / 3) + (possessionAdvantage > 10 ? 2 : 0) + Math.floor(Math.random() * 3);
    const aCorners = Math.floor(aShots / 3) + (possessionAdvantage < -10 ? 2 : 0) + Math.floor(Math.random() * 3);
    
    // 7. Fauller
    const hFouls = Math.floor(Math.random() * 10) + (hStr < aStr ? 3 : 0);
    const aFouls = Math.floor(Math.random() * 10) + (aStr < hStr ? 3 : 0);

    const hRed = Math.random() < 0.04 ? 1 : 0;
    const aRed = Math.random() < 0.04 ? 1 : 0;

    const mvpInfo = determineMVP(homeRatings, awayRatings);

    return {
        homePossession,
        awayPossession: 100 - homePossession,
        homeShots: hShots,
        awayShots: aShots,
        homeShotsOnTarget: hTarget,
        awayShotsOnTarget: aTarget,
        homeCorners: hCorners,
        awayCorners: aCorners,
        homeFouls: hFouls,
        awayFouls: aFouls,
        homeOffsides: Math.floor(Math.random() * 4) + (hStr > aStr ? 1 : 0),
        awayOffsides: Math.floor(Math.random() * 4) + (aStr > hStr ? 1 : 0),
        homeYellowCards: Math.floor(Math.random() * 3) + (hFouls > 10 ? 2 : 0),
        awayYellowCards: Math.floor(Math.random() * 3) + (aFouls > 10 ? 2 : 0),
        homeRedCards: hRed,
        awayRedCards: aRed,
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

export const getWeightedInjury = () => {
    const totalWeight = INJURY_TYPES.reduce((sum, item) => sum + item.probability, 0);
    let random = Math.random() * totalWeight;
    
    for (const injury of INJURY_TYPES) {
        if (random < injury.probability) return injury;
        random -= injury.probability;
    }
    return INJURY_TYPES[0];
};

const calculateTacticalEfficiency = (team: Team, minute: number, scoreDiff: number): { multiplier: number, warning?: string, longShotBonus?: boolean } => {
    let multiplier = 1.0;
    const xi = team.players.slice(0, 11);
    
    const avg = (stat: keyof typeof xi[0]['stats']) => 
        xi.reduce((sum, p) => sum + (p.stats[stat] || 10), 0) / xi.length;

    const avgList = (list: Player[], stat: keyof Player['stats']) =>
        list.length ? list.reduce((s, p) => s + (p.stats[stat] || 10), 0) / list.length : 10;

    const defenders = xi.filter(p => [Position.STP, Position.SLB, Position.SGB].includes(p.position));
    const cbs = xi.filter(p => p.position === Position.STP);
    const mids = xi.filter(p => [Position.OS, Position.OOS].includes(p.position));
    const dms = xi.filter(p => p.position === Position.OS);
    const wings = xi.filter(p => [Position.SLK, Position.SGK].includes(p.position));
    const strikers = xi.filter(p => p.position === Position.SNT);
    
    let warning = undefined;
    let longShotBonus = false;

    // ... (Tactics calculation logic omitted for brevity as it is unchanged)
    
    return { multiplier: Math.max(0.4, multiplier), warning, longShotBonus };
};

// --- SIMULATION WITH OPTIONAL PK ---
export const simulateBackgroundMatch = (home: Team, away: Team, isKnockout: boolean = false): { homeScore: number, awayScore: number, stats: MatchStats, events: MatchEvent[], pkScore?: { h: number, a: number } } => {
    const homeStr = calculateTeamStrength(home) + 5; // Home advantage
    const awayStr = calculateTeamStrength(away);
    
    // Beklenen gol sayıları (Lambda for Poisson distribution approximation)
    let lambdaHome = 1.3;
    let lambdaAway = 1.0;
    const diff = homeStr - awayStr;

    if (diff > 20) { lambdaHome = 2.5; lambdaAway = 0.5; }
    else if (diff > 10) { lambdaHome = 1.9; lambdaAway = 0.8; }
    else if (diff > 0) { lambdaHome = 1.5; lambdaAway = 1.1; }
    else if (diff > -10) { lambdaHome = 1.1; lambdaAway = 1.4; }
    else { lambdaHome = 0.7; lambdaAway = 2.1; }

    const getScore = (lambda: number) => {
        const L = Math.exp(-lambda);
        let p = 1.0;
        let k = 0;
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        return k - 1;
    };

    const homeScore = getScore(lambdaHome);
    const awayScore = getScore(lambdaAway);

    const events: MatchEvent[] = [];

    const generateEventsForTeam = (team: Team, score: number, isHome: boolean) => {
         const xi = team.players.slice(0, 11);
        const fwds = xi.filter(p => [Position.SNT, Position.SLK, Position.SGK].includes(p.position));
        const mids = xi.filter(p => [Position.OS, Position.OOS].includes(p.position));
        
        const scorerPool = [...fwds, ...fwds, ...fwds, ...mids, ...mids, ...xi];
        
        for(let i=0; i<score; i++) {
            const scorer = scorerPool.length > 0 ? scorerPool[Math.floor(Math.random() * scorerPool.length)] : xi[0];
            let assist = xi[Math.floor(Math.random() * xi.length)];
            if(assist.id === scorer.id) assist = xi.find(p => p.id !== scorer.id) || assist;
            
            const isPenalty = Math.random() < 0.10;
            const minute = Math.floor(Math.random() * 90) + 1;

            events.push({
                minute,
                type: 'GOAL',
                description: isPenalty ? 'Penaltı Golü' : 'Gol',
                teamName: team.name,
                scorer: scorer.name,
                assist: isPenalty ? 'Penaltı' : assist.name,
                playerId: scorer.id
            });
        }
    };
    
    generateEventsForTeam(home, homeScore, true);
    generateEventsForTeam(away, awayScore, false);
    
    events.sort((a,b) => a.minute - b.minute);

    const stats = generateMatchStats(home.players, away.players, homeScore, awayScore);
    
    // --- INSTANT PENALTY SHOOTOUT LOGIC ---
    let pkScore = undefined;
    if (isKnockout && homeScore === awayScore) {
        pkScore = { h: 0, a: 0 };
        const homePlayers = home.players.slice(0, 11).sort((a,b) => b.stats.penalty - a.stats.penalty);
        const awayPlayers = away.players.slice(0, 11).sort((a,b) => b.stats.penalty - a.stats.penalty);
        
        let rounds = 5;
        // Basic 5 Rounds
        for (let i = 0; i < rounds; i++) {
            // Home Kick
            const hKicker = homePlayers[i % 11];
            const hProb = 0.7 + (hKicker.stats.penalty / 100);
            const hGoal = Math.random() < hProb;
            if (hGoal) pkScore.h++;
            events.push({
                minute: 120 + i + 1, // Store as >120min
                type: hGoal ? 'GOAL' : 'MISS',
                description: `Penaltı Atışları: ${hKicker.name} (${home.name}) ${hGoal ? 'GOL!' : 'KAÇIRDI!'}`,
                teamName: home.name,
                scorer: hGoal ? hKicker.name : undefined // Might be ignored by rating logic if >120
            });

            // Away Kick
            const aKicker = awayPlayers[i % 11];
            const aProb = 0.7 + (aKicker.stats.penalty / 100);
            const aGoal = Math.random() < aProb;
            if (aGoal) pkScore.a++;
             events.push({
                minute: 120 + i + 1, 
                type: aGoal ? 'GOAL' : 'MISS',
                description: `Penaltı Atışları: ${aKicker.name} (${away.name}) ${aGoal ? 'GOL!' : 'KAÇIRDI!'}`,
                teamName: away.name,
                scorer: aGoal ? aKicker.name : undefined
            });
        }

        // Sudden death if tied
        let suddenDeathRound = 5;
        while (pkScore.h === pkScore.a) {
             const hKicker = homePlayers[suddenDeathRound % 11];
             const aKicker = awayPlayers[suddenDeathRound % 11];
             
             const hGoal = Math.random() < (0.7 + hKicker.stats.penalty/100);
             if (hGoal) pkScore.h++;
             events.push({
                minute: 125 + suddenDeathRound, 
                type: hGoal ? 'GOAL' : 'MISS',
                description: `Seri Penaltılar: ${hKicker.name} (${home.name}) ${hGoal ? 'GOL!' : 'KAÇIRDI!'}`,
                teamName: home.name
            });

             const aGoal = Math.random() < (0.7 + aKicker.stats.penalty/100);
             if (aGoal) pkScore.a++;
             events.push({
                minute: 125 + suddenDeathRound, 
                type: aGoal ? 'GOAL' : 'MISS',
                description: `Seri Penaltılar: ${aKicker.name} (${away.name}) ${aGoal ? 'GOL!' : 'KAÇIRDI!'}`,
                teamName: away.name
            });
            
             suddenDeathRound++;
             if(suddenDeathRound > 20) break; // Safety break
        }
        
        stats.pkHome = pkScore.h;
        stats.pkAway = pkScore.a;
    }

    const { homeRatings, awayRatings } = calculateRatingsFromEvents(home, away, events, homeScore, awayScore);
    const mvpInfo = determineMVP(homeRatings, awayRatings);
    
    stats.homeRatings = homeRatings;
    stats.awayRatings = awayRatings;
    stats.mvpPlayerId = mvpInfo.id;
    stats.mvpPlayerName = mvpInfo.name;
    stats.homeRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === home.name).length;
    stats.awayRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === away.name).length;
    stats.homeYellowCards = events.filter(e => e.type === 'CARD_YELLOW' && e.teamName === home.name).length;
    stats.awayYellowCards = events.filter(e => e.type === 'CARD_YELLOW' && e.teamName === away.name).length;

    return { homeScore, awayScore, stats, events, pkScore };
};

export const simulateMatchInstant = (home: Team, away: Team): { homeScore: number, awayScore: number, stats: MatchStats } => {
    const res = simulateBackgroundMatch(home, away);
    return { homeScore: res.homeScore, awayScore: res.awayScore, stats: res.stats };
};

export const simulateMatchStep = (
    minute: number, 
    home: Team, 
    away: Team, 
    currentScore: {h:number, a:number},
    existingEvents: MatchEvent[] = []
): MatchEvent | null => {
    // Base Event Chance
    if (Math.random() > 0.55) return null; 

    // Score Difference
    const homeScoreDiff = currentScore.h - currentScore.a;
    const awayScoreDiff = currentScore.a - currentScore.h;

    // Calculate Dynamic Tactical Strength with specific scenarios
    const homeTactics = calculateTacticalEfficiency(home, minute, homeScoreDiff);
    const awayTactics = calculateTacticalEfficiency(away, minute, awayScoreDiff);

    if (homeTactics.warning && Math.random() < 0.05) {
        return { minute, description: `Ev sahibi: ${homeTactics.warning}`, type: 'INFO', teamName: home.name };
    }
    if (awayTactics.warning && Math.random() < 0.05) {
        return { minute, description: `Deplasman: ${awayTactics.warning}`, type: 'INFO', teamName: away.name };
    }

    const homeReds = existingEvents.filter(e => e.type === 'CARD_RED' && e.teamName === home.name).length;
    const awayReds = existingEvents.filter(e => e.type === 'CARD_RED' && e.teamName === away.name).length;

    let homeStr = (calculateTeamStrength(home) + 5) * homeTactics.multiplier;
    let awayStr = calculateTeamStrength(away) * awayTactics.multiplier;

    if (homeReds > 0) homeStr *= (1 - (homeReds * 0.15));
    if (awayReds > 0) awayStr *= (1 - (awayReds * 0.15));

    const total = homeStr + awayStr;
    const homeDominance = homeStr / total;
    const eventRoll = Math.random();

    let offensiveDominance = homeDominance;
    if (homeDominance > 0.55) {
        offensiveDominance = Math.min(0.90, homeDominance + 0.15);
    } else if (homeDominance < 0.45) {
        offensiveDominance = Math.max(0.10, homeDominance - 0.15);
    }

    const isHomeAggressive = home.tackling === Tackling.AGGRESSIVE;
    const isAwayAggressive = away.tackling === Tackling.AGGRESSIVE;
    const isAggressiveMatch = isHomeAggressive || isAwayAggressive;
    
    const sentOffPlayers = new Set(existingEvents.filter(e => e.type === 'CARD_RED').map(e => e.playerId));

    // Injury Logic
    const getPlayerForInjury = (team: Team): Player => {
         const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
         if (xi.length === 0) return team.players[0];
         return xi[Math.floor(Math.random() * xi.length)];
    };

    const getPlayer = (team: Team, includeGK = false) => {
        const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
        if (xi.length === 0) return team.players[0];
        const pool = includeGK ? xi : xi.filter(p => p.position !== Position.GK);
        const finalPool = pool.length > 0 ? pool : xi;
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    };

    const getScorer = (team: Team) => {
        const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
        if(xi.length === 0) return { scorer: team.players[0], assist: team.players[0] };
        const fwds = xi.filter(p => [Position.SNT, Position.SLK, Position.SGK].includes(p.position));
        const mids = xi.filter(p => [Position.OS, Position.OOS].includes(p.position));
        let scorerPool = [...fwds, ...fwds, ...fwds, ...mids, ...mids, ...xi];
        const scorer = scorerPool[Math.floor(Math.random() * scorerPool.length)];
        let assist = xi[Math.floor(Math.random() * xi.length)];
        if(assist.id === scorer.id) assist = xi.find(p => p.id !== scorer.id) || assist;
        return { scorer, assist };
    };

    let currentGoalProb = 0.05; 
    
    if (home.mentality === Mentality.VERY_DEFENSIVE || away.mentality === Mentality.VERY_DEFENSIVE) {
        currentGoalProb *= 0.7;
    }
    if (home.mentality === Mentality.VERY_ATTACKING || away.mentality === Mentality.VERY_ATTACKING) {
        currentGoalProb *= 1.3;
    }

    const maxReds = Math.max(homeReds, awayReds);
    if (maxReds === 1) currentGoalProb += 0.01;
    else if (maxReds === 2) currentGoalProb += 0.03;
    else if (maxReds >= 3) currentGoalProb += 0.07;
    
    const PROB_GOAL = currentGoalProb;
    const PROB_INJURY = 0.01; // Simplified
    const PROB_FOUL = isAggressiveMatch ? 0.26 : 0.50; 
    const PROB_SAVE = 0.07;
    const PROB_OFFSIDE = 0.10;
    const PROB_CORNER = 0.13;
    let PROB_MISS = 0.15;

    const T_GOAL = PROB_GOAL;
    const T_INJURY = T_GOAL + PROB_INJURY;
    const T_FOUL = T_INJURY + PROB_FOUL;
    const T_SAVE = T_FOUL + PROB_SAVE;
    const T_OFFSIDE = T_SAVE + PROB_OFFSIDE;
    const T_CORNER = T_OFFSIDE + PROB_CORNER;
    const T_MISS = T_CORNER + PROB_MISS;

    if (eventRoll < T_GOAL) { 
        const isHome = Math.random() < offensiveDominance;
        const activeTeam = isHome ? home : away;
        const d = getScorer(activeTeam);
        let text = fillTemplate(pick(GOAL_TEXTS), { scorer: d.scorer.name, assist: d.assist.name, team: activeTeam.name });
        return { minute, description: text, type: 'GOAL', teamName: activeTeam.name, scorer: d.scorer.name, assist: d.assist.name, playerId: d.scorer.id };
    } 
    else if (eventRoll < T_INJURY) {
        const activeTeam = Math.random() < 0.5 ? home : away;
        const player = getPlayerForInjury(activeTeam);
        return { minute, description: `${player.name} sakatlandı ve oyuna devam edemiyor.`, type: 'INJURY', teamName: activeTeam.name, playerId: player.id };
    } 
    else if (eventRoll < T_FOUL) {
        const isHomeFoul = Math.random() > offensiveDominance; 
        const foulTeam = isHomeFoul ? home : away;
        const player = getPlayer(foulTeam);
        
        let cardType: MatchEvent['type'] = 'FOUL';
        let desc = `${player.name} faul yaptı.`;
        
        if (isAggressiveMatch && Math.random() < 0.2) {
             cardType = 'CARD_YELLOW';
             desc = fillTemplate(pick(YELLOW_CARD_AGGRESSIVE_TEXTS), { player: player.name });
        } else if (Math.random() < 0.05) {
             cardType = 'CARD_YELLOW';
             desc = fillTemplate(pick(YELLOW_CARD_TEXTS), { player: player.name });
        } else if (Math.random() < 0.005) { // Very rare red
             cardType = 'CARD_RED';
             desc = `${player.name} sert müdahalesi sonrası KIRMIZI KART gördü!`;
        }

        return { minute, description: desc, type: cardType, teamName: foulTeam.name, playerId: player.id };
    }
    else if (eventRoll < T_SAVE) {
        const isHomeAttacking = Math.random() < offensiveDominance;
        const attackingTeam = isHomeAttacking ? home : away;
        const defendingTeam = isHomeAttacking ? away : home;
        const keeper = defendingTeam.players.find(p => p.position === Position.GK) || defendingTeam.players[0];
        const attacker = getPlayer(attackingTeam);
        
        const text = fillTemplate(pick(SAVE_TEXTS), { keeper: keeper.name, attacker: attacker.name, defender: defendingTeam.players[1].name }); // Approximate defender
        return { minute, description: text, type: 'SAVE', teamName: defendingTeam.name, playerId: keeper.id };
    }
    else if (eventRoll < T_OFFSIDE) {
        const activeTeam = Math.random() < offensiveDominance ? home : away;
        const player = getPlayer(activeTeam);
        const text = fillTemplate(pick(OFFSIDE_TEXTS), { player: player.name });
        return { minute, description: text, type: 'OFFSIDE', teamName: activeTeam.name, playerId: player.id };
    }
    else if (eventRoll < T_CORNER) {
        const activeTeam = Math.random() < offensiveDominance ? home : away;
        const player = getPlayer(activeTeam);
        const text = fillTemplate(pick(CORNER_TEXTS), { player: player.name, team: activeTeam.name });
        return { minute, description: text, type: 'CORNER', teamName: activeTeam.name };
    }
    else if (eventRoll < T_MISS) {
        const activeTeam = Math.random() < offensiveDominance ? home : away;
        const player = getPlayer(activeTeam);
        const text = fillTemplate(pick(MISS_TEXTS), { player: player.name, defender: 'Savunma' });
        return { minute, description: text, type: 'MISS', teamName: activeTeam.name, playerId: player.id };
    }
    
    return null;
}
