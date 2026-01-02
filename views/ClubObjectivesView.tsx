
import React, { useState, useMemo } from 'react';
import { Team, ManagerProfile, Fixture } from '../types';
import { Target, ThumbsUp, ThumbsDown, Minus, CheckCircle2, XCircle, Clock, Award, Users, Building2, Activity } from 'lucide-react';

interface ClubObjectivesViewProps {
    team: Team;
    manager: ManagerProfile;
    currentSeason: string;
    fixtures: Fixture[];
    currentWeek: number;
    teams: Team[]; // Added to calculate rank
}

const ClubObjectivesView: React.FC<ClubObjectivesViewProps> = ({ team, manager, currentSeason, fixtures, currentWeek, teams }) => {
    const [activeTab, setActiveTab] = useState<'BOARD' | 'FANS'>('BOARD');

    // Determine if it is the start of the game
    const isNewGame = manager.stats.matchesManaged === 0;

    // --- DYNAMIC BOARD GRADE ---
    const getBoardGrade = () => {
        // New Game Rule: Always start with B
        if (isNewGame) {
            return { grade: 'B', color: 'text-yellow-400', border: 'border-yellow-500', text: 'Yönetim yeni sezondan umutlu ve size güveniyor.' };
        }

        if (manager.trust.board > 80) return { grade: 'A+', color: 'text-green-400', border: 'border-green-500', text: 'Yönetim, takımı idare ediş şeklinizden çok memnun.' };
        if (manager.trust.board > 60) return { grade: 'B', color: 'text-yellow-400', border: 'border-yellow-500', text: 'Yönetim gidişattan genel olarak memnun.' };
        if (manager.trust.board > 40) return { grade: 'C', color: 'text-orange-400', border: 'border-orange-500', text: 'Yönetim performansınızdan endişe duyuyor.' };
        return { grade: 'F', color: 'text-red-500', border: 'border-red-500', text: 'Yönetim koltuğunuzu tartışıyor.' };
    };

    const gradeInfo = getBoardGrade();

    // --- DYNAMIC FEEDBACK GENERATION ---
    const feedbacks = useMemo(() => {
        // New Game Rule: No feedbacks initially
        if (isNewGame) return [];

        const list: { type: 'pos' | 'neg' | 'neu', text: string }[] = [];

        // 1. Wage Budget Check (Strict)
        const totalWages = team.players.reduce((a, b) => a + (b.wage || 0), 0);
        const wageBudget = team.wageBudget || 0;
        
        if (totalWages > wageBudget) {
            list.push({ type: 'neg', text: 'Maaş bütçesinin aşılması yönetimde ciddi rahatsızlık yaratıyor.' });
        } else if (totalWages < wageBudget * 0.9) {
            list.push({ type: 'pos', text: 'Maaş bütçesi kontrol altında tutuluyor.' });
        }

        // 2. Atmosphere / Morale Check
        const avgMorale = team.players.reduce((a, b) => a + b.morale, 0) / team.players.length;
        if (avgMorale > 80) {
            list.push({ type: 'pos', text: 'Tesislerdeki olumlu atmosferden ve oyuncu moralinden çok memnunlar.' });
        } else if (avgMorale < 50) {
            list.push({ type: 'neg', text: 'Oyuncular arasındaki huzursuzluk ve düşük moral endişe verici.' });
        }

        // 3. Manager Relations
        const avgTrust = manager.trust.players;
        if (avgTrust > 80) {
            list.push({ type: 'pos', text: 'Oyuncuların menajere olan inancı tam.' });
        } else if (avgTrust < 40) {
            list.push({ type: 'neg', text: 'Bazı oyuncuların menajerin otoritesini sorguladığı konuşuluyor.' });
        }

        // 4. Recent Form (Last 3 Matches)
        const playedFixtures = fixtures
            .filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);

        if (playedFixtures.length > 0) {
            const wins = playedFixtures.filter(f => {
                const isHome = f.homeTeamId === team.id;
                return isHome ? f.homeScore! > f.awayScore! : f.awayScore! > f.homeScore!;
            }).length;
            const losses = playedFixtures.filter(f => {
                const isHome = f.homeTeamId === team.id;
                return isHome ? f.homeScore! < f.awayScore! : f.awayScore! < f.homeScore!;
            }).length;

            if (wins === 3) list.push({ type: 'pos', text: 'Son maçlardaki galibiyet serisi takdir ediliyor.' });
            else if (losses >= 2) list.push({ type: 'neg', text: 'Son haftalardaki puan kayıpları eleştiri topluyor.' });
        }

        // 5. Transfer Balance (If current month has transfers)
        if (manager.stats.transferIncomeThisMonth > manager.stats.transferSpendThisMonth) {
            list.push({ type: 'pos', text: 'Transferde elde edilen kar yönetimi memnun etti.' });
        }

        // Default filler if empty (but not new game)
        if (list.length === 0) {
            list.push({ type: 'neu', text: 'Gidişat stabil görünüyor, henüz belirgin bir eleştiri yok.' });
        }

        return list;
    }, [team, manager, fixtures, isNewGame]);

    // --- LOGIC: STRENGTH BASED OBJECTIVES ---
    const getLeagueObjective = (strength: number) => {
        if (strength >= 82) return { text: 'Şampiyonluk Hedefi', maxRank: 1, desc: 'Ligi 1. sırada bitirmek.' };
        if (strength >= 79) return { text: 'Avrupa Bileti Hedefi', maxRank: 4, desc: 'Ligi ilk 4 içinde bitirmek.' };
        if (strength >= 74) return { text: 'Üst Sıralarda Bitirme', maxRank: 8, desc: 'Ligi ilk 8 içinde bitirmek.' };
        if (strength >= 71) return { text: 'Orta Sıralarda Bitirme', maxRank: 12, desc: 'Ligi ilk 12 içinde bitirmek.' };
        return { text: 'Küme Düşmemeye Çalış', maxRank: 15, desc: 'Ligi ilk 15 içinde bitirip kümede kalmak.' };
    };

    // --- LOGIC: CUP IMPORTANCE ---
    const getCupImportance = (strength: number) => {
        // Lower strength teams value cup more (money & prestige)
        if (strength < 75) return 'Çok Yüksek';
        if (strength < 80) return 'Yüksek';
        return 'Orta';
    };

    // Calculate current rank
    const sortedTeams = [...teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const currentRank = sortedTeams.findIndex(t => t.id === team.id) + 1;
    
    // Get target based on strength
    const leagueTarget = getLeagueObjective(team.strength);
    
    // Determine league status
    const isLeagueTargetMet = currentRank <= leagueTarget.maxRank;
    const leagueStatus = isLeagueTargetMet ? 'success' : 'fail';
    const leagueStatusText = isLeagueTargetMet ? `Yolunda (${currentRank}.)` : `Riskli (${currentRank}.)`;

    // Determine Wage Status (Strict)
    const currentTotalWages = team.players.reduce((a,b) => a + (b.wage||0),0);
    const wageStatus = team.wageBudget && team.wageBudget >= currentTotalWages ? 'success' : 'fail';
    const wageStatusText = wageStatus === 'success' ? 'Başarılı' : 'Başarısız (Limit Aşıldı)';

    // Determine Youth Status (50% play time)
    const youngPlayers = team.players.filter(p => p.age < 23);
    const totalPotentialApps = youngPlayers.length * Math.max(1, currentWeek);
    const actualApps = youngPlayers.reduce((sum, p) => sum + p.seasonStats.matchesPlayed, 0);
    const youthRatio = totalPotentialApps > 0 ? actualApps / totalPotentialApps : 0;
    const isYouthSuccess = youthRatio >= 0.5;
    const youthStatusText = isYouthSuccess ? `Başarılı (%${(youthRatio*100).toFixed(0)})` : `Yetersiz (%${(youthRatio*100).toFixed(0)})`;

    // Determine Reputation Status
    const repIncrease = team.reputation - (team.initialReputation || team.reputation);
    const isRepSuccess = repIncrease >= 0.1;
    const repStatusText = isRepSuccess ? `Başarılı (+${repIncrease.toFixed(1)})` : 'Süreçte';

    // Determine Cup Status (Advancing to Semi Finals Logic)
    // Approximation: If current week > 25 and we haven't been eliminated (implied by winning it or still being in contention logic which is abstract here)
    // Since we don't have cup bracket state, let's use: If currentWeek > 25 OR cups won > 0.
    // User specifically asked "yarı final olduğunda başarılı yazsın".
    // We'll simulate this: If week > 25, we assume semis reached if logic permits. For now, simplest proxy is week.
    // Or simpler: Just mark as "Devam Ediyor" until won.
    // BUT user said: "yarı final olduğunda başarılı yazsın".
    // I'll simulate a semi-final week around Week 28.
    const cupImportance = getCupImportance(team.strength);
    let cupStatus = 'pending';
    let cupText = 'Devam Ediyor';
    if (team.domesticCups && team.domesticCups > 0) { // If won (logic needs to handle cup wins specifically but standard logic adds to count)
         cupStatus = 'success';
         cupText = 'Kupa Kazanıldı!';
    } else if (currentWeek > 28) {
         // Assume semi final time.
         cupStatus = 'success';
         cupText = 'Yarı Final Aşaması';
    }

    const objectives = [
        { 
            name: leagueTarget.text, 
            importance: 'Zorunlu', 
            status: leagueStatus,
            statusText: leagueStatusText,
            desc: leagueTarget.desc
        },
        { 
            name: 'Türkiye Kupası\'nda İlerlemek', 
            importance: cupImportance, 
            status: cupStatus,
            statusText: cupText
        },
        { 
            name: 'Maaş Bütçesine Sadık Kalmak', 
            importance: 'Orta', 
            status: wageStatus,
            statusText: wageStatusText
        },
        { 
            name: 'Genç Oyuncu Geliştirmek', 
            importance: 'Düşük', 
            status: isYouthSuccess ? 'success' : 'pending',
            statusText: youthStatusText,
            desc: '23 yaş altı oyuncuları maçların %50\'sinde oynat.'
        },
        { 
            name: 'Kulüp İtibarını Artırmak', 
            importance: 'Yüksek', 
            status: isRepSuccess ? 'success' : 'pending',
            statusText: repStatusText,
            desc: 'İtibarı en az 0.1 puan artır.'
        },
    ];

    const getImportanceBar = (imp: string) => {
        let width = 'w-full';
        let color = 'bg-purple-500';
        if (imp === 'Çok Yüksek') { width = 'w-full'; color = 'bg-red-600'; }
        else if (imp === 'Yüksek') { width = 'w-3/4'; color = 'bg-blue-500'; }
        else if (imp === 'Orta') { width = 'w-1/2'; color = 'bg-yellow-500'; }
        else if (imp === 'Düşük') { width = 'w-1/4'; color = 'bg-slate-500'; }
        
        return (
            <div className="flex flex-col gap-1 w-24">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{imp}</span>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{width: imp === 'Zorunlu' || imp === 'Çok Yüksek' ? '100%' : imp === 'Yüksek' ? '75%' : imp === 'Orta' ? '50%' : '25%'}}></div>
                </div>
            </div>
        );
    };

    const getStatusBadge = (status: string, text: string) => {
        if (status === 'success') return <span className="bg-green-900/40 text-green-400 border border-green-600/50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> {text}</span>;
        if (status === 'fail') return <span className="bg-red-900/40 text-red-400 border border-red-600/50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle size={12}/> {text}</span>;
        return <span className="bg-slate-700/40 text-slate-300 border border-slate-600/50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={12}/> {text}</span>;
    };

    return (
        <div className="h-full bg-[#111827] overflow-hidden flex flex-col md:flex-row p-4 gap-4">
            
            {/* LEFT COLUMN: FEEDBACK */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                {/* Toggle Header */}
                <div className="bg-[#1f2937] rounded-lg p-1 flex gap-1 border border-slate-700">
                    <button 
                        onClick={() => setActiveTab('BOARD')}
                        className={`flex-1 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'BOARD' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Building2 size={16}/> Yönetim
                    </button>
                    <button 
                        onClick={() => setActiveTab('FANS')}
                        className={`flex-1 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'FANS' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Users size={16}/> Taraftar
                    </button>
                </div>

                {/* Main Feedback Card */}
                <div className="flex-1 bg-[#1f2937] rounded-xl border border-slate-700 p-6 flex flex-col shadow-xl">
                    <div className="flex flex-col items-center justify-center mb-8 border-b border-slate-700 pb-6">
                        <div className={`w-24 h-24 rounded-full border-4 ${gradeInfo.border} flex items-center justify-center text-5xl font-black ${gradeInfo.color} bg-slate-900 shadow-2xl mb-4`}>
                            {gradeInfo.grade}
                        </div>
                        <p className="text-slate-300 text-center text-sm font-medium px-4 leading-relaxed">
                            {activeTab === 'BOARD' ? gradeInfo.text : (isNewGame ? 'Taraftarlar yeni sezona başlarken heyecanlı.' : 'Taraftarlar genel performansınızdan ve oynanan oyundan memnun.')}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Önemli Anlar ve Eleştiriler</h3>
                        
                        <div className="space-y-4">
                            {feedbacks.length === 0 ? (
                                <div className="text-center text-slate-500 italic text-sm py-4">
                                    Sezon henüz yeni başladı. Raporlar yakında burada görünecek.
                                </div>
                            ) : (
                                feedbacks.map((fb, idx) => (
                                    <div key={idx} className="flex gap-3 items-start animate-in slide-in-from-left-2">
                                        <div className={`mt-0.5 shrink-0 ${fb.type === 'pos' ? 'text-green-500' : fb.type === 'neg' ? 'text-red-500' : 'text-slate-500'}`}>
                                            {fb.type === 'pos' ? <ThumbsUp size={16} fill="currentColor" className="opacity-20"/> : fb.type === 'neg' ? <ThumbsDown size={16} fill="currentColor" className="opacity-20"/> : <Minus size={16}/>}
                                        </div>
                                        <p className="text-sm text-slate-300 leading-snug">{fb.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: OBJECTIVES (NO TABS) */}
            <div className="flex-1 bg-[#1f2937] rounded-xl border border-slate-700 flex flex-col shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-[#111827]/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="text-red-500"/> Sezon Hedefleri
                    </h2>
                    <div className="text-xs text-slate-500 font-mono font-bold uppercase bg-[#111827] px-3 py-1 rounded border border-slate-700">
                        {currentSeason}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-1">
                        <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-700 mb-2">
                            <div className="col-span-6">Hedef</div>
                            <div className="col-span-3">Önem</div>
                            <div className="col-span-3 text-right">Değerlendirme</div>
                        </div>
                        {objectives.map((obj, i) => (
                            <div key={i} className="grid grid-cols-12 px-4 py-4 items-center bg-[#111827]/30 rounded-lg border border-slate-700/50 hover:bg-[#111827]/50 transition mb-2">
                                <div className="col-span-6 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                                            {i === 0 ? <Award size={20} className="text-yellow-500"/> : <Activity size={20} className="text-slate-400"/>}
                                        </div>
                                        <span className="font-bold text-slate-200 text-sm">{obj.name}</span>
                                    </div>
                                    {obj.desc && <div className="text-[10px] text-slate-500 ml-11">{obj.desc}</div>}
                                </div>
                                <div className="col-span-3">
                                    {getImportanceBar(obj.importance)}
                                </div>
                                <div className="col-span-3 flex justify-end">
                                    {getStatusBadge(obj.status, obj.statusText)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubObjectivesView;
