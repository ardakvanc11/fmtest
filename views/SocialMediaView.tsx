
import React, { useState, useRef, useEffect } from 'react';
import { NewsItem, Team, Message } from '../types';
import { Smartphone, Mail, Hash, ChevronLeft, Send, MessageSquare, RotateCcw, Heart, User } from 'lucide-react';

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

export default SocialMediaView;
