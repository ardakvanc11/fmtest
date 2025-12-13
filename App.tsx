import React, { useState, useEffect, useRef } from 'react';
import { 
    GameState, Team, Player, Fixture, Position, MatchEvent, TacticStyle, NewsItem, MatchStats, InterviewQuestion, InterviewOption, HalftimeTalkOption, ManagerProfile, BettingOdds, Mentality, PassingStyle, Tempo, Width, CreativeFreedom, FinalThird, Crossing, DefensiveLine, Tackling, PressingFocus, TimeWasting, Message
} from './types';
import { initializeTeams, generatePlayer } from './constants';
import { calculateTeamStrength, calculateForm, simulateMatchInstant, simulateMatchStep, generateFixtures, generateTransferMarket, generateWeeklyNews, getGameDate, isTransferWindowOpen, getEmptyMatchStats, processMatchPostGame, applyTraining, calculateOdds, generateMatchTweets, generatePlayerMessages } from './utils/gameEngine';
import { getMatchCommentary, getPressQuestion, getHalftimeTalks } from './services/geminiService';
import { 
    Users, Trophy, DollarSign, Calendar, Activity, 
    Shield, Briefcase, PlayCircle, Save, Menu, ChevronRight, UserPlus, TrendingUp, ChevronLeft, Dumbbell, ShoppingCart, Target, Wind, Footprints, Zap, ArrowLeftRight, Settings, PauseCircle, Timer, Newspaper, X, Eye, Lock, Star, MonitorPlay, MessageSquare, Check, Mic, RotateCcw, User, FastForward, AlertTriangle, AlertOctagon, Monitor, Syringe, Bandage, HeartPulse, Megaphone, FileText, Heart, History, Home, Flag, Disc, BarChart2, Handshake, ScrollText, Play, ArrowUpDown, Swords, Flame, ShieldAlert, XCircle, Search, Feather, Smartphone, Hash, AtSign, Send, Mail, MapPin, Sun, Moon
} from 'lucide-react';
import { INITIAL_MESSAGES } from './data/messagePool';

// --- COMPONENTS ---

const IntroScreen = ({ onStart }: { onStart: (name: string, year: string, country: string) => void }) => {
    const [name, setName] = useState('');
    const [year, setYear] = useState('');
    const [country, setCountry] = useState('Türkiye');

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('https://i.imgur.com/SlgaMNf.jpeg')] bg-cover bg-center">
            <div className="bg-slate-900/90 dark:bg-slate-900/90 p-8 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full text-center backdrop-blur-sm">
                <div className="mb-6 flex justify-center">
                    <img 
                        src="https://imgur.com/jMJ7IEw.png" 
                        alt="HLM 26 Logo" 
                        className="w-32 h-32 object-contain drop-shadow-2xl filter brightness-110"
                    />
                </div>
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 mb-2 tracking-tighter">
                    HAYVAN LEAGUE
                </h1>
                <h2 className="text-3xl font-light text-white mb-8 tracking-[0.5em]">MANAGER 26</h2>
                
                <div className="space-y-4 text-left">
                    <div>
                        <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Menajer Adı</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ad Soyad"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition mt-1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Doğum Yılı</label>
                            <input 
                                type="number" 
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="1980"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Uyruk</label>
                            <input 
                                type="text" 
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="Türkiye"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition mt-1"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={() => name && year && country && onStart(name, year, country)}
                        disabled={!name || !year || !country}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition transform hover:scale-105 mt-6 shadow-lg shadow-green-900/50"
                    >
                        KARİYERE BAŞLA
                    </button>
                </div>
                <p className="mt-6 text-slate-500 text-xs">v2.7.0 • 2025/2026 Sezonu</p>
            </div>
        </div>
    );
};

const TeamSelection = ({ teams, onSelect }: { teams: Team[], onSelect: (id: string) => void }) => {
    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-900 p-8 overflow-y-auto">
            <h2 className="text-4xl text-center text-slate-900 dark:text-white mb-8 font-bold">TAKIMINI SEÇ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto pb-10">
                {teams.map(team => {
                    const gradientFrom = team.colors[0].replace('bg-', 'from-');
                    return (
                        <div 
                            key={team.id}
                            onClick={() => onSelect(team.id)}
                            className={`cursor-pointer group relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-yellow-500 transition-all duration-300 bg-white dark:bg-slate-800 shadow-xl`}
                        >
                            {/* Gradient Background Area */}
                            <div className={`h-32 w-full bg-gradient-to-b ${gradientFrom} to-white dark:to-slate-800 flex items-center justify-center py-4 relative`}>
                                <div className="absolute inset-0 bg-black/10"></div>
                                {team.logo ? (
                                    <img src={team.logo} alt={team.name} className="h-24 w-24 object-contain drop-shadow-2xl relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
                                ) : (
                                    <div className={`h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/30`}>
                                         <span className={`text-3xl font-bold text-white`}>{team.name.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 relative z-10">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{team.name}</h3>
                                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="flex justify-between">
                                        <span>Yıldız:</span>
                                        <div className="flex text-yellow-500 dark:text-yellow-400">
                                            {[...Array(team.stars)].map((_, i) => <span key={i}>★</span>)}
                                            {team.stars === 0 && <span className="text-slate-400 dark:text-slate-600">-</span>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Bütçe:</span>
                                        <span className="text-green-600 dark:text-green-400">{team.budget} M€</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Taraftar:</span>
                                        <span>{(team.fanBase / 1000000).toFixed(1)}M</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Stadyum:</span>
                                        <span>{team.stadiumName} ({team.stadiumCapacity.toLocaleString()})</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-black/10 transition-colors pointer-events-none" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Dashboard = ({ 
    state, 
    onNavigate, 
    children, 
    onSave, 
    onNewGame,
    onNextWeek,
    currentView,
    theme,
    toggleTheme,
    onBack,
    onForward,
    canBack,
    canForward
}: { 
    state: GameState, 
    onNavigate: (view: string) => void, 
    children?: React.ReactNode,
    onSave: () => void,
    onNewGame: () => void,
    onNextWeek: () => void,
    currentView: string,
    theme: string,
    toggleTheme: () => void,
    onBack: () => void,
    onForward: () => void,
    canBack: boolean,
    canForward: boolean
}) => {
    const myTeam = state.teams.find(t => t.id === state.myTeamId);
    const { label: dateLabel } = getGameDate(state.currentWeek);
    
    const currentFixture = state.fixtures.find(f => 
        f.week === state.currentWeek && 
        (f.homeTeamId === state.myTeamId || f.awayTeamId === state.myTeamId)
    );
    
    const canAdvance = currentFixture ? !!currentFixture.played : true;
    
    // Updated isMatchMode to restrict navigation only during active match play or mandatory match flow sequences
    const isMatchMode = ['match_live', 'match_result', 'interview'].includes(currentView);

    // Calculate unread messages
    const unreadMessagesCount = state.messages.filter(m => !m.read).length;

    // Mobile Menu State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [confirmNewGame, setConfirmNewGame] = useState(false);
    
    // Notification State
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    // Sidebar items mapping to allow reuse
    const NavItem = ({ id, label, icon: Icon, badge }: any) => (
        <button 
            disabled={isMatchMode} 
            onClick={() => { onNavigate(id); setMobileMenuOpen(false); }} 
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition ${currentView === id ? 'bg-slate-200 dark:bg-slate-700 text-yellow-600 dark:text-yellow-500' : 'text-slate-700 dark:text-slate-200'} ${isMatchMode ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <Icon size={20} /> 
            <span className="flex-1 text-left">{label}</span>
            {badge && badge > 0 ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse ml-auto">
                    {badge}
                </span>
            ) : null}
        </button>
    );

    // Determine if we need padding (standard views) or full screen (match views)
    const noPaddingViews = ['match_live', 'locker_room'];
    const usePadding = !noPaddingViews.includes(currentView);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans relative overflow-hidden transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 shrink-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                    <img
                        src="https://imgur.com/Ghz4FsD.png"
                        alt="HLM 26 Logo"
                        className="h-10 w-auto object-contain"
                    />
                    </div>
                    <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}><X size={24}/></button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavItem id="home" label="Genel Bakış" icon={Home} />
                    <NavItem id="social" label="Sosyal Medya" icon={Smartphone} badge={unreadMessagesCount} />
                    <NavItem id="squad" label="Kadro" icon={Users} />
                    <NavItem id="tactics" label="Taktik & 11" icon={Briefcase} />
                    <NavItem id="transfer" label="Transfer" icon={DollarSign} />
                    <NavItem id="fixtures" label="Fikstür" icon={Calendar} />
                    <NavItem id="training" label="Antrenman" icon={Dumbbell} />
                </nav>

                {/* Footer Notification */}
                {notification && (
                    <div className={`p-2 text-center text-xs font-bold animate-in fade-in slide-in-from-bottom-2 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {notification.message}
                    </div>
                )}

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-center gap-4">
                     <button 
                        onClick={toggleTheme}
                        className="flex items-center justify-center w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 hover:text-black dark:hover:text-white transition-all shadow-lg"
                        title={theme === 'dark' ? "Aydınlık Mod" : "Karanlık Mod"}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button 
                        disabled={isMatchMode} 
                        onClick={() => {
                            onSave();
                            setNotification({ message: "Oyun başarılı bir şekilde kaydedildi", type: 'success' });
                            setTimeout(() => setNotification(null), 3000);
                        }} 
                        title="Oyunu Kaydet"
                        className="flex items-center justify-center w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 hover:text-black dark:hover:text-white transition-all shadow-lg disabled:opacity-50"
                    >
                        <Save size={20} />
                    </button>
                    <button 
                        disabled={isMatchMode} 
                        onClick={() => {
                            if(confirmNewGame) {
                                onNewGame();
                                setConfirmNewGame(false);
                                setNotification(null);
                                setMobileMenuOpen(false);
                            } else {
                                setConfirmNewGame(true);
                                setNotification({ message: "Emin Misiniz? Yeni Oyuna başlamak için tekrar tıklayın", type: 'error' });
                                setTimeout(() => {
                                    setConfirmNewGame(false);
                                    setNotification(null);
                                }, 3000);
                            }
                        }} 
                        title={confirmNewGame ? "Onaylamak için tekrar tıkla" : "Yeni Oyun"}
                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-lg disabled:opacity-50 ${
                            confirmNewGame 
                            ? 'bg-red-600 text-white animate-pulse' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 hover:text-red-800 dark:hover:text-red-200'
                        }`}
                    >
                        <RotateCcw size={20} /> 
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 shrink-0 transition-colors duration-300">
                    <div className="flex items-center space-x-4">
                        <button className="md:hidden text-slate-600 dark:text-slate-200 hover:text-black dark:hover:text-white" onClick={() => setMobileMenuOpen(true)}>
                            <Menu size={24} />
                        </button>
                        
                        {/* NAVIGATION BUTTONS */}
                        <div className="flex items-center space-x-1 mr-2">
                             <button
                                 onClick={onBack}
                                 disabled={!canBack || isMatchMode}
                                 className={`p-1.5 rounded-full transition-colors ${canBack && !isMatchMode ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'}`}
                             >
                                 <ChevronLeft size={22} />
                             </button>
                             <button
                                 onClick={onForward}
                                 disabled={!canForward || isMatchMode}
                                 className={`p-1.5 rounded-full transition-colors ${canForward && !isMatchMode ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'}`}
                             >
                                 <ChevronRight size={22} />
                             </button>
                        </div>

                        <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                            {myTeam?.logo ? (
                                <img src={myTeam.logo} alt={myTeam.name} className="w-8 h-8 object-contain" />
                            ) : (
                                <div className={`w-8 h-8 rounded-full ${myTeam?.colors?.[0] || 'bg-gray-500'}`} />
                            )}
                            <span className="font-bold text-lg hidden sm:block text-slate-900 dark:text-white">{myTeam?.name}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 md:space-x-6">
                         <div className="hidden sm:flex items-center space-x-2 text-green-600 dark:text-green-400 font-mono">
                            <DollarSign size={16} />
                            <span>{myTeam?.budget?.toFixed(1)} M€</span>
                        </div>
                        <div className="hidden sm:flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 font-mono border border-slate-300 dark:border-slate-600 px-3 py-1 rounded bg-slate-100 dark:bg-slate-700 min-w-[200px] justify-center transition-colors">
                            <Calendar size={16} />
                            <span className="text-sm font-bold uppercase">{dateLabel}</span>
                        </div>
                        
                        {isMatchMode ? (
                            <button disabled className="bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-400 px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center cursor-not-allowed animate-pulse text-sm md:text-base transition-colors">
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span> <span className="hidden sm:inline">MAÇ GÜNÜ</span><span className="sm:hidden">MAÇ</span>
                            </button>
                        ) : canAdvance ? (
                            <button 
                                onClick={onNextWeek}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center animate-pulse shadow-lg shadow-blue-900/20 dark:shadow-blue-900/50 text-sm md:text-base transition-colors"
                            >
                                <span className="hidden sm:inline">Sonraki Hafta</span><span className="sm:hidden">İleri</span> <ChevronRight size={16} className="ml-1"/>
                            </button>
                        ) : (
                             <button 
                                onClick={() => onNavigate('match_preview')}
                                className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center shadow-lg shadow-red-900/20 dark:shadow-red-900/50 text-sm md:text-base transition-colors"
                            >
                                <PlayCircle size={16} className="mr-2"/> <span className="hidden sm:inline">MAÇA GİT</span><span className="sm:hidden">MAÇ</span>
                            </button>
                        )}
                    </div>
                </header>
                <main className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300 ${usePadding ? 'p-4 md:p-6 overflow-auto' : 'overflow-hidden'}`}>
                     {children}
                </main>
            </div>
        </div>
    );
};

const TeamDetailView = ({ team, onClose, onPlayerClick }: { team: Team, onClose: () => void, onPlayerClick: (p: Player) => void }) => {
    return (
        <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
             <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-black dark:hover:text-white" onClick={onClose}>
                 <ChevronLeft size={20} /> Geri Dön
             </div>
             <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
                 <div className="flex items-center gap-6">
                     <img src={team.logo} className="w-32 h-32 object-contain" />
                     <div>
                         <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{team.name}</h2>
                         <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 mb-4">
                             <div className="flex gap-1 items-center"><Star size={16} className="fill-yellow-500 text-yellow-500"/> {team.stars} Yıldız</div>
                             <div className="flex gap-1 items-center"><Users size={16} /> {(team.fanBase / 1000000).toFixed(1)}M Taraftar</div>
                             <div className="flex gap-1 items-center"><Home size={16} /> {team.stadiumName}</div>
                             <div className="flex gap-1 items-center"><MapPin size={16} /> {team.stadiumCapacity.toLocaleString()} Kapasite</div>
                         </div>
                         <div className="grid grid-cols-4 gap-4 bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                             <div className="text-center">
                                 <div className="text-xs text-slate-500 dark:text-slate-400">GÜÇ</div>
                                 <div className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(team.strength)}</div>
                             </div>
                             <div className="text-center">
                                 <div className="text-xs text-slate-500 dark:text-slate-400">PİYASA DEĞERİ</div>
                                 <div className="text-2xl font-bold text-green-600 dark:text-green-400">{team.players.reduce((a,b)=>a+b.value,0).toFixed(1)} M€</div>
                             </div>
                             <div className="text-center">
                                 <div className="text-xs text-slate-500 dark:text-slate-400">FORM</div>
                                 <div className="text-xl font-bold text-slate-900 dark:text-white flex justify-center gap-1">
                                     <span className="text-green-600 dark:text-green-400">{team.stats.won}G</span>
                                     <span className="text-slate-600 dark:text-slate-300">{team.stats.drawn}B</span>
                                     <span className="text-red-600 dark:text-red-400">{team.stats.lost}M</span>
                                 </div>
                             </div>
                              <div className="text-center">
                                 <div className="text-xs text-slate-500 dark:text-slate-400">PUAN</div>
                                 <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{team.stats.points}</div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
             
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Takım Kadrosu</h3>
             <SquadView team={team} onPlayerClick={onPlayerClick} />
        </div>
    );
};

const PlayerDetailModal = ({ player, onClose }: { player: Player, onClose: () => void }) => {
    if (!player) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className={`w-20 h-20 rounded-lg flex items-center justify-center text-3xl font-bold text-white shadow-inner ${player.position === 'GK' ? 'bg-yellow-600' : player.position === 'DEF' ? 'bg-blue-600' : player.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {player.position}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{player.name}</h2>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                <span>{player.nationality}</span> • <span>{player.age} Yaşında</span>
                            </div>
                            <div className="mt-2 flex gap-3">
                                <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs text-green-700 dark:text-green-400 font-mono">Değer: {player.value} M€</span>
                                <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs text-yellow-700 dark:text-yellow-400">Moral: {player.morale}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition text-slate-500 dark:text-slate-400"><X size={24}/></button>
                </div>
                
                <div className="p-6 grid grid-cols-2 gap-8 text-slate-900 dark:text-white">
                    <div className="space-y-3">
                        <h4 className="text-yellow-600 dark:text-yellow-500 font-bold uppercase text-sm border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">Fiziksel & Mental</h4>
                        <div className="flex justify-between text-sm"><span>Hız</span><span className="font-bold">{player.stats.pace}</span></div>
                        <div className="flex justify-between text-sm"><span>Güç</span><span className="font-bold">{player.stats.physical}</span></div>
                        <div className="flex justify-between text-sm"><span>Dayanıklılık</span><span className="font-bold">{player.stats.stamina}</span></div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-blue-600 dark:text-blue-500 font-bold uppercase text-sm border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">Teknik</h4>
                         <div className="flex justify-between text-sm"><span>Şut / Bitiricilik</span><span className="font-bold">{player.stats.shooting}</span></div>
                        <div className="flex justify-between text-sm"><span>Pas</span><span className="font-bold">{player.stats.passing}</span></div>
                        <div className="flex justify-between text-sm"><span>Top Sürme</span><span className="font-bold">{player.stats.dribbling}</span></div>
                        <div className="flex justify-between text-sm"><span>Savunma</span><span className="font-bold">{player.stats.defending}</span></div>
                    </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-xs text-slate-500">Sezon İstatistikleri: {player.seasonStats.goals} Gol, {player.seasonStats.assists} Asist</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{player.skill} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">GENEL</span></div>
                </div>
            </div>
        </div>
    );
};

const MatchDetailModal = ({ fixture, teams, onClose }: { fixture: Fixture, teams: Team[], onClose: () => void }) => {
    const home = teams.find(t => t.id === fixture.homeTeamId);
    const away = teams.find(t => t.id === fixture.awayTeamId);
    if(!home || !away || !fixture.stats) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white">MAÇ RAPORU</h2>
                     <button onClick={onClose}><X className="text-slate-400 hover:text-black dark:hover:text-white"/></button>
                 </div>
                 
                 <div className="p-8 bg-slate-100 dark:bg-slate-800 text-center flex justify-center items-center gap-8 shadow-md">
                     <div className="flex flex-col items-center gap-2">
                         <img src={home.logo} className="w-16 h-16 object-contain" />
                         <span className="font-bold text-xl text-slate-900 dark:text-white">{home.name}</span>
                     </div>
                     <div className="text-5xl font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-6 py-2 rounded shadow-inner">{fixture.homeScore} - {fixture.awayScore}</div>
                     <div className="flex flex-col items-center gap-2">
                         <img src={away.logo} className="w-16 h-16 object-contain" />
                         <span className="font-bold text-xl text-slate-900 dark:text-white">{away.name}</span>
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-8 bg-white dark:bg-slate-900">
                      <div>
                          <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4 border-b border-green-200 dark:border-green-900 pb-2">Goller & Asistler</h3>
                          <div className="space-y-2">
                              {fixture.matchEvents?.filter(e => e.type === 'GOAL').map((e, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-900 dark:text-white">
                                      <div className="font-mono text-slate-500 dark:text-slate-400">{e.minute}'</div>
                                      <div className="font-bold">{e.scorer}</div>
                                      <div className="text-slate-500 text-xs">Asist: {e.assist}</div>
                                      <div className="ml-auto text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{e.teamName}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                      <div>
                          <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mb-4 border-b border-yellow-200 dark:border-yellow-900 pb-2">Oyuncu Reytingleri</h3>
                          <div className="h-64 overflow-y-auto space-y-1">
                              {[...fixture.stats.homeRatings, ...fixture.stats.awayRatings].sort((a,b)=>b.rating-a.rating).map((p, i) => (
                                  <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-900 dark:text-white">
                                       <div>
                                           <span className="font-bold">{p.name}</span>
                                           <span className="text-xs ml-2 text-slate-500">{p.position}</span>
                                       </div>
                                       <div className={`font-bold ${p.rating >= 8 ? 'text-green-600 dark:text-green-400' : p.rating >= 6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{p.rating}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                 </div>
                 
                 <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-center">
                     <span className="text-slate-500 dark:text-slate-400">Maçın Adamı: </span>
                     <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg ml-2">{fixture.stats.mvpPlayerName}</span>
                 </div>
             </div>
        </div>
    );
};

const StandingsTable = ({ teams, myTeamId, compact, onTeamClick, liveScores }: { teams: Team[], myTeamId: string, compact?: boolean, onTeamClick?: (id: string) => void, liveScores?: {homeId: string, awayId: string, homeScore: number, awayScore: number} }) => {
    let displayTeams = [...teams];
    
    if (liveScores) {
        displayTeams = displayTeams.map(t => {
            const isHome = t.id === liveScores.homeId;
            const isAway = t.id === liveScores.awayId;
            if(!isHome && !isAway) return t;
            
            const newStats = { ...t.stats };
            newStats.played += 1;
            
            if(isHome) {
                newStats.gf += liveScores.homeScore;
                newStats.ga += liveScores.awayScore;
                if(liveScores.homeScore > liveScores.awayScore) { newStats.points += 3; newStats.won++; }
                else if(liveScores.homeScore === liveScores.awayScore) { newStats.points += 1; newStats.drawn++; }
                else { newStats.lost++; }
            } else {
                newStats.gf += liveScores.awayScore;
                newStats.ga += liveScores.homeScore;
                if(liveScores.awayScore > liveScores.homeScore) { newStats.points += 3; newStats.won++; }
                else if(liveScores.awayScore === liveScores.homeScore) { newStats.points += 1; newStats.drawn++; }
                else { newStats.lost++; }
            }
            return { ...t, stats: { ...newStats } };
        });
    }

    const sorted = displayTeams.sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2">Takım</th>
                        {!compact && <th className="px-2 py-2 text-center">O</th>}
                        {!compact && <th className="px-2 py-2 text-center">Av</th>}
                        <th className="px-2 py-2 text-center">P</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {sorted.map((team, index) => (
                        <tr 
                            key={team.id} 
                            onClick={() => onTeamClick && onTeamClick(team.id)}
                            className={`hover:bg-slate-200 dark:hover:bg-slate-700/50 cursor-pointer transition ${team.id === myTeamId ? 'bg-slate-100 dark:bg-slate-800/80 border-l-2 border-yellow-500' : ''}`}
                        >
                            <td className={`px-2 py-2 font-bold ${index < 3 ? 'text-green-600 dark:text-green-400' : index > sorted.length - 4 ? 'text-red-600 dark:text-red-400' : ''}`}>{index + 1}</td>
                            <td className="px-2 py-2 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                {team.logo && <img src={team.logo} className="w-4 h-4 object-contain" alt="" />}
                                <span className={compact ? 'truncate max-w-[100px]' : ''}>{team.name}</span>
                            </td>
                            {!compact && <td className="px-2 py-2 text-center">{team.stats.played}</td>}
                            {!compact && <td className="px-2 py-2 text-center">{team.stats.gf - team.stats.ga}</td>}
                            <td className="px-2 py-2 text-center font-bold text-slate-900 dark:text-white">{team.stats.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PitchVisual = ({ players, onPlayerClick, selectedPlayerId }: { players: Player[], onPlayerClick: (p: Player) => void, selectedPlayerId: string | null }) => {
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

const PlayerRow: React.FC<{ p: Player, index: number, onClick: (p: Player) => void }> = ({ p, index, onClick }) => {
    const getConditionColor = (stamina: number) => stamina >= 80 ? 'text-green-500 fill-green-500' : stamina >= 50 ? 'text-yellow-500 fill-yellow-500' : 'text-red-500 fill-red-500';

    return (
        <tr onClick={() => onClick(p)} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-200 dark:border-slate-700/50 last:border-0 group">
            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 w-8">{index !== undefined ? index + 1 : '-'}</td>
            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-10 text-center text-white ${p.position === 'GK' ? 'bg-yellow-600' : p.position === 'DEF' ? 'bg-blue-600' : p.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>{p.position}</span>
                {p.name}
                {p.injury && <Syringe size={14} className="text-red-500"/>}
                {p.suspendedUntilWeek && <div className="w-3 h-4 bg-red-600 rounded-sm"/>}
            </td>
            <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{p.age}</td>
            <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-200 text-lg">{p.skill}</td>
            <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1 group-hover:scale-110 transition-transform"><Heart size={16} className={getConditionColor(p.stats.stamina)} /><span className="text-xs text-slate-400 hidden group-hover:inline">{p.stats.stamina}</span></div></td>
            <td className="px-4 py-3 text-center font-bold text-yellow-600 dark:text-yellow-500">{p.morale}</td>
            <td className="px-4 py-3 text-center font-mono text-green-600 dark:text-green-400">{p.seasonStats.goals}</td>
            <td className="px-4 py-3 text-center font-mono text-blue-600 dark:text-blue-400">{p.seasonStats.assists}</td>
            <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">{p.seasonStats.averageRating || '-'}</td>
            <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-bold">{p.value} M€</td>
        </tr>
    );
};

const SquadView = ({ team, onPlayerClick }: { team: Team, onPlayerClick: (p: Player) => void }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const sortPlayers = (players: Player[]) => {
        if (!sortConfig) return players;
        return [...players].sort((a, b) => {
            let aValue: any = a[sortConfig.key as keyof Player];
            let bValue: any = b[sortConfig.key as keyof Player];
            if (sortConfig.key === 'stamina') { aValue = a.stats.stamina; bValue = b.stats.stamina; }
            if (sortConfig.key === 'goals') { aValue = a.seasonStats.goals; bValue = b.seasonStats.goals; }
            if (sortConfig.key === 'assists') { aValue = a.seasonStats.assists; bValue = b.seasonStats.assists; }
            if (sortConfig.key === 'rating') { aValue = a.seasonStats.averageRating; bValue = b.seasonStats.averageRating; }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey, align = 'center' }: { label: string, sortKey: string, align?: string }) => (
        <th className={`px-4 py-2 text-${align} cursor-pointer hover:text-black dark:hover:text-white transition select-none group`} onClick={() => requestSort(sortKey)}>
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                {label} <ArrowUpDown size={12} className={`text-slate-400 dark:text-slate-600 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 ${sortConfig?.key === sortKey ? 'text-yellow-600 dark:text-yellow-500' : ''}`}/>
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            {[team.players.slice(0, 11), team.players.slice(11)].map((group, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-bold text-green-600 dark:text-green-400 flex justify-between">
                        <span>{idx === 0 ? 'İLK 11' : 'YEDEKLER'}</span>
                        {sortConfig && <span className="text-xs text-slate-500 font-normal">Sıralama: {sortConfig.key}</span>}
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                                <th className="px-4 py-2 w-8">#</th>
                                <SortableHeader label="Oyuncu" sortKey="position" align="left" />
                                <SortableHeader label="Yaş" sortKey="age" />
                                <SortableHeader label="Güç" sortKey="skill" />
                                <SortableHeader label="Kondisyon" sortKey="stamina" />
                                <SortableHeader label="Moral" sortKey="morale" />
                                <SortableHeader label="Gol" sortKey="goals" />
                                <SortableHeader label="Asist" sortKey="assists" />
                                <SortableHeader label="Ort" sortKey="rating" />
                                <SortableHeader label="Değer" sortKey="value" align="right" />
                            </tr>
                        </thead>
                        <tbody>{sortPlayers(group).map((p, i) => <PlayerRow key={p.id} p={p} index={idx === 0 ? i : i + 11} onClick={onPlayerClick} />)}</tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

const TacticsView = ({ team, setTeam, compact = false }: { team: Team, setTeam: (t: Team) => void, compact?: boolean }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [tab, setTab] = useState<'GENERAL' | 'ATTACK' | 'DEFENSE'>('GENERAL');

    const handlePlayerClick = (clickedPlayer: Player) => {
        if (!selectedPlayerId) { setSelectedPlayerId(clickedPlayer.id); } 
        else {
            if (selectedPlayerId === clickedPlayer.id) { setSelectedPlayerId(null); return; }
            const idx1 = team.players.findIndex(p => p.id === selectedPlayerId);
            const idx2 = team.players.findIndex(p => p.id === clickedPlayer.id);
            if (idx1 !== -1 && idx2 !== -1) {
                const newPlayers = [...team.players];
                [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]];
                setTeam({ ...team, players: newPlayers });
            }
            setSelectedPlayerId(null);
        }
    };

    const TacticSelect = ({ label, value, onChange, options }: any) => (
        <div className="mb-4">
            <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block mb-2">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded border border-slate-300 dark:border-slate-600 focus:border-yellow-500 text-sm outline-none">
                {Object.values(options).map((t: any) => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-6">
            {!compact && <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">İlk 11 ve Detaylı Taktik</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">Saha üzerindeki oyuncuya tıkla, sonra yedek kulübesinden oyuncu seç.</div>
            </div>}
            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <PitchVisual players={team.players} onPlayerClick={handlePlayerClick} selectedPlayerId={selectedPlayerId} />
                    <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase flex justify-between"><span>Yedek Kulübesi</span><span className="text-xs normal-case flex gap-4"><span>G: Gol</span><span>A: Asist</span><span>Ort: Puan</span></span></h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {team.players.slice(11).map((p) => (
                                <div key={p.id} onClick={() => handlePlayerClick(p)} className={`flex items-center justify-between p-3 rounded border cursor-pointer transition ${selectedPlayerId === p.id ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                    <div className="flex items-center gap-3"><span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${p.position === 'GK' ? 'bg-yellow-600' : p.position === 'DEF' ? 'bg-blue-600' : p.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>{p.position}</span><div className="flex flex-col"><span className={`text-sm font-bold ${selectedPlayerId === p.id ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>{p.name}</span><span className="text-xs text-slate-500 dark:text-slate-400">{p.age} Yaş</span></div></div>
                                    <div className="flex items-center gap-3"><div className="text-xs text-slate-500 dark:text-slate-300 text-right"><div className="text-green-600 dark:text-green-400">{p.seasonStats.goals}G {p.seasonStats.assists}A</div><div className="text-yellow-600 dark:text-yellow-500">{p.seasonStats.averageRating || '-'} Ort</div></div><div className="font-bold text-slate-900 dark:text-white text-lg">{p.skill}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className={`w-full ${compact ? 'lg:w-80' : 'lg:w-96'} space-y-4 overflow-y-auto`}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                            <button onClick={() => setTab('GENERAL')} className={`flex-1 py-3 text-sm font-bold ${tab === 'GENERAL' ? 'bg-yellow-500 dark:bg-yellow-600 text-black' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>Genel</button>
                            <button onClick={() => setTab('ATTACK')} className={`flex-1 py-3 text-sm font-bold ${tab === 'ATTACK' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>Hücum</button>
                            <button onClick={() => setTab('DEFENSE')} className={`flex-1 py-3 text-sm font-bold ${tab === 'DEFENSE' ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>Savunma</button>
                        </div>
                        <div className="p-4 space-y-4">
                            {tab === 'GENERAL' && <><TacticSelect label="Oyun Anlayışı" value={team.mentality} onChange={(v:any) => setTeam({...team, mentality: v})} options={Mentality} /><TacticSelect label="Oyun Temposu" value={team.tempo} onChange={(v:any) => setTeam({...team, tempo: v})} options={Tempo} /><TacticSelect label="Zaman Geçirme" value={team.timeWasting} onChange={(v:any) => setTeam({...team, timeWasting: v})} options={TimeWasting} /></>}
                            {tab === 'ATTACK' && <><TacticSelect label="Pas Şekli" value={team.passing} onChange={(v:any) => setTeam({...team, passing: v})} options={PassingStyle} /><TacticSelect label="Hücum Genişliği" value={team.width} onChange={(v:any) => setTeam({...team, width: v})} options={Width} /><TacticSelect label="Yaratıcılık" value={team.creative} onChange={(v:any) => setTeam({...team, creative: v})} options={CreativeFreedom} /><TacticSelect label="Son 3. Bölge" value={team.finalThird} onChange={(v:any) => setTeam({...team, finalThird: v})} options={FinalThird} /><TacticSelect label="Ortalar" value={team.crossing} onChange={(v:any) => setTeam({...team, crossing: v})} options={Crossing} /></>}
                            {tab === 'DEFENSE' && <><TacticSelect label="Savunma Hattı" value={team.defLine} onChange={(v:any) => setTeam({...team, defLine: v})} options={DefensiveLine} /><div className="bg-red-100 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-500/50 mb-4"><TacticSelect label="Topa Müdahale (Sertlik)" value={team.tackling} onChange={(v:any) => setTeam({...team, tackling: v})} options={Tackling} /><p className="text-[10px] text-red-600 dark:text-red-300 mt-1">Dikkat: Sert oyun kart ve penaltı riskini artırır!</p></div><TacticSelect label="Pres Odağı" value={team.pressFocus} onChange={(v:any) => setTeam({...team, pressFocus: v})} options={PressingFocus} /></>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... [The rest of HomeView, SocialMediaView, etc. components remain unchanged until App component] ...
const HomeView = ({ manager, team, teams, myTeamId, currentWeek, fixtures, onTeamClick }: { manager: ManagerProfile, team: Team, teams: Team[], myTeamId: string, currentWeek: number, fixtures: Fixture[], onTeamClick: (id: string) => void }) => {
    const [tab, setTab] = useState('GENERAL');
    
    // Calculate stats
    const nextMatch = fixtures.find(f => f.week === currentWeek && (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId));
    const opponent = nextMatch ? teams.find(t => t.id === (nextMatch.homeTeamId === myTeamId ? nextMatch.awayTeamId : nextMatch.homeTeamId)) : null;

    // Match Calendar Logic
    const myFixtures = fixtures
        .filter(f => f.homeTeamId === myTeamId || f.awayTeamId === myTeamId)
        .sort((a, b) => a.week - b.week);
    
    // Past 2 matches (played, reverse order for most recent first)
    const pastMatches = myFixtures.filter(f => f.played).slice(-2).reverse();
    // Next 4 matches (not played)
    const futureMatches = myFixtures.filter(f => !f.played).slice(0, 4);

    // Calculate Ranking
    const sortedTeams = [...teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;

    // Calculate Form
    const form = calculateForm(team.id, fixtures);

    const getMatchResult = (f: Fixture) => {
        const isHome = f.homeTeamId === myTeamId;
        const myScore = isHome ? f.homeScore! : f.awayScore!;
        const oppScore = isHome ? f.awayScore! : f.homeScore!;
        if (myScore > oppScore) return { label: 'G', color: 'bg-green-600 text-white' };
        if (myScore < oppScore) return { label: 'M', color: 'bg-red-600 text-white' };
        return { label: 'B', color: 'bg-slate-500 text-white' };
    };

    const tabs = [
        { id: 'GENERAL', label: 'Ana Sayfa', icon: Home },
        { id: 'PROFILE', label: 'Profilim', icon: User },
        { id: 'CONTRACT', label: 'Sözleşmem', icon: FileText },
        { id: 'RELATIONS', label: 'İlişkiler', icon: Heart },
        { id: 'HISTORY', label: 'Geçmişim', icon: History },
    ];

    return (
        <div className="space-y-6">
            {/* New Tabs Style */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/50 px-2 overflow-x-auto">
                {tabs.map((t) => {
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap ${
                                isActive 
                                ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/30'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-500 dark:bg-yellow-400 rounded-t-full shadow-[0_1px_8px_rgba(250,204,21,0.5)]"></div>
                            )}
                            <t.icon size={18} className={`${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {tab === 'GENERAL' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Takım Durumu</h2>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Takım Gücü</div>
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{Math.round(team.strength)}</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Taraftar</div>
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{(team.fanBase/1000000).toFixed(1)}M</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Moral</div>
                                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">%{team.morale}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Sıralama</div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{rank}.</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Puan</div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{team.stats.points}</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Form</div>
                                    <div className="flex justify-center gap-1 mt-3">
                                        {form.length > 0 ? form.map((r, i) => (
                                            <span key={i} className={`w-3 h-3 rounded-full ${r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-slate-400' : 'bg-red-500'}`}></span>
                                        )) : <span className="text-slate-500 text-sm">-</span>}
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sonraki Maç</h2>
                            {opponent ? (
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition" onClick={() => onTeamClick(opponent.id)}>
                                    <div className="flex items-center gap-3">
                                        {opponent.logo && <img src={opponent.logo} className="w-12 h-12 object-contain" />}
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">{opponent.name}</span>
                                    </div>
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">{nextMatch?.homeTeamId === myTeamId ? 'İç Saha' : 'Deplasman'}</span>
                                </div>
                            ) : <div className="p-4 text-slate-500">Bay Haftası</div>}
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        {/* MATCH CALENDAR BLOCK */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="text-yellow-600 dark:text-yellow-500" size={20}/> Maç Takvimi
                            </h2>
                            
                            {/* Last Matches */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Son Sonuçlar</h3>
                                <div className="space-y-2">
                                    {pastMatches.length === 0 && <div className="text-slate-500 text-sm italic">Henüz maç oynanmadı.</div>}
                                    {pastMatches.map(f => {
                                        const isHome = f.homeTeamId === myTeamId;
                                        const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
                                        const opp = teams.find(t => t.id === opponentId);
                                        const res = getMatchResult(f);
                                        
                                        return (
                                            <div key={f.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 transition cursor-pointer" onClick={() => onTeamClick(opponentId)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${res.color}`}>
                                                        {res.label}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{opp?.name}</span>
                                                        <span className="text--[10px] text-slate-500 dark:text-slate-400">{isHome ? 'İç Saha' : 'Deplasman'}</span>
                                                    </div>
                                                </div>
                                                <div className="font-mono font-bold text-lg text-slate-700 dark:text-slate-200">
                                                    {f.homeScore} - {f.awayScore}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Next Matches */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Gelecek Maçlar</h3>
                                <div className="space-y-2">
                                    {futureMatches.length === 0 && <div className="text-slate-500 text-sm italic">Sezon tamamlandı.</div>}
                                    {futureMatches.map(f => {
                                        const isHome = f.homeTeamId === myTeamId;
                                        const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
                                        const opp = teams.find(t => t.id === opponentId);
                                        
                                        return (
                                            <div key={f.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 transition cursor-pointer" onClick={() => onTeamClick(opponentId)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 text-center bg-white dark:bg-slate-800 rounded py-1 border border-slate-200 dark:border-slate-700">
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">{f.week}.</span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Hf</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {opp?.logo && <img src={opp.logo} className="w-5 h-5 object-contain"/>}
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{opp?.name}</span>
                                                    </div>
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded border ${isHome ? 'border-green-600/30 text-green-600 dark:text-green-400' : 'border-red-600/30 text-red-600 dark:text-red-400'}`}>
                                                    {isHome ? 'EV' : 'DEP'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Standings Table */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Puan Durumu</h2>
                            <StandingsTable teams={teams} myTeamId={myTeamId} compact onTeamClick={onTeamClick}/>
                        </div>
                    </div>
                </div>
            )}
            
             {tab === 'PROFILE' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-yellow-500">
                            <User size={48} className="text-slate-400"/>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{manager.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{manager.nationality} • {manager.age} Yaşında</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-yellow-600 dark:text-yellow-500 font-bold text-xl">Güç Seviyesi: {Math.round(manager.power)}</span>
                                <Star className="fill-yellow-600 dark:fill-yellow-500 text-yellow-600 dark:text-yellow-500" size={20}/>
                            </div>
                        </div>
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Kariyer Özeti</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">1</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Kulüp</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{manager.stats.trophies}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Kupa</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{manager.stats.wins}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Galibiyet</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-slate-600 dark:text-slate-300">{manager.stats.draws}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Beraberlik</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{manager.stats.losses}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Mağlubiyet</div>
                        </div>
                        
                         <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsFor}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Atılan Gol</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsAgainst}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Yenilen Gol</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{manager.stats.playersBought}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Transfer (Alınan)</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{manager.stats.playersSold}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Transfer (Satılan)</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-xl font-bold text-slate-900 dark:text-white">{manager.stats.recordTransferFee} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Rekor Transfer</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg col-span-2">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{manager.stats.moneySpent.toFixed(1)} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Toplam Harcanan</div>
                        </div>
                         <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg col-span-3">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{manager.stats.moneyEarned.toFixed(1)} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Toplam Gelir</div>
                        </div>
                     </div>
                 </div>
            )}

            {tab === 'CONTRACT' && (
                <div className="flex justify-center items-center h-full p-4">
                    <div className="bg-white text-slate-900 p-8 rounded shadow-2xl max-w-xl w-full relative border border-slate-200">
                        {/* Header */}
                        <div className="text-center border-b-2 border-slate-100 pb-4 mb-6 relative">
                            <h2 className="text-2xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                                Profesyonel Teknik Direktör<br/>Sözleşmesi
                            </h2>
                            <div className="absolute top-0 right-0 opacity-10">
                                <Feather size={48} className="text-slate-900" />
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4 font-serif text-lg mb-12 px-2">
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Kulüp:</span>
                                <span className="text-slate-900 font-bold">{manager.contract.teamName}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Teknik Direktör:</span>
                                <span className="text-slate-900 font-bold">{manager.name}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Yıllık Ücret:</span>
                                <span className="font-bold text-green-700 font-mono text-xl">{manager.contract.salary} M€</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Bitiş Tarihi:</span>
                                <span className="text-slate-900 font-bold">Haziran {manager.contract.expires}</span>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between items-end mt-12 px-6 relative pb-6">
                            {/* Club Sig */}
                            <div className="text-center relative z-10 w-32">
                                <div className="font-bold text-blue-900 text-lg mb-1 font-serif italic">
                                    {manager.contract.teamName} Yk.
                                </div>
                                <div className="border-t border-slate-400 w-full mx-auto pt-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">KULÜP BAŞKANI</p>
                                </div>
                            </div>
                            
                            {/* Stamp */}
                            <div className="absolute left-1/2 bottom-6 transform -translate-x-1/2 -rotate-12 opacity-90 z-0">
                                <div className="w-28 h-28 rounded-full border-[3px] border-red-800 flex items-center justify-center p-1">
                                    <div className="w-full h-full rounded-full border border-red-800 flex items-center justify-center text-center">
                                        <div className="transform rotate-0">
                                            <span className="text-red-800 font-bold text-[10px] uppercase block mb-1">T.C. SPOR BAKANLIĞI</span>
                                            <span className="text-red-800 font-bold text-sm uppercase leading-tight block">RESMİ<br/>MÜHÜR</span>
                                            <span className="text-red-800 text-[8px] uppercase block mt-1">ONAYLANMIŞTIR</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Manager Sig */}
                            <div className="text-center relative z-10 w-32">
                                <div className="font-serif italic text-blue-900 text-xl mb-1 signature-font">
                                    {manager.name.toLowerCase()}
                                </div>
                                <div className="border-t border-slate-400 w-full mx-auto pt-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TEKNİK DİREKTÖR</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'RELATIONS' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Genel Güven</h2>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400">Yönetim</span><span className="font-bold">{manager.trust.board}%</span></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${manager.trust.board}%`}}/></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400">Taraftar</span><span className="font-bold">{manager.trust.fans}%</span></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{width: `${manager.trust.fans}%`}}/></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400">Oyuncular</span><span className="font-bold">{manager.trust.players}%</span></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-yellow-500" style={{width: `${manager.trust.players}%`}}/></div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400">Hakemler Birliği</span><span className="font-bold">{manager.trust.referees}%</span></div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{width: `${manager.trust.referees}%`}}/></div>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
            
            {tab === 'HISTORY' && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Detaylı Kariyer Geçmişi</h2>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">1</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Kulüp</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{manager.stats.trophies}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Kupa</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{manager.stats.wins}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Galibiyet</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-slate-600 dark:text-slate-300">{manager.stats.draws}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Beraberlik</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{manager.stats.losses}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Mağlubiyet</div>
                        </div>
                        
                         <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsFor}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Atılan Gol</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsAgainst}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Yenilen Gol</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{manager.stats.playersBought}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Transfer (Alınan)</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{manager.stats.playersSold}</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Transfer (Satılan)</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-xl font-bold text-slate-900 dark:text-white">{manager.stats.recordTransferFee} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Rekor Transfer</div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg col-span-2">
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{manager.stats.moneySpent.toFixed(1)} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Toplam Harcanan</div>
                        </div>
                         <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg col-span-3">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{manager.stats.moneyEarned.toFixed(1)} M€</div>
                            <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 mt-1">Toplam Gelir</div>
                        </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

// ... [SocialMediaView and other views remain mostly the same, only App component logic changes significantly] ...

const SocialMediaView = ({ news, teams, messages, onUpdateMessages }: { news: NewsItem[], teams: Team[], messages: Message[], onUpdateMessages: (msgs: Message[]) => void }) => {
    const [tab, setTab] = useState<'SOCIAL' | 'MESSAGES' | 'RUMORS'>('SOCIAL');
    const [interactions, setInteractions] = useState<Record<string, {
        likes: number;
        rts: number;
        liked: boolean;
        rted: boolean;
        comments: string[];
        showComments: boolean;
    }>>({});
    const [replyText, setReplyText] = useState("");
    
    const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if(selectedMessageId) scrollToBottom();
    }, [selectedMessageId, messages]);

    const handleSendChatMessage = (selectedText: string) => {
        if(!selectedMessageId) return;
        
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const updatedMessages = messages.map(msg => {
            if(msg.id === selectedMessageId) {
                return {
                    ...msg,
                    preview: `Siz: ${selectedText}`, // Update preview
                    date: 'Şimdi',
                    history: [...msg.history, { id: Date.now(), text: selectedText, time: timeString, isMe: true }],
                    options: [] // Clear options here to prevent further replies
                };
            }
            return msg;
        });
        
        onUpdateMessages(updatedMessages);
    };

    // Initialize random stats for news items if they don't exist
    useEffect(() => {
        const newInteractions = { ...interactions };
        let hasChanges = false;

        news.forEach(n => {
            if (!newInteractions[n.id]) {
                newInteractions[n.id] = {
                    likes: Math.floor(Math.random() * 500) + 12,
                    rts: Math.floor(Math.random() * 50) + 2,
                    liked: false,
                    rted: false,
                    comments: [],
                    showComments: false
                };
                hasChanges = true;
            }
        });

        if (hasChanges) {
            setInteractions(newInteractions);
        }
    }, [news]); // Only dependency is news

    const toggleLike = (id: string) => {
        setInteractions(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                likes: prev[id].liked ? prev[id].likes - 1 : prev[id].likes + 1,
                liked: !prev[id].liked
            }
        }));
    };

    const toggleRt = (id: string) => {
        setInteractions(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                rts: prev[id].rted ? prev[id].rts - 1 : prev[id].rts + 1,
                rted: !prev[id].rted
            }
        }));
    };

    const toggleComments = (id: string) => {
        setInteractions(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                showComments: !prev[id].showComments
            }
        }));
    };

    const submitComment = (id: string) => {
        if (!replyText.trim()) return;
        setInteractions(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                comments: [...prev[id].comments, replyText]
            }
        }));
        setReplyText("");
    };

    // Fake Rumors Data
    const rumors = [
        { id: 1, text: 'Galatasaray, Kedispor\'un yıldız forveti için 20M€ teklif etmeye hazırlanıyor.', source: 'Fanatik', reliability: 80 },
        { id: 2, text: 'Ayıboğanspor teknik direktörünün koltuğu sallantıda.', source: 'Sosyal Medya', reliability: 45 },
        { id: 3, text: 'Köpekspor, stadyum kapasitesini artırma kararı aldı.', source: 'Yerel Basın', reliability: 90 },
        { id: 4, text: 'Eşşekboğanspor\'un kalecisi antrenmanda takım arkadaşıyla kavga etti.', source: 'Duyumcu', reliability: 60 }
    ];

    // Calculate unread count
    const unreadCount = messages.filter(m => !m.read).length;

    // Define tabs for rendering
    const tabs = [
        { id: 'SOCIAL', label: 'Sosyal Medya', icon: Smartphone },
        { id: 'MESSAGES', label: 'Mesajlar', icon: Mail, badge: unreadCount > 0 ? unreadCount : undefined },
        { id: 'RUMORS', label: 'Söylentiler', icon: Hash },
    ];
    
    // Helper for random avatars colors
    const getAvatarColor = (index: number) => {
        const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
        return colors[index % colors.length];
    };

    // --- RENDER LOGIC FOR CHAT VIEW ---
    if (tab === 'MESSAGES' && selectedMessageId !== null) {
        const activeConversation = messages.find(m => m.id === selectedMessageId);
        if(activeConversation) {
            return (
                <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-w-4xl mx-auto shadow-sm">
                    {/* Chat Header */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
                        <button onClick={() => setSelectedMessageId(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition">
                            <ChevronLeft size={24}/>
                        </button>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${activeConversation.avatarColor}`}>
                            {activeConversation.sender.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 dark:text-white">{activeConversation.sender}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{activeConversation.subject}</div>
                        </div>
                    </div>
                    
                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100 dark:bg-slate-800/50">
                        {activeConversation.history.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-600'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                    <div className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>{msg.time}</div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Options Area (Changed from Input) */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                        {activeConversation.options.length > 0 ? (
                            <>
                                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Cevap Seçenekleri</div>
                                {activeConversation.options.map((opt, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSendChatMessage(opt)}
                                        className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white border border-slate-300 dark:border-slate-600 hover:border-yellow-500 dark:hover:border-yellow-500 p-3 rounded-lg text-sm text-left transition-all font-bold flex gap-2 items-center group shadow-sm"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-yellow-500 group-hover:text-black flex items-center justify-center text-xs shrink-0">{idx + 1}</span>
                                        {opt}
                                    </button>
                                ))}
                            </>
                        ) : (
                             <div className="text-center text-slate-500 py-4 italic flex items-center justify-center gap-2">
                                 <span className="animate-pulse">●</span> Karşı taraftan cevap bekleniyor...
                             </div>
                        )}
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Social Header with Tabs - Updated Style */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/50 px-2 mb-6 overflow-x-auto">
                {tabs.map((t) => {
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap ${
                                isActive 
                                ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/30'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-600 dark:bg-yellow-400 rounded-t-full shadow-[0_1px_8px_rgba(250,204,21,0.5)]"></div>
                            )}
                            <t.icon size={18} className={`${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                            <span>{t.label}</span>
                            {t.badge && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 animate-pulse">{t.badge}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {/* SOCIAL FEED - Now Fan Tweets */}
                {tab === 'SOCIAL' && news.map((n, idx) => {
                    // Extract name and handle from 'title' field which we set as "Name|Handle|TeamName" or "Name (Handle)"
                    let name = "Taraftar";
                    let handle = "@taraftar";
                    let teamAffiliation = "";

                    // New format support
                    if (n.title.includes('|')) {
                        const parts = n.title.split('|');
                        name = parts[0];
                        handle = parts[1];
                        teamAffiliation = parts[2];
                    } 
                    // Fallback to old format
                    else if (n.title.includes('(')) {
                        const parts = n.title.split('(');
                        name = parts[0].trim();
                        handle = parts[1].replace(')', '').trim();
                    } else {
                        name = n.title;
                        handle = `@${n.title.toLowerCase().replace(/\s/g, '')}`;
                    }
                    
                    const avatarColor = getAvatarColor(idx);
                    
                    // Find team for badge
                    const fanTeam = teams.find(t => t.name === teamAffiliation);
                    
                    const stats = interactions[n.id] || { likes: 0, rts: 0, liked: false, rted: false, comments: [], showComments: false };

                    return (
                        <div key={n.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex gap-4 shadow-sm">
                            <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${avatarColor} text-white font-bold`}>
                                {name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-900 dark:text-white text-base">{name}</span>
                                    <span className="text-slate-500 text-sm">{handle}</span>
                                    
                                    {fanTeam ? (
                                        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${fanTeam.colors[0]} ${fanTeam.colors[1]} border-slate-300 dark:border-slate-600`}>
                                            {fanTeam.logo && <img src={fanTeam.logo} className="w-3 h-3 object-contain" alt="" />}
                                            <span className="font-bold uppercase tracking-wide">{fanTeam.name}</span>
                                        </span>
                                    ) : teamAffiliation ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 uppercase tracking-wide">
                                            {teamAffiliation}
                                        </span>
                                    ) : null}

                                    <span className="text-slate-500 dark:text-slate-600 text-xs ml-auto">• {n.week}. Hafta</span>
                                </div>
                                {/* Tweet Content */}
                                <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed mb-2">{n.content}</p>
                                
                                <div className="mt-2 flex gap-6 text-slate-500 text-xs font-bold border-t border-slate-200 dark:border-slate-700/50 pt-2 items-center">
                                    <button 
                                        onClick={() => toggleComments(n.id)}
                                        className={`flex items-center gap-1 cursor-pointer transition ${stats.showComments ? 'text-blue-400' : 'hover:text-blue-400'}`}
                                    >
                                        <MessageSquare size={16} className={stats.showComments ? 'fill-blue-400 text-blue-400' : ''}/> 
                                        {Math.floor(stats.likes/10) + stats.comments.length}
                                    </button>
                                    
                                    <button 
                                        onClick={() => toggleRt(n.id)}
                                        className={`flex items-center gap-1 cursor-pointer transition ${stats.rted ? 'text-green-500' : 'hover:text-green-500'}`}
                                    >
                                        <RotateCcw size={16} /> 
                                        {stats.rts}
                                    </button>
                                    
                                    <button 
                                        onClick={() => toggleLike(n.id)}
                                        className={`flex items-center gap-1 cursor-pointer transition ${stats.liked ? 'text-red-500' : 'hover:text-red-500'}`}
                                    >
                                        <Heart size={16} className={stats.liked ? 'fill-red-500 text-red-500' : ''}/> 
                                        {stats.likes}
                                    </button>
                                </div>

                                {/* Comments Section */}
                                {stats.showComments && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                        {/* Existing Comments */}
                                        {stats.comments.length > 0 && (
                                            <div className="space-y-3 mb-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                                {stats.comments.map((comment, i) => (
                                                    <div key={i} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                                                            <User size={16} className="text-slate-500 dark:text-slate-400"/>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-900 dark:text-white text-sm">Ben</span>
                                                                <span className="text-xs text-slate-500">Şimdi</span>
                                                            </div>
                                                            <p className="text-slate-700 dark:text-slate-300 text-sm">{comment}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Input Box */}
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Yorumunu yaz..." 
                                                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-500 dark:placeholder-slate-600"
                                                onKeyDown={(e) => e.key === 'Enter' && submitComment(n.id)}
                                            />
                                            <button 
                                                onClick={() => submitComment(n.id)}
                                                disabled={!replyText.trim()}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition flex items-center"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* MESSAGES */}
                {tab === 'MESSAGES' && messages.map(msg => (
                    <div 
                        key={msg.id} 
                        onClick={() => {
                            setSelectedMessageId(msg.id);
                            // Update read status using parent handler
                            const updatedMessages = messages.map(m => m.id === msg.id ? { ...m, read: true } : m);
                            onUpdateMessages(updatedMessages);
                        }} 
                        className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-4 shadow-sm ${msg.read ? 'border-slate-200 dark:border-slate-700' : 'border-l-4 border-l-green-500 border-slate-200 dark:border-slate-700'}`}
                    >
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${msg.avatarColor}`}>
                             {msg.sender.charAt(0)}
                         </div>
                         <div className="flex-1">
                             <div className="flex justify-between items-center mb-1">
                                 <span className={`font-bold ${msg.read ? 'text-slate-500 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{msg.sender}</span>
                                 <span className="text-xs text-slate-500">{msg.date}</span>
                             </div>
                             <div className="text-sm text-yellow-600 dark:text-yellow-500 font-bold mb-1">{msg.subject}</div>
                             <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{msg.preview}</p>
                         </div>
                    </div>
                ))}

                {/* RUMORS */}
                {tab === 'RUMORS' && rumors.map(r => (
                    <div key={r.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group shadow-sm">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
                            <Hash size={64} className="text-slate-900 dark:text-white"/>
                        </div>
                        <div className="flex justify-between items-start mb-2">
                             <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">{r.source}</span>
                             <div className="flex items-center gap-1 text-xs">
                                 <span className="text-slate-500">Güvenilirlik:</span>
                                 <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                     <div className={`h-full ${r.reliability > 70 ? 'bg-green-500' : r.reliability > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${r.reliability}%`}}></div>
                                 </div>
                             </div>
                        </div>
                        <p className="text-slate-900 dark:text-white text-lg font-serif italic">"{r.text}"</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MatchResultModal = ({ homeTeam, awayTeam, homeScore, awayScore, stats, events, onProceed }: {homeTeam: Team, awayTeam: Team, homeScore: number, awayScore: number, stats: MatchStats, events: MatchEvent[], onProceed: () => void }) => {
    const [statsTab, setStatsTab] = useState<'STATS' | 'RATINGS'>('STATS');

    // Filter out purely informational events to keep the timeline clean
    const timelineEvents = events.filter(e => 
        e.type === 'GOAL' || 
        e.type === 'CARD_YELLOW' || 
        e.type === 'CARD_RED' || 
        e.type === 'INJURY' || 
        e.type === 'VAR' ||
        e.type === 'MISS' // Optional: Show missed penalties or huge chances
    ).sort((a,b) => a.minute - b.minute);

    const getEventIcon = (type: MatchEvent['type']) => {
        switch(type) {
            case 'GOAL': return <Disc size={16} className="text-white fill-white"/>; // Ball representation
            case 'CARD_YELLOW': return <div className="w-3 h-4 bg-yellow-500 rounded-sm border border-yellow-600 shadow-sm"></div>;
            case 'CARD_RED': return <div className="w-3 h-4 bg-red-600 rounded-sm border border-red-700 shadow-sm"></div>;
            case 'INJURY': return <Syringe size={16} className="text-red-400"/>;
            case 'VAR': return <MonitorPlay size={16} className="text-purple-400"/>;
            default: return <Activity size={16} className="text-slate-400"/>;
        }
    };

    const renderPlayerRatings = (ratings: any[], teamName: string) => (
        <div className="mb-6 last:mb-0">
            <div className="text-sm font-bold text-slate-400 uppercase mb-2 border-b border-slate-700 pb-1 flex justify-between">
                <span>{teamName}</span>
                <span className="flex gap-4"><span>Puan</span><span>Gol</span></span>
            </div>
            <div className="space-y-1">
                {ratings.sort((a,b) => b.rating - a.rating).map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-1.5 hover:bg-slate-700/50 rounded transition">
                         <div className="flex items-center gap-2">
                             <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${p.position === 'GK' ? 'bg-yellow-600' : p.position === 'DEF' ? 'bg-blue-600' : p.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>
                                 {p.position}
                             </div>
                             <span className="text-slate-200 font-medium truncate max-w-[120px]">{p.name}</span>
                             {stats.mvpPlayerName === p.name && <Star size={12} className="text-yellow-400 fill-yellow-400"/>}
                         </div>
                         <div className="flex gap-4 font-mono">
                             <span className={`font-bold w-8 text-center ${p.rating >= 8.0 ? 'text-green-400' : p.rating >= 6.0 ? 'text-yellow-400' : 'text-red-400'}`}>{p.rating}</span>
                             <span className={`w-6 text-center ${p.goals > 0 ? 'text-green-400 font-bold' : 'text-slate-600'}`}>{p.goals || '-'}</span>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
             <div className="text-center mb-6 animate-in zoom-in duration-500 w-full max-w-4xl mt-10">
                 <div className="text-6xl font-mono font-bold text-white mb-4 bg-slate-900 px-8 py-4 rounded-xl border border-slate-700 shadow-2xl flex items-center justify-center gap-8">
                     <div className="flex flex-col items-center">
                        <img src={homeTeam.logo} className="w-20 h-20 object-contain mb-2"/>
                        <span className="text-sm font-sans font-normal text-slate-400 truncate w-20 text-center">{homeTeam.name}</span>
                     </div>
                     <span>{homeScore} - {awayScore}</span>
                     <div className="flex flex-col items-center">
                        <img src={awayTeam.logo} className="w-20 h-20 object-contain mb-2"/>
                        <span className="text-sm font-sans font-normal text-slate-400 truncate w-20 text-center">{awayTeam.name}</span>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
                     
                     {/* LEFT COLUMN: MATCH FLOW TIMELINE */}
                     <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-96 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2 text-center flex items-center justify-center gap-2">
                            <Activity size={16}/> Maç Akışı
                        </h3>
                        <div className="flex-1 overflow-y-auto relative px-2">
                             {/* Vertical Spine */}
                             <div className="absolute left-1/2 top-2 bottom-2 w-px bg-slate-700 -translate-x-1/2"></div>
                             
                             {timelineEvents.length === 0 && (
                                 <div className="text-center text-slate-500 text-sm mt-10 italic">Önemli bir olay yaşanmadı.</div>
                             )}

                             {timelineEvents.map((e, i) => {
                                 const isHome = e.teamName === homeTeam.name;
                                 const isGoal = e.type === 'GOAL';
                                 
                                 return (
                                     <div key={i} className={`flex items-center justify-between mb-4 relative w-full`}>
                                         {/* Left Side (Home) */}
                                         <div className={`flex-1 flex items-center gap-2 ${isHome ? 'justify-end pr-4' : 'opacity-0'}`}>
                                             {isHome && (
                                                 <>
                                                     <span className={`text-sm font-bold ${isGoal ? 'text-green-400' : 'text-white'}`}>{e.scorer || e.playerId || 'Olay'}</span>
                                                     {getEventIcon(e.type)}
                                                 </>
                                             )}
                                         </div>

                                         {/* Center (Minute) */}
                                         <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 z-10 shrink-0 shadow-lg">
                                             {e.minute}'
                                         </div>

                                         {/* Right Side (Away) */}
                                         <div className={`flex-1 flex items-center gap-2 ${!isHome ? 'justify-start pl-4' : 'opacity-0'}`}>
                                             {!isHome && (
                                                 <>
                                                     {getEventIcon(e.type)}
                                                     <span className={`text-sm font-bold ${isGoal ? 'text-green-400' : 'text-white'}`}>{e.scorer || e.playerId || 'Olay'}</span>
                                                 </>
                                             )}
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                     </div>

                     {/* RIGHT COLUMN: MATCH STATS OR PLAYER RATINGS */}
                     <div className="bg-slate-800 rounded-xl border border-slate-700 h-96 flex flex-col overflow-hidden">
                        <div className="flex border-b border-slate-700">
                             <button 
                                onClick={() => setStatsTab('STATS')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition ${statsTab === 'STATS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                 <BarChart2 size={16}/> Takım İstatistikleri
                             </button>
                             <button 
                                onClick={() => setStatsTab('RATINGS')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition ${statsTab === 'RATINGS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                 <Users size={16}/> Oyuncu Puanları
                             </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            {statsTab === 'STATS' ? (
                                <div className="space-y-5 text-sm">
                                     {/* Possession */}
                                     <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold ${stats.homePossession > stats.awayPossession ? 'text-white' : 'text-slate-400'}`}>%{stats.homePossession}</span>
                                            <span className="text-slate-500 uppercase text-xs">Topla Oynama</span>
                                            <span className={`font-bold ${stats.awayPossession > stats.homePossession ? 'text-white' : 'text-slate-400'}`}>%{stats.awayPossession}</span>
                                        </div>
                                        <div className="flex h-2 rounded-full overflow-hidden bg-slate-900">
                                            <div className="bg-blue-500 h-full" style={{width: `${stats.homePossession}%`}}></div>
                                            <div className="bg-red-500 h-full" style={{width: `${stats.awayPossession}%`}}></div>
                                        </div>
                                    </div>

                                     {/* Shots */}
                                     <div className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                                        <span className={`font-bold ${stats.homeShots > stats.awayShots ? 'text-green-400' : 'text-slate-300'}`}>{stats.homeShots}</span>
                                        <span className="text-slate-500 uppercase text-xs">Şut</span>
                                        <span className={`font-bold ${stats.awayShots > stats.homeShots ? 'text-green-400' : 'text-slate-300'}`}>{stats.awayShots}</span>
                                    </div>

                                    {/* Shots on Target */}
                                    <div className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                                        <span className={`font-bold ${stats.homeShotsOnTarget > stats.awayShotsOnTarget ? 'text-green-400' : 'text-slate-300'}`}>{stats.homeShotsOnTarget}</span>
                                        <span className="text-slate-500 uppercase text-xs">İsabetli Şut</span>
                                        <span className={`font-bold ${stats.awayShotsOnTarget > stats.homeShotsOnTarget ? 'text-green-400' : 'text-slate-300'}`}>{stats.awayShotsOnTarget}</span>
                                    </div>

                                     {/* Corners */}
                                     <div className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                                        <span className="font-bold text-slate-300">{stats.homeCorners}</span>
                                        <span className="text-slate-500 uppercase text-xs">Korner</span>
                                        <span className="font-bold text-slate-300">{stats.awayCorners}</span>
                                    </div>

                                     {/* Fouls */}
                                     <div className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
                                        <span className="font-bold text-slate-300">{stats.homeFouls}</span>
                                        <span className="text-slate-500 uppercase text-xs">Faul</span>
                                        <span className="font-bold text-slate-300">{stats.awayFouls}</span>
                                    </div>

                                    {/* Cards */}
                                     <div className="flex justify-between items-center py-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-4 bg-yellow-500 rounded-sm"></div>
                                            <span className="font-bold text-white">{stats.homeYellowCards}</span>
                                            <div className="w-3 h-4 bg-red-600 rounded-sm"></div>
                                            <span className="font-bold text-white">{stats.homeRedCards}</span>
                                        </div>
                                        <span className="text-slate-500 uppercase text-xs">Kartlar</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{stats.awayYellowCards}</span>
                                            <div className="w-3 h-4 bg-yellow-500 rounded-sm"></div>
                                            <span className="font-bold text-white">{stats.awayRedCards}</span>
                                            <div className="w-3 h-4 bg-red-600 rounded-sm"></div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                                        <span className="text-slate-500 uppercase text-xs">Maçın Adamı</span>
                                        <div className="font-bold text-yellow-400 text-lg flex justify-center items-center gap-2 mt-1">
                                            <Star size={16} className="fill-yellow-400"/> {stats.mvpPlayerName}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {renderPlayerRatings(stats.homeRatings, homeTeam.name)}
                                    {renderPlayerRatings(stats.awayRatings, awayTeam.name)}
                                </div>
                            )}
                        </div>
                     </div>

                 </div>
             </div>
             
             <button onClick={onProceed} className="bg-white text-black px-8 py-4 rounded-lg font-bold text-xl hover:scale-105 transition mb-8 shadow-xl">
                 BASIN TOPLANTISINA GEÇ
             </button>
        </div>
    );
}

const MatchSimulation = ({ 
    homeTeam, awayTeam, onFinish, allTeams, fixtures
}: { 
    homeTeam: Team, awayTeam: Team, onFinish: (h: number, a: number, events: MatchEvent[], stats: MatchStats) => void, allTeams: Team[], fixtures: Fixture[]
}) => {
    // ... [MatchSimulation remains largely unchanged, just ensuring no conflicts] ...
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

// ... [TrainingView, MatchPreview, LockerRoomView, PostMatchInterview, FixturesView, TransferView are largely unchanged] ...

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

const MatchPreview = ({ fixture, homeTeam, awayTeam, onProceed }: { fixture: Fixture, homeTeam: Team, awayTeam: Team, onProceed: () => void }) => {
    // Calculate odds on the fly
    const odds = calculateOdds(homeTeam, awayTeam);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Match Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 flex items-center justify-between shadow-sm">
                 <div className="flex flex-col items-center w-1/3">
                     <img src={homeTeam.logo} className="w-32 h-32 object-contain mb-4" />
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">{homeTeam.name}</h2>
                     <div className="flex gap-1 mt-2">{[...Array(homeTeam.stars)].map((_,i)=><Star key={i} size={16} className="fill-yellow-500 text-yellow-500"/>)}</div>
                 </div>
                 
                 <div className="flex flex-col items-center w-1/3">
                     <div className="text-4xl font-bold text-slate-400 dark:text-slate-500 font-mono mb-2">VS</div>
                     <div className="bg-slate-100 dark:bg-slate-900 px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-center w-full">
                         <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">Bahis Oranları</div>
                         <div className="flex justify-between font-mono font-bold">
                             <span className="text-green-600 dark:text-green-400">{odds.home}</span>
                             <span className="text-slate-600 dark:text-slate-300">{odds.draw}</span>
                             <span className="text-red-600 dark:text-red-400">{odds.away}</span>
                         </div>
                     </div>
                     <div className="mt-4 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 uppercase font-bold tracking-widest mb-1">
                            <Home size={14} /> Stadyum
                        </div>
                        <div className="text-slate-900 dark:text-white text-lg font-bold tracking-wide">{homeTeam.stadiumName}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">{homeTeam.stadiumCapacity.toLocaleString()} Kişilik</div>
                     </div>
                 </div>

                 <div className="flex flex-col items-center w-1/3">
                     <img src={awayTeam.logo} className="w-32 h-32 object-contain mb-4" />
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">{awayTeam.name}</h2>
                     <div className="flex gap-1 mt-2">{[...Array(awayTeam.stars)].map((_,i)=><Star key={i} size={16} className="fill-yellow-500 text-yellow-500"/>)}</div>
                 </div>
            </div>
            
            <div className="flex justify-center">
                <button onClick={onProceed} className="bg-green-600 hover:bg-green-500 text-white font-bold text-xl px-12 py-4 rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-3">
                    SOYUNMA ODASINA GİT <ChevronRight size={24}/>
                </button>
            </div>
        </div>
    );
};

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

const PostMatchInterview = ({ result, onClose }: { result: 'WIN' | 'LOSS' | 'DRAW', onClose: () => void }) => {
    const [currentQuestion, setCurrentQuestion] = useState<{question: string, options: string[]} | null>(null);

    // Dynamic Interview Questions based on Result
    const questionsByResult = {
        'WIN': [
            {
                question: "Bugünkü galibiyette rakibin zayıflığı mı yoksa sizin üstünlüğünüz mü belirleyici oldu?",
                options: [
                    "Biz iyiydik, rakibin durumu beni ilgilendirmiyor.",
                    "Açıkçası rakip bize direnemedi.",
                    "İkisi de… ama biz daha akıllı oynadık."
                ]
            },
            // ... (Rest of interview questions remain unchanged)
            {
                question: "Hakemin bazı kararları tartışma yarattı. Maçı etkilediğini düşünüyor musunuz?",
                options: [
                    "Hakem konuşmak istemiyorum, kazanan biziz.",
                    "Bence bazı kararlar bize avantaj sağladı.",
                    "Sahada adalet yoktu ama buna rağmen kazandık."
                ]
            },
            {
                question: "Rakip teknik direktör maçtan önce sizi küçümsemişti. Cevabınızı sahada mı verdiniz?",
                options: [
                    "Biz konuşmayız, oynarız.",
                    "Evet, cevap en güzel sahada verilir.",
                    "Onun söyledikleri bizi ekstra motive etti."
                ]
            },
            {
                question: "Takımınız bugün sınırlarını mı zorladı yoksa bu performans artık normal mi?",
                options: [
                    "Bu takımın standardı bu.",
                    "Daha iyisini de yapabiliriz.",
                    "Oyuncular kendilerini aştı."
                ]
            },
            {
                question: "Skor daha da farklı olabilirdi. Bilerek mi tempoyu düşürdünüz?",
                options: [
                    "Maçı kontrol altında tuttuk.",
                    "Rakibe saygıdan dolayı bastırmadık.",
                    "İstesek farkı açardık."
                ]
            },
            {
                question: "Bu galibiyetle birlikte sizi şampiyonluk favorisi ilan edenler var. Baskı hissediyor musunuz?",
                options: [
                    "Baskıyı kaldırabilecek bir takımız.",
                    "Favori olmak bizi ilgilendirmiyor.",
                    "Bu baskıdan keyif alıyoruz."
                ]
            },
            {
                question: "Bazı oyuncularınız maç içinde bencil oynadı. Bu sizi rahatsız etti mi?",
                options: [
                    "Önemli olan takımın kazanması.",
                    "Bazı tercihler daha iyi olabilirdi.",
                    "Bunu soyunma odasında konuşuruz."
                ]
            },
            {
                question: "Taraftar galibiyete rağmen zaman zaman homurdanıyordu. Onlara bir mesajınız var mı?",
                options: [
                    "Destekleri bizim için çok değerli.",
                    "Eleştiri futbolda normal.",
                    "Bu takım daha fazlasını hak ediyor."
                ]
            },
            {
                question: "Rakibin savunması çok eleştiriliyor. Sizce bu lig seviyesinde miydi?",
                options: [
                    "Rakip hakkında konuşmak bana düşmez.",
                    "Bize karşı çaresiz kaldılar.",
                    "Bugün savunmaları çok dağınıktı."
                ]
            },
            {
                question: "Bu galibiyet soyunma odasında dengeleri değiştirir mi?",
                options: [
                    "Rekabet her zaman canlı.",
                    "Özgüven artışı olacak.",
                    "Bazı oyuncuların yeri sağlamlaştı."
                ]
            },
            {
                question: "Basın sizi sezon başında eleştiriyordu. Şimdi ne söylemek istersiniz?",
                options: [
                    "Futbol cevap verir.",
                    "Bizi erken yargıladılar.",
                    "Bu daha başlangıç."
                ]
            },
            {
                question: "Bu maçtan sonra rakiplerin sizi daha sert oynamasından endişe ediyor musunuz?",
                options: [
                    "Biz buna hazırız.",
                    "Kimseye boyun eğmeyiz.",
                    "Sahada cevap veririz."
                ]
            }
        ],
        'LOSS': [
            {
                question: "Bugün sahada istediklerinizi yapamadınız, mağlubiyetin ana sebebi neydi?",
                options: [
                    "Sorumluluk tamamen bende, doğru kararları veremedim.",
                    "Hakem kararları oyunun önüne geçti.",
                    "Bu performans bizim seviyemiz değil."
                ]
            },
            // ... (rest of loss questions)
            {
                question: "Takımınız maçın büyük bölümünde kontrolü kaybetti. Bu bir hazırlık problemi mi?",
                options: [
                    "Hazırlığımız yeterliydi, sahada karşılığını alamadık.",
                    "Mental olarak bu maça hazır değildik.",
                    "Rakip bizi beklediğimizden daha iyi analiz etmiş."
                ]
            },
            {
                question: "Savunmada yapılan hatalar pahalıya patladı. Bu oyunculara güveniniz sarsıldı mı?",
                options: [
                    "Hatalar olur, arkasında duracağım.",
                    "Bazı oyuncular sorumluluk almakta zorlandı.",
                    "Bu seviyede bu hatalar kabul edilemez."
                ]
            },
            {
                question: "Maç planınızın tutmadığı çok netti. Devre arasında neden değişiklik gelmedi?",
                options: [
                    "Oyuna sadık kalmayı tercih ettim.",
                    "Değişiklik için doğru anı bekledim.",
                    "Evet, geç kaldım."
                ]
            },
            {
                question: "Taraftarlar maç sonunda sizi yuhaladı. Bu sizi etkiliyor mu?",
                options: [
                    "Tepkileri anlıyorum, sorumluluk bana ait.",
                    "Bu formayı taşıyan herkes eleştiriye açık olmalı.",
                    "Bu takım yalnız bırakılmayı hak etmiyor."
                ]
            },
            {
                question: "Rakip teknik direktör sizi taktiksel olarak yendiğini söyledi. Katılıyor musunuz?",
                options: [
                    "Bugün rakip daha doğru oynadı.",
                    "Bu yoruma katılmıyorum.",
                    "Bazı hamlelerde geride kaldım."
                ]
            },
            {
                question: "Son haftalardaki düşüş tesadüf mü yoksa daha büyük bir sorunun işareti mi?",
                options: [
                    "Geçici bir dönemden geçiyoruz.",
                    "Bazı şeyleri yeniden düşünmeliyiz.",
                    "Bu düşüşü durdurmak zorundayız."
                ]
            },
            {
                question: "Bazı oyuncuların mücadele etmediği yönünde yorumlar var. Siz ne düşünüyorsunuz?",
                options: [
                    "Sahada herkes elinden geleni yaptı.",
                    "Bazı isimler beklentinin altında kaldı.",
                    "Bu formayı giyen herkes savaşmak zorunda."
                ]
            },
            {
                question: "Bu mağlubiyet soyunma odasında dengeleri değiştirir mi?",
                options: [
                    "Hayır, birlik olmamız gerekiyor.",
                    "Rekabet artacaktır.",
                    "Bazı kararlar almam gerekecek."
                ]
            },
            {
                question: "Hakem yönetimi hakkında federasyona başvurmayı düşünüyor musunuz?",
                options: [
                    "Hayır, futbola odaklanacağız.",
                    "Gerekli yerlere ileteceğiz.",
                    "Bu şekilde susamayız."
                ]
            },
            {
                question: "Bu sonuçtan sonra koltuğunuzun tartışılacağını düşünüyor musunuz?",
                options: [
                    "Bunlar futbolda doğal şeyler.",
                    "İşimden eminim.",
                    "Ben işime bakıyorum."
                ]
            },
            {
                question: "Oyuncularınıza maçtan sonra ilk söylediğiniz cümle ne oldu?",
                options: [
                    "Başımızı kaldırıp devam edeceğiz.",
                    "Bu seviyede daha fazlası lazım.",
                    "Bu performansı kabul etmiyorum."
                ]
            }
        ],
        'DRAW': [
            {
                question: "Zorlu bir mücadele oldu, 1 puan kazanç mı kayıp mı?",
                options: [
                    "Deplasmanda alınan 1 puan her zaman değerlidir.",
                    "Kesinlikle 2 puan bıraktık, kazanmamız gereken bir maçtı.",
                    "Oyunun hakkı beraberlikti, iki takımı da tebrik ederim."
                ]
            },
            // ... (rest of draw questions)
            {
                question: "Golsüz geçen dakikalar takımı strese soktu mu?",
                options: [
                    "Gol yollarında daha becerikli olmalıydık.",
                    "Rakip kapanınca kilidi açmakta zorlandık.",
                    "Pozisyonlara girdik ama son vuruşlarda şanssızdık."
                ]
            },
            {
                question: "Son dakikalardaki baskı golü getirmeye yetmedi, ne eksikti?",
                options: [
                    "Biraz daha süre olsa kazanabilirdik.",
                    "Yorgunluk belirtileri vardı, final paslarını yapamadık.",
                    "Rakip oyunu iyi soğuttu, tempomuzu bozdular."
                ]
            }
        ]
    };

    useEffect(() => {
        const pool = questionsByResult[result];
        const randomQ = pool[Math.floor(Math.random() * pool.length)];
        setCurrentQuestion(randomQ);
    }, [result]);

    const handleOptionClick = () => {
        onClose();
    };

    if (!currentQuestion) return null;

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-300">
             <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 w-full shadow-2xl relative">
                 <div className="absolute top-4 right-4 text-xs text-slate-500 font-mono">
                    Soru 1 / 1
                 </div>
                 <Mic size={48} className={`mx-auto mb-4 animate-pulse ${result === 'WIN' ? 'text-green-600 dark:text-green-500' : result === 'LOSS' ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-500'}`}/>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Basın Toplantısı</h2>
                 
                 <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-lg text-left mb-6 border-l-4 border-yellow-500 shadow-inner">
                     <span className="text-xs text-yellow-600 dark:text-yellow-500 font-bold uppercase block mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Muhabir
                     </span>
                     <p className="text-slate-900 dark:text-white text-lg font-serif italic">"{currentQuestion.question}"</p>
                 </div>

                 <div className="space-y-3">
                     {currentQuestion.options.map((opt, idx) => (
                         <button 
                            key={idx} 
                            onClick={handleOptionClick} 
                            className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-4 rounded-lg text-left text-sm transition-all text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white hover:shadow-lg group"
                         >
                             <span className="font-bold text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 mr-2">{idx + 1}.</span> {opt}
                         </button>
                     ))}
                 </div>
             </div>
        </div>
    );
};

const FixturesView = ({ fixtures, teams, myTeamId, currentWeek, onTeamClick, onFixtureClick }: { fixtures: Fixture[], teams: Team[], myTeamId: string, currentWeek: number, onTeamClick: (id: string) => void, onFixtureClick: (f: Fixture) => void }) => {
    const [viewWeek, setViewWeek] = useState(currentWeek);
    
    // Group fixtures by week
    const weeks = Array.from(new Set(fixtures.map(f => f.week))).sort((a,b) => a - b);
    const currentFixtures = fixtures.filter(f => f.week === viewWeek);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <button onClick={() => setViewWeek(w => Math.max(weeks[0], w - 1))} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-900 dark:text-white"><ChevronLeft /></button>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{viewWeek}. HAFTA</div>
                <button onClick={() => setViewWeek(w => Math.min(weeks[weeks.length-1], w + 1))} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-900 dark:text-white"><ChevronRight /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentFixtures.map(f => {
                    const home = teams.find(t => t.id === f.homeTeamId);
                    const away = teams.find(t => t.id === f.awayTeamId);
                    if(!home || !away) return null;
                    const isMyMatch = f.homeTeamId === myTeamId || f.awayTeamId === myTeamId;
                    
                    return (
                        <div key={f.id} onClick={() => f.played && onFixtureClick(f)} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border ${isMyMatch ? 'border-yellow-500' : 'border-slate-200 dark:border-slate-700'} ${f.played ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : ''} flex items-center justify-between shadow-sm`}>
                             <div className="flex items-center gap-3 w-1/3 cursor-pointer hover:opacity-80" onClick={(e) => { e.stopPropagation(); onTeamClick(home.id); }}>
                                 {home.logo ? <img src={home.logo} className="w-8 h-8 object-contain"/> : <div className={`w-8 h-8 rounded-full ${home.colors[0]}`} />}
                                 <span className="font-bold text-sm truncate text-slate-900 dark:text-white">{home.name}</span>
                             </div>
                             <div className={`text-center w-1/3 font-mono font-bold text-lg bg-slate-100 dark:bg-slate-900 py-1 rounded ${f.played ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                 {f.played ? `${f.homeScore} - ${f.awayScore}` : 'v'}
                             </div>
                             <div className="flex items-center gap-3 w-1/3 justify-end cursor-pointer hover:opacity-80" onClick={(e) => { e.stopPropagation(); onTeamClick(away.id); }}>
                                 <span className="font-bold text-sm truncate text-slate-900 dark:text-white">{away.name}</span>
                                 {away.logo ? <img src={away.logo} className="w-8 h-8 object-contain"/> : <div className={`w-8 h-8 rounded-full ${away.colors[0]}`} />}
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TransferView = ({ transferList, team, budget, isWindowOpen, onBuy, onSell, onPlayerClick }: { transferList: Player[], team: Team, budget: number, isWindowOpen: boolean, onBuy: (p: Player) => void, onSell: (p: Player) => void, onPlayerClick: (p: Player) => void }) => {
    const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');

    if (!isWindowOpen) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Lock size={64} className="text-slate-400 dark:text-slate-600 mb-4"/>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Transfer Dönemi Kapalı</h2>
                <p className="text-slate-500 dark:text-slate-400">Transfer sezonu dışında oyuncu alıp satamazsınız.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 mb-4">
                 <button onClick={() => setTab('BUY')} className={`flex-1 py-3 font-bold rounded-lg border ${tab === 'BUY' ? 'bg-green-600 border-green-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>TRANSFER LİSTESİ</button>
                 <button onClick={() => setTab('SELL')} className={`flex-1 py-3 font-bold rounded-lg border ${tab === 'SELL' ? 'bg-red-600 border-red-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>OYUNCU SAT</button>
            </div>

            {tab === 'BUY' && (
                <div className="space-y-4">
                     {transferList.length === 0 && <div className="text-slate-500 text-center py-8">Listede uygun oyuncu yok.</div>}
                     {transferList.map(p => (
                         <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                             <div className="flex items-center gap-4 cursor-pointer" onClick={() => onPlayerClick(p)}>
                                  <div className={`w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white ${p.position === 'GK' ? 'bg-yellow-600' : p.position === 'DEF' ? 'bg-blue-600' : p.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>{p.position}</div>
                                  <div>
                                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">{p.age} Yaş • {p.skill} Güç</div>
                                  </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="text-right">
                                     <div className="text-xs text-slate-500 dark:text-slate-400">Değer</div>
                                     <div className="text-green-600 dark:text-green-400 font-bold">{p.value} M€</div>
                                 </div>
                                 <button disabled={budget < p.value} onClick={() => onBuy(p)} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold">SATIN AL</button>
                             </div>
                         </div>
                     ))}
                </div>
            )}

            {tab === 'SELL' && (
                <div className="space-y-4">
                     {team.players.map(p => (
                         <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                             <div className="flex items-center gap-4 cursor-pointer" onClick={() => onPlayerClick(p)}>
                                  <div className={`w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white ${p.position === 'GK' ? 'bg-yellow-600' : p.position === 'DEF' ? 'bg-blue-600' : p.position === 'MID' ? 'bg-green-600' : 'bg-red-600'}`}>{p.position}</div>
                                  <div>
                                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">{p.age} Yaş • {p.skill} Güç</div>
                                  </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="text-right">
                                     <div className="text-xs text-slate-500 dark:text-slate-400">Piyasa Değeri</div>
                                     <div className="text-green-600 dark:text-green-400 font-bold">{p.value} M€</div>
                                 </div>
                                 <button onClick={() => onSell(p)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold">SAT</button>
                             </div>
                         </div>
                     ))}
                </div>
            )}
        </div>
    );
};

// --- APP COMPONENT ---

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>({
        managerName: null,
        manager: null,
        myTeamId: null,
        currentWeek: 1,
        teams: [],
        fixtures: [],
        messages: [],
        isGameStarted: false,
        transferList: [],
        trainingPerformed: false,
        news: []
    });
    
    // NAVIGATION HISTORY STATE
    const [viewHistory, setViewHistory] = useState<string[]>(['intro']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const currentView = viewHistory[historyIndex] || 'intro';

    const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<Player | null>(null);
    const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<Team | null>(null);
    const [matchResultData, setMatchResultData] = useState<any>(null);
    const [selectedFixtureForDetail, setSelectedFixtureForDetail] = useState<Fixture | null>(null);

    // Theme State
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Navigation Functions
    const navigateTo = (view: string) => {
        if (view === currentView) return;
        const newHistory = viewHistory.slice(0, historyIndex + 1);
        newHistory.push(view);
        setViewHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const goBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const goForward = () => {
        if (historyIndex < viewHistory.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('hlm26_theme') as 'dark' | 'light';
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('hlm26_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        const saved = localStorage.getItem('sthl_save_v2');
        if(saved) {
            try {
                const parsed = JSON.parse(saved);
                setGameState(parsed);
                if(parsed.isGameStarted) {
                    // Reset history to home on load if game started
                    setViewHistory(['home']);
                    setHistoryIndex(0);
                }
            } catch(e) { console.error("Save load failed", e); }
        }
    }, []);

    const handleStart = (name: string, year: string, country: string) => {
        const teams = initializeTeams();
        const fixtures = generateFixtures(teams);
        const transferList = generateTransferMarket(10, 1);
        const news = generateWeeklyNews(1, fixtures, teams);

        const birthYear = parseInt(year) || 1980;
        const currentAge = 2025 - birthYear;

        const newState: GameState = {
            managerName: name,
            manager: {
                name,
                age: Math.max(18, Math.min(100, currentAge)),
                nationality: country,
                power: 50,
                stats: { matchesManaged: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, trophies: 0, playersBought: 0, playersSold: 0, moneySpent: 0, moneyEarned: 0, recordTransferFee: 0 },
                contract: { salary: 1.5, expires: 2028, teamName: '' },
                trust: { board: 50, fans: 50, players: 50, referees: 50 },
                playerRelations: [],
                history: []
            },
            myTeamId: null,
            currentWeek: 1,
            teams,
            fixtures,
            messages: INITIAL_MESSAGES,
            isGameStarted: false,
            transferList,
            trainingPerformed: false,
            news
        };
        setGameState(newState);
        navigateTo('team_select');
    };

    const handleSelectTeam = (id: string) => {
        setGameState(prev => ({
            ...prev,
            myTeamId: id,
            isGameStarted: true,
            manager: prev.manager ? { ...prev.manager, contract: { ...prev.manager.contract, teamName: prev.teams.find(t => t.id === id)?.name || '' } } : null
        }));
        // Reset navigation history when entering main game
        setViewHistory(['home']);
        setHistoryIndex(0);
    };
    
    const handleSave = () => {
        localStorage.setItem('sthl_save_v2', JSON.stringify(gameState));
    };

    const handleNewGame = () => {
        // Direct reset without window.confirm to avoid browser blocking issues
        localStorage.removeItem('sthl_save_v2');
        
        setGameState({
            managerName: null,
            manager: null,
            myTeamId: null,
            currentWeek: 1,
            teams: [],
            fixtures: [],
            messages: [],
            isGameStarted: false,
            transferList: [],
            trainingPerformed: false,
            news: []
        });
        
        setSelectedPlayerForDetail(null);
        setSelectedTeamForDetail(null);
        setMatchResultData(null);
        setSelectedFixtureForDetail(null);
        
        // Reset navigation
        setViewHistory(['intro']);
        setHistoryIndex(0);
    };

    const handleNextWeek = () => {
        let updatedTeams = [...gameState.teams];
        let updatedFixtures = [...gameState.fixtures];
        
        // 1. Simulate remaining matches for the CURRENT week
        const weekMatches = updatedFixtures.filter(f => f.week === gameState.currentWeek && !f.played);
        weekMatches.forEach(match => {
             const h = updatedTeams.find(t => t.id === match.homeTeamId)!;
             const a = updatedTeams.find(t => t.id === match.awayTeamId)!;
             const res = simulateMatchInstant(h, a);
             
             const idx = updatedFixtures.findIndex(f => f.id === match.id);
             if(idx >= 0) {
                 updatedFixtures[idx] = { ...match, played: true, homeScore: res.homeScore, awayScore: res.awayScore, stats: res.stats };
             }
        });
        
        // 2. Update standings
        updatedTeams = updatedTeams.map(team => {
             const playedFixtures = updatedFixtures.filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id));
             let played=0, won=0, drawn=0, lost=0, gf=0, ga=0, points=0;
             playedFixtures.forEach(f => {
                 played++;
                 const isHome = f.homeTeamId === team.id;
                 const myScore = isHome ? f.homeScore! : f.awayScore!;
                 const oppScore = isHome ? f.awayScore! : f.homeScore!;
                 gf += myScore; ga += oppScore;
                 if(myScore > oppScore) { won++; points += 3; }
                 else if(myScore === oppScore) { drawn++; points += 1; }
                 else lost++;
             });
             const newStats = { played, won, drawn, lost, gf, ga, points };
             return { ...team, stats: newStats };
        });

        // 3. Generate news for the COMPLETED week (simulated results)
        // We pass myTeamId to skip generating duplicate tweets for the user match
        const matchNews = generateWeeklyNews(gameState.currentWeek, updatedFixtures, updatedTeams, gameState.myTeamId);

        // 4. Advance week
        const nextWeek = gameState.currentWeek + 1;
        const newTransferList = isTransferWindowOpen(nextWeek) ? generateTransferMarket(10, nextWeek) : [];
        
        // 5. Player Complaints / Messages
        const updatedMyTeam = updatedTeams.find(t => t.id === gameState.myTeamId);
        const playerMessages = (gameState.myTeamId && updatedMyTeam) ? generatePlayerMessages(nextWeek, updatedMyTeam) : [];

        // 6. Cleanup & Update State
        // Combine new tweets with existing news
        const allNews = [...matchNews, ...gameState.news];
        
        // Filter to keep only the last 2 weeks (current finished week and the one before it)
        // nextWeek is the week we are entering.
        // retentionThreshold ensures we delete anything older than 2 weeks back.
        const retentionThreshold = nextWeek - 2;
        const filteredNews = allNews.filter(n => n.week > retentionThreshold);

        setGameState(prev => ({
            ...prev,
            currentWeek: nextWeek,
            teams: updatedTeams,
            fixtures: updatedFixtures,
            news: filteredNews,
            transferList: isTransferWindowOpen(nextWeek) ? newTransferList : [],
            trainingPerformed: false,
            messages: [...playerMessages, ...prev.messages] // Prepend new messages
        }));
        
        navigateTo('home');
    };

    const handleTrain = (type: 'ATTACK' | 'DEFENSE' | 'PHYSICAL') => {
        if(gameState.trainingPerformed) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const trainedTeam = applyTraining(myTeam, type);
        
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === trainedTeam.id ? trainedTeam : t),
            trainingPerformed: true
        }));
    };

    const handleMatchFinish = async (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats) => {
        const fixtureIdx = gameState.fixtures.findIndex(f => 
            f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId)
        );
        const myTeamId = gameState.myTeamId!;
        const currentFixture = gameState.fixtures[fixtureIdx];
        const isHome = currentFixture.homeTeamId === myTeamId;
        const opponentId = isHome ? currentFixture.awayTeamId : currentFixture.homeTeamId;
        const opponent = gameState.teams.find(t => t.id === opponentId)!;

        // Get Match Result
        const myScore = isHome ? hScore : aScore;
        const oppScore = isHome ? aScore : hScore;
        let res: 'WIN'|'DRAW'|'LOSS' = 'DRAW';
        if(myScore > oppScore) res = 'WIN';
        if(myScore < oppScore) res = 'LOSS';
        
        // Removed Opponent Statement logic as requested
        
        const updatedStats = { ...stats };

        const updatedFixtures = [...gameState.fixtures];
        const completedFixture = { 
            ...updatedFixtures[fixtureIdx], 
            played: true, 
            homeScore: hScore, 
            awayScore: aScore,
            matchEvents: events,
            stats: updatedStats
        };
        updatedFixtures[fixtureIdx] = completedFixture;
        
        const processedTeams = processMatchPostGame(gameState.teams, events, gameState.currentWeek);

        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.matchesManaged++;
        updatedManager.stats.goalsFor += myScore;
        updatedManager.stats.goalsAgainst += oppScore;
        if(res === 'WIN') updatedManager.stats.wins++;
        if(res === 'DRAW') updatedManager.stats.draws++;
        if(res === 'LOSS') updatedManager.stats.losses++;

        // Generate Instant Social Media Reaction for User Match
        const matchTweets = generateMatchTweets(completedFixture, processedTeams, true);

        setGameState(prev => ({
            ...prev,
            fixtures: updatedFixtures,
            teams: processedTeams,
            manager: updatedManager,
            news: [...matchTweets, ...prev.news] // Prepend new tweets immediately
        }));
        
        // Prepare data for result modal
        setMatchResultData({
             homeTeam: isHome ? gameState.teams.find(t=>t.id===gameState.myTeamId)! : opponent,
             awayTeam: isHome ? opponent : gameState.teams.find(t=>t.id===gameState.myTeamId)!,
             homeScore: hScore,
             awayScore: aScore,
             stats: stats, // Pass stats to the result modal
             events: events // Pass events to the result modal
        });

        // Replace 'match_live' in history with 'match_result' to prevent going back to the live match
        const newHistory = viewHistory.slice(0, historyIndex);
        newHistory.push('match_result');
        setViewHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleFastSimulate = () => {
        const fixtureIdx = gameState.fixtures.findIndex(f => 
            f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId)
        );
        if (fixtureIdx === -1 || !gameState.myTeamId) return;

        const currentFixture = gameState.fixtures[fixtureIdx];
        const homeTeam = gameState.teams.find(t => t.id === currentFixture.homeTeamId)!;
        const awayTeam = gameState.teams.find(t => t.id === currentFixture.awayTeamId)!;

        // Simulate
        const { homeScore, awayScore, stats } = simulateMatchInstant(homeTeam, awayTeam);

        // Generate synthetic events for goals to ensure stats update
        const events: MatchEvent[] = [];
        
        const generateGoalEvents = (team: Team, count: number) => {
            const xi = team.players.slice(0, 11);
            const scorers = [...xi.filter(p => p.position === Position.FWD), ...xi.filter(p => p.position === Position.MID), ...xi];
            
            for(let i=0; i<count; i++) {
                const scorer = scorers[Math.floor(Math.random() * scorers.length)];
                let assist = xi[Math.floor(Math.random() * xi.length)];
                if(assist.id === scorer.id) assist = xi.find(p => p.id !== scorer.id) || assist;
                
                events.push({
                    minute: Math.floor(Math.random() * 90) + 1,
                    type: 'GOAL',
                    description: `GOL! ${scorer.name}`,
                    teamName: team.name,
                    scorer: scorer.name,
                    assist: assist.name
                });
            }
        };

        // Generate Card Events based on stats to populate the timeline
        const generateCardEvents = (team: Team, yellowCount: number, redCount: number) => {
            const xi = team.players.slice(0, 11);
            for(let i=0; i<yellowCount; i++) {
                 const player = xi[Math.floor(Math.random() * xi.length)];
                 events.push({
                    minute: Math.floor(Math.random() * 90) + 1,
                    type: 'CARD_YELLOW',
                    description: `${player.name} sarı kart gördü.`,
                    teamName: team.name,
                    playerId: player.id
                });
            }
            for(let i=0; i<redCount; i++) {
                 const player = xi[Math.floor(Math.random() * xi.length)];
                 events.push({
                    minute: Math.floor(Math.random() * 90) + 1,
                    type: 'CARD_RED',
                    description: `${player.name} kırmızı kart gördü!`,
                    teamName: team.name,
                    playerId: player.id
                });
            }
        };

        generateGoalEvents(homeTeam, homeScore);
        generateGoalEvents(awayTeam, awayScore);
        
        generateCardEvents(homeTeam, stats.homeYellowCards, stats.homeRedCards);
        generateCardEvents(awayTeam, stats.awayYellowCards, stats.awayRedCards);
        
        // Random Injury Logic for simulation depth
        if (Math.random() < 0.2) { // 20% chance of injury in simulated match
            const targetTeam = Math.random() > 0.5 ? homeTeam : awayTeam;
            const xi = targetTeam.players.slice(0, 11);
            const injuredPlayer = xi[Math.floor(Math.random() * xi.length)];
             events.push({
                minute: Math.floor(Math.random() * 90) + 1,
                type: 'INJURY',
                description: `${injuredPlayer.name} sakatlandı.`,
                teamName: targetTeam.name,
                playerId: injuredPlayer.id
            });
        }
        
        events.sort((a,b) => a.minute - b.minute);

        handleMatchFinish(homeScore, awayScore, events, stats);
    };

    const handleShowTeamDetail = (teamId: string) => {
        const t = gameState.teams.find(t => t.id === teamId);
        if(t) {
            setSelectedTeamForDetail(t);
            navigateTo('team_detail');
        }
    };

    const handleBuyPlayer = (player: Player) => {
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        if (!myTeam) return;
        if (myTeam.budget < player.value) {
            alert("Bütçe yetersiz!");
            return;
        }
        const newBudget = myTeam.budget - player.value;
        const newPlayer = { ...player, teamId: myTeam.id };
        const updatedTeam = { ...myTeam, players: [...myTeam.players, newPlayer], budget: newBudget };
        
        // Remove from transfer list
        const newTransferList = gameState.transferList.filter(p => p.id !== player.id);

        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t),
            transferList: newTransferList,
            manager: prev.manager ? {
                ...prev.manager,
                stats: {
                    ...prev.manager.stats,
                    playersBought: prev.manager.stats.playersBought + 1,
                    moneySpent: prev.manager.stats.moneySpent + player.value,
                    recordTransferFee: Math.max(prev.manager.stats.recordTransferFee, player.value)
                }
            } : null
        }));
        alert(`${player.name} takıma katıldı!`);
    };

    const handleSellPlayer = (player: Player) => {
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        if (!myTeam) return;
        if (myTeam.players.length <= 11) {
             alert("Kadro yetersiz, oyuncu satılamaz.");
             return;
        }
        const newBudget = myTeam.budget + player.value;
        const updatedTeam = {
            ...myTeam,
            players: myTeam.players.filter(p => p.id !== player.id),
            budget: newBudget
        };
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t),
            manager: prev.manager ? {
                ...prev.manager,
                stats: {
                    ...prev.manager.stats,
                    playersSold: prev.manager.stats.playersSold + 1,
                    moneyEarned: prev.manager.stats.moneyEarned + player.value
                }
            } : null
        }));
        alert(`${player.name} satıldı!`);
    };

    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);

    if (currentView === 'intro') return <IntroScreen onStart={handleStart} />;
    if (currentView === 'team_select') return <TeamSelection teams={gameState.teams} onSelect={handleSelectTeam} />;

    return (
        <Dashboard 
            state={gameState} 
            onNavigate={(view) => navigateTo(view)} 
            onSave={handleSave} 
            onNewGame={handleNewGame}
            onNextWeek={handleNextWeek}
            currentView={currentView}
            theme={theme}
            toggleTheme={toggleTheme}
            onBack={goBack}
            onForward={goForward}
            canBack={historyIndex > 0}
            canForward={historyIndex < viewHistory.length - 1}
        >
            {currentView === 'home' && myTeam && (
                <HomeView 
                    manager={gameState.manager!} 
                    team={myTeam} 
                    teams={gameState.teams} 
                    myTeamId={myTeam.id} 
                    currentWeek={gameState.currentWeek} 
                    fixtures={gameState.fixtures}
                    onTeamClick={handleShowTeamDetail} 
                />
            )}
            
            {currentView === 'squad' && myTeam && (
                <SquadView team={myTeam} onPlayerClick={(p) => setSelectedPlayerForDetail(p)} />
            )}

            {currentView === 'tactics' && myTeam && (
                <TacticsView 
                    team={myTeam} 
                    setTeam={(updatedTeam) => {
                        setGameState(prev => ({
                            ...prev,
                            teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t)
                        }));
                    }} 
                />
            )}

            {currentView === 'fixtures' && myTeam && (
                <FixturesView 
                    fixtures={gameState.fixtures} 
                    teams={gameState.teams} 
                    myTeamId={myTeam.id} 
                    currentWeek={gameState.currentWeek}
                    onTeamClick={handleShowTeamDetail}
                    onFixtureClick={(f) => setSelectedFixtureForDetail(f)}
                />
            )}
            
            {currentView === 'transfer' && myTeam && (
                <TransferView 
                    transferList={gameState.transferList} 
                    team={myTeam} 
                    budget={myTeam.budget}
                    isWindowOpen={isTransferWindowOpen(gameState.currentWeek)}
                    onBuy={handleBuyPlayer}
                    onSell={handleSellPlayer}
                    onPlayerClick={(p) => setSelectedPlayerForDetail(p)}
                />
            )}

            {currentView === 'social' && (
                <SocialMediaView 
                    news={gameState.news} 
                    teams={gameState.teams}
                    messages={gameState.messages}
                    onUpdateMessages={(msgs) => setGameState(prev => ({ ...prev, messages: msgs }))}
                />
            )}

            {currentView === 'training' && (
                <TrainingView 
                    onTrain={handleTrain} 
                    performed={gameState.trainingPerformed}
                />
            )}

            {/* Team Detail View as a full page view */}
            {currentView === 'team_detail' && selectedTeamForDetail && (
                <TeamDetailView 
                    team={selectedTeamForDetail} 
                    onClose={() => {
                        setSelectedTeamForDetail(null);
                        goBack();
                    }}
                    onPlayerClick={(p) => setSelectedPlayerForDetail(p)} 
                />
            )}

            {/* FULL SCREEN VIEWS INTEGRATED INTO DASHBOARD (NO OVERLAY) */}

            {currentView === 'match_preview' && myTeam && (
                <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 transition-colors duration-300">
                    <MatchPreview 
                        fixture={gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))!}
                        homeTeam={gameState.teams.find(t => t.id === (gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))?.homeTeamId))!}
                        awayTeam={gameState.teams.find(t => t.id === (gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))?.awayTeamId))!}
                        onProceed={() => navigateTo('locker_room')}
                    />
                </div>
            )}

            {currentView === 'locker_room' && myTeam && (
                <div className="h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                    <LockerRoomView 
                        team={myTeam} 
                        setTeam={(t) => setGameState(prev => ({ ...prev, teams: prev.teams.map(team => team.id === t.id ? t : team) }))}
                        onStartMatch={() => navigateTo('match_live')}
                        onSimulateMatch={handleFastSimulate}
                    />
                </div>
            )}

            {currentView === 'match_live' && myTeam && (
                <div className="h-full bg-slate-900">
                    <MatchSimulation 
                        homeTeam={gameState.teams.find(t => t.id === (gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))?.homeTeamId))!}
                        awayTeam={gameState.teams.find(t => t.id === (gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))?.awayTeamId))!}
                        onFinish={handleMatchFinish}
                        allTeams={gameState.teams}
                        fixtures={gameState.fixtures}
                    />
                </div>
            )}

            {/* Modals and Overlays */}
            
            {selectedPlayerForDetail && (
                <PlayerDetailModal 
                    player={selectedPlayerForDetail} 
                    onClose={() => setSelectedPlayerForDetail(null)} 
                />
            )}
            
            {selectedFixtureForDetail && (
                <MatchDetailModal 
                    fixture={selectedFixtureForDetail} 
                    teams={gameState.teams} 
                    onClose={() => setSelectedFixtureForDetail(null)} 
                />
            )}

             {currentView === 'match_result' && matchResultData && (
                <MatchResultModal 
                    homeTeam={matchResultData.homeTeam}
                    awayTeam={matchResultData.awayTeam}
                    homeScore={matchResultData.homeScore}
                    awayScore={matchResultData.awayScore}
                    stats={matchResultData.stats}
                    events={matchResultData.events}
                    onProceed={() => {
                        let result: 'WIN'|'LOSS'|'DRAW' = 'DRAW';
                        const isHome = matchResultData.homeTeam.id === gameState.myTeamId;
                        const myScore = isHome ? matchResultData.homeScore : matchResultData.awayScore;
                        const oppScore = isHome ? matchResultData.awayScore : matchResultData.homeScore;
                        if(myScore > oppScore) result = 'WIN';
                        if(myScore < oppScore) result = 'LOSS';
                        setMatchResultData({ ...matchResultData, result });
                        navigateTo('interview');
                    }}
                />
            )}
            
            {currentView === 'interview' && matchResultData && (
                <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-50 p-4 transition-colors duration-300">
                    <PostMatchInterview 
                        result={matchResultData.result}
                        onClose={() => {
                            setMatchResultData(null);
                            // Reset history to ensure user cannot go back to interview or match
                            setViewHistory(['home']);
                            setHistoryIndex(0);
                        }}
                    />
                </div>
            )}
        </Dashboard>
    );
};

export default App;