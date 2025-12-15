
import { GoogleGenAI } from "@google/genai";
import { Team, Player, TacticStyle, InterviewQuestion, InterviewOption, HalftimeTalkOption, MatchEvent, MatchStats } from '../types';
import { INTERVIEW_TEMPLATES } from '../data/questionsPool';

let ai: GoogleGenAI | null = null;
let apiBackoffUntil = 0; // Timestamp until which API calls are suspended

if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// Helper to handle API errors and trigger backoff
const handleApiError = (error: any, fallback: any) => {
    console.warn("Gemini API Error or Rate Limit:", error);
    // If error is 429 or related to quota
    const errStr = error.toString();
    if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED')) {
        console.warn("Rate limit hit. Pausing AI features for 60 seconds.");
        apiBackoffUntil = Date.now() + 60000; // 1 minute cooldown
    }
    return fallback;
};

const isApiBlocked = () => {
    if (!ai) return true;
    if (Date.now() < apiBackoffUntil) return true;
    return false;
}

export const getAssistantAdvice = async (
    myTeam: Team, 
    opponent: Team, 
    currentTactic: string
): Promise<string> => {
    const fallback = "Rakip analiz raporlarına şu an ulaşamıyorum hocam, kendi oyunumuzu oynayalım.";
    if (isApiBlocked()) return fallback;

    const prompt = `
        Sen bir futbol menajerlik oyununda "Yardımcı Antrenörsün".
        Aşağıdaki bilgilere dayanarak baş menajere maçı kazanmak için kısa, öz ve motive edici taktiksel tavsiyeler ver.

        Bizim Takım: ${myTeam.name} (Güç: ${Math.round(myTeam.strength)})
        Rakip: ${opponent.name} (Güç: ${Math.round(opponent.strength)})
        Mevcut Taktiğimiz: ${currentTactic}
        
        Rakibin şampiyonluk sayısı: ${opponent.championships}
        Bizim bütçemiz: ${myTeam.budget}M€
        
        Kısa bir paragraf yaz. Taktik değişikliği öneriyorsan belirt.
    `;

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Takım maça hazır hocam, çıkıp oynayalım!";
    } catch (error) {
        return handleApiError(error, fallback);
    }
};

export const getMatchCommentary = async (
    minute: number, 
    homeTeam: string, 
    awayTeam: string, 
    scoreHome: number, 
    scoreAway: number,
    event: string,
    eventType?: string
): Promise<string> => {
    // OPTIMIZATION: Don't waste AI quota on mundane events.
    // Only fetch AI commentary for Goals, VAR, Red Cards, and Injuries.
    const interestingEvents = ['GOAL', 'VAR', 'CARD_RED', 'INJURY'];
    if (eventType && !interestingEvents.includes(eventType)) {
        return event;
    }

    if (isApiBlocked()) return event;

    // Use a very fast prompt for simulated commentary
    const prompt = `
        Futbol spikeri gibi konuş. Çok kısa tek bir cümle kur.
        Dakika: ${minute}
        Maç: ${homeTeam} vs ${awayTeam}
        Skor: ${scoreHome}-${scoreAway}
        Olay: ${event}
        
        Heyecanlı ve Türkçe spiker ağzıyla yaz.
    `;

    try {
        const response = await ai!.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
             config: {
                 thinkingConfig: { thinkingBudget: 0 } // Fast response
             }
        });
        return response.text || event;
    } catch (e) {
        // Silent fail for commentary to keep flow moving
        return handleApiError(e, event);
    }
};

export const getOpponentStatement = async (
    opponentName: string,
    result: 'WIN' | 'LOSS' | 'DRAW', // Result from OUR perspective
    myScore: number,
    opponentScore: number
): Promise<{text: string, mood: 'ANGRY' | 'HAPPY' | 'NEUTRAL'}> => {
    
    // Opponent perspective
    const opponentResult = result === 'WIN' ? 'LOSS' : result === 'LOSS' ? 'WIN' : 'DRAW';
    const scoreDiff = opponentScore - myScore;

    // Strict logic templates to ensure realism and fallback
    const getTemplate = () => {
        if (opponentResult === 'WIN') {
            if (scoreDiff >= 3) return { text: "Bugün sahadaki tek takım bizdik, hak edilmiş bir zafer.", mood: 'HAPPY' };
            if (scoreDiff === 1) return { text: "Zor oldu ama kazanmasını bildik, rakibi tebrik ederim.", mood: 'HAPPY' };
            return { text: "Önemli olan 3 puandı, yolumuza bakacağız.", mood: 'HAPPY' };
        } else if (opponentResult === 'LOSS') {
             if (scoreDiff <= -3) return { text: "Bugün sahada yoktuk, taraftarlarımızdan özür dilerim.", mood: 'ANGRY' };
             if (scoreDiff === -1) return { text: "Şans bizden yana değildi, hakem kararları maçı etkiledi.", mood: 'ANGRY' };
             return { text: "İstediğimiz oyunu yansıtamadık, ders çıkaracağız.", mood: 'NEUTRAL' };
        } else {
            return { text: "İki takım da iyi mücadele etti, adil bir sonuç.", mood: 'NEUTRAL' };
        }
    };

    if (isApiBlocked()) return getTemplate() as any;

    const prompt = `
        Sen rakip takımın (${opponentName}) teknik direktörüsün.
        Maç sonucu senin açından: ${opponentResult}.
        Skor: ${opponentScore} (Biz) - ${myScore} (Rakip).
        
        Duruma uygun, gerçekçi, tek cümlelik bir maç sonu açıklaması yap.
        Eğer fark yediysen sakın 'iyi oynadık' deme, utanç duy veya hakemi suçla.
        Eğer fark attıysan böbürlen.
        
        Türkçe yaz.
    `;

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        const text = response.text || "";
        // Simple mood detection fallback
        let mood = opponentResult === 'WIN' ? 'HAPPY' : opponentResult === 'LOSS' ? 'ANGRY' : 'NEUTRAL';
        return { text, mood: mood as any };
    } catch (e) {
        return handleApiError(e, getTemplate());
    }
};

export interface InterviewContext {
    result: 'WIN' | 'LOSS' | 'DRAW';
    myScore: number;
    oppScore: number;
    mvpName: string;
    events: MatchEvent[];
    stats: MatchStats;
    myTeamName: string;
}

export const getPressQuestion = async (
    ctx: InterviewContext
): Promise<InterviewQuestion> => {
    
    // 1. ANALYZE CONTEXT LOCALLY
    const myEvents = ctx.events.filter(e => e.teamName === ctx.myTeamName);
    const goals = myEvents.filter(e => e.type === 'GOAL');
    const redCards = myEvents.filter(e => e.type === 'CARD_RED');
    
    // Find standout players (Good/Bad)
    const scorerNames = goals.map(g => g.scorer).filter(Boolean) as string[];
    
    // Create specific scenario buckets
    const scenarios = [];
    if (scorerNames.length > 0) scenarios.push('SCORER');
    if (redCards.length > 0) scenarios.push('RED_CARD');
    if (ctx.result === 'LOSS' && (ctx.oppScore - ctx.myScore) >= 3) scenarios.push('HEAVY_LOSS');
    if (ctx.result === 'WIN') scenarios.push('WIN');
    if (ctx.result === 'LOSS') scenarios.push('LOSS');
    scenarios.push('GENERAL');

    // Pick a scenario
    let selectedScenario = scenarios[0];
    if (scenarios.includes('RED_CARD')) selectedScenario = 'RED_CARD';
    else if (scenarios.includes('SCORER') && Math.random() > 0.4) selectedScenario = 'SCORER';
    else if (scenarios.includes('HEAVY_LOSS')) selectedScenario = 'HEAVY_LOSS';
    else if (ctx.result !== 'DRAW') selectedScenario = ctx.result;

    // Fallback selection logic
    const getLocalQuestion = () => {
        const pool = INTERVIEW_TEMPLATES[selectedScenario] || INTERVIEW_TEMPLATES['GENERAL'];
        const randomItem = pool[Math.floor(Math.random() * pool.length)];
        
        // Simple interpolation for {player} placeholder
        let questionText = randomItem.q;
        if(scorerNames.length > 0) {
            questionText = questionText.replace('{player}', scorerNames[0]);
        } else {
            questionText = questionText.replace('{player}', 'Oyuncunuz');
        }

        return {
            id: Math.random().toString(),
            question: questionText,
            options: randomItem.opts
        };
    };

    if (isApiBlocked()) return getLocalQuestion();

    // AI Generation with Context
    try {
        const prompt = `
            Futbol maçı sonrası basın toplantısındasın.
            Bağlam:
            - Maç Sonucu: ${ctx.result} (${ctx.myScore}-${ctx.oppScore})
            - Öne Çıkan Olaylar: ${selectedScenario === 'SCORER' ? scorerNames.join(', ') + ' gol attı.' : selectedScenario === 'RED_CARD' ? 'Kırmızı kart çıktı.' : 'Normal maç.'}
            - Maçın Adamı: ${ctx.mvpName}
            
            Gazeteci olarak teknik direktöre kışkırtıcı veya övücü, duruma çok uygun spesifik bir soru sor.
            Örnek: Eğer bir oyuncu gol attıysa onun ismini geçirerek sor. Eğer fark yendiyse istifayı sor.
            
            Sadece soruyu yaz.
        `;
        const response = await ai!.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt
        });
        
        const aiQuestion = response.text;
        if (!aiQuestion) return getLocalQuestion();

        // If AI generates a question, we map it to Generic Options but try to flavor them slightly
        let aiOptions: InterviewOption[] = [];
        if (ctx.result === 'WIN') {
            aiOptions = [
                { id: '1', text: "Oyuncularımla gurur duyuyorum, hepsi harikaydı.", effect: { teamMorale: 5, description: "Takıma güven." } },
                { id: '2', text: "Daha yolun başındayız, şımarmamak lazım.", effect: { description: "Disiplin." } },
                { id: '3', text: "Bu galibiyet taraftarımıza armağan olsun.", effect: { description: "Taraftar mutlu." } }
            ];
        } else if (ctx.result === 'LOSS') {
             aiOptions = [
                { id: '1', text: "Sorumluluğu alıyorum, düzelteceğiz.", effect: { trustUpdate: { board: 0 }, description: "Liderlik." } },
                { id: '2', text: "Bazı şeyler istediğimiz gibi gitmedi, hakem de yardımcı olmadı.", effect: { trustUpdate: { referees: -5 }, description: "Bahane/Hakem." } },
                { id: '3', text: "Bu maçı unutup önümüze bakacağız.", effect: { description: "Profesyonel." } }
            ];
        } else {
             aiOptions = [
                { id: '1', text: "Oyunun hakkı beraberlikti.", effect: { description: "Dürüstlük." } },
                { id: '2', text: "Kazanabilirdik, fırsatları teptik.", effect: { teamMorale: -2, description: "Hafif eleştiri." } },
                { id: '3', text: "Deplasmanda/Zorlu rakibe karşı 1 puan iyidir.", effect: { teamMorale: 2, description: "Pozitif bakış." } }
            ];
        }

        return {
            id: Math.random().toString(),
            question: aiQuestion,
            options: aiOptions
        };

    } catch (e) {
        return handleApiError(e, getLocalQuestion());
    }
};

export const getHalftimeTalks = (scoreDiff: number): HalftimeTalkOption[] => {
    // Halftime talks are static templates, safe from API limits
    if (scoreDiff > 0) { // Winning
        return [
            { id: '1', text: "Harikasınız çocuklar! Aynı disiplinle devam edin, rehavete kapılmak yok!", style: 'MOTIVATIONAL', effectDesc: "Takım odaklanır." },
            { id: '2', text: "Maç daha bitmedi! Daha fazla gol istiyorum, ezin onları!", style: 'AGGRESSIVE', effectDesc: "Hücum gücü artar, defans riske girer." },
            { id: '3', text: "Sakin kalın, topu ayağınızda tutun ve skoru koruyun.", style: 'CALM', effectDesc: "Kondisyon korunur." }
        ];
    } else if (scoreDiff < 0) { // Losing
        return [
            { id: '1', text: "Bu futbol size yakışmıyor! Kendinize gelin, sahaya çıkın ve savaşın!", style: 'AGGRESSIVE', effectDesc: "Takım hırslanır." },
            { id: '2', text: "Henüz hiçbir şey bitmedi. Bir gol maçı çevirir. Size inanıyorum.", style: 'MOTIVATIONAL', effectDesc: "Moral yükselir." },
            { id: '3', text: "Taktiklere sadık kalın, panik yapmayın. Fırsatlar gelecek.", style: 'CALM', effectDesc: "Organizasyon düzelir." }
        ];
    } else { // Draw
        return [
            { id: '1', text: "Bu maçı kazanabiliriz! Biraz daha baskı yaparsak gol gelecek!", style: 'MOTIVATIONAL', effectDesc: "Hücum isteği artar." },
            { id: '2', text: "Risk almayın, kontrollü oynayın. Hata yapan kaybeder.", style: 'CALM', effectDesc: "Savunma güvenliği artar." },
            { id: '3', text: "Rakip yorulmaya başladı, vites arttırın!", style: 'AGGRESSIVE', effectDesc: "Kondisyon düşer, baskı artar." }
        ];
    }
};
