

import React, { useState } from 'react';
import { Fixture, Team, MatchEvent } from '../types';
import { X, Star, Users, BarChart2, Disc, Syringe, MonitorPlay, RefreshCw } from 'lucide-react';

const MatchDetailModal = ({ fixture, teams, onClose }: { fixture: Fixture, teams: Team[], onClose: () => void }) => {
    const [statsTab, setStatsTab] = useState<'STATS' | 'RATINGS'>('STATS');

    const home = teams.find(t => t.id === fixture.homeTeamId);
    const away = teams.find(t => t.id === fixture.awayTeamId);

    if (!home || !away || !fixture.stats || !fixture.matchEvents) return null;

    const stats = fixture.stats;
    const events = fixture.matchEvents;

    // Calculate Half Time Score
    const halfTimeHomeScore = events.filter(e => e.type === 'GOAL' && e.teamName === home.name && e.minute <= 45).length;
    const halfTimeAwayScore = events.filter(e => e.type === 'GOAL' && e.teamName === away.name && e.minute <= 45).length;

    // Filter events for timeline
    const timelineEvents = events.filter(e => 
        e.type === 'GOAL' || 
        e.type === 'CARD_YELLOW' || 
        e.type === 'CARD_RED' || 
        e.type === 'INJURY' || 
        e.type === 'SUBSTITUTION' ||
        e.type === 'VAR' || 
        e.type === 'MISS'
    ).sort((a,b) => a.minute - b.minute);

    const getEventIcon = (type: MatchEvent['type']) => {
        switch(type) {
            case 'GOAL': return <Disc size={16} className="text-white fill-white"/>;
            case 'CARD_YELLOW': return <div className="w-3 h-4 bg-yellow-500 rounded-sm border border-yellow-600 shadow-sm"></div>;
            case 'CARD_RED': return <div className="w-3 h-4 bg-red-600 rounded-sm border border-red-700 shadow-sm"></div>;
            case 'INJURY': return <Syringe size={16} className="text-red-400"/>;
            case 'VAR': return <MonitorPlay size={16} className="text-purple-400"/>;
            case 'SUBSTITUTION': return <RefreshCw size={16} className="text-green-400"/>;
            default: return null;
        }
    };

    const getPlayerName = (event: MatchEvent) => {
        if (event.scorer) return event.scorer;
        if (event.playerId) {
            const player = home.players.find(p => p.id === event.playerId) || away.players.find(p => p.id === event.playerId);
            if (player) return player.name;
        }
        return null;
    };

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600';
    };

    const renderPlayerRatings = (ratings: any[], teamName: string, teamColors: [string, string]) => (
        <div className="mb-6 last:mb-0">
            <div className="text-sm font-bold text-slate-400 uppercase mb-2 border-b border-slate-700 pb-1 flex justify-between">
                <span className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${teamColors[0]}`}></div>
                    {teamName}
                </span>
                <span className="flex gap-3"><span>Puan</span><span>Gol</span><span>Asist</span></span>
            </div>
            <div className="space-y-1">
                {ratings.sort((a:any, b:any) => b.rating - a.rating).map((p:any, i:number) => {
                    const goalCount = events.filter(e => e.type === 'GOAL' && e.scorer === p.name).length;
                    const assistCount = events.filter(e => e.type === 'GOAL' && e.assist === p.name).length;
                    
                    return (
                        <div key={i} className="flex justify-between items-center text-sm p-1.5 hover:bg-slate-700/50 rounded transition">
                             <div className="flex items-center gap-2">
                                 <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${getPosBadgeColor(p.position)}`}>
                                     {p.position}
                                 </div>
                                 <span className="text-slate-200 font-medium truncate max-w-[120px]">{p.name}</span>
                                 {stats.mvpPlayerName === p.name && <Star size={12} className="text-yellow-400 fill-yellow-400"/>}
                             </div>
                             <div className="flex gap-3 font-mono text-center">
                                 <span className={`font-bold w-8 ${p.rating >= 8.0 ? 'text-green-400' : p.rating >= 6.0 ? 'text-yellow-400' : 'text-red-400'}`}>{p.rating}</span>
                                 <span className={`w-6 ${goalCount > 0 ? 'text-green-400 font-bold' : 'text-slate-600'}`}>{goalCount > 0 ? goalCount : '-'}</span>
                                 <span className={`w-6 ${assistCount > 0 ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>{assistCount > 0 ? assistCount : '-'}</span>
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
             <div className="relative w-full max-w-4xl my-8 animate-in zoom-in duration-300 flex flex-col">
                 {/* Close Button Top */}
                 <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-red-500 transition z-50 bg-black/50 rounded-full p-2 md:bg-transparent md:p-0">
                    <X size={32} />
                 </button>

                 {/* Scoreboard Header */}
                 <div className="text-center mb-6">
                     <div className="bg-slate-900 px-8 py-6 rounded-xl border border-slate-700 shadow-2xl flex items-center justify-center gap-4 md:gap-12 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                         
                         <div className="flex flex-col items-center w-1/3">
                            <img src={home.logo} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-2 drop-shadow-lg"/>
                            <span className="text-sm md:text-lg font-bold text-white truncate w-full text-center">{home.name}</span>
                         </div>
                         
                         <div className="flex flex-col items-center shrink-0">
                            <span className="text-5xl md:text-6xl font-mono font-bold text-white tracking-wider">{fixture.homeScore} - {fixture.awayScore}</span>
                            <span className="text-sm md:text-xl text-slate-500 font-sans font-bold tracking-widest mt-1 bg-slate-800 px-3 py-1 rounded">İY: {halfTimeHomeScore}-{halfTimeAwayScore}</span>
                         </div>
                         
                         <div className="flex flex-col items-center w-1/3">
                            <img src={away.logo} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-2 drop-shadow-lg"/>
                            <span className="text-sm md:text-lg font-bold text-white truncate w-full text-center">{away.name}</span>
                         </div>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left h-[600px]">
                     
                     {/* LEFT COLUMN: MATCH FLOW TIMELINE */}
                     <div className="bg-slate-800 p-0 rounded-xl border border-slate-700 flex flex-col h-full shadow-lg overflow-hidden">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest p-4 border-b border-slate-700 text-center bg-slate-800/50 backdrop-blur-sm z-10">
                            Maç Akışı
                        </h3>
                        <div className="flex-1 overflow-y-auto relative px-4 py-4 custom-scrollbar">
                             <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700 -translate-x-1/2"></div>
                             
                             {timelineEvents.length === 0 && (
                                 <div className="text-center text-slate-500 text-sm mt-10 italic">Önemli bir olay yaşanmadı.</div>
                             )}

                             {timelineEvents.map((e, i) => {
                                 const isHome = e.teamName === home.name;
                                 const isGoal = e.type === 'GOAL';
                                 const playerName = getPlayerName(e);
                                 
                                 return (
                                     <div key={i} className="flex items-center justify-between mb-2 relative w-full group hover:bg-white/5 rounded-lg transition-colors py-1">
                                         <div className="flex-1 pr-6 flex justify-end">
                                             {isHome ? (
                                                 <div className="flex flex-col items-end text-right">
                                                     <div className="flex items-center gap-2 justify-end">
                                                        {playerName && <span className={`text-sm font-bold ${isGoal ? 'text-green-400' : 'text-white'}`}>{playerName}</span>}
                                                        {getEventIcon(e.type)}
                                                     </div>
                                                     {e.type === 'SUBSTITUTION' && (
                                                         <span className="text-xs text-white font-bold mt-0.5">{e.description}</span>
                                                     )}
                                                     {isGoal && e.assist && (
                                                         <span className="text-[10px] text-slate-400 mt-0.5">Asist: {e.assist}</span>
                                                     )}
                                                 </div>
                                             ) : <div className="w-full h-1"></div>}
                                         </div>

                                         <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 z-10 shrink-0 shadow-lg group-hover:border-slate-400 group-hover:text-white transition-colors">
                                             {e.minute}'
                                         </div>

                                         <div className="flex-1 pl-6 flex justify-start">
                                             {!isHome ? (
                                                 <div className="flex flex-col items-start text-left">
                                                     <div className="flex items-center gap-2">
                                                        {getEventIcon(e.type)}
                                                        {playerName && <span className={`text-sm font-bold ${isGoal ? 'text-green-400' : 'text-white'}`}>{playerName}</span>}
                                                     </div>
                                                     {e.type === 'SUBSTITUTION' && (
                                                         <span className="text-xs text-white font-bold mt-0.5">{e.description}</span>
                                                     )}
                                                     {isGoal && e.assist && (
                                                         <span className="text-[10px] text-slate-400 mt-0.5">Asist: {e.assist}</span>
                                                     )}
                                                 </div>
                                             ) : <div className="w-full h-1"></div>}
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                     </div>

                     {/* RIGHT COLUMN: STATS OR RATINGS */}
                     <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full overflow-hidden shadow-lg">
                        <div className="flex border-b border-slate-700 shrink-0">
                             <button 
                                onClick={() => setStatsTab('STATS')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition ${statsTab === 'STATS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                 <BarChart2 size={16}/> İstatistikler
                             </button>
                             <button 
                                onClick={() => setStatsTab('RATINGS')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition ${statsTab === 'RATINGS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                 <Users size={16}/> Kadrolar
                             </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {statsTab === 'STATS' ? (
                                <div className="space-y-6 text-sm">
                                     <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold ${stats.homePossession > stats.awayPossession ? 'text-white' : 'text-slate-400'}`}>%{stats.homePossession}</span>
                                            <span className="text-slate-500 uppercase text-xs">Topla Oynama</span>
                                            <span className={`font-bold ${stats.awayPossession > stats.homePossession ? 'text-white' : 'text-slate-400'}`}>%{stats.awayPossession}</span>
                                        </div>
                                        <div className="flex h-2 rounded-full overflow-hidden bg-slate-900">
                                            <div className="bg-blue-500 h-full" style={{width: `${stats.homePossession}%`}}></div>
                                            <div className="bg-red-500 h-full" style={{width: `${stats.awayPossession}%`}}></div>
                                        </div>
                                    </div>

                                    {[
                                        { label: 'Şut', h: stats.homeShots, a: stats.awayShots },
                                        { label: 'İsabetli Şut', h: stats.homeShotsOnTarget, a: stats.awayShotsOnTarget },
                                        { label: 'Korner', h: stats.homeCorners, a: stats.awayCorners },
                                        { label: 'Faul', h: stats.homeFouls, a: stats.awayFouls },
                                    ].map((s, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                                            <span className={`font-bold ${s.h > s.a ? 'text-green-400' : 'text-slate-300'}`}>{s.h}</span>
                                            <span className="text-slate-500 uppercase text-xs">{s.label}</span>
                                            <span className={`font-bold ${s.a > s.h ? 'text-green-400' : 'text-slate-300'}`}>{s.a}</span>
                                        </div>
                                    ))}

                                     <div className="flex justify-between items-center py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-4 bg-yellow-500 rounded-sm"></div>
                                            <span className="font-bold text-white">{stats.homeYellowCards}</span>
                                            <div className="w-3 h-4 bg-red-600 rounded-sm"></div>
                                            <span className="font-bold text-white">{stats.homeRedCards}</span>
                                        </div>
                                        <span className="text-slate-500 uppercase text-xs">Kartlar</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{stats.awayYellowCards}</span>
                                            <div className="w-3 h-4 bg-yellow-500 rounded-sm"></div>
                                            <span className="font-bold text-white">{stats.awayRedCards}</span>
                                            <div className="w-3 h-4 bg-red-600 rounded-sm"></div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-700 text-center">
                                        <div className="text-slate-500 uppercase text-xs mb-2">Maçın Adamı</div>
                                        <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-lg">
                                            <Star size={20} className="fill-yellow-400"/>
                                            {stats.mvpPlayerName}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {renderPlayerRatings(stats.homeRatings, home.name, home.colors)}
                                    {renderPlayerRatings(stats.awayRatings, away.name, away.colors)}
                                </div>
                            )}
                        </div>
                     </div>

                 </div>

                 {/* BOTTOM CLOSE BUTTON */}
                 <div className="mt-6 flex justify-center pb-4">
                    <button 
                        onClick={onClose} 
                        className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition flex items-center gap-2"
                    >
                        <X size={20}/> PENCEREYİ KAPAT
                    </button>
                 </div>
             </div>
        </div>
    );
};

export default MatchDetailModal;