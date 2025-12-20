
import React from 'react';
import { Player, Position } from '../types';
import { ChevronLeft, Trophy, Activity, Heart, Shield, Swords, Zap, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';

interface PlayerDetailViewProps {
    player: Player;
    onClose: () => void;
}

const PlayerDetailView: React.FC<PlayerDetailViewProps> = ({ player, onClose }) => {
    
    // Helper colors based on attributes
    const getAttrColor = (val: number) => {
        if (val >= 90) return 'text-yellow-500 font-black'; // Elite
        if (val >= 80) return 'text-green-500 font-bold';   // Great
        if (val >= 70) return 'text-blue-500 font-bold';    // Good
        if (val >= 60) return 'text-slate-600 dark:text-slate-300 font-medium'; // Average
        return 'text-red-500'; // Poor
    };

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600';
    };

    const currentCondition = player.condition !== undefined ? player.condition : player.stats.stamina;

    // Attribute Card Component
    const AttributeRow = ({ label, value }: { label: string, value: number }) => (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{label}</span>
            <span className={`text-lg ${getAttrColor(value)}`}>{value}</span>
        </div>
    );

    return (
        <div className="h-full bg-slate-100 dark:bg-slate-900 overflow-y-auto custom-scrollbar flex flex-col">
            
            {/* Top Navigation Bar */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 px-4 py-3 flex items-center shadow-sm">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg font-bold text-sm"
                >
                    <ChevronLeft size={18} /> Geri Dön
                </button>
                <div className="ml-auto text-xs font-mono text-slate-400 uppercase">
                    Oyuncu Profili
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                
                {/* 1. HERO SECTION */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <Star size={300} />
                    </div>

                    <div className="flex flex-col md:flex-row">
                        {/* Left: Player Face (Big) */}
                        <div className="w-full md:w-1/3 bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 p-6 flex items-center justify-center relative overflow-hidden">
                            {/* Layered Face in Circular Container */}
                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-8 border-white dark:border-slate-900 shadow-2xl relative z-10 overflow-hidden bg-slate-200">
                                <PlayerFace player={player} className="scale-110 translate-y-2"/>
                            </div>
                            {/* Skill Badge */}
                            <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 bg-slate-900 text-white w-16 h-16 flex flex-col items-center justify-center rounded-lg shadow-lg border-2 border-yellow-500">
                                <span className="text-2xl font-black leading-none">{player.skill}</span>
                                <span className="text-[10px] font-bold text-slate-400">GENEL</span>
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded text-sm font-bold text-white shadow-sm ${getPosBadgeColor(player.position)}`}>
                                    {player.position}
                                </span>
                                {player.secondaryPosition && (
                                    <span className={`px-3 py-1 rounded text-sm font-bold text-white shadow-sm opacity-70 ${getPosBadgeColor(player.secondaryPosition)}`}>
                                        {player.secondaryPosition}
                                    </span>
                                )}
                                {player.injury && (
                                    <span className="px-3 py-1 rounded text-sm font-bold bg-red-100 text-red-600 flex items-center gap-1 animate-pulse">
                                        <Activity size={14}/> {player.injury.daysRemaining} Gün
                                    </span>
                                )}
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                                {player.name}
                            </h1>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                                <div>
                                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase mb-1">Uyruk</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{player.nationality}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase mb-1">Yaş</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{player.age}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase mb-1">Piyasa Değeri</div>
                                    <div className="font-bold text-green-600 dark:text-green-400 text-lg">{player.value} M€</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase mb-1">Moral</div>
                                    <div className="font-bold text-yellow-600 dark:text-yellow-500 text-lg">{player.morale}/100</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. STATS & PERFORMANCE GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* COL 1: Technical Stats */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                            <Swords className="text-blue-500"/> Teknik Özellikler
                        </h3>
                        <div className="space-y-1">
                            <AttributeRow label="Bitiricilik / Şut" value={player.stats.shooting} />
                            <AttributeRow label="Paslaşma" value={player.stats.passing} />
                            <AttributeRow label="Top Sürme" value={player.stats.dribbling} />
                            <AttributeRow label="Orta Yapma" value={player.stats.corners} /> 
                            <AttributeRow label={player.position === 'GK' ? 'Refleksler' : 'Teknik'} value={Math.floor((player.stats.dribbling + player.stats.passing)/2)} />
                        </div>
                    </div>

                    {/* COL 2: Physical & Mental Stats */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                            <Shield className="text-red-500"/> Fiziksel & Savunma
                        </h3>
                        <div className="space-y-1">
                            <AttributeRow label="Hız" value={player.stats.pace} />
                            <AttributeRow label="Güç" value={player.stats.physical} />
                            <AttributeRow label="Dayanıklılık" value={player.stats.stamina} />
                            <AttributeRow label="Savunma" value={player.stats.defending} />
                            <AttributeRow label="Kafa Vuruşu" value={player.stats.heading} />
                        </div>
                    </div>

                    {/* COL 3: Season Stats & Status */}
                    <div className="space-y-6">
                        {/* Season Stats */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                <TrendingUp className="text-green-500"/> Sezon İstatistikleri
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{player.seasonStats.goals}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Gol</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{player.seasonStats.assists}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Asist</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{player.seasonStats.matchesPlayed}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Maç</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-yellow-500/30">
                                    <div className="text-3xl font-black text-yellow-600 dark:text-yellow-500">{player.seasonStats.averageRating || '-'}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Ort. Puan</div>
                                </div>
                            </div>
                        </div>

                        {/* Current Status */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                <Activity className="text-purple-500"/> Anlık Durum
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1"><Heart size={14}/> Kondisyon</span>
                                        <span className={`text-sm font-bold ${currentCondition < 50 ? 'text-red-500' : 'text-green-500'}`}>{Math.round(currentCondition)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full ${currentCondition < 50 ? 'bg-red-500' : currentCondition < 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${currentCondition}%`}}></div>
                                    </div>
                                </div>

                                {player.injury && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-start gap-3">
                                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18}/>
                                        <div>
                                            <div className="text-sm font-bold text-red-700 dark:text-red-400">Sakatlık Raporu</div>
                                            <div className="text-xs text-red-600 dark:text-red-300 mt-1">{player.injury.type}</div>
                                            <div className="text-xs text-slate-500 mt-1">{player.injury.description}</div>
                                        </div>
                                    </div>
                                )}

                                {player.suspendedUntilWeek && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center gap-3">
                                        <div className="w-4 h-5 bg-red-600 rounded-[2px] border border-black/20"></div>
                                        <div>
                                            <div className="text-sm font-bold text-red-700 dark:text-red-400">Cezalı</div>
                                            <div className="text-xs text-red-600 dark:text-red-300">{player.suspendedUntilWeek}. Haftaya kadar oynayamaz.</div>
                                        </div>
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

export default PlayerDetailView;
