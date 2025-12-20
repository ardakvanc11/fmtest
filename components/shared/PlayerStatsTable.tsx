import React from 'react';
import { Player } from '../../types';
import { Trophy, Globe, Shield, Star } from 'lucide-react';

interface PlayerStatsTableProps {
    player: Player;
}

const PlayerStatsTable: React.FC<PlayerStatsTableProps> = ({ player }) => {
    const stats = player.seasonStats;

    // Helper to render rating badge
    const renderRating = (rating: number) => {
        if (rating === 0) return <span className="text-slate-400 dark:text-slate-600">-</span>;
        const colorClass = rating >= 7.5 ? 'bg-green-600 text-white' : rating >= 7.0 ? 'bg-green-500/80 text-white' : rating >= 6.0 ? 'bg-yellow-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${colorClass}`}>
                {rating.toFixed(2)}
            </span>
        );
    };

    // Data Rows
    const rows = [
        {
            id: 'LEAGUE',
            name: 'Süper Toto Ligi',
            icon: <Trophy size={14} className="text-yellow-600 dark:text-yellow-500" />,
            stats: {
                apps: stats.matchesPlayed,
                goals: stats.goals,
                assists: stats.assists,
                yel: stats.yellowCards || 0,
                red: stats.redCards || 0,
                rating: stats.averageRating || 0
            }
        },
        {
            id: 'CUP',
            name: 'Türkiye Kupası',
            icon: <Shield size={14} className="text-blue-600 dark:text-blue-500" />,
            stats: { apps: 0, goals: 0, assists: 0, yel: 0, red: 0, rating: 0 }
        },
        {
            id: 'EURO',
            name: 'Avrupa Kupası',
            icon: <Globe size={14} className="text-purple-600 dark:text-purple-500" />,
            stats: { apps: 0, goals: 0, assists: 0, yel: 0, red: 0, rating: 0 }
        },
        {
            id: 'SUPER',
            name: 'Süper Kupa',
            icon: <Star size={14} className="text-red-600 dark:text-red-500" />,
            stats: { apps: 0, goals: 0, assists: 0, yel: 0, red: 0, rating: 0 }
        }
    ];

    const totalApps = rows.reduce((sum, r) => sum + r.stats.apps, 0);
    const totalGoals = rows.reduce((sum, r) => sum + r.stats.goals, 0);
    const totalAssists = rows.reduce((sum, r) => sum + r.stats.assists, 0);
    const totalYel = rows.reduce((sum, r) => sum + r.stats.yel, 0);
    const totalRed = rows.reduce((sum, r) => sum + r.stats.red, 0);
    
    // Weighted Average Rating
    let totalRating = 0;
    if (totalApps > 0) {
        totalRating = rows.reduce((sum, r) => sum + (r.stats.rating * r.stats.apps), 0) / totalApps;
    }

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="py-3 pl-2">Organizasyon</th>
                            <th className="py-3 text-center" title="Maç">Maç</th>
                            <th className="py-3 text-center" title="Gol">Gol</th>
                            <th className="py-3 text-center" title="Asist">Ast</th>
                            <th className="py-3 text-center hidden sm:table-cell" title="Sarı Kart">Sar</th>
                            <th className="py-3 text-center hidden sm:table-cell" title="Kırmızı Kart">Kır</th>
                            <th className="py-3 text-center" title="Ortalama Puan">Ort</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="py-3 pl-2 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                                    <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full border border-slate-300 dark:border-slate-600">
                                        {row.icon}
                                    </div>
                                    {row.name}
                                </td>
                                <td className="py-3 text-center text-slate-500 dark:text-slate-400 font-medium">{row.stats.apps > 0 ? row.stats.apps : '-'}</td>
                                <td className="py-3 text-center font-bold text-slate-900 dark:text-white">{row.stats.goals > 0 ? row.stats.goals : '-'}</td>
                                <td className="py-3 text-center text-slate-600 dark:text-slate-300">{row.stats.assists > 0 ? row.stats.assists : '-'}</td>
                                <td className="py-3 text-center text-yellow-600 dark:text-yellow-500 hidden sm:table-cell">{row.stats.yel > 0 ? row.stats.yel : '-'}</td>
                                <td className="py-3 text-center text-red-600 dark:text-red-500 hidden sm:table-cell">{row.stats.red > 0 ? row.stats.red : '-'}</td>
                                <td className="py-3 text-center font-mono">
                                    {renderRating(row.stats.rating)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                        <tr>
                            <td className="py-3 pl-2 uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400">Genel Toplam</td>
                            <td className="py-3 text-center">{totalApps}</td>
                            <td className="py-3 text-center text-slate-900 dark:text-white">{totalGoals}</td>
                            <td className="py-3 text-center">{totalAssists}</td>
                            <td className="py-3 text-center text-yellow-600 dark:text-yellow-500 hidden sm:table-cell">{totalYel}</td>
                            <td className="py-3 text-center text-red-600 dark:text-red-500 hidden sm:table-cell">{totalRed}</td>
                            <td className="py-3 text-center font-mono">
                                {renderRating(totalRating)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default PlayerStatsTable;