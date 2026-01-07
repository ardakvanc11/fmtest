
import React, { useState, useMemo } from 'react';
import { Team, Fixture, Player, Position } from '../types';
import { Trophy, X, ChevronLeft, ChevronRight, Star, Activity, Flame, ShieldAlert, History, Goal, Zap, Shield, Award, AlertTriangle, GitCommit } from 'lucide-react';
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

const PAST_SUPER_CUP_WINNERS = [
    { year: '2024/25', teamName: 'Kedispor' },
    { year: '2023/24', teamName: 'Ayıboğanspor SK' }, // Logo eşleşmesi için tam isim
    { year: '2022/23', teamName: 'Eşşekboğanspor FK' }, // Logo eşleşmesi için tam isim
    { year: '2021/22', teamName: 'Arıspor' },
    { year: '2020/21', teamName: 'Ayıboğanspor SK' },
    { year: '2019/20', teamName: 'Ayıboğanspor SK' }
];

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

    const isLeague = competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1';
    const isKnockout = !isLeague; // SUPER_CUP, CUP, PLAYOFF, EUROPE

    // --- DATA PREPARATION ---

    // Filter teams based on competition
    const competitionTeams = useMemo(() => {
        if (competitionId === 'LEAGUE') {
            return teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId); // Default to LEAGUE if undefined
        } else if (competitionId === 'LEAGUE_1') {
            return teams.filter(t => t.leagueId === 'LEAGUE_1');
        } else if (competitionId === 'SUPER_CUP' || competitionId === 'PLAYOFF') {
             // For Super Cup/Playoff, find teams involved in fixtures
             const compFixtures = fixtures.filter(f => f.competitionId === competitionId || (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL'));
             const teamIds = new Set<string>();
             compFixtures.forEach(f => { teamIds.add(f.homeTeamId); teamIds.add(f.awayTeamId); });
             return teams.filter(t => teamIds.has(t.id));
        }
        return teams; // For cups, potentially all teams
    }, [teams, competitionId, fixtures]);

    // 1. Fixtures for the specific week, filtered by participating teams
    const weekFixtures = useMemo(() => {
        if (isKnockout) {
            // For knockouts, show ALL fixtures related to this competition, sorted by date desc
            return fixtures
                .filter(f => f.competitionId === competitionId || (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL'))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        
        const teamIds = new Set(competitionTeams.map(t => t.id));
        return fixtures
            .filter(f => f.week === viewWeek && (teamIds.has(f.homeTeamId) || teamIds.has(f.awayTeamId)))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [fixtures, viewWeek, competitionTeams, isKnockout, competitionId]);

    // 2. Player Stats Logic (Only for players in this competition's teams)
    const statsList = useMemo(() => {
        const allPlayers = competitionTeams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name, teamLogo: t.logo })));
        
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
                    // Only count if fixture belongs to competition teams (approximate logic)
                    const isRelevant = competitionTeams.some(t => t.id === f.homeTeamId);
                    if (isRelevant && f.played && f.stats?.mvpPlayerId) {
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
                    // Filter relevant fixtures
                    const isHomeRelevant = competitionTeams.some(t => t.id === f.homeTeamId);
                    if (isHomeRelevant && f.played && f.homeScore !== null && f.awayScore !== null) {
                        if (f.awayScore === 0) {
                            const homeTeam = competitionTeams.find(t => t.id === f.homeTeamId);
                            const gk = homeTeam?.players.find(p => p.position === Position.GK); // Assuming main GK played
                            if (gk) gkStats[gk.id] = (gkStats[gk.id] || 0) + 1;
                        }
                        if (f.homeScore === 0) {
                            const awayTeam = competitionTeams.find(t => t.id === f.awayTeamId);
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
    }, [competitionTeams, fixtures, statTab]);

    // 3. Past Winners
    const pastWinners = useMemo(() => {
        if (!isLeague) return []; // No history display for cups in this view for now

        const allHistory: { year: string, team: Team }[] = [];
        const relevantTeams = teams.filter(t => {
            if (competitionId === 'LEAGUE') return t.leagueId === 'LEAGUE' || !t.leagueId;
            if (competitionId === 'LEAGUE_1') return t.leagueId === 'LEAGUE_1';
            return false;
        });

        relevantTeams.forEach(t => {
            if (t.leagueHistory) {
                t.leagueHistory.filter(h => h.rank === 1).forEach(h => {
                    allHistory.push({ year: h.year, team: t });
                });
            }
        });
        
        return allHistory.sort((a, b) => parseInt(b.year.split('/')[0]) - parseInt(a.year.split('/')[0])).slice(0, 6);
    }, [teams, competitionId, isLeague]);

    const containerClass = variant === 'modal' 
        ? "fixed inset-0 z-[150] bg-black/95 flex flex-col animate-in fade-in duration-300"
        : "flex-1 flex flex-col h-full bg-[#1b1b1b] overflow-hidden"; 

    const SectionHeader = ({ title, rightContent }: any) => (
        <div className="flex items-center justify-between text-[#ff9f43] font-bold text-xs uppercase mb-2 pl-2 border-l-4 border-[#ff9f43]">
            <span>{title}</span>
            {rightContent}
        </div>
    );

    // --- BRACKET VISUALIZER (For Super Cup / Playoff) ---
    const renderBracket = () => {
        // Collect matches
        const compFixtures = fixtures.filter(f => 
            f.competitionId === competitionId || 
            (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL')
        );

        // Sort by week to separate rounds
        const semis = compFixtures.filter(f => f.week === (competitionId === 'SUPER_CUP' ? 90 : 35)).sort((a, b) => a.id.localeCompare(b.id));
        const final = compFixtures.find(f => f.week === (competitionId === 'SUPER_CUP' ? 91 : 36));

        // Helper to render a small match box
        const MatchBox = ({ f, label }: { f?: Fixture, label: string }) => {
            if (!f) return (
                <div className="bg-[#252525] border border-dashed border-[#444] rounded p-2 text-center h-16 flex items-center justify-center">
                    <span className="text-slate-600 text-xs italic">{label}</span>
                </div>
            );

            const h = teams.find(t => t.id === f.homeTeamId);
            const a = teams.find(t => t.id === f.awayTeamId);
            
            return (
                <div className="bg-[#333] border border-[#555] rounded p-2 flex flex-col gap-1 shadow-lg relative overflow-hidden group hover:border-[#ff9f43] transition-colors">
                    {f.played && f.pkHome !== undefined && (
                        <div className="absolute top-0 right-0 bg-yellow-600 text-black text-[8px] font-bold px-1">PEN</div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 truncate flex-1">
                            {h?.logo ? <img src={h.logo} className="w-4 h-4 object-contain"/> : <div className={`w-4 h-4 rounded-full ${h?.colors[0]}`}></div>}
                            <span className={`truncate ${f.played && (f.homeScore! > f.awayScore! || (f.pkHome! > f.pkAway!)) ? 'text-white font-bold' : 'text-slate-400'}`}>{h?.name}</span>
                        </div>
                        <span className="font-mono font-bold text-white bg-black/40 px-1.5 rounded">{f.played ? f.homeScore : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 truncate flex-1">
                            {a?.logo ? <img src={a.logo} className="w-4 h-4 object-contain"/> : <div className={`w-4 h-4 rounded-full ${a?.colors[0]}`}></div>}
                            <span className={`truncate ${f.played && (f.awayScore! > f.homeScore! || (f.pkAway! > f.pkHome!)) ? 'text-white font-bold' : 'text-slate-400'}`}>{a?.name}</span>
                        </div>
                        <span className="font-mono font-bold text-white bg-black/40 px-1.5 rounded">{f.played ? f.awayScore : '-'}</span>
                    </div>
                </div>
            );
        };

        return (
            <div className="flex items-center justify-center h-full p-4 relative">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
                
                {/* Semis Column */}
                <div className="flex flex-col gap-12 w-48 relative z-10">
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] text-slate-500 font-bold uppercase text-center mb-1">Yarı Final 1</div>
                        <MatchBox f={semis[0]} label="Yarı Final A" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] text-slate-500 font-bold uppercase text-center mb-1">Yarı Final 2</div>
                        <MatchBox f={semis[1]} label="Yarı Final B" />
                    </div>
                </div>

                {/* Connectors */}
                <div className="w-12 h-32 border-y-2 border-r-2 border-slate-600 rounded-r-xl shrink-0 -ml-1 opacity-50"></div>
                <div className="w-8 h-0.5 bg-slate-600 shrink-0 opacity-50"></div>

                {/* Final Column */}
                <div className="flex flex-col gap-2 w-56 relative z-10">
                    <div className="text-center mb-2">
                        <div className="inline-flex items-center gap-2 text-yellow-500 font-black uppercase text-sm bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                            <Trophy size={14}/> FİNAL
                        </div>
                    </div>
                    <MatchBox f={final} label="Final Maçı" />
                    
                    {final?.played && (
                        <div className="mt-4 text-center animate-in zoom-in duration-500">
                            <div className="text-xs text-slate-400 uppercase font-bold mb-1">ŞAMPİYON</div>
                            {(() => {
                                const winnerId = final.homeScore! > final.awayScore! ? final.homeTeamId : (final.awayScore! > final.homeScore! ? final.awayTeamId : (final.pkHome! > final.pkAway! ? final.homeTeamId : final.awayTeamId));
                                const winner = teams.find(t => t.id === winnerId);
                                return (
                                    <div className="flex flex-col items-center">
                                        {winner?.logo ? <img src={winner.logo} className="w-16 h-16 object-contain drop-shadow-xl mb-2"/> : <div className={`w-12 h-12 rounded-full ${winner?.colors[0]} mb-2`}></div>}
                                        <div className="text-xl font-black text-white uppercase tracking-wider">{winner?.name}</div>
                                    </div>
                                )
                            })()}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={containerClass}>
            {/* Main Header */}
            {variant === 'modal' && (
                <div className="bg-[#252525] border-b border-[#333] p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        {competitionName.includes('Süper') ? <Star size={24} className="text-yellow-500"/> : <Trophy size={24} className="text-[#ff9f43]" />}
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
                    
                    {/* LEFT COLUMN: STANDINGS OR BRACKET (Col Span 4) */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col h-full overflow-hidden">
                        <div className="bg-[#252525] rounded border border-[#333] flex flex-col h-full">
                            <div className="p-3 border-b border-[#333]">
                                <SectionHeader title={isLeague ? "Puan Durumu" : "Turnuva Yolu"} />
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                {isLeague ? (
                                    <StandingsTable 
                                        teams={competitionTeams} 
                                        myTeamId={null} 
                                        fixtures={fixtures} 
                                        onTeamClick={onTeamClick} 
                                        compact={false} 
                                    />
                                ) : (
                                    renderBracket()
                                )}
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE COLUMN: FIXTURES (Col Span 5) */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col h-full overflow-hidden">
                        <div className="bg-[#252525] rounded border border-[#333] flex flex-col h-full">
                            <div className="p-3 border-b border-[#333]">
                                <SectionHeader 
                                    title={isKnockout ? "Maç Sonuçları" : "Fikstür"} 
                                    rightContent={
                                        isLeague && (
                                            <div className="flex items-center gap-4 text-white bg-[#111] px-3 py-1 rounded-full border border-[#444]">
                                                <button onClick={() => setViewWeek(Math.max(1, viewWeek - 1))} className="hover:text-[#ff9f43] transition"><ChevronLeft size={16}/></button>
                                                <span className="text-xs font-bold text-slate-200 w-16 text-center">{viewWeek}. HAFTA</span>
                                                <button onClick={() => setViewWeek(Math.min(34, viewWeek + 1))} className="hover:text-[#ff9f43] transition"><ChevronRight size={16}/></button>
                                            </div>
                                        )
                                    }
                                />
                                {isLeague && <div className="text-[10px] text-slate-500 font-bold mt-1 px-2">{weekFixtures.length > 0 ? getFormattedDate(weekFixtures[0].date).label : 'Maç Yok'}</div>}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                {weekFixtures.length === 0 ? (
                                    <div className="text-center text-slate-500 text-xs py-10">Bu hafta/turnuvada maç bulunmuyor.</div>
                                ) : (
                                    <div className="divide-y divide-[#333]">
                                        {weekFixtures.map(f => {
                                            const h = teams.find(t => t.id === f.homeTeamId);
                                            const a = teams.find(t => t.id === f.awayTeamId);
                                            
                                            // Determine Round Name for Knockouts
                                            let roundName = "";
                                            if (isKnockout) {
                                                if (f.week === 91 || f.competitionId === 'PLAYOFF_FINAL') roundName = "FİNAL";
                                                else if (f.week === 90 || f.competitionId === 'PLAYOFF') roundName = "YARI FİNAL";
                                                else roundName = `${f.week}. TUR`;
                                            }

                                            return (
                                                <div key={f.id} className="flex items-center justify-between py-3 px-4 hover:bg-[#333] group transition-colors relative">
                                                    {roundName && (
                                                        <div className="absolute left-2 top-1 text-[8px] text-slate-500 font-bold uppercase tracking-wider">{roundName}</div>
                                                    )}
                                                    
                                                    <div 
                                                        className="flex-1 text-right flex items-center justify-end gap-3 cursor-pointer group/team"
                                                        onClick={(e) => { e.stopPropagation(); if(h) onTeamClick(h.id); }}
                                                    >
                                                        <span className="text-sm font-bold text-slate-300 truncate group-hover/team:text-[#ff9f43] transition-colors">{h?.name}</span>
                                                        {h?.logo && <img src={h.logo} className="w-6 h-6 object-contain" />}
                                                    </div>
                                                    
                                                    <div className="px-4 text-center min-w-[80px] flex flex-col items-center">
                                                        {f.played ? (
                                                            <>
                                                                <span className="text-white font-mono font-black text-lg tracking-widest">{f.homeScore}-{f.awayScore}</span>
                                                                {f.pkHome !== undefined && (
                                                                    <span className="text-[9px] text-yellow-500 font-mono">P: {f.pkHome}-{f.pkAway}</span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-600 text-xs font-mono">-</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div 
                                                        className="flex-1 text-left flex items-center justify-start gap-3 cursor-pointer group/team"
                                                        onClick={(e) => { e.stopPropagation(); if(a) onTeamClick(a.id); }}
                                                    >
                                                        {a?.logo && <img src={a.logo} className="w-6 h-6 object-contain" />}
                                                        <span className="text-sm font-bold text-slate-300 truncate group-hover/team:text-[#ff9f43] transition-colors">{a?.name}</span>
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
                        
                        {/* 1. PAST WINNERS (League OR Super Cup) */}
                        {(isLeague || competitionId === 'SUPER_CUP') && (
                            <div className="bg-[#252525] rounded border border-[#333] p-0 shrink-0 h-1/3 flex flex-col">
                                <div className="p-3 border-b border-[#333]">
                                    <SectionHeader title="Geçmiş Şampiyonlar" />
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="divide-y divide-[#333]">
                                        {/* LEAGUE HISTORY */}
                                        {isLeague && pastWinners.length > 0 && pastWinners.map((h, i) => (
                                            <div key={i} className="flex justify-between items-center p-2 px-3 hover:bg-[#333] cursor-pointer" onClick={() => onTeamClick(h.team.id)}>
                                                <div className="text-xs text-[#ff9f43] font-mono font-bold w-16">{h.year}</div>
                                                <div className="flex-1 flex items-center gap-2">
                                                    {h.team.logo && <img src={h.team.logo} className="w-5 h-5 object-contain"/>}
                                                    <span className="text-xs font-bold text-white truncate">{h.team.name}</span>
                                                </div>
                                                <Trophy size={12} className="text-yellow-500"/>
                                            </div>
                                        ))}

                                        {/* SUPER CUP HISTORY */}
                                        {competitionId === 'SUPER_CUP' && PAST_SUPER_CUP_WINNERS.map((h, i) => {
                                            // Find matched team to get logo
                                            const teamObj = teams.find(t => t.name.includes(h.teamName) || t.name === h.teamName);
                                            return (
                                                <div key={i} className="flex justify-between items-center p-2 px-3 hover:bg-[#333] cursor-pointer" onClick={() => teamObj && onTeamClick(teamObj.id)}>
                                                    <div className="text-xs text-[#ff9f43] font-mono font-bold w-16">{h.year}</div>
                                                    <div className="flex-1 flex items-center gap-2">
                                                        {teamObj?.logo ? <img src={teamObj.logo} className="w-5 h-5 object-contain"/> : <div className={`w-5 h-5 rounded-full ${teamObj?.colors[0] || 'bg-gray-500'}`}></div>}
                                                        <span className="text-xs font-bold text-white truncate">{h.teamName}</span>
                                                    </div>
                                                    <Trophy size={12} className="text-yellow-500"/>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

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
                                                    <div className="text-xs font-bold text-white truncate group-hover:text-[#ff9f43] transition-colors">{p.name}</div>
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
