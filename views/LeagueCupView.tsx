
import React, { useMemo, useState } from 'react';
import { Team, Fixture, Player } from '../types';
import { Trophy, Globe, Shield, Star, Calendar, Eye } from 'lucide-react';
import { getFormattedDate } from '../utils/calendarAndFixtures';
import CompetitionDetailModal from '../modals/CompetitionDetailModal';

interface LeagueCupViewProps {
    teams: Team[];
    fixtures: Fixture[];
    myTeamId: string;
    currentWeek: number;
    currentDate: string;
    onTeamClick: (id: string) => void;
    onFixtureClick: (f: Fixture) => void;
    myTeam: Team;
}

const COMPETITIONS = [
    { 
        id: 'LEAGUE', 
        name: 'TÜRKİYE HAYVANLAR LİGİ', 
        icon: Trophy, 
        headerColor: 'bg-[#d11515]', // Specific Red from image
        start: new Date(2025, 7, 8),
        shortName: 'Hayvanlar Ligi'
    },
    { 
        id: 'CUP', 
        name: 'HAYVANLAR KUPASI', 
        icon: Shield, 
        headerColor: 'bg-[#d11515]', 
        start: new Date(2025, 9, 20),
        shortName: 'Hayvanlar Kupası'
    },
    { 
        id: 'SUPER_CUP', 
        name: 'HAYVANLAR SÜPER KUPASI', 
        icon: Star, 
        headerColor: 'bg-[#d11515]', 
        start: new Date(2025, 7, 1),
        shortName: 'Süper Kupa'
    },
    { 
        id: 'EUROPE', 
        name: 'AVRUPA HAYVANLAR LİGİ', 
        icon: Globe, 
        headerColor: 'bg-[#1e3a8a]', // UEFA Blue
        start: new Date(2025, 8, 15),
        shortName: 'Avrupa Ligi'
    }
];

const LeagueCupView: React.FC<LeagueCupViewProps> = ({ teams, fixtures, myTeamId, currentWeek, currentDate, myTeam, onTeamClick }) => {
    const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
    
    // Sort teams for rank calculation
    const sortedTeams = [...teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const currentLeagueRank = sortedTeams.findIndex(t => t.id === myTeamId) + 1;

    const getDaysRemaining = (targetDate: Date) => {
        const today = new Date(currentDate);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getBoardExpectation = (compId: string, strength: number) => {
        if (compId === 'LEAGUE') {
            return strength >= 80 ? 'Hayvanlar Ligi Şampiyonluğu' : strength >= 75 ? 'Avrupa Kupalarına Katılım' : 'Ligde Kalmak';
        } else if (compId === 'CUP') {
            return strength >= 75 ? 'Final Oynamak' : 'Çeyrek Final (Minimum)';
        } else if (compId === 'EUROPE') {
            return strength >= 80 ? 'Yarı Final (Minimum)' : 'Gruplara Kalmak';
        } else {
            return strength >= 80 ? 'Kupayı Kazanmak' : 'Önemsiz';
        }
    };

    const getPerformance = (compId: string) => {
        if (compId === 'LEAGUE') {
            // Rank 1 = 100%, Rank 18 = 0% roughly
            const score = Math.max(10, 100 - ((currentLeagueRank - 1) * 5));
            return score;
        }
        return 50; // Mock for cups not started
    };

    const selectedComp = COMPETITIONS.find(c => c.id === selectedCompId);

    // Dummy click handler for players inside modal
    const handlePlayerClick = (p: Player) => {
        console.log("Player clicked in modal", p.name);
    };

    // If a competition is selected, render it embedded within this view container
    if (selectedComp) {
        return (
            <CompetitionDetailModal 
                competitionId={selectedComp.id}
                competitionName={selectedComp.name}
                teams={teams}
                fixtures={fixtures}
                currentWeek={currentWeek}
                onClose={() => setSelectedCompId(null)}
                onTeamClick={onTeamClick}
                onPlayerClick={handlePlayerClick}
                variant="embedded"
            />
        );
    }

    return (
        <div className="h-full bg-[#1a1f26] p-4 overflow-y-auto custom-scrollbar relative">
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full min-h-[600px]">
                {COMPETITIONS.map((comp) => {
                    const daysLeft = getDaysRemaining(comp.start);
                    const hasStarted = daysLeft <= 0;
                    const expectation = getBoardExpectation(comp.id, myTeam.strength);
                    const performance = getPerformance(comp.id);
                    const formattedDate = getFormattedDate(comp.start.toISOString()).label;

                    return (
                        <div key={comp.id} className="flex flex-col bg-[#1e242b] rounded-lg overflow-hidden border border-slate-700 shadow-xl h-full transition hover:border-slate-500">
                            {/* Header */}
                            <div className={`${comp.headerColor} p-4 flex items-center gap-3 border-b border-black/20 shrink-0 h-20`}>
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                    <comp.icon size={24} className="text-white" />
                                </div>
                                <h3 className="font-black text-white text-lg leading-tight uppercase tracking-wide">
                                    {comp.name}
                                </h3>
                            </div>

                            {/* Body */}
                            <div className="p-5 flex-1 flex flex-col text-slate-300">
                                {/* Stats Row */}
                                <div className="flex justify-between items-start mb-6 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <div className="flex flex-col gap-1">
                                        <span>Yönetim Beklentisi</span>
                                        <span className="text-white normal-case text-sm font-bold">{expectation}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        <span>Performans</span>
                                        <div className="w-24 h-2 bg-slate-700 rounded-full mt-1">
                                            <div 
                                                className="h-full bg-yellow-500 rounded-full" 
                                                style={{width: `${performance}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 flex flex-col">
                                    {!hasStarted ? (
                                        <div className="text-sm text-slate-400 mt-2">
                                            Bu organizasyon <span className="text-white font-bold">{formattedDate}</span> tarihinde başlayacak 
                                            <span className="text-yellow-500 font-bold ml-1">({daysLeft} gün kaldı)</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {comp.id === 'LEAGUE' ? (
                                                <div className="space-y-2">
                                                    <div className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center">
                                                        <span className="text-xs text-slate-400">Sıralama</span>
                                                        <span className="text-xl font-black text-white">{currentLeagueRank}.</span>
                                                    </div>
                                                    <div className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center">
                                                        <span className="text-xs text-slate-400">Puan</span>
                                                        <span className="text-xl font-black text-white">{myTeam.stats.points}</span>
                                                    </div>
                                                    {/* Mini Table Snippet */}
                                                    <div className="mt-4">
                                                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Zirve Yarışı</div>
                                                        {sortedTeams.slice(0, 5).map((t, i) => (
                                                            <div key={t.id} className={`flex justify-between text-xs py-1 ${t.id === myTeamId ? 'text-yellow-400 font-bold' : 'text-slate-400'}`}>
                                                                <span>{i+1}. {t.name}</span>
                                                                <span>{t.stats.points}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-400">
                                                    <div className="text-xs font-bold text-slate-500 uppercase mb-2">Şampiyona Yolu</div>
                                                    {/* Mock Fixture List for Visuals */}
                                                    <div className="space-y-2 font-mono text-xs opacity-70">
                                                        <div className="flex justify-between"><span>Lincoln (GIB)</span><span>-</span><span>Hamrun S.</span></div>
                                                        <div className="flex justify-between"><span>TNS</span><span>-</span><span>BK Häcken</span></div>
                                                        <div className="flex justify-between"><span>Ballkani</span><span>-</span><span>BATE</span></div>
                                                        <div className="flex justify-between"><span>Farul</span><span>-</span><span>Ludogorets</span></div>
                                                        <div className="flex justify-between"><span>Olimpija</span><span>-</span><span>Zalgiris</span></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Info / Action */}
                                <div className="mt-6 pt-4 border-t border-slate-800">
                                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 text-center">Devam Eden Turnuvalar</div>
                                    
                                    {/* Action Button */}
                                    <button 
                                        onClick={() => setSelectedCompId(comp.id)}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-sm border border-slate-700 hover:border-slate-500"
                                    >
                                        <Eye size={16} className="text-blue-400"/>
                                        Detayları Gör
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LeagueCupView;
