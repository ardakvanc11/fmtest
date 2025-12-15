
import React from 'react';
import { Fixture, Team } from '../types';
import { calculateOdds } from '../utils/gameEngine';
import { Trophy, Home, ChevronRight } from 'lucide-react';

const MatchPreview = ({ fixture, homeTeam, awayTeam, onProceed }: { fixture: Fixture, homeTeam: Team, awayTeam: Team, onProceed: () => void }) => {
    // Calculate odds on the fly
    const odds = calculateOdds(homeTeam, awayTeam);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Match Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-sm gap-8 md:gap-0">
                 <div className="flex flex-col items-center w-full md:w-1/3">
                     <img src={homeTeam.logo} className="w-24 h-24 md:w-32 md:h-32 object-contain mb-4" />
                     <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center">{homeTeam.name}</h2>
                     <div className="flex gap-2 mt-2 items-center text-yellow-600 dark:text-yellow-500 font-bold">
                        <Trophy size={20} className="fill-yellow-500"/>
                        <span className="text-lg">{homeTeam.championships}</span>
                     </div>
                 </div>
                 
                 <div className="flex flex-col items-center w-full md:w-1/3 order-first md:order-none">
                     <div className="text-3xl md:text-4xl font-bold text-slate-400 dark:text-slate-500 font-mono mb-2">VS</div>
                     <div className="bg-slate-100 dark:bg-slate-900 px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-center w-full max-w-xs">
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
                        <div className="text-slate-900 dark:text-white text-base md:text-lg font-bold tracking-wide text-center">{homeTeam.stadiumName}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">{homeTeam.stadiumCapacity.toLocaleString()} Kişilik</div>
                     </div>
                 </div>

                 <div className="flex flex-col items-center w-full md:w-1/3">
                     <img src={awayTeam.logo} className="w-24 h-24 md:w-32 md:h-32 object-contain mb-4" />
                     <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center">{awayTeam.name}</h2>
                     <div className="flex gap-2 mt-2 items-center text-yellow-600 dark:text-yellow-500 font-bold">
                        <Trophy size={20} className="fill-yellow-500"/>
                        <span className="text-lg">{awayTeam.championships}</span>
                     </div>
                 </div>
            </div>
            
            <div className="flex justify-center pb-6">
                <button onClick={onProceed} className="bg-green-600 hover:bg-green-500 text-white font-bold text-lg md:text-xl px-8 md:px-12 py-3 md:py-4 rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-3 w-full md:w-auto justify-center">
                    SOYUNMA ODASINA GİT <ChevronRight size={24}/>
                </button>
            </div>
        </div>
    );
};

export default MatchPreview;
