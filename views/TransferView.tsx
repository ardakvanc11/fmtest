

import React, { useState } from 'react';
import { Player, Team } from '../types';
import { Lock } from 'lucide-react';

const TransferView = ({ transferList, team, budget, isWindowOpen, onBuy, onSell, onPlayerClick }: { transferList: Player[], team: Team, budget: number, isWindowOpen: boolean, onBuy: (p: Player) => void, onSell: (p: Player) => void, onPlayerClick: (p: Player) => void }) => {
    const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');

    if (!isWindowOpen) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Lock size={64} className="text-slate-400 dark:text-slate-600 mb-4"/>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Transfer Dönemi Kapalı</h2>
                <p className="text-slate-500 dark:text-slate-400">Transfer sezonu dışında oyuncu alıp satamazsınız.</p>
            </div>
        );
    }

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600';
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 mb-4">
                 <button onClick={() => setTab('BUY')} className={`flex-1 py-3 font-bold rounded-lg border ${tab === 'BUY' ? 'bg-green-600 border-green-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>TRANSFER LİSTESİ</button>
                 <button onClick={() => setTab('SELL')} className={`flex-1 py-3 font-bold rounded-lg border ${tab === 'SELL' ? 'bg-red-600 border-red-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>OYUNCU SAT</button>
            </div>

            {tab === 'BUY' && (
                <div className="space-y-4">
                     {transferList.length === 0 && <div className="text-slate-500 text-center py-8">Listede uygun oyuncu yok.</div>}
                     {transferList.map(p => (
                         <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                             <div className="flex items-center gap-4 cursor-pointer" onClick={() => onPlayerClick(p)}>
                                  <div className={`w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white ${getPosBadgeColor(p.position)}`}>{p.position}</div>
                                  <div>
                                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">{p.age} Yaş • {p.skill} Güç</div>
                                  </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="text-right">
                                     <div className="text-xs text-slate-500 dark:text-slate-400">Değer</div>
                                     <div className="text-green-600 dark:text-green-400 font-bold">{p.value} M€</div>
                                 </div>
                                 <button disabled={budget < p.value} onClick={() => onBuy(p)} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold">SATIN AL</button>
                             </div>
                         </div>
                     ))}
                </div>
            )}

            {tab === 'SELL' && (
                <div className="space-y-4">
                     {team.players.map(p => (
                         <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                             <div className="flex items-center gap-4 cursor-pointer" onClick={() => onPlayerClick(p)}>
                                  <div className={`w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white ${getPosBadgeColor(p.position)}`}>{p.position}</div>
                                  <div>
                                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">{p.age} Yaş • {p.skill} Güç</div>
                                  </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="text-right">
                                     <div className="text-xs text-slate-500 dark:text-slate-400">Piyasa Değeri</div>
                                     <div className="text-green-600 dark:text-green-400 font-bold">{p.value} M€</div>
                                 </div>
                                 <button onClick={() => onSell(p)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold">SAT</button>
                             </div>
                         </div>
                     ))}
                </div>
            )}
        </div>
    );
};

export default TransferView;