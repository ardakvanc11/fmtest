
import React from 'react';
import { Team } from '../types';
import TacticsView from './TacticsView';
import { FastForward, PlayCircle } from 'lucide-react';

const LockerRoomView = ({ team, setTeam, onStartMatch, onSimulateMatch }: { team: Team, setTeam: (t: Team) => void, onStartMatch: () => void, onSimulateMatch: () => void }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                 <div>
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white">SOYUNMA ODASI</h2>
                     <p className="text-slate-500 dark:text-slate-400 text-sm">Son taktik kontrollerini yap ve maça başla.</p>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={onSimulateMatch} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                         <FastForward size={24}/> SONUCU GÖSTER
                    </button>
                    <button onClick={onStartMatch} className="bg-red-600 hover:bg-red-500 text-white font-bold text-lg px-8 py-3 rounded-lg shadow-lg animate-pulse flex items-center gap-2">
                        <PlayCircle size={24}/> MAÇA BAŞLA
                    </button>
                 </div>
            </div>
            <div className="flex-1 overflow-hidden p-4">
                 <TacticsView team={team} setTeam={setTeam} />
            </div>
        </div>
    );
};

export default LockerRoomView;
