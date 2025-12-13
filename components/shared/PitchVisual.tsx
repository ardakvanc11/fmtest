
import React from 'react';
import { Player } from '../../types';
import { Syringe } from 'lucide-react';

interface PitchVisualProps {
    players: Player[];
    onPlayerClick: (p: Player) => void;
    selectedPlayerId: string | null;
}

const PitchVisual = ({ players, onPlayerClick, selectedPlayerId }: PitchVisualProps) => {
    const positions = [
        { left: '50%', bottom: '5%' }, { left: '20%', bottom: '25%' }, { left: '40%', bottom: '25%' }, { left: '60%', bottom: '25%' }, { left: '80%', bottom: '25%' },
        { left: '20%', bottom: '55%' }, { left: '40%', bottom: '55%' }, { left: '60%', bottom: '55%' }, { left: '80%', bottom: '55%' }, { left: '35%', bottom: '82%' }, { left: '65%', bottom: '82%' }
    ];

    return (
        <div className="relative w-full aspect-[2/3] md:aspect-[4/3] bg-green-800 rounded-xl overflow-hidden border-4 border-slate-300 dark:border-slate-700 shadow-inner">
             <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-0 left-1/4 right-1/4 h-32 border-b-2 border-l-2 border-r-2 border-white"></div>
                <div className="absolute bottom-0 left-1/4 right-1/4 h-32 border-t-2 border-l-2 border-r-2 border-white"></div>
             </div>
             {players.slice(0, 11).map((p, i) => (
                 <div key={p.id} onClick={() => onPlayerClick(p)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-200 hover:scale-110 z-10 ${selectedPlayerId === p.id ? 'scale-125' : ''}`}
                    style={{ left: positions[i]?.left || '50%', bottom: positions[i]?.bottom || '50%' }}
                 >
                     <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg ${selectedPlayerId === p.id ? 'bg-yellow-500 text-black border-white animate-pulse' : 'bg-white dark:bg-slate-900 text-black dark:text-white border-slate-400'}`}>{p.skill}</div>
                     <div className={`mt-1 text-[10px] px-2 py-0.5 rounded bg-black/60 text-white font-bold whitespace-nowrap ${selectedPlayerId === p.id ? 'text-yellow-400' : ''}`}>
                         {p.name.split(' ').pop()} <span className={`ml-1 text-[9px] ${p.position === 'GK' ? 'text-yellow-400' : p.position === 'DEF' ? 'text-blue-400' : p.position === 'MID' ? 'text-green-400' : 'text-red-400'}`}>{p.position}</span>
                     </div>
                     {p.injury && <Syringe size={12} className="text-red-500 absolute -top-1 -right-1 bg-black rounded-full"/>}
                     {p.suspendedUntilWeek && <div className="w-3 h-4 bg-red-600 border border-white absolute -top-2 -right-2 rounded-sm"/>}
                 </div>
             ))}
        </div>
    );
};

export default PitchVisual;
