
import React, { useState, useRef, useEffect } from 'react';
import { Team, MatchEvent, MatchStats, Position, Player, Mentality } from '../types';
import { simulateMatchStep, getEmptyMatchStats } from '../utils/gameEngine';
import PitchVisual from '../components/shared/PitchVisual';
import TacticsView from './TacticsView';
import { MonitorPlay, Timer, AlertOctagon, Megaphone, Settings, PlayCircle, Disc, Syringe, Lock, Target, AlertCircle, RefreshCw, Zap, BarChart2, List } from 'lucide-react';

// SOUND PATHS
const GOAL_SOUND = '/voices/goalsound.wav';
const WHISTLE_SOUND = '/voices/whistle.wav';

const MatchSimulation = ({ 
    homeTeam, awayTeam, userTeamId, onFinish, allTeams, fixtures
}: { 
    homeTeam: Team, awayTeam: Team, userTeamId: string, onFinish: (h: number, a: number, events: MatchEvent[], stats: MatchStats) => void, allTeams: Team[], fixtures: any[]
}) => {
    const [minute, setMinute] = useState(0);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [stats, setStats] = useState<MatchStats>(getEmptyMatchStats());
    const [speed, setSpeed] = useState(1); 
    const [phase, setPhase] = useState<'FIRST_HALF' | 'HALFTIME' | 'SECOND_HALF' | 'FULL_TIME'>('FIRST_HALF');
    const [isTacticsOpen, setIsTacticsOpen] = useState(false);
    
    // Live Team State (to track subs)
    const [liveHomeTeam, setLiveHomeTeam] = useState(homeTeam);
    const [liveAwayTeam, setLiveAwayTeam] = useState(awayTeam);
    const [homeSubsUsed, setHomeSubsUsed] = useState(0);
    const [awaySubsUsed, setAwaySubsUsed] = useState(0);

    // VAR State
    const [isVarActive, setIsVarActive] = useState(false);
    const [varMessage, setVarMessage] = useState<string>('');

    // PENALTY State
    const [isPenaltyActive, setIsPenaltyActive] = useState(false);
    const [penaltyMessage, setPenaltyMessage] = useState<string>('');
    const [penaltyTeamId, setPenaltyTeamId] = useState<string | null>(null);

    // Manager Discipline State
    const [managerDiscipline, setManagerDiscipline] = useState<'NONE' | 'WARNED' | 'YELLOW' | 'RED'>('NONE');

    // Forced Substitution State (For User Injuries)
    const [forcedSubstitutionPlayerId, setForcedSubstitutionPlayerId] = useState<string | null>(null);

    // Mobile Tab Switcher (Feed vs Stats)
    const [mobileTab, setMobileTab] = useState<'FEED' | 'STATS'>('FEED');

    // Local tactics state for USER View (Needs to sync with liveHome/liveAway)
    const userIsHome = homeTeam.id === userTeamId;
    const [myTeamCurrent, setMyTeamCurrent] = useState(userIsHome ? liveHomeTeam : liveAwayTeam); 

    // Sync myTeamCurrent when live teams change (due to AI subs or external updates)
    useEffect(() => {
        setMyTeamCurrent(userIsHome ? liveHomeTeam : liveAwayTeam);
    }, [liveHomeTeam, liveAwayTeam, userIsHome]);

    // Timing tracking for objection feature
    const lastGoalRealTime = useRef<number>(0);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Calculate Red Cards for UI
    const homeRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === homeTeam.name).length;
    const awayRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === awayTeam.name).length;

    // Keep a ref of stats to access current possession inside the interval closure
    const statsRef = useRef(stats);
    useEffect(() => {
        statsRef.current = stats;
    }, [stats]);

    useEffect(() => {
        if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [events]);

    // Sound Helper
    const playSound = (path: string) => {
        const audio = new Audio(path);
        audio.volume = 0.6;
        audio.play().catch(e => console.warn("Audio play failed:", e));
    };

    // Handle User Substitution Callback from TacticsView
    const handleUserSubstitution = (inPlayer: Player, outPlayer: Player) => {
        const teamName = myTeamCurrent.name;
        const event: MatchEvent = {
            minute,
            type: 'SUBSTITUTION',
            description: `${outPlayer.name} 🔄 ${inPlayer.name}`,
            teamName: teamName
        };
        setEvents(prev => [...prev, event]);

        // Check if this solves the forced substitution
        if (forcedSubstitutionPlayerId && outPlayer.id === forcedSubstitutionPlayerId) {
            setForcedSubstitutionPlayerId(null);
        }

        if (userIsHome) {
            setHomeSubsUsed(h => h + 1);
            setLiveHomeTeam(myTeamCurrent); 
        } else {
            setAwaySubsUsed(a => a + 1);
            setLiveAwayTeam(myTeamCurrent);
        }
    };

    // Wrapper for TacticsView setTeam to sync with live state
    const handleTacticsUpdate = (updatedTeam: Team) => {
        setMyTeamCurrent(updatedTeam);
        if (userIsHome) setLiveHomeTeam(updatedTeam);
        else setLiveAwayTeam(updatedTeam);
    };

    useEffect(() => {
        // Halt simulation loop if any overlay is active or phase is stopped
        if(isTacticsOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || isVarActive || isPenaltyActive) return;

        const interval = setInterval(() => {
            setMinute(m => {
                const nextM = m + 1;
                
                if (nextM === 45 && phase === 'FIRST_HALF') {
                    setPhase('HALFTIME');
                    playSound(WHISTLE_SOUND); // Half Time Whistle
                    return 45;
                }
                
                if (nextM >= 90 && phase === 'SECOND_HALF') {
                    setPhase('FULL_TIME');
                    playSound(WHISTLE_SOUND); // Full Time Whistle
                    return 90;
                }

                // --- AI OPPONENT SUBSTITUTION LOGIC ---
                const isOpponentHome = !userIsHome;
                const aiTeam = isOpponentHome ? liveHomeTeam : liveAwayTeam;
                const aiSubsCount = isOpponentHome ? homeSubsUsed : awaySubsUsed;
                const setAiTeam = isOpponentHome ? setLiveHomeTeam : setLiveAwayTeam;
                const setAiSubs = isOpponentHome ? setHomeSubsUsed : setAwaySubsUsed;

                if (nextM > 45 && aiSubsCount < 5) {
                    if (Math.random() < 0.20) {
                        const pitchPlayers = aiTeam.players.slice(0, 11);
                        const benchPlayers = aiTeam.players.slice(11, 18);
                        
                        const outPlayer = pitchPlayers.reduce((prev, curr) => (prev.skill < curr.skill ? prev : curr));
                        let inPlayer = benchPlayers.find(p => p.position === outPlayer.position);
                        if (!inPlayer && benchPlayers.length > 0) inPlayer = benchPlayers[0]; 

                        if (inPlayer && outPlayer) {
                            const newPlayers = [...aiTeam.players];
                            const idxOut = newPlayers.findIndex(p => p.id === outPlayer.id);
                            const idxIn = newPlayers.findIndex(p => p.id === inPlayer.id);
                            
                            if (idxOut !== -1 && idxIn !== -1) {
                                [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
                                
                                setAiTeam({ ...aiTeam, players: newPlayers });
                                setAiSubs(s => s + 1);
                                
                                setEvents(prev => [...prev, {
                                    minute: nextM,
                                    type: 'SUBSTITUTION',
                                    description: `${outPlayer.name} 🔄 ${inPlayer.name}`,
                                    teamName: aiTeam.name
                                }]);
                            }
                        }
                    }
                }

                const event = simulateMatchStep(nextM, liveHomeTeam, liveAwayTeam, {h: homeScore, a: awayScore}, events);
                
                if(event) {
                    setEvents(prev => [...prev, event]);

                    if (event.type === 'CARD_RED') {
                        playSound(WHISTLE_SOUND);
                    }

                    if (event.type === 'INJURY') {
                        const injuredTeamIsHome = event.teamName === liveHomeTeam.name;
                        const isAiInjury = (injuredTeamIsHome && !userIsHome) || (!injuredTeamIsHome && userIsHome);
                        
                        if (isAiInjury) {
                            const currentSubs = injuredTeamIsHome ? homeSubsUsed : awaySubsUsed;
                            if (currentSubs < 5) {
                                const teamObj = injuredTeamIsHome ? liveHomeTeam : liveAwayTeam;
                                const setTeamFn = injuredTeamIsHome ? setLiveHomeTeam : setLiveAwayTeam;
                                const setSubFn = injuredTeamIsHome ? setHomeSubsUsed : setAwaySubsUsed;
                                
                                const injuredPlayer = teamObj.players.find(p => p.id === event.playerId);
                                const benchPlayers = teamObj.players.slice(11, 18);
                                let subIn = benchPlayers.find(p => p.position === injuredPlayer?.position) || benchPlayers[0];
                                
                                if (injuredPlayer && subIn) {
                                    const newPlayers = [...teamObj.players];
                                    const idxOut = newPlayers.findIndex(p => p.id === injuredPlayer.id);
                                    const idxIn = newPlayers.findIndex(p => p.id === subIn.id);
                                    
                                    if(idxOut !== -1 && idxIn !== -1) {
                                        [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
                                        setTeamFn({ ...teamObj, players: newPlayers });
                                        setSubFn(s => s + 1);
                                        
                                        setEvents(prev => [...prev, {
                                            minute: nextM,
                                            type: 'SUBSTITUTION',
                                            description: `Zorunlu Değişiklik: ${injuredPlayer.name} 🔄 ${subIn!.name}`,
                                            teamName: teamObj.name
                                        }]);
                                    }
                                }
                            }
                        } else {
                            if (event.playerId) {
                                setForcedSubstitutionPlayerId(event.playerId);
                                setIsTacticsOpen(true);
                            }
                        }
                    }

                    if (event.type === 'CARD_YELLOW') {
                        const isHomeFoul = event.teamName === homeTeam.name;
                        const attackingPossession = isHomeFoul ? statsRef.current.awayPossession : statsRef.current.homePossession;
                        let penaltyChance = 0.08; 

                        if (attackingPossession >= 70) penaltyChance = 0.14; 
                        else if (attackingPossession >= 60) penaltyChance = 0.10; 

                        if (Math.random() < penaltyChance) {
                            setIsPenaltyActive(true);
                            playSound(WHISTLE_SOUND); 
                            
                            const penaltyTeam = isHomeFoul ? liveAwayTeam : liveHomeTeam;
                            setPenaltyTeamId(penaltyTeam.id);

                            const xi = penaltyTeam.players.slice(0, 11);
                            const taker = xi.reduce((prev, current) => (prev.stats.finishing > current.stats.finishing) ? prev : current);
                            
                            setPenaltyMessage(`${taker.name} topun başında...`);

                            setTimeout(() => {
                                setIsPenaltyActive(false);
                                setPenaltyTeamId(null);
                                
                                const isGoal = Math.random() < 0.70;

                                if (isGoal) {
                                    if(penaltyTeam.id === homeTeam.id) setHomeScore(s => s + 1);
                                    else setAwayScore(s => s + 1);
                                    
                                    lastGoalRealTime.current = Date.now();

                                    const goalEvent: MatchEvent = {
                                        minute: nextM,
                                        type: 'GOAL',
                                        description: `GOOOOL! ${taker.name} penaltıdan affetmedi!`,
                                        teamName: penaltyTeam.name,
                                        scorer: taker.name,
                                        assist: 'Penaltı'
                                    };
                                    setEvents(prev => [...prev, goalEvent]);
                                    playSound(GOAL_SOUND); 

                                    setStats(prev => {
                                        const s = {...prev};
                                        if(penaltyTeam.id === homeTeam.id) { s.homeShots++; s.homeShotsOnTarget++; }
                                        else { s.awayShots++; s.awayShotsOnTarget++; }
                                        return s;
                                    });

                                } else {
                                    const missEvent: MatchEvent = {
                                        minute: nextM,
                                        type: 'MISS',
                                        description: `KAÇTI! ${taker.name} penaltıdan yararlanamadı!`,
                                        teamName: penaltyTeam.name
                                    };
                                    setEvents(prev => [...prev, missEvent]);
                                    
                                    setStats(prev => {
                                        const s = {...prev};
                                        if(penaltyTeam.id === homeTeam.id) { s.homeShots++; }
                                        else { s.awayShots++; }
                                        return s;
                                    });
                                }

                            }, 2500);
                        }
                    }

                    if(event.type === 'GOAL') {
                        lastGoalRealTime.current = Date.now(); 
                        playSound(GOAL_SOUND); 

                        if(event.teamName === homeTeam.name) setHomeScore(s => s + 1);
                        else setAwayScore(s => s + 1);

                        if(event.varOutcome) {
                            setTimeout(() => {
                                setIsVarActive(true);
                                setVarMessage("Hakem VAR ile görüşüyor...");
                                playSound(WHISTLE_SOUND); 

                                setTimeout(() => {
                                    setIsVarActive(false);
                                    
                                    if(event.varOutcome === 'NO_GOAL') {
                                        if(event.teamName === homeTeam.name) setHomeScore(s => Math.max(0, s - 1));
                                        else setAwayScore(s => Math.max(0, s - 1));

                                        const cancelEvent: MatchEvent = {
                                            minute: nextM,
                                            description: `GOL İPTAL ❌ ${event.scorer}`,
                                            type: 'INFO',
                                            teamName: event.teamName
                                        };
                                        
                                        setEvents(prev => {
                                            const updated = [...prev];
                                            let foundIdx = -1;
                                            for(let i=updated.length-1; i>=0; i--) {
                                                const e = updated[i];
                                                if(e.type === 'GOAL' && e.teamName === event.teamName && e.scorer === event.scorer && e.minute === event.minute) {
                                                    foundIdx = i;
                                                    break;
                                                }
                                            }
                                            
                                            if(foundIdx !== -1) {
                                                updated[foundIdx] = { 
                                                    ...updated[foundIdx], 
                                                    type: 'OFFSIDE', 
                                                    description: updated[foundIdx].description + ' (İPTAL)'
                                                };
                                            }
                                            return [...updated, cancelEvent];
                                        });

                                        setStats(prev => {
                                            const s = {...prev};
                                            if(event.teamName === homeTeam.name) { s.homeShotsOnTarget--; }
                                            else { s.awayShotsOnTarget--; }
                                            return s;
                                        });

                                    } else {
                                        const confirmEvent: MatchEvent = {
                                            minute: nextM,
                                            description: `VAR İncelemesi Bitti: GOL GEÇERLİ! Santra yapılacak.`,
                                            type: 'INFO',
                                            teamName: event.teamName
                                        };
                                        setEvents(prev => [...prev, confirmEvent]);
                                    }
                                }, 3000);
                            }, 1000);
                        }
                    }

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
    }, [minute, isTacticsOpen, phase, speed, isVarActive, isPenaltyActive, events, liveHomeTeam, liveAwayTeam, homeSubsUsed, awaySubsUsed, forcedSubstitutionPlayerId]);

    const liveScores = { homeId: homeTeam.id, awayId: awayTeam.id, homeScore, awayScore };
    
    // --- DEEP OBJECTION & DISCIPLINE SYSTEM ---
    const handleObjection = () => {
         if (managerDiscipline === 'RED') return; 

         const lastEvent = events[events.length - 1];

         if (lastEvent && lastEvent.type === 'GOAL' && lastEvent.teamName === myTeamCurrent.name) {
             return;
         }
         
         const now = Date.now();
         const isOpponentGoal = lastEvent && lastEvent.type === 'GOAL' && lastEvent.teamName !== myTeamCurrent.name;
         const isWithinTime = (now - lastGoalRealTime.current) <= 2000;

         setEvents(prev => [...prev, {
             minute,
             description: "Teknik direktör karara itiraz ediyor...",
             type: 'INFO',
             teamName: myTeamCurrent.name
         }]);

         if (isOpponentGoal && isWithinTime) {
             if (Math.random() <= 0.70) {
                 setIsVarActive(true);
                 setVarMessage("Hakem yoğun itirazlar üzerine pozisyonu izlemeye gidiyor...");
                 playSound(WHISTLE_SOUND);

                 setTimeout(() => {
                     setIsVarActive(false);
                     
                     if (Math.random() < 0.30) {
                         const cancelEvent: MatchEvent = {
                             minute,
                             description: "GOL İPTAL ❌",
                             type: 'INFO',
                             teamName: myTeamCurrent.name
                         };
                         
                         setEvents(prev => {
                             const updated = [...prev];
                             let foundIdx = -1;
                             for(let i=updated.length-1; i>=0; i--) {
                                 if(updated[i].type === 'GOAL' && updated[i].teamName === lastEvent.teamName) {
                                     foundIdx = i;
                                     break;
                                 }
                             }

                             if(foundIdx !== -1) {
                                updated[foundIdx] = {
                                    ...updated[foundIdx],
                                    type: 'OFFSIDE', 
                                    description: updated[foundIdx].description + ' (İPTAL)'
                                };
                             }
                             return [...updated, cancelEvent];
                         });
                         
                         if (lastEvent.teamName === homeTeam.name) setHomeScore(s => Math.max(0, s - 1));
                         else setAwayScore(s => Math.max(0, s - 1));

                         setStats(prev => {
                             const s = {...prev};
                             if(lastEvent.teamName === homeTeam.name) {
                                 s.homeShotsOnTarget = Math.max(0, s.homeShotsOnTarget - 1);
                                 s.homeShots = Math.max(0, s.homeShots - 1);
                             } else {
                                 s.awayShotsOnTarget = Math.max(0, s.awayShotsOnTarget - 1);
                                 s.awayShots = Math.max(0, s.awayShots - 1);
                             }
                             return s;
                         });

                     } else {
                         const standEvent: MatchEvent = {
                             minute,
                             description: "VAR: GOL GEÇERLİ",
                             type: 'INFO',
                             teamName: lastEvent.teamName
                         };
                         setEvents(prev => [...prev, standEvent]);

                         if (managerDiscipline === 'YELLOW') {
                             setManagerDiscipline('RED');
                             setStats(s => ({ ...s, managerCards: 'RED' }));
                             setEvents(prev => [...prev, {
                                 minute,
                                 description: "İKİNCİ SARI'dan KIRMIZI KART!",
                                 type: 'CARD_RED',
                                 teamName: myTeamCurrent.name
                             }]);
                             setIsTacticsOpen(false); 
                         } else {
                             setManagerDiscipline('YELLOW');
                             setStats(s => ({ ...s, managerCards: 'YELLOW' }));
                             setEvents(prev => [...prev, {
                                 minute,
                                 description: "Hakem VAR incelemesi sonrası haksız itiraz nedeniyle teknik direktöre SARI KART gösterdi.",
                                 type: 'CARD_YELLOW',
                                 teamName: myTeamCurrent.name
                             }]);
                         }
                     }
                 }, 3000);
             } else {
                 const ignoreEvent: MatchEvent = {
                    minute,
                    description: "Hakem itirazları dinlemedi.",
                    type: 'INFO'
                 };
                 setEvents(prev => [...prev, ignoreEvent]);
             }
         } else {
             escalateDiscipline();
         }
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
             if (roll < 0.6) { 
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
             setIsTacticsOpen(false); 
         }
    };

    const isOwnGoal = events.length > 0 && events[events.length-1].type === 'GOAL' && events[events.length-1].teamName === myTeamCurrent.name;
    const isManagerSentOff = managerDiscipline === 'RED';
    const activePenaltyTeam = penaltyTeamId ? allTeams.find(t => t.id === penaltyTeamId) : null;

    const forcedPlayer = forcedSubstitutionPlayerId ? myTeamCurrent.players.find(p => p.id === forcedSubstitutionPlayerId) : null;

    return (
        <div className="h-full flex flex-col relative">
            {/* TACTICS OVERLAY */}
            {isTacticsOpen && (
                <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl md:text-2xl font-bold text-white">Canlı Taktik</h2>
                            {forcedSubstitutionPlayerId && (
                                <div className="bg-red-600 text-white px-2 py-1 md:px-4 md:py-1 rounded-full text-xs md:text-sm font-bold animate-pulse flex items-center gap-2">
                                    <Syringe size={16}/> <span className="uppercase">{forcedPlayer ? `SAKATLIK: ${forcedPlayer.name}` : 'SAKATLIK!'}</span>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => setIsTacticsOpen(false)} 
                            disabled={!!forcedSubstitutionPlayerId}
                            className={`px-4 py-2 rounded font-bold flex items-center gap-2 transition-all ${forcedSubstitutionPlayerId ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                        >
                             <PlayCircle size={20}/> <span className="hidden md:inline">MAÇA DÖN</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        <TacticsView 
                            team={myTeamCurrent} 
                            setTeam={handleTacticsUpdate}
                            isMatchActive={true}
                            subsUsed={userIsHome ? homeSubsUsed : awaySubsUsed}
                            maxSubs={5}
                            onSubstitution={handleUserSubstitution}
                            currentMinute={minute}
                            compact={window.innerWidth < 768}
                            forcedSubstitutionPlayerId={forcedSubstitutionPlayerId}
                        />
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

            {/* PENALTY OVERLAY */}
            {isPenaltyActive && (
                <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-slate-900 p-10 rounded-xl border-4 border-green-600 text-center shadow-2xl shadow-green-900/50 animate-in zoom-in duration-300 flex flex-col items-center">
                        <div className="flex justify-center mb-6">
                            <Target size={100} className="text-green-500 animate-pulse"/>
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-6 tracking-widest uppercase">PENALTI!</h2>
                        
                        {activePenaltyTeam && (
                            <div className="bg-white text-black px-6 py-3 rounded-full font-bold mb-6 flex items-center gap-3 animate-bounce shadow-lg">
                                {activePenaltyTeam.logo ? (
                                    <img src={activePenaltyTeam.logo} alt="" className="w-8 h-8 object-contain"/>
                                ) : (
                                    <div className={`w-8 h-8 rounded-full ${activePenaltyTeam.colors[0]}`} />
                                )}
                                <span className="uppercase tracking-wide">{activePenaltyTeam.name} Kullanıyor</span>
                            </div>
                        )}

                        <p className="text-green-400 text-2xl font-mono font-bold">{penaltyMessage}</p>
                    </div>
                </div>
            )}

            {/* Scoreboard - Responsive */}
            <div className="bg-black text-white p-2 md:p-4 border-b border-slate-800 flex items-center justify-between shrink-0 h-24 md:h-32">
                {/* Home Team */}
                <div className="flex items-center gap-2 md:gap-4 w-1/3">
                    <img src={homeTeam.logo} className="w-10 h-10 md:w-16 md:h-16 object-contain" />
                    <div className="flex flex-col">
                        <span className="text-sm md:text-3xl font-bold truncate block">{homeTeam.name}</span>
                        {homeRedCards > 0 && (
                            <div className="flex gap-1 mt-1">
                                {[...Array(homeRedCards)].map((_, i) => (
                                    <div key={i} className="w-2 h-3 md:w-3 md:h-4 bg-red-600 rounded-[1px] border border-white/50 shadow-md" title="Kırmızı Kart" />
                                ))}
                            </div>
                        )}
                        <span className="text-[10px] md:text-xs text-slate-500 mt-1">Değişiklik: {homeSubsUsed}/5</span>
                    </div>
                </div>
                
                {/* Score & Time */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="text-3xl md:text-5xl font-mono font-bold bg-slate-900 px-4 md:px-8 py-1 md:py-2 rounded border border-slate-700 tracking-widest shadow-lg shadow-black whitespace-nowrap">
                        {homeScore} - {awayScore}
                    </div>
                    <div className="mt-1 md:mt-2 text-red-500 font-bold animate-pulse flex items-center gap-1 md:gap-2 text-base md:text-xl">
                        <Timer size={16} className="md:w-5 md:h-5"/> {minute}'
                    </div>
                </div>
                
                {/* Away Team */}
                <div className="flex items-center gap-2 md:gap-4 w-1/3 justify-end">
                    <div className="flex flex-col items-end">
                        <span className="text-sm md:text-3xl font-bold truncate block text-right">{awayTeam.name}</span>
                        {awayRedCards > 0 && (
                            <div className="flex gap-1 mt-1">
                                {[...Array(awayRedCards)].map((_, i) => (
                                    <div key={i} className="w-2 h-3 md:w-3 md:h-4 bg-red-600 rounded-[1px] border border-white/50 shadow-md" title="Kırmızı Kart" />
                                ))}
                            </div>
                        )}
                        <span className="text-[10px] md:text-xs text-slate-500 mt-1">Değişiklik: {awaySubsUsed}/5</span>
                    </div>
                    <img src={awayTeam.logo} className="w-10 h-10 md:w-16 md:h-16 object-contain" />
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                {/* LEFT: Pitch (Visual) - Hidden on Mobile to prioritize Events */}
                <div className="w-1/3 hidden lg:block bg-green-900 border-r border-slate-800 relative">
                     <PitchVisual players={myTeamCurrent.players} onPlayerClick={() => {}} selectedPlayerId={null}/>
                </div>

                {/* Mobile Tabs */}
                <div className="md:hidden flex border-b border-slate-700 bg-slate-800 shrink-0">
                    <button 
                        onClick={() => setMobileTab('FEED')}
                        className={`flex-1 py-3 text-center font-bold text-sm flex items-center justify-center gap-2 ${mobileTab === 'FEED' ? 'text-white bg-slate-700 border-b-2 border-white' : 'text-slate-400'}`}
                    >
                        <List size={16}/> Maç Akışı
                    </button>
                    <button 
                        onClick={() => setMobileTab('STATS')}
                        className={`flex-1 py-3 text-center font-bold text-sm flex items-center justify-center gap-2 ${mobileTab === 'STATS' ? 'text-white bg-slate-700 border-b-2 border-white' : 'text-slate-400'}`}
                    >
                        <BarChart2 size={16}/> İstatistik & Taktik
                    </button>
                </div>

                {/* CENTER: Events & Controls */}
                <div className={`flex-1 bg-slate-900 flex flex-col relative border-r border-slate-800 w-full ${mobileTab === 'STATS' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="bg-slate-800 p-2 text-center text-xs text-slate-500 font-bold uppercase tracking-widest border-b border-slate-700">Maç Merkezi</div>
                    <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3" ref={scrollRef}>
                        {events.map((e, i) => {
                            const eventTeam = allTeams.find(t => t.name === e.teamName);
                            
                            // Base styling defaults
                            let borderClass = 'border-slate-600';
                            let bgClass = 'bg-slate-800';
                            
                            // Determine Color Logic
                            let activeColorClass = 'bg-slate-500'; // fallback
                            let activeTextClass = 'text-white';
                            
                            // Check if this is a high impact event that requires special styling (Team Gradient)
                            const isHighImpactEvent = ['GOAL', 'INJURY', 'CARD_RED'].includes(e.type);

                            if (eventTeam) {
                                if (isHighImpactEvent) {
                                    // SPECIAL STYLING: GRADIENT BACKGROUND + BLACK TEXT
                                    const fromColor = eventTeam.colors[0].replace('bg-', 'from-'); // e.g. from-red-600
                                    const toColor = eventTeam.colors[1].replace('text-', 'to-');   // e.g. to-white or to-yellow-400
                                    
                                    bgClass = `bg-gradient-to-r ${fromColor} ${toColor}`;
                                    borderClass = 'border-black'; 
                                    activeTextClass = 'text-black font-bold'; // Force black text for high impact events
                                    activeColorClass = ''; // Reset standard badge color since we are coloring the box
                                } else {
                                    // STANDARD STYLING
                                    // Conflict Resolution: If both teams are RED, Away uses secondary color.
                                    const isHome = eventTeam.id === homeTeam.id;
                                    const conflict = homeTeam.colors[0] === awayTeam.colors[0];

                                    if (!isHome && conflict) {
                                        const secColor = eventTeam.colors[1]; 
                                        activeColorClass = secColor.replace('text-', 'bg-');
                                    } else {
                                        activeColorClass = eventTeam.colors[0];
                                    }

                                    // Handle very dark colors
                                    if (activeColorClass.includes('black') || activeColorClass.includes('slate-900')) {
                                        activeColorClass = 'bg-slate-200';
                                    }
                                    
                                    borderClass = activeColorClass.replace('bg-', 'border-');

                                    // Calculate Background Tint
                                    if (activeColorClass.includes('white') || activeColorClass.includes('slate-100') || activeColorClass.includes('gray-100') || activeColorClass.includes('slate-200')) {
                                         bgClass = 'bg-slate-200/10';
                                    } else {
                                        let darkBg = activeColorClass.replace('400', '900').replace('500', '900').replace('600', '900').replace('700', '950').replace('800', '950');
                                        if(darkBg === activeColorClass && !activeColorClass.includes('900')) darkBg = 'bg-slate-900';
                                        bgClass = `${darkBg}/40`;
                                    }

                                    const isLightBg = activeColorClass.includes('white') || activeColorClass.includes('yellow') || activeColorClass.includes('cyan') || activeColorClass.includes('lime') || activeColorClass.includes('slate-200');
                                    activeTextClass = isLightBg ? 'text-black' : 'text-white';
                                }
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

                            // Specific Styling for Substitutions
                            if (e.type === 'SUBSTITUTION') {
                                bgClass = 'bg-green-900/40';
                                borderClass = 'border-green-500';
                            }

                            return (
                                <div key={i} className={`p-2 md:p-3 rounded border-l-4 animate-in fade-in slide-in-from-bottom-2 ${bgClass} ${borderClass}`}>
                                    <div className="flex items-start gap-3">
                                        <span className={`font-mono font-bold min-w-[25px] md:min-w-[30px] ${isHighImpactEvent ? 'text-black' : 'text-slate-400'}`}>{e.minute}'</span>
                                        <div className="flex-1">
                                            {e.type === 'GOAL' ? (
                                                <>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {eventTeam?.logo ? (
                                                            <img src={eventTeam.logo} className="w-8 h-8 md:w-10 md:h-10 object-contain bg-white rounded-full p-1 shadow-sm" alt="" />
                                                        ) : (
                                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm border-2 border-white ${eventTeam?.colors[0]}`}>
                                                                {eventTeam?.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className={`font-bold inline-block px-2 py-0.5 md:px-3 md:py-1 rounded text-lg md:text-xl tracking-widest ${isHighImpactEvent ? 'bg-black text-white' : `${activeColorClass} ${activeTextClass}`}`}>
                                                            GOOOOL!
                                                        </span>
                                                    </div>
                                                    <span className={`${activeTextClass} block mt-1 text-base md:text-lg font-bold`}>{e.description.replace('GOOOOL!', '').trim()}</span>
                                                    {e.assist && (
                                                        <span className={`${isHighImpactEvent ? 'text-black opacity-75' : 'text-blue-300'} text-xs block mt-1 font-bold`}>Asist: {e.assist}</span>
                                                    )}
                                                </>
                                            ) : (
                                                <div className={`text-sm ${isHighImpactEvent ? 'text-black font-bold' : 'text-slate-200'} flex items-center flex-wrap gap-2`}>
                                                    {e.type === 'SUBSTITUTION' && eventTeam && (
                                                        <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded text-white ${eventTeam.id === homeTeam.id ? 'bg-blue-600' : 'bg-red-600'}`}>
                                                            {eventTeam.name}
                                                        </span>
                                                    )}
                                                    
                                                    {e.type === 'CARD_YELLOW' && (
                                                        <span className="inline-block w-2.5 h-3.5 bg-yellow-500 border border-yellow-600 rounded-[1px] shadow-sm"></span>
                                                    )}
                                                    {e.type === 'INJURY' && (
                                                        <AlertCircle size={16} className="inline-block text-red-700" />
                                                    )}
                                                    {e.type === 'SUBSTITUTION' && (
                                                        <RefreshCw size={16} className="inline-block text-green-400" />
                                                    )}
                                                    <span>{e.description}</span>
                                                </div>
                                            )}
                                            
                                            {e.description.includes('(İPTAL)') && <span className="bg-red-600 text-white px-2 py-1 rounded font-bold inline-block mt-1 text-xs">GOL İPTAL EDİLDİ!</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Controls */}
                    <div className="p-2 md:p-4 bg-slate-800 border-t border-slate-700 flex flex-col gap-2 md:gap-4">
                         <div className="flex justify-between items-center">
                             <div className="flex gap-1 md:gap-2">
                                 {[1, 2, 4].map(s => (
                                     <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 md:px-3 rounded text-xs font-bold ${speed === s ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{s}x</button>
                                 ))}
                             </div>
                             
                             {phase === 'FULL_TIME' ? (
                                 <button onClick={() => onFinish(homeScore, awayScore, events, stats)} className="bg-red-600 hover:bg-red-500 text-white px-4 md:px-6 py-2 rounded font-bold animate-pulse text-sm md:text-base">
                                     MAÇI BİTİR
                                 </button>
                             ) : phase === 'HALFTIME' ? (
                                 <div className="flex gap-2 md:gap-4 items-center">
                                    {isManagerSentOff && (
                                        <div className="hidden md:flex items-center gap-2 text-xs bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded">
                                            <Lock size={14} />
                                            <span className="font-bold">CEZALI</span>
                                        </div>
                                    )}
                                    <button 
                                        disabled={isManagerSentOff}
                                        onClick={() => setIsTacticsOpen(true)} 
                                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded text-white text-xs md:text-sm font-bold transition-all ${isManagerSentOff ? 'bg-slate-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                                    >
                                        SOYUNMA ODASI
                                    </button>
                                    <button onClick={() => setPhase('SECOND_HALF')} className="bg-green-600 px-3 py-1.5 md:px-4 md:py-2 rounded text-white text-xs md:text-sm font-bold">2. YARI</button>
                                 </div>
                             ) : (
                                 <div className="flex gap-2 items-center">
                                     {managerDiscipline === 'RED' ? (
                                         <div className="bg-red-600/20 border border-red-500 text-red-500 px-2 py-1 md:px-6 md:py-3 rounded font-bold text-xs md:text-sm flex items-center gap-1 md:gap-2 animate-pulse shadow-inner">
                                             <AlertOctagon size={16} className="md:w-6 md:h-6"/> 
                                             <span>TRİBÜNDESİNİZ</span>
                                         </div>
                                     ) : (
                                        <>
                                            <button 
                                                onClick={handleObjection}
                                                disabled={isOwnGoal}
                                                className={`text-white px-2 py-1.5 md:px-4 md:py-2 rounded font-bold flex items-center gap-1 md:gap-2 text-xs md:text-sm border shadow-inner transition active:scale-95 ${managerDiscipline === 'YELLOW' ? 'bg-orange-700 hover:bg-orange-600 border-orange-500' : 'bg-slate-700 hover:bg-slate-600 border-slate-500'} ${isOwnGoal ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Megaphone size={14} className="md:w-4 md:h-4"/> {managerDiscipline === 'YELLOW' ? 'İTİRAZ (RİSK)' : 'İTİRAZ'}
                                            </button>
                                            <button onClick={() => setIsTacticsOpen(true)} className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1.5 md:px-4 md:py-2 rounded font-bold flex items-center gap-1 md:gap-2 shadow-lg shadow-yellow-900/50 text-xs md:text-sm">
                                                <Settings size={14} className="md:w-4 md:h-4"/> TAKTİK
                                            </button>
                                        </>
                                     )}
                                 </div>
                             )}
                         </div>
                    </div>
                </div>

                {/* RIGHT: Live Stats & Table (Visible on Desktop OR when Mobile Tab is STATS) */}
                <div className={`w-full md:w-1/4 flex-col bg-slate-800 ${mobileTab === 'STATS' ? 'flex' : 'hidden md:flex'}`}>
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
                    {/* UPDATED BOTTOM RIGHT SECTION: QUICK MENTALITY SELECTOR */}
                    <div className="h-1/2 flex flex-col border-t border-slate-700 min-h-[250px]">
                        <div className="p-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Zap size={14}/> Hızlı Oyun Anlayışı
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-800 custom-scrollbar">
                            {Object.values(Mentality).map((m) => {
                                const isActive = myTeamCurrent.mentality === m;
                                return (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            const updated = { ...myTeamCurrent, mentality: m };
                                            handleTacticsUpdate(updated);
                                        }}
                                        className={`w-full py-3 px-4 rounded-lg text-xs font-bold text-left transition-all flex items-center justify-between border ${
                                            isActive 
                                            ? 'bg-yellow-500 text-black border-yellow-400 shadow-md transform scale-[1.02]' 
                                            : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-600 hover:border-slate-500 hover:text-white'
                                        }`}
                                    >
                                        {m}
                                        {isActive && <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchSimulation;
