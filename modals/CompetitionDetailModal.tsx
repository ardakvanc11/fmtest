
import React, { useState, useMemo } from 'react';
import { Team, Fixture, Player, Position } from '../types';
import { Trophy, X, ChevronLeft, ChevronRight, Star, Activity, Flame, ShieldAlert, History, Goal, Zap, Shield, Award, AlertTriangle } from 'lucide-react';
import StandingsTable from '../components/shared/StandingsTable';
import PlayerFace from '../components/shared/PlayerFace';
import { getFormattedDate } from '../utils/calendarAndFixtures';

interface CompetitionDetailModalProps {
    competitionId: string;
    competitionName: string;
    teams: Team[];
    fixtures: Fixture[];
    currentWeek: number;
    onClose: () => void;
    onTeamClick: (id: string) => void;
    onPlayerClick: (p: Player) => void;
    variant?: 'modal' | 'embedded';
}

const CompetitionDetailModal: React.FC<CompetitionDetailModalProps> = ({ 
    competitionId, 
    competitionName, 
    teams, 
    fixtures, 
    currentWeek, 
    onClose,
    onTeamClick,
    onPlayerClick,
    variant = 'modal'
}) => {
    // State for Fixture Navigation
    const [viewWeek, setViewWeek] = useState(currentWeek);
    
    // State for Stats Tab
    const [statTab, setStatTab] = useState<'GOAL' | 'RATING' | 'ASSIST' | 'CLEANSHEET' | 'MVP' | 'CARD'>('GOAL');

    // --- DATA PREPARATION ---

    // 1. Fixtures for the specific week
    const weekFixtures = useMemo(() => {
        return fixtures
            .filter(f => f.week === viewWeek)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [fixtures, viewWeek]);

    // 2. Player Stats Logic
    const statsList = useMemo(() => {
        const allPlayers = teams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name, teamLogo: t.logo })));
        
        let sorted = [];
        let valueKey = (p: any) => 0;
        let displayFormat = (val: number) => val.toString();

        switch(statTab) {
            case 'GOAL':
                sorted = allPlayers.filter(p => p.seasonStats.goals > 0).sort((a,b) => b.seasonStats.goals - a.seasonStats.goals);
                valueKey = (p) => p.seasonStats.goals;
                break;
            case 'ASSIST':
                sorted = allPlayers.filter(p => p.seasonStats.assists > 0).sort((a,b) => b.seasonStats.assists - a.seasonStats.assists);
                valueKey = (p) => p.seasonStats.assists;
                break;
            case 'RATING':
                sorted = allPlayers.filter(p => p.seasonStats.matchesPlayed >= 3).sort((a,b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0));
                valueKey = (p) => p.seasonStats.averageRating || 0;
                displayFormat = (val) => val.toFixed(2);
                break;
            case 'MVP':
                // Calculate MVP counts dynamically
                const mvpCounts: Record<string, number> = {};
                fixtures.forEach(f => {
                    if (f.played && f.stats?.mvpPlayerId) {
                        mvpCounts[f.stats.mvpPlayerId] = (mvpCounts[f.stats.mvpPlayerId] || 0) + 1;
                    }
                });
                sorted = allPlayers.filter(p => mvpCounts[p.id]).sort((a,b) => mvpCounts[b.id] - mvpCounts[a.id]);
                valueKey = (p) => mvpCounts[p.id];
                break;
            case 'CARD':
                sorted = allPlayers.filter(p => (p.seasonStats.yellowCards || 0) > 0).sort((a,b) => (b.seasonStats.yellowCards || 0) - (a.seasonStats.yellowCards || 0));
                valueKey = (p) => p.seasonStats.yellowCards || 0;
                break;
            case 'CLEANSHEET':
                // Calculate Clean Sheets for GKs
                const gkStats: Record<string, number> = {};
                fixtures.forEach(f => {
                    if (f.played && f.homeScore !== null && f.awayScore !== null) {
                        if (f.awayScore === 0) {
                            const homeTeam = teams.find(t => t.id === f.homeTeamId);
                            const gk = homeTeam?.players.find(p => p.position === Position.GK); // Assuming main GK played
                            if (gk) gkStats[gk.id] = (gkStats[gk.id] || 0) + 1;
                        }
                        if (f.homeScore === 0) {
                            const awayTeam = teams.find(t => t.id === f.awayTeamId);
                            const gk = awayTeam?.players.find(p => p.position === Position.GK);
                            if (gk) gkStats[gk.id] = (gkStats[gk.id] || 0) + 1;
                        }
                    }
                });
                sorted = allPlayers.filter(p => p.position === Position.GK && gkStats[p.id]).sort((a,b) => gkStats[b.id] - gkStats[a.id]);
                valueKey = (p) => gkStats[p.id];
                break;
        }

        return sorted.slice(0, 5).map(p => ({
            ...p,
            displayValue: displayFormat(valueKey(p))
        }));
    }, [teams, fixtures, statTab]);

    // 3. Past Winners
    const pastWinners = useMemo(() => {
        const allHistory: { year: string, team: Team }[] = [];
        teams.forEach(t => {
            if (t.leagueHistory) {
                t.leagueHistory.filter(h => h.rank === 1).forEach(h => {
                    allHistory.push({ year: h.year, team: t });
                });
            }
        });
        return allHistory.sort((a, b) => parseInt(b.year.split('/')[0]) - parseInt(a.year.split('/')[0])).slice(0, 6);
    }, [teams]);

    const containerClass = variant === 'modal' 
        ? "fixed inset-0 z-[150] bg-black/95 flex flex-col animate-in fade-in duration-300"
        : "flex-1 flex flex-col h-full bg-[#1b1b1b] overflow-hidden"; 

    const SectionHeader = ({ title, rightContent }: any) => (
        <div className="flex items-center justify-between text-[#ff9f43] font-bold text-xs uppercase mb-2 pl-2 border-l-4 border-[#ff9f43]">
            <span>{title}</span>
            {rightContent}
        </div>
    );

    return (
        <div className={containerClass}>
            {/* Main Header */}
            {variant === 'modal' && (
                <div className="bg-[#252525] border-b border-[#333] p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <Trophy size={24} className="text-[#ff9f43]" />
                        <h2 className="text-xl font-bold text-white uppercase font-teko tracking-wide">{competitionName}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-[#333] hover:bg-red-600 rounded text-white transition">
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Dashboard Content */}
            <div className="flex-1 overflow-hidden p-2 md:p-4 bg-[#1b1b1b]">
                <div className="grid grid-cols-12 gap-4 h-full">
                    
                    {/* LEFT COLUMN: STANDINGS (Col Span 4) */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col h-full overflow-hidden">
                        <div className="bg-[#252525] rounded border border-[#333] flex flex-col h-full">
                            <div className="p-3 border-b border-[#333]">
                                <SectionHeader title="Puan Durumu" />
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                <StandingsTable teams={teams} myTeamId={null} fixtures={fixtures} onTeamClick={onTeamClick} compact={true} />
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE COLUMN: FIXTURES (Col Span 5) */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col h-full overflow-hidden">
                        <div className="bg-[#252525] rounded border border-[#333] flex flex-col h-full">
                            <div className="p-3 border-b border-[#333]">
                                <SectionHeader 
                                    title="Maçlar / Sonuçlar" 
                                    rightContent={
                                        <div className="flex items-center gap-4 text-white bg-[#111] px-3 py-1 rounded-full border border-[#444]">
                                            <button onClick={() => setViewWeek(Math.max(1, viewWeek - 1))} className="hover:text-[#ff9f43] transition"><ChevronLeft size={16}/></button>
                                            <span className="text-xs font-bold text-slate-200 w-16 text-center">{viewWeek}. HAFTA</span>
                                            <button onClick={() => setViewWeek(Math.min(34, viewWeek + 1))} className="hover:text-[#ff9f43] transition"><ChevronRight size={16}/></button>
                                        </div>
                                    }
                                />
                                <div className="text-[10px] text-slate-500 font-bold mt-1 px-2">{weekFixtures.length > 0 ? getFormattedDate(weekFixtures[0].date).label : 'Maç Yok'}</div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                {weekFixtures.length === 0 ? (
                                    <div className="text-center text-slate-500 text-xs py-10">Bu hafta maç bulunmuyor.</div>
                                ) : (
                                    <div className="divide-y divide-[#333]">
                                        {weekFixtures.map(f => {
                                            const h = teams.find(t => t.id === f.homeTeamId);
                                            const a = teams.find(t => t.id === f.awayTeamId);
                                            return (
                                                <div key={f.id} className="flex items-center justify-between py-3 px-4 hover:bg-[#333] cursor-pointer group transition-colors">
                                                    <div className="flex-1 text-right flex items-center justify-end gap-3">
                                                        <span className="text-sm font-bold text-slate-300 truncate">{h?.name}</span>
                                                        {h?.logo && <img src={h.logo} className="w-6 h-6 object-contain" />}
                                                    </div>
                                                    
                                                    <div className="px-4 text-center w-20">
                                                        {f.played ? (
                                                            <span className="text-white font-mono font-black text-lg tracking-widest">{f.homeScore}-{f.awayScore}</span>
                                                        ) : (
                                                            <span className="text-slate-600 text-xs font-mono">-</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex-1 text-left flex items-center justify-start gap-3">
                                                        {a?.logo && <img src={a.logo} className="w-6 h-6 object-contain" />}
                                                        <span className="text-sm font-bold text-slate-300 truncate">{a?.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: STATS & HISTORY (Col Span 3) */}
                    <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                        
                        {/* 1. PAST WINNERS */}
                        <div className="bg-[#252525] rounded border border-[#333] p-0 shrink-0 h-1/3 flex flex-col">
                            <div className="p-3 border-b border-[#333]">
                                <SectionHeader title="Geçmiş Şampiyonlar" />
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {pastWinners.length === 0 ? (
                                    <div className="text-xs text-slate-500 italic p-4 text-center">Veri yok</div>
                                ) : (
                                    <div className="divide-y divide-[#333]">
                                        {pastWinners.map((h, i) => (
                                            <div key={i} className="flex justify-between items-center p-2 px-3 hover:bg-[#333] cursor-pointer" onClick={() => onTeamClick(h.team.id)}>
                                                <div className="text-xs text-[#ff9f43] font-mono font-bold w-16">{h.year}</div>
                                                <div className="flex-1 flex items-center gap-2">
                                                    {h.team.logo && <img src={h.team.logo} className="w-5 h-5 object-contain"/>}
                                                    <span className="text-xs font-bold text-white truncate">{h.team.name}</span>
                                                </div>
                                                <Trophy size={12} className="text-yellow-500"/>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. PLAYER STATS */}
                        <div className="bg-[#252525] rounded border border-[#333] p-0 flex-1 flex flex-col overflow-hidden">
                            <div className="p-3 border-b border-[#333]">
                                <SectionHeader title="Oyuncu İstatistikleri" />
                                
                                {/* Stats Tabs */}
                                <div className="grid grid-cols-3 gap-1 mt-2">
                                    {[
                                        { id: 'GOAL', label: 'GOL', icon: Goal },
                                        { id: 'RATING', label: 'PUAN', icon: Star },
                                        { id: 'ASSIST', label: 'ASİST', icon: Zap },
                                        { id: 'CLEANSHEET', label: 'GOL YEMEME', icon: Shield },
                                        { id: 'MVP', label: 'MVP', icon: Award },
                                        { id: 'CARD', label: 'KART', icon: AlertTriangle }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setStatTab(tab.id as any)}
                                            className={`flex items-center justify-center gap-1 py-1.5 text-[9px] font-bold uppercase rounded border transition-all ${statTab === tab.id ? 'bg-[#ff9f43] text-black border-[#ff9f43]' : 'bg-[#333] text-slate-400 border-[#444] hover:bg-[#444]'}`}
                                        >
                                            <tab.icon size={10} /> {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                {statsList.length === 0 ? (
                                    <div className="text-center text-slate-500 text-xs py-10">Veri yok.</div>
                                ) : (
                                    <div className="divide-y divide-[#333]">
                                        {statsList.map((p, i) => (
                                            <div key={p.id} className="flex items-center p-3 hover:bg-[#333] cursor-pointer group" onClick={() => onPlayerClick(p)}>
                                                <div className="w-6 text-center font-mono text-slate-500 text-xs">{i+1}</div>
                                                <div className="w-8 h-8 rounded-full border border-[#444] overflow-hidden bg-slate-200 shrink-0">
                                                    <PlayerFace player={p} />
                                                </div>
                                                <div className="flex-1 ml-3 min-w-0">
                                                    <div className="text-xs font-bold text-white truncate">{p.name}</div>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                        {p.teamLogo && <img src={p.teamLogo} className="w-3 h-3 object-contain"/>}
                                                        <span className="truncate">{p.teamName}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-[#ff9f43] font-mono">{p.displayValue}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompetitionDetailModal;
