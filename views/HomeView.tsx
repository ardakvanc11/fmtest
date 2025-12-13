
import React, { useState } from 'react';
import { ManagerProfile, Team, Fixture } from '../types';
import { calculateForm } from '../utils/gameEngine';
import { Home, User, FileText, Heart, History, Calendar, Star, Feather } from 'lucide-react';
import StandingsTable from '../components/shared/StandingsTable';

const HomeView = ({ manager, team, teams, myTeamId, currentWeek, fixtures, onTeamClick }: { manager: ManagerProfile, team: Team, teams: Team[], myTeamId: string, currentWeek: number, fixtures: Fixture[], onTeamClick: (id: string) => void }) => {
    const [tab, setTab] = useState('GENERAL');
    
    // Calculate stats
    const nextMatch = fixtures.find(f => f.week === currentWeek && (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId));
    const opponent = nextMatch ? teams.find(t => t.id === (nextMatch.homeTeamId === myTeamId ? nextMatch.awayTeamId : nextMatch.homeTeamId)) : null;

    // Match Calendar Logic
    const myFixtures = fixtures
        .filter(f => f.homeTeamId === myTeamId || f.awayTeamId === myTeamId)
        .sort((a, b) => a.week - b.week);
    
    // Past 2 matches (played, reverse order for most recent first)
    const pastMatches = myFixtures.filter(f => f.played).slice(-2).reverse();
    // Next 4 matches (not played)
    const futureMatches = myFixtures.filter(f => !f.played).slice(0, 4);

    // Calculate Ranking
    const sortedTeams = [...teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;

    // Calculate Form
    const form = calculateForm(team.id, fixtures);

    const getMatchResult = (f: Fixture) => {
        const isHome = f.homeTeamId === myTeamId;
        const myScore = isHome ? f.homeScore! : f.awayScore!;
        const oppScore = isHome ? f.awayScore! : f.homeScore!;
        if (myScore > oppScore) return { label: 'G', color: 'bg-green-600 text-white' };
        if (myScore < oppScore) return { label: 'M', color: 'bg-red-600 text-white' };
        return { label: 'B', color: 'bg-slate-500 text-white' };
    };

    const tabs = [
        { id: 'GENERAL', label: 'Ana Sayfa', icon: Home },
        { id: 'PROFILE', label: 'Profilim', icon: User },
        { id: 'CONTRACT', label: 'Sözleşmem', icon: FileText },
        { id: 'RELATIONS', label: 'İlişkiler', icon: Heart },
        { id: 'HISTORY', label: 'Geçmişim', icon: History },
    ];

    return (
        <div className="space-y-6">
            {/* New Tabs Style */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/50 px-2 overflow-x-auto">
                {tabs.map((t) => {
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap ${
                                isActive 
                                ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/30'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-500 dark:bg-yellow-400 rounded-t-full shadow-[0_1px_8px_rgba(250,204,21,0.5)]"></div>
                            )}
                            <t.icon size={18} className={`${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {tab === 'GENERAL' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Takım Durumu</h2>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Takım Gücü</div>
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{Math.round(team.strength)}</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Taraftar</div>
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{(team.fanBase/1000000).toFixed(1)}M</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Moral</div>
                                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">%{team.morale}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Sıralama</div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{rank}.</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Puan</div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{team.stats.points}</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Form</div>
                                    <div className="flex justify-center gap-1 mt-3">
                                        {form.length > 0 ? form.map((r, i) => (
                                            <span key={i} className={`w-3 h-3 rounded-full ${r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-slate-400' : 'bg-red-500'}`}></span>
                                        )) : <span className="text-slate-500 text-sm">-</span>}
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sonraki Maç</h2>
                            {opponent ? (
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition" onClick={() => onTeamClick(opponent.id)}>
                                    <div className="flex items-center gap-3">
                                        {opponent.logo && <img src={opponent.logo} className="w-12 h-12 object-contain" />}
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">{opponent.name}</span>
                                    </div>
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">{nextMatch?.homeTeamId === myTeamId ? 'İç Saha' : 'Deplasman'}</span>
                                </div>
                            ) : <div className="p-4 text-slate-500">Bay Haftası</div>}
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        {/* MATCH CALENDAR BLOCK */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="text-yellow-600 dark:text-yellow-500" size={20}/> Maç Takvimi
                            </h2>
                            
                            {/* Last Matches */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Son Sonuçlar</h3>
                                <div className="space-y-2">
                                    {pastMatches.length === 0 && <div className="text-slate-500 text-sm italic">Henüz maç oynanmadı.</div>}
                                    {pastMatches.map(f => {
                                        const isHome = f.homeTeamId === myTeamId;
                                        const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
                                        const opp = teams.find(t => t.id === opponentId);
                                        const res = getMatchResult(f);
                                        
                                        return (
                                            <div key={f.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 transition cursor-pointer" onClick={() => onTeamClick(opponentId)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${res.color}`}>
                                                        {res.label}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{opp?.name}</span>
                                                        <span className="text--[10px] text-slate-500 dark:text-slate-400">{isHome ? 'İç Saha' : 'Deplasman'}</span>
                                                    </div>
                                                </div>
                                                <div className="font-mono font-bold text-lg text-slate-700 dark:text-slate-200">
                                                    {f.homeScore} - {f.awayScore}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Next Matches */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Gelecek Maçlar</h3>
                                <div className="space-y-2">
                                    {futureMatches.length === 0 && <div className="text-slate-500 text-sm italic">Sezon tamamlandı.</div>}
                                    {futureMatches.map(f => {
                                        const isHome = f.homeTeamId === myTeamId;
                                        const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
                                        const opp = teams.find(t => t.id === opponentId);
                                        
                                        return (
                                            <div key={f.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 transition cursor-pointer" onClick={() => onTeamClick(opponentId)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 text-center bg-white dark:bg-slate-800 rounded py-1 border border-slate-200 dark:border-slate-700">
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">{f.week}.</span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Hf</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {opp?.logo && <img src={opp.logo} className="w-5 h-5 object-contain"/>}
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{opp?.name}</span>
                                                    </div>
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded border ${isHome ? 'border-green-600/30 text-green-600 dark:text-green-400' : 'border-red-600/30 text-red-600 dark:text-red-400'}`}>
                                                    {isHome ? 'EV' : 'DEP'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Standings Table */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Puan Durumu</h2>
                            <StandingsTable teams={teams} myTeamId={myTeamId} compact onTeamClick={onTeamClick}/>
                        </div>
                    </div>
                </div>
            )}
            
             {tab === 'PROFILE' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-yellow-500">
                            <User size={48} className="text-slate-400"/>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{manager.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{manager.nationality} • {manager.age} Yaşında</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-yellow-600 dark:text-yellow-500 font-bold text-xl">Güç Seviyesi: {Math.round(manager.power)}</span>
                                <Star className="fill-yellow-600 dark:fill-yellow-500 text-yellow-600 dark:text-yellow-500" size={20}/>
                            </div>
                        </div>
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Kariyer Özeti</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">1</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Kulüp</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{manager.stats.trophies}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Kupa</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{manager.stats.wins}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Galibiyet</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-slate-600 dark:text-slate-300">{manager.stats.draws}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Beraberlik</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{manager.stats.losses}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Mağlubiyet</div>
                        </div>
                        
                         <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsFor}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Atılan Gol</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsAgainst}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Yenilen Gol</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{manager.stats.playersBought}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Transfer (Alınan)</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{manager.stats.playersSold}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Transfer (Satılan)</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-xl font-bold text-slate-900 dark:text-white">{manager.stats.recordTransferFee} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Rekor Transfer</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg col-span-2">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{manager.stats.moneySpent.toFixed(1)} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Toplam Harcanan</div>
                        </div>
                         <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg col-span-3">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{manager.stats.moneyEarned.toFixed(1)} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Toplam Gelir</div>
                        </div>
                     </div>
                 </div>
            )}

            {tab === 'CONTRACT' && (
                <div className="flex justify-center items-center h-full p-4">
                    <div className="bg-white text-slate-900 p-8 rounded shadow-2xl max-w-xl w-full relative border border-slate-200">
                        {/* Header */}
                        <div className="text-center border-b-2 border-slate-100 pb-4 mb-6 relative">
                            <h2 className="text-2xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                                Profesyonel Teknik Direktör<br/>Sözleşmesi
                            </h2>
                            <div className="absolute top-0 right-0 opacity-10">
                                <Feather size={48} className="text-slate-900" />
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4 font-serif text-lg mb-12 px-2">
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Kulüp:</span>
                                <span className="text-slate-900 font-bold">{manager.contract.teamName}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Teknik Direktör:</span>
                                <span className="text-slate-900 font-bold">{manager.name}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Yıllık Ücret:</span>
                                <span className="font-bold text-green-700 font-mono text-xl">{manager.contract.salary} M€</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Bitiş Tarihi:</span>
                                <span className="text-slate-900 font-bold">Haziran {manager.contract.expires}</span>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between items-end mt-12 px-6 relative pb-6">
                            {/* Club Sig */}
                            <div className="text-center relative z-10 w-32">
                                <div className="font-bold text-blue-900 text-lg mb-1 font-serif italic">
                                    {manager.contract.teamName} Yk.
                                </div>
                                <div className="border-t border-slate-400 w-full mx-auto pt-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">KULÜP BAŞKANI</p>
                                </div>
                            </div>
                            
                            {/* Stamp */}
                            <div className="absolute left-1/2 bottom-6 transform -translate-x-1/2 -rotate-12 opacity-90 z-0">
                                <div className="w-28 h-28 rounded-full border-[3px] border-red-800 flex items-center justify-center p-1">
                                    <div className="w-full h-full rounded-full border border-red-800 flex items-center justify-center text-center">
                                        <div className="transform rotate-0">
                                            <span className="text-red-800 font-bold text-[10px] uppercase block mb-1">T.C. SPOR BAKANLIĞI</span>
                                            <span className="text-red-800 font-bold text-sm uppercase leading-tight block">RESMİ<br/>MÜHÜR</span>
                                            <span className="text-red-800 text-[8px] uppercase block mt-1">ONAYLANMIŞTIR</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Manager Sig */}
                            <div className="text-center relative z-10 w-32">
                                <div className="font-serif italic text-blue-900 text-xl mb-1 signature-font">
                                    {manager.name.toLowerCase()}
                                </div>
                                <div className="border-t border-slate-400 w-full mx-auto pt-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TEKNİK DİREKTÖR</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'RELATIONS' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Genel Güven</h2>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400">Yönetim</span><span className="font-bold">{manager.trust.board}%</span></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${manager.trust.board}%`}}/></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400">Taraftar</span><span className="font-bold">{manager.trust.fans}%</span></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{width: `${manager.trust.fans}%`}}/></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400">Oyuncular</span><span className="font-bold">{manager.trust.players}%</span></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-yellow-500" style={{width: `${manager.trust.players}%`}}/></div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400">Hakemler Birliği</span><span className="font-bold">{manager.trust.referees}%</span></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{width: `${manager.trust.referees}%`}}/></div>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
            
            {tab === 'HISTORY' && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Detaylı Kariyer Geçmişi</h2>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">1</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Kulüp</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{manager.stats.trophies}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Kupa</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{manager.stats.wins}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Galibiyet</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-slate-600 dark:text-slate-300">{manager.stats.draws}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Beraberlik</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{manager.stats.losses}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Mağlubiyet</div>
                        </div>
                        
                         <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsFor}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Atılan Gol</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsAgainst}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Yenilen Gol</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{manager.stats.playersBought}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Transfer (Alınan)</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{manager.stats.playersSold}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Transfer (Satılan)</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-xl font-bold text-slate-900 dark:text-white">{manager.stats.recordTransferFee} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Rekor Transfer</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg col-span-2">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{manager.stats.moneySpent.toFixed(1)} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Toplam Harcanan</div>
                        </div>
                         <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg col-span-3">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{manager.stats.moneyEarned.toFixed(1)} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Toplam Gelir</div>
                        </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default HomeView;
