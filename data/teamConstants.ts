
import { Team, Position, Mentality, PassingStyle, Tempo, Width, CreativeFreedom, FinalThird, Crossing, DefensiveLine, Tackling, PressingFocus, TimeWasting, TacticStyle, AttackStyle, PressingStyle } from '../types';
import { generateId } from './gameConstants';
import { generatePlayer } from './playerConstants';

// User Defined Teams with provided Imgur Logos and Stadium Capacities
export const TEAM_TEMPLATES = [
    { 
        name: 'Ayıboğanspor SK', 
        logo: 'https://i.imgur.com/eV74XlV.png', 
        jersey: 'https://imgur.com/7PcfX6O.png',
        jerseyGK: 'https://imgur.com/DMnuhsQ.png', // GK Overlay
        colors: ['bg-purple-600', 'text-white'], 
        championships: 10, 
        stadium: 'Mağara Arena', 
        capacity: 45000, 
        fans: 12000000, 
        budget: 15, 
        targetStrength: 84 
    },
    { 
        name: 'Kedispor', 
        logo: 'https://i.imgur.com/VSUm10b.png',
        jersey: 'https://imgur.com/abV3t3m.png',
        jerseyGK: 'https://imgur.com/CP63fXc.png', // GK Overlay
        colors: ['bg-red-600', 'text-white'], 
        championships: 8, 
        stadium: 'Yumak Stadyumu', 
        capacity: 43000,
        fans: 8000000, 
        budget: 20, 
        targetStrength: 82 
    },
    { 
        name: 'Eşşekboğanspor FK', 
        logo: 'https://i.imgur.com/T1RiW8H.png',
        jersey: 'https://imgur.com/Zv3XZTY.png',
        jerseyGK: 'https://imgur.com/aKFKHs7.png', // GK Overlay
        colors: ['bg-blue-600', 'text-yellow-400'], 
        championships: 15, 
        stadium: 'Anadolu Arena', 
        capacity: 65000, 
        fans: 15000000, 
        budget: 12, 
        targetStrength: 81 
    },
    { 
        name: 'Maymunspor', 
        logo: 'https://i.imgur.com/kvhASjK.png',
        jersey: 'https://imgur.com/jfH3kal.png',
        // jerseyGK: undefined, // No GK Overlay provided
        colors: ['bg-purple-800', 'text-white'], 
        championships: 4, 
        stadium: 'Muz Park',
        capacity: 21000,
        fans: 3000000, 
        budget: 9, 
        targetStrength: 78 
    },
    { 
        name: 'Arıspor', 
        logo: 'https://i.imgur.com/7vkiuxd.png',
        jersey: 'https://imgur.com/PidWwuV.png',
        jerseyGK: 'https://imgur.com/EF7HVUU.png', // GK Overlay
        colors: ['bg-yellow-500', 'text-white'], 
        championships: 3, 
        stadium: 'Kovan Stadyumu',
        capacity: 27000,
        fans: 1500000, 
        budget: 22, 
        targetStrength: 84 
    },
    { 
        name: 'Köpekspor', 
        logo: 'https://i.imgur.com/OoPWVvx.png',
        jersey: 'https://imgur.com/C2xKJtO.png',
        jerseyGK: 'https://imgur.com/hHtmxQv.png', // GK Overlay
        colors: ['bg-blue-500', 'text-white'], 
        championships: 2, 
        stadium: 'Kemik Arena',
        capacity: 41000,
        fans: 6500000, 
        budget: 13, 
        targetStrength: 80 
    },
    { 
        name: 'Bulgariaspor', 
        logo: 'https://i.imgur.com/RuCGNuc.png',
        jersey: 'https://imgur.com/eHAW2Fg.png',
        jerseyGK: 'https://imgur.com/Nz7hWFC.png', // GK Overlay
        colors: ['bg-green-600', 'text-black'], 
        championships: 0, 
        stadium: 'Tuna Park',
        capacity: 16500,
        fans: 500000, 
        budget: 5, 
        targetStrength: 75 
    },
    { 
        name: 'Bedirspor', 
        logo: 'https://i.imgur.com/pPchTUI.png',
        jersey: 'https://imgur.com/bdI85Wq.png',
        jerseyGK: 'https://imgur.com/eT3Qn69.png', // GK Overlay
        colors: ['bg-purple-900', 'text-white'], 
        championships: 0, 
        stadium: 'Bedir Stadı',
        capacity: 25000,
        fans: 850000, 
        budget: 6, 
        targetStrength: 73 
    },
    { 
        name: 'Yakhubspor', 
        logo: 'https://i.imgur.com/vcN5VhI.png',
        jersey: 'https://imgur.com/k64QPcT.png',
        jerseyGK: 'https://imgur.com/H2oygfo.png', // GK Overlay
        colors: ['bg-orange-500', 'text-black'], 
        championships: 0, 
        stadium: 'Çöl Fırtınası',
        capacity: 19500,
        fans: 750000, 
        budget: 6, 
        targetStrength: 72 
    },
    { 
        name: 'Tekirspor', 
        logo: 'https://i.imgur.com/JhXtd58.png',
        jersey: 'https://imgur.com/augQrXj.png',
        jerseyGK: 'https://imgur.com/G73BOHq.png', // GK Overlay
        colors: ['bg-orange-400', 'text-white'], 
        championships: 0, 
        stadium: 'Liman Arena',
        capacity: 18000,
        fans: 1200000, 
        budget: 7, 
        targetStrength: 74 
    },
    { 
        name: 'Uzunoğullarıspor', 
        logo: 'https://i.imgur.com/S4TVTee.png',
        jersey: 'https://imgur.com/BOyr0e6.png',
        jerseyGK: 'https://imgur.com/wAOAVng.png', // GK Overlay
        colors: ['bg-black', 'text-white'], 
        championships: 0, 
        stadium: 'Kule Stadı',
        capacity: 9500,
        fans: 200000, 
        budget: 4, 
        targetStrength: 71 
    },
    { 
        name: 'Hamsispor', 
        logo: 'https://i.imgur.com/LqtejWJ.png',
        jersey: 'https://imgur.com/BP2TPF8.png',
        jerseyGK: 'https://imgur.com/rhp2PXq.png', // GK Overlay
        colors: ['bg-red-900', 'text-blue-400'], 
        championships: 0, 
        stadium: 'Deniz Kenarı',
        capacity: 22000,
        fans: 2000000, 
        budget: 5, 
        targetStrength: 70 
    },
    { 
        name: 'Osurukspor', 
        logo: 'https://i.imgur.com/Iz505sK.png',
        jersey: 'https://imgur.com/eqUzVTA.png',
        jerseyGK: 'https://imgur.com/ZjPlTwJ.png', // GK Overlay
        colors: ['bg-green-500', 'text-white'], 
        championships: 0, 
        stadium: 'Rüzgar Vadisi',
        capacity: 14500,
        fans: 300000, 
        budget: 3, 
        targetStrength: 67 
    },
    { 
        name: 'Yeni Bozkurtspor', 
        logo: 'https://i.imgur.com/n17A3Cw.png',
        jersey: 'https://imgur.com/QtcPbrG.png',
        jerseyGK: 'https://imgur.com/syiHDWW.png', // GK Overlay
        colors: ['bg-amber-800', 'text-black'], 
        championships: 0, 
        stadium: 'Ova Arena',
        capacity: 34500,
        fans: 2100000, 
        budget: 7, 
        targetStrength: 76 
    },
    { 
        name: 'Civciv FK', 
        logo: 'https://i.imgur.com/eUpKqYk.png',
        jersey: 'https://imgur.com/9JuH2nU.png',
        jerseyGK: 'https://imgur.com/00KMILk.png', // GK Overlay
        colors: ['bg-yellow-400', 'text-blue-900'], 
        championships: 0, 
        stadium: 'Kümes Park',
        capacity: 11700,
        fans: 400000, 
        budget: 2, 
        targetStrength: 68 
    },
    { 
        name: 'Aston Karakoçan', 
        logo: 'https://i.imgur.com/sw63G9H.png',
        jersey: 'https://imgur.com/z3S5RuL.png',
        jerseyGK: 'https://imgur.com/HXvBipD.png', // GK Overlay
        colors: ['bg-indigo-900', 'text-blue-400'], 
        championships: 0, 
        stadium: 'Şehir Stadı',
        capacity: 29000,
        fans: 1600000, 
        budget: 8, 
        targetStrength: 75 
    },
    { 
        name: 'Küheylanspor', 
        logo: 'https://i.imgur.com/WG9bJgB.png',
        jersey: 'https://imgur.com/QDHs7Sy.png',
        jerseyGK: 'https://imgur.com/r4F2Ykh.png', // GK Overlay
        colors: ['bg-red-600', 'text-white'], 
        championships: 0, 
        stadium: 'Hipodrom Arena',
        capacity: 30300,
        fans: 450000, 
        budget: 4, 
        targetStrength: 72 
    },
    { 
        name: 'İslamspor', 
        logo: 'https://i.imgur.com/JROZfTX.png',
        jersey: 'https://imgur.com/g5voy0X.png',
        jerseyGK: 'https://imgur.com/W71pkOG.png', // GK Overlay
        colors: ['bg-green-500', 'text-green-900'], 
        championships: 0, 
        stadium: 'Barış Parkı',
        capacity: 33100,
        fans: 1950000, 
        budget: 8, 
        targetStrength: 74 
    }
];

// Rivalry Definitions
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
        
        // Define foreign player limits based on team strength
        // > 80 Strength: Max 11 foreigners
        // < 80 Strength: Max 5 foreigners
        const maxForeigners = tmpl.targetStrength >= 80 ? 11 : 5;
        let currentForeigners = 0;

        // Helper wrapper to create player and track foreign count
        const createPlayer = (pos: Position, strength: number) => {
            const canBeForeign = currentForeigners < maxForeigners;
            // Determine Jersey: If GK, use the GK overlay. If outfield, use normal jersey.
            const jerseyToUse = pos === Position.GK ? tmpl.jerseyGK : tmpl.jersey;
            
            const p = generatePlayer(pos, strength, teamId, canBeForeign, jerseyToUse);
            if (p.nationality !== 'Türkiye') {
                currentForeigners++;
            }
            return p;
        }
        
        // Construct detailed 4-4-2 Lineup (0-10) with specific positions
        
        // 1. GK
        const gk = createPlayer(Position.GK, tmpl.targetStrength);
        
        // 2. Defense Line (SLB - STP - STP - SGB)
        const slb = createPlayer(Position.SLB, tmpl.targetStrength);
        const stp1 = createPlayer(Position.STP, tmpl.targetStrength);
        const stp2 = createPlayer(Position.STP, tmpl.targetStrength);
        const sgb = createPlayer(Position.SGB, tmpl.targetStrength);
        
        // 3. Midfield Line (SLK - OS - OS - SGK)
        const slk = createPlayer(Position.SLK, tmpl.targetStrength);
        const os1 = createPlayer(Position.OS, tmpl.targetStrength);
        const os2 = createPlayer(Position.OS, tmpl.targetStrength);
        const sgk = createPlayer(Position.SGK, tmpl.targetStrength);
        
        // 4. Attack Line (SNT - SNT)
        const snt1 = createPlayer(Position.SNT, tmpl.targetStrength);
        const snt2 = createPlayer(Position.SNT, tmpl.targetStrength);

        // --- SUBSTITUTES (7 Players) ---
        const subGK = createPlayer(Position.GK, tmpl.targetStrength - 5);
        const subDEF1 = createPlayer(Position.STP, tmpl.targetStrength - 5);
        const subDEF2 = createPlayer(Position.SLB, tmpl.targetStrength - 5); // Or SGB
        const subMID1 = createPlayer(Position.OS, tmpl.targetStrength - 5);
        const subMID2 = createPlayer(Position.OOS, tmpl.targetStrength - 5); // Include OOS as option
        const subFWD1 = createPlayer(Position.SLK, tmpl.targetStrength - 5); // Or SGK
        const subFWD2 = createPlayer(Position.SNT, tmpl.targetStrength - 5);

        // --- RESERVES (Balanced Mix) ---
        const reserves = [];
        reserves.push(createPlayer(Position.GK, tmpl.targetStrength - 10));
        reserves.push(createPlayer(Position.SGB, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.STP, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.OS, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.SGK, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.SNT, tmpl.targetStrength - 8));

        // Combine all in standard order
        // 0-10: XI
        // 11-17: Subs
        // 18+: Reserves
        const players = [
            gk, 
            slb, stp1, stp2, sgb, 
            slk, os1, os2, sgk, 
            snt1, snt2,
            subGK, subDEF1, subDEF2, subMID1, subMID2, subFWD1, subFWD2,
            ...reserves
        ];

        return {
            id: teamId,
            name: tmpl.name,
            colors: tmpl.colors as [string, string],
            logo: tmpl.logo,
            jersey: tmpl.jersey,
            championships: tmpl.championships,
            fanBase: tmpl.fans,
            stadiumName: tmpl.stadium,
            stadiumCapacity: tmpl.capacity,
            budget: tmpl.budget,
            players,
            // DEFAULT TACTICS
            formation: '4-4-2',
            mentality: Mentality.BALANCED,
            passing: PassingStyle.MIXED,
            tempo: Tempo.NORMAL,
            width: Width.NORMAL,
            creative: CreativeFreedom.BALANCED,
            finalThird: FinalThird.MIXED,
            crossing: Crossing.MIXED,
            defLine: DefensiveLine.STANDARD,
            tackling: Tackling.NORMAL,
            pressFocus: PressingFocus.MIXED,
            timeWasting: TimeWasting.SOMETIMES,
            
            // Legacy mapping
            tactic: TacticStyle.BALANCED,
            attackStyle: AttackStyle.MIXED,
            pressingStyle: PressingStyle.BALANCED,

            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
            strength: tmpl.targetStrength, 
            morale: 70 
        };
    });
};
