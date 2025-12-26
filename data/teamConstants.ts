
import { Team, Position, Mentality, PassingStyle, Tempo, Width, CreativeFreedom, DefensiveLine, Tackling, PressingFocus, TimeWasting, TacticStyle, AttackStyle, PressingStyle, AttackingTransition, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefLineMobility, PressIntensity, DefensiveTransition, PreventCrosses } from '../types';
import { generateId } from './gameConstants';
import { generatePlayer } from './playerConstants';
import { calculateRawTeamStrength } from '../utils/teamCalculations';

// User Defined Teams with provided Imgur Logos and Stadium Capacities
export const TEAM_TEMPLATES = [
    { 
        name: 'Ayıboğanspor SK', 
        logo: 'https://i.imgur.com/eV74XlV.png', 
        jersey: 'https://imgur.com/7PcfX6O.png',
        jerseyGK: 'https://imgur.com/DMnuhsQ.png', 
        colors: ['bg-purple-600', 'text-white'], 
        championships: 10,
        cups: 11,
        s_cups: 18,
        euro_cups: 0, 
        stadium: 'Mağara Arena', 
        capacity: 45000, 
        fans: 22000000, 
        budget: 15, 
        targetStrength: 84,
        baseReputation: 4.5,
        debt: 104, // M€
        leagueHistory: []
    },
    // ... (Keep other teams as they are, just ensuring the mapper below works) ...
    { 
        name: 'Kedispor', 
        logo: 'https://i.imgur.com/VSUm10b.png',
        jersey: 'https://imgur.com/abV3t3m.png',
        jerseyGK: 'https://imgur.com/CP63fXc.png', 
        colors: ['bg-red-600', 'text-white'], 
        championships: 8,
        cups: 14,
        s_cups: 10,
        euro_cups: 1, 
        stadium: 'Yumak Stadyumu', 
        capacity: 43000,
        fans: 18000000, 
        budget: 211, 
        targetStrength: 82,
        baseReputation: 4.1,
        debt: 122, 
        leagueHistory: []
    },
    { 
        name: 'Eşşekboğanspor FK', 
        logo: 'https://i.imgur.com/T1RiW8H.png',
        jersey: 'https://imgur.com/Zv3XZTY.png',
        jerseyGK: 'https://imgur.com/aKFKHs7.png', 
        colors: ['bg-blue-600', 'text-yellow-400'], 
        championships: 15,
        cups: 4,
        s_cups: 16,
        euro_cups: 0,
        stadium: 'Anadolu Arena', 
        capacity: 65000, 
        fans: 25000000, 
        budget: 12, 
        targetStrength: 81,
        baseReputation: 4.1,
        debt: 105, 
        leagueHistory: []
    },
    { name: 'Maymunspor', logo: 'https://i.imgur.com/kvhASjK.png', jersey: 'https://imgur.com/jfH3kal.png', colors: ['bg-purple-800', 'text-white'], championships: 4, cups: 7, s_cups: 6, euro_cups: 0, stadium: 'Muz Park', capacity: 21000, fans: 6000000, budget: 9, targetStrength: 78, baseReputation: 3.6, debt: 66, leagueHistory: [] },
    { name: 'Arıspor', logo: 'https://i.imgur.com/7vkiuxd.png', jersey: 'https://imgur.com/PidWwuV.png', jerseyGK: 'https://imgur.com/EF7HVUU.png', colors: ['bg-yellow-500', 'text-white'], championships: 3, cups: 2, s_cups: 3, euro_cups: 0, stadium: 'Kovan Stadyumu', capacity: 27000, fans: 1500000, budget: 22, targetStrength: 84, baseReputation: 4.3, debt: 64, leagueHistory: [] },
    { name: 'Köpekspor', logo: 'https://i.imgur.com/OoPWVvx.png', jersey: 'https://imgur.com/C2xKJtO.png', jerseyGK: 'https://imgur.com/hHtmxQv.png', colors: ['bg-blue-500', 'text-white'], championships: 2, cups: 9, s_cups: 11, euro_cups: 0, stadium: 'Kemik Arena', capacity: 41000, fans: 14500000, budget: 13, targetStrength: 80, baseReputation: 3.9, debt: 77, leagueHistory: [] },
    { name: 'Bulgariaspor', logo: 'https://i.imgur.com/RuCGNuc.png', jersey: 'https://imgur.com/eHAW2Fg.png', jerseyGK: 'https://imgur.com/Nz7hWFC.png', colors: ['bg-green-600', 'text-black'], championships: 0, cups: 0, s_cups: 0, euro_cups: 0, stadium: 'Tuna Park', capacity: 16500, fans: 500000, budget: 5, targetStrength: 75, baseReputation: 3.2, debt: 14, leagueHistory: [] },
    { name: 'Bedirspor', logo: 'https://i.imgur.com/pPchTUI.png', jersey: 'https://imgur.com/bdI85Wq.png', jerseyGK: 'https://imgur.com/eT3Qn69.png', colors: ['bg-purple-900', 'text-white'], championships: 0, cups: 7, s_cups: 3, euro_cups: 0, stadium: 'Bedir Stadı', capacity: 25000, fans: 850000, budget: 6, targetStrength: 73, baseReputation: 3.3, debt: 21, leagueHistory: [] },
    { name: 'Yakhubspor', logo: 'https://i.imgur.com/vcN5VhI.png', jersey: 'https://imgur.com/k64QPcT.png', jerseyGK: 'https://imgur.com/H2oygfo.png', colors: ['bg-orange-500', 'text-black'], championships: 0, cups: 5, s_cups: 2, euro_cups: 0, stadium: 'Çöl Fırtınası', capacity: 19500, fans: 750000, budget: 6, targetStrength: 72, baseReputation: 3.3, debt: 19, leagueHistory: [] },
    { name: 'Tekirspor', logo: 'https://i.imgur.com/JhXtd58.png', jersey: 'https://imgur.com/augQrXj.png', jerseyGK: 'https://imgur.com/G73BOHq.png', colors: ['bg-orange-400', 'text-white'], championships: 0, cups: 4, s_cups: 1, euro_cups: 0, stadium: 'Liman Arena', capacity: 18000, fans: 1200000, budget: 7, targetStrength: 74, baseReputation: 3.2, debt: 8, leagueHistory: [] },
    { name: 'Uzunoğullarıspor', logo: 'https://i.imgur.com/S4TVTee.png', jersey: 'https://imgur.com/BOyr0e6.png', jerseyGK: 'https://imgur.com/wAOAVng.png', colors: ['bg-black', 'text-white'], championships: 0, cups: 4, s_cups: 1, euro_cups: 0, stadium: 'Kule Stadı', capacity: 9500, fans: 200000, budget: 4, targetStrength: 71, baseReputation: 2.8, debt: 9, leagueHistory: [] },
    { name: 'Hamsispor', logo: 'https://i.imgur.com/LqtejWJ.png', jersey: 'https://imgur.com/BP2TPF8.png', jerseyGK: 'https://imgur.com/rhp2PXq.png', colors: ['bg-red-900', 'text-blue-400'], championships: 0, cups: 3, s_cups: 1, euro_cups: 0, stadium: 'Deniz Kenarı', capacity: 22000, fans: 2000000, budget: 114, targetStrength: 70, baseReputation: 3.0, debt: 19, leagueHistory: [] },
    { name: 'Osurukspor', logo: 'https://i.imgur.com/Iz505sK.png', jersey: 'https://imgur.com/eqUzVTA.png', jerseyGK: 'https://imgur.com/ZjPlTwJ.png', colors: ['bg-green-500', 'text-white'], championships: 0, cups: 0, s_cups: 0, euro_cups: 0, stadium: 'Rüzgar Vadisi', capacity: 14500, fans: 300000, budget: 324, targetStrength: 67, baseReputation: 2.8, debt: 17, leagueHistory: [] },
    { name: 'Yeni Bozkurtspor', logo: 'https://i.imgur.com/n17A3Cw.png', jersey: 'https://imgur.com/QtcPbrG.png', jerseyGK: 'https://imgur.com/syiHDWW.png', colors: ['bg-amber-800', 'text-black'], championships: 0, cups: 0, s_cups: 2, euro_cups: 0, stadium: 'Ova Arena', capacity: 34500, fans: 2100000, budget: 7, targetStrength: 76, baseReputation: 3.4, debt: 33, leagueHistory: [] },
    { name: 'Civciv FK', logo: 'https://i.imgur.com/eUpKqYk.png', jersey: 'https://imgur.com/9JuH2nU.png', jerseyGK: 'https://imgur.com/00KMILk.png', colors: ['bg-yellow-400', 'text-blue-900'], championships: 0, cups: 0, s_cups: 0, euro_cups: 0, stadium: 'Kümes Park', capacity: 11700, fans: 400000, budget: 2, targetStrength: 68, baseReputation: 2.7, debt: 11, leagueHistory: [] },
    { name: 'Aston Karakoçan', logo: 'https://i.imgur.com/sw63G9H.png', jersey: 'https://imgur.com/z3S5RuL.png', jerseyGK: 'https://imgur.com/HXvBipD.png', colors: ['bg-indigo-900', 'text-blue-400'], championships: 0, cups: 0, s_cups: 0, euro_cups: 0, stadium: 'Şehir Stadı', capacity: 29000, fans: 1600000, budget: 8, targetStrength: 75, baseReputation: 3.1, debt: 15, leagueHistory: [] },
    { name: 'Küheylanspor', logo: 'https://i.imgur.com/WG9bJgB.png', jersey: 'https://imgur.com/QDHs7Sy.png', jerseyGK: 'https://imgur.com/r4F2Ykh.png', colors: ['bg-red-600', 'text-white'], championships: 0, cups: 3, s_cups: 0, euro_cups: 0, stadium: 'Hipodrom Arena', capacity: 30300, fans: 450000, budget: 4, targetStrength: 72, baseReputation: 3.0, debt: 16, leagueHistory: [] },
    { name: 'İslamspor', logo: 'https://i.imgur.com/JROZfTX.png', jersey: 'https://imgur.com/g5voy0X.png', jerseyGK: 'https://imgur.com/W71pkOG.png', colors: ['bg-green-500', 'text-green-900'], championships: 0, cups: 0, s_cups: 0, euro_cups: 0, stadium: 'Barış Parkı', capacity: 33100, fans: 1950000, budget: 8, targetStrength: 74, baseReputation: 3.1, debt: 7, leagueHistory: [] }
];

export const RIVALRIES = [
    ['Ayıboğanspor SK', 'Kedispor'],
    ['Kedispor', 'Eşşekboğanspor FK'],
    ['Eşşekboğanspor FK', 'Ayıboğanspor SK'],
    ['Kedispor', 'Köpekspor'],
    ['Bedirspor', 'Yakhubspor']
];

export const initializeTeams = (): Team[] => {
    return TEAM_TEMPLATES.map((tmpl) => {
        const teamId = generateId();
        
        const maxForeigners = tmpl.targetStrength >= 80 ? 11 : 5;
        let currentForeigners = 0;

        const createPlayer = (pos: Position, strength: number) => {
            const canBeForeign = currentForeigners < maxForeigners;
            const jerseyToUse = pos === Position.GK ? tmpl.jerseyGK : tmpl.jersey;
            
            const p = generatePlayer(pos, strength, teamId, canBeForeign, jerseyToUse);
            if (p.nationality !== 'Türkiye') {
                currentForeigners++;
            }
            return p;
        }
        
        // ... (Player Creation Logic remains the same) ...
        const gk = createPlayer(Position.GK, tmpl.targetStrength);
        const slb = createPlayer(Position.SLB, tmpl.targetStrength);
        const stp1 = createPlayer(Position.STP, tmpl.targetStrength);
        const stp2 = createPlayer(Position.STP, tmpl.targetStrength);
        const sgb = createPlayer(Position.SGB, tmpl.targetStrength);
        const slk = createPlayer(Position.SLK, tmpl.targetStrength);
        const os1 = createPlayer(Position.OS, tmpl.targetStrength);
        const os2 = createPlayer(Position.OS, tmpl.targetStrength);
        const sgk = createPlayer(Position.SGK, tmpl.targetStrength);
        const snt1 = createPlayer(Position.SNT, tmpl.targetStrength);
        const snt2 = createPlayer(Position.SNT, tmpl.targetStrength);
        const subGK = createPlayer(Position.GK, tmpl.targetStrength - 5);
        const subDEF1 = createPlayer(Position.STP, tmpl.targetStrength - 5);
        const subDEF2 = createPlayer(Position.SLB, tmpl.targetStrength - 5); 
        const subMID1 = createPlayer(Position.OS, tmpl.targetStrength - 5);
        const subMID2 = createPlayer(Position.OOS, tmpl.targetStrength - 5); 
        const subFWD1 = createPlayer(Position.SLK, tmpl.targetStrength - 5); 
        const subFWD2 = createPlayer(Position.SNT, tmpl.targetStrength - 5);
        const reserves = [];
        reserves.push(createPlayer(Position.GK, tmpl.targetStrength - 10));
        reserves.push(createPlayer(Position.SGB, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.STP, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.OS, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.SGK, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.SNT, tmpl.targetStrength - 8));

        const players = [gk, slb, stp1, stp2, sgb, slk, os1, os2, sgk, snt1, snt2, subGK, subDEF1, subDEF2, subMID1, subMID2, subFWD1, subFWD2, ...reserves];

        const rawStrength = calculateRawTeamStrength(players);
        const strengthDelta = tmpl.targetStrength - rawStrength;
        const totalValue = players.reduce((sum, p) => sum + p.value, 0);
        const estimatedWages = totalValue * 0.005 * 52; 

        const strengthFactor = tmpl.targetStrength / 100;
        const fanFactor = tmpl.fans / 1000000;
        const totalMonthlySponsorValue = ((tmpl.championships * 2) + (fanFactor * 0.5)) / 12;
        const annualTotal = totalMonthlySponsorValue * 12;
        const mainSponsorValue = Number((annualTotal * 0.6).toFixed(2));
        const stadiumSponsorValue = Number((annualTotal * 0.3).toFixed(2));
        const sleeveSponsorValue = Number((annualTotal * 0.1).toFixed(2));

        return {
            id: teamId,
            name: tmpl.name,
            colors: tmpl.colors as [string, string],
            logo: tmpl.logo,
            jersey: tmpl.jersey,
            championships: tmpl.championships,
            domesticCups: tmpl.cups || 0,
            superCups: tmpl.s_cups || 0,
            europeanCups: tmpl.euro_cups || 0,
            fanBase: tmpl.fans,
            stadiumName: tmpl.stadium,
            stadiumCapacity: tmpl.capacity,
            budget: tmpl.budget,
            initialDebt: tmpl.debt,
            wageBudget: Number((estimatedWages * 1.1).toFixed(1)), 
            players,
            reputation: tmpl.baseReputation, 
            leagueHistory: tmpl.leagueHistory || [], 
            
            sponsors: {
                main: { name: 'HAYVANLAR HOLDING', yearlyValue: mainSponsorValue, expiryYear: 2026 },
                stadium: { name: tmpl.stadium, yearlyValue: stadiumSponsorValue, expiryYear: 2026 },
                sleeve: { name: 'Süper Toto', yearlyValue: sleeveSponsorValue, expiryYear: 2026 }
            },

            financialRecords: {
                income: { transfers: 0, tv: 0, merch: 0, loca: 0, gate: 0, sponsor: 0 },
                expense: { wages: 0, transfers: 0, staff: 0, maint: 0, academy: 0, debt: 0, matchDay: 0, travel: 0, scouting: 0, admin: 0, bonus: 0, fines: 0 }
            },
            transferHistory: [], 
            
            // --- NEW TACTICAL DEFAULTS ---
            formation: '4-4-2',
            mentality: Mentality.STANDARD,
            
            // Possession
            passing: PassingStyle.STANDARD,
            tempo: Tempo.STANDARD,
            width: Width.STANDARD,
            attackingTransition: AttackingTransition.STANDARD,
            creative: CreativeFreedom.STANDARD,
            setPiecePlay: SetPiecePlay.RECYCLE,
            playStrategy: PlayStrategy.STANDARD,
            goalKickType: GoalKickType.SHORT,
            gkDistributionTarget: GKDistributionTarget.CBS,
            supportRuns: SupportRuns.BALANCED,
            dribbling: Dribbling.STANDARD,
            focusArea: FocusArea.STANDARD,
            passTarget: PassTarget.STANDARD,
            patience: Patience.STANDARD,
            longShots: LongShots.STANDARD,
            crossing: CrossingType.STANDARD,
            gkDistSpeed: GKDistributionSpeed.STANDARD,

            // Out of Possession
            pressingLine: PressingLine.MID,
            defLine: DefensiveLine.STANDARD,
            defLineMobility: DefLineMobility.BALANCED,
            pressIntensity: PressIntensity.STANDARD,
            defensiveTransition: DefensiveTransition.STANDARD,
            tackling: Tackling.STANDARD,
            preventCrosses: PreventCrosses.STANDARD,
            pressFocus: PressingFocus.BALANCED,
            
            timeWasting: TimeWasting.SOMETIMES,
            
            tactic: TacticStyle.BALANCED,
            attackStyle: AttackStyle.MIXED,
            pressingStyle: PressingStyle.BALANCED,

            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
            strength: tmpl.targetStrength, 
            rawStrength: rawStrength,      
            strengthDelta: strengthDelta,  
            morale: 70 
        };
    });
};
