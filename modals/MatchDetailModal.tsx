
import React from 'react';
import { Fixture, Team } from '../types';
import { X, Star, Users } from 'lucide-react';

const MatchDetailModal = ({ fixture, teams, onClose }: { fixture: Fixture, teams: Team[], onClose: () => void }) => {
    const home = teams.find(t => t.id === fixture.homeTeamId);
    const away = teams.find(t => t.id === fixture.awayTeamId);
    if(!home || !away || !fixture.stats) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white">MAÇ RAPORU</h2>
                     <button onClick={onClose}><X className="text-slate-400 hover:text-black dark:hover:text-white"/></button>
                 </div>
                 
                 <div className="p-8 bg-slate-100 dark:bg-slate-800 text-center flex justify-center items-center gap-8 shadow-md">
                     <div className="flex flex-col items-center gap-2">
                         <img src={home.logo} className="w-16 h-16 object-contain" />
                         <span className="font-bold text-xl text-slate-900 dark:text-white">{home.name}</span>
                     </div>
                     <div className="text-5xl font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-6 py-2 rounded shadow-inner">{fixture.homeScore} - {fixture.awayScore}</div>
                     <div className="flex flex-col items-center gap-2">
                         <img src={away.logo} className="w-16 h-16 object-contain" />
                         <span className="font-bold text-xl text-slate-900 dark:text-white">{away.name}</span>
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-8 bg-white dark:bg-slate-900">
                      <div>
                          <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4 border-b border-green-200 dark:border-green-900 pb-2">Goller & Asistler</h3>
                          <div className="space-y-2">
                              {fixture.matchEvents?.filter(e => e.type === 'GOAL').map((e, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-900 dark:text-white">
                                      <div className="font-mono text-slate-500 dark:text-slate-400">{e.minute}'</div>
                                      <div className="font-bold">{e.scorer}</div>
                                      <div className="text-slate-500 text-xs">Asist: {e.assist}</div>
                                      <div className="ml-auto text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{e.teamName}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                      <div>
                          <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mb-4 border-b border-yellow-200 dark:border-yellow-900 pb-2">Oyuncu Reytingleri</h3>
                          <div className="h-64 overflow-y-auto space-y-1">
                              {[...fixture.stats.homeRatings, ...fixture.stats.awayRatings].sort((a,b)=>b.rating-a.rating).map((p, i) => (
                                  <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-900 dark:text-white">
                                       <div>
                                           <span className="font-bold">{p.name}</span>
                                           <span className="text-xs ml-2 text-slate-500">{p.position}</span>
                                       </div>
                                       <div className={`font-bold ${p.rating >= 8 ? 'text-green-600 dark:text-green-400' : p.rating >= 6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{p.rating}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                 </div>
                 
                 <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-center">
                     <span className="text-slate-500 dark:text-slate-400">Maçın Adamı: </span>
                     <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg ml-2">{fixture.stats.mvpPlayerName}</span>
                 </div>
             </div>
        </div>
    );
};

export default MatchDetailModal;
