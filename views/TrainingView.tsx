
import React from 'react';
import { Check, Swords, Shield, Dumbbell } from 'lucide-react';

const TrainingView = ({ onTrain, performed }: { onTrain: (type: 'ATTACK' | 'DEFENSE' | 'PHYSICAL') => void, performed: boolean }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Haftalık Antrenman</h2>
            {performed ? (
                <div className="bg-green-100 dark:bg-green-900/50 border border-green-500 p-8 rounded-xl text-center">
                    <Check size={48} className="mx-auto text-green-600 dark:text-green-400 mb-4"/>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Antrenman Tamamlandı</h3>
                    <p className="text-slate-500 dark:text-slate-300 mt-2">Oyuncular dinlenmeye çekildi.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                    <button onClick={() => onTrain('ATTACK')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 p-8 rounded-xl flex flex-col items-center transition group shadow-sm">
                        <Swords size={48} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform"/>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hücum Çalışması</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">Şut, Bitiricilik ve Pas özelliklerini geliştirir.</p>
                    </button>
                    <button onClick={() => onTrain('DEFENSE')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 p-8 rounded-xl flex flex-col items-center transition group shadow-sm">
                        <Shield size={48} className="text-red-500 mb-4 group-hover:scale-110 transition-transform"/>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Savunma Çalışması</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">Savunma, Kafa ve Güç özelliklerini geliştirir.</p>
                    </button>
                    <button onClick={() => onTrain('PHYSICAL')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 p-8 rounded-xl flex flex-col items-center transition group shadow-sm">
                        <Dumbbell size={48} className="text-yellow-500 mb-4 group-hover:scale-110 transition-transform"/>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Fiziksel Yükleme</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">Hız, Dayanıklılık ve Kondisyon yüklemesi.</p>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TrainingView;
