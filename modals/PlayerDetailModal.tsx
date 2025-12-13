
import React from 'react';
import { Player } from '../types';
import { X } from 'lucide-react';

const PlayerDetailModal = ({ player, onClose }: { player: Player, onClose: () => void }) => {
    if (!player) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className={`w-20 h-20 rounded-lg flex items-center justify-center text-3xl font-bold text-white shadow-inner ${player.position === 'GK' ? 'bg-yellow-600' : player.position === 'DEF' ? 'bg-blue-600' : player.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {player.position}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{player.name}</h2>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                <span>{player.nationality}</span> • <span>{player.age} Yaşında</span>
                            </div>
                            <div className="mt-2 flex gap-3">
                                <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs text-green-700 dark:text-green-400 font-mono">Değer: {player.value} M€</span>
                                <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs text-yellow-700 dark:text-yellow-400">Moral: {player.morale}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition text-slate-500 dark:text-slate-400"><X size={24}/></button>
                </div>
                
                <div className="p-6 grid grid-cols-2 gap-8 text-slate-900 dark:text-white">
                    <div className="space-y-3">
                        <h4 className="text-yellow-600 dark:text-yellow-500 font-bold uppercase text-sm border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">Fiziksel & Mental</h4>
                        <div className="flex justify-between text-sm"><span>Hız</span><span className="font-bold">{player.stats.pace}</span></div>
                        <div className="flex justify-between text-sm"><span>Güç</span><span className="font-bold">{player.stats.physical}</span></div>
                        <div className="flex justify-between text-sm"><span>Dayanıklılık</span><span className="font-bold">{player.stats.stamina}</span></div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-blue-600 dark:text-blue-500 font-bold uppercase text-sm border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">Teknik</h4>
                         <div className="flex justify-between text-sm"><span>Şut / Bitiricilik</span><span className="font-bold">{player.stats.shooting}</span></div>
                        <div className="flex justify-between text-sm"><span>Pas</span><span className="font-bold">{player.stats.passing}</span></div>
                        <div className="flex justify-between text-sm"><span>Top Sürme</span><span className="font-bold">{player.stats.dribbling}</span></div>
                        <div className="flex justify-between text-sm"><span>Savunma</span><span className="font-bold">{player.stats.defending}</span></div>
                    </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-xs text-slate-500">Sezon İstatistikleri: {player.seasonStats.goals} Gol, {player.seasonStats.assists} Asist</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{player.skill} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">GENEL</span></div>
                </div>
            </div>
        </div>
    );
};

export default PlayerDetailModal;
