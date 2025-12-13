
import React from 'react';
import { Fixture, Team } from '../types';
import { calculateOdds } from '../utils/gameEngine';
import { Star, Home, ChevronRight } from 'lucide-react';

const MatchPreview = ({ fixture, homeTeam, awayTeam, onProceed }: { fixture: Fixture, homeTeam: Team, awayTeam: Team, onProceed: () => void }) => {
    // Calculate odds on the fly
    const odds = calculateOdds(homeTeam, awayTeam);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Match Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 flex items-center justify-between shadow-sm">
                 <div className="flex flex-col items-center w-1/3">
                     <img src={homeTeam.logo} className="w-32 h-32 object-contain mb-4" />
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">{homeTeam.name}</h2>
                     <div className="flex gap-1 mt-2">{[...Array(homeTeam.stars)].map((_,i)=><Star key={i} size={16} className="fill-yellow-500 text-yellow-500"/>)}</div>
                 </div>
                 
                 <div className="flex flex-col items-center w-1/3">
                     <div className="text-4xl font-bold text-slate-400 dark:text-slate-500 font-mono mb-2">VS</div>
                     <div className="bg-slate-100 dark:bg-slate-900 px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-center w-full">
                         <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">Bahis Oranları</div>
                         <div className="flex justify-between font-mono font-bold">
                             <span className="text-green-600 dark:text-green-400">{odds.home}</span>
                             <span className="text-slate-600 dark:text-slate-300">{odds.draw}</span>
                             <span className="text-red-600 dark:text-red-400">{odds.away}</span>
                         </div>
                     </div>
                     <div className="mt-4 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 uppercase font-bold tracking-widest mb-1">
                            <Home size={14} /> Stadyum
                        </div>
                        <div className="text-slate-900 dark:text-white text-lg font-bold tracking-wide">{homeTeam.stadiumName}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">{homeTeam.stadiumCapacity.toLocaleString()} Kişilik</div>
                     </div>
                 </div>

                 <div className="flex flex-col items-center w-1/3">
                     <img src={awayTeam.logo} className="w-32 h-32 object-contain mb-4" />
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">{awayTeam.name}</h2>
                     <div className="flex gap-1 mt-2">{[...Array(awayTeam.stars)].map((_,i)=><Star key={i} size={16} className="fill-yellow-500 text-yellow-500"/>)}</div>
                 </div>
            </div>
            
            <div className="flex justify-center">
                <button onClick={onProceed} className="bg-green-600 hover:bg-green-500 text-white font-bold text-xl px-12 py-4 rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-3">
                    SOYUNMA ODASINA GİT <ChevronRight size={24}/>
                </button>
            </div>
        </div>
    );
};

export default MatchPreview;
