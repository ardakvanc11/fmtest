
import React, { useState, useRef, useEffect } from 'react';
import { Team, MatchEvent, MatchStats, Position, Player, Mentality } from '../types';
import { simulateMatchStep, getEmptyMatchStats } from '../utils/gameEngine';
import MatchPitch2D from '../components/match/MatchPitch2D'; // NEW IMPORT
import { Timer, AlertOctagon, Megaphone, Settings, PlayCircle, Zap, BarChart2, List, Lock } from 'lucide-react';
import { MatchScoreboard, MatchOverlays, MatchEventFeed } from '../components/match/MatchUI';

const GOAL_SOUND = '/voices/goalsound.wav';
const WHISTLE_SOUND = '/voices/whistle.wav';

const MatchSimulation = ({ homeTeam, awayTeam, userTeamId, onFinish, allTeams, fixtures, managerTrust }: { homeTeam: Team, awayTeam: Team, userTeamId: string, onFinish: (h: number, a: number, events: MatchEvent[], stats: MatchStats) => void, allTeams: Team[], fixtures: any[], managerTrust: number }) => {
    const [minute, setMinute] = useState(0);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [stats, setStats] = useState<MatchStats>(getEmptyMatchStats());
    const [speed, setSpeed] = useState(1); 
    const [phase, setPhase] = useState<'FIRST_HALF' | 'HALFTIME' | 'SECOND_HALF' | 'FULL_TIME'>('FIRST_HALF');
    const [isTacticsOpen, setIsTacticsOpen] = useState(false);
    
    const [liveHomeTeam, setLiveHomeTeam] = useState(homeTeam);
    const [liveAwayTeam, setLiveAwayTeam] = useState(awayTeam);
    const [homeSubsUsed, setHomeSubsUsed] = useState(0);
    const [awaySubsUsed, setAwaySubsUsed] = useState(0);

    const [isVarActive, setIsVarActive] = useState(false);
    const [varMessage, setVarMessage] = useState<string>('');
    const [isPenaltyActive, setIsPenaltyActive] = useState(false);
    const [penaltyMessage, setPenaltyMessage] = useState<string>('');
    const [penaltyTeamId, setPenaltyTeamId] = useState<string | null>(null);
    const [managerDiscipline, setManagerDiscipline] = useState<'NONE' | 'WARNED' | 'YELLOW' | 'RED'>('NONE');
    const [forcedSubstitutionPlayerId, setForcedSubstitutionPlayerId] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<'FEED' | 'STATS'>('FEED');

    // --- 2D ENGINE STATE ---
    const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 }); // 0-100%
    const [possessionTeamId, setPossessionTeamId] = useState<string | null>(null);
    const [lastActionText, setLastActionText] = useState("");

    const isSabotageActive = managerTrust < 30;
    const [sabotageTriggered, setSabotageTriggered] = useState(false);

    const userIsHome = homeTeam.id === userTeamId;
    const [myTeamCurrent, setMyTeamCurrent] = useState(userIsHome ? liveHomeTeam : liveAwayTeam); 

    useEffect(() => { setMyTeamCurrent(userIsHome ? liveHomeTeam : liveAwayTeam); }, [liveHomeTeam, liveAwayTeam, userIsHome]);

    const lastGoalRealTime = useRef<number>(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef(stats);
    useEffect(() => { statsRef.current = stats; }, [stats]);
    useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [events]);

    const homeRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === homeTeam.name).length;
    const awayRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === awayTeam.name).length;

    const playSound = (path: string) => { const audio = new Audio(path); audio.volume = 0.6; audio.play().catch(e => console.warn("Audio play failed:", e)); };

    const handleUserSubstitution = (inPlayer: Player, outPlayer: Player) => {
        const teamName = myTeamCurrent.name;
        const event: MatchEvent = { minute, type: 'SUBSTITUTION', description: `${outPlayer.name} 🔄 ${inPlayer.name}`, teamName: teamName };
        setEvents(prev => [...prev, event]);
        if (forcedSubstitutionPlayerId && outPlayer.id === forcedSubstitutionPlayerId) setForcedSubstitutionPlayerId(null);
        if (userIsHome) { setHomeSubsUsed(h => h + 1); setLiveHomeTeam(myTeamCurrent); } else { setAwaySubsUsed(a => a + 1); setLiveAwayTeam(myTeamCurrent); }
    };

    const handleTacticsUpdate = (updatedTeam: Team) => {
        setMyTeamCurrent(updatedTeam);
        if (userIsHome) setLiveHomeTeam(updatedTeam); else setLiveAwayTeam(updatedTeam);
    };

    const getSimulateTeams = () => {
        let simHome = liveHomeTeam;
        let simAway = liveAwayTeam;
        if (isSabotageActive) {
            const debuffFactor = 0.75;
            if (userIsHome) {
                const sabotagedPlayers = simHome.players.map(p => ({ ...p, morale: 0 }));
                simHome = { ...simHome, players: sabotagedPlayers, strength: Math.floor(simHome.strength * debuffFactor) };
            } else {
                const sabotagedPlayers = simAway.players.map(p => ({ ...p, morale: 0 }));
                simAway = { ...simAway, players: sabotagedPlayers, strength: Math.floor(simAway.strength * debuffFactor) };
            }
        }
        return { simHome, simAway };
    };

    // --- 2D BALL MOVEMENT LOGIC ---
    // Runs frequently to animate ball between major events
    useEffect(() => {
        if(isTacticsOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || isVarActive || isPenaltyActive) return;
        
        const tickRate = 800 / speed; // Update visual every ~0.8s adjusted by speed
        
        const visualInterval = setInterval(() => {
            setBallPosition(prev => {
                const { simHome, simAway } = getSimulateTeams();
                
                // Determine dominance
                const hStr = simHome.strength * (1 + (stats.homePossession - 50)/100);
                const aStr = simAway.strength * (1 + (stats.awayPossession - 50)/100);
                const totalStr = hStr + aStr;
                const homeProb = hStr / totalStr;
                
                // Randomly switch possession based on dominance
                let currentTeam = possessionTeamId === homeTeam.id ? 'HOME' : 'AWAY';
                if (Math.random() < 0.2) { // 20% chance to switch possession naturally
                    const roll = Math.random();
                    if (roll < homeProb) {
                        currentTeam = 'HOME';
                        setPossessionTeamId(homeTeam.id);
                    } else {
                        currentTeam = 'AWAY';
                        setPossessionTeamId(awayTeam.id);
                    }
                }

                // Move ball towards goal based on current possession team
                // Home Goal is at Y=0, Away Goal is at Y=100
                // Home Attacks UP (Target Y=100), Away Attacks DOWN (Target Y=0)
                
                let targetY = 50;
                let targetX = 50;
                let action = "";

                if (currentTeam === 'HOME') {
                    // Attacking towards Y=100
                    const progress = Math.random(); 
                    targetY = prev.y + (progress * 15); // Move forward 0-15%
                    targetX = Math.max(10, Math.min(90, prev.x + (Math.random() * 20 - 10))); // Move side-to-side
                    
                    if (targetY > 80) action = "Hücumda";
                    else if (targetY > 40) action = "Orta Saha";
                    else action = "Savunmadan Çıkıyor";
                } else {
                    // Attacking towards Y=0
                    const progress = Math.random(); 
                    targetY = prev.y - (progress * 15); // Move forward (down) 0-15%
                    targetX = Math.max(10, Math.min(90, prev.x + (Math.random() * 20 - 10)));

                    if (targetY < 20) action = "Hücumda";
                    else if (targetY < 60) action = "Orta Saha";
                    else action = "Savunmadan Çıkıyor";
                }

                // Clamp
                targetY = Math.max(5, Math.min(95, targetY));
                
                setLastActionText(action);
                return { x: targetX, y: targetY };
            });
        }, tickRate);

        return () => clearInterval(visualInterval);
    }, [isTacticsOpen, phase, speed, isVarActive, isPenaltyActive, possessionTeamId, stats.homePossession]);


    // --- MAIN GAME LOOP (Minutes & Events) ---
    useEffect(() => {
        if(isTacticsOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || isVarActive || isPenaltyActive) return;
        const interval = setInterval(() => {
            setMinute(m => {
                const nextM = m + 1;
                
                // ... (Sabotage Logic kept same) ...
                if (isSabotageActive && !sabotageTriggered && nextM === 10) {
                    setSabotageTriggered(true);
                    setEvents(prev => [...prev, { minute: nextM, type: 'INFO', description: "⚠️ DİKKAT: Oyuncular sahada isteksiz görünüyor. Menajere olan tepkileri oyuna yansıyor!", teamName: myTeamCurrent.name }]);
                }

                if (nextM === 45 && phase === 'FIRST_HALF') { setPhase('HALFTIME'); playSound(WHISTLE_SOUND); return 45; }
                if (nextM >= 90 && phase === 'SECOND_HALF') { setPhase('FULL_TIME'); playSound(WHISTLE_SOUND); return 90; }

                // ... (AI Substitution Logic kept same) ...
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
                        let inPlayer = benchPlayers.find(p => p.position === outPlayer.position) || benchPlayers[0]; 
                        if (inPlayer && outPlayer) {
                            const newPlayers = [...aiTeam.players];
                            const idxOut = newPlayers.findIndex(p => p.id === outPlayer.id);
                            const idxIn = newPlayers.findIndex(p => p.id === inPlayer.id);
                            if (idxOut !== -1 && idxIn !== -1) {
                                [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
                                setAiTeam({ ...aiTeam, players: newPlayers });
                                setAiSubs(s => s + 1);
                                setEvents(prev => [...prev, { minute: nextM, type: 'SUBSTITUTION', description: `${outPlayer.name} 🔄 ${inPlayer.name}`, teamName: aiTeam.name }]);
                            }
                        }
                    }
                }

                const { simHome, simAway } = getSimulateTeams();
                const event = simulateMatchStep(nextM, simHome, simAway, {h: homeScore, a: awayScore}, events);
                
                if(event) {
                    setEvents(prev => [...prev, event]);
                    
                    // --- VISUAL SYNC FOR EVENTS ---
                    if (event.type === 'GOAL') {
                        // Move ball to goal net
                        const isHomeGoal = event.teamName === homeTeam.name;
                        setPossessionTeamId(event.teamName === homeTeam.name ? homeTeam.id : awayTeam.id);
                        setBallPosition({ x: 50, y: isHomeGoal ? 98 : 2 }); // Home attacks UP (98), Away attacks DOWN (2)
                        setLastActionText("GOL!");
                        // Then reset to center after delay (handled by next ticks naturally as possession resets)
                        setTimeout(() => setBallPosition({ x: 50, y: 50 }), 2000);
                    } else if (event.type === 'SAVE' || event.type === 'MISS') {
                        // Ball near goal but not in
                        const isHomeAttack = event.teamName === homeTeam.name;
                        setPossessionTeamId(isHomeAttack ? homeTeam.id : awayTeam.id); // Attacking team had it
                        setBallPosition({ x: Math.random() * 60 + 20, y: isHomeAttack ? 95 : 5 }); // Near goal line
                        setLastActionText(event.type === 'SAVE' ? "Kurtarış!" : "Dışarı!");
                    } else if (event.type === 'CORNER') {
                        const isHomeAttack = event.teamName === homeTeam.name;
                        const isLeftCorner = Math.random() > 0.5;
                        setBallPosition({ x: isLeftCorner ? 2 : 98, y: isHomeAttack ? 98 : 2 });
                        setLastActionText("Köşe Vuruşu");
                    }

                    if (event.type === 'CARD_RED') playSound(WHISTLE_SOUND);
                    
                    // --- INJURY HANDLING (UPDATED) ---
                    if (event.type === 'INJURY') {
                        const injuredTeamIsHome = event.teamName === liveHomeTeam.name;
                        
                        // 1. Identify team based on closure state
                        let teamObj = injuredTeamIsHome ? liveHomeTeam : liveAwayTeam;
                        
                        // 2. Mark the player as injured in a new object immediately
                        const updatedPlayersWithInjury = teamObj.players.map(p => {
                            if (p.id === event.playerId) {
                                return {
                                    ...p,
                                    condition: 0, // Drop condition
                                    injury: {
                                        type: 'Sakatlık', // Generic for visual
                                        daysRemaining: 1, // Just needs to be > 0 for visual
                                        description: event.description
                                    }
                                };
                            }
                            return p;
                        });
                        
                        let updatedTeamObj = { ...teamObj, players: updatedPlayersWithInjury };

                        // 3. Handle AI Substitution Logic immediately on this updated object
                        const isAiInjury = (injuredTeamIsHome && !userIsHome) || (!injuredTeamIsHome && userIsHome);
                        
                        if (isAiInjury) {
                            const currentSubs = injuredTeamIsHome ? homeSubsUsed : awaySubsUsed;
                            const setSubFn = injuredTeamIsHome ? setHomeSubsUsed : setAwaySubsUsed;
                            
                            if (currentSubs < 5) {
                                const injuredPlayer = updatedTeamObj.players.find(p => p.id === event.playerId);
                                const benchPlayers = updatedTeamObj.players.slice(11, 18);
                                let subIn = benchPlayers.find(p => p.position === injuredPlayer?.position) || benchPlayers[0];
                                
                                if (injuredPlayer && subIn) {
                                    const newPlayers = [...updatedTeamObj.players];
                                    const idxOut = newPlayers.findIndex(p => p.id === injuredPlayer.id);
                                    const idxIn = newPlayers.findIndex(p => p.id === subIn.id);
                                    
                                    if(idxOut !== -1 && idxIn !== -1) {
                                        [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
                                        updatedTeamObj = { ...updatedTeamObj, players: newPlayers };
                                        
                                        setSubFn(s => s + 1);
                                        setEvents(prev => [...prev, { minute: nextM, type: 'SUBSTITUTION', description: `Zorunlu Değişiklik: ${injuredPlayer.name} 🔄 ${subIn!.name}`, teamName: updatedTeamObj.name }]);
                                    }
                                }
                            }
                        } else {
                            // User Logic: Just trigger the modal, user will see the injured icon
                            if (event.playerId) { 
                                setForcedSubstitutionPlayerId(event.playerId); 
                                setIsTacticsOpen(true); 
                            }
                        }

                        // 4. Commit the State Update
                        if (injuredTeamIsHome) {
                            setLiveHomeTeam(updatedTeamObj);
                            if (userIsHome) setMyTeamCurrent(updatedTeamObj);
                        } else {
                            setLiveAwayTeam(updatedTeamObj);
                            if (!userIsHome) setMyTeamCurrent(updatedTeamObj);
                        }
                    }

                    // ... (Penalty Handling kept same) ...
                    if (event.type === 'CARD_YELLOW') {
                        const isHomeFoul = event.teamName === homeTeam.name;
                        const attackingPossession = isHomeFoul ? statsRef.current.awayPossession : statsRef.current.homePossession;
                        let penaltyChance = attackingPossession >= 70 ? 0.14 : attackingPossession >= 60 ? 0.10 : 0.08;
                        if (Math.random() < penaltyChance) {
                            setIsPenaltyActive(true); playSound(WHISTLE_SOUND); const penaltyTeam = isHomeFoul ? liveAwayTeam : liveHomeTeam; setPenaltyTeamId(penaltyTeam.id);
                            const xi = penaltyTeam.players.slice(0, 11); const taker = xi.reduce((prev, current) => (prev.stats.finishing > current.stats.finishing) ? prev : current);
                            setPenaltyMessage(`${taker.name} topun başında...`);
                            
                            // Visual: Penalty Spot
                            setBallPosition({ x: 50, y: penaltyTeam.id === homeTeam.id ? 88 : 12 }); // Penalty spots approx
                            
                            setTimeout(() => {
                                setIsPenaltyActive(false); setPenaltyTeamId(null);
                                const isGoal = Math.random() < 0.70;
                                if (isGoal) {
                                    if(penaltyTeam.id === homeTeam.id) setHomeScore(s => s + 1); else setAwayScore(s => s + 1);
                                    lastGoalRealTime.current = Date.now();
                                    setEvents(prev => [...prev, { minute: nextM, type: 'GOAL', description: `GOOOOL! ${taker.name} penaltıdan affetmedi!`, teamName: penaltyTeam.name, scorer: taker.name, assist: 'Penaltı' }]);
                                    playSound(GOAL_SOUND); 
                                    setBallPosition({ x: 50, y: penaltyTeam.id === homeTeam.id ? 98 : 2 }); // Net
                                    setStats(prev => { const s = {...prev}; if(penaltyTeam.id === homeTeam.id) { s.homeShots++; s.homeShotsOnTarget++; } else { s.awayShots++; s.awayShotsOnTarget++; } return s; });
                                } else {
                                    setEvents(prev => [...prev, { minute: nextM, type: 'MISS', description: `KAÇTI! ${taker.name} penaltıdan yararlanamadı!`, teamName: penaltyTeam.name }]);
                                    setStats(prev => { const s = {...prev}; if(penaltyTeam.id === homeTeam.id) { s.homeShots++; } else { s.awayShots++; } return s; });
                                }
                            }, 2500);
                        }
                    }

                    // ... (Goal/VAR Handling kept same) ...
                    if(event.type === 'GOAL') {
                        lastGoalRealTime.current = Date.now(); playSound(GOAL_SOUND); 
                        if(event.teamName === homeTeam.name) setHomeScore(s => s + 1); else setAwayScore(s => s + 1);
                        if(event.varOutcome) {
                            setTimeout(() => {
                                setIsVarActive(true); setVarMessage("Hakem VAR ile görüşüyor..."); playSound(WHISTLE_SOUND); 
                                setTimeout(() => {
                                    setIsVarActive(false);
                                    if(event.varOutcome === 'NO_GOAL') {
                                        if(event.teamName === homeTeam.name) setHomeScore(s => Math.max(0, s - 1)); else setAwayScore(s => Math.max(0, s - 1));
                                        const cancelEvent: MatchEvent = { minute: nextM, description: `GOL İPTAL ❌ ${event.scorer}`, type: 'INFO', teamName: event.teamName };
                                        setEvents(prev => {
                                            const updated = [...prev]; let foundIdx = -1;
                                            for(let i=updated.length-1; i>=0; i--) { if(updated[i].type === 'GOAL' && updated[i].teamName === event.teamName && updated[i].scorer === event.scorer && updated[i].minute === event.minute) { foundIdx = i; break; } }
                                            if(foundIdx !== -1) { updated[foundIdx] = { ...updated[foundIdx], type: 'OFFSIDE', description: updated[foundIdx].description + ' (İPTAL)' }; }
                                            return [...updated, cancelEvent];
                                        });
                                        setStats(prev => { const s = {...prev}; if(event.teamName === homeTeam.name) { s.homeShotsOnTarget--; } else { s.awayShotsOnTarget--; } return s; });
                                    } else {
                                        setEvents(prev => [...prev, { minute: nextM, description: `VAR İncelemesi Bitti: GOL GEÇERLİ! Santra yapılacak.`, type: 'INFO', teamName: event.teamName }]);
                                    }
                                }, 3000);
                            }, 1000);
                        }
                    }
                    
                    // ... (Stats update kept same) ...
                    setStats(prev => {
                        const s = {...prev};
                        if(event.teamName === homeTeam.name) s.homePossession = Math.min(80, s.homePossession + 1); else s.awayPossession = Math.min(80, s.awayPossession + 1);
                        s.homePossession = Math.max(20, s.homePossession); s.awayPossession = 100 - s.homePossession;
                        if(event.type === 'GOAL' || event.type === 'MISS' || event.type === 'SAVE') { if(event.teamName === homeTeam.name) { s.homeShots++; if(event.type === 'GOAL' || event.type === 'SAVE') s.homeShotsOnTarget++; } else { s.awayShots++; if(event.type === 'GOAL' || event.type === 'SAVE') s.awayShotsOnTarget++; } }
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
    }, [minute, isTacticsOpen, phase, speed, isVarActive, isPenaltyActive, events, liveHomeTeam, liveAwayTeam, homeSubsUsed, awaySubsUsed, forcedSubstitutionPlayerId, isSabotageActive]);

    // ... (Objection logic kept same) ...
    const handleObjection = () => {
         if (managerDiscipline === 'RED') return; 
         const lastEvent = events[events.length - 1];
         if (lastEvent && lastEvent.type === 'GOAL' && lastEvent.teamName === myTeamCurrent.name) return;
         const now = Date.now();
         const isOpponentGoal = lastEvent && lastEvent.type === 'GOAL' && lastEvent.teamName !== myTeamCurrent.name;
         const isWithinTime = (now - lastGoalRealTime.current) <= 2000;
         setEvents(prev => [...prev, { minute, description: "Teknik direktör karara itiraz ediyor...", type: 'INFO', teamName: myTeamCurrent.name }]);
         if (isOpponentGoal && isWithinTime) {
             if (Math.random() <= 0.70) {
                 setIsVarActive(true); setVarMessage("Hakem yoğun itirazlar üzerine pozisyonu izlemeye gidiyor..."); playSound(WHISTLE_SOUND);
                 setTimeout(() => {
                     setIsVarActive(false);
                     if (Math.random() < 0.30) {
                         const cancelEvent: MatchEvent = { minute, description: "GOL İPTAL ❌", type: 'INFO', teamName: myTeamCurrent.name };
                         setEvents(prev => {
                             const updated = [...prev]; let foundIdx = -1;
                             for(let i=updated.length-1; i>=0; i--) { if(updated[i].type === 'GOAL' && updated[i].teamName === lastEvent.teamName) { foundIdx = i; break; } }
                             if(foundIdx !== -1) { updated[foundIdx] = { ...updated[foundIdx], type: 'OFFSIDE', description: updated[foundIdx].description + ' (İPTAL)' }; }
                             return [...updated, cancelEvent];
                         });
                         if (lastEvent.teamName === homeTeam.name) setHomeScore(s => Math.max(0, s - 1)); else setAwayScore(s => Math.max(0, s - 1));
                         setStats(prev => { const s = {...prev}; if(lastEvent.teamName === homeTeam.name) { s.homeShotsOnTarget = Math.max(0, s.homeShotsOnTarget - 1); s.homeShots = Math.max(0, s.homeShots - 1); } else { s.awayShotsOnTarget = Math.max(0, s.awayShotsOnTarget - 1); s.awayShots = Math.max(0, s.awayShots - 1); } return s; });
                     } else {
                         setEvents(prev => [...prev, { minute, description: "VAR: GOL GEÇERLİ", type: 'INFO', teamName: lastEvent.teamName }]);
                         if (managerDiscipline === 'YELLOW') {
                             setManagerDiscipline('RED'); setStats(s => ({ ...s, managerCards: 'RED' }));
                             setEvents(prev => [...prev, { minute, description: "İKİNCİ SARI'dan KIRMIZI KART!", type: 'CARD_RED', teamName: myTeamCurrent.name }]);
                             setIsTacticsOpen(false); 
                         } else {
                             setManagerDiscipline('YELLOW'); setStats(s => ({ ...s, managerCards: 'YELLOW' }));
                             setEvents(prev => [...prev, { minute, description: "Hakem VAR incelemesi sonrası haksız itiraz nedeniyle teknik direktöre SARI KART gösterdi.", type: 'CARD_YELLOW', teamName: myTeamCurrent.name }]);
                         }
                     }
                 }, 3000);
             } else { setEvents(prev => [...prev, { minute, description: "Hakem itirazları dinlemedi.", type: 'INFO' }]); }
         } else { escalateDiscipline(); }
    };

    const escalateDiscipline = (reasonOverride?: string) => {
         let newStatus = managerDiscipline;
         let desc = reasonOverride || "Hakem yedek kulübesine gelerek sözlü uyarıda bulundu.";
         let type: MatchEvent['type'] = 'INFO';
         const roll = Math.random();
         if (managerDiscipline === 'NONE') {
             if (roll < 0.4) { newStatus = 'WARNED'; desc = "Hakem teknik direktörü sert bir dille uyardı: 'Yerine geç hocam!'"; } 
             else if (roll < 0.1) { newStatus = 'YELLOW'; desc = "Teknik direktör aşırı itirazdan dolayı SARI KART gördü."; type = 'CARD_YELLOW'; }
         } else if (managerDiscipline === 'WARNED') {
             if (roll < 0.5) { newStatus = 'YELLOW'; desc = "Hakem itirazların dozunu kaçıran teknik direktöre SARI KART gösterdi."; type = 'CARD_YELLOW'; } 
             else { desc = "Hakem son kez uyardı: 'Bir daha olursa atarım!'"; }
         } else if (managerDiscipline === 'YELLOW') {
             if (roll < 0.6) { newStatus = 'RED'; desc = "Teknik direktör ikinci sarı karttan KIRMIZI KART gördü ve tribüne gönderildi!"; type = 'CARD_RED'; } 
             else { desc = "Hakem dördüncü hakemi yanına çağırdı, teknik direktör ipten döndü."; }
         }
         setManagerDiscipline(newStatus); setEvents(prev => [...prev, { minute, description: desc, type, teamName: myTeamCurrent.name }]);
         if(newStatus === 'YELLOW') setStats(s => ({ ...s, managerCards: 'YELLOW' }));
         if(newStatus === 'RED') { setStats(s => ({ ...s, managerCards: 'RED' })); setIsTacticsOpen(false); }
    };

    const isOwnGoal = events.length > 0 && events[events.length-1].type === 'GOAL' && events[events.length-1].teamName === myTeamCurrent.name;
    const isManagerSentOff = managerDiscipline === 'RED';
    const activePenaltyTeam = penaltyTeamId ? allTeams.find(t => t.id === penaltyTeamId) : null;

    return (
        <div className="h-full flex flex-col relative">
            <MatchOverlays 
                isVarActive={isVarActive} varMessage={varMessage} isPenaltyActive={isPenaltyActive} penaltyMessage={penaltyMessage} activePenaltyTeam={activePenaltyTeam}
                isTacticsOpen={isTacticsOpen} forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} myTeamCurrent={myTeamCurrent} handleTacticsUpdate={handleTacticsUpdate}
                userIsHome={userIsHome} homeSubsUsed={homeSubsUsed} awaySubsUsed={awaySubsUsed} handleUserSubstitution={handleUserSubstitution} minute={minute} onCloseTactics={() => setIsTacticsOpen(false)}
            />

            <MatchScoreboard homeTeam={homeTeam} awayTeam={awayTeam} homeScore={homeScore} awayScore={awayScore} minute={minute} homeRedCards={homeRedCards} awayRedCards={awayRedCards} homeSubsUsed={homeSubsUsed} awaySubsUsed={awaySubsUsed} />

            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                <div className="w-1/3 hidden lg:block bg-green-900 border-r border-slate-800 relative">
                     {/* REPLACED Static Pitch with 2D Match Engine */}
                     <MatchPitch2D 
                        homeTeam={liveHomeTeam} 
                        awayTeam={liveAwayTeam} 
                        ballPosition={ballPosition} 
                        possessionTeamId={possessionTeamId}
                        lastAction={lastActionText}
                     />
                </div>

                <div className="md:hidden flex border-b border-slate-700 bg-slate-800 shrink-0">
                    <button onClick={() => setMobileTab('FEED')} className={`flex-1 py-3 text-center font-bold text-sm flex items-center justify-center gap-2 ${mobileTab === 'FEED' ? 'text-white bg-slate-700 border-b-2 border-white' : 'text-slate-400'}`}><List size={16}/> Maç Akışı</button>
                    <button onClick={() => setMobileTab('STATS')} className={`flex-1 py-3 text-center font-bold text-sm flex items-center justify-center gap-2 ${mobileTab === 'STATS' ? 'text-white bg-slate-700 border-b-2 border-white' : 'text-slate-400'}`}><BarChart2 size={16}/> İstatistik & Taktik</button>
                </div>

                <div className={`flex-1 bg-slate-900 flex flex-col relative border-r border-slate-800 w-full ${mobileTab === 'STATS' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="bg-slate-800 p-2 text-center text-xs text-slate-500 font-bold uppercase tracking-widest border-b border-slate-700">Maç Merkezi</div>
                    <MatchEventFeed events={events} allTeams={allTeams} homeTeam={homeTeam} awayTeam={awayTeam} scrollRef={scrollRef} />
                    <div className="p-2 md:p-4 bg-slate-800 border-t border-slate-700 flex flex-col gap-2 md:gap-4">
                         <div className="flex justify-between items-center">
                             <div className="flex gap-1 md:gap-2">
                                 {[1, 2, 4].map(s => <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 md:px-3 rounded text-xs font-bold ${speed === s ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{s}x</button>)}
                             </div>
                             {phase === 'FULL_TIME' ? (
                                 <button onClick={() => onFinish(homeScore, awayScore, events, stats)} className="bg-red-600 hover:bg-red-500 text-white px-4 md:px-6 py-2 rounded font-bold animate-pulse text-sm md:text-base">MAÇI BİTİR</button>
                             ) : phase === 'HALFTIME' ? (
                                 <div className="flex gap-2 md:gap-4 items-center">
                                    {isManagerSentOff && (<div className="hidden md:flex items-center gap-2 text-xs bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded"><Lock size={14} /><span className="font-bold">CEZALI</span></div>)}
                                    <button disabled={isManagerSentOff} onClick={() => setIsTacticsOpen(true)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded text-white text-xs md:text-sm font-bold transition-all ${isManagerSentOff ? 'bg-slate-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}>SOYUNMA ODASI</button>
                                    <button onClick={() => setPhase('SECOND_HALF')} className="bg-green-600 px-3 py-1.5 md:px-4 md:py-2 rounded text-white text-xs md:text-sm font-bold">2. YARI</button>
                                 </div>
                             ) : (
                                 <div className="flex gap-2 items-center">
                                     {managerDiscipline === 'RED' ? (
                                         <div className="bg-red-600/20 border border-red-500 text-red-500 px-2 py-1 md:px-6 md:py-3 rounded font-bold text-xs md:text-sm flex items-center gap-1 md:gap-2 animate-pulse shadow-inner"><AlertOctagon size={16} className="md:w-6 md:h-6"/> <span>TRİBÜNDESİNİZ</span></div>
                                     ) : (
                                        <>
                                            <button onClick={handleObjection} disabled={isOwnGoal} className={`text-white px-2 py-1.5 md:px-4 md:py-2 rounded font-bold flex items-center gap-1 md:gap-2 text-xs md:text-sm border shadow-inner transition active:scale-95 ${managerDiscipline === 'YELLOW' ? 'bg-orange-700 hover:bg-orange-600 border-orange-500' : 'bg-slate-700 hover:bg-slate-600 border-slate-500'} ${isOwnGoal ? 'opacity-50 cursor-not-allowed' : ''}`}><Megaphone size={14} className="md:w-4 md:h-4"/> {managerDiscipline === 'YELLOW' ? 'İTİRAZ (RİSK)' : 'İTİRAZ'}</button>
                                            <button onClick={() => setIsTacticsOpen(true)} className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1.5 md:px-4 md:py-2 rounded font-bold flex items-center gap-1 md:gap-2 shadow-lg shadow-yellow-900/50 text-xs md:text-sm"><Settings size={14} className="md:w-4 md:h-4"/> TAKTİK</button>
                                        </>
                                     )}
                                 </div>
                             )}
                         </div>
                    </div>
                </div>

                <div className={`w-full md:w-1/4 flex-col bg-slate-800 ${mobileTab === 'STATS' ? 'flex' : 'hidden md:flex'}`}>
                    <div className="flex-1 overflow-y-auto border-b border-slate-700">
                        <div className="p-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase">Canlı İstatistikler</div>
                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Topla Oynama</span><div className="font-bold text-white">%{stats.homePossession} - %{stats.awayPossession}</div></div><div className="w-full bg-slate-700 h-1 rounded overflow-hidden"><div className="bg-white h-full" style={{width: `${stats.homePossession}%`}}></div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Şut</span><div className="font-bold text-white">{stats.homeShots} - {stats.awayShots}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">İsabetli Şut</span><div className="font-bold text-white">{stats.homeShotsOnTarget} - {stats.awayShotsOnTarget}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Korner</span><div className="font-bold text-white">{stats.homeCorners} - {stats.awayCorners}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Faul</span><div className="font-bold text-white">{stats.homeFouls} - {stats.awayFouls}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Sarı Kart</span><div className="font-bold text-yellow-500">{stats.homeYellowCards} - {stats.awayYellowCards}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Kırmızı Kart</span><div className="font-bold text-red-500">{stats.homeRedCards} - {stats.awayRedCards}</div></div>
                             <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Ofsayt</span><div className="font-bold text-white">{stats.homeOffsides} - {stats.awayOffsides}</div></div>
                        </div>
                    </div>
                    <div className="h-1/2 flex flex-col border-t border-slate-700 min-h-[250px]">
                        <div className="p-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Zap size={14}/> Hızlı Oyun Anlayışı</div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-800 custom-scrollbar">
                            {Object.values(Mentality).map((m) => {
                                const isActive = myTeamCurrent.mentality === m;
                                return (
                                    <button key={m} onClick={() => { const updated = { ...myTeamCurrent, mentality: m }; handleTacticsUpdate(updated); }} className={`w-full py-3 px-4 rounded-lg text-xs font-bold text-left transition-all flex items-center justify-between border ${isActive ? 'bg-yellow-500 text-black border-yellow-400 shadow-md transform scale-[1.02]' : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-600 hover:border-slate-500 hover:text-white'}`}>
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
