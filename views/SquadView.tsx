
import React, { useState } from 'react';
import { Team, Player } from '../types';
import PlayerRow from '../components/shared/PlayerRow';
import { ArrowUpDown } from 'lucide-react';

const SquadView = ({ team, onPlayerClick }: { team: Team, onPlayerClick: (p: Player) => void }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const sortPlayers = (players: Player[]) => {
        if (!sortConfig) return players;
        return [...players].sort((a, b) => {
            let aValue: any = a[sortConfig.key as keyof Player];
            let bValue: any = b[sortConfig.key as keyof Player];
            if (sortConfig.key === 'stamina') { aValue = a.stats.stamina; bValue = b.stats.stamina; }
            if (sortConfig.key === 'goals') { aValue = a.seasonStats.goals; bValue = b.seasonStats.goals; }
            if (sortConfig.key === 'assists') { aValue = a.seasonStats.assists; bValue = b.seasonStats.assists; }
            if (sortConfig.key === 'rating') { aValue = a.seasonStats.averageRating; bValue = b.seasonStats.averageRating; }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey, align = 'center' }: { label: string, sortKey: string, align?: string }) => (
        <th className={`px-4 py-2 text-${align} cursor-pointer hover:text-black dark:hover:text-white transition select-none group`} onClick={() => requestSort(sortKey)}>
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                {label} <ArrowUpDown size={12} className={`text-slate-400 dark:text-slate-600 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 ${sortConfig?.key === sortKey ? 'text-yellow-600 dark:text-yellow-500' : ''}`}/>
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            {[team.players.slice(0, 11), team.players.slice(11)].map((group, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-bold text-green-600 dark:text-green-400 flex justify-between">
                        <span>{idx === 0 ? 'İLK 11' : 'YEDEKLER'}</span>
                        {sortConfig && <span className="text-xs text-slate-500 font-normal">Sıralama: {sortConfig.key}</span>}
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                                <th className="px-4 py-2 w-8">#</th>
                                <SortableHeader label="Oyuncu" sortKey="position" align="left" />
                                <SortableHeader label="Yaş" sortKey="age" />
                                <SortableHeader label="Güç" sortKey="skill" />
                                <SortableHeader label="Kondisyon" sortKey="stamina" />
                                <SortableHeader label="Moral" sortKey="morale" />
                                <SortableHeader label="Gol" sortKey="goals" />
                                <SortableHeader label="Asist" sortKey="assists" />
                                <SortableHeader label="Ort" sortKey="rating" />
                                <SortableHeader label="Değer" sortKey="value" align="right" />
                            </tr>
                        </thead>
                        <tbody>{sortPlayers(group).map((p, i) => <PlayerRow key={p.id} p={p} index={idx === 0 ? i : i + 11} onClick={onPlayerClick} />)}</tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default SquadView;
