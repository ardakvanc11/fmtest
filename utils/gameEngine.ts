
import { Team, Player, Fixture, Position, MatchEvent, MatchStats, NewsItem, PlayerPerformance, BettingOdds, Tackling } from '../types';
import { generateId, generatePlayer, INJURY_TYPES } from '../constants';

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

const generatePlayerRatings = (players: Player[], teamGoals: number, isWinner: boolean): PlayerPerformance[] => {
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
    const homeRatings = generatePlayerRatings(homePlayers, hScore, hScore > aScore);
    const awayRatings = generatePlayerRatings(awayPlayers, aScore, aScore > hScore);

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

    let potentialMvps = hScore >= aScore ? homeRatings : awayRatings;
    if (hScore === aScore && Math.random() > 0.5) potentialMvps = awayRatings;
    potentialMvps.sort((a,b) => b.rating - a.rating);
    const mvp = potentialMvps[0];
    if(mvp) mvp.rating = Math.min(10, mvp.rating + 0.5);

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
        mvpPlayerId: mvp?.playerId || '',
        mvpPlayerName: mvp?.name || 'Unknown',
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

    // Helper to pick random from array
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

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
        
        const goalTexts = [
            `${d.scorer.name} fırsatı iyi değerlendirdi ve topu ağlara bıraktı!`,
            `Kaleci çaresiz! ${d.scorer.name} golü attı!`,
            `${d.scorer.name} uzak köşeye bıraktı, skor değişiyor!`,
            `İnanılmaz bir bitiriş! ${d.scorer.name} ağları sarstı!`,
            `${d.scorer.name} tek vuruş! Gol geldi!`,
            `${d.scorer.name} boş kaldı ve affetmedi!`,
            `Stadyum ayağa kalktı! ${d.scorer.name} golü attı!`,
            `${d.scorer.name} ceza sahasında topla buluştu ve golü yazdı!`,
            `Defans seyretti, ${d.scorer.name} gole imza attı!`,
            `${d.scorer.name} klas bir dokunuşla topu ağlara gönderiyor!`,
            `Top bir anda ${d.scorer.name}’in önünde kaldı ve gol!`,
            `${d.scorer.name} şık bir vuruş yaptı, top ağlarda!`,
            `${d.scorer.name} gol perdesini açan isim oluyor!`,
            `Ceza sahasında karambol! ${d.scorer.name} tamamladı!`,
            `${d.scorer.name} müthiş bir zamanlamayla golü atıyor!`,
            `${d.scorer.name} kafa vuruşu! GOOOOL!`,
            `${d.scorer.name} köşeyi buldu! Kaleci sadece baktı!`,
            `${d.scorer.name} bitirici vuruşu yaptı!`,
            `O nasıl bir şut öyle! ${d.scorer.name} golü yazdı!`
        ];

        const text = pick(goalTexts);

        // VAR CHECK Logic
        if (Math.random() < 0.25) { 
            const isGoalValid = Math.random() > 0.3; 
            return { 
                minute, 
                description: `${text} Ancak hakem VAR incelemesi başlattı...`, 
                type: 'VAR', 
                teamName: activeTeam.name, 
                scorer: d.scorer.name, 
                assist: d.assist.name,
                varOutcome: isGoalValid ? 'GOAL' : 'NO_GOAL'
            };
        }
        return { minute, description: text, type: 'GOAL', teamName: activeTeam.name, scorer: d.scorer.name, assist: d.assist.name };
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
             const yellowTexts = [
                 `Sonuç ${player.name} için sarı kart olacak.`,
                 `${player.name} rakibine ${isAggressive ? 'çok sert daldı' : 'kontrolsüz girdi'} ve SARI KART.`,
                 `Hakem elini cebine götürüyor, ${player.name} sarı kartı görüyor.`
             ];
             return { minute, description: pick(yellowTexts), type: 'CARD_YELLOW', teamName: foulingTeam.name, playerId: player.id };
        } else {
             const foulTexts = [
                 `Faul. ${player.name}, ${victim.name} tarafından düşürüldü.`,
                 `${player.name} ceza sahasına yaklaşırken ${victim.name} tarafından indiriliyor! (Serbest Vuruş)`,
                 `${player.name} rakibini formadan çekti.`
             ];
             return { minute, description: pick(foulTexts), type: 'FOUL', teamName: foulingTeam.name };
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

         const saveTexts = [
            `İnanılmaz kurtarış! ${keeper.name} kalesinde devleşti.`,
            `${defender.name} in müdahalesi ile top uzaklaştırılıyor.`,
            `${attacker.name} vurdu ama ${keeper.name} son anda uzandı!`,
            `${defender.name} topu çizgiden çıkardı!`,
            `İnanılmaz kurtarış! ${keeper.name} adeta uçtu!`,
            `${attacker.name} çok sert vurdu ama ${keeper.name} duvar gibi!`,
            `${defender.name} kritik anda araya girdi, tehlike büyümeden önlendi.`,
            `${keeper.name} refleksleriyle takımını ayakta tutuyor!`,
            `${attacker.name} karşı karşıya! Ama ${keeper.name} izin vermiyor!`,
            `Çizgiden çıkarıldı! ${defender.name} müthiş müdahale!`,
            `${attacker.name} boş pozisyonda vurdu, ${keeper.name} inanılmaz çıkardı!`,
            `${keeper.name} uzadı, köşeden aldı! Harika kurtarış.`
         ];

         return { minute, description: pick(saveTexts), type: 'SAVE', teamName: savingTeam.name };
    }
    // 5. OFFSIDE (11%)
    else if (eventRoll < 0.28) {
         const activeTeam = Math.random() < homeDominance ? home : away;
         const player = getPlayer(activeTeam);
         return { minute, description: `Ofsayt bayrağı havada. ${player.name} önde yakalandı.`, type: 'OFFSIDE', teamName: activeTeam.name };
    }
    // 6. CORNERS (13%)
    else if (eventRoll < 0.41) {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const player = getPlayer(activeTeam);
        return { minute, description: `${activeTeam.name} korner kullanacak. Topun başında ${player.name}.`, type: 'CORNER', teamName: activeTeam.name };
    }
    // 7. MISS (18%)
    else if (eventRoll < 0.59) {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const defenderTeam = activeTeam.id === home.id ? away : home;
        const player = getPlayer(activeTeam);
        const defender = getPlayer(defenderTeam);

        const missTexts = [
            `${player.name} hedefi tutturamadı.`,
            `${player.name} önce topun düşmesini bekliyor... vuruş aut!`,
            `${player.name} topu ayağının altından kaydırıyor! Büyük şanssızlık.`,
            `${player.name} mutlak golü kaçırdı!`,
            `${player.name}, ${defender.name} tarafından şaşırtıldı ama top dışarı gitti.`,
            `${player.name} vurdu, top direği yalayıp dışarı çıktı.`,
            `${player.name} hedefi bulamadı, top auta gitti.`,
            `${player.name} çok kötü bir vuruş yaptı, top tribünlere!`,
            `${player.name} harika bir pozisyonu heba etti.`,
            `${player.name} istediği vuruşu yapamadı.`,
            `${player.name} net fırsatı kaçırıyor!`,
            `${player.name} belli ki ayarını tutturamadı.`,
            `${player.name} müsait pozisyonda auta gönderdi.`,
            `${player.name} dokunsa gol olacaktı… olmadı.`,
            `${player.name} gelişine vurdu ama çerçeveyi bulamadı.`,
            `${player.name} topu kontrol edemedi, fırsat kaçtı.`,
            `${player.name} yakın mesafeden dışarı attı!`,
            `${player.name} çok sert vurdu ama isabet yok.`,
            `${player.name} şutunu çekti… direğin yanından dışarı.`,
            `${player.name} vuruş açısını buldu ama çerçeve yok.`,
            `${player.name} için büyük bir şans, ama değerlendiremedi.`,
            `${player.name} vurdu, top farklı şekilde auta gitti.`,
            `${player.name} net bir şansı heba etti.`,
            `${player.name} acele edince top istediği gibi çıkmadı.`,
            `${player.name} topu ayağının altına aldı ama vuramadı.`,
            `${player.name} hatalı bir vuruşla topu dışarı attı.`,
            `${player.name} plase denedi, auta gitti.`,
            `${player.name} iyi yükseldi ama kafayı kötü vurdu.`,
            `${player.name} şutu bir türlü istediği gibi oturtamadı.`,
            `${player.name} müsait pozisyonu değerlendiremedi.`,
            `${player.name} isabetsiz bir şut daha.`,
            `${player.name} büyük fırsatı kaçırıyor!`,
            `${player.name} yakın mesafeden auta yolladı.`,
            `${player.name} çok kötü vurdu, top farklı şekilde dışarı.`
        ];
        return { minute, description: pick(missTexts), type: 'MISS', teamName: activeTeam.name };
    }
    // 8. INFO (~41%)
    else {
        const activeTeam = Math.random() < homeDominance ? home : away;
        const opponentTeam = activeTeam.id === home.id ? away : home;
        const player = getPlayer(activeTeam);
        const opponentPlayer = getPlayer(opponentTeam);

        const flavors = [
            `${player.name} ceza sahasında ${opponentPlayer.name} tarafından fark ediliyor ve durduruluyor.`,
            `${player.name} orta sahada oyunu kurmaya çalışıyor.`,
            `${player.name} kanattan bindirdi ama ${opponentPlayer.name} izin vermedi.`,
            `${player.name} şık bir çalımla rakibini geçti.`,
            `${player.name} pas hatası yaptı, top rakibe geçti.`,
            `Tribünler ${activeTeam.name} lehine tezahürat yapıyor.`,
            `${player.name} uzaktan şansını denedi ancak savunmaya çarptı.`,
            `${player.name} topu saklamaya çalışıyor.`,
            `${opponentPlayer.name} pres yaparak topu kazandı.`,
            `Oyunun temposu bu dakikalarda düştü.`,
            `${player.name} arkadaşlarına ileri çıkın diyor.`,
            `${player.name} ile verkaç denemesi başarısız.`,
            `${player.name} savunmanın arkasına sarkmaya çalıştı.`,
            `${opponentPlayer.name} kademeye girerek tehlikeyi önledi.`,
            `${player.name} ceza sahasında ${opponentPlayer.name} tarafından durduruldu.`,
            `${player.name} orta sahada oyunu kurmaya çalışıyor.`,
            `${player.name} kanattan ilerledi fakat ${opponentPlayer.name} geçit vermedi.`,
            `${player.name} basit bir pas hatası yaptı.`,
            `${player.name} rakibin baskısından çıkmakta zorlanıyor.`,
            `${player.name} topu ayağında fazla tuttu, seçenekleri azalıyor.`,
            `${player.name} uzaktan şut pozisyonu aradı ama bulamadı.`,
            `${player.name} topu kontrol etti, takım arkadaşlarını yönlendirdi.`,
            `${player.name} savunmayı üzerine çekiyor.`,
            `${player.name} topu kenara oynadı.`,
            `${player.name} ters kanada uzun bir top gönderdi.`,
            `${player.name} topu sakladı fakat pres arttı.`,
            `${player.name} savunmanın boşluğuna koşu yaptı.`,
            `${player.name} markajdan kurtulmak istiyor.`,
            `${player.name} rakip ceza sahasına yaklaşmaya çalışıyor.`,
            `${player.name} çizgiye indi ama topu kaybetti.`,
            `${player.name} baskı altında topu taca yolladı.`,
            `${player.name} topu ayağının altından fazla açtı.`,
            `${player.name} doğru pas açısını bulamadı.`,
            `${player.name} oyun temposunu düşürdü.`,
            `${player.name} oyunu sakinleştirdi.`,
            `${player.name} topu sürerken dengesini kaybetti.`,
            `${player.name} arkadaşları ileri çıkması için işaret yaptı.`,
            `${player.name} verkaç denedi ancak anlaşmazlık yaşandı.`,
            `${player.name} rakibin arasına pas arıyor.`,
            `${player.name} kısa bir duvar pası yaptı.`,
            `${player.name} ortasını açmak istedi ama başarılı olamadı.`,
            `${player.name} ceza sahasına doğru baktı fakat pas vermedi.`,
            `${player.name} savunma çizgisini zorladı.`,
            `${player.name} şut pozisyonu için hazırlık yaptı.`,
            `${player.name} topu kaptırdıktan sonra baskıya başladı.`,
            `${player.name} rakip yarı sahada baskı kurmaya çalışıyor.`,
            `${player.name} takımının oyun ritmini ayarlıyor.`,
            `${player.name} savunmadan oyun kuruyor.`,
            `${player.name} pas trafiğini yönlendiren isim.`,
            `${player.name} riskli bir pas vermek üzereydi ama vazgeçti.`,
            `${player.name} rakibin presine çarpıp topu kaybetti.`,
            `${player.name} topu taç çizgisine kadar taşıdı.`,
            `${player.name} merkezden oyun kurma çabasında.`,
            `${player.name} rakip yarı alanda topa hakim.`,
            `${player.name} boş alan bulamadı.`,
            `${player.name} topu derine çekerek oyun kuruyor.`,
            `${player.name} bire bir pozisyonda zorlandı.`,
            `${player.name} şık bir kontrol yaptı.`,
            `${player.name} topu kontrol ederken kaydı ama devam etti.`,
            `${player.name} kanada yöneldi.`,
            `${player.name} rakibin arasından çıkmak için hamle yaptı.`,
            `${player.name} topu hafifçe doldurdu.`,
            `${player.name} oyun yönünü çevirmeye çalıştı.`,
            `${player.name} baskı altındayken pas vermekte geç kaldı.`,
            `${player.name} savunmayı üzerine çekiyor.`,
            `${player.name} takım arkadaşına boşluğa kaçmasını işaret etti.`,
            `${player.name} pozisyon için uygun açı arıyor.`,
            `${player.name} rakip ile fiziksel mücadelede zorlandı.`,
            `${player.name} markajdan sıyrılıp topu aldı.`,
            `${player.name} oyun kurulumunda aktif rol alıyor.`,
            `${player.name} topla hızlanmak istedi ama başarılı olamadı.`,
            `${player.name} ceza sahasına ortayı düşündü fakat savunma kapattı.`,
            `${player.name} oyunun akışını değiştirecek pası arıyor.`,
            `${player.name} takım arkadaşını kaçırmak istedi ama savunma araya girdi.`,
            `${player.name} rakip baskısını hissetti.`,
            `${player.name} topu kaybetmemek için geri döndü.`,
            `${player.name} baskıdan çıkmak adına uzun oynadı.`,
            `${player.name} dar alanda çözüm üretmeye çalışıyor.`,
            `${player.name} rakibini geçmek için adım attı ama topu kaptırdı.`,
            `${player.name} orta alan mücadelesinde topu kazandı.`,
            `${player.name} hücum yönünü belirlemeye çalışıyor.`,
            `${player.name} savunma arkasına sarkmak istedi.`,
            `${player.name} topu ayağından biraz fazla açtı.`,
            `${player.name} oyunu hızlandırıyor.`,
            `${player.name} oyunu yavaşlatıyor.`,
            `${player.name} ceza sahası çevresinde dolaşıyor.`,
            `${player.name} pas açıları kapandı.`,
            `${player.name} takım arkadaşlarını organize ediyor.`,
            `${player.name} çizgiye yöneldi.`,
            `${player.name} kısa bir pas verdi.`,
            `${player.name} topu rakibinin üzerinden aşırmak istedi.`,
            `${player.name} teknik bir dokunuşla topu sakladı.`,
            `${player.name} oyuna genişlik kazandırdı.`,
            `${player.name} savunma arkasına top sarkıtmak istiyor.`,
            `${player.name} topu kaybetti, geri dönüyor.`,
            `${player.name} rakipten sıyrıldı ama dengeyi kaybetti.`,
            `${player.name} topu kapmak için hamle yaptı fakat geç kaldı.`,
            `${player.name} oyunda doğru tercihi arıyor.`,
            `${player.name} içeri kat etmeye çalıştı.`,
            `${player.name} savunmayı üzerine çekti.`,
            `${player.name} arkadaşına koşu yoluna pas düşündü.`,
            `${player.name} kritik bölgede top aldı.`,
            `${player.name} baskı altında işini zorlaştırdı.`,
            `${player.name} dripling denemesini yarıda bıraktı.`,
            `${player.name} boş alan arıyor.`,
            `${player.name} topu hızlı kullanmak istedi.`,
            `${player.name} atağın yönünü değiştirdi.`,
            `${player.name} topu güvenli bölgeye gönderdi.`,
            `${player.name} savunmadan oyun kuruyor.`,
            `${player.name} arkadaşlarını ileri itti.`,
            `${player.name} topu kontrol etmekte zorlandı.`,
            `${player.name} pas vermek için bekliyor.`,
            `${player.name} savunmadan çıkmak için pas aradı.`,
            `${player.name} topu kontrol etti, etrafına bakıyor.`,
            `${player.name} rakip baskısını hissetti, geri döndü.`,
            `${player.name} alan yaratmak için topu yana çekti.`,
            `${player.name} rakibin üstüne gidiyor gibi yaptı ama kararsız kaldı.`,
            `${player.name} topu aldığı gibi hızlanmak istedi.`,
            `${player.name} oyun kurulumunda sakin kalıyor.`,
            `${player.name} boş alan bulamayınca geriye oynadı.`,
            `${player.name} arkadaşlarına desteğe gelmelerini işaret etti.`,
            `${player.name} kanatta bire bir kaldı.`,
            `${player.name} savunmanın dikkatini üzerine çekti.`,
            `${player.name} markaj altında topa hakim olmayı başardı.`,
            `${player.name} topu ayağında fazla gezdirdi, baskı geliyor.`,
            `${player.name} pas için doğru anı kolluyor.`,
            `${player.name} ileri çıkmak için fırsat arıyor.`,
            `${player.name} topla buluştu ancak hemen pres geldi.`,
            `${player.name} rakibinden sıyrılmak için yön değiştirdi.`,
            `${player.name} dar alanda topu kontrol etti.`,
            `${player.name} savunma arasında sıkıştı.`,
            `${player.name} pas kanallarını kapattı.`,
            `${player.name} rakipten sıyrıldı ama devam edemedi.`,
            `${player.name} oyun kurarken hata yapmamaya çalışıyor.`,
            `${player.name} savunmanın boşluklarını arıyor.`,
            `${player.name} topu geriden oyun kurucusuna bıraktı.`,
            `${player.name} ceza sahasına yaklaşmak için dripling yaptı.`,
            `${player.name} pres altında zorunlu bir geri pas tercih etti.`,
            `${player.name} orta açmayı düşündü ama savunma izin vermedi.`,
            `${player.name} topu sürdü, çevresine baktı.`,
            `${player.name} arkadaşlarının koşu yolunu kolluyor.`,
            `${player.name} topla hafifçe hızlandı.`,
            `${player.name} yüksek top kontrolüyle pozisyon yarattı.`,
            `${player.name} sakin oynayarak tempoyu düşürdü.`,
            `${player.name} rakibin kademesine yakalandı.`,
            `${player.name} topu aldı, yüzünü kaleye döndü.`,
            `${player.name} kısa mesafede çabuk oynadı.`,
            `${player.name} takımının hücum setini başlattı.`,
            `${player.name} alan açmak için çizgiye indi.`,
            `${player.name} rakibin baskısına rağmen topu sakladı.`,
            `${player.name} riskli bir dripling denedi fakat durdu.`,
            `${player.name} oyunu yönlendirecek pası arıyor.`,
            `${player.name} rakibin üstüne gidiyor.`,
            `${player.name} savunma arkasına sızma niyetinde.`,
            `${player.name} topla buluştuğunda tribün hareketlendi.`,
            `${player.name} etkili bir top kontrolü yaptı.`,
            `${player.name} rakibini karşısına aldı.`,
            `${player.name} topu tek dokunuşla çevirdi.`,
            `${player.name} çizgi üzerinde topu zor kontrol etti.`,
            `${player.name} oyun kurmak için ortada konumlandı.`,
            `${player.name} topu süren oyuncuya destek verdi.`,
            `${player.name} boş alana kaçmak için hamle yaptı.`,
            `${player.name} rakip presi arttırdı, pas yolları kapandı.`,
            `${player.name} takımının oyun ritmini belirledi.`,
            `${player.name} pozisyonun yönünü değiştirmeye çalıştı.`,
            `${player.name} ceza sahasına sızmak için adım attı.`,
            `${player.name} baskıdan kurtulmak için topu geriye taşıdı.`,
            `${player.name} kaleye uzaktan bakıyor.`,
            `${player.name} oyunu genişletmek için kanada oynadı.`,
            `${player.name} ayağına sert bir top geldi ama kontrol etti.`,
            `${player.name} topu fazla açınca pozisyon kayboldu.`,
            `${player.name} rakip baskısını görünce hızlı oynadı.`,
            `${player.name} çizgiden tekrar içeri döndü.`,
            `${player.name} kontrolünü kaybetti, tekrar topladı.`,
            `${player.name} savunma ile arasında boşluk arıyor.`,
            `${player.name} rakip ile fiziksel mücadelede topu kazandı.`,
            `${player.name} baskıya rağmen ayakta kaldı.`,
            `${player.name} ani hızlanmayla rakibini denedi.`,
            `${player.name} topu ayağına aldı, oyun sakinleşti.`,
            `${player.name} savunma arkasına koşu işareti yaptı.`,
            `${player.name} tek pasla oyunu hızlandırdı.`,
            `${player.name} baskı altında bile doğru pası buldu.`,
            `${player.name} topu rahat bir şekilde kontrol etti.`,
            `${player.name} pas istasyonu konumunda.`,
            `${player.name} defansın arkasına bakıyor.`,
            `${player.name} oyunu yönlendirmek için orta alana geldi.`,
            `${player.name} rakip üzerine gelirken topu süren oyuncuya destek verdi.`,
            `${player.name} zor bir topu tek dokunuşla indirdi.`,
            `${player.name} takım arkadaşını kaçırmak istedi ama pası zayıf kaldı.`,
            `${player.name} alan daraldı, topu ayağında tutuyor.`
        ];
        return { minute, description: pick(flavors), type: 'INFO' };
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

const FAN_NAMES = [
    { name: "Yasin Kol", handle: "@refyasin" },
    { name: "Cihan Aydın", handle: "@refcihan" },
    { name: "Zorbay Küçük", handle: "@refzorbay" },
    { name: "Halil Umut", handle: "@refhalil" },
    { name: "Emre Çelik", handle: "@emre_celikk" },
    { name: "Kerem Arslan", handle: "@keremarslan" },
    { name: "Mert Kaplan", handle: "@mertkaplan55" },
    { name: "Can Doğan", handle: "@candogan_tr" },
    { name: "Onur Şimşek", handle: "@onursimsek_" },
    { name: "Yunus Polat", handle: "@yunuspolat1907" },
    { name: "Bartu Öztürk", handle: "@bartu_ozturk" },
    { name: "Efe Karaca", handle: "@efekaraca_" },
    { name: "Berat Yalçın", handle: "@beratyalcin" },
    { name: "Yiğit Uçar", handle: "@yigitucar61" },
    { name: "Samet Kurt", handle: "@sametkurt_10" },
    { name: "Tolga Yüksel", handle: "@tolgayuksel55" },
    { name: "Sefa Korkmaz", handle: "@sefa_korkmaz" },
    { name: "Hakan Yavuz", handle: "@hakanyavuzz" },
    { name: "Cenk Ergin", handle: "@cenkergin_" },
    { name: "Oğuzhan Yıldız", handle: "@oguzhanyildizz" },
    { name: "Tuna Solmaz", handle: "@tunasolmaz_" },
    { name: "Rüzgar Er", handle: "@ruzgarer" },
    { name: "Bora Aktaş", handle: "@boraaktas_35" },
    { name: "Altay Köse", handle: "@altaykose" },
    { name: "Levent Doğu", handle: "@leventdogu" },
    { name: "Musa Ateş", handle: "@musaates_" },
    { name: "Selim Ünal", handle: "@selimunal" },
    { name: "Furkan Sönmez", handle: "@furkansnmzz" },
    { name: "Halil Sarı", handle: "@halilsari_" },
    { name: "Enes Kaplan", handle: "@kaplan_enes" },
    { name: "Serhat Yılmaz", handle: "@serhatyilmaz34" },
    { name: "Harun Avcı", handle: "@harunavcii" },
    { name: "Alperen Güler", handle: "@alperengulerr" },
    { name: "Talha Şahin", handle: "@talhasahin_" },
    { name: "Emir Kalkan", handle: "@emirkalkan06" },
    { name: "Hasan Erol", handle: "@hasanerol_tr" },
    { name: "Ömer Yurt", handle: "@omeryurtt" },
    { name: "Gökhan Kalkan", handle: "@gokhankalkan_" },
    { name: "Rıza Bayrak", handle: "@rizabayrak" },
    { name: "Arda Karahan", handle: "@ardakarahan" },
    { name: "Serdar Tunç", handle: "@serdartunc_" },
    { name: "Kaan Doruk", handle: "@kaandoruk10" },
    { name: "Berk Uysal", handle: "@berkuysal_" },
    { name: "Murat Erden", handle: "@muraterden" },
    { name: "Hamza Geçin", handle: "@hamzagecin61" },
    { name: "Ahmet safa Ateş", handle: "@ahmetates_" },
    { name: "Arda Kıvanç Tırak", handle: "@ardakvanc11" },
];

// Rivalry Definitions
const RIVALRIES = [
    ['Ayıboğanspor SK', 'Kedispor'],
    ['Kedispor', 'Eşşekboğanspor FK'],
    ['Eşşekboğanspor FK', 'Ayıboğanspor SK'],
    ['Kedispor', 'Köpekspor'],
    ['Bedirspor', 'Yakhubspor']
];

const DERBY_TWEETS_WIN = [
    "ŞEHİR BİZİM!!!",
    "Bu gece uyumak yok!",
    "Nasıl çaktık lan size ağlayın lan!",
    "Öyle hakemle kazanmaya benzemez böyle çakarlar işte!",
    "Rengimiz belli, kralımız belli!",
    "Ağlama sesleri buraya kadar geliyor!",
    "Burası size mezar oldu!",
    "Derbi nasıl kazanılır ders verdik.",
    "Bu arma için ölmeye değer!",
    "Ezelden beri sahibiniz biziz!",
    "Bu maçtan sonra susun sadece susun!",
    "Sahalarda kaybolan takımınız için bir fener yakarsınız belki!",
    "Üstünüze beton döktük beton!",
    "Size bilezik gibi geçirdik PUHAHA!",
    "Ağlamayın laaan ağlamayın derbi böyle kazanılır!",
    "Bugün yine herkes babasını gördü sahada.",
    "Bugün size tokat gibi 3 puan çarptı.",
    "Bitse de gitsek dediniz biliyoruz hehe!",
    "#DERBİDESİKİŞVAR haha.",
    "Bugün sahada size bildiğiniz tecavüz ettik lan.",
    "HOCANIZ MAYMUN GİBİ ZIPLIYORDU SAHANIN KENARINDA KUDURMUŞŞŞŞ.",
    "Tarih bir kere yazıldı bugünde 2. kere sikiş döndü",
    "Himmetlerle dualarla derbi kazanılmaz gerçek böyle yazılır!",
    "Sizin starınız nerede lan derbilerde kayboluyor bildiğin heeyt.",
    "BÖYLE SOKARLAR İŞTE EN BÜYÜK BİZİZ LANNNNNN",
    "Tribünlerde taraftarlarımız nolur çıkmayın biraz taşak geçelim diyordu haha.",
    "Derbide kocanız vardı size taktı gitti haha!",
    "Kusura bakmayın ama bilezik gibi taktık!",
    "Sanki alt lig takımıyla maç yapmış gibi olduk.",
    "Kusura bakmayın ama böyle sokarlar işte derbide!"
];

const DERBY_TWEETS_LOSS = [
    "Bu derbi böyle kaybedilmez ya!",
    "Hayatımın en kötü günü…",
    "Sokağa çıkacak yüzümüz kalmadı.",
    "Ezeli rakibe yenilmek... İçim yanıyor.",
    "Bugün başımızı öne eğdiniz.",
    "Derbide böyle ruhsuz oynanmaz.",
    "Bu ne lan? Şike kokusu buraya kadar geldi, kimse bizi enayi sanmasın!",
    "Yönetim Allah belanızı versin, böyle derbi mi kaybedilir!",
    "Hocamızın amına koyim resmen sahaya İKİ KİLO SIÇTI.",
    "Hakemin anasını avradını sinkaf edeyim böyle yönetim olmaz olsun!",
    "Şike var şike! Hepiniz biliyorsunuz ama susuyorsunuz!",
    "Bu takımda karakter yok, sıfır ruh sıfır kalite!",
    "Kudurdum sinirimden, böyle derbi mi kaybedilir lan!",
    "Hocanın tek bildiği dua etmek herhalde, taktik maktik yok!",
    "Oyuncuların hepsi Instagram fenomeni olmuş, top oynamayı unutmuş!",
    "Hakem ortada maçı sattı, kimse bana masal anlatmasın!",
    "Yabancı hakem istiyoruz, yeter bu düzenin amına koyim!",
    "Yönetimin aldığı futbolcuların yarısı futbolcu değil lan!",
    "Kusura bakmayın ama bugün bizi siken hakemdi!",
    "Sizin maaşlarınızı ödeyen taraftarın amına koydunuz bugün!",
    "Biriniz de sorumluluk alın lan! Hep bahane hep bahane!",
    "Düzen değişmeden bu ülkeye adalet gelmez amk!",
    "Lan var ya rövanşta tokadı öyle bir yapıştıracağız ki unutamayacaklar!",
    "Bugün saçmaladık ama sonraki hafta bunların ağzına sıçarız rahat olun!",
    "Takım ruhu yok, disiplin yok, mücadele yok… amına koyim böyle takımın!",
    "Hocanın oyuncu değişiklikleri tam bir facia, satranç değil dama bile oynayamaz!",
    "Hakemin gözünü siken falan yok mu? Bu nasıl yönetim lan!",
    "Bu kulüpte hesap verme kültürü yok, herkes kafasına göre takılıyor!",
    "Heyyy Hayvan Futbol Federasyonu bu yapılan katliama sesinizi çıkarmıyacak mısınız!!",
    "Karşı takımın oyuncusu tribünlere sikini gösterdi amk tribündeydim PFDK GÖREVE!"
];

const FAN_TWEETS_WIN = [
    "Takım bugün resmen şov yaptı! Helal olsun hocaya.",
    "Böyle oynarsak ligi alırız!",
    "Sahada basmadık yer bırakmadılar, tebrikler.",
    "İşte benim takımım bu!",
    "Şampiyonluk şarkıları söylemeye başlayalım mı?",
    "Hocanın taktik zekası >> Tüm lig.",
    "Bugün izlediğim futboldan keyif aldım.",
    "Rakiplere gözdağı verdik.",
    "3 puan bizim, yolumuza devam.",
    "Bu sene o sene!",
    "Bugün takım ruhu zirvedeydi!",
    "Oyuncular resmen uçtu uçtu!",
    "Rakip sahadan silindi.",
    "Böyle bir performans beklemiyordum, helal olsun!",
    "Hocaya kim laf ediyordu? Buyrun cevap burada.",
    "Takımın enerjisi bugün bambaşkaydı.",
    "Bugünkü pres inanılmazdı.",
    "Herkes görevini yaptı, tam takım oyunu.",
    "Biz böyle oynarsak kimse duramaz.",
    "Maç daha 10 dakika oynansa 5 tane daha atardık.",
    "Bugün taraftara bayram!",
    "Formumuz yükselişte, rakipler düşünsün.",
    "Yine kalite farkı konuşturuldu.",
    "Sahada gerçek bir karakter gösterdik.",
    "Hocanın planı tıkır tıkır işledi.",
    "Takım sonunda ritmini buldu!",
    "Rakip kaleyi abluka altına aldık.",
    "O kadar rahat kazandık ki kahve içiyordum.",
    "Bu oyunu izlemek büyük keyifti.",
    "Böyle oynamaya devam, gerisi hikaye.",
    "Bugün hepimiz gurur duyduk.",
    "Hoca dokunuşunu konuşturdu!",
    "Kazanmayı ne kadar istediğimiz belli oldu.",
    "Bugün takım harika oynadı, keyif aldım vallahi.",
    "Hoca ne yaptıysa doğru yaptı bugün, helal olsun.",
    "Oyuncuların ayakları resmen dans etti sahada!",
    "Bu oyun umut verdi, devamı gelsin çocuklar!",
    "Rakibe top göstermedik ya, mis gibi galibiyet.",
    "Pres pres pres… Rakip nefes alamadı!",
];

const FAN_TWEETS_LOSS = [
    "Bu nasıl oyun hocam? Ne izledik biz?",
    "İnanılmaz kötüyüz. Böyle olmaz.",
    "Hoca istifa! Bu takımın hali ne?",
    "Verdiğimiz paraya yazık, rezalet.",
    "Ruhsuzlar ordusu.",
    "Televizyonu kırdım, mutlu musunuz?",
    "Sahada yürüyenleri izlemekten bıktık.",
    "Yazıklar olsun size.",
    "Bu takıma acil transfer lazım.",
    "Hafta sonum zehir oldu teşekkürler.",
    "Böyle oyunla mahalle turnuvası bile kazanamazsınız.",
    "Hocanın ne planı var anlamak mümkün değil.",
    "Takım sahaya çıkmamış resmen.",
    "Rakip bizi sahadan sildi, utanın biraz.",
    "Bu futbolu oynayan takım nasıl profesyonel anlamıyorum.",
    "İzlerken ciğerim soldu yemin ederim.",
    "Yine aynı senaryo, hiçbir şey değişmiyor.",
    "Bir tane olumlu şey yok bu maçta.",
    "Yönetim neyi bekliyor acaba?",
    "Takımda zerre istek yok.",
    "Bugün hepimizi delirttiniz.",
    "Bu kadar kötü savunma nasıl yapılır?",
    "Sahada herkes uyuyor muydu?",
    "Hocanın değişiklikleri tam bir facia.",
    "Oyuncular resmen gezintiye çıkmış.",
    "Bu rezilliği hak etmiyoruz.",
    "Hocanın maçı okuması sıfır.",
    "İzlediğim en kötü maçlardan biri.",
    "Topla sahip olmak yetmiyor işte.",
    "Her hafta aynı eziyeti yaşamak istemiyorum.",
    "Oyuncuların yüzünde savaşma isteği göremiyorum.",
    "Böyle ruhsuz futbol olmaz.",
    "Bu kadrodan bir cacık olmaz.",
    "Yönetim uyuma artık!",
    "Rakip bizi çocuk gibi oynattı.",
    "Değişiklikler tamamen yanlış.",
    "Pozisyon bulmak için dua ettik ya!",
    "Oyuncular yürüdü sadece, koşan yok.",
    "Böyle taktik mi olur anlamıyorum.",
    "Bizi yine rezil ettiniz.",
    "Bu oyunla ligde kalamayız haberiniz olsun.",
    "Kötü futbolun kitabını yazdık.",
    "Takım bu oyunu hak etmiyor.",
    "Bu yenilgi çok acı.",
    "Bugün futbol değil kabus izledik."
];

const FAN_TWEETS_DRAW = [
    "İki takım da vasattı.",
    "1 puan 1 puandır.",
    "Hakem maçı katletti.",
    "Kaçan gollere yanarım.",
    "Bu oyunla şampiyonluk hayal.",
    "Sıkıcı bir maçtı, uyuyakaldım.",
    "Yenilmemek önemli ama yenmeliydik.",
    "Defans iyiydi ama hücum yok.",
    "Bu maç tam sinir harbiydi.",
    "Biraz daha istekli olsak kazanırdık.",
    "Son paslar hep yanlış, niye böyle?",
    "Rakip de bir şey oynamadı zaten.",
    "Hakem kararları yine tartışmalıydı.",
    "Yine kaçan fırsatlar, alıştık.",
    "Beraberlik uzatmada kaçtı gibi hissediyorum.",
    "Oyuncular isteksiz gibiydi bugün.",
    "Orta saha bugün resmen kayıptı.",
    "Hücum bile yapamadık, nasıl kazanacağız?",
    "Bir puana sevineyim mi üzüleyim mi bilemedim.",
    "Topla oynadık ama gol yok.",
    "Bugün havamızda değildik.",
    "Şu net pozisyonları gole çeviremiyoruz.",
    "Bu kadroyla daha iyi oynamalıyız.",
    "Rakip kaleye gitmeden 1 puan aldık resmen.",
    "Şu net pozisyonları gole çeviremiyoruz.",
    "Bu kadroyla daha iyi oynamalıyız.",
    "Rakip kaleye gitmeden 1 puan aldık resmen.",
    "İki takım da bitiricilikten sınıfta kaldı.",
    "Bugün 3 puanı çöpe attık gibi hissediyorum.",
    "Pozisyonları değerlendiremeyince sonuç bu.",
    "Yine final paslarında saçmaladık.",
    "Rakibi ezdik ama gol yok...",
    "Kalecileri günündeydi, yapacak bir şey yok.",
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
        
        const updatedPlayers = team.players.map(p => {
            let player = { ...p };

            // 1. Update Season Stats (Goals, Assists)
            // Note: Ratings are usually calculated in `generateMatchStats` and stored in Fixture. 
            // Here we mainly process raw events.
            const goals = teamEvents.filter(e => e.type === 'GOAL' && e.scorer === p.name).length;
            const assists = teamEvents.filter(e => e.type === 'GOAL' && e.assist === p.name).length;
            
            player.seasonStats = {
                ...player.seasonStats,
                goals: player.seasonStats.goals + goals,
                assists: player.seasonStats.assists + assists,
                matchesPlayed: player.seasonStats.matchesPlayed + 1
            };
            
            // Generate a random rating for this match if not present (simplified logic)
            // In a full implementation, we'd grab the rating from the MatchStats object.
            const matchRating = 6 + (Math.random() * 4) + (goals * 1) + (assists * 0.5);
            const cappedRating = Math.min(10, Number(matchRating.toFixed(1)));
            player.seasonStats.ratings.push(cappedRating);
            const sum = player.seasonStats.ratings.reduce((a, b) => a + b, 0);
            player.seasonStats.averageRating = Number((sum / player.seasonStats.ratings.length).toFixed(1));


            // 2. Reset Injection flag
            if (player.hasInjectionForNextMatch) {
                player.hasInjectionForNextMatch = false;
                if (Math.random() < 0.3 && player.injury) {
                    player.injury.weeksRemaining += 4;
                }
            }

            // 3. Decrement existing injury
            if (player.injury) {
                player.injury.weeksRemaining -= 1;
                if (player.injury.weeksRemaining <= 0) {
                    player.injury = undefined; // Healed
                }
            }

            // 4. Check new injuries from match
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

            // 5. Check Red Card
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
