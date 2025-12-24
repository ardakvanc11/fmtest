
export enum Position {
    GK = 'GK',
    SLB = 'SLB', // Sol Bek
    STP = 'STP', // Stoper
    SGB = 'SGB', // Sağ Bek
    OS = 'OS',   // Merkez Orta Saha
    OOS = 'OOS', // Ofansif Orta Saha
    SLK = 'SLK', // Sol Kanat
    SGK = 'SGK', // Sağ Kanat
    SNT = 'SNT'  // Santrafor
}

// --- NEW TACTICAL ENUMS ---

export enum Mentality {
    DEFENSIVE = 'Defansif (Otobüsü Çek)',
    CAUTIOUS = 'Temkinli',
    BALANCED = 'Dengeli',
    POSITIVE = 'Pozitif Futbol',
    ATTACKING = 'Hücum',
    ALL_OUT = 'Topyekün Saldırı'
}

export enum PassingStyle {
    SHORT = 'Kısa Pas',
    DIRECT = 'Direkt / Uzun Top',
    MIXED = 'Karışık'
}

export enum Tempo {
    SLOW = 'Düşük',
    NORMAL = 'Normal',
    FAST = 'Yüksek'
}

export enum Width {
    NARROW = 'Dar Alan',
    NORMAL = 'Normal',
    WIDE = 'Geniş Alan (Çizgiye İn)'
}

export enum CreativeFreedom {
    DISCIPLINED = 'Disiplinli Oyna',
    BALANCED = 'Dengeli',
    EXPRESSIVE = 'Yaratıcı Oyna'
}

export enum FinalThird {
    WORK_INTO_BOX = 'Paslaşarak Gir',
    MIXED = 'Karışık',
    SHOOT_ON_SIGHT = 'Kaleyi Görünce Vur'
}

export enum Crossing {
    FLOAT = 'Havadan (Arka Direk)',
    MIXED = 'Karışık',
    DRILL = 'Yerden Sert'
}

export enum DefensiveLine {
    DEEP = 'Geride Karşıla',
    STANDARD = 'Standart',
    HIGH = 'Önde Bas (Ofsayt Taktiği)'
}

export enum Tackling {
    CAUTIOUS = 'Temkinli (Ayakta Kal)',
    NORMAL = 'Normal',
    AGGRESSIVE = 'Sert (Topa Dal)'
}

export enum PressingFocus {
    CENTER = 'Ortayı Kapat',
    MIXED = 'Karışık',
    WINGS = 'Kanatlara Zorla'
}

export enum TimeWasting {
    NEVER = 'Asla',
    SOMETIMES = 'Bazen',
    FREQUENTLY = 'Sık Sık (Zaman Geçir)'
}

// Old enums kept for compatibility logic, but UI will use new ones mostly
export enum TacticStyle {
    BALANCED = 'Dengeli',
    ATTACKING = 'Hücum',
    DEFENSIVE = 'Defansif',
    COUNTER = 'Kontra Atak',
    TIKI_TAKA = 'Pas Oyunu'
}

export enum AttackStyle {
    CENTER = 'Ortadan',
    WINGS = 'Kanatlardan',
    MIXED = 'Karışık'
}

export enum PressingStyle {
    LOW = 'Düşük (Bekle)',
    BALANCED = 'Dengeli',
    HIGH = 'Yüksek Pres',
    GEGEN = 'Gegenpress (Şok Pres)'
}

export interface PlayerSeasonStats {
    goals: number;
    assists: number;
    yellowCards: number; // YENI
    redCards: number;    // YENI
    ratings: number[]; // Store history to calc average
    averageRating: number;
    matchesPlayed: number;
}

export interface PlayerStats {
    // TEKNİK
    finishing: number;      // Bitiricilik
    dribbling: number;      // Dripling
    firstTouch: number;     // İlk Kontrol
    heading: number;        // Kafa Vuruşu
    corners: number;        // Korner
    marking: number;        // Markaj
    crossing: number;       // Orta Yapma
    passing: number;        // Pas
    penalty: number;        // Penaltı Kullanma
    freeKick: number;       // Serbest Vuruş
    technique: number;      // Teknik
    tackling: number;       // Top Kapma
    longShots: number;      // Uzaktan Şut
    longThrows: number;     // Uzun Taç

    // ZİHİNSEL
    aggression: number;     // Agresiflik
    bravery: number;        // Cesaret
    workRate: number;       // Çalışkanlık
    decisions: number;      // Karar Alma
    determination: number;  // Kararlılık
    concentration: number;  // Konsantrasyon
    leadership: number;     // Liderlik
    anticipation: number;   // Önsezi
    flair: number;          // Özel Yetenek
    positioning: number;    // Pozisyon Alma
    composure: number;      // Soğukkanlılık
    teamwork: number;       // Takım Oyunu
    offTheBall: number;     // Topsuz Alan
    vision: number;         // Vizyon

    // FİZİKSEL
    agility: number;        // Çeviklik
    stamina: number;        // Dayanıklılık
    balance: number;        // Denge
    physical: number;       // Güç
    pace: number;           // Hız
    acceleration: number;   // Hızlanma
    naturalFitness: number; // Vücut Zindeliği
    jumping: number;        // Zıplama
    
    // Legacy support (to avoid breaking engine immediately)
    shooting?: number;
    defending?: number;
}

export interface Injury {
    type: string; 
    daysRemaining: number; // Changed from weeksRemaining to daysRemaining
    description: string;
}

export interface PastInjury {
    type: string;
    week: number;
    durationDays: number; // Changed from duration (weeks) to durationDays
}

export interface PlayerFaceData {
    skin: string;
    eyes: string;
    brows: string;
    hair: string;
    beard?: string;
    freckles?: string;
    tattoo?: string;
}

export interface Player {
    id: string;
    name: string;
    position: Position;
    secondaryPosition?: Position; // NEW: Added secondary position
    skill: number;
    potential: number; // NEW: Fixed Potential Ability
    stats: PlayerStats; 
    seasonStats: PlayerSeasonStats; // NEW
    face: PlayerFaceData; // NEW: Layered face data
    jersey?: string; // NEW: Specific jersey URL for the player
    age: number;
    height: number; // YENİ
    preferredFoot: string; // YENİ
    contractExpiry: number; // YENİ (Yıl)
    value: number;
    wage?: number; // YENİ: Yıllık Maaş (M€) - Eğer undefined ise value üzerinden hesaplanır
    nationality: string;
    teamId: string;
    morale: number;
    condition: number; // NEW: Current Energy (0-100). stats.stamina is the Attribute.
    suspendedUntilWeek?: number;
    injury?: Injury; 
    hasInjectionForNextMatch?: boolean; 
    injurySusceptibility: number; // 0-100 (Higher is worse)
    injuryHistory: PastInjury[];
    lastInjuryDurationDays?: number; // Used to calculate recovery speed after injury
    squadStatus?: string; // NEW: Manually assigned squad status (e.g., 'STAR', 'FIRST_XI')
    nextNegotiationWeek?: number; // NEW: Cooldown for negotiations (Week Number)
    activePromises?: string[]; // NEW: Promises made to the player
}

export interface FinancialRecords {
    income: {
        transfers: number;
        tv: number;
        merch: number;
        loca: number;
        gate: number;
        sponsor: number;
    };
    expense: {
        wages: number;
        transfers: number;
        staff: number;
        maint: number;
        academy: number;
        debt: number;
        matchDay: number;
        travel: number;
        scouting: number;
        admin: number;
        bonus: number;
        fines: number;
    };
}

export interface HistoricalRanking {
    year: string;
    rank: number;
}

export interface TransferRecord {
    date: string; // Formatted date string e.g. "12 Tem"
    playerName: string;
    type: 'BOUGHT' | 'SOLD';
    counterparty: string; // "From X" or "To X"
    price: string; // Display string "12.5 M€"
}

// NEW: Sponsor Structure
export interface SponsorDeal {
    name: string;
    yearlyValue: number;
    expiryYear: number;
}

export interface TeamSponsors {
    main: SponsorDeal;
    stadium: SponsorDeal;
    sleeve: SponsorDeal;
}

export interface Team {
    id: string;
    name: string;
    colors: [string, string]; 
    logo?: string;
    jersey?: string; // NEW: Base jersey URL for the team
    championships: number; // CHANGED: Replaced stars with championships
    domesticCups?: number; // NEW: Türkiye Kupası Sayısı
    superCups?: number; // NEW: Süper Kupa Sayısı
    europeanCups?: number; // NEW: Avrupa Kupası Sayısı
    fanBase: number; 
    stadiumName: string;
    stadiumCapacity: number; // NEW: Added stadium capacity
    budget: number; 
    initialDebt: number; // NEW: Fixed debt amount (M€)
    wageBudget?: number; // NEW: Explicit Wage Budget Allocation to prevent reset bugs
    players: Player[]; 
    reputation: number; // NEW: Dynamic reputation value (base 1-5)
    
    // --- FINANCIALS ---
    financialRecords: FinancialRecords; // Cumulative Season Data
    transferHistory: TransferRecord[]; // NEW: Real transfer logs
    sponsors: TeamSponsors; // NEW: Stored sponsor deals

    // --- TACTICS ---
    formation: string; 
    mentality: Mentality;
    passing: PassingStyle;
    tempo: Tempo;
    width: Width;
    creative: CreativeFreedom;
    finalThird: FinalThird;
    crossing: Crossing;
    defLine: DefensiveLine;
    tackling: Tackling;
    pressFocus: PressingFocus;
    timeWasting: TimeWasting;
    
    // Legacy support (optional or mapped)
    tactic: TacticStyle; 
    attackStyle: AttackStyle; 
    pressingStyle: PressingStyle; 

    stats: {
        played: number;
        won: number;
        drawn: number;
        lost: number;
        gf: number;
        ga: number;
        points: number;
    };
    strength: number; // Visible Strength (GTÜ)
    rawStrength?: number; // Calculated Strength (THG) - Hidden base
    strengthDelta?: number; // The constant difference (Delta)
    morale: number; 
    leagueHistory?: HistoricalRanking[]; // NEW: Historical rankings
}

export interface MatchEvent {
    minute: number;
    description: string;
    type: 'GOAL' | 'MISS' | 'CARD_YELLOW' | 'CARD_RED' | 'INFO' | 'VAR' | 'FOUL' | 'CORNER' | 'INJURY' | 'OFFSIDE' | 'SAVE' | 'SUBSTITUTION';
    teamName?: string;
    scorer?: string;
    assist?: string;
    playerId?: string; 
    varOutcome?: 'GOAL' | 'NO_GOAL'; 
}

export interface PlayerPerformance {
    playerId: string;
    name: string;
    position: Position;
    rating: number; 
    goals: number;
    assists: number;
}

export interface OpponentStatement {
    managerName: string;
    text: string;
    mood: 'ANGRY' | 'HAPPY' | 'NEUTRAL';
}

export interface MatchStats {
    homePossession: number;
    awayPossession: number;
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
    homeCorners: number; 
    awayCorners: number; 
    homeFouls: number; 
    awayFouls: number; 
    homeOffsides: number;
    awayOffsides: number;
    homeYellowCards: number;
    awayYellowCards: number;
    homeRedCards: number;
    awayRedCards: number;
    mvpPlayerId: string;
    mvpPlayerName: string;
    homeRatings: PlayerPerformance[];
    awayRatings: PlayerPerformance[];
    opponentStatement?: OpponentStatement;
    managerCards?: 'YELLOW' | 'RED' | null;
}

export interface BettingOdds {
    home: number;
    draw: number;
    away: number;
}

export interface Fixture {
    id: string;
    week: number;
    date: string; // ISO Date String
    homeTeamId: string;
    awayTeamId: string;
    played: boolean;
    homeScore: number | null;
    awayScore: number | null;
    matchEvents?: MatchEvent[]; 
    stats?: MatchStats; 
}

export interface NewsItem {
    id: string;
    week: number;
    title: string;
    content: string;
    type: 'MATCH' | 'TRANSFER' | 'INTERVIEW' | 'INJURY' | 'OTHER';
    image?: string; 
}

export interface InterviewOption {
    id: string;
    text: string;
    effect: {
        teamMorale?: number;
        playerMorale?: number;
        description: string;
        trustUpdate?: {
            board?: number;
            fans?: number;
            players?: number;
            referees?: number;
            media?: number; // NEW: Media trust
        };
    };
}

export interface InterviewQuestion {
    id: string;
    question: string;
    relatedPlayerId?: string; 
    options: InterviewOption[];
}

export interface HalftimeTalkOption {
    id: string;
    text: string;
    style: 'AGGRESSIVE' | 'CALM' | 'MOTIVATIONAL';
    effectDesc: string;
}

export interface ManagerStats {
    matchesManaged: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    trophies: number;
    // Detailed Trophies for Power Calculation
    leagueTitles: number;
    domesticCups: number;
    europeanCups: number;
    
    playersBought: number;
    playersSold: number;
    moneySpent: number; // Total Cumulative
    moneyEarned: number; // Total Cumulative
    
    // NEW: Monthly Trackers
    transferSpendThisMonth: number;
    transferIncomeThisMonth: number;

    recordTransferFee: number;
    careerEarnings: number; // NEW: Personal money earned by manager
}

export interface ManagerProfile {
    name: string;
    age: number;
    nationality: string;
    power: number; 
    stats: ManagerStats;
    contract: {
        salary: number; 
        expires: number; 
        teamName: string;
    };
    trust: {
        board: number; 
        fans: number; 
        players: number; 
        referees: number; 
        media: number; // NEW: Media trust
    };
    playerRelations: { playerId: string; name: string; value: number }[]; 
    history: string[]; 
}

export interface MessageHistory {
    id: number;
    text: string;
    time: string;
    isMe: boolean;
}

export interface Message {
    id: number;
    sender: string;
    subject: string;
    preview: string;
    date: string;
    read: boolean;
    avatarColor: string;
    history: MessageHistory[];
    options: string[];
}

// NEW: Pending Transfer Interface
export interface PendingTransfer {
    playerId: string;
    sourceTeamId: string;
    agreedFee: number;
    date: string;
}

export interface SeasonChampion {
    teamId: string;
    teamName: string;
    logo?: string;
    colors: [string, string];
    season: string;
}

// --- NEW: SEASON SUMMARY TYPES ---
export interface TransferImpact {
    name: string;
    fee: number;
    goals: number;
    assists: number;
    rating: number;
    type: 'BOUGHT';
}

export interface SeasonSummary {
    season: string;
    teamName: string;
    rank: number;
    stats: {
        wins: number;
        draws: number;
        losses: number;
        goalsFor: number;
        goalsAgainst: number;
        points: number;
    };
    bestXI: Player[]; // Snapshot of players
    topScorer: { name: string, count: number };
    topAssister: { name: string, count: number };
    topRated: { name: string, rating: number };
    trophiesWon: string[]; // "Lig Şampiyonluğu", "Türkiye Kupası" etc.
    transfersIn: TransferImpact[];
}

export interface GameState {
    managerName: string | null;
    manager: ManagerProfile | null; 
    myTeamId: string | null;
    currentWeek: number; 
    currentDate: string; // ISO Date String
    teams: Team[];
    fixtures: Fixture[];
    messages: Message[]; // Updated to Message[]
    isGameStarted: boolean;
    transferList: Player[]; 
    trainingPerformed: boolean;
    news: NewsItem[]; 
    playTime: number; // Seconds played
    lastSeenInjuryCount: number; // For health center badge
    pendingTransfers: PendingTransfer[]; // NEW: Queue for delayed transfers
    seasonChampion?: SeasonChampion | null; // NEW: Stores the champion to trigger celebration
    lastSeasonSummary?: SeasonSummary | null; // NEW: Stores last season data for modal
}