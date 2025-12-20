import React, { useState } from 'react';
import { Player, Team } from '../types';
import { Lock, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';

const TransferView = ({ transferList, team, budget, isWindowOpen, onBuy, onSell, onPlayerClick }: { transferList: Player[], team: Team, budget: number, isWindowOpen: boolean, onBuy: (p: Player) => void, onSell: (p: Player) => void, onPlayerClick: (p: Player) => void }) => {
    const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: 'value' | 'skill' | 'age' | 'name', direction: 'asc' | 'desc' }>({ key: 'value', direction: 'desc' });
    const itemsPerPage = 20;

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

    // Sorting Logic
    const handleSort = (key: 'value' | 'skill' | 'age' | 'name') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getSortedList = () => {
        const list = tab === 'BUY' ? [...transferList] : [...team.players];
        return list.sort((a, b) => {
            let valA: any = a[sortConfig.key];
            let valB: any = b[sortConfig.key];
            
            // Name comparison
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc' 
                    ? valA.localeCompare(valB) 
                    : valB.localeCompare(valA);
            }

            // Numeric comparison
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortedList = getSortedList();
    const totalPages = Math.ceil(sortedList.length / itemsPerPage);
    
    // Reset page when tab changes
    const handleTabChange = (t: 'BUY' | 'SELL') => {
        setTab(t);
        setCurrentPage(1);
    };

    // Pagination Logic
    const currentPlayers = sortedList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const SortHeader = ({ label, sKey }: { label: string, sKey: 'value' | 'skill' | 'age' | 'name' }) => (
        <button 
            onClick={() => handleSort(sKey)}
            className={`flex items-center gap-1 text-xs font-bold uppercase transition ${sortConfig.key === sKey ? 'text-yellow-600 dark:text-yellow-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
            {label} <ArrowUpDown size={12} className={sortConfig.key === sKey ? 'opacity-100' : 'opacity-50'}/>
        </button>
    );

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Top Controls */}
            <div className="flex flex-col md:flex-row gap-4 shrink-0">
                 <div className="flex gap-2 flex-1">
                     <button onClick={() => handleTabChange('BUY')} className={`flex-1 py-3 font-bold rounded-lg border transition-all ${tab === 'BUY' ? 'bg-green-600 border-green-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>TRANSFER LİSTESİ</button>
                     <button onClick={() => handleTabChange('SELL')} className={`flex-1 py-3 font-bold rounded-lg border transition-all ${tab === 'SELL' ? 'bg-red-600 border-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>OYUNCU SAT</button>
                 </div>
            </div>

            {/* Sort Bar */}
            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center px-6 shrink-0">
                <div className="flex items-center gap-2 text-slate-400 mr-4">
                    <Filter size={14} />
                    <span className="text-xs font-bold uppercase hidden md:inline">Sırala:</span>
                </div>
                <div className="flex-1 grid grid-cols-12 gap-4">
                    <div className="col-span-6 md:col-span-5"><SortHeader label="Oyuncu" sKey="name"/></div>
                    <div className="col-span-2 md:col-span-2 text-right md:text-left"><SortHeader label="Güç" sKey="skill"/></div>
                    <div className="col-span-4 md:col-span-5 flex justify-end"><SortHeader label="Değer" sKey="value"/></div>
                </div>
                <div className="w-20 hidden md:block"></div> {/* Spacer for button */}
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-4">
                 {currentPlayers.length === 0 && <div className="text-slate-500 text-center py-12 italic">Listede uygun oyuncu yok.</div>}
                 
                 {currentPlayers.map(p => (
                     <div key={p.id} className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm hover:shadow-md transition group">
                         <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => onPlayerClick(p)}>
                              {/* Small Face Preview */}
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-200 shrink-0 hidden sm:block">
                                  <PlayerFace player={p} />
                              </div>
                              <div className={`w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0 ${getPosBadgeColor(p.position)}`}>{p.position}</div>
                              <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{p.name}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                      <span>{p.age} Yaş</span>
                                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                      <span className="font-bold text-slate-700 dark:text-slate-300">{p.skill} Güç</span>
                                  </div>
                              </div>
                         </div>
                         <div className="flex items-center gap-4 pl-4 border-l border-slate-100 dark:border-slate-700/50">
                             <div className="text-right">
                                 <div className="text-[10px] text-slate-400 uppercase font-bold">Değer</div>
                                 <div className="text-green-600 dark:text-green-400 font-bold font-mono whitespace-nowrap">{p.value} M€</div>
                             </div>
                             {tab === 'BUY' ? (
                                 <button 
                                    disabled={budget < p.value} 
                                    onClick={() => onBuy(p)} 
                                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-xs md:text-sm shadow-sm whitespace-nowrap active:scale-95 transition-transform"
                                >
                                    AL
                                 </button>
                             ) : (
                                 <button 
                                    onClick={() => onSell(p)} 
                                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xs md:text-sm shadow-sm whitespace-nowrap active:scale-95 transition-transform"
                                >
                                    SAT
                                 </button>
                             )}
                         </div>
                     </div>
                 ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300"/>
                    </button>
                    
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 font-mono">
                        Sayfa {currentPage} / {totalPages}
                    </span>
                    
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight size={20} className="text-slate-600 dark:text-slate-300"/>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TransferView;