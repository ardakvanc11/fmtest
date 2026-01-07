
import React, { useState, useRef, useEffect } from 'react';
import { NewsItem, Team, Message, Player } from '../types';
import { Smartphone, Mail, Hash, ChevronLeft, Send, MessageSquare, RotateCcw, Heart, User, CheckCheck, BadgeCheck, AlertTriangle, MessageCircle } from 'lucide-react';
import { pick } from '../utils/helpers';

// JOURNALIST PERSONAS
const JOURNALISTS = [
    { name: "Fabri Roman", handle: "@FabriRoman", reliability: 99, avatarColor: "bg-blue-600", verify: true, tagline: "Here we go! 🚨" },
    { name: "Yağız Sabuncu", handle: "@yagosabuncu", reliability: 95, avatarColor: "bg-yellow-600", verify: true, tagline: "ÖZEL |" },
    { name: "Nevzat Dindar", handle: "@nevzatdindar", reliability: 75, avatarColor: "bg-red-600", verify: true, tagline: "SICAK GELİŞME" },
    { name: "Sercan Hamzaoğlu", handle: "@sercanhamzaoglu", reliability: 80, avatarColor: "bg-purple-600", verify: true, tagline: "Kulis Bilgisi" },
    { name: "Duyumcu Dayı", handle: "@duyumcudayi", reliability: 30, avatarColor: "bg-slate-500", verify: false, tagline: "Kesin bilgi yayalım..." },
    { name: "Transfer Merkezi", handle: "@transfermerkezi", reliability: 60, avatarColor: "bg-green-600", verify: false, tagline: "İddia:" }
];

// RUMOR TEMPLATES
const RUMOR_TEMPLATES = [
    "{team} yönetimi {player} için resmi teklif yapmaya hazırlanıyor. Oyuncu sıcak bakıyor.",
    "{team}, {targetTeam}'in yıldızı {player} ile prensipte anlaştı. Kulüpler görüşüyor.",
    "{team} teknik direktörü, {player} transferini bizzat istedi.",
    "{player} menajeri İstanbul'a geldi! {team} ile masaya oturacak.",
    "{team}, {player} için {amount} M€ bonservis bedelini gözden çıkardı.",
    "{team} taraftarı {player} transferi için sosyal medyada kampanya başlattı.",
    "Bomba iddia! {team}, rakibi {targetTeam}'in kaptanı {player}'a kanca attı.",
    "{player} takımdan ayrılmak istediğini yönetime iletti. {team} pusuda bekliyor.",
    "{team} transferde rotayı {player}'a çevirdi. Görüşmeler başladı.",
    "{team} başkanı: '{player} gibi bir oyuncuyu kim istemez ki?'",
];

// FAN REACTIONS TO RUMORS
const RUMOR_REACTIONS = [
    "Gelirse ligi donunda sallar!",
    "Çöp transfer, parayı çöpe atmayın.",
    "Yönetim istifa, yine geç kaldık!",
    "Fabri dediyse bitmiştir, hayırlı olsun.",
    "Yağız abi balon haber yapmaz, bu iş biter.",
    "Bize böyle topçu lazım işte, helal olsun.",
    "O paraya 3 tane genç alırsın, vizyonsuzluk.",
    "Bu adam sakat değil miydi ya?",
    "Forma siparişini verdim bile!",
    "İnanmayın beyler, menajer oyunu.",
    "Kaynak sağlam mı dayı?",
    "Gelirse havalimanına kadar taşırım.",
    "Bu sene o sene, şampiyonluk geliyor!",
    "Rüyamda gördüm bu adam bize gelecek."
];

interface Rumor {
    id: string;
    journalist: typeof JOURNALISTS[0];
    content: string;
    targetPlayer?: string;
    targetTeam?: string;
    reactions: string[];
}

const SocialMediaView = ({ news, teams, messages, onUpdateMessages, onReply, isTransferWindowOpen }: { news: NewsItem[], teams: Team[], messages: Message[], onUpdateMessages: (msgs: Message[]) => void, onReply?: (msgId: number, optIndex: number) => void, isTransferWindowOpen: boolean }) => {
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
    
    // Dynamic Rumors State
    const [rumors, setRumors] = useState<Rumor[]>([]);
    
    const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- RUMOR GENERATION LOGIC ---
    useEffect(() => {
        if (isTransferWindowOpen && rumors.length === 0 && teams.length > 0) {
            
            // FİLTRELEME: Söylentiler sadece Süper Lig (League 1 olmayan) takımlar arasında dönsün
            const superLeagueTeams = teams.filter(t => t.leagueId !== 'LEAGUE_1');
            
            if (superLeagueTeams.length < 2) return; // Yeterli takım yoksa dur

            const newRumors: Rumor[] = [];
            const count = 6; // Generate 6 daily rumors

            for (let i = 0; i < count; i++) {
                const journalist = pick(JOURNALISTS);
                const buyingTeam = pick(superLeagueTeams); // Sadece Süper Lig'den alıcı
                
                // Avoid buying team selling to itself
                const otherTeams = superLeagueTeams.filter(t => t.id !== buyingTeam.id);
                const sellingTeam = pick(otherTeams); // Sadece Süper Lig'den satıcı (ya da dışarıdan ama bu scope'ta takımları sınırladık)
                
                // Pick a player to target
                if (!sellingTeam || sellingTeam.players.length === 0) continue;
                // Target star players more often for hype
                const sortedPlayers = [...sellingTeam.players].sort((a,b) => b.skill - a.skill);
                // Pick from top 5 players randomly
                const targetPlayer = sortedPlayers[Math.floor(Math.random() * Math.min(5, sortedPlayers.length))];

                const template = pick(RUMOR_TEMPLATES);
                const amount = Math.floor(targetPlayer.value * (1 + Math.random() * 0.5)); // Inflated price

                let content = template
                    .replace('{team}', buyingTeam.name)
                    .replace('{targetTeam}', sellingTeam.name)
                    .replace('{player}', targetPlayer.name)
                    .replace('{amount}', amount.toString());

                // Add Journalist Tagline
                content = `${journalist.tagline} ${content}`;

                // Generate Fan Reactions
                const reactions = [];
                const reactionCount = Math.floor(Math.random() * 3) + 1;
                for(let j=0; j<reactionCount; j++) {
                    reactions.push(pick(RUMOR_REACTIONS));
                }

                newRumors.push({
                    id: Math.random().toString(36).substr(2, 9),
                    journalist,
                    content,
                    targetPlayer: targetPlayer.name,
                    targetTeam: buyingTeam.name,
                    reactions
                });
            }
            setRumors(newRumors);
        } else if (!isTransferWindowOpen) {
            setRumors([]); // Clear rumors if window closed
        }
    }, [isTransferWindowOpen, teams]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if(selectedMessageId) scrollToBottom();
    }, [selectedMessageId, messages]);

    const handleSendChatMessage = (selectedText: string, optionIndex: number) => {
        if(!selectedMessageId) return;
        
        if (onReply) {
            onReply(selectedMessageId, optionIndex);
        }

        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const updatedMessages = messages.map(msg => {
            if(msg.id === selectedMessageId) {
                return {
                    ...msg,
                    preview: `Siz: ${selectedText}`, 
                    date: 'Şimdi',
                    history: [...msg.history, { id: Date.now(), text: selectedText, time: timeString, isMe: true }],
                    options: [] 
                };
            }
            return msg;
        });
        
        onUpdateMessages(updatedMessages);
    };

    // Initialize stats with Team Popularity Logic
    useEffect(() => {
        const newInteractions = { ...interactions };
        let hasChanges = false;

        news.forEach(n => {
            if (!newInteractions[n.id]) {
                let minLikes = 10;
                let maxLikes = 500;
                let minRTs = 2;
                let maxRTs = 50;

                // Check if it's an OFFICIAL account
                if (n.title.includes('|OFFICIAL')) {
                    const parts = n.title.split('|');
                    const teamName = parts[0];
                    const team = teams.find(t => t.name === teamName);

                    if (team) {
                        // Logic: Scale based on Fan Base. 
                        // Assuming Max Fanbase ~25M -> 80k Likes
                        // Assuming Min Fanbase ~0.5M -> 10k Likes
                        // Normalize fanBase (0.5M to 25M) to range (0 to 1)
                        const maxFans = 25000000;
                        const normalizedFans = Math.min(1, Math.max(0, team.fanBase / maxFans));
                        
                        // Target Range: 10,000 to 80,000
                        const baseLikes = 10000 + (normalizedFans * 70000);
                        
                        // Add some variance (+/- 15%)
                        const variance = baseLikes * 0.15;
                        minLikes = Math.floor(baseLikes - variance);
                        maxLikes = Math.floor(baseLikes + variance);
                        
                        // RTs are roughly 5-15% of likes for official accounts
                        minRTs = Math.floor(minLikes * 0.05);
                        maxRTs = Math.floor(maxLikes * 0.15);
                    } else {
                        // Fallback for official but team not found
                        minLikes = 5000;
                        maxLikes = 15000;
                    }
                }

                const likes = Math.floor(Math.random() * (maxLikes - minLikes)) + minLikes;
                const rts = Math.floor(Math.random() * (maxRTs - minRTs)) + minRTs;

                newInteractions[n.id] = {
                    likes: likes,
                    rts: rts,
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
    }, [news, teams]);

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

    const unreadCount = messages.filter(m => !m.read).length;

    const tabs = [
        { id: 'SOCIAL', label: 'Sosyal Medya', icon: Smartphone },
        { id: 'MESSAGES', label: 'Mesajlar', icon: Mail, badge: unreadCount > 0 ? unreadCount : undefined },
        { id: 'RUMORS', label: 'Söylentiler', icon: Hash },
    ];
    
    const getAvatarColor = (index: number) => {
        const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
        return colors[index % colors.length];
    };

    // Helper to format numbers (e.g. 12.5K)
    const formatCount = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'B';
        return num.toString();
    };

    // --- RENDER LOGIC FOR CHAT VIEW ---
    if (tab === 'MESSAGES' && selectedMessageId !== null) {
        const activeConversation = messages.find(m => m.id === selectedMessageId);
        if(activeConversation) {
            return (
                <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-full shadow-sm">
                    {/* Chat Header */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
                        <button onClick={() => setSelectedMessageId(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition">
                            <ChevronLeft size={24}/>
                        </button>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold ${activeConversation.avatarColor}`}>
                            {activeConversation.sender.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{activeConversation.sender}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{activeConversation.subject}</div>
                        </div>
                    </div>
                    
                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100 dark:bg-slate-800/50">
                        {activeConversation.history.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-600'}`}>
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <div className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>{msg.time}</div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Options Area */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                        {activeConversation.options.length > 0 ? (
                            <>
                                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Cevap Seçenekleri</div>
                                {activeConversation.options.map((opt, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSendChatMessage(opt, idx)}
                                        className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white border border-slate-300 dark:border-slate-600 hover:border-yellow-500 dark:hover:border-yellow-500 p-3 rounded-xl text-sm text-left transition-all font-medium flex gap-3 items-center group shadow-sm"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-yellow-500 group-hover:text-black flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                                        {opt}
                                    </button>
                                ))}
                            </>
                        ) : (
                             <div className="text-center text-slate-500 py-4 italic flex items-center justify-center gap-2 text-sm">
                                 <span className="animate-pulse">●</span> Karşı taraftan cevap bekleniyor...
                             </div>
                        )}
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="w-full h-full flex flex-col">
            {/* Social Header with Tabs - Updated Style */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/50 px-2 mb-6 overflow-x-auto">
                {tabs.map((t) => {
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 text-base font-bold transition-all relative rounded-t-xl group whitespace-nowrap ${
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
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 animate-pulse">{t.badge}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-10">
                {/* SOCIAL FEED */}
                {tab === 'SOCIAL' && news.map((n, idx) => {
                    let name = "Taraftar";
                    let handle = "@taraftar";
                    let teamAffiliation = "";
                    let isOfficial = false;
                    let teamObj: Team | undefined;

                    // OFFICIAL ACCOUNT CHECK
                    if (n.title.includes('|OFFICIAL')) {
                        const parts = n.title.split('|');
                        name = parts[0];
                        handle = parts[1];
                        isOfficial = true;
                        teamObj = teams.find(t => t.name === name);
                    } 
                    else if (n.title.includes('|')) {
                        const parts = n.title.split('|');
                        name = parts[0];
                        handle = parts[1];
                        teamAffiliation = parts[2];
                    } else if (n.title.includes('(')) {
                        const parts = n.title.split('(');
                        name = parts[0].trim();
                        handle = parts[1].replace(')', '').trim();
                    } else {
                        name = n.title;
                        handle = `@${n.title.toLowerCase().replace(/\s/g, '')}`;
                    }
                    
                    const avatarColor = getAvatarColor(idx);
                    const fanTeam = teams.find(t => t.name === teamAffiliation);
                    const stats = interactions[n.id] || { likes: 0, rts: 0, liked: false, rted: false, comments: [], showComments: false };

                    return (
                        <div key={n.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex gap-4 shadow-sm w-full">
                            
                            {/* AVATAR RENDERING */}
                            {isOfficial && teamObj && teamObj.logo ? (
                                <img src={teamObj.logo} className="w-12 h-12 rounded-full shrink-0 object-contain bg-white border border-slate-200" alt={teamObj.name} />
                            ) : (
                                <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${avatarColor} text-white text-lg font-bold`}>
                                    {name.charAt(0)}
                                </div>
                            )}

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-900 dark:text-white text-base">{name}</span>
                                        {isOfficial && <BadgeCheck size={16} className="text-blue-500 fill-white dark:fill-slate-800" />}
                                    </div>
                                    <span className="text-slate-500 text-sm">{handle}</span>
                                    
                                    {!isOfficial && fanTeam ? (
                                        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${fanTeam.colors[0]} ${fanTeam.colors[1]} border-slate-300 dark:border-slate-600`}>
                                            {fanTeam.logo && <img src={fanTeam.logo} className="w-3 h-3 object-contain" alt="" />}
                                            <span className="font-bold uppercase tracking-wide">{fanTeam.name}</span>
                                        </span>
                                    ) : !isOfficial && teamAffiliation ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 uppercase tracking-wide">
                                            {teamAffiliation}
                                        </span>
                                    ) : null}

                                    <span className="text-slate-400 dark:text-slate-500 text-xs ml-auto font-medium">{n.week}. Hf</span>
                                </div>
                                {/* Tweet Content */}
                                <p className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed mb-3">{n.content}</p>
                                
                                <div className="flex gap-6 text-slate-500 text-xs font-bold border-t border-slate-200 dark:border-slate-700/50 pt-2 items-center">
                                    <button 
                                        onClick={() => toggleComments(n.id)}
                                        className={`flex items-center gap-1.5 cursor-pointer transition ${stats.showComments ? 'text-blue-500' : 'hover:text-blue-500'}`}
                                    >
                                        <MessageSquare size={16} className={stats.showComments ? 'fill-blue-500 text-blue-500' : ''}/> 
                                        {formatCount(Math.floor(stats.likes/10) + stats.comments.length)}
                                    </button>
                                    
                                    <button 
                                        onClick={() => toggleRt(n.id)}
                                        className={`flex items-center gap-1.5 cursor-pointer transition ${stats.rted ? 'text-green-600' : 'hover:text-green-600'}`}
                                    >
                                        <RotateCcw size={16} /> 
                                        {formatCount(stats.rts)}
                                    </button>
                                    
                                    <button 
                                        onClick={() => toggleLike(n.id)}
                                        className={`flex items-center gap-1.5 cursor-pointer transition ${stats.liked ? 'text-red-500' : 'hover:text-red-500'}`}
                                    >
                                        <Heart size={16} className={stats.liked ? 'fill-red-500 text-red-500' : ''}/> 
                                        {formatCount(stats.likes)}
                                    </button>
                                </div>

                                {/* Comments Section */}
                                {stats.showComments && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                        {/* Existing Comments */}
                                        {stats.comments.length > 0 && (
                                            <div className="space-y-3 mb-3">
                                                {stats.comments.map((comment, i) => (
                                                    <div key={i} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                                                            <User size={16} className="text-slate-500 dark:text-slate-400"/>
                                                        </div>
                                                        <div className="bg-white dark:bg-slate-700 p-2.5 rounded-lg rounded-tl-none shadow-sm flex-1">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="font-bold text-slate-900 dark:text-white text-xs">Ben</span>
                                                                <span className="text-[10px] text-slate-500">Şimdi</span>
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
                                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-400 dark:placeholder-slate-600"
                                                onKeyDown={(e) => e.key === 'Enter' && submitComment(n.id)}
                                            />
                                            <button 
                                                onClick={() => submitComment(n.id)}
                                                disabled={!replyText.trim()}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold transition flex items-center"
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
                {tab === 'MESSAGES' && (
                    <div className="space-y-3 w-full">
                        {messages.length > 0 ? (
                             <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        const updatedMessages = messages.map(m => ({ ...m, read: true }));
                                        onUpdateMessages(updatedMessages);
                                    }}
                                    className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                                >
                                    <CheckCheck size={16} />
                                    Tümünü Okundu İşaretle
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-12 opacity-50 text-slate-500 dark:text-slate-400 flex flex-col items-center">
                                <Mail size={48} className="mx-auto mb-2"/>
                                <p className="text-base">Hiç mesajınız yok.</p>
                            </div>
                        )}
                        {messages.map(msg => (
                            <div 
                                key={msg.id} 
                                onClick={() => {
                                    setSelectedMessageId(msg.id);
                                    const updatedMessages = messages.map(m => m.id === msg.id ? { ...m, read: true } : m);
                                    onUpdateMessages(updatedMessages);
                                }} 
                                className={`bg-white dark:bg-slate-800 p-3 rounded-2xl border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-4 shadow-sm w-full ${msg.read ? 'border-slate-200 dark:border-slate-700' : 'border-l-4 border-l-green-500 border-slate-200 dark:border-slate-700'}`}
                            >
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold ${msg.avatarColor} shrink-0`}>
                                     {msg.sender.charAt(0)}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-center mb-0.5">
                                         <span className={`font-bold text-base ${msg.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{msg.sender}</span>
                                         <span className="text-xs text-slate-500">{msg.date}</span>
                                     </div>
                                     <div className="text-sm text-yellow-600 dark:text-yellow-500 font-bold mb-0.5 truncate">{msg.subject}</div>
                                     <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{msg.preview}</p>
                                 </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* RUMORS TAB */}
                {tab === 'RUMORS' && (
                    <div className="space-y-4">
                        {!isTransferWindowOpen ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                                <AlertTriangle size={64} className="text-slate-400 mb-4 opacity-50"/>
                                <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300">Sessizlik Hakim</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Transfer dönemi kapalı olduğu için ortalık sakin.</p>
                            </div>
                        ) : (
                            rumors.map(r => (
                                <div key={r.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition w-full relative overflow-hidden group">
                                    {/* Journalist Header */}
                                    <div className="flex items-start gap-4 mb-4 relative z-10">
                                        <div className={`w-12 h-12 rounded-full ${r.journalist.avatarColor} flex items-center justify-center text-white text-lg font-bold shrink-0 border-2 border-white dark:border-slate-700`}>
                                            {r.journalist.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-slate-900 dark:text-white text-base">{r.journalist.name}</span>
                                                {r.journalist.verify && <BadgeCheck size={16} className="text-blue-500 fill-white dark:fill-slate-800" />}
                                                <span className="text-slate-500 text-xs ml-1">{r.journalist.handle}</span>
                                            </div>
                                            
                                            {/* Content */}
                                            <p className="text-slate-800 dark:text-slate-200 text-sm mt-1 leading-relaxed">
                                                {r.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Reliability Bar */}
                                    <div className="flex items-center gap-2 mb-4 relative z-10 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Güvenilirlik</span>
                                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${r.journalist.reliability > 80 ? 'bg-green-500' : r.journalist.reliability > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                style={{width: `${r.journalist.reliability}%`}}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">%{r.journalist.reliability}</span>
                                    </div>

                                    {/* Fan Reactions Section */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 relative z-10">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                                            <MessageCircle size={12}/> Anlık Tepkiler
                                        </div>
                                        <div className="space-y-2">
                                            {r.reactions.map((reaction, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${getAvatarColor(i)}`}>
                                                        U
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg rounded-tl-none text-xs text-slate-600 dark:text-slate-300 shadow-sm">
                                                        {reaction}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Background Decor */}
                                    <div className="absolute -top-4 -right-4 text-slate-100 dark:text-slate-700/20 opacity-50 group-hover:scale-110 transition-transform duration-500">
                                        <Hash size={100} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialMediaView;
