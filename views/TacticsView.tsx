
import React, { useState } from 'react';
import { Team, Player, Mentality, Tempo, TimeWasting, PassingStyle, Width, CreativeFreedom, FinalThird, Crossing, DefensiveLine, Tackling, PressingFocus } from '../types';
import PitchVisual from '../components/shared/PitchVisual';
import { Syringe, Ban } from 'lucide-react';

interface PlayerListItemProps {
    p: Player;
    selectedPlayerId: string | null;
    forcedSubstitutionPlayerId: string | null | undefined;
    currentWeek?: number;
    onPlayerClick: (p: Player) => void;
}

const PlayerListItem = ({ p, selectedPlayerId, forcedSubstitutionPlayerId, currentWeek, onPlayerClick }: PlayerListItemProps) => {
    const isSuspended = p.suspendedUntilWeek && currentWeek && p.suspendedUntilWeek > currentWeek;
    const isForcedInjury = forcedSubstitutionPlayerId === p.id;
    
    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600'; 
    };

    return (
        <div onClick={() => onPlayerClick(p)} className={`flex items-center justify-between p-2 rounded border cursor-pointer transition mb-2 ${selectedPlayerId === p.id ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500' : isForcedInjury ? 'bg-red-100 dark:bg-red-900/30 border-red-500 animate-pulse' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'} ${(p.injury || isSuspended) && !isForcedInjury ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex flex-col gap-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0 w-8 text-center ${getPosBadgeColor(p.position)}`}>{p.position}</span>
                    {p.secondaryPosition && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded text-white shrink-0 w-8 text-center opacity-70 ${getPosBadgeColor(p.secondaryPosition)}`}>{p.secondaryPosition}</span>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold flex items-center gap-1 truncate ${selectedPlayerId === p.id ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
                        {p.name}
                        {(p.injury || isForcedInjury) && <Syringe size={12} className="text-red-500 animate-pulse shrink-0"/>}
                        {isSuspended && <Ban size={12} className="text-red-600 shrink-0"/>}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {p.age} Yaş 
                        {p.injury ? ` • ${p.injury.weeksRemaining} Hf Sakat` : ''}
                        {isForcedInjury ? ' • SAKATLANDI!' : ''}
                        {isSuspended ? ' • CEZALI' : ''}
                    </span>
                </div>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm pl-2">{p.skill}</div>
        </div>
    );
};

interface TacticsViewProps {
    team: Team;
    setTeam: (t: Team) => void;
    compact?: boolean;
    isMatchActive?: boolean;
    subsUsed?: number;
    maxSubs?: number;
    onSubstitution?: (inPlayer: Player, outPlayer: Player) => void;
    currentMinute?: number;
    currentWeek?: number;
    forcedSubstitutionPlayerId?: string | null;
}

const TacticsView = ({ 
    team, 
    setTeam, 
    compact = false,
    isMatchActive = false,
    subsUsed = 0,
    maxSubs = 5,
    onSubstitution,
    currentMinute,
    currentWeek,
    forcedSubstitutionPlayerId
}: TacticsViewProps) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [tab, setTab] = useState<'GENERAL' | 'ATTACK' | 'DEFENSE'>('GENERAL');

    const handlePlayerClick = (clickedPlayer: Player) => {
        // Allow selection of any player, logic comes when swapping
        
        if (!selectedPlayerId) { 
            setSelectedPlayerId(clickedPlayer.id); 
        } else {
            if (selectedPlayerId === clickedPlayer.id) { 
                setSelectedPlayerId(null); 
                return; 
            }
            
            const idx1 = team.players.findIndex(p => p.id === selectedPlayerId);
            const idx2 = team.players.findIndex(p => p.id === clickedPlayer.id);
            
            if (idx1 !== -1 && idx2 !== -1) {
                const p1 = team.players[idx1];
                const p2 = team.players[idx2];

                // SUBSTITUTION LOGIC DURING MATCH
                if (isMatchActive) {
                    // Match Active: Can only swap if one is on pitch (0-10) and one is on bench (11-17)
                    // Reserves (18+) cannot be used in match
                    const isPitch1 = idx1 < 11;
                    const isPitch2 = idx2 < 11;
                    const isBench1 = idx1 >= 11 && idx1 < 18;
                    const isBench2 = idx2 >= 11 && idx2 < 18;

                    if ((isPitch1 && isBench2) || (isPitch2 && isBench1)) {
                        // Valid Sub
                        if (subsUsed >= maxSubs) {
                            alert(`Değişiklik hakkınız doldu! (Max: ${maxSubs})`);
                            setSelectedPlayerId(null);
                            return;
                        }
                        
                        const pitchPlayer = isPitch1 ? team.players[idx1] : team.players[idx2];
                        const benchPlayer = isPitch1 ? team.players[idx2] : team.players[idx1];

                        // Morale Penalty for First Half Substitution
                        if (currentMinute !== undefined && currentMinute <= 45 && !forcedSubstitutionPlayerId) {
                            pitchPlayer.morale = Math.max(0, pitchPlayer.morale - 15);
                            alert(`${pitchPlayer.name} ilk yarıda oyundan alındığı için tepkili! (Moral -15)`);
                        }

                        if (onSubstitution) {
                            onSubstitution(benchPlayer, pitchPlayer);
                        }
                        
                        const newPlayers = [...team.players];
                        [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]];
                        setTeam({ ...team, players: newPlayers });

                    } else if (isPitch1 && isPitch2) {
                        // Positional Swap on Pitch - Allowed
                        const newPlayers = [...team.players];
                        [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]];
                        setTeam({ ...team, players: newPlayers });
                    } else {
                        // Invalid Sub (Bench to Bench, or involving Reserves during match)
                        if (idx1 >= 18 || idx2 >= 18) {
                            alert("Maç sırasında kadro dışı oyuncularla işlem yapamazsınız.");
                        }
                    }
                } else {
                    // PRE-MATCH: SWAP LOGIC (With Rules)
                    
                    const isTargetActive = idx2 < 18;
                    const isSourceActive = idx1 < 18;
                    
                    // 1. Suspension Check
                    // Moving P1 (who is suspended) TO Active Squad
                    if (isTargetActive && p1.suspendedUntilWeek && currentWeek && p1.suspendedUntilWeek > currentWeek) {
                        alert(`UYARI: ${p1.name} kırmızı kart cezalısı! Kadroya alamazsınız.`);
                        setSelectedPlayerId(null);
                        return;
                    }
                    // Moving P2 (who is suspended) TO Active Squad
                    if (isSourceActive && p2.suspendedUntilWeek && currentWeek && p2.suspendedUntilWeek > currentWeek) {
                        alert(`UYARI: ${p2.name} kırmızı kart cezalısı! Kadroya alamazsınız.`);
                        setSelectedPlayerId(null);
                        return;
                    }

                    // 2. Injury Check
                    if (isTargetActive && p1.injury && p1.injury.weeksRemaining > 0) {
                         alert(`UYARI: ${p1.name} sakat (${p1.injury.weeksRemaining} hafta). Kadroya alamazsınız.`);
                         setSelectedPlayerId(null);
                         return;
                    }
                    if (isSourceActive && p2.injury && p2.injury.weeksRemaining > 0) {
                         alert(`UYARI: ${p2.name} sakat (${p2.injury.weeksRemaining} hafta). Kadroya alamazsınız.`);
                         setSelectedPlayerId(null);
                         return;
                    }

                    const newPlayers = [...team.players];
                    [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]];
                    setTeam({ ...team, players: newPlayers });
                }
            }
            setSelectedPlayerId(null);
        }
    };

    const TacticSelect = ({ label, value, onChange, options }: any) => (
        <div className="mb-4">
            <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block mb-2">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded border border-slate-300 dark:border-slate-600 focus:border-yellow-500 text-sm outline-none">
                {Object.values(options).map((t: any) => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-4 pb-20 md:pb-0">
            {!compact && <div className="flex items-center justify-between shrink-0">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">İlk 11 ve Taktik</h3>
                {isMatchActive ? (
                    <div className="text-xs md:text-sm font-bold bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded text-slate-800 dark:text-white">
                        Değişiklik: <span className={`${subsUsed >= maxSubs ? 'text-red-500' : 'text-green-500'}`}>{subsUsed}</span>/{maxSubs}
                    </div>
                ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">Oyuncuya tıkla, sonra listeden seç.</div>
                )}
            </div>}
            
            {/* 
               Responsive Layout Fix: 
               Default: Column (Stacked)
               Landscape (Mobile Horizontal): Row (Side by Side)
               LG (Desktop): Row (Side by Side)
            */}
            <div className="flex flex-col landscape:flex-row lg:flex-row gap-4 h-full overflow-hidden">
                
                {/* PITCH AREA */}
                <div className="flex-none w-full landscape:w-1/2 lg:w-1/2 h-auto landscape:h-full lg:h-full lg:overflow-y-auto flex items-center justify-center">
                    <PitchVisual players={team.players} onPlayerClick={handlePlayerClick} selectedPlayerId={selectedPlayerId} />
                </div>

                {/* RIGHT SIDEBAR (Taktikler + Liste) */}
                <div className="flex-1 w-full landscape:w-1/2 lg:w-1/2 flex flex-col gap-4 overflow-hidden min-h-[300px]">
                    
                    {/* TACTICS TABS */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm shrink-0">
                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                            <button onClick={() => setTab('GENERAL')} className={`flex-1 py-2 text-xs font-bold ${tab === 'GENERAL' ? 'bg-yellow-500 dark:bg-yellow-600 text-black' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>Genel</button>
                            <button onClick={() => setTab('ATTACK')} className={`flex-1 py-2 text-xs font-bold ${tab === 'ATTACK' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>Hücum</button>
                            <button onClick={() => setTab('DEFENSE')} className={`flex-1 py-2 text-xs font-bold ${tab === 'DEFENSE' ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>Savunma</button>
                        </div>
                        <div className="p-4 space-y-4 max-h-40 md:max-h-48 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-800">
                            {tab === 'GENERAL' && <><TacticSelect label="Oyun Anlayışı" value={team.mentality} onChange={(v:any) => setTeam({...team, mentality: v})} options={Mentality} /><TacticSelect label="Oyun Temposu" value={team.tempo} onChange={(v:any) => setTeam({...team, tempo: v})} options={Tempo} /><TacticSelect label="Zaman Geçirme" value={team.timeWasting} onChange={(v:any) => setTeam({...team, timeWasting: v})} options={TimeWasting} /></>}
                            {tab === 'ATTACK' && <><TacticSelect label="Pas Şekli" value={team.passing} onChange={(v:any) => setTeam({...team, passing: v})} options={PassingStyle} /><TacticSelect label="Hücum Genişliği" value={team.width} onChange={(v:any) => setTeam({...team, width: v})} options={Width} /><TacticSelect label="Yaratıcılık" value={team.creative} onChange={(v:any) => setTeam({...team, creative: v})} options={CreativeFreedom} /><TacticSelect label="Son 3. Bölge" value={team.finalThird} onChange={(v:any) => setTeam({...team, finalThird: v})} options={FinalThird} /><TacticSelect label="Ortalar" value={team.crossing} onChange={(v:any) => setTeam({...team, crossing: v})} options={Crossing} /></>}
                            {tab === 'DEFENSE' && <><TacticSelect label="Savunma Hattı" value={team.defLine} onChange={(v:any) => setTeam({...team, defLine: v})} options={DefensiveLine} /><div className="bg-red-100 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-500/50 mb-4"><TacticSelect label="Topa Müdahale (Sertlik)" value={team.tackling} onChange={(v:any) => setTeam({...team, tackling: v})} options={Tackling} /><p className="text-[10px] text-red-600 dark:text-red-300 mt-1">Dikkat: Sert oyun kart ve penaltı riskini artırır!</p></div><TacticSelect label="Pres Odağı" value={team.pressFocus} onChange={(v:any) => setTeam({...team, pressFocus: v})} options={PressingFocus} /></>}
                        </div>
                    </div>

                    {/* BENCH & RESERVES LISTS */}
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm custom-scrollbar min-h-[200px]">
                        {/* Substitutes */}
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase border-b border-blue-100 dark:border-blue-900 pb-1">Yedek Kulübesi (7 Kişi)</h4>
                        <div className="mb-4">
                            {team.players.slice(11, 18).map(p => 
                                <PlayerListItem 
                                    key={p.id} 
                                    p={p} 
                                    selectedPlayerId={selectedPlayerId} 
                                    forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} 
                                    currentWeek={currentWeek} 
                                    onPlayerClick={handlePlayerClick} 
                                />
                            )}
                        </div>

                        {/* Reserves */}
                        {!isMatchActive && (
                            <>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">Kadro Dışı (Rezerv)</h4>
                                <div>
                                    {team.players.slice(18).length > 0 ? (
                                        team.players.slice(18).map(p => 
                                            <PlayerListItem 
                                                key={p.id} 
                                                p={p} 
                                                selectedPlayerId={selectedPlayerId} 
                                                forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} 
                                                currentWeek={currentWeek} 
                                                onPlayerClick={handlePlayerClick} 
                                            />
                                        )
                                    ) : (
                                        <div className="text-xs text-slate-400 italic p-2">Rezerv oyuncu yok.</div>
                                    )}
                                </div>
                            </>
                        )}
                        
                        {/* Pitch Players (For easy selection in forced sub scenario) */}
                        {isMatchActive && forcedSubstitutionPlayerId && (
                             <>
                                <h4 className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 uppercase border-b border-red-200 dark:border-red-900 pb-1 mt-4">Saha İçi</h4>
                                <div className="mb-4">
                                    {team.players.slice(0, 11).map(p => 
                                        <PlayerListItem 
                                            key={p.id} 
                                            p={p} 
                                            selectedPlayerId={selectedPlayerId} 
                                            forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} 
                                            currentWeek={currentWeek} 
                                            onPlayerClick={handlePlayerClick} 
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TacticsView;
