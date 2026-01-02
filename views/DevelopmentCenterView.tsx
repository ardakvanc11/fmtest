
import React, { useState } from 'react';
import { Player, IndividualTrainingType, Position, PlayerPersonality } from '../types';
import { INDIVIDUAL_PROGRAMS } from '../data/trainingData';
import PlayerFace from '../components/shared/PlayerFace';
import { Check, Info, TrendingUp, X, Flame, AlertTriangle, Clock } from 'lucide-react';

interface DevelopmentCenterViewProps {
    players: Player[];
    onAssignTraining: (playerId: string, type: IndividualTrainingType) => void;
}

// Turkish Translations for Stat Keys
const STAT_TRANSLATIONS: Record<string, string> = {
    finishing: 'Bitiricilik',
    composure: 'Soğukkanlılık',
    firstTouch: 'İlk Kontrol',
    passing: 'Pas',
    vision: 'Vizyon',
    decisions: 'Karar Alma',
    dribbling: 'Dripling',
    balance: 'Denge',
    acceleration: 'Hızlanma',
    concentration: 'Konsantrasyon',
    leadership: 'Liderlik',
    determination: 'Kararlılık',
    teamwork: 'Takım Oyunu',
    stamina: 'Dayanıklılık',
    naturalFitness: 'Vücut Zindeliği',
    pace: 'Hız',
    physical: 'Güç',
    aggression: 'Agresiflik',
    agility: 'Çeviklik',
    positioning: 'Pozisyon Alma',
    anticipation: 'Önsezi',
    marking: 'Markaj',
    tackling: 'Top Kapma',
    crossing: 'Orta Yapma',
    heading: 'Kafa Vuruşu',
    longShots: 'Uzaktan Şut',
    penalty: 'Penaltı',
    freeKick: 'Serbest Vuruş'
};

const DevelopmentCenterView: React.FC<DevelopmentCenterViewProps> = ({ players, onAssignTraining }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(players.length > 0 ? players[0].id : null);
    
    const selectedPlayer = players.find(p => p.id === selectedPlayerId);

    // Group programs by category
    const categories = ['TEKNİK', 'ZİHİNSEL', 'FİZİKSEL', 'KALECİ'];

    const handleAssign = (type: IndividualTrainingType) => {
        if (selectedPlayerId) {
            onAssignTraining(selectedPlayerId, type);
        }
    };

    // Determine estimated duration based on personality
    const getEstimatedDuration = (personality?: PlayerPersonality) => {
        if (personality === PlayerPersonality.HARDWORKING || personality === PlayerPersonality.AMBITIOUS) return 8;
        if (personality === PlayerPersonality.PROFESSIONAL) return 9;
        if (personality === PlayerPersonality.LAZY) return 12;
        return 10;
    };

    const duration = selectedPlayer ? getEstimatedDuration(selectedPlayer.personality) : 10;

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900 shrink-0">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <TrendingUp className="text-blue-500"/> Gelişim Merkezi
                </h2>
                <p className="text-slate-400 text-sm mt-1">Oyuncularınıza özel bireysel antrenman programları atayın. Her oyuncu sadece bir programa odaklanabilir.</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Player List */}
                <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50">
                    <div className="p-4 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase">Kadro Listesi</div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {players.map(p => {
                            const isSelected = p.id === selectedPlayerId;
                            const hasActive = !!p.activeTraining;
                            
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPlayerId(p.id)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left group ${isSelected ? 'bg-blue-900/30 border border-blue-500/50' : 'hover:bg-slate-800 border border-transparent'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                                        <PlayerFace player={p} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{p.name}</div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <span className="text-[10px] text-slate-500 font-bold bg-slate-800 px-1.5 rounded">{p.position}</span>
                                            {p.developmentFeedback && (
                                                <span className="text-[9px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded font-bold animate-pulse border border-green-800">
                                                    {p.developmentFeedback}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Programs */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#121519]">
                    {selectedPlayer ? (
                        <div className="max-w-5xl mx-auto">
                            <div className="flex items-center gap-6 mb-8 bg-slate-800 p-6 rounded-xl border border-slate-700">
                                <div className="w-20 h-20 rounded-full bg-slate-700 border-4 border-slate-600 overflow-hidden shrink-0">
                                    <PlayerFace player={selectedPlayer} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-2xl font-bold text-white">{selectedPlayer.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${selectedPlayer.personality === PlayerPersonality.HARDWORKING || selectedPlayer.personality === PlayerPersonality.AMBITIOUS ? 'border-green-500 text-green-400 bg-green-900/20' : selectedPlayer.personality === PlayerPersonality.LAZY ? 'border-red-500 text-red-400 bg-red-900/20' : 'border-slate-500 text-slate-400 bg-slate-800'}`}>
                                            {selectedPlayer.personality || 'Normal'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock size={12}/> Program Süresi: <span className="text-white font-bold">{duration} Hafta</span>
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-2">{selectedPlayer.position} • {selectedPlayer.age} Yaş</p>
                                    
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-500">Mevcut Program:</span>
                                        {selectedPlayer.activeTraining ? (
                                            <span className="text-green-400 font-bold bg-green-900/20 px-2 py-0.5 rounded border border-green-900/50">
                                                {selectedPlayer.activeTraining}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 italic">Yok</span>
                                        )}
                                        {selectedPlayer.developmentFeedback && (
                                            <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                                                <TrendingUp size={12}/> {selectedPlayer.developmentFeedback}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {categories.map(cat => {
                                    // Filter options relevant to player (e.g. GK only sees GK options)
                                    const options = INDIVIDUAL_PROGRAMS.filter(p => p.category === cat);
                                    
                                    // Logic to hide/show irrelevant categories
                                    if (selectedPlayer.position === Position.GK && cat !== 'KALECİ') return null;
                                    if (selectedPlayer.position !== Position.GK && cat === 'KALECİ') return null;
                                    if (options.length === 0) return null;

                                    return (
                                        <div key={cat}>
                                            <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b border-slate-800 pb-2">{cat}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {options.map(prog => {
                                                    const isActive = selectedPlayer.activeTraining === prog.id;
                                                    const isRecommended = prog.target.includes(selectedPlayer.position) || prog.target.includes('ALL');
                                                    
                                                    // Synergy Calculation
                                                    let synergy = 80;
                                                    if (prog.target.includes(selectedPlayer.position) || prog.target.includes('ALL')) {
                                                        synergy = 120;
                                                    }

                                                    // Personality Match
                                                    const isGoodFit = (selectedPlayer.personality === PlayerPersonality.HARDWORKING || selectedPlayer.personality === PlayerPersonality.AMBITIOUS);
                                                    const isBadFit = (selectedPlayer.personality === PlayerPersonality.LAZY);

                                                    return (
                                                        <div 
                                                            key={prog.id}
                                                            onClick={() => handleAssign(prog.id)}
                                                            className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px] ${isActive ? 'bg-blue-900/20 border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750'}`}
                                                        >
                                                            {isActive && (
                                                                <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                                                                    <Check size={16} />
                                                                </div>
                                                            )}
                                                            
                                                            {/* Synergy Badge */}
                                                            {!isActive && (
                                                                <div className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded border font-bold ${synergy >= 120 ? 'bg-green-900/30 text-green-400 border-green-600' : 'bg-orange-900/30 text-orange-400 border-orange-600'}`}>
                                                                    Verim: %{synergy}
                                                                </div>
                                                            )}

                                                            <div>
                                                                <h5 className={`font-bold text-lg mb-1 flex items-center gap-2 ${isActive ? 'text-blue-400' : 'text-slate-200'}`}>
                                                                    {prog.label}
                                                                    {/* Personality Icon */}
                                                                    {isGoodFit && (
                                                                        <span title="Bu oyuncu çalışmayı seviyor! Program daha hızlı bitebilir.">
                                                                            <Flame size={14} className="text-orange-500 fill-orange-500" />
                                                                        </span>
                                                                    )}
                                                                    {isBadFit && (
                                                                        <span title="Bu oyuncuya ağır gelebilir. Program uzayabilir.">
                                                                            <AlertTriangle size={14} className="text-yellow-500" />
                                                                        </span>
                                                                    )}
                                                                </h5>
                                                                
                                                                <div className="mt-3 space-y-2">
                                                                    <div>
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Geliştirilenler</span>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {prog.stats.map(s => (
                                                                                <span key={s} className="text-xs bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700 capitalize">
                                                                                    {STAT_TRANSLATIONS[s] || s}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs space-y-2">
                                                                <div className="flex gap-2">
                                                                    <span className="text-green-500 font-bold shrink-0">+</span>
                                                                    <span className="text-slate-400">{prog.pros[0]}</span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <span className="text-red-500 font-bold shrink-0">-</span>
                                                                    <span className="text-slate-400">{prog.cons[0]}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            <p>Lütfen soldaki listeden bir oyuncu seçin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DevelopmentCenterView;
