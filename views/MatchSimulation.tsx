
import React, { useState, useRef, useEffect } from 'react';
import { Team, MatchEvent, MatchStats, Position } from '../types';
import { simulateMatchStep, getEmptyMatchStats } from '../utils/gameEngine';
import PitchVisual from '../components/shared/PitchVisual';
import TacticsView from './TacticsView';
import StandingsTable from '../components/shared/StandingsTable';
import { MonitorPlay, Timer, AlertOctagon, Megaphone, Settings, PlayCircle, TrendingUp, Disc, Syringe, Activity } from 'lucide-react';

const MatchSimulation = ({ 
    homeTeam, awayTeam, onFinish, allTeams, fixtures
}: { 
    homeTeam: Team, awayTeam: Team, onFinish: (h: number, a: number, events: MatchEvent[], stats: MatchStats) => void, allTeams: Team[], fixtures: any[]
}) => {
    const [minute, setMinute] = useState(0);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [stats, setStats] = useState<MatchStats>(getEmptyMatchStats());
    const [speed, setSpeed] = useState(1); 
    const [phase, setPhase] = useState<'FIRST_HALF' | 'HALFTIME' | 'SECOND_HALF' | 'FULL_TIME'>('FIRST_HALF');
    const [isTacticsOpen, setIsTacticsOpen] = useState(false);
    
    // VAR State
    const [isVarActive, setIsVarActive] = useState(false);
    const [varMessage, setVarMessage] = useState<string>('');

    // Manager Discipline State
    const [managerDiscipline, setManagerDiscipline] = useState<'NONE' | 'WARNED' | 'YELLOW' | 'RED'>('NONE');

    // Local tactics state
    const [myTeamCurrent, setMyTeamCurrent] = useState(homeTeam); 

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [events]);

    useEffect(() => {
        if(isTacticsOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || isVarActive) return;

        const interval = setInterval(() => {
            setMinute(m => {
                const nextM = m + 1;
                
                if (nextM === 45 && phase === 'FIRST_HALF') {
                    setPhase('HALFTIME');
                    return 45;
                }
                
                if (nextM >= 90 && phase === 'SECOND_HALF') {
                    setPhase('FULL_TIME');
                    return 90;
                }

                // SIMULATE STEP
                const event = simulateMatchStep(nextM, homeTeam, awayTeam, {h: homeScore, a: awayScore});
                
                if(event) {
                    // Handle VAR Pause
                    if (event.type === 'VAR') {
                        setIsVarActive(true);
                        setVarMessage(`${event.description}`);
                        // Schedule resolution
                        setTimeout(() => {
                             setIsVarActive(false);
                             const outcome = event.varOutcome === 'GOAL';
                             const finalEvent: MatchEvent = {
                                 ...event,
                                 type: outcome ? 'GOAL' : 'INFO',
                                 description: outcome ? `VAR İncelemesi Bitti: GOL GEÇERLİ! (${event.scorer})` : `VAR İncelemesi Bitti: GOL İPTAL! (${event.scorer} ofsayt)`,
                             };
                             
                             setEvents(prev => [...prev, finalEvent]);
                             if(outcome) {
                                if(event.teamName === homeTeam.name) setHomeScore(s => s + 1);
                                else setAwayScore(s => s + 1);
                             }

                        }, 3000); // 3 seconds VAR check
                    } else {
                        setEvents(prev => [...prev, event]);
                        if(event.type === 'GOAL') {
                            if(event.teamName === homeTeam.name) setHomeScore(s => s + 1);
                            else setAwayScore(s => s + 1);
                        }
                    }

                    // UPDATE STATS INCREMENTALLY
                    setStats(prev => {
                        const s = {...prev};
                        if(event.teamName === homeTeam.name) s.homePossession = Math.min(80, s.homePossession + 1);
                        else s.awayPossession = Math.min(80, s.awayPossession + 1);
                        s.homePossession = Math.max(20, s.homePossession);
                        s.awayPossession = 100 - s.homePossession;

                        if(event.type === 'GOAL' || event.type === 'MISS' || event.type === 'SAVE') {
                             if(event.teamName === homeTeam.name) { s.homeShots++; if(event.type === 'GOAL' || event.type === 'SAVE') s.homeShotsOnTarget++; }
                             else { s.awayShots++; if(event.type === 'GOAL' || event.type === 'SAVE') s.awayShotsOnTarget++; }
                        }
                        if(event.type === 'CORNER') { event.teamName === homeTeam.name ? s.homeCorners++ : s.awayCorners++; }
                        if(event.type === 'FOUL') { event.teamName === homeTeam.name ? s.homeFouls++ : s.awayFouls++; }
                        if(event.type === 'CARD_YELLOW') { event.teamName === homeTeam.name ? s.homeYellowCards++ : s.awayYellowCards++; }
                        if(event.type === 'CARD_RED') { event.teamName === homeTeam.name ? s.homeRedCards++ : s.awayRedCards++; }
                        if(event.type === 'OFFSIDE') { event.teamName === homeTeam.name ? s.homeOffsides++ : s.awayOffsides++; }
                        return s;
                    });
                }

                return nextM;
            });
        }, 1000 / speed);

        return () => clearInterval(interval);
    }, [minute, isTacticsOpen, phase, speed, isVarActive]);

    const liveScores = { homeId: homeTeam.id, awayId: awayTeam.id, homeScore, awayScore };
    
    // --- DEEP OBJECTION & DISCIPLINE SYSTEM ---
    const handleObjection = () => {
         if (managerDiscipline === 'RED') return; // Should not be reachable via UI but double check

         // 1. Check Context: Is there an Opponent Goal recently?
         const lastEvent = events[events.length - 1];
         let isContestingOpponentGoal = false;
         
         if (lastEvent && lastEvent.type === 'GOAL' && lastEvent.teamName !== myTeamCurrent.name) {
             isContestingOpponentGoal = true;
         }

         // Add base objection event
         const objectionEvent: MatchEvent = {
             minute,
             description: "Teknik direktör karara şiddetli bir şekilde itiraz ediyor...",
             type: 'INFO',
             teamName: myTeamCurrent.name
         };
         setEvents(prev => [...prev, objectionEvent]);

         // 2. Scenario: Contesting Opponent Goal (Trigger VAR Check?)
         if (isContestingOpponentGoal) {
             // 25% Chance Referee actually listens and goes to VAR
             const varCheckChance = Math.random();
             
             if (varCheckChance < 0.25) {
                 setIsVarActive(true);
                 setVarMessage("Hakem itirazlar üzerine pozisyonu izlemeye gidiyor...");
                 
                 setTimeout(() => {
                     setIsVarActive(false);
                     // 40% Chance goal is actually cancelled if checked
                     const goalCancelled = Math.random() < 0.40; 
                     
                     if (goalCancelled) {
                         const cancelEvent: MatchEvent = {
                             minute,
                             description: "VAR KARARI: GOL İPTAL! (Ofsayt/Faul tespit edildi)",
                             type: 'INFO',
                             teamName: myTeamCurrent.name
                         };
                         setEvents(prev => [...prev, cancelEvent]);
                         
                         // Revert Score
                         if (lastEvent.teamName === homeTeam.name) setHomeScore(s => Math.max(0, s - 1));
                         else setAwayScore(s => Math.max(0, s - 1));

                         // Revert Stats (Simplified)
                         setStats(prev => {
                             const s = {...prev};
                             if(lastEvent.teamName === homeTeam.name) s.homeShotsOnTarget = Math.max(0, s.homeShotsOnTarget - 1);
                             else s.awayShotsOnTarget = Math.max(0, s.awayShotsOnTarget - 1);
                             return s;
                         });

                     } else {
                         // Goal Stands + Punishment for Manager
                         const standEvent: MatchEvent = {
                             minute,
                             description: "VAR İncelemesi Tamamlandı: GOL GEÇERLİ. Hakem itirazları haksız buldu.",
                             type: 'INFO',
                             teamName: lastEvent.teamName
                         };
                         setEvents(prev => [...prev, standEvent]);
                         escalateDiscipline("Hakem VAR kontrolü sonrası haksız itiraz nedeniyle karta başvurdu.");
                     }
                 }, 3000);
                 return; // Exit, handled async
             } else {
                 // Referee ignores request
                 const ignoreEvent: MatchEvent = {
                    minute,
                    description: "Hakem VAR işaretine gerek duymadı ve oyunu devam ettirdi.",
                    type: 'INFO'
                 };
                 setEvents(prev => [...prev, ignoreEvent]);
                 // Fallthrough to standard discipline check
             }
         } 

         // 3. Standard Discipline Escalation (If not handling VAR success)
         escalateDiscipline();
    };

    const escalateDiscipline = (reasonOverride?: string) => {
         let newStatus = managerDiscipline;
         let desc = reasonOverride || "Hakem yedek kulübesine gelerek sözlü uyarıda bulundu.";
         let type: MatchEvent['type'] = 'INFO';
         const roll = Math.random();

         if (managerDiscipline === 'NONE') {
             if (roll < 0.4) {
                 newStatus = 'WARNED';
                 desc = "Hakem teknik direktörü sert bir dille uyardı: 'Yerine geç hocam!'";
             } else if (roll < 0.1) {
                 newStatus = 'YELLOW';
                 desc = "Teknik direktör aşırı itirazdan dolayı SARI KART gördü.";
                 type = 'CARD_YELLOW';
             }
         } else if (managerDiscipline === 'WARNED') {
             if (roll < 0.5) {
                 newStatus = 'YELLOW';
                 desc = "Hakem itirazların dozunu kaçıran teknik direktöre SARI KART gösterdi.";
                 type = 'CARD_YELLOW';
             } else {
                 desc = "Hakem son kez uyardı: 'Bir daha olursa atarım!'";
             }
         } else if (managerDiscipline === 'YELLOW') {
             if (roll < 0.6) { // High chance of red if already yellow
                 newStatus = 'RED';
                 desc = "Teknik direktör ikinci sarı karttan KIRMIZI KART gördü ve tribüne gönderildi!";
                 type = 'CARD_RED';
             } else {
                 desc = "Hakem dördüncü hakemi yanına çağırdı, teknik direktör ipten döndü.";
             }
         }

         setManagerDiscipline(newStatus);
         setEvents(prev => [...prev, { minute, description: desc, type, teamName: myTeamCurrent.name }]);
         
         if(newStatus === 'YELLOW') setStats(s => ({ ...s, managerCards: 'YELLOW' }));
         if(newStatus === 'RED') {
             setStats(s => ({ ...s, managerCards: 'RED' }));
             setIsTacticsOpen(false); // Force close tactics
         }
    };

    return (
        <div className="h-full flex flex-col relative">
            {/* TACTICS OVERLAY */}
            {isTacticsOpen && (
                <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                        <h2 className="text-2xl font-bold text-white">Canlı Taktik Yönetimi</h2>
                        <button onClick={() => setIsTacticsOpen(false)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2">
                             <PlayCircle size={20}/> MAÇA DÖN
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        <TacticsView team={myTeamCurrent} setTeam={setMyTeamCurrent} />
                    </div>
                </div>
            )}

            {/* VAR OVERLAY */}
            {isVarActive && (
                <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-slate-900 p-8 rounded-xl border-2 border-purple-500 text-center animate-pulse shadow-2xl shadow-purple-900/50">
                        <MonitorPlay size={80} className="text-purple-500 mx-auto mb-6"/>
                        <h2 className="text-4xl font-bold text-white mb-4 tracking-widest">VAR KONTROLÜ</h2>
                        <p className="text-purple-300 text-xl font-mono">{varMessage}</p>
                    </div>
                </div>
            )}

            {/* Scoreboard */}
            <div className="bg-black text-white p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 w-1/3">
                    <img src={homeTeam.logo} className="w-16 h-16 object-contain" />
                    <span className="text-3xl font-bold truncate hidden md:block">{homeTeam.name}</span>
                </div>
                <div className="flex flex-col items-center w-1/3">
                    <div className="text-5xl font-mono font-bold bg-slate-900 px-8 py-2 rounded border border-slate-700 tracking-widest shadow-lg shadow-black">
                        {homeScore} - {awayScore}
                    </div>
                    <div className="mt-2 text-red-500 font-bold animate-pulse flex items-center gap-2 text-xl">
                        <Timer size={20}/> {minute}'
                    </div>
                </div>
                <div className="flex items-center gap-4 w-1/3 justify-end">
                    <span className="text-3xl font-bold truncate hidden md:block">{awayTeam.name}</span>
                    <img src={awayTeam.logo} className="w-16 h-16 object-contain" />
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Pitch (Visual) */}
                <div className="w-1/3 hidden lg:block bg-green-900 border-r border-slate-800 relative">
                     <PitchVisual players={myTeamCurrent.players} onPlayerClick={() => {}} selectedPlayerId={null}/>
                </div>

                {/* CENTER: Events & Controls */}
                <div className="flex-1 bg-slate-900 flex flex-col relative border-r border-slate-800">
                    <div className="bg-slate-800 p-2 text-center text-xs text-slate-500 font-bold uppercase tracking-widest border-b border-slate-700">Maç Merkezi</div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                        {events.map((e, i) => {
                            const eventTeam = allTeams.find(t => t.name === e.teamName);
                            
                            // Base styling defaults
                            let borderClass = 'border-slate-600';
                            let bgClass = 'bg-slate-800';
                            
                            // Determine Color Logic
                            let activeColorClass = 'bg-slate-500'; // fallback
                            let activeTextClass = 'text-white';

                            if (eventTeam) {
                                // Conflict Resolution: If both teams are RED (e.g. Kedispor & Küheylanspor), 
                                // make the Away team use their secondary color to distinguish.
                                const isHome = eventTeam.id === homeTeam.id;
                                const conflict = homeTeam.colors[0] === awayTeam.colors[0];

                                if (!isHome && conflict) {
                                    // Use secondary color (usually text-color) mapped to bg-color
                                    const secColor = eventTeam.colors[1]; 
                                    activeColorClass = secColor.replace('text-', 'bg-');
                                } else {
                                    activeColorClass = eventTeam.colors[0];
                                }

                                // Handle very dark colors (like black) that might disappear on dark theme
                                if (activeColorClass.includes('black') || activeColorClass.includes('slate-900')) {
                                    activeColorClass = 'bg-slate-200'; // Force to light grey/white for visibility
                                }
                                
                                borderClass = activeColorClass.replace('bg-', 'border-');

                                // Calculate Background Tint
                                if (activeColorClass.includes('white') || activeColorClass.includes('slate-100') || activeColorClass.includes('gray-100') || activeColorClass.includes('slate-200')) {
                                     bgClass = 'bg-slate-200/10';
                                } else {
                                    // Try to make a dark version
                                    let darkBg = activeColorClass.replace('400', '900').replace('500', '900').replace('600', '900').replace('700', '950').replace('800', '950');
                                    if(darkBg === activeColorClass && !activeColorClass.includes('900')) darkBg = 'bg-slate-900';
                                    bgClass = `${darkBg}/40`;
                                }

                                // Calculate Text Contrast for Badge
                                // If background is light, text should be black. If dark, text white.
                                const isLightBg = activeColorClass.includes('white') || activeColorClass.includes('yellow') || activeColorClass.includes('cyan') || activeColorClass.includes('lime') || activeColorClass.includes('slate-200');
                                activeTextClass = isLightBg ? 'text-black' : 'text-white';
                            } else {
                                // Neutral Events
                                if (e.type === 'VAR' || (e.type === 'INFO' && e.description.includes('VAR'))) {
                                    bgClass = 'bg-purple-900/30';
                                    borderClass = 'border-purple-500';
                                } else if (e.description.includes('Teknik direktör')) {
                                    bgClass = 'bg-orange-900/30';
                                    borderClass = 'border-orange-500';
                                }
                            }

                            return (
                                <div key={i} className={`p-3 rounded border-l-4 animate-in fade-in slide-in-from-bottom-2 ${bgClass} ${borderClass}`}>
                                    <div className="flex items-start gap-3">
                                        <span className="font-mono text-slate-400 font-bold min-w-[30px]">{e.minute}'</span>
                                        <div>
                                            {e.type === 'GOAL' ? (
                                                <>
                                                    <span className={`font-bold inline-block px-3 py-1 rounded mb-1 text-lg ${activeColorClass} ${activeTextClass}`}>
                                                        GOOOOL!
                                                    </span>
                                                    <span className="text-slate-200 block mt-1">{e.description.replace('GOOOOL!', '').trim()}</span>
                                                    {e.assist && (
                                                        <span className="text-blue-300 text-xs block mt-1 font-bold">Asist: {e.assist}</span>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-sm text-slate-200">
                                                    {e.description}
                                                </p>
                                            )}
                                            
                                            {e.description.includes('GOL İPTAL') && <span className="bg-red-600 text-white px-2 py-1 rounded font-bold inline-block mt-1">GOL İPTAL EDİLDİ!</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Controls */}
                    <div className="p-4 bg-slate-800 border-t border-slate-700 flex flex-col gap-4">
                         <div className="flex justify-between items-center">
                             <div className="flex gap-2">
                                 {[1, 2, 4].map(s => (
                                     <button key={s} onClick={() => setSpeed(s)} className={`px-3 py-1 rounded text-xs font-bold ${speed === s ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{s}x</button>
                                 ))}
                             </div>
                             
                             {phase === 'FULL_TIME' ? (
                                 <button onClick={() => onFinish(homeScore, awayScore, events, stats)} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-bold animate-pulse">
                                     MAÇI BİTİR
                                 </button>
                             ) : phase === 'HALFTIME' ? (
                                 <div className="flex gap-4">
                                    <button onClick={() => setIsTacticsOpen(true)} className="bg-blue-600 px-4 py-2 rounded text-white font-bold">SOYUNMA ODASI</button>
                                    <button onClick={() => setPhase('SECOND_HALF')} className="bg-green-600 px-4 py-2 rounded text-white font-bold">2. YARIYI BAŞLAT</button>
                                 </div>
                             ) : (
                                 <div className="flex gap-2 items-center">
                                     {managerDiscipline === 'RED' ? (
                                         <div className="bg-red-600/20 border border-red-500 text-red-500 px-6 py-3 rounded font-bold text-sm flex items-center gap-2 animate-pulse shadow-inner">
                                             <AlertOctagon size={24}/> 
                                             <span>CEZALI: TRİBÜNE GÖNDERİLDİNİZ (MÜDAHALE YOK)</span>
                                         </div>
                                     ) : (
                                        <>
                                            <button 
                                                onClick={handleObjection}
                                                className={`text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-sm border shadow-inner transition active:scale-95 ${managerDiscipline === 'YELLOW' ? 'bg-orange-700 hover:bg-orange-600 border-orange-500' : 'bg-slate-700 hover:bg-slate-600 border-slate-500'}`}
                                            >
                                                <Megaphone size={16}/> {managerDiscipline === 'YELLOW' ? 'İTİRAZ (SON UYARI!)' : 'İTİRAZ ET'}
                                            </button>
                                            <button onClick={() => setIsTacticsOpen(true)} className="bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold flex items-center gap-2 shadow-lg shadow-yellow-900/50">
                                                <Settings size={16}/> TAKTİK
                                            </button>
                                        </>
                                     )}
                                 </div>
                             )}
                         </div>
                    </div>
                </div>

                {/* RIGHT: Live Stats & Table */}
                <div className="w-1/4 hidden md:flex flex-col bg-slate-800">
                    <div className="flex-1 overflow-y-auto border-b border-slate-700">
                        <div className="p-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase">Canlı İstatistikler</div>
                        <div className="p-4 space-y-4">
                            {/* Possession FIRST */}
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Topla Oynama</span><div className="font-bold text-white">%{stats.homePossession} - %{stats.awayPossession}</div></div>
                            <div className="w-full bg-slate-700 h-1 rounded overflow-hidden"><div className="bg-white h-full" style={{width: `${stats.homePossession}%`}}></div></div>

                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Şut</span><div className="font-bold text-white">{stats.homeShots} - {stats.awayShots}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">İsabetli Şut</span><div className="font-bold text-white">{stats.homeShotsOnTarget} - {stats.awayShotsOnTarget}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Korner</span><div className="font-bold text-white">{stats.homeCorners} - {stats.awayCorners}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Faul</span><div className="font-bold text-white">{stats.homeFouls} - {stats.awayFouls}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Sarı Kart</span><div className="font-bold text-yellow-500">{stats.homeYellowCards} - {stats.awayYellowCards}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Kırmızı Kart</span><div className="font-bold text-red-500">{stats.homeRedCards} - {stats.awayRedCards}</div></div>
                             <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Ofsayt</span><div className="font-bold text-white">{stats.homeOffsides} - {stats.awayOffsides}</div></div>
                        </div>
                    </div>
                    <div className="h-1/2 flex flex-col">
                        <div className="p-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><TrendingUp size={14}/> Canlı Puan Durumu</div>
                        <div className="flex-1 overflow-y-auto">
                            <StandingsTable teams={allTeams} myTeamId={myTeamCurrent.id} compact liveScores={liveScores} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchSimulation;
