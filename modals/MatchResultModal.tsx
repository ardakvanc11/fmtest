
import React, { useState } from 'react';
import { Team, MatchStats, MatchEvent } from '../types';
import { Activity, MonitorPlay, Syringe, Disc, Users, BarChart2, Star } from 'lucide-react';

const MatchResultModal = ({ homeTeam, awayTeam, homeScore, awayScore, stats, events, onProceed }: {homeTeam: Team, awayTeam: Team, homeScore: number, awayScore: number, stats: MatchStats, events: MatchEvent[], onProceed: () => void }) => {
    const [statsTab, setStatsTab] = useState<'STATS' | 'RATINGS'>('STATS');

    // Filter out purely informational events to keep the timeline clean
    const timelineEvents = events.filter(e => 
        e.type === 'GOAL' || 
        e.type === 'CARD_YELLOW' || 
        e.type === 'CARD_RED' || 
        e.type === 'INJURY' || 
        e.type === 'VAR' ||
        e.type === 'MISS' // Optional: Show missed penalties or huge chances
    ).sort((a,b) => a.minute - b.minute);

    const getEventIcon = (type: MatchEvent['type']) => {
        switch(type) {
            case 'GOAL': return <Disc size={16} className="text-white fill-white"/>; // Ball representation
            case 'CARD_YELLOW': return <div className="w-3 h-4 bg-yellow-500 rounded-sm border border-yellow-600 shadow-sm"></div>;
            case 'CARD_RED': return <div className="w-3 h-4 bg-red-600 rounded-sm border border-red-700 shadow-sm"></div>;
            case 'INJURY': return <Syringe size={16} className="text-red-400"/>;
            case 'VAR': return <MonitorPlay size={16} className="text-purple-400"/>;
            default: return <Activity size={16} className="text-slate-400"/>;
        }
    };

    // Helper to find player name from ID if scorer name is missing (e.g. for Cards/Injuries)
    const getPlayerName = (event: MatchEvent) => {
        if (event.scorer) return event.scorer;
        if (event.playerId) {
            const player = homeTeam.players.find(p => p.id === event.playerId) || awayTeam.players.find(p => p.id === event.playerId);
            if (player) return player.name;
        }
        return null;
    };

    const renderPlayerRatings = (ratings: any[], teamName: string) => (
        <div className="mb-6 last:mb-0">
            <div className="text-sm font-bold text-slate-400 uppercase mb-2 border-b border-slate-700 pb-1 flex justify-between">
                <span>{teamName}</span>
                <span className="flex gap-3"><span>Puan</span><span>Gol</span><span>Asist</span></span>
            </div>
            <div className="space-y-1">
                {ratings.sort((a:any, b:any) => b.rating - a.rating).map((p:any, i:number) => {
                    // Calculate goals and assists from events directly to ensure accuracy
                    const goalCount = events.filter(e => e.type === 'GOAL' && e.scorer === p.name).length;
                    const assistCount = events.filter(e => e.type === 'GOAL' && e.assist === p.name).length;
                    
                    return (
                        <div key={i} className="flex justify-between items-center text-sm p-1.5 hover:bg-slate-700/50 rounded transition">
                             <div className="flex items-center gap-2">
                                 <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${p.position === 'GK' ? 'bg-yellow-600' : p.position === 'DEF' ? 'bg-blue-600' : p.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>
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
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
             <div className="text-center mb-6 animate-in zoom-in duration-500 w-full max-w-4xl mt-10">
                 <div className="text-6xl font-mono font-bold text-white mb-4 bg-slate-900 px-8 py-4 rounded-xl border border-slate-700 shadow-2xl flex items-center justify-center gap-8">
                     <div className="flex flex-col items-center">
                        <img src={homeTeam.logo} className="w-20 h-20 object-contain mb-2"/>
                        <span className="text-sm font-sans font-normal text-slate-400 truncate w-20 text-center">{homeTeam.name}</span>
                     </div>
                     <span>{homeScore} - {awayScore}</span>
                     <div className="flex flex-col items-center">
                        <img src={awayTeam.logo} className="w-20 h-20 object-contain mb-2"/>
                        <span className="text-sm font-sans font-normal text-slate-400 truncate w-20 text-center">{awayTeam.name}</span>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
                     
                     {/* LEFT COLUMN: MATCH FLOW TIMELINE */}
                     <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-96 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2 text-center flex items-center justify-center gap-2">
                            <Activity size={16}/> Maç Akışı
                        </h3>
                        <div className="flex-1 overflow-y-auto relative px-2">
                             {/* Vertical Spine */}
                             <div className="absolute left-1/2 top-2 bottom-2 w-px bg-slate-700 -translate-x-1/2"></div>
                             
                             {timelineEvents.length === 0 && (
                                 <div className="text-center text-slate-500 text-sm mt-10 italic">Önemli bir olay yaşanmadı.</div>
                             )}

                             {timelineEvents.map((e, i) => {
                                 const isHome = e.teamName === homeTeam.name;
                                 const isGoal = e.type === 'GOAL';
                                 const playerName = getPlayerName(e);
                                 
                                 return (
                                     <div key={i} className={`flex items-center justify-between mb-4 relative w-full`}>
                                         {/* Left Side (Home) */}
                                         <div className={`flex-1 flex items-center gap-2 ${isHome ? 'justify-end pr-4' : 'opacity-0'}`}>
                                             {isHome && (
                                                 <div className="flex flex-col items-end">
                                                     <div className="flex items-center gap-2 justify-end">
                                                        {playerName && <span className={`text-sm font-bold ${isGoal ? 'text-green-400' : 'text-white'}`}>{playerName}</span>}
                                                        {getEventIcon(e.type)}
                                                     </div>
                                                     {isGoal && e.assist && (
                                                         <span className="text-[10px] text-slate-400 mt-0.5">Asist: {e.assist}</span>
                                                     )}
                                                 </div>
                                             )}
                                         </div>

                                         {/* Center (Minute) */}
                                         <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 z-10 shrink-0 shadow-lg">
                                             {e.minute}'
                                         </div>

                                         {/* Right Side (Away) */}
                                         <div className={`flex-1 flex items-center gap-2 ${!isHome ? 'justify-start pl-4' : 'opacity-0'}`}>
                                             {!isHome && (
                                                 <div className="flex flex-col items-start">
                                                     <div className="flex items-center gap-2">
                                                        {getEventIcon(e.type)}
                                                        {playerName && <span className={`text-sm font-bold ${isGoal ? 'text-green-400' : 'text-white'}`}>{playerName}</span>}
                                                     </div>
                                                     {isGoal && e.assist && (
                                                         <span className="text-[10px] text-slate-400 mt-0.5">Asist: {e.assist}</span>
                                                     )}
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                     </div>

                     {/* RIGHT COLUMN: MATCH STATS OR PLAYER RATINGS */}
                     <div className="bg-slate-800 rounded-xl border border-slate-700 h-96 flex flex-col overflow-hidden">
                        <div className="flex border-b border-slate-700">
                             <button 
                                onClick={() => setStatsTab('STATS')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition ${statsTab === 'STATS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                 <BarChart2 size={16}/> Takım İstatistikleri
                             </button>
                             <button 
                                onClick={() => setStatsTab('RATINGS')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition ${statsTab === 'RATINGS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                 <Users size={16}/> Oyuncu Puanları
                             </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            {statsTab === 'STATS' ? (
                                <div className="space-y-5 text-sm">
                                     {/* Possession */}
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

                                     {/* Shots */}
                                     <div className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                                        <span className={`font-bold ${stats.homeShots > stats.awayShots ? 'text-green-400' : 'text-slate-300'}`}>{stats.homeShots}</span>
                                        <span className="text-slate-500 uppercase text-xs">Şut</span>
                                        <span className={`font-bold ${stats.awayShots > stats.homeShots ? 'text-green-400' : 'text-slate-300'}`}>{stats.awayShots}</span>
                                    </div>

                                    {/* Shots on Target */}
                                    <div className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                                        <span className={`font-bold ${stats.homeShotsOnTarget > stats.awayShotsOnTarget ? 'text-green-400' : 'text-slate-300'}`}>{stats.homeShotsOnTarget}</span>
                                        <span className="text-slate-500 uppercase text-xs">İsabetli Şut</span>
                                        <span className={`font-bold ${stats.awayShotsOnTarget > stats.homeShotsOnTarget ? 'text-green-400' : 'text-slate-300'}`}>{stats.awayShotsOnTarget}</span>
                                    </div>

                                     {/* Corners */}
                                     <div className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                                        <span className="font-bold text-slate-300">{stats.homeCorners}</span>
                                        <span className="text-slate-500 uppercase text-xs">Korner</span>
                                        <span className="font-bold text-slate-300">{stats.awayCorners}</span>
                                    </div>

                                     {/* Fouls */}
                                     <div className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                                        <span className="font-bold text-slate-300">{stats.homeFouls}</span>
                                        <span className="text-slate-500 uppercase text-xs">Faul</span>
                                        <span className="font-bold text-slate-300">{stats.awayFouls}</span>
                                    </div>

                                    {/* Cards */}
                                     <div className="flex justify-between items-center py-1">
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
                                </div>
                            ) : (
                                <div>
                                    {renderPlayerRatings(stats.homeRatings, homeTeam.name)}
                                    {renderPlayerRatings(stats.awayRatings, awayTeam.name)}
                                </div>
                            )}
                        </div>
                     </div>

                 </div>
             </div>
             
             <button onClick={onProceed} className="bg-white text-black px-8 py-4 rounded-lg font-bold text-xl hover:scale-105 transition mb-8 shadow-xl">
                 BASIN TOPLANTISINA GEÇ
             </button>
        </div>
    );
};

export default MatchResultModal;
