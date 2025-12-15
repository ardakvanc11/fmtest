
import React from 'react';
import { Team, Player } from '../types';
import { ChevronLeft, Trophy, Users, Home, MapPin } from 'lucide-react';
import SquadView from './SquadView';

const TeamDetailView = ({ team, onClose, onPlayerClick }: { team: Team, onClose: () => void, onPlayerClick: (p: Player) => void }) => {
    return (
        <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
             <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-black dark:hover:text-white" onClick={onClose}>
                 <ChevronLeft size={20} /> Geri Dön
             </div>
             <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
                 <div className="flex items-center gap-6">
                     <img src={team.logo} className="w-32 h-32 object-contain" />
                     <div>
                         <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{team.name}</h2>
                         <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 mb-4">
                             <div className="flex gap-1 items-center font-bold text-yellow-600 dark:text-yellow-500"><Trophy size={16} className="fill-yellow-500"/> {team.championships} Şampiyonluk</div>
                             <div className="flex gap-1 items-center"><Users size={16} /> {(team.fanBase / 1000000).toFixed(1)}M Taraftar</div>
                             <div className="flex gap-1 items-center"><Home size={16} /> {team.stadiumName}</div>
                             <div className="flex gap-1 items-center"><MapPin size={16} /> {team.stadiumCapacity.toLocaleString()} Kapasite</div>
                         </div>
                         <div className="grid grid-cols-4 gap-4 bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                             <div className="text-center">
                                 <div className="text-xs text-slate-500 dark:text-slate-400">GÜÇ</div>
                                 <div className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(team.strength)}</div>
                             </div>
                             <div className="text-center">
                                 <div className="text-xs text-slate-500 dark:text-slate-400">PİYASA DEĞERİ</div>
                                 <div className="text-2xl font-bold text-green-600 dark:text-green-400">{team.players.reduce((a,b)=>a+b.value,0).toFixed(1)} M€</div>
                             </div>
                             <div className="text-center">
                                 <div className="text-xs text-slate-500 dark:text-slate-400">FORM</div>
                                 <div className="text-xl font-bold text-slate-900 dark:text-white flex justify-center gap-1">
                                     <span className="text-green-600 dark:text-green-400">{team.stats.won}G</span>
                                     <span className="text-slate-600 dark:text-slate-300">{team.stats.drawn}B</span>
                                     <span className="text-red-600 dark:text-red-400">{team.stats.lost}M</span>
                                 </div>
                             </div>
                              <div className="text-center">
                                 <div className="text-xs text-slate-500 dark:text-slate-400">PUAN</div>
                                 <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{team.stats.points}</div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
             
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Takım Kadrosu</h3>
             <SquadView team={team} onPlayerClick={onPlayerClick} />
        </div>
    );
};

export default TeamDetailView;
