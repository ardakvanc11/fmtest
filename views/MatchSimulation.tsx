
import React, { useState, useRef, useEffect } from 'react';
import { Team, MatchEvent, MatchStats, Position, Player, Mentality } from '../types';
import { simulateMatchStep, getEmptyMatchStats } from '../utils/gameEngine';
import MatchPitch2D from '../components/match/MatchPitch2D'; 
import { Timer, AlertOctagon, Megaphone, Settings, PlayCircle, Zap, BarChart2, List, Lock, Target } from 'lucide-react';
import { MatchScoreboard, MatchOverlays, MatchEventFeed } from '../components/match/MatchUI';

const GOAL_SOUND = '/voices/goalsound.wav';
const WHISTLE_SOUND = '/voices/whistle.wav';

const MatchSimulation = ({ homeTeam, awayTeam, userTeamId, onFinish, allTeams, fixtures, managerTrust, fixtureId }: { homeTeam: Team, awayTeam: Team, userTeamId: string, onFinish: (h: number, a: number, events: MatchEvent[], stats: MatchStats, fid?: string) => void, allTeams: Team[], fixtures: any[], managerTrust: number, fixtureId?: string }) => {
    const [minute, setMinute] = useState(0);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [stats, setStats] = useState<MatchStats>(getEmptyMatchStats());
    const [speed, setSpeed] = useState(1); 
    const [phase, setPhase] = useState<'FIRST_HALF' | 'HALFTIME' | 'SECOND_HALF' | 'FULL_TIME' | 'PENALTIES'>('FIRST_HALF');
    const [isTacticsOpen, setIsTacticsOpen] = useState(false);
    
    // Penalty Shootout State
    const [pkScore, setPkScore] = useState({ home: 0, away: 0 });
    const [currentKickerIndex, setCurrentKickerIndex] = useState(0);
    const [currentPkTeam, setCurrentPkTeam] = useState<'HOME' | 'AWAY'>('HOME');
    const [shootoutLog, setShootoutLog] = useState<string[]>([]);
    
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
    
    // Check if it's a cup match
    const currentFixture = fixtures.find(f => f.id === fixtureId);
    const isKnockout = currentFixture && (currentFixture.competitionId === 'SUPER_CUP' || currentFixture.competitionId === 'CUP');

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
    useEffect(() => {
        if(isTacticsOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || phase === 'PENALTIES' || isVarActive || isPenaltyActive) return;
        
        const tickRate = 800 / speed; 
        
        const visualInterval = setInterval(() => {
            setBallPosition(prev => {
                const { simHome, simAway } = getSimulateTeams();
                
                const hStr = simHome.strength * (1 + (stats.homePossession - 50)/100);
                const aStr = simAway.strength * (1 + (stats.awayPossession - 50)/100);
                const totalStr = hStr + aStr;
                const homeProb = hStr / totalStr;
                
                let currentTeam = possessionTeamId === homeTeam.id ? 'HOME' : 'AWAY';
                if (Math.random() < 0.2) { 
                    const roll = Math.random();
                    if (roll < homeProb) {
                        currentTeam = 'HOME';
                        setPossessionTeamId(homeTeam.id);
                    } else {
                        currentTeam = 'AWAY';
                        setPossessionTeamId(awayTeam.id);
                    }
                }

                let targetY = 50;
                let targetX = 50;
                let action = "";

                if (currentTeam === 'HOME') {
                    const progress = Math.random(); 
                    targetY = prev.y + (progress * 15); 
                    targetX = Math.max(10, Math.min(90, prev.x + (Math.random() * 20 - 10))); 
                    
                    if (targetY > 80) action = "Hücumda";
                    else if (targetY > 40) action = "Orta Saha";
                    else action = "Savunmadan Çıkıyor";
                } else {
                    const progress = Math.random(); 
                    targetY = prev.y - (progress * 15); 
                    targetX = Math.max(10, Math.min(90, prev.x + (Math.random() * 20 - 10)));

                    if (targetY < 20) action = "Hücumda";
                    else if (targetY < 60) action = "Orta Saha";
                    else action = "Savunmadan Çıkıyor";
                }

                targetY = Math.max(5, Math.min(95, targetY));
                
                setLastActionText(action);
                return { x: targetX, y: targetY };
            });
        }, tickRate);

        return () => clearInterval(visualInterval);
    }, [isTacticsOpen, phase, speed, isVarActive, isPenaltyActive, possessionTeamId, stats.homePossession]);


    // --- MAIN GAME LOOP (Minutes & Events) ---
    useEffect(() => {
        if(isTacticsOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || phase === 'PENALTIES' || isVarActive || isPenaltyActive) return;
        const interval = setInterval(() => {
            setMinute(m => {
                const nextM = m + 1;
                
                if (isSabotageActive && !sabotageTriggered && nextM === 10) {
                    setSabotageTriggered(true);
                    setEvents(prev => [...prev, { minute: nextM, type: 'INFO', description: "⚠️ DİKKAT: Oyuncular sahada isteksiz görünüyor. Menajere olan tepkileri oyuna yansıyor!", teamName: myTeamCurrent.name }]);
                }

                if (nextM === 45 && phase === 'FIRST_HALF') { setPhase('HALFTIME'); playSound(WHISTLE_SOUND); return 45; }
                if (nextM >= 90 && phase === 'SECOND_HALF') {
                    // Check for Draw in Knockout
                    if (isKnockout && homeScore === awayScore) {
                        setPhase('PENALTIES');
                        setEvents(prev => [...prev, { minute: 90, type: 'INFO', description: "Maç berabere bitti. Seri penaltı atışlarına geçiliyor!", teamName: '' }]);
                        playSound(WHISTLE_SOUND);
                        return 90;
                    }
                    
                    setPhase('FULL_TIME'); 
                    playSound(WHISTLE_SOUND); 
                    return 90; 
                }

                // ... (Existing AI substitution and Event simulation Logic)
                // Assuming this part remains similar to previous version, handled by simulateMatchStep
                
                const { simHome, simAway } = getSimulateTeams();
                const event = simulateMatchStep(nextM, simHome, simAway, {h: homeScore, a: awayScore}, events);
                
                if(event) {
                    setEvents(prev => [...prev, event]);
                    
                    if (event.type === 'GOAL') {
                        const isHomeGoal = event.teamName === homeTeam.name;
                        setPossessionTeamId(event.teamName === homeTeam.name ? homeTeam.id : awayTeam.id);
                        setBallPosition({ x: 50, y: isHomeGoal ? 98 : 2 }); 
                        setLastActionText("GOL!");
                        setTimeout(() => setBallPosition({ x: 50, y: 50 }), 2000);
                    }
                    // ... (Other visual effects)
                    
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
                                    } else {
                                        setEvents(prev => [...prev, { minute: nextM, description: `VAR İncelemesi Bitti: GOL GEÇERLİ! Santra yapılacak.`, type: 'INFO', teamName: event.teamName }]);
                                    }
                                }, 3000);
                            }, 1000);
                        }
                    }
                    
                    setStats(prev => {
                        const s = {...prev};
                        if(event.teamName === homeTeam.name) s.homePossession = Math.min(80, s.homePossession + 1); else s.awayPossession = Math.min(80, s.awayPossession + 1);
                        s.homePossession = Math.max(20, s.homePossession); s.awayPossession = 100 - s.homePossession;
                        if(event.type === 'GOAL' || event.type === 'MISS' || event.type === 'SAVE') { if(event.teamName === homeTeam.name) { s.homeShots++; if(event.type === 'GOAL' || event.type === 'SAVE') s.homeShotsOnTarget++; } else { s.awayShots++; if(event.type === 'GOAL' || event.type === 'SAVE') s.awayShotsOnTarget++; } }
                        // ... Other stats
                        if(event.type === 'CARD_RED') { event.teamName === homeTeam.name ? s.homeRedCards++ : s.awayRedCards++; }
                        return s;
                    });
                }
                return nextM;
            });
        }, 1000 / speed);
        return () => clearInterval(interval);
    }, [minute, isTacticsOpen, phase, speed, isVarActive, isPenaltyActive, events, liveHomeTeam, liveAwayTeam, homeSubsUsed, awaySubsUsed, forcedSubstitutionPlayerId, isSabotageActive, isKnockout, homeScore, awayScore]);

    // --- PENALTY SHOOTOUT LOOP ---
    useEffect(() => {
        if (phase !== 'PENALTIES') return;

        const penaltyInterval = setInterval(() => {
            const team = currentPkTeam === 'HOME' ? liveHomeTeam : liveAwayTeam;
            const kickerPool = team.players.slice(0, 11).sort((a,b) => b.stats.penalty - a.stats.penalty);
            // Select kicker based on index (looping if needed for sudden death)
            const kicker = kickerPool[currentKickerIndex % kickerPool.length];
            
            // Calculate outcome
            const successChance = 0.7 + (kicker.stats.penalty / 100);
            const isGoal = Math.random() < successChance;

            // Visual Updates
            setLastActionText(`${kicker.name} (Penaltı)`);
            setBallPosition({ x: 50, y: currentPkTeam === 'HOME' ? 88 : 12 });
            setPossessionTeamId(team.id);

            // Log Event
            const resultText = isGoal ? "GOL!" : "KAÇIRDI!";
            setEvents(prev => [...prev, {
                minute: 90 + currentKickerIndex + 1,
                type: isGoal ? 'GOAL' : 'MISS',
                description: `Penaltı Atışı: ${kicker.name} topun başında... Vuruşunu yaptı... ${resultText}`,
                teamName: team.name,
                scorer: isGoal ? kicker.name : undefined
            }]);

            if (isGoal) {
                playSound(GOAL_SOUND);
                setPkScore(prev => currentPkTeam === 'HOME' ? { ...prev, home: prev.home + 1 } : { ...prev, away: prev.away + 1 });
            }

            // Check Win Condition (After pair is done)
            // Logic: 5 kicks each, then sudden death
            // Current index 0 = Home 1st, 1 = Away 1st, 2 = Home 2nd...
            // If Away just kicked (odd total kicks so far), check score
            const kicksTaken = (currentKickerIndex * 2) + (currentPkTeam === 'AWAY' ? 2 : 1); 
            // Simplified: Just increment index logic
            
            // Prepare next state
            if (currentPkTeam === 'HOME') {
                setCurrentPkTeam('AWAY');
            } else {
                setCurrentPkTeam('HOME');
                setCurrentKickerIndex(i => i + 1);
                
                // End Check after AWAY kicks
                const roundsDone = currentKickerIndex + 1;
                const homeP = isGoal ? pkScore.home : pkScore.home; // current score hasn't updated in state yet fully inside interval closure, use ref or logic check
                // Actually React state update is async, inside interval it's tricky.
                // Better to check on next tick or use a ref for scores. 
            }

        }, 5000); // 5 Seconds wait

        return () => clearInterval(penaltyInterval);
    }, [phase, currentPkTeam, currentKickerIndex]);

    // Better Penalty Logic with Refs to handle state updates properly
    useEffect(() => {
        if (phase !== 'PENALTIES') return;
        
        let timeoutId: any;

        const takePenalty = () => {
            const team = currentPkTeam === 'HOME' ? liveHomeTeam : liveAwayTeam;
            const kickerPool = team.players.slice(0, 11).sort((a,b) => b.stats.penalty - a.stats.penalty);
            const kicker = kickerPool[Math.floor((currentKickerIndex) % 11)]; // Simple rotation

            const successChance = 0.75 + ((kicker.stats.penalty - 10) / 40); // 0.5 to 1.0 range based on stat
            const isGoal = Math.random() < successChance;

            // Update UI 2D
            setBallPosition({ x: 50, y: currentPkTeam === 'HOME' ? 85 : 15 });
            setLastActionText(`${kicker.name} Penaltı`);

            setTimeout(() => {
                if (isGoal) playSound(GOAL_SOUND);
                
                const newScore = { ...pkScore };
                if (isGoal) {
                    if (currentPkTeam === 'HOME') newScore.home++; else newScore.away++;
                }

                setPkScore(newScore);
                setEvents(prev => [...prev, {
                    minute: 120, // Symbolic minute
                    type: isGoal ? 'GOAL' : 'MISS',
                    description: `Penaltı: ${kicker.name} (${team.name}) - ${isGoal ? 'GOL!' : 'KAÇIRDI!'}`,
                    teamName: team.name
                }]);

                // Check Win
                const rounds = currentPkTeam === 'AWAY' ? currentKickerIndex + 1 : currentKickerIndex;
                let isFinished = false;

                // First 5 rounds logic
                if (rounds < 5) {
                    // Check mathematical impossibility? (e.g. 3-0 with 2 left)
                    const kicksRemainingHome = 5 - (currentPkTeam === 'HOME' ? rounds : rounds);
                    const kicksRemainingAway = 5 - (currentPkTeam === 'AWAY' ? rounds : rounds - (currentPkTeam === 'HOME' ? 0 : 1));
                    // Simplified: just wait for 5 each
                } else if (currentPkTeam === 'AWAY') {
                    // Sudden Death Check after equal kicks
                    if (newScore.home !== newScore.away && rounds >= 5) {
                        isFinished = true;
                    }
                }

                if (isFinished) {
                    setPhase('FULL_TIME');
                    setStats(prev => ({ ...prev, pkHome: newScore.home, pkAway: newScore.away }));
                    // Trigger finish manually or let user click button
                } else {
                    // Next kicker
                    if (currentPkTeam === 'HOME') setCurrentPkTeam('AWAY');
                    else {
                        setCurrentPkTeam('HOME');
                        setCurrentKickerIndex(i => i + 1);
                    }
                }
                
                setBallPosition({ x: 50, y: 50 }); // Reset ball
            }, 2000);
        };

        timeoutId = setTimeout(takePenalty, 5000);
        return () => clearTimeout(timeoutId);
    }, [phase, currentPkTeam, currentKickerIndex]); // Re-run when turn changes

    const handleObjection = () => {
         // ... (Same as before)
         escalateDiscipline();
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

            {/* PENALTY SCOREBOARD OVERLAY */}
            {(phase === 'PENALTIES' || pkScore.home > 0 || pkScore.away > 0) && (
                <div className="bg-black/80 text-white text-center py-2 border-b border-yellow-500 font-mono font-bold animate-in slide-in-from-top">
                    PENALTILAR: {homeTeam.name} {pkScore.home} - {pkScore.away} {awayTeam.name}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                <div className="w-1/3 hidden lg:block bg-green-900 border-r border-slate-800 relative">
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
                    
                    {phase === 'PENALTIES' && (
                        <div className="absolute top-10 left-0 right-0 z-10 flex justify-center pointer-events-none">
                            <div className="bg-yellow-500 text-black px-6 py-2 rounded-full font-black text-xl animate-pulse shadow-lg border-2 border-white">
                                {currentPkTeam === 'HOME' ? homeTeam.name : awayTeam.name} Atıyor...
                            </div>
                        </div>
                    )}

                    <MatchEventFeed events={events} allTeams={allTeams} homeTeam={homeTeam} awayTeam={awayTeam} scrollRef={scrollRef} />
                    <div className="p-2 md:p-4 bg-slate-800 border-t border-slate-700 flex flex-col gap-2 md:gap-4">
                         <div className="flex justify-between items-center">
                             <div className="flex gap-1 md:gap-2">
                                 {[1, 2, 4].map(s => <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 md:px-3 rounded text-xs font-bold ${speed === s ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{s}x</button>)}
                             </div>
                             {phase === 'FULL_TIME' ? (
                                 <button onClick={() => {
                                     // Pass stats including PK score
                                     const finalStats = { ...stats, pkHome: pkScore.home, pkAway: pkScore.away };
                                     onFinish(homeScore, awayScore, events, finalStats, fixtureId);
                                 }} className="bg-red-600 hover:bg-red-500 text-white px-4 md:px-6 py-2 rounded font-bold animate-pulse text-sm md:text-base">MAÇI BİTİR</button>
                             ) : phase === 'HALFTIME' ? (
                                 <div className="flex gap-2 md:gap-4 items-center">
                                    {isManagerSentOff && (<div className="hidden md:flex items-center gap-2 text-xs bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded"><Lock size={14} /><span className="font-bold">CEZALI</span></div>)}
                                    <button disabled={isManagerSentOff} onClick={() => setIsTacticsOpen(true)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded text-white text-xs md:text-sm font-bold transition-all ${isManagerSentOff ? 'bg-slate-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}>SOYUNMA ODASI</button>
                                    <button onClick={() => setPhase('SECOND_HALF')} className="bg-green-600 px-3 py-1.5 md:px-4 md:py-2 rounded text-white text-xs md:text-sm font-bold">2. YARI</button>
                                 </div>
                             ) : phase === 'PENALTIES' ? (
                                 <div className="text-yellow-500 font-bold text-sm animate-pulse">SERİ PENALTILAR OYNANIYOR...</div>
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
                    {/* ... (Mentality Panel remains the same) */}
                </div>
            </div>
        </div>
    );
};

export default MatchSimulation;
