
import React from 'react';
import { Player } from '../../types';
import { Syringe, Heart } from 'lucide-react';

const PlayerRow: React.FC<{ p: Player, index: number, onClick: (p: Player) => void }> = ({ p, index, onClick }) => {
    const getConditionColor = (stamina: number) => stamina >= 80 ? 'text-green-500 fill-green-500' : stamina >= 50 ? 'text-yellow-500 fill-yellow-500' : 'text-red-500 fill-red-500';

    return (
        <tr onClick={() => onClick(p)} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-200 dark:border-slate-700/50 last:border-0 group">
            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 w-8">{index !== undefined ? index + 1 : '-'}</td>
            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-10 text-center text-white ${p.position === 'GK' ? 'bg-yellow-600' : p.position === 'DEF' ? 'bg-blue-600' : p.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>{p.position}</span>
                {p.name}
                {p.injury && <Syringe size={14} className="text-red-500"/>}
                {p.suspendedUntilWeek && <div className="w-3 h-4 bg-red-600 rounded-sm"/>}
            </td>
            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{p.age}</td>
            <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-200 text-lg">{p.skill}</td>
            <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1 group-hover:scale-110 transition-transform"><Heart size={16} className={getConditionColor(p.stats.stamina)} /><span className="text-xs text-slate-400 hidden group-hover:inline">{p.stats.stamina}</span></div></td>
            <td className="px-4 py-3 text-center font-bold text-yellow-600 dark:text-yellow-500">{p.morale}</td>
            <td className="px-4 py-3 text-center font-mono text-green-600 dark:text-green-400">{p.seasonStats.goals}</td>
            <td className="px-4 py-3 text-center font-mono text-blue-600 dark:text-blue-400">{p.seasonStats.assists}</td>
            <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">{p.seasonStats.averageRating || '-'}</td>
            <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-bold">{p.value} M€</td>
        </tr>
    );
};

export default PlayerRow;
