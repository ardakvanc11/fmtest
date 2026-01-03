
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

// --- NEW TACTICAL ENGINE LOGIC ---
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

    // --- 1. KAOS KONTROLÜ (Liderlik, Takım Oyunu ve Moral Düşükse Çok Hücum Felakettir) ---
    if (team.mentality === Mentality.VERY_ATTACKING) {
        const leadership = avg('leadership');
        const teamwork = avg('teamwork');
        
        // Eşik değerler: Liderlik veya Takım Oyunu 12'nin altındaysa veya Moral %50'nin altındaysa
        if (leadership < 12 || teamwork < 12 || team.morale < 50) {
            multiplier -= 0.35; // Ciddi ceza
            if (Math.random() < 0.20) {
                warning = "KAOS: Diziliş bozuldu! Oyuncular kafasına göre oynuyor.";
            }
        }
    }

    // --- 2. GERİ DÖNÜŞ (KARARLILIK BONUSU) ---
    // Gerideysen ve Hücum/Çok Hücum oynuyorsan
    if (scoreDiff < 0 && (team.mentality === Mentality.ATTACKING || team.mentality === Mentality.VERY_ATTACKING)) {
        const determination = avg('determination');
        // Kararlılık yüksekse gizli bonus
        if (determination >= 12) {
            multiplier += 0.15; // Gizli kararlılık bonusu
            longShotBonus = true; // Uzaktan şut eventi artırma flag'i
        }
    }

    // --- 3. SKORU KORUMA (KONSANTRASYON BONUSU) ---
    // Öndeysen ve Defansif/Çok Defansif oynuyorsan
    if (scoreDiff > 0 && (team.mentality === Mentality.DEFENSIVE || team.mentality === Mentality.VERY_DEFENSIVE)) {
        const concentration = avg('concentration');
        if (concentration >= 12) {
            multiplier += 0.15; // Gizli konsantrasyon bonusu (Hata yapma olasılığı düşer)
        } else {
            // Konsantrasyon düşükse geriye yaslanmak intihar olabilir
            multiplier -= 0.05;
            if (Math.random() < 0.05) warning = "Savunma konsantrasyonunu kaybediyor.";
        }
    }

    // --- MENTALITY LOGIC (New) ---
    switch (team.mentality) {
        case Mentality.VERY_DEFENSIVE:
            // "Top rakipte, Az pozisyon, Net pozisyon az verilir"
            const vd_defScore = (avg('positioning') + avg('concentration')) / 2;
            if (vd_defScore >= 13) multiplier += 0.08; 
            else {
                multiplier -= 0.05; // Bad defense can't park the bus properly
                if (Math.random() < 0.05) warning = "Savunma konsantrasyonu dağıldı.";
            }
            // Offensive penalty (less chances created)
            multiplier -= 0.12; 
            break;

        case Mentality.DEFENSIVE:
            // "Dengeli savunma, Kontraya çıkma isteği artar"
            const d_score = (avg('pace') + avg('positioning') + avg('firstTouch')) / 3;
            if (d_score >= 12) multiplier += 0.05;
            break;

        case Mentality.STANDARD:
            // "En stabil mod"
            multiplier += 0.03; 
            break;

        case Mentality.ATTACKING:
            // "Hatlar öne çıkar, Yaratıcılık ↑, Bitiricilik ↑, Karar alma ↓ (risk)"
            const a_att = (avg('flair') + avg('finishing')) / 2;
            const a_risk = (avg('decisions') + avg('positioning')) / 2;
            
            if (a_att >= 13) multiplier += 0.08;
            
            if (a_risk < 12) {
                multiplier -= 0.04;
                if (Math.random() < 0.05) warning = "Savunma arkası açık veriyor.";
            }
            break;

        case Mentality.VERY_ATTACKING:
            // "Kumar. Son 10-15 dk modu."
            const va_ment = (avg('bravery') + avg('determination')) / 2;
            const va_def = (avg('concentration') + avg('positioning')) / 2;
            
            if (va_ment >= 14) multiplier += 0.15; // High pressure
            else multiplier -= 0.05; // Panic

            if (va_def < 12) {
                multiplier -= 0.10; // Exposed
                if (Math.random() < 0.10) warning = "Savunma disiplini tamamen kayboldu.";
            }
            break;
    }

    // --- 1. PASSING STYLE ---
    if (team.passing === PassingStyle.EXTREME_SHORT) {
        if (avg('passing') >= 14 && avg('composure') >= 13) {
            multiplier += 0.05; 
        } else {
            multiplier -= 0.05; 
            if (avg('decisions') < 12 && Math.random() < 0.1) warning = "Savunmada riskli paslaşma!";
        }
    } else if (team.passing === PassingStyle.SHORT) {
        if (avg('passing') >= 12) multiplier += 0.04;
    } else if (team.passing === PassingStyle.DIRECT) {
        if (avg('vision') >= 12 && avg('pace') >= 12) multiplier += 0.06;
        else multiplier -= 0.04; 
    } else if (team.passing === PassingStyle.PUMP_BALL) {
        multiplier -= 0.10; 
        const stStrength = avgList(strikers, 'physical') + avgList(strikers, 'heading');
        if (stStrength >= 28) { 
            multiplier += 0.25; 
        } else {
            if (Math.random() < 0.1) warning = "Forvetler top indiremiyor";
        }
    }

    // --- 2. TEMPO ---
    if (team.tempo === Tempo.VERY_SLOW) {
        multiplier -= 0.10; 
        if (avg('passing') >= 13) multiplier += 0.05; 
    } else if (team.tempo === Tempo.HIGH) {
        if (avg('decisions') < 12) multiplier -= 0.05; 
    } else if (team.tempo === Tempo.BEAST_MODE) {
        if (minute <= 60) {
            multiplier += 0.15; 
        } else {
            multiplier -= 0.30; 
            if (Math.random() < 0.15) warning = "Takım fiziksel olarak çöktü (Beast Mode)";
        }
    }

    // --- 3. WIDTH ---
    if (team.width === Width.VERY_NARROW) {
        if (avgList(mids, 'passing') >= 13) multiplier += 0.08;
        else {
            multiplier -= 0.08;
            if (Math.random() < 0.1) warning = "Kanatlardan açık veriliyor";
        }
    } else if (team.width === Width.VERY_WIDE) {
        if (avg('passing') < 14) multiplier -= 0.08; 
        if (avgList(wings, 'pace') >= 14) multiplier += 0.08;
    }

    // --- 4. ATTACK TRANSITION ---
    if (team.attackingTransition === AttackingTransition.PUSH_FORWARD) {
        if (avg('pace') >= 13) multiplier += 0.08; 
        if (avgList(defenders, 'positioning') < 12) {
            multiplier -= 0.08;
            if (Math.random() < 0.1) warning = "Geri dönüşlerde zaafiyet";
        }
    } else if (team.attackingTransition === AttackingTransition.KEEP_SHAPE) {
        multiplier -= 0.02; 
        if (avg('composure') >= 12) multiplier += 0.04;
    }

    // --- 5. CREATIVE ---
    if (team.creative === CreativeFreedom.CREATIVE) {
        if (avg('flair') >= 13) multiplier += 0.07;
        else {
            multiplier -= 0.07;
            if (Math.random() < 0.1) warning = "Gereksiz çalım/şut denemesi";
        }
    } else if (team.creative === CreativeFreedom.DISCIPLINED) {
        if (avg('decisions') < 12) multiplier += 0.03; 
    }

    // --- 6. SUPPORT RUNS ---
    if (team.supportRuns === SupportRuns.LEFT || team.supportRuns === SupportRuns.RIGHT) {
        multiplier += 0.05;
    } else if (team.supportRuns === SupportRuns.CENTER) {
        if (avgList(mids, 'finishing') >= 11) multiplier += 0.06;
    }

    // --- 7. DRIBBLING ---
    if (team.dribbling === Dribbling.ENCOURAGE) {
        if (avg('dribbling') >= 14) multiplier += 0.08;
        else {
            multiplier -= 0.08;
            if (Math.random() < 0.1) warning = "Çok fazla top kaybı (Dripling)";
        }
    } else if (team.dribbling === Dribbling.DISCOURAGE) {
        multiplier += 0.02; 
    }

    // --- 8. FOCUS AREA ---
    if (team.focusArea === FocusArea.BOTH_WINGS) {
        if (avgList(wings, 'crossing') >= 13) multiplier += 0.06;
        if (avgList(mids, 'tackling') < 12) {
             multiplier -= 0.04;
        }
    }

    // --- 9. PASS TARGET ---
    if (team.passTarget === PassTarget.SPACE) {
        if (avg('pace') >= 14) multiplier += 0.08;
        else multiplier -= 0.05;
    } else if (team.passTarget === PassTarget.FEET) {
        if (avg('technique') >= 13) multiplier += 0.05;
    }

    // --- 10. PATIENCE ---
    if (team.patience === Patience.EARLY_CROSS) {
        if (avgList(strikers, 'heading') >= 14) multiplier += 0.08;
        else multiplier -= 0.05; 
    } else if (team.patience === Patience.WORK_INTO_BOX) {
        if (avg('composure') < 12) {
            multiplier -= 0.05;
            if (Math.random() < 0.1) warning = "Şut çekmekte geç kalınıyor";
        }
    }

    // --- 11. LONG SHOTS ---
    if (team.longShots === LongShots.ENCOURAGE) {
        if (avg('longShots') >= 13) multiplier += 0.06;
        else {
            multiplier -= 0.06;
            if (Math.random() < 0.1) warning = "Toplar dağa taşa gidiyor";
        }
    }

    // --- 12. CROSSING ---
    if (team.crossing === CrossingType.LOW) {
        if (avgList(strikers, 'pace') >= 13) multiplier += 0.05;
    } else if (team.crossing === CrossingType.HIGH) {
        if (avgList(strikers, 'heading') >= 14) multiplier += 0.05;
    }

    // Default clamps
    return { multiplier: Math.max(0.4, multiplier), warning, longShotBonus };
};

export const simulateBackgroundMatch = (home: Team, away: Team): { homeScore: number, awayScore: number, stats: MatchStats, events: MatchEvent[] } => {
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

        const yellowCount = Math.floor(Math.random() * 3);
        for(let i=0; i<yellowCount; i++) {
            const sinner = xi[Math.floor(Math.random() * xi.length)];
            events.push({
                minute: Math.floor(Math.random() * 90) + 1,
                type: 'CARD_YELLOW',
                description: 'Sarı Kart',
                teamName: team.name,
                playerId: sinner.id
            });
        }

        if(Math.random() < 0.03) {
            const sinner = xi[Math.floor(Math.random() * xi.length)];
            events.push({
                minute: Math.floor(Math.random() * 90) + 1,
                type: 'CARD_RED',
                description: 'Kırmızı Kart',
                teamName: team.name,
                playerId: sinner.id
            });
        }

        if (Math.random() < 0.15) {
            const victim = xi[Math.floor(Math.random() * xi.length)];
            const injuryType = getWeightedInjury();
            events.push({
                minute: Math.floor(Math.random() * 90) + 1,
                type: 'INJURY',
                description: `Sakatlık: ${injuryType.type}`,
                teamName: team.name,
                playerId: victim.id
            });
        }
    };

    generateEventsForTeam(home, homeScore, true);
    generateEventsForTeam(away, awayScore, false);

    events.sort((a,b) => a.minute - b.minute);

    const stats = generateMatchStats(home.players, away.players, homeScore, awayScore);
    
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

    return { homeScore, awayScore, stats, events };
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

    // --- ROBUST INJURY SELECTION ---
    const getPlayerForInjury = (team: Team): Player => {
        const xi = team.players.slice(0, 11).filter(p => !sentOffPlayers.has(p.id));
        if (xi.length === 0) return team.players[0];

        const weightedPool: Player[] = [];
        
        xi.forEach(p => {
            const currentCondition = p.condition !== undefined ? p.condition : p.stats.stamina;
            let weight = 15; 
            
            // Susceptibility weighting
            weight += (p.injurySusceptibility || 10) / 5;
            
            // CRITICAL: Low condition players (< 50%) get massively increased weight
            if (currentCondition < 50) weight += 200; 
            else if (currentCondition < 70) weight += 15; 
            else if (currentCondition < 90) weight += 5;  

            const entries = Math.max(1, Math.floor(weight));
            for(let i=0; i<entries; i++) {
                weightedPool.push(p);
            }
        });

        const finalPool = weightedPool.length > 0 ? weightedPool : xi;
        return finalPool[Math.floor(Math.random() * finalPool.length)];
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
    
    // NEW: MENTALITY IMPACT ON GOAL PROBABILITY
    if (home.mentality === Mentality.VERY_DEFENSIVE || away.mentality === Mentality.VERY_DEFENSIVE) {
        currentGoalProb *= 0.7; // Reduce goal chance significantly (Parking bus)
    }
    if (home.mentality === Mentality.VERY_ATTACKING || away.mentality === Mentality.VERY_ATTACKING) {
        currentGoalProb *= 1.3; // Increase goal chance (Open game)
    }

    const maxReds = Math.max(homeReds, awayReds);
    if (maxReds === 1) currentGoalProb += 0.01;
    else if (maxReds === 2) currentGoalProb += 0.03;
    else if (maxReds >= 3) currentGoalProb += 0.07;

    const homeExhausted = home.players.slice(0, 11).filter(p => (p.condition !== undefined ? p.condition : p.stats.stamina) < 50).length;
    const awayExhausted = away.players.slice(0, 11).filter(p => (p.condition !== undefined ? p.condition : p.stats.stamina) < 50).length;
    const totalExhausted = homeExhausted + awayExhausted;
    
    const baseInjuryProb = 0.01;
    const exhaustedRiskAdder = 0.025;
    const calculatedInjuryProb = baseInjuryProb + (totalExhausted * exhaustedRiskAdder);

    const PROB_GOAL = currentGoalProb;
    const PROB_INJURY = calculatedInjuryProb;
    const PROB_FOUL = isAggressiveMatch ? 0.26 : 0.50; 
    const PROB_SAVE = 0.07;
    const PROB_OFFSIDE = 0.10;
    const PROB_CORNER = 0.13;
    
    // ADJUST MISS PROBABILITY IF LONG SHOTS ARE ENCOURAGED
    let PROB_MISS = 0.15;
    if (homeTactics.longShotBonus || awayTactics.longShotBonus) {
        PROB_MISS += 0.05; // More attempts, more misses likely
    }
    
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
        const activeTactics = isHome ? homeTactics : awayTactics;
        const d = getScorer(activeTeam);
        
        let text = fillTemplate(pick(GOAL_TEXTS), { scorer: d.scorer.name, assist: d.assist.name, team: activeTeam.name });

        // Add special description for comeback determination bonus
        if (activeTactics.longShotBonus && Math.random() < 0.4) {
            text = `UZAKLARDAN FÜZE! ${d.scorer.name}, geride olmanın hırsıyla yaklaşık 30 metreden vurdu ve fileleri havalandırdı!`;
        }

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
            varOutcome: varOutcome,
            playerId: d.scorer.id 
        };
    } 
    else if (eventRoll < T_INJURY) {
        let activeTeam = null;
        if (homeExhausted > 0 && awayExhausted === 0) activeTeam = home;
        else if (awayExhausted > 0 && homeExhausted === 0) activeTeam = away;
        else activeTeam = Math.random() < 0.5 ? home : away;

        const opponentTeam = activeTeam.id === home.id ? away : home;
        const opponentIsAggressive = opponentTeam.tackling === Tackling.AGGRESSIVE;
        
        const player = getPlayerForInjury(activeTeam);
        const injuryType = getWeightedInjury();
        
        let desc = `${player.name} (${activeTeam.name}) acı içinde yerde!`;
        const currentCond = player.condition !== undefined ? player.condition : player.stats.stamina;
        
        if (currentCond < 50) {
            desc += " Yorgunluk nedeniyle kas sakatlığı yaşadı.";
        } else {
            const reasons = [
                opponentIsAggressive ? 'Rakibin sert müdahalesi!' : 'Ters bastı.',
                'İkili mücadelede darbe aldı.',
                'Ani hızlanma sırasında sakatlandı.',
                'Zemine takıldı.'
            ];
            desc += ` ${reasons[Math.floor(Math.random() * reasons.length)]}`;
        }
        desc += ` Sakatlık: ${injuryType.type}`;

        return {
            minute,
            description: desc,
            type: 'INJURY',
            teamName: activeTeam.name,
            playerId: player.id
        };
    }
    else if (eventRoll < T_FOUL) {
        const isHomeFoul = Math.random() > homeDominance;
        const foulingTeam = isHomeFoul ? home : away;
        const fouledTeam = isHomeFoul ? away : home;
        const isFoulingAggressive = foulingTeam.tackling === Tackling.AGGRESSIVE;
        const player = getPlayer(foulingTeam);
        const victim = getPlayer(fouledTeam);

        const cardRoll = Math.random();
        
        let probRed = isFoulingAggressive ? 0.02 : 0.01;
        let probYellow = isFoulingAggressive ? 0.26 : 0.17;

        const isDerby = RIVALRIES.some(pair => pair.includes(home.name) && pair.includes(away.name));
        if (isDerby) {
            probRed += 0.03;
            probYellow += 0.06;
        }
        
        const redThreshold = probRed;
        const yellowThreshold = probRed + probYellow;

        if (cardRoll < redThreshold) { 
             return { minute, description: `${player.name} ${isFoulingAggressive ? 'topla alakası olmayan gaddarca' : 'yaptığı'} hareket sonrası direkt KIRMIZI KART gördü!`, type: 'CARD_RED', teamName: foulingTeam.name, playerId: player.id };
        } else if (cardRoll < yellowThreshold) {
             const hasYellow = existingEvents.some(e => e.type === 'CARD_YELLOW' && e.playerId === player.id);
             
             if (hasYellow) {
                 const conversionChance = isFoulingAggressive ? 0.50 : 0.35;

                 if (Math.random() < conversionChance) {
                    return { 
                        minute, 
                        description: `${player.name} (2. Sarı Kart) 🟥`, 
                        type: 'CARD_RED', 
                        teamName: foulingTeam.name, 
                        playerId: player.id 
                    };
                 } else {
                    const text = fillTemplate(pick(FOUL_TEXTS), { player: player.name, victim: victim.name });
                    return { minute, description: `${text} (Hakem son kez uyardı)`, type: 'FOUL', teamName: foulingTeam.name };
                 }
             } else {
                 const pool = isFoulingAggressive ? YELLOW_CARD_AGGRESSIVE_TEXTS : YELLOW_CARD_TEXTS;
                 const text = fillTemplate(pick(pool), { player: player.name });
                 return { minute, description: text, type: 'CARD_YELLOW', teamName: foulingTeam.name, playerId: player.id };
             }
        } else {
             const text = fillTemplate(pick(FOUL_TEXTS), { player: player.name, victim: victim.name });
             return { minute, description: text, type: 'FOUL', teamName: foulingTeam.name };
        }
    }
    else if (eventRoll < T_SAVE) {
         const isHomeSave = Math.random() > offensiveDominance; 
         const savingTeam = isHomeSave ? away : home; 
         const attackingTeam = isHomeSave ? home : away;
         const keeper = savingTeam.players.find(p => p.position === Position.GK && !sentOffPlayers.has(p.id)) || savingTeam.players.find(p => !sentOffPlayers.has(p.id));
         
         if (!keeper) return null; 

         const defender = getPlayer(savingTeam);
         const attacker = getPlayer(attackingTeam);

         const text = fillTemplate(pick(SAVE_TEXTS), { keeper: keeper.name, defender: defender.name, attacker: attacker.name });
         return { minute, description: text, type: 'SAVE', teamName: savingTeam.name };
    }
    else if (eventRoll < T_OFFSIDE) {
         const activeTeam = Math.random() < offensiveDominance ? home : away;
         const player = getPlayer(activeTeam);
         const text = fillTemplate(pick(OFFSIDE_TEXTS), { player: player.name });
         return { minute, description: text, type: 'OFFSIDE', teamName: activeTeam.name };
    }
    else if (eventRoll < T_CORNER) {
        const activeTeam = Math.random() < offensiveDominance ? home : away;
        const player = getPlayer(activeTeam);
        const text = fillTemplate(pick(CORNER_TEXTS), { player: player.name, team: activeTeam.name });
        return { minute, description: text, type: 'CORNER', teamName: activeTeam.name };
    }
    else if (eventRoll < T_MISS) {
        const activeTeam = Math.random() < offensiveDominance ? home : away;
        const defenderTeam = activeTeam.id === home.id ? away : home;
        const player = getPlayer(activeTeam);
        const defender = getPlayer(defenderTeam);

        // Determination bonus makes players take more shots, potentially missing wildly if skill is low
        // but creates "desperate attempt" narrative
        const activeTactics = activeTeam.id === home.id ? homeTactics : awayTactics;
        let text = fillTemplate(pick(MISS_TEXTS), { player: player.name, defender: defender.name });
        
        if (activeTactics.longShotBonus && Math.random() < 0.4) {
            text = `${player.name} kaleyi görünce çok uzaklardan şansını denedi ama top farklı şekilde auta gitti. (Hırsından köpürüyor!)`;
        }

        return { 
            minute, 
            description: text, 
            type: 'MISS', 
            teamName: activeTeam.name,
            playerId: player.id 
        };
    }
    else {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const opponentTeam = activeTeam.id === home.id ? away : home;
        const player = getPlayer(activeTeam);
        const opponentPlayer = getPlayer(opponentTeam);

        const text = fillTemplate(pick(MATCH_INFO_MESSAGES), { player: player.name, opponent: opponentPlayer.name, team: activeTeam.name });
        return { minute, description: text, type: 'INFO' };
    }
}
