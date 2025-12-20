
import React, { useState } from 'react';
import { Player, Position } from '../types';
import { ChevronLeft, Trophy, Activity, Heart, Shield, Swords, Zap, Star, TrendingUp, AlertTriangle, Ruler, Anchor, FileText, Goal, ArrowRightLeft, Scale, History, Calendar, Lock, Unlock, Briefcase, Coins, CheckCircle2, ChevronDown, MessageCircle, BedDouble, FileSignature, UserMinus } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';
import PlayerPositionPitch from '../components/shared/PlayerPositionPitch';
import PlayerStatsTable from '../components/shared/PlayerStatsTable';

interface PlayerDetailViewProps {
    player: Player;
    onClose: () => void;
    myTeamId?: string;
}

const PlayerDetailView: React.FC<PlayerDetailViewProps> = ({ player, onClose, myTeamId }) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'CONTRACT' | 'TRANSFER' | 'DEVELOPMENT' | 'COMPARE' | 'HISTORY'>('GENERAL');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const isMyPlayer = myTeamId && player.teamId === myTeamId;

    const toggleDropdown = (id: string) => {
        if (activeDropdown === id) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(id);
        }
    };

    const handleAction = (action: string) => {
        setActiveDropdown(null);
        switch (action) {
            case 'TAB_GENERAL': setActiveTab('GENERAL'); break;
            case 'TAB_CONTRACT': setActiveTab('CONTRACT'); break;
            case 'TAB_TRANSFER': setActiveTab('TRANSFER'); break;
            case 'TAB_DEVELOPMENT': setActiveTab('DEVELOPMENT'); break;
            case 'TAB_COMPARE': setActiveTab('COMPARE'); break;
            case 'TAB_HISTORY': setActiveTab('HISTORY'); break;
            
            // Actions
            case 'HAPPINESS': alert("Mutluluk Durumu: Oyuncu şu an takımda mutlu görünüyor."); break;
            case 'CONTRACT_START': alert("Sözleşme görüşmeleri başlatıldı..."); break;
            case 'RELEASE': alert(`${player.name} serbest bırakıldı!`); break;
            case 'TERMINATE': alert("Sözleşme karşılıklı feshedildi."); break;
            case 'TRANSFER_OFFER': alert("Yeni transfer teklifi yapılıyor..."); break;
            case 'TALK': alert("Oyuncu ile görüşme odasına gidiliyor..."); break;
            case 'REST': alert("Oyuncuya 1 gün izin verildi."); break;
            default: break;
        }
    };
    
    const getAttrColor = (val: number) => {
        if (val >= 90) return 'text-yellow-500 font-black'; 
        if (val >= 80) return 'text-green-500 font-bold';   
        if (val >= 70) return 'text-blue-500 font-bold';    
        if (val >= 40) return 'text-slate-600 dark:text-slate-300 font-medium'; 
        return 'text-red-500'; 
    };

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600';
    };

    const currentCondition = player.condition !== undefined ? player.condition : player.stats.stamina;
    
    // Financial Calculations
    const estimatedWage = (player.value * 0.005 * 52).toFixed(2); // Annual
    const releaseClause = (player.value * 1.5).toFixed(1);

    const AttributeRow = ({ label, value }: { label: string, value: number }) => (
        <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/20 px-1 rounded transition-colors">
            <span className="text-[13px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">{label}</span>
            <span className={`text-base font-mono ${getAttrColor(value)}`}>{value}</span>
        </div>
    );

    const renderDropdownContent = () => {
        if (!activeDropdown) return null;

        // Common button style for the panel
        const btnClass = "w-full text-left px-4 py-3 hover:bg-white dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm bg-white/50 dark:bg-slate-800/50";
        const sectionClass = "grid grid-cols-1 md:grid-cols-2 gap-2 p-2";

        if (activeDropdown === 'GENERAL') {
            return (
                <div className={sectionClass}>
                    <button onClick={() => handleAction('TAB_GENERAL')} className={btnClass}>
                        <Star size={16} /> Profil ve Özellikler
                    </button>
                    <button onClick={() => handleAction('HAPPINESS')} className={btnClass}>
                        <Heart size={16} className="text-red-500" /> Mutluluk Durumu
                    </button>
                </div>
            );
        }
        if (activeDropdown === 'CONTRACT') {
            return (
                <div className={sectionClass}>
                    <button onClick={() => handleAction('TAB_CONTRACT')} className={btnClass}>
                        <FileText size={16} /> Sözleşme Detayları
                    </button>
                    <button onClick={() => handleAction('CONTRACT_START')} className={btnClass}>
                        <FileSignature size={16} className="text-blue-500"/> Sözleşme Görüşmelerine Başla
                    </button>
                    {isMyPlayer && (
                        <>
                            <button onClick={() => handleAction('TERMINATE')} className={`${btnClass} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-100 dark:border-red-900/30`}>
                                <ArrowRightLeft size={16} /> Karşılıklı Fesih
                            </button>
                            <button onClick={() => handleAction('RELEASE')} className={`${btnClass} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-100 dark:border-red-900/30`}>
                                <UserMinus size={16} /> Serbest Bırak
                            </button>
                        </>
                    )}
                </div>
            );
        }
        if (activeDropdown === 'TRANSFER') {
            return (
                <div className={sectionClass}>
                    <button onClick={() => handleAction('TAB_TRANSFER')} className={btnClass}>
                        <ArrowRightLeft size={16} /> Transfer Durumu
                    </button>
                    <button onClick={() => handleAction('TRANSFER_OFFER')} className={btnClass}>
                        <Coins size={16} className="text-green-500" /> Yeni Transfer Teklifi Yap
                    </button>
                </div>
            );
        }
        if (activeDropdown === 'INTERACT' && isMyPlayer) {
            return (
                <div className={sectionClass}>
                    <button onClick={() => handleAction('TALK')} className={btnClass}>
                        <MessageCircle size={16} /> Oyuncuyla Görüş
                    </button>
                    <button onClick={() => handleAction('REST')} className={btnClass}>
                        <BedDouble size={16} className="text-indigo-500" /> Oyuncuyu Dinlendir
                    </button>
                </div>
            );
        }
        return null;
    };

    // Navigation Menu Config (Styled like screenshot)
    const renderNavButton = (id: string, label: string, icon: any, hasDropdown: boolean) => {
        const isActive = activeTab === id;
        const isOpen = activeDropdown === id;

        return (
            <div 
                className="relative group shrink-0 h-full flex items-center"
                onMouseEnter={() => hasDropdown && setActiveDropdown(id)}
            >
                <button
                    onClick={() => hasDropdown ? toggleDropdown(id) : setActiveTab(id as any)}
                    className={`
                        flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all relative h-full uppercase tracking-wider
                        ${isActive 
                            ? 'text-yellow-400' 
                            : 'text-slate-400 hover:text-slate-200'
                        }
                    `}
                >
                    {isActive && (
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-400 rounded-b-full shadow-[0_2px_15px_rgba(250,204,21,0.6)]"></div>
                    )}
                    {React.createElement(icon, { 
                        size: 16, 
                        className: isActive || isOpen ? "text-yellow-400" : "text-slate-400 group-hover:text-slate-200" 
                    })}
                    <span>{label}</span>
                    {hasDropdown && <ChevronDown size={12} className={`ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180 text-yellow-400' : 'text-slate-500'}`} />}
                </button>
            </div>
        );
    };

    return (
        <div className="h-full bg-slate-100 dark:bg-slate-900 overflow-y-auto custom-scrollbar flex flex-col" onClick={() => activeDropdown && setActiveDropdown(null)}>
            
            {/* Header Navigation with Full Width Panel Dropdown */}
            <div 
                className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 flex flex-col shadow-md"
                onMouseLeave={() => setActiveDropdown(null)}
            >
                <div className="flex items-center px-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors py-3 pr-4 border-r border-slate-700 mr-2 shrink-0 group font-bold uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform text-yellow-500" />
                        Geri
                    </button>

                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 h-full" onClick={(e) => e.stopPropagation()}>
                        {renderNavButton('GENERAL', 'Genel', Star, true)}
                        {renderNavButton('CONTRACT', 'Sözleşme', FileText, true)}
                        {renderNavButton('TRANSFER', 'Transfer', ArrowRightLeft, true)}
                        {renderNavButton('DEVELOPMENT', 'Profilim', TrendingUp, false)}
                        {renderNavButton('COMPARE', 'Kıyasla', Scale, false)}
                        {renderNavButton('HISTORY', 'Geçmişim', History, false)}
                        
                        {/* New Interaction Menu for Owned Players */}
                        {isMyPlayer && renderNavButton('INTERACT', 'İlişkiler', MessageCircle, true)}
                    </div>
                </div>

                {/* Full Width Dropdown Panel */}
                {activeDropdown && (
                    <div 
                        className="border-t border-slate-700 bg-slate-800/95 backdrop-blur-sm shadow-2xl animate-in slide-in-from-top-1 z-40 max-h-[60vh] overflow-y-auto" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderDropdownContent()}
                    </div>
                )}
            </div>

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 pb-20">
                
                {/* 1. HERO SECTION (Always Visible) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative p-6 md:p-8">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <Star size={200} />
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                        {/* Profile Photo */}
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden bg-slate-200">
                                <PlayerFace player={player} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white w-10 h-10 md:w-12 md:h-12 flex flex-col items-center justify-center rounded-full shadow-lg border-2 border-yellow-500">
                                <span className="text-base md:text-lg font-black leading-none">{player.skill}</span>
                            </div>
                        </div>

                        {/* Right: Info Area */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs md:text-sm font-bold text-white shadow-sm ${getPosBadgeColor(player.position)}`}>
                                    {player.position}
                                </span>
                                {player.secondaryPosition && (
                                    <span className={`px-2 py-0.5 rounded text-xs md:text-sm font-bold text-white shadow-sm opacity-70 ${getPosBadgeColor(player.secondaryPosition)}`}>
                                        {player.secondaryPosition}
                                    </span>
                                )}
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 font-teko">
                                {player.name}
                            </h1>

                            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <Trophy size={14} className="text-yellow-600"/> <span>{player.nationality}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <Ruler size={14} className="text-blue-500"/> <span>{player.age} Yaş • {player.height || 180} cm</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <Anchor size={14} className="text-green-500"/> <span>{player.preferredFoot || 'Sağ'} Ayak</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <Briefcase size={14} className="text-purple-500"/> <span>Sözleşme: {player.contractExpiry}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TAB CONTENT --- */}

                {/* 1. GENERAL TAB */}
                {activeTab === 'GENERAL' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* ATTRIBUTES GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <Swords className="text-blue-500" size={20}/> TEKNİK
                                </h3>
                                <div className="space-y-0.5">
                                    <AttributeRow label="Bitiricilik" value={player.stats.finishing} />
                                    <AttributeRow label="Dripling" value={player.stats.dribbling} />
                                    <AttributeRow label="İlk Kontrol" value={player.stats.firstTouch} />
                                    <AttributeRow label="Kafa Vuruşu" value={player.stats.heading} />
                                    <AttributeRow label="Korner" value={player.stats.corners} />
                                    <AttributeRow label="Markaj" value={player.stats.marking} />
                                    <AttributeRow label="Orta Yapma" value={player.stats.crossing} />
                                    <AttributeRow label="Pas" value={player.stats.passing} />
                                    <AttributeRow label="Penaltı Kullanma" value={player.stats.penalty} />
                                    <AttributeRow label="Serbest Vuruş" value={player.stats.freeKick} />
                                    <AttributeRow label="Teknik" value={player.stats.technique} />
                                    <AttributeRow label="Top Kapma" value={player.stats.tackling} />
                                    <AttributeRow label="Uzaktan Şut" value={player.stats.longShots} />
                                    <AttributeRow label="Uzun Taç" value={player.stats.longThrows} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <Zap className="text-yellow-500" size={20}/> ZİHİNSEL
                                </h3>
                                <div className="space-y-0.5">
                                    <AttributeRow label="Agresiflik" value={player.stats.aggression} />
                                    <AttributeRow label="Cesaret" value={player.stats.bravery} />
                                    <AttributeRow label="Çalışkanlık" value={player.stats.workRate} />
                                    <AttributeRow label="Karar Alma" value={player.stats.decisions} />
                                    <AttributeRow label="Kararlılık" value={player.stats.determination} />
                                    <AttributeRow label="Konsantrasyon" value={player.stats.concentration} />
                                    <AttributeRow label="Liderlik" value={player.stats.leadership} />
                                    <AttributeRow label="Önsezi" value={player.stats.anticipation} />
                                    <AttributeRow label="Özel Yetenek" value={player.stats.flair} />
                                    <AttributeRow label="Pozisyon Alma" value={player.stats.positioning} />
                                    <AttributeRow label="Soğukkanlılık" value={player.stats.composure} />
                                    <AttributeRow label="Takım Oyunu" value={player.stats.teamwork} />
                                    <AttributeRow label="Topsuz Alan" value={player.stats.offTheBall} />
                                    <AttributeRow label="Vizyon" value={player.stats.vision} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                        <Activity className="text-red-500" size={20}/> FİZİKSEL
                                    </h3>
                                    <div className="space-y-0.5">
                                        <AttributeRow label="Çeviklik" value={player.stats.agility} />
                                        <AttributeRow label="Dayanıklılık" value={player.stats.stamina} />
                                        <AttributeRow label="Denge" value={player.stats.balance} />
                                        <AttributeRow label="Güç" value={player.stats.physical} />
                                        <AttributeRow label="Hız" value={player.stats.pace} />
                                        <AttributeRow label="Hızlanma" value={player.stats.acceleration} />
                                        <AttributeRow label="Vücut Zindeliği" value={player.stats.naturalFitness} />
                                        <AttributeRow label="Zıplama" value={player.stats.jumping} />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                        <Heart className="text-purple-500" size={20}/> DURUM
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1 text-xs font-bold uppercase text-slate-500">
                                                <span>Kondisyon</span>
                                                <span className={currentCondition < 60 ? 'text-red-500' : 'text-green-500'}>{Math.round(currentCondition)}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full ${currentCondition < 50 ? 'bg-red-500' : currentCondition < 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${currentCondition}%`}}></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                                                <div className="text-2xl font-black text-yellow-600">{player.seasonStats.averageRating || '-'}</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Reyting</div>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                                                <div className="text-2xl font-black text-indigo-600">{player.morale}</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Moral</div>
                                            </div>
                                        </div>
                                        {player.injury && (
                                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-start gap-3">
                                                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18}/>
                                                <div>
                                                    <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase">Sakatlık Raporu</div>
                                                    <div className="text-sm font-bold text-red-600 dark:text-red-300 mt-0.5">{player.injury.type}</div>
                                                    <div className="text-[10px] text-slate-500 mt-1">{player.injury.daysRemaining} gün kaldı.</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* POSITION & STATS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm flex flex-col items-center justify-center">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 w-full border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2 uppercase tracking-tight">
                                    <Trophy className="text-yellow-500" size={24}/> POZİSYONLAR
                                </h3>
                                <PlayerPositionPitch player={player} />
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm flex flex-col">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 w-full border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2 uppercase tracking-tight">
                                    <TrendingUp className="text-green-500" size={24}/> SEZON İSTATİSTİKLERİ
                                </h3>
                                <PlayerStatsTable player={player} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. CONTRACT TAB */}
                {activeTab === 'CONTRACT' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <FileText className="text-blue-500"/> Sözleşme Detayları
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="text-sm font-bold text-slate-500 uppercase mb-1">Maaş (Yıllık)</div>
                                        <div className="text-3xl font-black text-green-600 dark:text-green-400 font-mono">{estimatedWage} M€</div>
                                        <div className="text-xs text-slate-400 mt-2">Vergiler dahil brüt ücret.</div>
                                    </div>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="text-sm font-bold text-slate-500 uppercase mb-1">Piyasa Değeri</div>
                                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">{player.value} M€</div>
                                        <div className="text-xs text-slate-400 mt-2">Son güncelleme: Bu hafta</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2"><Calendar size={16}/> Sözleşme Bitiş</span>
                                        <span className="font-mono text-slate-900 dark:text-white">30 Haziran {player.contractExpiry}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2"><Unlock size={16}/> Serbest Kalma Bedeli</span>
                                        <span className="font-mono text-slate-900 dark:text-white">{releaseClause} M€</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2"><Coins size={16}/> Sadakat Bonusu</span>
                                        <span className="font-mono text-slate-900 dark:text-white">{(player.value * 0.05).toFixed(2)} M€</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2"><Briefcase size={16}/> Menajer</span>
                                        <span className="font-mono text-slate-900 dark:text-white">Global Sports Mgmt.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. TRANSFER TAB */}
                {activeTab === 'TRANSFER' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <ArrowRightLeft className="text-yellow-500"/> Transfer Durumu
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                        <span className="text-green-800 dark:text-green-300 font-bold text-sm">Kulüp İçin Önemi</span>
                                        <span className="text-green-600 dark:text-green-400 font-black uppercase text-xs">Vazgeçilmez</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">Transfer Listesinde</span>
                                        <span className="text-slate-900 dark:text-white font-bold">Hayır</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">Kiralık Listesinde</span>
                                        <span className="text-slate-900 dark:text-white font-bold">Hayır</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Activity className="text-red-500"/> İlgilenen Kulüpler
                                </h3>
                                {player.skill > 80 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                            <span className="font-bold text-slate-900 dark:text-white">Manchester City</span>
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">Ciddi İlgi</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                            <span className="font-bold text-slate-900 dark:text-white">Real Madrid</span>
                                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">Takip Ediyor</span>
                                        </div>
                                    </div>
                                ) : player.skill > 70 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                            <span className="font-bold text-slate-900 dark:text-white">Ajax</span>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">Teklif Hazırlığında</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 italic text-sm">
                                        Şu an için resmi bir ilgi bulunmuyor.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. DEVELOPMENT TAB */}
                {activeTab === 'DEVELOPMENT' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm text-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center justify-center gap-2">
                                <TrendingUp className="text-green-500"/> Gelişim Raporu
                            </h3>
                            
                            <div className="flex justify-center gap-8 mb-8">
                                <div className="text-center">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Mevcut Yetenek</div>
                                    <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{player.skill}</div>
                                </div>
                                <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                                <div className="text-center">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Potansiyel</div>
                                    <div className="text-4xl font-black text-slate-400 dark:text-slate-500">{Math.min(99, player.skill + (30 - player.age) * 2)}</div>
                                </div>
                            </div>

                            <div className="w-full bg-slate-100 dark:bg-slate-900 h-4 rounded-full overflow-hidden relative mb-2">
                                <div className="h-full bg-slate-300 dark:bg-slate-700 absolute left-0 top-0" style={{width: `${Math.min(99, player.skill + (30 - player.age) * 2)}%`}}></div>
                                <div className="h-full bg-blue-500 absolute left-0 top-0" style={{width: `${player.skill}%`}}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 font-bold uppercase">
                                <span>Mevcut</span>
                                <span>Potansiyel</span>
                            </div>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Antrenman Puanı</div>
                                    <div className="text-2xl font-bold text-green-500">8.4 / 10</div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Odak Alanı</div>
                                    <div className="text-lg font-bold text-blue-500">Dayanıklılık</div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Antrenör Görüşü</div>
                                    <div className="text-xs text-slate-500 italic">"Son zamanlarda fiziksel olarak büyük aşama kaydetti."</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. COMPARE TAB */}
                {activeTab === 'COMPARE' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                            <Scale size={64} className="text-slate-300 dark:text-slate-600 mb-4"/>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Oyuncu Kıyaslama</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                                Bu özellik şu anda geliştirme aşamasındadır. Yakında ligdeki diğer oyuncularla detaylı veri analizi yapabileceksiniz.
                            </p>
                            <div className="mt-8 w-full max-w-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{player.name}</span>
                                    <span className="text-sm font-bold text-slate-500">Lig Ortalaması</span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Hız', val: player.stats.pace, avg: 65 },
                                        { label: 'Teknik', val: player.stats.technique, avg: 60 },
                                        { label: 'Pas', val: player.stats.passing, avg: 58 },
                                        { label: 'Güç', val: player.stats.physical, avg: 62 },
                                    ].map((stat, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>{stat.label}</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                                                <div className="absolute top-0 bottom-0 bg-slate-400 w-1 z-10" style={{left: `${stat.avg}%`}}></div>
                                                <div className="h-full bg-blue-500" style={{width: `${stat.val}%`}}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. HISTORY TAB */}
                {activeTab === 'HISTORY' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Activity className="text-red-500"/> Sakatlık Geçmişi
                            </h3>
                            {player.injuryHistory && player.injuryHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {player.injuryHistory.map((h, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">{h.type}</div>
                                                <div className="text-xs text-slate-500">{h.week}. Hafta</div>
                                            </div>
                                            <div className="text-red-600 dark:text-red-400 font-bold text-sm">{h.durationDays} Gün</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500 italic text-sm bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500 opacity-50"/>
                                    Kayıtlı sakatlık geçmişi bulunmuyor. Maşallah!
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <History className="text-slate-500"/> Kariyer Özeti
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 font-bold">
                                        <tr>
                                            <th className="p-3">Sezon</th>
                                            <th className="p-3">Takım</th>
                                            <th className="p-3 text-center">Maç</th>
                                            <th className="p-3 text-center">Gol</th>
                                            <th className="p-3 text-center">Asist</th>
                                            <th className="p-3 text-center">Ort</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        <tr>
                                            <td className="p-3 font-mono">2025/26</td>
                                            <td className="p-3 font-bold">Mevcut</td>
                                            <td className="p-3 text-center">{player.seasonStats.matchesPlayed}</td>
                                            <td className="p-3 text-center">{player.seasonStats.goals}</td>
                                            <td className="p-3 text-center">{player.seasonStats.assists}</td>
                                            <td className="p-3 text-center font-bold text-blue-600">{player.seasonStats.averageRating || '-'}</td>
                                        </tr>
                                        {/* Mock Past Data */}
                                        <tr className="text-slate-500">
                                            <td className="p-3 font-mono">2024/25</td>
                                            <td className="p-3">Eski Kulüp</td>
                                            <td className="p-3 text-center">32</td>
                                            <td className="p-3 text-center">{Math.floor(player.skill / 10)}</td>
                                            <td className="p-3 text-center">{Math.floor(player.skill / 15)}</td>
                                            <td className="p-3 text-center">7.12</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default PlayerDetailView;
