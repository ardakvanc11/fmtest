
import React, { useState, useMemo } from 'react';
import { Team, Player, Fixture, ManagerProfile, Position } from '../types';
import { ChevronLeft, Trophy, Users, Home, Star, DollarSign, BarChart3, Wallet, Globe, TrendingUp, TrendingDown, Landmark, Scale, Activity, Calendar, Goal, Zap, Disc, AlertCircle, ArrowRight, ArrowLeft, History, Archive, ArrowRightLeft, Coins, CheckCircle, Building2, User, Briefcase, School, HardHat, Target, Sparkles, UserPlus, FileSignature, Wallet2, Building, ToggleLeft, ToggleRight, Bug, LayoutTemplate } from 'lucide-react';
import SquadView from './SquadView';
import PlayerFace from '../components/shared/PlayerFace';
import PitchVisual from '../components/shared/PitchVisual';
import { calculateForm, calculateMonthlyNetFlow } from '../utils/teamCalculations';
import { isSameDay, getFormattedDate } from '../utils/calendarAndFixtures';
import { GAME_CALENDAR } from '../data/gameConstants';
import StandingsTable from '../components/shared/StandingsTable';

interface TeamDetailViewProps {
    team: Team;
    allTeams: Team[];
    fixtures: Fixture[];
    currentDate: string;
    currentWeek: number;
    manager: ManagerProfile;
    myTeamId: string;
    onClose: () => void;
    onPlayerClick: (p: Player) => void;
    onTeamClick: (id: string) => void;
    onBoardRequest?: (type: string, isDebug?: boolean) => void; 
    yearsAtClub?: number; 
    lastSeasonGoalAchieved?: boolean; 
    consecutiveFfpYears?: number; 
}

// --- HELPER COMPONENTS ---

const StatCard = ({ label, value, icon: Icon, subValue, colorClass = "" }: any) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <Icon size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <div>
            <div className={`text-xl md:text-2xl font-black ${colorClass || 'text-slate-900 dark:text-white'}`}>{value}</div>
            {subValue && <div className="text-[10px] text-slate-400 font-medium mt-0.5">{subValue}</div>}
        </div>
    </div>
);

const PlayerStatCard = ({ label, player, statValue, statLabel, icon: Icon, colorClass, onClick }: any) => {
    if (!player) return null;
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-yellow-500 transition-all group cursor-pointer" onClick={() => onClick(player)}>
            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-200 shrink-0 group-hover:scale-110 transition-transform">
                <PlayerFace player={player} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{player.name}</div>
            </div>
            <div className="text-right shrink-0">
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{statValue}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1 justify-end">
                    <Icon size={10} className={colorClass} /> {statLabel}
                </div>
            </div>
        </div>
    );
};

const CheckCircleIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const generateLeagueHistory = (team: Team) => {
    const history = [];
    const currentYear = 2024;
    const baseRank = Math.max(1, Math.min(18, Math.floor(19 - (team.strength / 100 * 18))));
    
    for(let i = 1; i <= 20; i++) {
        const year = `${currentYear - i}/${currentYear - i + 1}`;
        let rank = baseRank + Math.floor(Math.random() * 6) - 3;
        rank = Math.max(1, Math.min(18, rank));
        history.push({ year, rank });
    }
    return history;
};

// --- MAIN COMPONENT ---

const TeamDetailView = ({ team, allTeams, fixtures, currentDate, currentWeek, manager, myTeamId, onClose, onPlayerClick, onTeamClick, onBoardRequest, yearsAtClub = 0, lastSeasonGoalAchieved = false, consecutiveFfpYears = 0 }: TeamDetailViewProps) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'SQUAD' | 'FIXTURES' | 'TRANSFERS' | 'HISTORY' | 'MANAGEMENT' | 'TACTICS'>('GENERAL');

    // Filter teams based on the current league of the VIEWED team
    const currentLeagueId = team.leagueId || 'LEAGUE';
    const leagueTeams = allTeams.filter(t => t.leagueId === currentLeagueId || (!t.leagueId && currentLeagueId === 'LEAGUE'));

    const sortedTeams = [...leagueTeams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;
    
    const leagueName = currentLeagueId === 'LEAGUE_1' ? "Hayvanlar 1. Ligi" : "Süper Toto Ligi";

    const squadValue = team.players.reduce((sum, p) => sum + p.value, 0);
    const form = calculateForm(team.id, fixtures);
    const reputation = team.reputation || 1.0;
    const monthlyNet = calculateMonthlyNetFlow(team, fixtures, currentDate, manager);

    let financeStatus = "Dengeli";
    let financeColor = "text-yellow-600 dark:text-yellow-400";
    if (monthlyNet > 10) { financeStatus = "Zengin"; financeColor = "text-emerald-600 dark:text-emerald-400"; }
    else if (monthlyNet > 0) { financeStatus = "Güvende"; financeColor = "text-blue-600 dark:text-blue-400"; }
    else if (monthlyNet >= -5) { financeStatus = "Dengeli"; financeColor = "text-yellow-600 dark:text-yellow-400"; }
    else { financeStatus = "Riskli"; financeColor = "text-red-600 dark:text-red-400"; }

    const teamFixtures = fixtures
        .filter(f => f.homeTeamId === team.id || f.awayTeamId === team.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastMatches = teamFixtures.filter(f => f.played).reverse();
    const futureMatches = teamFixtures.filter(f => !f.played);

    const getTopPlayer = (players: Player[], sortFn: (a: Player, b: Player) => number) => [...players].sort(sortFn)[0];
    const topScorer = getTopPlayer(team.players, (a, b) => b.seasonStats.goals - a.seasonStats.goals);
    const topAssister = getTopPlayer(team.players, (a, b) => b.seasonStats.assists - a.seasonStats.assists);
    const topRating = getTopPlayer(team.players, (a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0));

    const transfers = useMemo(() => {
        const history = team.transferHistory || [];
        const arrivals = history.filter(t => t.type === 'BOUGHT').map(t => ({ date: t.date, name: t.playerName, from: t.counterparty, price: t.price }));
        const departures = history.filter(t => t.type === 'SOLD').map(t => ({ date: t.date, name: t.playerName, to: t.counterparty, price: t.price }));
        const totalSpent = arrivals.reduce((sum, item) => sum + (parseFloat(item.price.replace(' M€', '')) || 0), 0);
        const totalIncome = departures.reduce((sum, item) => sum + (parseFloat(item.price.replace(' M€', '')) || 0), 0);
        return { arrivals, departures, totalSpent, totalIncome, netBalance: totalIncome - totalSpent };
    }, [team.transferHistory]);
    
    const history = useMemo(() => {
        if (team.leagueHistory && team.leagueHistory.length > 0) return [...team.leagueHistory].reverse();
        return generateLeagueHistory(team);
    }, [team.id, team.leagueHistory]);

    const getRelativeTime = (matchDate: string) => {
        if (isSameDay(matchDate, currentDate)) return "Bugün";
        const diffTime = new Date(matchDate).getTime() - new Date(currentDate).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) return "Yarın";
        return `${diffDays} gün`;
    };

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600';
    };

    const tabs = [
        { id: 'GENERAL', label: 'Genel', icon: BarChart3 },
        { id: 'SQUAD', label: 'Oyuncular', icon: Users },
        { id: 'FIXTURES', label: 'Fikstür', icon: Calendar },
        { id: 'TRANSFERS', label: 'Transferler', icon: ArrowRightLeft },
        { id: 'TACTICS', label: 'Taktik', icon: LayoutTemplate },
        { id: 'MANAGEMENT', label: 'Yönetim', icon: Building2 },
        { id: 'HISTORY', label: 'Geçmiş', icon: History },
    ];

    // Request logic
    const canRequestStadium = yearsAtClub >= 3 && lastSeasonGoalAchieved && !team.boardRequests.stadiumBuilt;
    const canRequestTraining = (reputation - team.boardRequests.trainingLastRep) >= (0.4 * Math.pow(3, team.boardRequests.trainingUpgradesCount));
    const canRequestYouth = (reputation - team.boardRequests.youthLastRep) >= (0.3 * Math.pow(3, team.boardRequests.youthUpgradesCount));
    const canRequestBudget = manager.power > 65;
    const canRequestFfp = consecutiveFfpYears >= 2;
    const canRequestContract = lastSeasonGoalAchieved;

    // Display Championship Logic: Only Super League counts as "Major" championship in the header
    const displayChampionships = team.leagueId === 'LEAGUE_1' ? 0 : team.championships;

    return (
        <div className="h-full bg-slate-100 dark:bg-slate-900 overflow-y-auto custom-scrollbar flex flex-col">
            
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-30 shrink-0">
                <div className="max-w-7xl mx-auto px-2 flex items-center">
                    <button onClick={onClose} className="flex items-center gap-1 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors border-r border-slate-200 dark:border-slate-700 mr-2 shrink-0 group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs md:text-sm font-bold uppercase hidden sm:inline">Geri</span>
                    </button>
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2 flex-1">
                        {tabs.map((t) => {
                            const isActive = activeTab === t.id;
                            return (
                                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-2 px-4 md:px-6 py-3 text-sm md:text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap shrink-0 ${isActive ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/30'}`}>
                                    {isActive && <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-500 dark:bg-yellow-400 rounded-t-full shadow-[0_1px_8px_rgba(250,204,21,0.5)]"></div>}
                                    <t.icon size={18} className={`${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm relative z-20 shrink-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                            {team.logo ? <img src={team.logo} className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl relative z-10" alt={team.name} /> : <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full ${team.colors[0]} flex items-center justify-center text-4xl font-bold text-white relative z-10 border-4 border-white dark:border-slate-800`}>{team.name.charAt(0)}</div>}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 font-teko tracking-tight uppercase">{team.name}</h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-600 dark:text-slate-300">
                                <div className="flex gap-1.5 items-center font-bold text-yellow-600 dark:text-yellow-500">
                                    <Trophy size={18} className="fill-yellow-500"/>
                                    <span className="text-lg">{displayChampionships} Şampiyonluk</span>
                                </div>
                                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
                                <div className="flex gap-1.5 items-center"><Globe size={18} className="text-blue-500" /><span className="font-bold">Türkiye</span></div>
                                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
                                <div className="flex gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} size={18} className={`${i < Math.floor(reputation) ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300 dark:text-slate-700'}`} />))}<span className="ml-2 text-sm font-bold text-yellow-600 dark:text-yellow-500">{reputation.toFixed(1)}</span></div>
                            </div>
                        </div>
                        <div className="hidden lg:flex flex-col items-center justify-center p-6 bg-slate-900 dark:bg-black rounded-2xl border-b-4 border-yellow-500 shadow-xl min-w-[140px]"><div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Takım Gücü</div><div className="text-5xl font-black text-white font-teko leading-none">{Math.round(team.strength)}</div><div className="w-full h-1 bg-slate-800 mt-3 rounded-full overflow-hidden"><div className="bg-yellow-500 h-full" style={{width: `${team.strength}%`}}></div></div></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {activeTab === 'GENERAL' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <StatCard label="Lig Sıralaması" value={`${rank}.`} subValue={leagueName} icon={TrendingUp} colorClass={rank === 1 ? 'text-yellow-500' : rank <= 3 ? 'text-green-500' : ''}/>
                            <StatCard label="Banka Bakiyesi" value={`${team.budget.toFixed(1)} M€`} subValue="Kullanılabilir Bütçe" icon={Landmark} colorClass="text-emerald-600 dark:text-emerald-400" />
                            <StatCard label="Piyasa Değeri" value={`${squadValue.toFixed(1)} M€`} subValue="Kadro Toplamı" icon={Wallet} />
                            <StatCard label="Mali Durum" value={financeStatus} subValue="Aylık Net Akış" icon={Scale} colorClass={financeColor} />
                            <StatCard label="Form Durumu" value={<div className="flex gap-1 items-center justify-start h-full">{form.length > 0 ? form.map((r, i) => (<div key={i} className={`w-3 h-3 rounded-full ${r === 'W' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : r === 'D' ? 'bg-slate-400' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} title={r}></div>)) : <span className="text-sm font-normal text-slate-400">Veri yok</span>}</div>} subValue="Son 5 Maç" icon={Activity} />
                            <StatCard label="Stadyum" value={team.stadiumName} subValue={`${team.stadiumCapacity.toLocaleString()} Kapasite`} icon={Home} />
                            <StatCard label="Taraftar" value={`${(team.fanBase / 1000000).toFixed(1)}M`} subValue="Global Destekçi" icon={Users} colorClass="text-blue-600 dark:text-blue-400" />
                            <StatCard label="Galibiyet" value={team.stats.won} subValue="Bu Sezon" icon={CheckCircleIcon} colorClass="text-green-600" />
                            <StatCard label="Puan" value={team.stats.points} subValue="Toplam Puan" icon={Trophy} colorClass="text-yellow-600" />
                            <StatCard label="İtibar" value={`${reputation.toFixed(1)}/5.0`} subValue="Popülerlik" icon={Star} colorClass="text-yellow-500" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Users size={20} className="text-indigo-500" /> Öne Çıkan Oyuncular</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><PlayerStatCard label="Gol Kralı" player={topScorer} statValue={topScorer.seasonStats.goals} statLabel="Gol" icon={Goal} colorClass="text-green-500" onClick={onPlayerClick}/><PlayerStatCard label="Asist Kralı" player={topAssister} statValue={topAssister.seasonStats.assists} statLabel="Asist" icon={Zap} colorClass="text-blue-500" onClick={onPlayerClick}/><PlayerStatCard label="En Yüksek Reyting" player={topRating} statValue={topRating.seasonStats.averageRating || 0} statLabel="Reyting" icon={Star} colorClass="text-yellow-500" onClick={onPlayerClick}/></div></div>
                    </div>
                )}

                {activeTab === 'TACTICS' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><LayoutTemplate size={20} className="text-yellow-500" /> Oyun Karakteri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Diziliş</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">{team.formation}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Anlayış</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">{team.mentality}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pas Tarzı</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">{team.passing}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tempo</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">{team.tempo}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-[500px]">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Trophy className="text-yellow-500" size={20}/> Muhtemel Saha Dizilimi</h3>
                                </div>
                                <div className="flex-1 bg-slate-900 p-4">
                                    <PitchVisual 
                                        players={team.players} 
                                        onPlayerClick={onPlayerClick} 
                                        selectedPlayerId={null} 
                                        formation={team.formation} 
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-[500px]">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="text-indigo-500" size={20}/> Muhtemel İlk 11 Kadrosu</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 custom-scrollbar">
                                    {team.players.slice(0, 11).map((p, i) => (
                                        <div key={p.id} onClick={() => onPlayerClick(p)} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-200 shrink-0">
                                                    <PlayerFace player={p} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${getPosBadgeColor(p.position)}`}>{p.position}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-slate-900 dark:text-white">{p.skill}</div>
                                                <div className="text-[9px] uppercase text-slate-500">Güç</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'MANAGEMENT' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 border-4 border-slate-100 dark:border-slate-600 flex items-center justify-center shadow-lg"><User size={48} className="text-slate-600"/></div>
                                    <div className="mt-3 text-center"><div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kulüp Başkanı</div><div className="text-xl font-black text-slate-900 dark:text-white">{team.board.presidentName}</div></div>
                                </div>
                                {team.id === myTeamId && (
                                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-1 gap-6">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="text-sm font-black text-yellow-600 dark:text-yellow-500 uppercase flex items-center gap-2"><Sparkles size={18}/> Yönetim Talepleri</div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {[
                                                    { id: 'NEW_STADIUM', label: 'Yeni Stadyum İnşası', icon: Home, can: canRequestStadium, cond: '3 Yıl Görev & Hedef' },
                                                    { id: 'UPGRADE_TRAINING', label: 'Antrenman Geliştir', icon: Zap, can: canRequestTraining, cond: `+${(0.4 * Math.pow(3, team.boardRequests.trainingUpgradesCount)).toFixed(1)} İtibar` },
                                                    { id: 'UPGRADE_YOUTH', label: 'Altyapı Geliştir', icon: School, can: canRequestYouth, cond: `+${(0.3 * Math.pow(3, team.boardRequests.youthUpgradesCount)).toFixed(1)} İtibar` },
                                                    { id: 'INC_TRANSFER_BUDGET', label: 'Ek Transfer Bütçesi', icon: Wallet2, can: canRequestBudget, cond: 'Menajer Gücü > 65' },
                                                    { id: 'WAGE_PERCENTAGE', label: 'Maaş Bütçesi Artışı', icon: Coins, can: canRequestFfp, cond: '2 Yıl FFP Uyumu' },
                                                    { id: 'NEW_CONTRACT', label: 'Yeni Sözleşme Görüşmesi', icon: FileSignature, can: canRequestContract, cond: 'Hedef Gerçekleştirme' }
                                                ].map(req => (
                                                    <button 
                                                        key={req.id}
                                                        disabled={!req.can}
                                                        onClick={() => req.can && onBoardRequest && onBoardRequest(req.id)}
                                                        className={`p-4 rounded-lg border-2 text-left transition-all flex flex-col justify-between h-32 ${req.can ? 'bg-white dark:bg-slate-800 border-yellow-500/50 hover:border-yellow-500 shadow-md hover:scale-[1.02]' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'}`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <req.icon size={20} className={req.can ? 'text-yellow-600' : 'text-slate-400'}/>
                                                            {req.can && <CheckCircle className="text-green-500" size={16}/>}
                                                        </div>
                                                        <div>
                                                            <div className={`text-xs font-bold ${req.can ? 'text-slate-900 dark:text-white' : 'text-slate-50'}`}>{req.label}</div>
                                                            <div className="text-[10px] text-slate-400 mt-1 font-mono uppercase">{req.cond}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><HardHat size={80}/></div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/> Antrenman Tesisleri</h3>
                                <div className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">{team.facilities.trainingCenterName}</div>
                                <div className="flex items-center gap-2 mb-2"><div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${team.facilities.trainingLevel >= 18 ? 'bg-purple-500' : team.facilities.trainingLevel >= 14 ? 'bg-green-500' : team.facilities.trainingLevel >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${(team.facilities.trainingLevel / 20) * 100}%`}}></div></div><span className="text-xs font-mono font-bold text-slate-500">{team.facilities.trainingLevel}/20</span></div>
                                <div className="text-xs text-slate-400">{team.facilities.trainingLevel >= 18 ? 'Dünya Standartlarında' : team.facilities.trainingLevel >= 14 ? 'Üst Düzey' : team.facilities.trainingLevel >= 10 ? 'Yeterli' : 'Yetersiz'}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><School size={80}/></div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Briefcase size={16} className="text-blue-500"/> Altyapı Akademisi</h3>
                                <div className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">{team.facilities.youthAcademyName}</div>
                                <div className="flex items-center gap-2 mb-2"><div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${team.facilities.youthLevel >= 18 ? 'bg-purple-500' : team.facilities.youthLevel >= 14 ? 'bg-green-500' : team.facilities.youthLevel >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${(team.facilities.youthLevel / 20) * 100}%`}}></div></div><span className="text-xs font-mono font-bold text-slate-500">{team.facilities.youthLevel}/20</span></div>
                                <div className="text-xs text-slate-400">{team.facilities.youthLevel >= 18 ? 'Fabrika Gibi' : team.facilities.youthLevel >= 14 ? 'Verimli' : team.facilities.youthLevel >= 10 ? 'Ortalama' : 'Geliştirilmeli'}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Building size={80}/></div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Building2 size={16} className="text-green-500"/> Kurumsal Yapı</h3>
                                <div className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">Yönetim Binası & Ofisler</div>
                                <div className="flex items-center gap-2 mb-2"><div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${team.facilities.corporateLevel >= 18 ? 'bg-purple-500' : team.facilities.corporateLevel >= 14 ? 'bg-green-500' : team.facilities.corporateLevel >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${(team.facilities.corporateLevel / 20) * 100}%`}}></div></div><span className="text-xs font-mono font-bold text-slate-500">{team.facilities.corporateLevel}/20</span></div>
                                <div className="text-xs text-slate-400">{team.facilities.corporateLevel >= 18 ? 'Profesyonel' : team.facilities.corporateLevel >= 14 ? 'İyi Yönetilen' : 'Standart'}</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="text-indigo-500"/> Teknik Heyet</h3></div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {team.staff && team.staff.length > 0 ? team.staff.map((staff, i) => (<div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-lg">{staff.name.charAt(0)}</div><div><div className="font-bold text-slate-900 dark:text-white">{staff.name}</div><div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{staff.role}</div></div></div><div className="flex flex-col items-end"><div className={`font-black text-lg ${staff.rating >= 80 ? 'text-green-500' : staff.rating >= 60 ? 'text-yellow-500' : 'text-slate-500'}`}>{staff.rating}</div><div className="text-[10px] uppercase text-slate-400">Yetenek</div></div></div>)) : (<div className="p-8 text-center text-slate-500 italic">Personel verisi bulunamadı.</div>)}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'SQUAD' && (<div className="animate-in fade-in slide-in-from-bottom-2"><SquadView team={team} onPlayerClick={onPlayerClick} manager={manager} currentWeek={currentWeek} /></div>)}
                {activeTab === 'FIXTURES' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        {futureMatches.length > 0 && (<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"><div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"><h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="text-blue-500" size={20}/> Gelecek Maçlar</h3></div><div className="divide-y divide-slate-100 dark:divide-slate-700">{futureMatches.slice(0, 8).map(f => { const opponentId = f.homeTeamId === team.id ? f.awayTeamId : f.homeTeamId; const opponent = allTeams.find(t => t.id === opponentId); const isHome = f.homeTeamId === team.id; return (<div key={f.id} onClick={() => onTeamClick(opponentId)} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer"><div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isHome ? 'bg-green-600' : 'bg-red-600'}`}>{isHome ? 'EV' : 'DEP'}</div><div><div className="font-bold text-slate-900 dark:text-white">{opponent?.name}</div><div className="text-xs text-slate-500">{getFormattedDate(f.date).label} • {getRelativeTime(f.date)}</div></div></div><div className="text-sm font-mono text-slate-400">20:00</div></div>); })}</div></div>)}
                        {pastMatches.length > 0 && (<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"><div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"><h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><History className="text-slate-500" size={20}/> Sonuçlar</h3></div><div className="divide-y divide-slate-100 dark:divide-slate-700">{pastMatches.map(f => { const opponentId = f.homeTeamId === team.id ? f.awayTeamId : f.homeTeamId; const opponent = allTeams.find(t => t.id === opponentId); const isHome = f.homeTeamId === team.id; const myScore = isHome ? f.homeScore! : f.awayScore!; const oppScore = isHome ? f.awayScore! : f.homeScore!; let resColor = "bg-slate-500"; if (myScore > oppScore) resColor = "bg-green-600"; else if (myScore < oppScore) resColor = "bg-red-600"; else resColor = "bg-yellow-500"; return (<div key={f.id} onClick={() => onTeamClick(opponentId)} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer"><div className="flex items-center gap-4"><div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-white ${resColor}`}>{isHome ? `${f.homeScore}-${f.awayScore}` : `${f.awayScore}-${f.homeScore}`}</div><div><div className="font-bold text-slate-900 dark:text-white">{opponent?.name}</div><div className="text-xs text-slate-500">{getFormattedDate(f.date).label} • {isHome ? 'İç Saha' : 'Deplasman'}</div></div></div></div>); })}</div></div>)}
                    </div>
                )}

                {activeTab === 'TRANSFERS' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-800/30 flex items-center justify-between"><div><p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">Toplam Harcama</p><p className="text-2xl font-black text-red-700 dark:text-red-300 font-mono">-{transfers.totalSpent.toFixed(1)} M€</p></div><div className="p-2 bg-red-200 dark:bg-red-800 rounded-lg text-red-700 dark:text-red-200"><ArrowRight size={24}/></div></div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between"><div><p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Toplam Gelir</p><p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">+{transfers.totalIncome.toFixed(1)} M€</p></div><div className="p-2 bg-emerald-200 dark:bg-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-200"><ArrowLeft size={24}/></div></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"><div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between"><h3 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2"><ArrowRight className="bg-emerald-200 dark:bg-emerald-800 rounded-full p-1 w-6 h-6"/> Gelenler</h3><span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase">Bu Sezon</span></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 uppercase font-bold"><tr><th className="px-4 py-3">Tarih</th><th className="px-4 py-3">Oyuncu</th><th className="px-4 py-3">Geldiği Takım</th><th className="px-4 py-3 text-right">Bedel</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{transfers.arrivals.length === 0 ? (<tr><td colSpan={4} className="p-4 text-center text-slate-500 italic">Henüz gelen oyuncu yok.</td></tr>) : transfers.arrivals.map((t, i) => (<tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"><td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{t.date}</td><td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{t.name}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300 flex items-center gap-2"><ArrowLeft size={12} className="text-green-500"/> {t.from}</td><td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.price}</td></tr>))}</tbody></table></div></div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"><div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-800/30 flex items-center justify-between"><h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2"><ArrowRight className="bg-red-200 dark:bg-red-800 rounded-full p-1 w-6 h-6"/> Gidenler</h3><span className="text-xs font-bold text-red-600 dark:text-red-500 uppercase">Bu Sezon</span></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 uppercase font-bold"><tr><th className="px-4 py-3">Tarih</th><th className="px-4 py-3">Oyuncu</th><th className="px-4 py-3">Gittiği Takım</th><th className="px-4 py-3 text-right">Bedel</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{transfers.departures.length === 0 ? (<tr><td colSpan={4} className="p-4 text-center text-slate-500 italic">Henüz giden oyuncu yok.</td></tr>) : transfers.departures.map((t, i) => (<tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"><td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{t.date}</td><td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{t.name}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300 flex items-center gap-2"><ArrowRight size={12} className="text-red-500"/> {t.to}</td><td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.price}</td></tr>))}</tbody></table></div></div>
                        </div>
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-center border border-slate-700 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><Archive size={200} className="text-white"/></div>
                            <h3 className="text-xl font-bold text-yellow-500 uppercase tracking-widest mb-8 relative z-10 flex justify-center items-center gap-3"><Trophy size={24}/> Kulüp Müzesi</h3>
                            <div className="flex justify-center gap-12 flex-wrap relative z-10">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]"><Trophy size={48} className="text-yellow-400 fill-yellow-400"/></div>
                                    <div className="text-4xl font-black text-white">{team.championships}</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold tracking-wider">
                                        {team.leagueId === 'LEAGUE_1' ? '1. Lig Şampiyonluğu' : 'Şampiyonluk'}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-2"><div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"><Trophy size={48} className="text-blue-400 fill-blue-400"/></div><div className="text-4xl font-black text-white">{team.domesticCups || 0}</div><div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Türkiye Kupası</div></div>
                                <div className="flex flex-col items-center gap-2"><div className="w-24 h-24 bg-slate-500/10 rounded-full flex items-center justify-center border-2 border-slate-500 shadow-[0_0_20px_rgba(148,163,184,0.3)]"><Trophy size={48} className="text-slate-300 fill-slate-300"/></div><div className="text-4xl font-black text-white">{team.superCups || 0}</div><div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Süper Kupa</div></div>
                                <div className="flex flex-col items-center gap-2"><div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]"><Trophy size={48} className="text-purple-400 fill-purple-400"/></div><div className="text-4xl font-black text-white">{team.europeanCups || 0}</div><div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Avrupa Kupası</div></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"><div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"><h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><History className="text-slate-500" size={20}/> Lig Geçmişi</h3></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-100 dark:bg-slate-900 text-xs text-slate-500 uppercase font-bold"><tr><th className="px-6 py-3">Sezon</th><th className="px-6 py-3">Lig</th><th className="px-6 py-3 text-center">Sıralama</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{history.map((h, i) => (<tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition ${h.rank === 1 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}><td className="px-6 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{h.year}</td><td className="px-6 py-3 text-slate-600 dark:text-slate-400">{leagueName}</td><td className="px-6 py-3 text-center">{h.rank === 1 ? (<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold text-xs border border-yellow-200 dark:border-yellow-700"><Trophy size={10} className="fill-yellow-600"/> ŞAMPİYON</span>) : (<span className={`font-bold ${h.rank <= 4 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{h.rank}.</span>)}</td></tr>))}</tbody></table></div></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetailView;
