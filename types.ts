
export enum Position {
    GK = 'GK',
    DEF = 'DEF',
    MID = 'MID',
    FWD = 'FWD'
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
    ratings: number[]; // Store history to calc average
    averageRating: number;
    matchesPlayed: number;
}

export interface PlayerStats {
    pace: number;      
    shooting: number;  
    passing: number;   
    dribbling: number; 
    defending: number; 
    physical: number;  
    finishing: number; 
    heading: number;   
    corners: number;   
    stamina: number;   
}

export interface Injury {
    type: string; 
    weeksRemaining: number;
    description: string;
}

export interface Player {
    id: string;
    name: string;
    position: Position;
    skill: number; 
    stats: PlayerStats; 
    seasonStats: PlayerSeasonStats; // NEW
    age: number;
    value: number; 
    nationality: string;
    teamId: string;
    morale: number;
    suspendedUntilWeek?: number;
    injury?: Injury; 
    hasInjectionForNextMatch?: boolean; 
}

export interface Team {
    id: string;
    name: string;
    colors: [string, string]; 
    logo?: string;
    stars: number;
    fanBase: number; 
    stadiumName: string;
    budget: number; 
    players: Player[]; 
    
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
    strength: number; 
    morale: number; 
}

export interface MatchEvent {
    minute: number;
    description: string;
    type: 'GOAL' | 'MISS' | 'CARD_YELLOW' | 'CARD_RED' | 'INFO' | 'VAR' | 'FOUL' | 'CORNER' | 'INJURY' | 'OFFSIDE' | 'SAVE';
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
    playersBought: number;
    playersSold: number;
    moneySpent: number;
    moneyEarned: number;
    recordTransferFee: number;
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
    };
    playerRelations: { playerId: string; name: string; value: number }[]; 
    history: string[]; 
}

export interface GameState {
    managerName: string | null;
    manager: ManagerProfile | null; 
    myTeamId: string | null;
    currentWeek: number; 
    teams: Team[];
    fixtures: Fixture[];
    messages: string[];
    isGameStarted: boolean;
    transferList: Player[]; 
    trainingPerformed: boolean;
    news: NewsItem[]; 
}
