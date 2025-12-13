
import React from 'react';
import { Team } from '../../types';

interface StandingsTableProps {
    teams: Team[];
    myTeamId: string | null;
    compact?: boolean;
    onTeamClick?: (id: string) => void;
    liveScores?: { homeId: string, awayId: string, homeScore: number, awayScore: number };
}

const StandingsTable = ({ teams, myTeamId, compact, onTeamClick, liveScores }: StandingsTableProps) => {
    let displayTeams = [...teams];
    
    if (liveScores) {
        displayTeams = displayTeams.map(t => {
            const isHome = t.id === liveScores.homeId;
            const isAway = t.id === liveScores.awayId;
            if(!isHome && !isAway) return t;
            
            const newStats = { ...t.stats };
            newStats.played += 1;
            
            if(isHome) {
                newStats.gf += liveScores.homeScore;
                newStats.ga += liveScores.awayScore;
                if(liveScores.homeScore > liveScores.awayScore) { newStats.points += 3; newStats.won++; }
                else if(liveScores.homeScore === liveScores.awayScore) { newStats.points += 1; newStats.drawn++; }
                else { newStats.lost++; }
            } else {
                newStats.gf += liveScores.awayScore;
                newStats.ga += liveScores.homeScore;
                if(liveScores.awayScore > liveScores.homeScore) { newStats.points += 3; newStats.won++; }
                else if(liveScores.awayScore === liveScores.homeScore) { newStats.points += 1; newStats.drawn++; }
                else { newStats.lost++; }
            }
            return { ...t, stats: { ...newStats } };
        });
    }

    const sorted = displayTeams.sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2">Takım</th>
                        {!compact && <th className="px-2 py-2 text-center">O</th>}
                        {!compact && <th className="px-2 py-2 text-center">Av</th>}
                        <th className="px-2 py-2 text-center">P</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {sorted.map((team, index) => (
                        <tr 
                            key={team.id} 
                            onClick={() => onTeamClick && onTeamClick(team.id)}
                            className={`hover:bg-slate-200 dark:hover:bg-slate-700/50 cursor-pointer transition ${team.id === myTeamId ? 'bg-slate-100 dark:bg-slate-800/80 border-l-2 border-yellow-500' : ''}`}
                        >
                            <td className={`px-2 py-2 font-bold ${index < 3 ? 'text-green-600 dark:text-green-400' : index > sorted.length - 4 ? 'text-red-600 dark:text-red-400' : ''}`}>{index + 1}</td>
                            <td className="px-2 py-2 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                {team.logo && <img src={team.logo} className="w-4 h-4 object-contain" alt="" />}
                                <span className={compact ? 'truncate max-w-[100px]' : ''}>{team.name}</span>
                            </td>
                            {!compact && <td className="px-2 py-2 text-center">{team.stats.played}</td>}
                            {!compact && <td className="px-2 py-2 text-center">{team.stats.gf - team.stats.ga}</td>}
                            <td className="px-2 py-2 text-center font-bold text-slate-900 dark:text-white">{team.stats.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StandingsTable;
