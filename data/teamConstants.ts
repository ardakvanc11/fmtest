
import { Team, Position, Mentality, PassingStyle, Tempo, Width, CreativeFreedom, FinalThird, Crossing, DefensiveLine, Tackling, PressingFocus, TimeWasting, TacticStyle, AttackStyle, PressingStyle } from '../types';
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
        leagueHistory: [
            {year: '1983/84', rank: 6}, {year: '1984/85', rank: 11}, {year: '1985/86', rank: 10}, {year: '1986/87', rank: 13},
            {year: '1987/88', rank: 13}, {year: '1988/89', rank: 7}, {year: '1989/90', rank: 10}, {year: '1990/91', rank: 5},
            {year: '1991/92', rank: 5}, {year: '1992/93', rank: 6}, {year: '1993/94', rank: 1}, {year: '1994/95', rank: 5},
            {year: '1995/96', rank: 2}, {year: '1996/97', rank: 4}, {year: '1997/98', rank: 2}, {year: '1998/99', rank: 1},
            {year: '1999/00', rank: 1}, {year: '2000/01', rank: 3}, {year: '2001/02', rank: 1}, {year: '2002/03', rank: 1},
            {year: '2003/04', rank: 4}, {year: '2004/05', rank: 2}, {year: '2005/06', rank: 3}, {year: '2006/07', rank: 2},
            {year: '2007/08', rank: 3}, {year: '2008/09', rank: 3}, {year: '2009/10', rank: 1},
            {year: '2010/11', rank: 3}, {year: '2011/12', rank: 2}, {year: '2012/13', rank: 3}, {year: '2013/14', rank: 1}, {year: '2014/15', rank: 3},
            {year: '2015/16', rank: 4}, {year: '2016/17', rank: 1}, {year: '2017/18', rank: 4}, {year: '2018/19', rank: 4}, {year: '2019/20', rank: 1}, {year: '2020/21', rank: 3},
            {year: '2021/22', rank: 5}, {year: '2022/23', rank: 1}, {year: '2023/24', rank: 5}, {year: '2024/25', rank: 4}
        ]
    },
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
        leagueHistory: [
            {year: '1983/84', rank: 5}, {year: '1984/85', rank: 3}, {year: '1985/86', rank: 3}, {year: '1986/87', rank: 2},
            {year: '1987/88', rank: 3}, {year: '1988/89', rank: 3}, {year: '1989/90', rank: 1}, {year: '1990/91', rank: 2},
            {year: '1991/92', rank: 1}, {year: '1992/93', rank: 1}, {year: '1993/94', rank: 5}, {year: '1994/95', rank: 4},
            {year: '1995/96', rank: 3}, {year: '1996/97', rank: 1}, {year: '1997/98', rank: 1}, {year: '1998/99', rank: 4},
            {year: '1999/00', rank: 2}, {year: '2000/01', rank: 4}, {year: '2001/02', rank: 2}, {year: '2002/03', rank: 4},
            {year: '2003/04', rank: 2}, {year: '2004/05', rank: 4}, {year: '2005/06', rank: 1}, {year: '2006/07', rank: 3},
            {year: '2007/08', rank: 1}, {year: '2008/09', rank: 2}, {year: '2009/10', rank: 4},
            {year: '2010/11', rank: 2}, {year: '2011/12', rank: 4}, {year: '2012/13', rank: 1}, {year: '2013/14', rank: 3}, {year: '2014/15', rank: 4},
            {year: '2015/16', rank: 5}, {year: '2016/17', rank: 4}, {year: '2017/18', rank: 3}, {year: '2018/19', rank: 5}, {year: '2019/20', rank: 3}, {year: '2020/21', rank: 5},
            {year: '2021/22', rank: 4}, {year: '2022/23', rank: 3}, {year: '2023/24', rank: 4}, {year: '2024/25', rank: 5}
        ]
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
        leagueHistory: [
            {year: '1983/84', rank: 1}, {year: '1984/85', rank: 1}, {year: '1985/86', rank: 2}, {year: '1986/87', rank: 3},
            {year: '1987/88', rank: 2}, {year: '1988/89', rank: 2}, {year: '1989/90', rank: 3}, {year: '1990/91', rank: 1},
            {year: '1991/92', rank: 2}, {year: '1992/93', rank: 2}, {year: '1993/94', rank: 2}, {year: '1994/95', rank: 1},
            {year: '1995/96', rank: 1}, {year: '1996/97', rank: 3}, {year: '1997/98', rank: 4}, {year: '1998/99', rank: 2},
            {year: '1999/00', rank: 4}, {year: '2000/01', rank: 1}, {year: '2001/02', rank: 18}, {year: '2002/03', rank: 3},
            {year: '2003/04', rank: 3}, {year: '2004/05', rank: 3}, {year: '2005/06', rank: 4}, {year: '2006/07', rank: 1},
            {year: '2007/08', rank: 4}, {year: '2008/09', rank: 1}, {year: '2009/10', rank: 2},
            {year: '2010/11', rank: 1}, {year: '2011/12', rank: 1}, {year: '2012/13', rank: 4}, {year: '2013/14', rank: 5}, {year: '2014/15', rank: 1},
            {year: '2015/16', rank: 1}, {year: '2016/17', rank: 5}, {year: '2017/18', rank: 6}, {year: '2018/19', rank: 6}, {year: '2019/20', rank: 5}, {year: '2020/21', rank: 1},
            {year: '2021/22', rank: 1}, {year: '2022/23', rank: 5}, {year: '2023/24', rank: 1}, {year: '2024/25', rank: 2}
        ]
    },
    { 
        name: 'Maymunspor', 
        logo: 'https://i.imgur.com/kvhASjK.png',
        jersey: 'https://imgur.com/jfH3kal.png',
        colors: ['bg-purple-800', 'text-white'], 
        championships: 4,
        cups: 7,
        s_cups: 6,
        euro_cups: 0,
        stadium: 'Muz Park',
        capacity: 21000,
        fans: 6000000, 
        budget: 9, 
        targetStrength: 78,
        baseReputation: 3.6,
        leagueHistory: [
            {year: '1983/84', rank: 10}, {year: '1984/85', rank: 11}, {year: '1985/86', rank: 10}, {year: '1986/87', rank: 13},
            {year: '1987/88', rank: 13}, {year: '1988/89', rank: 7}, {year: '1989/90', rank: 10}, {year: '1990/91', rank: 5},
            {year: '1991/92', rank: 5}, {year: '1992/93', rank: 6}, {year: '1993/94', rank: 1}, {year: '1994/95', rank: 5},
            {year: '1995/96', rank: 2}, {year: '1996/97', rank: 4}, {year: '1997/98', rank: 2}, {year: '1998/99', rank: 1},
            {year: '1999/00', rank: 1}, {year: '2000/01', rank: 3}, {year: '2001/02', rank: 1}, {year: '2002/03', rank: 1},
            {year: '2003/04', rank: 4}, {year: '2004/05', rank: 2}, {year: '2005/06', rank: 3}, {year: '2006/07', rank: 2},
            {year: '2007/08', rank: 3}, {year: '2008/09', rank: 3}, {year: '2009/10', rank: 1},
            {year: '2010/11', rank: 8}, {year: '2011/12', rank: 7}, {year: '2012/13', rank: 8}, {year: '2013/14', rank: 7}, {year: '2014/15', rank: 8},
            {year: '2015/16', rank: 8}, {year: '2016/17', rank: 7}, {year: '2017/18', rank: 8}, {year: '2018/19', rank: 7}, {year: '2019/20', rank: 8}, {year: '2020/21', rank: 7},
            {year: '2021/22', rank: 8}, {year: '2022/23', rank: 7}, {year: '2023/24', rank: 8}, {year: '2024/25', rank: 7}
        ]
    },
    { 
        name: 'Arıspor', 
        logo: 'https://i.imgur.com/7vkiuxd.png',
        jersey: 'https://imgur.com/PidWwuV.png',
        jerseyGK: 'https://imgur.com/EF7HVUU.png', 
        colors: ['bg-yellow-500', 'text-white'], 
        championships: 3,
        cups: 2,
        s_cups: 3,
        euro_cups: 0,
        stadium: 'Kovan Stadyumu',
        capacity: 27000,
        fans: 1500000, 
        budget: 22, 
        targetStrength: 84,
        baseReputation: 4.3,
        leagueHistory: [
            {year: '1983/84', rank: 16}, {year: '1984/85', rank: 15}, {year: '1985/86', rank: 16}, {year: '1986/87', rank: 12},
            {year: '1987/88', rank: 4}, {year: '1988/89', rank: 14}, {year: '1989/90', rank: 14}, {year: '1990/91', rank: 10},
            {year: '1991/92', rank: 13}, {year: '1992/93', rank: 12}, {year: '1993/94', rank: 10}, {year: '1994/95', rank: 15},
            {year: '1995/96', rank: 13}, {year: '1996/97', rank: 12}, {year: '1997/98', rank: 11}, {year: '1998/99', rank: 13},
            {year: '1999/00', rank: 14}, {year: '2000/01', rank: 14}, {year: '2001/02', rank: 8}, {year: '2002/03', rank: 17},
            {year: '2003/04', rank: 14}, {year: '2004/05', rank: 16}, {year: '2005/06', rank: 13}, {year: '2006/07', rank: 14},
            {year: '2007/08', rank: 15}, {year: '2008/09', rank: 13}, {year: '2009/10', rank: 14},
            {year: '2010/11', rank: 6}, {year: '2011/12', rank: 5}, {year: '2012/13', rank: 6}, {year: '2013/14', rank: 4}, {year: '2014/15', rank: 2},
            {year: '2015/16', rank: 6}, {year: '2016/17', rank: 3}, {year: '2017/18', rank: 1}, {year: '2018/19', rank: 1}, {year: '2019/20', rank: 2}, {year: '2020/21', rank: 4},
            {year: '2021/22', rank: 2}, {year: '2022/23', rank: 4}, {year: '2023/24', rank: 3}, {year: '2024/25', rank: 1}
        ]
    },
    { 
        name: 'Köpekspor', 
        logo: 'https://i.imgur.com/OoPWVvx.png',
        jersey: 'https://imgur.com/C2xKJtO.png',
        jerseyGK: 'https://imgur.com/hHtmxQv.png', 
        colors: ['bg-blue-500', 'text-white'], 
        championships: 2,
        cups: 9,
        s_cups: 11, 
        euro_cups: 0,
        stadium: 'Kemik Arena',
        capacity: 41000,
        fans: 14500000, 
        budget: 13, 
        targetStrength: 80,
        baseReputation: 3.9,
        leagueHistory: [
            {year: '1983/84', rank: 3}, {year: '1984/85', rank: 14}, {year: '1985/86', rank: 12}, {year: '1986/87', rank: 16},
            {year: '1987/88', rank: 5}, {year: '1988/89', rank: 10}, {year: '1989/90', rank: 7}, {year: '1990/91', rank: 6},
            {year: '1991/92', rank: 3}, {year: '1992/93', rank: 5}, {year: '1993/94', rank: 3}, {year: '1994/95', rank: 3},
            {year: '1995/96', rank: 4}, {year: '1996/97', rank: 2}, {year: '1997/98', rank: 3}, {year: '1998/99', rank: 3},
            {year: '1999/00', rank: 3}, {year: '2000/01', rank: 5}, {year: '2001/02', rank: 3}, {year: '2002/03', rank: 2},
            {year: '2003/04', rank: 1}, {year: '2004/05', rank: 1}, {year: '2005/06', rank: 2}, {year: '2006/07', rank: 4},
            {year: '2007/08', rank: 2}, {year: '2008/09', rank: 6}, {year: '2009/10', rank: 3},
            {year: '2010/11', rank: 4}, {year: '2011/12', rank: 3}, {year: '2012/13', rank: 5}, {year: '2013/14', rank: 2}, {year: '2014/15', rank: 5},
            {year: '2015/16', rank: 3}, {year: '2016/17', rank: 2}, {year: '2017/18', rank: 5}, {year: '2018/19', rank: 2}, {year: '2019/20', rank: 4}, {year: '2020/21', rank: 2},
            {year: '2021/22', rank: 3}, {year: '2022/23', rank: 2}, {year: '2023/24', rank: 6}, {year: '2024/25', rank: 3}
        ]
    },
    { 
        name: 'Bulgariaspor', 
        logo: 'https://i.imgur.com/RuCGNuc.png',
        jersey: 'https://imgur.com/eHAW2Fg.png',
        jerseyGK: 'https://imgur.com/Nz7hWFC.png', 
        colors: ['bg-green-600', 'text-black'], 
        championships: 0,
        cups: 0,
        s_cups: 0,
        euro_cups: 0,
        stadium: 'Tuna Park',
        capacity: 16500,
        fans: 500000, 
        budget: 5, 
        targetStrength: 75,
        baseReputation: 3.2,
        leagueHistory: [
            {year: '1983/84', rank: 15}, {year: '1984/85', rank: 10}, {year: '1985/86', rank: 17}, {year: '1986/87', rank: 15},
            {year: '1987/88', rank: 14}, {year: '1988/89', rank: 12}, {year: '1989/90', rank: 13}, {year: '1990/91', rank: 11},
            {year: '1991/92', rank: 13}, {year: '1992/93', rank: 11}, {year: '1993/94', rank: 10}, {year: '1994/95', rank: 11},
            {year: '1995/96', rank: 5}, {year: '1996/97', rank: 15}, {year: '1997/98', rank: 14}, {year: '1998/99', rank: 13},
            {year: '1999/00', rank: 17}, {year: '2000/01', rank: 8}, {year: '2001/02', rank: 14}, {year: '2002/03', rank: 16},
            {year: '2003/04', rank: 6}, {year: '2004/05', rank: 8}, {year: '2005/06', rank: 10}, {year: '2006/07', rank: 16},
            {year: '2007/08', rank: 10}, {year: '2008/09', rank: 15}, {year: '2009/10', rank: 10},
            {year: '2010/11', rank: 12}, {year: '2011/12', rank: 13}, {year: '2012/13', rank: 12}, {year: '2013/14', rank: 12}, {year: '2014/15', rank: 13},
            {year: '2015/16', rank: 13}, {year: '2016/17', rank: 13}, {year: '2017/18', rank: 12}, {year: '2018/19', rank: 14}, {year: '2019/20', rank: 12}, {year: '2020/21', rank: 13},
            {year: '2021/22', rank: 12}, {year: '2022/23', rank: 13}, {year: '2023/24', rank: 12}, {year: '2024/25', rank: 14}
        ]
    },
    { 
        name: 'Bedirspor', 
        logo: 'https://i.imgur.com/pPchTUI.png',
        jersey: 'https://imgur.com/bdI85Wq.png',
        jerseyGK: 'https://imgur.com/eT3Qn69.png', 
        colors: ['bg-purple-900', 'text-white'], 
        championships: 0,
        cups: 7,
        s_cups: 3,
        euro_cups: 0,
        stadium: 'Bedir Stadı',
        capacity: 25000,
        fans: 850000, 
        budget: 6, 
        targetStrength: 73,
        baseReputation: 3.3,
        leagueHistory: [
            {year: '1983/84', rank: 8}, {year: '1984/85', rank: 7}, {year: '1985/86', rank: 4}, {year: '1986/87', rank: 5},
            {year: '1987/88', rank: 12}, {year: '1988/89', rank: 4}, {year: '1989/90', rank: 9}, {year: '1990/91', rank: 8},
            {year: '1991/92', rank: 11}, {year: '1992/93', rank: 9}, {year: '1993/94', rank: 8}, {year: '1994/95', rank: 6},
            {year: '1995/96', rank: 13}, {year: '1996/97', rank: 13}, {year: '1997/98', rank: 9}, {year: '1998/99', rank: 12},
            {year: '1999/00', rank: 13}, {year: '2000/01', rank: 15}, {year: '2001/02', rank: 12}, {year: '2002/03', rank: 11},
            {year: '2003/04', rank: 16}, {year: '2004/05', rank: 6}, {year: '2005/06', rank: 7}, {year: '2006/07', rank: 14},
            {year: '2007/08', rank: 6}, {year: '2008/09', rank: 10}, {year: '2009/10', rank: 8},
            {year: '2010/11', rank: 9}, {year: '2011/12', rank: 11}, {year: '2012/13', rank: 9}, {year: '2013/14', rank: 10}, {year: '2014/15', rank: 12},
            {year: '2015/16', rank: 9}, {year: '2016/17', rank: 10}, {year: '2017/18', rank: 9}, {year: '2018/19', rank: 12}, {year: '2019/20', rank: 9}, {year: '2020/21', rank: 10},
            {year: '2021/22', rank: 9}, {year: '2022/23', rank: 10}, {year: '2023/24', rank: 9}, {year: '2024/25', rank: 10}
        ]
    },
    { 
        name: 'Yakhubspor', 
        logo: 'https://i.imgur.com/vcN5VhI.png',
        jersey: 'https://imgur.com/k64QPcT.png',
        jerseyGK: 'https://imgur.com/H2oygfo.png', 
        colors: ['bg-orange-500', 'text-black'], 
        championships: 0,
        cups: 5,
        s_cups: 2, 
        euro_cups: 0,
        stadium: 'Çöl Fırtınası',
        capacity: 19500,
        fans: 750000, 
        budget: 6, 
        targetStrength: 72,
        baseReputation: 3.3,
        leagueHistory: [
            {year: '1983/84', rank: 12}, {year: '1984/85', rank: 18}, {year: '1985/86', rank: 6}, {year: '1986/87', rank: 11},
            {year: '1987/88', rank: 9}, {year: '1988/89', rank: 5}, {year: '1989/90', rank: 16}, {year: '1990/91', rank: 7},
            {year: '1991/92', rank: 9}, {year: '1992/93', rank: 8}, {year: '1993/94', rank: 11}, {year: '1994/95', rank: 10},
            {year: '1995/96', rank: 8}, {year: '1996/97', rank: 8}, {year: '1997/98', rank: 12}, {year: '1998/99', rank: 7},
            {year: '1999/00', rank: 5}, {year: '2000/01', rank: 2}, {year: '2001/02', rank: 5}, {year: '2002/03', rank: 9},
            {year: '2003/04', rank: 5}, {year: '2004/05', rank: 13}, {year: '2005/06', rank: 6}, {year: '2006/07', rank: 6},
            {year: '2007/08', rank: 11}, {year: '2008/09', rank: 8}, {year: '2009/10', rank: 12},
            {year: '2010/11', rank: 10}, {year: '2011/12', rank: 9}, {year: '2012/13', rank: 10}, {year: '2013/14', rank: 11}, {year: '2014/15', rank: 9},
            {year: '2015/16', rank: 10}, {year: '2016/17', rank: 9}, {year: '2017/18', rank: 11}, {year: '2018/19', rank: 10}, {year: '2019/20', rank: 11}, {year: '2020/21', rank: 9},
            {year: '2021/22', rank: 10}, {year: '2022/23', rank: 9}, {year: '2023/24', rank: 10}, {year: '2024/25', rank: 9}
        ]
    },
    { 
        name: 'Tekirspor', 
        logo: 'https://i.imgur.com/JhXtd58.png',
        jersey: 'https://imgur.com/augQrXj.png',
        jerseyGK: 'https://imgur.com/G73BOHq.png', 
        colors: ['bg-orange-400', 'text-white'], 
        championships: 0,
        cups: 4,
        s_cups: 1, 
        euro_cups: 0,
        stadium: 'Liman Arena',
        capacity: 18000,
        fans: 1200000, 
        budget: 7, 
        targetStrength: 74,
        baseReputation: 3.2,
        leagueHistory: [
            {year: '1983/84', rank: 14}, {year: '1984/85', rank: 12}, {year: '1985/86', rank: 8}, {year: '1986/87', rank: 14},
            {year: '1987/88', rank: 11}, {year: '1988/89', rank: 8}, {year: '1989/90', rank: 12}, {year: '1990/91', rank: 14},
            {year: '1991/92', rank: 10}, {year: '1992/93', rank: 7}, {year: '1993/94', rank: 9}, {year: '1994/95', rank: 13},
            {year: '1995/96', rank: 14}, {year: '1996/97', rank: 6}, {year: '1997/98', rank: 6}, {year: '1998/99', rank: 17},
            {year: '1999/00', rank: 16}, {year: '2000/01', rank: 17}, {year: '2001/02', rank: 9}, {year: '2002/03', rank: 18},
            {year: '2003/04', rank: 17}, {year: '2004/05', rank: 18}, {year: '2005/06', rank: 17}, {year: '2006/07', rank: 8},
            {year: '2007/08', rank: 16}, {year: '2008/09', rank: 16}, {year: '2009/10', rank: 17},
            {year: '2010/11', rank: 15}, {year: '2011/12', rank: 14}, {year: '2012/13', rank: 15}, {year: '2013/14', rank: 14}, {year: '2014/15', rank: 16},
            {year: '2015/16', rank: 14}, {year: '2016/17', rank: 15}, {year: '2017/18', rank: 16}, {year: '2018/19', rank: 15}, {year: '2019/20', rank: 14}, {year: '2020/21', rank: 15},
            {year: '2021/22', rank: 14}, {year: '2022/23', rank: 15}, {year: '2023/24', rank: 15}, {year: '2024/25', rank: 15}
        ]
    },
    { 
        name: 'Uzunoğullarıspor', 
        logo: 'https://i.imgur.com/S4TVTee.png',
        jersey: 'https://imgur.com/BOyr0e6.png',
        jerseyGK: 'https://imgur.com/wAOAVng.png', 
        colors: ['bg-black', 'text-white'], 
        championships: 0,
        cups: 4,
        s_cups: 1, 
        euro_cups: 0,
        stadium: 'Kule Stadı',
        capacity: 9500,
        fans: 200000, 
        budget: 4, 
        targetStrength: 71,
        baseReputation: 2.8,
        leagueHistory: [
            {year: '1983/84', rank: 9}, {year: '1984/85', rank: 9}, {year: '1985/86', rank: 7}, {year: '1986/87', rank: 9},
            {year: '1987/88', rank: 6}, {year: '1988/89', rank: 6}, {year: '1989/90', rank: 15}, {year: '1990/91', rank: 17},
            {year: '1991/92', rank: 14}, {year: '1992/93', rank: 15}, {year: '1993/94', rank: 6}, {year: '1994/95', rank: 9},
            {year: '1995/96', rank: 12}, {year: '1996/97', rank: 11}, {year: '1997/98', rank: 11}, {year: '1998/99', rank: 9},
            {year: '1999/00', rank: 18}, {year: '2000/01', rank: 7}, {year: '2001/02', rank: 16}, {year: '2002/03', rank: 8},
            {year: '2003/04', rank: 13}, {year: '2004/05', rank: 10}, {year: '2005/06', rank: 13}, {year: '2006/07', rank: 5},
            {year: '2007/08', rank: 14}, {year: '2008/09', rank: 13}, {year: '2009/10', rank: 7},
            {year: '2010/11', rank: 14}, {year: '2011/12', rank: 15}, {year: '2012/13', rank: 13}, {year: '2013/14', rank: 15}, {year: '2014/15', rank: 14},
            {year: '2015/16', rank: 15}, {year: '2016/17', rank: 11}, {year: '2017/18', rank: 14}, {year: '2018/19', rank: 13}, {year: '2019/20', rank: 15}, {year: '2020/21', rank: 14},
            {year: '2021/22', rank: 15}, {year: '2022/23', rank: 11}, {year: '2023/24', rank: 14}, {year: '2024/25', rank: 11}
        ]
    },
    { 
        name: 'Hamsispor', 
        logo: 'https://i.imgur.com/LqtejWJ.png',
        jersey: 'https://imgur.com/BP2TPF8.png',
        jerseyGK: 'https://imgur.com/rhp2PXq.png', 
        colors: ['bg-red-900', 'text-blue-400'], 
        championships: 0,
        cups: 3,
        s_cups: 1,
        euro_cups: 0,
        stadium: 'Deniz Kenarı',
        capacity: 22000,
        fans: 2000000, 
        budget: 114, 
        targetStrength: 70,
        baseReputation: 3.0,
        leagueHistory: [
            {year: '1983/84', rank: 17}, {year: '1984/85', rank: 17}, {year: '1985/86', rank: 15}, {year: '1986/87', rank: 8},
            {year: '1987/88', rank: 18}, {year: '1988/89', rank: 17}, {year: '1989/90', rank: 18}, {year: '1990/91', rank: 15},
            {year: '1991/92', rank: 18}, {year: '1992/93', rank: 18}, {year: '1993/94', rank: 17}, {year: '1994/95', rank: 18},
            {year: '1995/96', rank: 18}, {year: '1996/97', rank: 9}, {year: '1997/98', rank: 5}, {year: '1998/99', rank: 11},
            {year: '1999/00', rank: 15}, {year: '2000/01', rank: 16}, {year: '2001/02', rank: 15}, {year: '2002/03', rank: 13},
            {year: '2003/04', rank: 12}, {year: '2004/05', rank: 15}, {year: '2005/06', rank: 11}, {year: '2006/07', rank: 18},
            {year: '2007/08', rank: 13}, {year: '2008/09', rank: 17}, {year: '2009/10', rank: 18},
            {year: '2010/11', rank: 18}, {year: '2011/12', rank: 16}, {year: '2012/13', rank: 17}, {year: '2013/14', rank: 18}, {year: '2014/15', rank: 17},
            {year: '2015/16', rank: 16}, {year: '2016/17', rank: 18}, {year: '2017/18', rank: 15}, {year: '2018/19', rank: 18}, {year: '2019/20', rank: 17}, {year: '2020/21', rank: 16},
            {year: '2021/22', rank: 18}, {year: '2022/23', rank: 17}, {year: '2023/24', rank: 17}, {year: '2024/25', rank: 18}
        ]
    },
    { 
        name: 'Osurukspor', 
        logo: 'https://i.imgur.com/Iz505sK.png',
        jersey: 'https://imgur.com/eqUzVTA.png',
        jerseyGK: 'https://imgur.com/ZjPlTwJ.png', 
        colors: ['bg-green-500', 'text-white'], 
        championships: 0,
        cups: 0,
        s_cups: 0, 
        euro_cups: 0,
        stadium: 'Rüzgar Vadisi',
        capacity: 14500,
        fans: 300000, 
        budget: 324, 
        targetStrength: 67,
        baseReputation: 2.8,
        leagueHistory: [
            {year: '1983/84', rank: 16}, {year: '1984/85', rank: 13}, {year: '1985/86', rank: 14}, {year: '1986/87', rank: 18},
            {year: '1987/88', rank: 16}, {year: '1988/89', rank: 18}, {year: '1989/90', rank: 17}, {year: '1990/91', rank: 18},
            {year: '1991/92', rank: 17}, {year: '1992/93', rank: 13}, {year: '1993/94', rank: 14}, {year: '1994/95', rank: 15},
            {year: '1995/96', rank: 17}, {year: '1996/97', rank: 16}, {year: '1997/98', rank: 16}, {year: '1998/99', rank: 8},
            {year: '1999/00', rank: 11}, {year: '2000/01', rank: 13}, {year: '2001/02', rank: 6}, {year: '2002/03', rank: 10},
            {year: '2003/04', rank: 18}, {year: '2004/05', rank: 14}, {year: '2005/06', rank: 16}, {year: '2006/07', rank: 17},
            {year: '2007/08', rank: 17}, {year: '2008/09', rank: 14}, {year: '2009/10', rank: 14},
            {year: '2010/11', rank: 16}, {year: '2011/12', rank: 17}, {year: '2012/13', rank: 16}, {year: '2013/14', rank: 17}, {year: '2014/15', rank: 15},
            {year: '2015/16', rank: 18}, {year: '2016/17', rank: 16}, {year: '2017/18', rank: 17}, {year: '2018/19', rank: 17}, {year: '2019/20', rank: 16}, {year: '2020/21', rank: 18},
            {year: '2021/22', rank: 17}, {year: '2022/23', rank: 16}, {year: '2023/24', rank: 18}, {year: '2024/25', rank: 16}
        ]
    },
    { 
        name: 'Yeni Bozkurtspor', 
        logo: 'https://i.imgur.com/n17A3Cw.png',
        jersey: 'https://imgur.com/QtcPbrG.png',
        jerseyGK: 'https://imgur.com/syiHDWW.png', 
        colors: ['bg-amber-800', 'text-black'], 
        championships: 0,
        cups: 0,
        s_cups: 2, 
        euro_cups: 0,
        stadium: 'Ova Arena',
        capacity: 34500,
        fans: 2100000, 
        budget: 7, 
        targetStrength: 76,
        baseReputation: 3.4,
        leagueHistory: [
            {year: '1983/84', rank: 7}, {year: '1984/85', rank: 6}, {year: '1985/86', rank: 9}, {year: '1986/87', rank: 6},
            {year: '1987/88', rank: 8}, {year: '1988/89', rank: 13}, {year: '1989/90', rank: 5}, {year: '1990/91', rank: 4},
            {year: '1991/92', rank: 4}, {year: '1992/93', rank: 4}, {year: '1993/94', rank: 4}, {year: '1994/95', rank: 2},
            {year: '1995/96', rank: 6}, {year: '1996/97', rank: 14}, {year: '1997/98', rank: 10}, {year: '1998/99', rank: 14},
            {year: '1999/00', rank: 10}, {year: '2000/01', rank: 10}, {year: '2001/02', rank: 10}, {year: '2002/03', rank: 6},
            {year: '2003/04', rank: 9}, {year: '2004/05', rank: 5}, {year: '2005/06', rank: 5}, {year: '2006/07', rank: 12},
            {year: '2007/08', rank: 5}, {year: '2008/09', rank: 4}, {year: '2009/10', rank: 6},
            {year: '2010/11', rank: 5}, {year: '2011/12', rank: 6}, {year: '2012/13', rank: 2}, {year: '2013/14', rank: 6}, {year: '2014/15', rank: 7},
            {year: '2015/16', rank: 2}, {year: '2016/17', rank: 6}, {year: '2017/18', rank: 2}, {year: '2018/19', rank: 3}, {year: '2019/20', rank: 6}, {year: '2020/21', rank: 6},
            {year: '2021/22', rank: 6}, {year: '2022/23', rank: 6}, {year: '2023/24', rank: 2}, {year: '2024/25', rank: 6}
        ]
    },
    { 
        name: 'Civciv FK', 
        logo: 'https://i.imgur.com/eUpKqYk.png',
        jersey: 'https://imgur.com/9JuH2nU.png',
        jerseyGK: 'https://imgur.com/00KMILk.png', 
        colors: ['bg-yellow-400', 'text-blue-900'], 
        championships: 0,
        cups: 0,
        s_cups: 0,
        euro_cups: 0,
        stadium: 'Kümes Park',
        capacity: 11700,
        fans: 400000, 
        budget: 2, 
        targetStrength: 68,
        baseReputation: 2.7,
        leagueHistory: [
            {year: '1983/84', rank: 11}, {year: '1984/85', rank: 16}, {year: '1985/86', rank: 13}, {year: '1986/87', rank: 4},
            {year: '1987/88', rank: 15}, {year: '1988/89', rank: 15}, {year: '1989/90', rank: 8}, {year: '1990/91', rank: 13},
            {year: '1991/92', rank: 7}, {year: '1992/93', rank: 16}, {year: '1993/94', rank: 15}, {year: '1994/95', rank: 14},
            {year: '1995/96', rank: 9}, {year: '1996/97', rank: 17}, {year: '1997/98', rank: 13}, {year: '1998/99', rank: 10},
            {year: '1999/00', rank: 8}, {year: '2000/01', rank: 12}, {year: '2001/02', rank: 4}, {year: '2002/03', rank: 7},
            {year: '2003/04', rank: 7}, {year: '2004/05', rank: 7}, {year: '2005/06', rank: 9}, {year: '2006/07', rank: 11},
            {year: '2007/08', rank: 15}, {year: '2008/09', rank: 12}, {year: '2009/10', rank: 13},
            {year: '2010/11', rank: 11}, {year: '2011/12', rank: 10}, {year: '2012/13', rank: 11}, {year: '2013/14', rank: 9}, {year: '2014/15', rank: 10},
            {year: '2015/16', rank: 11}, {year: '2016/17', rank: 12}, {year: '2017/18', rank: 10}, {year: '2018/19', rank: 9}, {year: '2019/20', rank: 10}, {year: '2020/21', rank: 11},
            {year: '2021/22', rank: 11}, {year: '2022/23', rank: 12}, {year: '2023/24', rank: 11}, {year: '2024/25', rank: 12}
        ]
    },
    { 
        name: 'Aston Karakoçan', 
        logo: 'https://i.imgur.com/sw63G9H.png',
        jersey: 'https://imgur.com/z3S5RuL.png',
        jerseyGK: 'https://imgur.com/HXvBipD.png', 
        colors: ['bg-indigo-900', 'text-blue-400'], 
        championships: 0,
        cups: 0,
        s_cups: 0, 
        euro_cups: 0,
        stadium: 'Şehir Stadı',
        capacity: 29000,
        fans: 1600000, 
        budget: 8, 
        targetStrength: 75,
        baseReputation: 3.1,
        leagueHistory: [
            {year: '1983/84', rank: 10}, {year: '1984/85', rank: 4}, {year: '1985/86', rank: 11}, {year: '1986/87', rank: 7},
            {year: '1987/88', rank: 10}, {year: '1988/89', rank: 11}, {year: '1989/90', rank: 4}, {year: '1990/91', rank: 12},
            {year: '1991/92', rank: 12}, {year: '1992/93', rank: 10}, {year: '1993/94', rank: 13}, {year: '1994/95', rank: 8},
            {year: '1995/96', rank: 16}, {year: '1996/97', rank: 10}, {year: '1997/98', rank: 15}, {year: '1998/99', rank: 16},
            {year: '1999/00', rank: 6}, {year: '2000/01', rank: 18}, {year: '2001/02', rank: 18}, {year: '2002/03', rank: 14},
            {year: '2003/04', rank: 8}, {year: '2004/05', rank: 11}, {year: '2005/06', rank: 8}, {year: '2006/07', rank: 7},
            {year: '2007/08', rank: 9}, {year: '2008/09', rank: 7}, {year: '2009/10', rank: 11},
            {year: '2010/11', rank: 13}, {year: '2011/12', rank: 12}, {year: '2012/13', rank: 14}, {year: '2013/14', rank: 13}, {year: '2014/15', rank: 11},
            {year: '2015/16', rank: 12}, {year: '2016/17', rank: 14}, {year: '2017/18', rank: 13}, {year: '2018/19', rank: 11}, {year: '2019/20', rank: 13}, {year: '2020/21', rank: 12},
            {year: '2021/22', rank: 13}, {year: '2022/23', rank: 14}, {year: '2023/24', rank: 13}, {year: '2024/25', rank: 13}
        ]
    },
    { 
        name: 'Küheylanspor', 
        logo: 'https://i.imgur.com/WG9bJgB.png',
        jersey: 'https://imgur.com/QDHs7Sy.png',
        jerseyGK: 'https://imgur.com/r4F2Ykh.png', 
        colors: ['bg-red-600', 'text-white'], 
        championships: 0,
        cups: 3,
        s_cups: 0,
        euro_cups: 0,
        stadium: 'Hipodrom Arena',
        capacity: 30300,
        fans: 450000, 
        budget: 4, 
        targetStrength: 72,
        baseReputation: 3.0,
        leagueHistory: [
            {year: '1983/84', rank: 18}, {year: '1984/85', rank: 5}, {year: '1985/86', rank: 5}, {year: '1986/87', rank: 10},
            {year: '1987/88', rank: 7}, {year: '1988/89', rank: 9}, {year: '1989/90', rank: 6}, {year: '1990/91', rank: 16},
            {year: '1991/92', rank: 16}, {year: '1992/93', rank: 12}, {year: '1993/94', rank: 18}, {year: '1994/95', rank: 16},
            {year: '1995/96', rank: 7}, {year: '1996/97', rank: 7}, {year: '1997/98', rank: 17}, {year: '1998/99', rank: 6},
            {year: '1999/00', rank: 12}, {year: '2000/01', rank: 11}, {year: '2001/02', rank: 11}, {year: '2002/03', rank: 12},
            {year: '2003/04', rank: 10}, {year: '2004/05', rank: 16}, {year: '2005/06', rank: 18}, {year: '2006/07', rank: 15},
            {year: '2007/08', rank: 18}, {year: '2008/09', rank: 18}, {year: '2009/10', rank: 16},
            {year: '2010/11', rank: 17}, {year: '2011/12', rank: 18}, {year: '2012/13', rank: 18}, {year: '2013/14', rank: 16}, {year: '2014/15', rank: 18},
            {year: '2015/16', rank: 17}, {year: '2016/17', rank: 17}, {year: '2017/18', rank: 18}, {year: '2018/19', rank: 16}, {year: '2019/20', rank: 18}, {year: '2020/21', rank: 17},
            {year: '2021/22', rank: 16}, {year: '2022/23', rank: 18}, {year: '2023/24', rank: 16}, {year: '2024/25', rank: 17}
        ]
    },
    { 
        name: 'İslamspor', 
        logo: 'https://i.imgur.com/JROZfTX.png',
        jersey: 'https://imgur.com/g5voy0X.png',
        jerseyGK: 'https://imgur.com/W71pkOG.png', 
        colors: ['bg-green-500', 'text-green-900'], 
        championships: 0,
        cups: 0,
        s_cups: 0, 
        euro_cups: 0,
        stadium: 'Barış Parkı',
        capacity: 33100,
        fans: 1950000, 
        budget: 8, 
        targetStrength: 74,
        baseReputation: 3.1,
        leagueHistory: [
            {year: '1983/84', rank: 13}, {year: '1984/85', rank: 8}, {year: '1985/86', rank: 18}, {year: '1986/87', rank: 17},
            {year: '1987/88', rank: 17}, {year: '1988/89', rank: 16}, {year: '1989/90', rank: 11}, {year: '1990/91', rank: 9},
            {year: '1991/92', rank: 8}, {year: '1992/93', rank: 14}, {year: '1993/94', rank: 12}, {year: '1994/95', rank: 12},
            {year: '1995/96', rank: 10}, {year: '1996/97', rank: 5}, {year: '1997/98', rank: 8}, {year: '1998/99', rank: 5},
            {year: '1999/00', rank: 7}, {year: '2000/01', rank: 6}, {year: '2001/02', rank: 7}, {year: '2002/03', rank: 15},
            {year: '2003/04', rank: 15}, {year: '2004/05', rank: 17}, {year: '2005/06', rank: 15}, {year: '2006/07', rank: 10},
            {year: '2007/08', rank: 7}, {year: '2008/09', rank: 11}, {year: '2009/10', rank: 9},
            {year: '2010/11', rank: 7}, {year: '2011/12', rank: 8}, {year: '2012/13', rank: 7}, {year: '2013/14', rank: 8}, {year: '2014/15', rank: 6},
            {year: '2015/16', rank: 7}, {year: '2016/17', rank: 8}, {year: '2017/18', rank: 7}, {year: '2018/19', rank: 8}, {year: '2019/20', rank: 7}, {year: '2020/21', rank: 8},
            {year: '2021/22', rank: 7}, {year: '2022/23', rank: 8}, {year: '2023/24', rank: 7}, {year: '2024/25', rank: 8}
        ]
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

        const players = [
            gk, 
            slb, stp1, stp2, sgb, 
            slk, os1, os2, sgk, 
            snt1, snt2,
            subGK, subDEF1, subDEF2, subMID1, subMID2, subFWD1, subFWD2,
            ...reserves
        ];

        const rawStrength = calculateRawTeamStrength(players);
        const strengthDelta = tmpl.targetStrength - rawStrength;

        const totalValue = players.reduce((sum, p) => sum + p.value, 0);
        const estimatedWages = totalValue * 0.005 * 52; 

        return {
            id: teamId,
            name: tmpl.name,
            colors: tmpl.colors as [string, string],
            logo: tmpl.logo,
            jersey: tmpl.jersey,
            championships: tmpl.championships,
            domesticCups: tmpl.cups || 0,
            superCups: tmpl.s_cups || 0,
            europeanCups: tmpl.euro_cups || 0, // NEW: Added
            fanBase: tmpl.fans,
            stadiumName: tmpl.stadium,
            stadiumCapacity: tmpl.capacity,
            budget: tmpl.budget,
            wageBudget: Number((estimatedWages * 1.1).toFixed(1)), 
            players,
            reputation: tmpl.baseReputation, 
            leagueHistory: tmpl.leagueHistory || [], 
            financialRecords: {
                income: {
                    transfers: 0, tv: 0, merch: 0, loca: 0, gate: 0, sponsor: 0
                },
                expense: {
                    wages: 0, transfers: 0, staff: 0, maint: 0, academy: 0, debt: 0,
                    matchDay: 0, travel: 0, scouting: 0, admin: 0, bonus: 0, fines: 0
                }
            },
            transferHistory: [], 
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