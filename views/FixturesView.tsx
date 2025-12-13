
import React, { useState } from 'react';
import { Fixture, Team } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FixturesView = ({ fixtures, teams, myTeamId, currentWeek, onTeamClick, onFixtureClick }: { fixtures: Fixture[], teams: Team[], myTeamId: string, currentWeek: number, onTeamClick: (id: string) => void, onFixtureClick: (f: Fixture) => void }) => {
    const [viewWeek, setViewWeek] = useState(currentWeek);
    
    // Group fixtures by week
    const weeks = Array.from(new Set(fixtures.map(f => f.week))).sort((a,b) => a - b);
    const currentFixtures = fixtures.filter(f => f.week === viewWeek);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <button onClick={() => setViewWeek(w => Math.max(weeks[0], w - 1))} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-900 dark:text-white"><ChevronLeft /></button>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{viewWeek}. HAFTA</div>
                <button onClick={() => setViewWeek(w => Math.min(weeks[weeks.length-1], w + 1))} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-900 dark:text-white"><ChevronRight /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentFixtures.map(f => {
                    const home = teams.find(t => t.id === f.homeTeamId);
                    const away = teams.find(t => t.id === f.awayTeamId);
                    if(!home || !away) return null;
                    const isMyMatch = f.homeTeamId === myTeamId || f.awayTeamId === myTeamId;
                    
                    return (
                        <div key={f.id} onClick={() => f.played && onFixtureClick(f)} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border ${isMyMatch ? 'border-yellow-500' : 'border-slate-200 dark:border-slate-700'} ${f.played ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : ''} flex items-center justify-between shadow-sm`}>
                             <div className="flex items-center gap-3 w-1/3 cursor-pointer hover:opacity-80" onClick={(e) => { e.stopPropagation(); onTeamClick(home.id); }}>
                                 {home.logo ? <img src={home.logo} className="w-8 h-8 object-contain"/> : <div className={`w-8 h-8 rounded-full ${home.colors[0]}`} />}
                                 <span className="font-bold text-sm truncate text-slate-900 dark:text-white">{home.name}</span>
                             </div>
                             <div className={`text-center w-1/3 font-mono font-bold text-lg bg-slate-100 dark:bg-slate-900 py-1 rounded ${f.played ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                 {f.played ? `${f.homeScore} - ${f.awayScore}` : 'v'}
                             </div>
                             <div className="flex items-center gap-3 w-1/3 justify-end cursor-pointer hover:opacity-80" onClick={(e) => { e.stopPropagation(); onTeamClick(away.id); }}>
                                 <span className="font-bold text-sm truncate text-slate-900 dark:text-white">{away.name}</span>
                                 {away.logo ? <img src={away.logo} className="w-8 h-8 object-contain"/> : <div className={`w-8 h-8 rounded-full ${away.colors[0]}`} />}
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FixturesView;
