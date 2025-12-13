
import React, { useState } from 'react';
import { Team, Player, Mentality, Tempo, TimeWasting, PassingStyle, Width, CreativeFreedom, FinalThird, Crossing, DefensiveLine, Tackling, PressingFocus } from '../types';
import PitchVisual from '../components/shared/PitchVisual';

const TacticsView = ({ team, setTeam, compact = false }: { team: Team, setTeam: (t: Team) => void, compact?: boolean }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [tab, setTab] = useState<'GENERAL' | 'ATTACK' | 'DEFENSE'>('GENERAL');

    const handlePlayerClick = (clickedPlayer: Player) => {
        if (!selectedPlayerId) { setSelectedPlayerId(clickedPlayer.id); } 
        else {
            if (selectedPlayerId === clickedPlayer.id) { setSelectedPlayerId(null); return; }
            const idx1 = team.players.findIndex(p => p.id === selectedPlayerId);
            const idx2 = team.players.findIndex(p => p.id === clickedPlayer.id);
            if (idx1 !== -1 && idx2 !== -1) {
                const newPlayers = [...team.players];
                [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]];
                setTeam({ ...team, players: newPlayers });
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
        <div className="flex flex-col h-full gap-6">
            {!compact && <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">İlk 11 ve Detaylı Taktik</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">Saha üzerindeki oyuncuya tıkla, sonra yedek kulübesinden oyuncu seç.</div>
            </div>}
            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <PitchVisual players={team.players} onPlayerClick={handlePlayerClick} selectedPlayerId={selectedPlayerId} />
                    <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase flex justify-between"><span>Yedek Kulübesi</span><span className="text-xs normal-case flex gap-4"><span>G: Gol</span><span>A: Asist</span><span>Ort: Puan</span></span></h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {team.players.slice(11).map((p) => (
                                <div key={p.id} onClick={() => handlePlayerClick(p)} className={`flex items-center justify-between p-3 rounded border cursor-pointer transition ${selectedPlayerId === p.id ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                    <div className="flex items-center gap-3"><span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${p.position === 'GK' ? 'bg-yellow-600' : p.position === 'DEF' ? 'bg-blue-600' : p.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>{p.position}</span><div className="flex flex-col"><span className={`text-sm font-bold ${selectedPlayerId === p.id ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>{p.name}</span><span className="text-xs text-slate-500 dark:text-slate-400">{p.age} Yaş</span></div></div>
                                    <div className="flex items-center gap-3"><div className="text-xs text-slate-500 dark:text-slate-300 text-right"><div className="text-green-600 dark:text-green-400">{p.seasonStats.goals}G {p.seasonStats.assists}A</div><div className="text-yellow-600 dark:text-yellow-500">{p.seasonStats.averageRating || '-'} Ort</div></div><div className="font-bold text-slate-900 dark:text-white text-lg">{p.skill}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className={`w-full ${compact ? 'lg:w-80' : 'lg:w-96'} space-y-4 overflow-y-auto`}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                            <button onClick={() => setTab('GENERAL')} className={`flex-1 py-3 text-sm font-bold ${tab === 'GENERAL' ? 'bg-yellow-500 dark:bg-yellow-600 text-black' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>Genel</button>
                            <button onClick={() => setTab('ATTACK')} className={`flex-1 py-3 text-sm font-bold ${tab === 'ATTACK' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>Hücum</button>
                            <button onClick={() => setTab('DEFENSE')} className={`flex-1 py-3 text-sm font-bold ${tab === 'DEFENSE' ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>Savunma</button>
                        </div>
                        <div className="p-4 space-y-4">
                            {tab === 'GENERAL' && <><TacticSelect label="Oyun Anlayışı" value={team.mentality} onChange={(v:any) => setTeam({...team, mentality: v})} options={Mentality} /><TacticSelect label="Oyun Temposu" value={team.tempo} onChange={(v:any) => setTeam({...team, tempo: v})} options={Tempo} /><TacticSelect label="Zaman Geçirme" value={team.timeWasting} onChange={(v:any) => setTeam({...team, timeWasting: v})} options={TimeWasting} /></>}
                            {tab === 'ATTACK' && <><TacticSelect label="Pas Şekli" value={team.passing} onChange={(v:any) => setTeam({...team, passing: v})} options={PassingStyle} /><TacticSelect label="Hücum Genişliği" value={team.width} onChange={(v:any) => setTeam({...team, width: v})} options={Width} /><TacticSelect label="Yaratıcılık" value={team.creative} onChange={(v:any) => setTeam({...team, creative: v})} options={CreativeFreedom} /><TacticSelect label="Son 3. Bölge" value={team.finalThird} onChange={(v:any) => setTeam({...team, finalThird: v})} options={FinalThird} /><TacticSelect label="Ortalar" value={team.crossing} onChange={(v:any) => setTeam({...team, crossing: v})} options={Crossing} /></>}
                            {tab === 'DEFENSE' && <><TacticSelect label="Savunma Hattı" value={team.defLine} onChange={(v:any) => setTeam({...team, defLine: v})} options={DefensiveLine} /><div className="bg-red-100 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-500/50 mb-4"><TacticSelect label="Topa Müdahale (Sertlik)" value={team.tackling} onChange={(v:any) => setTeam({...team, tackling: v})} options={Tackling} /><p className="text-[10px] text-red-600 dark:text-red-300 mt-1">Dikkat: Sert oyun kart ve penaltı riskini artırır!</p></div><TacticSelect label="Pres Odağı" value={team.pressFocus} onChange={(v:any) => setTeam({...team, pressFocus: v})} options={PressingFocus} /></>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TacticsView;
