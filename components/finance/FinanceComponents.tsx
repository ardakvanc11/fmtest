
import React, { useState } from 'react';
import { SponsorDeal } from '../../types';
import { X, Briefcase } from 'lucide-react';

export const SPONSOR_OPTIONS = [
    { name: "CryptoBet", risk: "High", valueMult: 1.3, duration: 2 },
    { name: "Global Airlines", risk: "Low", valueMult: 1.0, duration: 4 },
    { name: "TechGiant Inc.", risk: "Medium", valueMult: 1.15, duration: 3 },
    { name: "Local Energy", risk: "Safe", valueMult: 0.9, duration: 5 },
    { name: "AutoMotors", risk: "Low", valueMult: 1.05, duration: 3 },
    { name: "FastFood Chain", risk: "Medium", valueMult: 1.1, duration: 2 }
];

export const formatMoney = (val: number) => `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M€`;

interface SponsorModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeType: 'main' | 'stadium' | 'sleeve' | null;
    currentValue: number;
    currentYear: number;
    onSelect: (option: typeof SPONSOR_OPTIONS[0]) => void;
}

export const SponsorNegotiationModal: React.FC<SponsorModalProps> = ({ isOpen, onClose, activeType, currentValue, currentYear, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 w-full max-w-2xl rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Briefcase className="text-yellow-500"/> Yeni Sponsor Anlaşması
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            {activeType === 'main' ? 'Ana Forma Sponsoru' : activeType === 'stadium' ? 'Stadyum İsim Hakkı' : 'Kol Sponsoru'} için teklifler
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SPONSOR_OPTIONS.map((opt, idx) => {
                        const offerVal = currentValue * opt.valueMult;
                        
                        return (
                            <button 
                                key={idx}
                                onClick={() => onSelect(opt)}
                                className="bg-slate-700 border border-slate-600 hover:border-yellow-500 hover:bg-slate-600 p-4 rounded-xl text-left transition group relative overflow-hidden"
                            >
                                <div className="relative z-10">
                                    <div className="text-lg font-bold text-white mb-1">{opt.name}</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-sm text-slate-400">Yıllık Teklif</div>
                                            <div className={`text-xl font-black font-mono ${opt.valueMult >= 1.1 ? 'text-green-400' : opt.valueMult < 1.0 ? 'text-yellow-400' : 'text-blue-400'}`}>
                                                {formatMoney(offerVal)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-slate-500 uppercase">Süre</div>
                                            <div className="text-white font-bold">{opt.duration} Yıl</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <span className="text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-600 text-slate-300">
                                            Risk: {opt.risk}
                                        </span>
                                    </div>
                                </div>
                                {opt.valueMult >= 1.2 && (
                                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                        FIRSAT
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
