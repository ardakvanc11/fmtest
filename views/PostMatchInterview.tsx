import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { MatchEvent, Team } from '../types';
import { RIVALRIES } from '../constants';

interface QuestionOption {
    text: string;
    effect?: {
        teamMorale?: number;
        playerMorale?: number;
        trustUpdate?: {
            board?: number;
            fans?: number;
            players?: number;
            referees?: number;
        };
    };
}

interface QuestionScenario {
    id: string;
    condition: (ctx: InterviewContext) => boolean;
    priority: number; // Higher is more important
    templates: { question: string, options: QuestionOption[] }[];
}

interface InterviewContext {
    result: 'WIN' | 'LOSS' | 'DRAW';
    events: MatchEvent[];
    myTeamName: string;
    opponentName: string;
    myScore: number;
    oppScore: number;
}

const PostMatchInterview = ({ 
    result, 
    onClose,
    onComplete,
    events,
    homeTeam,
    awayTeam,
    myTeamId
}: { 
    result: 'WIN' | 'LOSS' | 'DRAW', 
    onClose: () => void,
    onComplete: (effect: any, relatedPlayerId?: string) => void,
    events: MatchEvent[],
    homeTeam: Team,
    awayTeam: Team,
    myTeamId: string
}) => {
    const [currentQuestion, setCurrentQuestion] = useState<{question: string, options: QuestionOption[]} | null>(null);
    const [relatedPlayerId, setRelatedPlayerId] = useState<string | undefined>(undefined);

    const myTeam = homeTeam.id === myTeamId ? homeTeam : awayTeam;
    const opponentTeam = homeTeam.id === myTeamId ? awayTeam : homeTeam;

    // Helper to resolve player name
    const getPlayerNameFromEvent = (event?: MatchEvent) => {
        if (!event) return "Oyuncunuz";
        
        // If we have playerId (preferred)
        if (event.playerId) {
            const p = myTeam.players.find(x => x.id === event.playerId);
            if (p) return p.name;
        }

        // Fallback to scorer if present
        if (event.scorer && event.teamName === myTeam.name) return event.scorer;

        // Fallback to trying to extract from description if name exists in roster (last resort)
        const matchedPlayer = myTeam.players.find(p => event.description.includes(p.name));
        if (matchedPlayer) return matchedPlayer.name;

        return "Oyuncunuz";
    };

    const getPlayerIdFromEvent = (event?: MatchEvent) => {
        if (!event) return undefined;
        if (event.playerId) return event.playerId;
        
        const p = myTeam.players.find(x => x.name === event.scorer || event.description.includes(x.name));
        return p?.id;
    }

    // --- SCENARIO DEFINITIONS ---
    const SCENARIOS: QuestionScenario[] = [
        // 1. HAT TRICK HERO (Priority: 99)
        {
            id: 'HAT_TRICK',
            priority: 99,
            condition: (ctx) => {
                const scorers = ctx.events.filter(e => e.type === 'GOAL' && e.teamName === ctx.myTeamName).map(e => e.scorer);
                const counts: Record<string, number> = {};
                scorers.forEach(s => { if(s) counts[s] = (counts[s] || 0) + 1; });
                return Object.values(counts).some(c => c >= 3);
            },
            templates: [
                {
                    question: "{player} bugün adeta tek başına takımı sırtladı ve Hat-Trick yaptı. Onun bu insanüstü performansı hakkında ne söylersiniz?",
                    options: [
                        { text: "Topu evine götürmeyi hak etti, dünya klasında bir performans.", effect: { playerMorale: 5, teamMorale: 2 } },
                        { text: "Sadece golleri değil, saha içi liderliği de muazzamdı.", effect: { playerMorale: 3, teamMorale: 3 } },
                        { text: "Takım arkadaşları ona harika servis yaptı, bu kolektif bir başarı.", effect: { teamMorale: 3, playerMorale: 2 } }
                    ]
                },
                {
                    question: "Hat-Trick yapan {player} taraftarın gözünde kahraman ilan edildi. Bu baskıyı kaldırabilir mi?",
                    options: [
                        { text: "O böyle anlar için yaratıldı.", effect: { playerMorale: 5, teamMorale: 1 } },
                        { text: "Taraftarın sevgisi ona güç verir.", effect: { playerMorale: 3 } },
                        { text: "Kahraman değil, profesyonel. İşini yapıyor.", effect: { playerMorale: 3, teamMorale: 0 } }
                    ]
                },
                {
                    question: "{player} bugün attığı gollerle adeta maçı tek başına çözdü. Bu seviyeyi sürekli kılabilir mi?",
                    options: [
                        { text: "Bu onun standardı olmalı, potansiyeli çok yüksek.", effect: { playerMorale: 5 } },
                        { text: "Doğru çalışma disipliniyle neden olmasın?", effect: { playerMorale: 3, teamMorale: 2 } },
                        { text: "Bugün özel bir gündü, her maç böyle olmaz.", effect: { playerMorale: -1 } }
                    ]
                },
                {
                    question: "Takım içi söylentilere göre {player} için Avrupa’dan teklifler geliyor. Böyle bir performans sonrası onu takımda tutmak zorlaşır mı?",
                    options: [
                        { text: "{player} bu takımın omurgası, gitmesine izin vermeyiz.", effect: { playerMorale: 5, teamMorale: 3 } },
                        { text: "İyi oyuncuya teklif gelir, bu normal.", effect: { playerMorale: 3 } },
                        { text: "Bizim işimiz dedikoduyla değil saha içiyle.", effect: { teamMorale: 1 } }
                    ]
                },
                {
                    question: "Hat-Trick sonrası {player} ile aranızdaki bağın güçlendiği söyleniyor. Bunun takıma nasıl yansıyacağını düşünüyorsunuz?",
                    options: [
                        { text: "Güven ilişkimizi pekiştirdi, takım için harika bir mesaj oldu.", effect: { playerMorale: 5, teamMorale: 4 } },
                        { text: "Ona güvendiğimi hep söyledim, bu karşılığını verdi.", effect: { playerMorale: 3 } },
                        { text: "Bireysel ilişki değil, takım ilişkisi önemli.", effect: { teamMorale: 2 } }
                    ]
                },
                {
                    question: "{player} bugün savunmayı perişan etti. Bu kadar dominant bir oyunu bekliyor muydunuz?",
                    options: [
                        { text: "Antrenmanlarda bunu hissettirmişti.", effect: { playerMorale: 3 } },
                        { text: "Onun için sürpriz değil, karakterinde var.", effect: { playerMorale: 5 } },
                        { text: "Rakip hazırlıksız yakalandı.", effect: { playerMorale: 0 } }
                    ]
                }
            ]
        },

        // 2. DERBY MATCHES (Priority: 95)
        {
            id: 'DERBY_WIN',
            priority: 95,
            condition: (ctx) => {
                const isDerby = RIVALRIES.some(pair => pair.includes(ctx.myTeamName) && pair.includes(ctx.opponentName));
                return isDerby && ctx.result === 'WIN';
            },
            templates: [
                {
                    question: "Ezeli rakibinizi sahadan sildiniz! Bu zafer şampiyonluk yolunda bir mesaj mı?",
                    options: [
                        { text: "Şehrin/Ligin patronu olduğumuzu herkese gösterdik.", effect: { teamMorale: 3, trustUpdate: { fans: 3 } } },
                        { text: "Derbiler 3 puandan fazlasıdır, taraftarımıza armağan olsun.", effect: { teamMorale: 5, trustUpdate: { fans: 5 } } },
                        { text: "Büyütülecek bir şey yok, sadece bir maç kazandık.", effect: { teamMorale: 2 } }
                    ]
                },
                {
                    question: "Rakibi adeta ezip geçtiğiniz söyleniyor. Bu fark, iki takım arasındaki güç dengesinin tamamen değiştiği anlamına mı geliyor?",
                    options: [
                        { text: "Evet, şehirde yeni bir düzen var artık.", effect: { teamMorale: 5, trustUpdate: { fans: 5 } } },
                        { text: "Bu fark tesadüf değil, sistemimizin sonucu.", effect: { teamMorale: 3, trustUpdate: { fans: 3 } } },
                        { text: "Güç dengesi maçlık değişmez, işimiz ciddiyetle devam etmek.", effect: { teamMorale: 3 } }
                    ]
                },
                {
                    question: "Rakibi oyunun her anında ezdiniz. Bu fark, iki kulüp arasındaki kalite uçurumunu mu gösteriyor?",
                    options: [
                        { text: "Kalite çalışarak gelir, bugün emeğimizin karşılığını aldık.", effect: { teamMorale: 3, trustUpdate: { fans: 3 } } },
                        { text: "Biz sahada konuştuk, gerisini rakip düşünsün.", effect: { teamMorale: 5, trustUpdate: { fans: 5 } } },
                        { text: "Uçurum yok, derbi atmosferi bazen böyle skorlar doğurur.", effect: { teamMorale: 3 } }
                    ]
                },
                {
                    question: "Rakip teknik direktörün maç sonu açıklamalarında sizin oyunu 'şans' ile kazandığınızı söylemesi tartışma yarattı. Yanıtınız nedir?",
                    options: [
                        { text: "Şans değil, plan ve disiplin. İsteyen maçın tekrarını izlesin.", effect: { teamMorale: 3, trustUpdate: { fans: 5 } } },
                        { text: "Şans dediğine bakmayın, bugün sahada sadece biz vardık.", effect: { teamMorale: 5, trustUpdate: { fans: 3 } } },
                        { text: "Rakip analiz yapmak yerine bahane arıyorsa bu onların sorunu.", effect: { teamMorale: 3 } }
                    ]
                },
                {
                    question: "Derbi galibiyetleri genelde aylarca konuşulur. Bu skorun rakip üzerinde psikolojik bir yıkım oluşturduğunu düşünüyor musunuz?",
                    options: [
                        { text: "Biz sonuçlara değil, gelişime bakıyoruz.", effect: { teamMorale: 3 } },
                        { text: "Bu galibiyet güç dengelerini değiştirmiş olabilir.", effect: { teamMorale: 5, trustUpdate: { fans: 3 } } },
                        { text: "Rakip toparlanır, biz de yolumuza bakarız.", effect: { teamMorale: 3 } }
                    ]
                },
                {
                    question: "Rakip teknik direktörün 'Biz daha büyük takımız' sözleri bugün alay konusu oldu. Bu sonuç ona bir cevap mı?",
                    options: [
                        { text: "Sahada büyüklük gösterilir, lafta değil.", effect: { teamMorale: 5, trustUpdate: { fans: 5 } } },
                        { text: "Biz rakiplerle laf yarışına girmeyiz, cevabı sahada veririz.", effect: { teamMorale: 3 } },
                        { text: "O sözler bizi motive etti, teşekkür ederiz.", effect: { teamMorale: 3 } }
                    ]
                },
                {
                    question: "Rakip taraftarlar maç bitmeden stadı terk etti. Bu, sizin üstünlüğünüzün psikolojik etkisi mi?",
                    options: [
                        { text: "Biz onların umudunu kırdık, bu net bir dominasyondu.", effect: { teamMorale: 5, trustUpdate: { fans: 5 } } },
                        { text: "Taraftar böyle maçlarda umudu kaybedince erkenden gider, normal.", effect: { teamMorale: 3 } },
                        { text: "Bunlar futbolda olur, önemli olan puanı almak.", effect: { teamMorale: 2 } }
                    ]
                },
                {
                    question: "Taraftar bayram ediyor. Rakibi taktiksel olarak ezdiniz diyebilir miyiz?",
                    options: [
                        { text: "Dersimize iyi çalıştık, rakibin zaaflarını biliyorduk.", effect: { teamMorale: 3 } },
                        { text: "Oyuncularım sahada savaştı, taktikten çok yürek kazandı.", effect: { teamMorale: 5 } },
                        { text: "Rakibimiz de iyi mücadele etti ama biz daha çok istedik.", effect: { teamMorale: 2 } }
                    ]
                }
            ]
        },
        {
            id: 'DERBY_LOSS',
            priority: 95,
            condition: (ctx) => {
                const isDerby = RIVALRIES.some(pair => pair.includes(ctx.myTeamName) && pair.includes(ctx.opponentName));
                return isDerby && ctx.result === 'LOSS';
            },
            templates: [
                {
                    question: "Ezeli rakibinize kaybetmek camiada deprem etkisi yarattı. İstifa sesleri yükseliyor, ne diyeceksiniz?",
                    options: [
                        { text: "Taraftar haklı, bu sonuç bize yakışmadı. Özür dileriz.", effect: { teamMorale: -2, trustUpdate: { fans: 0 } } }, // Honesty slightly helps fans, but morale hit
                        { text: "Bir maçla her şeyi yakıp yıkamayız, önümüze bakacağız.", effect: { teamMorale: 2 } }, // Trying to stabilize
                        { text: "Sahada şanssızlıklar yakamızı bırakmadı, skor oyunu yansıtmıyor.", effect: { teamMorale: 0, trustUpdate: { fans: -5 } } } // Excuses hurt fan trust
                    ]
                },
                {
                    question: "Bugünkü oyununuz taraftarlar tarafından 'utanç verici' olarak yorumlandı. Bu eleştirilere hak veriyor musunuz?",
                    options: [
                        { text: "Evet, bu performans kabul edilemez. Taraftarı anlıyorum.", effect: { teamMorale: -3, trustUpdate: { fans: 0 } } },
                        { text: "Eleştiriler normal ama bu takım küllerinden doğacak.", effect: { teamMorale: 1 } },
                        { text: "Taraftarın duygusal tepkisi, oyunun gerçeklerinden uzak.", effect: { trustUpdate: { fans: -10 } } }
                    ]
                },
                {
                    question: "Taraftarlar 'ruhsuz takım' eleştirileri yapıyor. Oyuncularınızın mücadele etmediği yönünde ağır ithamlar var. Buna ne diyorsunuz?",
                    options: [
                        { text: "Bu görüntü bize yakışmadı, sorumluluk tamamen bende.", effect: { teamMorale: -2, trustUpdate: { fans: 0 } } },
                        { text: "Oyuncular savaştı ama kalite yetmedi, bunu kabul etmeliyiz.", effect: { teamMorale: -3 } },
                        { text: "Maçı duygularla değil, mantıkla değerlendirmek lazım.", effect: { teamMorale: -1, trustUpdate: { fans: -5 } } }
                    ]
                },
                {
                    question: "Rakip taraftarlar 'şehir artık bizim' diye bağırıyor. Bu durum takım içinde daha da büyük baskı yaratır mı?",
                    options: [
                        { text: "Baskı bizi güçlendirir, bu sonuç bir dönüm noktası olur.", effect: { teamMorale: 2 } },
                        { text: "Bu baskıyı biz yarattık, toparlamak da bize düşer.", effect: { teamMorale: -1, trustUpdate: { fans: 0 } } },
                        { text: "Rakip istediğini söyler, konuşmayı bırakıp çalışacağız.", effect: { teamMorale: 0 } }
                    ]
                },
                {
                    question: "Bugünkü hezimet sonrası yönetimle aranızda bir kriz olduğu konuşuluyor. Koltuğunuzun sallandığı söyleniyor. Ne diyorsunuz?",
                    options: [
                        { text: "Sorumluluktan kaçmam, gerekirse hesabı veririm.", effect: { teamMorale: -1, trustUpdate: { fans: 0 } } },
                        { text: "Dedikodularla işimiz yok, takımı toparlamaya odaklıyım.", effect: { teamMorale: 1 } },
                        { text: "Kimseyle kriz yaşamadım, bunlar medyanın uydurması.", effect: { teamMorale: -2, trustUpdate: { fans: -6 } } }
                    ]
                },
                {
                    question: "Rakibinizin size 'futbol dersi verdiği' söyleniyor. Taktik olarak hazırlıksız mıydınız?",
                    options: [
                        { text: "Bugün birçok şeyde sınıfta kaldık, ders çıkaracağız.", effect: { teamMorale: -2 } },
                        { text: "Hazırlıksız değildik, oyuncular uygulanması gerekeni yapamadı.", effect: { teamMorale: -1 } },
                        { text: "Futbol dersi gibi abartılı yorumlara gülüp geçiyorum.", effect: { trustUpdate: { fans: -6 } } }
                    ]
                },
                {
                    question: "Rakip oyuncuların maç sonunda 'Bu kadar kolay olacağını beklemiyorduk' sözlerine ne diyorsunuz?",
                    options: [
                        { text: "Bugünkü oyunumuzla bunu söylemeleri normal.", effect: { teamMorale: -3 } },
                        { text: "Motivasyonumuzu arttıracak bir açıklama olmuş.", effect: { teamMorale: 2 } },
                        { text: "Bu açıklamalar seviyesiz, ciddiye alınacak tarafı yok.", effect: { trustUpdate: { fans: -3 } } }
                    ]
                },
                {
                    question: "Taraftarın büyük kısmı 'hoca takımı derbiye hazırlayamıyor' diyor. Bu suçlamayı kabul ediyor musunuz?",
                    options: [
                        { text: "Evet, sorumluluk benim. Bu maçı doğru yönetemedim.", effect: { teamMorale: -1, trustUpdate: { fans: 0 } } },
                        { text: "Hazırlıklarımız tamdı ama sahada karşılık alamadık.", effect: { teamMorale: 0 } },
                        { text: "Bu eleştiriler haksız, takımın emeğine saygısızlık.", effect: { trustUpdate: { fans: -8 } } }
                    ]
                },
                {
                    question: "Sosyal medyada taraftarlar ‘Bu hoca ile derbi kazanamayız’ yorumları yapıyor. Bunu görünce ne düşünüyorsunuz?",
                    options: [
                        { text: "Taraftarın güvenini yeniden kazanmak için çalışacağız.", effect: { teamMorale: -1, trustUpdate: { fans: 0 } } },
                        { text: "Eleştiriyi her zaman kabul ederim, çözüm üretmek zorundayız.", effect: { teamMorale: 1 } },
                        { text: "Bu tarz yorumlar moral bozmak dışında bir işe yaramıyor.", effect: { trustUpdate: { fans: -4 } } }
                    ]
                }
            ]
        },

        // 3. BIG SCORE DIFFERENCES (4+ Goals) (Priority: 90)
        {
            id: 'MASSIVE_WIN',
            priority: 90,
            condition: (ctx) => (ctx.myScore - ctx.oppScore) >= 4,
            templates: [
                {
                    question: "4 farklı tarihi bir skor! Takım bugün makine gibi işledi. Bu seviyeyi koruyabilecek misiniz?",
                    options: [
                        { text: "Potansiyelimiz bu, her hafta böyle oynamak istiyoruz.", effect: { teamMorale: 8 } },
                        { text: "Rakip erken dağıldı, skor kimseyi rehavete sokmasın.", effect: { teamMorale: 2 } }, // Keeping them grounded
                        { text: "Bizim için sıradan bir gün, işimizi yaptık.", effect: { teamMorale: 5 } }
                    ]
                }
            ]
        },
        {
            id: 'HEAVY_LOSS_4_GOALS',
            priority: 90,
            condition: (ctx) => (ctx.oppScore - ctx.myScore) >= 4,
            templates: [
                {
                    question: "4 farklı hezimet... Bu skorun izahı var mı? Takım neden sahada yoktu?",
                    options: [
                        { text: "Utanç verici bir gece. Tüm sorumluluğu alıyorum.", effect: { teamMorale: 5, trustUpdate: { board: -5 } } }, // Taking blame protects players (+5 morale) but hurts board trust
                        { text: "Her gelen şut gol oldu, futbolda bazen böyle kara geceler olur.", effect: { teamMorale: -2 } },
                        { text: "Bazı oyuncularımın bu takımda oynamayı hak edip etmediğini düşüneceğim.", effect: { teamMorale: -10 } } // Heavy morale hit
                    ]
                }
            ]
        },

        // MY TEAM RED CARD
        {
            id: 'MY_RED_CARD',
            priority: 85,
            condition: (ctx) => ctx.events.some(e => e.type === 'CARD_RED' && e.teamName === ctx.myTeamName),
            templates: [
                {
                    question: "Kırmızı kart oyun planlarınızı alt üst etti. {player} kırmızı kart gördü. Bu hareketi nasıl değerlendiriyorsunuz?",
                    options: [
                        { text: "Profesyonelliğe yakışmayan bir hareketti, cezasını kulüp olarak vereceğiz.", effect: { playerMorale: -10, teamMorale: -2 } },
                        { text: "Hakem çok ağırdı, bence sarı kart yeterliydi.", effect: { playerMorale: 5, teamMorale: 2, trustUpdate: { referees: -5 } } }, // Support player, blame ref
                        { text: "Futbolun içinde bunlar var, kalanlar iyi mücadele etti.", effect: { playerMorale: -5, teamMorale: 3 } }
                    ]
                },
                {
                    question: "{player} kırmızı kart sonrası soyunma odasına giderken taraftarların tepkisini aldı. Bu durum oyuncu üzerinde baskı yaratır mı?",
                    options: [
                        { text: "O baskıyı hak etti, taraftarın hissi doğru.", effect: { playerMorale: -10, trustUpdate: { fans: 5 } } },
                        { text: "Taraftarın tepkisi doğal ama {player} güçlü bir karakterdir.", effect: { playerMorale: 3 } },
                        { text: "Baskıya değil, çözüme odaklanıyoruz. Durumu içeride konuşacağız.", effect: { playerMorale: -3, teamMorale: 2 } }
                    ]
                },
                {
                    question: "{player} kırmızı kartı sonrası rakip oyunu tamamen kontrol etti. Bu hatanın maçın kaderini değiştirdiğini düşünüyor musunuz?",
                    options: [
                        { text: "Evet, kırmızı kart maçın kırılma anıydı.", effect: { playerMorale: -10 } },
                        { text: "Hayır, takım eksik kalınca daha da kenetlendi.", effect: { teamMorale: 3 } },
                        { text: "Böyle şeylere takılırsak ilerleyemeyiz, genel oyunumuz yetersizdi.", effect: { teamMorale: -2 } }
                    ]
                },
                {
                    question: "Kırmızı kart sonrası teknik ekibiniz oldukça öfkeliydi. {player} için disiplin süreci başlatılacak mı?",
                    options: [
                        { text: "Evet, kulüp içi disiplin hemen işleyecek.", effect: { playerMorale: -10, trustUpdate: { fans: 5 } } },
                        { text: "Hayır, oyuncumuza sahip çıkıyoruz.", effect: { playerMorale: 5, trustUpdate: { fans: -5 } } },
                        { text: "Durumu analiz edeceğiz, acele karar vermeyeceğiz.", effect: { playerMorale: -3 } }
                    ]
                }
            ]
        },
        // PENALTY MISS
        {
            id: 'PENALTY_MISS',
            priority: 82,
            condition: (ctx) => ctx.events.some(e => e.type === 'MISS' && e.teamName === ctx.myTeamName && e.description.toLowerCase().includes('penaltı')),
            templates: [
                {
                    question: "Maçın kırılma anı kaçan penaltıydı. {player} penaltıyı kaçırdı, ona bir şey söylediniz mi?",
                    options: [
                        { text: "Futbolda bunlar var, en büyük yıldızlar bile kaçırıyor.", effect: { playerMorale: 3 } },
                        { text: "Çok üzgün, ona destek olmalıyız.", effect: { playerMorale: 5 } },
                        { text: "Penaltı çalışması yapacağız, daha dikkatli olmalıydı.", effect: { playerMorale: -3 } }
                    ]
                },
                {
                    question: "{player} kritik bir anda penaltıyı kaçırdı ve maçın gidişatı değişti. Sorumluluğu ona mı yüklüyorsunuz?",
                    options: [
                        { text: "Tek bir oyuncuyu suçlamak adil değil.", effect: { playerMorale: 3, teamMorale: 2 } },
                        { text: "Evet, bu seviyede bu hatalar pahalıya patlar.", effect: { playerMorale: -5 } },
                        { text: "Sorumluluk hepimizin, maçı tek bir pozisyona indirgemek yanlış.", effect: { teamMorale: 1 } }
                    ]
                },
                {
                    question: "Penaltı kaçtıktan sonra takımın moralinin düştüğü görüldü. {player} ile ilgili psikolojik bir sorun mu var?",
                    options: [
                        { text: "{player} çok çalışıyor, mental olarak da güçlü bir oyuncu.", effect: { playerMorale: 3 } },
                        { text: "Penaltı baskısı herkesi etkiler, zamanı gelince atar.", effect: { playerMorale: 1 } },
                        { text: "Mental seviyesinde düşüş var, özel çalışmalar yapacağız.", effect: { playerMorale: -3 } }
                    ]
                },
                {
                    question: "Penaltı sonrası takımın size dönüp tepki beklediği anlarda sert bir çıkış yapmadığınız görüldü. {player} için fazla mı yumuşaksınız?",
                    options: [
                        { text: "Oyuncularımı kameralar önünde ezmem, içeride gerekeni söylerim.", effect: { playerMorale: -2, teamMorale: 2 } },
                        { text: "Yumuşak falan değilim, adil davranıyorum.", effect: { teamMorale: 1 } },
                        { text: "Herkes hata yapar, oyuncuya yüklenmek çözüm değil.", effect: { playerMorale: 3 } }
                    ]
                },
                {
                    question: "Bu kaçan penaltı sezonun en kritik anlarından biri olabilir. Bundan sonra penaltıları {player} yerine başka biri mi kullanacak?",
                    options: [
                        { text: "Form durumuna göre karar vereceğiz, kim hazırsa o atar.", effect: { playerMorale: -2 } },
                        { text: "Hayır, ona güvenim tam. Bir dahaki sefer atacak.", effect: { playerMorale: 5, trustUpdate: { fans: 3 } } },
                        { text: "Evet, penaltı sorumluluğunu değiştirmeyi düşünüyoruz.", effect: { playerMorale: -8 } }
                    ]
                },
                {
                    question: "Penaltıyı kaçırdıktan sonra {player} uzun süre başını kaldıramadı. Sizce bu öz güven kaybının işareti mi?",
                    options: [
                        { text: "Hayır, sadece anın ağırlığı. Hızla toparlanacaktır.", effect: { playerMorale: 3 } },
                        { text: "Biraz özgüven kaybı olabilir ama bunu aşacak kapasitede.", effect: { playerMorale: 1 } },
                        { text: "Evet, mental anlamda destek almaya ihtiyacı var.", effect: { playerMorale: -3 } }
                    ]
                }
            ]
        },
        // PLAYER INJURY
        {
            id: 'PLAYER_INJURY',
            priority: 75,
            condition: (ctx) => ctx.events.some(e => e.type === 'INJURY' && e.teamName === ctx.myTeamName),
            templates: [
                {
                    question: "Maçtan çok sakatlık haberi bizi üzdü. {player} sakatlandı, durumu hakkında ilk bilgiler neler?",
                    options: [
                        { text: "Durumu ciddi görünüyor, detaylı kontrolleri yapacağız.", effect: { teamMorale: -2 } },
                        { text: "Umarım korktuğumuz gibi değildir, o bizim için çok önemli.", effect: { playerMorale: 5 } },
                        { text: "Sakatlıklar futbolun parçası, yerini dolduracağız.", effect: { playerMorale: -5, teamMorale: 2 } } // Harsh on player, good for team resilience
                    ]
                },
                {
                    question: "{player} sakatlandıktan sonra oyundan çıkarken yüzündeki acı dikkat çekti. Bu sakatlık uzun süreli bir problem olabilir mi?",
                    options: [
                        { text: "Evet, ciddi bir şeyden şüpheleniyoruz. Doktorlar inceleyecek.", effect: { teamMorale: -3 } },
                        { text: "Henüz kesin bir şey yok, umutluyuz.", effect: { playerMorale: 4 } },
                        { text: "Uzun süreli olsa bile kadromuz buna hazırlıklı.", effect: { teamMorale: 3, playerMorale: -4 } }
                    ]
                },
                {
                    question: "Taraftarlar {player}’ın sakatlığı nedeniyle büyük endişe yaşıyor. O yokken takımın performansı düşer mi?",
                    options: [
                        { text: "Elbette çok önemli bir oyuncu ama takım oyunu her zaman öndedir.", effect: { teamMorale: 2 } },
                        { text: "Onun yokluğunu hissedeceğiz, bu gerçek.", effect: { teamMorale: -2, playerMorale: 3 } },
                        { text: "Kimse vazgeçilmez değildir, kalanlar elinden geleni yapacak.", effect: { teamMorale: 3, playerMorale: -5 } }
                    ]
                },
                {
                    question: "{player} sakatlanırken teknik ekip büyük şaşkınlık yaşadı. Sizce bu sakatlık, oyuncunun fiziksel yetersizliğinden mi kaynaklandı?",
                    options: [
                        { text: "Hayır, tamamen talihsiz bir pozisyondu.", effect: { playerMorale: 4 } },
                        { text: "Fiziksel yüklenmeleri gözden geçirmemiz lazım.", effect: { teamMorale: -1 } },
                        { text: "{player} daha dikkatli olmalıydı.", effect: { playerMorale: -6 } }
                    ]
                },
                {
                    question: "Sakatlıktan sonra {player} soyunma odasına taşındı. Geri dönüş süresi hakkında tahmininiz var mı?",
                    options: [
                        { text: "Şu an konuşmak için çok erken, kontrolleri beklemeliyiz.", effect: { teamMorale: -1 } },
                        { text: "Kısa süreli olmasını umuyoruz, motivasyonu yüksek.", effect: { playerMorale: 6 } },
                        { text: "Uzun bir süreç olabilir, rotasyonu ona göre ayarlayacağız.", effect: { teamMorale: 2, playerMorale: -5 } }
                    ]
                },
                {
                    question: "{player} sahada takımın liderlerindendi. Onun sakatlığı moral açısından da vurucu oldu mu?",
                    options: [
                        { text: "Evet, herkes etkilendi ama toparlanacağız.", effect: { teamMorale: -2 } },
                        { text: "Takım ruhu güçlüdür, bu durumu birlikte aşacağız.", effect: { teamMorale: 4 } },
                        { text: "Liderlik tek kişiye bağlı olmamalı, herkes sorumluluk alacak.", effect: { teamMorale: 3, playerMorale: -3 } }
                    ]
                }
            ]
        }
    ];

    // Default Result Questions
    const QUESTIONS_BY_RESULT: Record<string, {question: string, options: QuestionOption[]}[]> = {
        'WIN': [
            {
                question: "Bugünkü galibiyette rakibin zayıflığı mı yoksa sizin üstünlüğünüz mü belirleyici oldu?",
                options: [
                    { text: "Biz iyiydik, rakibin durumu beni ilgilendirmiyor.", effect: { teamMorale: 5 } },
                    { text: "Açıkçası rakip bize direnemedi.", effect: { teamMorale: 8 } }, // Arrogance boosts confidence?
                    { text: "İkisi de… ama biz daha akıllı oynadık.", effect: { teamMorale: 4 } }
                ]
            },
            {
                question: "Galibiyet serisi sürüyor. Bu oyun istikrarın göstergesi mi?",
                options: [
                    { text: "Evet, doğru yolda olduğumuzu gösteriyor.", effect: { teamMorale: 5 } },
                    { text: "Seriler önemli ama sezon uzun.", effect: { teamMorale: 3 } },
                    { text: "Şu anlık sadece işimizi yapıyoruz.", effect: { teamMorale: 2 } }
                ]
            },
            {
                question: "Rakip teknik direktör ‘hak etmediler’ dedi. Yorumu nasıl buldunuz?",
                options: [
                    { text: "Sahada olanı herkes gördü.", effect: { teamMorale: 3 } },
                    { text: "Söyleyecek bir şey bulamayanlar böyle konuşur.", effect: { teamMorale: 5 } },
                    { text: "Rakibin yorumu bizi ilgilendirmiyor.", effect: { teamMorale: 3 } }
                ]
            },
            {
                question: "Bugün orta sahadaki üstünlüğünüz dikkat çekti. Bunun sırrı neydi?",
                options: [
                    { text: "Yoğun antrenman ve disiplin.", effect: { teamMorale: 4 } },
                    { text: "Oyuncularımız fark yarattı.", effect: { teamMorale: 5 } },
                    { text: "Rakip bize alan bıraktı.", effect: { teamMorale: 3 } }
                ]
            },
            {
                question: "Farklı galibiyet sonrası taraftar coştu. Bu enerji takıma yansıyor mu?",
                options: [
                    { text: "Taraftarın itici gücü inanılmaz.", effect: { teamMorale: 5 } },
                    { text: "Sahada işimize odaklıyız.", effect: { teamMorale: 3 } },
                    { text: "Coşku güzel ama temkinliyiz.", effect: { teamMorale: 2 } }
                ]
            },
            {
                question: "Oyun üstünlüğü tamamen sizdeydi. Bu seviyede böyle dominasyon bekliyor muydunuz?",
                options: [
                    { text: "Evet, planımız buydu.", effect: { teamMorale: 5 } },
                    { text: "Bu kadarını biz de beklemiyorduk.", effect: { teamMorale: 4 } },
                    { text: "Dominasyon sonuçla ölçülür.", effect: { teamMorale: 5 } }
                ]
            },
            {
                question: "Bugün oyuncular çok özgüvenliydi. Aşırı özgüven sorun yaratır mı?",
                options: [
                    { text: "Hayır, özgüven başarı getirir.", effect: { teamMorale: 5 } },
                    { text: "Dengeyi korumak için çalışacağız.", effect: { teamMorale: 2 } },
                    { text: "Gerekirse frenleriz.", effect: { teamMorale: 1 } }
                ]
            },
            {
                question: "Bu galibiyet sizi zirve yarışında avantajlı hale getirdi mi?",
                options: [
                    { text: "Evet, çok kritik bir galibiyetti.", effect: { teamMorale: 5 } },
                    { text: "Henüz hiçbir şey garantilenmedi.", effect: { teamMorale: 2 } },
                    { text: "Her maç final gibi.", effect: { teamMorale: 3 } }
                ]
            },
            {
                question: "Bugünkü tempoyla rakibi boğdunuz. Fiziksel açıdan en iyi döneminiz mi?",
                options: [
                    { text: "Evet, oyuncular çok formda.", effect: { teamMorale: 5 } },
                    { text: "Daha da iyileşebiliriz.", effect: { teamMorale: 4 } },
                    { text: "Tempomuz rakibe göre değişir.", effect: { teamMorale: 2 } }
                ]
            },
            {
                question: "Taraftarlar oyunu ‘şov’ olarak nitelendirdi. Bu tarz bir futbol devam edecek mi?",
                options: [
                    { text: "Evet, hedefimiz keyif veren futbol.", effect: { teamMorale: 5 } },
                    { text: "Her maçın senaryosu farklı.", effect: { teamMorale: 2 } },
                    { text: "Sonuç odaklıyız, şov ikinci planda.", effect: { teamMorale: 1 } }
                ]
            },
            {
                question: "Oyuncuların kondisyonu hiç düşmedi. Bu bir hazırlık başarısı mı?",
                options: [
                    { text: "Evet, ekibimiz çok iyi çalışıyor.", effect: { teamMorale: 5 } },
                    { text: "Oyuncular tüm krediyi hak ediyor.", effect: { teamMorale: 5 } },
                    { text: "Kondisyonumuzun daha da artması gerekiyor.", effect: { teamMorale: 2 } }
                ]
            },
            {
                question: "Sizce bu galibiyet rakipler için bir mesaj niteliğinde mi?",
                options: [
                    { text: "Evet, kim olduğumuzu hatırlattık.", effect: { teamMorale: 5 } },
                    { text: "Mesaj değil, sadece işimizi yaptık.", effect: { teamMorale: 3 } },
                    { text: "Bunu rakipler düşünsün.", effect: { teamMorale: 3 } }
                ]
            },
            {
                question: "Oyuncularınız sanki özgüveni tavan yapmış gibi. Bu durum tehlikeli olabilir mi?",
                options: [
                    { text: "Özgüven olmadan başarı gelmez.", effect: { teamMorale: 5 } },
                    { text: "Kontrol bizde oldukça sorun yok.", effect: { teamMorale: 3 } },
                    { text: "Aşırıya kaçmamak için konuşacağız.", effect: { teamMorale: 1 } }
                ]
            },
            {
                question: "Galibiyet sonrası soyunma odasında büyük mutluluk vardı. Bu birliktelik sezonu taşır mı?",
                options: [
                    { text: "Evet, takım ruhu en büyük gücümüz.", effect: { teamMorale: 5 } },
                    { text: "Bu bir başlangıç.", effect: { teamMorale: 4 } },
                    { text: "Ruh önemli ama yeterli değil.", effect: { teamMorale: 2 } }
                ]
            },
            {
                question: "Bugün taktik disiplin üst düzeydi. Bu seviyeyi kalıcı hale getirebilecek misiniz?",
                options: [
                    { text: "Kesinlikle, bunun için çalışıyoruz.", effect: { teamMorale: 5 } },
                    { text: "Her maç test olacak.", effect: { teamMorale: 3 } },
                    { text: "Kalıcı hale getirmek kolay değil.", effect: { teamMorale: 1 } }
                ]
            },
            {
                question: "Galibiyette birçok oyuncu öne çıktı. Bu çeşitlilik sizi mutlu ediyor mu?",
                options: [
                    { text: "Evet, kolektif oyun başarıyı getirir.", effect: { teamMorale: 5 } },
                    { text: "Bireysel katkılar çok değerli.", effect: { teamMorale: 4 } },
                    { text: "Herkes katkı vermeli, bu olmazsa olmaz.", effect: { teamMorale: 3 } }
                ]
            },
            {
                question: "Bu galibiyetle birlikte sizi şampiyonluk favorisi ilan edenler var. Baskı hissediyor musunuz?",
                options: [
                    { text: "Baskıyı kaldırabilecek bir takımız.", effect: { teamMorale: 3 } },
                    { text: "Favori olmak bizi ilgilendirmiyor.", effect: { teamMorale: 2 } },
                    { text: "Bu baskıdan keyif alıyoruz.", effect: { teamMorale: 5 } }
                ]
            }
        ],
        'LOSS': [
            {
                question: "Bugün sahada istediklerinizi yapamadınız, mağlubiyetin ana sebebi neydi?",
                options: [
                    { text: "Sorumluluk tamamen bende.", effect: { teamMorale: 5, trustUpdate: { board: -2 } } }, // Taking blame helps team
                    { text: "Hakem kararları oyunun önüne geçti.", effect: { teamMorale: 2, trustUpdate: { referees: -5 } } },
                    { text: "Bu performans bizim seviyemiz değil.", effect: { teamMorale: -5 } } // Criticism
                ]
            },
            {
                question: "Bugün takımınız neredeyse hiç varlık gösteremedi. Bunun sebebi taktik mi fiziksel eksiklik mi?",
                options: [
                    { text: "Taktiksel olarak hatalar yaptık.", effect: { teamMorale: -3 } },
                    { text: "Fiziksel olarak yetersiz kaldık.", effect: { teamMorale: -4 } },
                    { text: "Rakip bizden daha hazırdı.", effect: { teamMorale: -2 } }
                ]
            },
            {
                question: "Taraftarlar özellikle ilk yarıdaki isteksiz oyuna büyük tepki gösterdi. Buna ne diyorsunuz?",
                options: [
                    { text: "Taraftar haklı, beklentiyi karşılamadık.", effect: { teamMorale: -3 } },
                    { text: "İsteğimiz vardı ama uygulayamadık.", effect: { teamMorale: -2 } },
                    { text: "Tepkiler normal, düzelteceğiz.", effect: { teamMorale: -1 } }
                ]
            },
            {
                question: "Rakip çok rahat pozisyon buldu. Savunmadaki zaaflar sizi endişelendiriyor mu?",
                options: [
                    { text: "Evet, acil çözüm üretmeliyiz.", effect: { teamMorale: -5 } },
                    { text: "Bireysel hatalar vardı.", effect: { teamMorale: -3 } },
                    { text: "Bugün kötü günümüzdü.", effect: { teamMorale: -1 } }
                ]
            },
            {
                question: "Bu mağlubiyet sonrası oyuncuların özgüven kaybı yaşadığı görülüyor. Bunu nasıl aşacaksınız?",
                options: [
                    { text: "Mental destek vereceğiz.", effect: { teamMorale: 2 } },
                    { text: "Daha çok çalışacağız.", effect: { teamMorale: 1 } },
                    { text: "Sorumluluk almalarını isteyeceğim.", effect: { teamMorale: -1 } }
                ]
            },
            {
                question: "Oyun içinde hiç reaksiyon veremediniz. Sizce sorun motivasyon mu taktik mi?",
                options: [
                    { text: "Motivasyon eksikti.", effect: { teamMorale: -3 } },
                    { text: "Taktiksel olarak hata yaptım.", effect: { teamMorale: 3 } },
                    { text: "İkisi de etkili oldu.", effect: { teamMorale: -2 } }
                ]
            },
            {
                question: "Mağlubiyet sonrası yönetimin memnun olmadığı konuşuluyor. Baskı altında mısınız?",
                options: [
                    { text: "Her zaman baskı vardır.", effect: { teamMorale: -1 } },
                    { text: "Bu baskının üstesinden geleceğiz.", effect: { teamMorale: 1 } },
                    { text: "Eleştiriler normal.", effect: { teamMorale: 0 } }
                ]
            },
            {
                question: "Orta sahada tamamen ezildiniz. Kadro kaliteniz yeterli değil mi?",
                options: [
                    { text: "Kadroda eksikler var, kabul ediyorum.", effect: { teamMorale: -3 } },
                    { text: "Bugün kötüydük ama genel olarak iyiyiz.", effect: { teamMorale: -1 } },
                    { text: "Orta saha görevini yapamadı.", effect: { teamMorale: -4 } }
                ]
            },
            {
                question: "Bu mağlubiyet sizi yarıştan koparır mı?",
                options: [
                    { text: "Hayır, toparlanacağız.", effect: { teamMorale: 2 } },
                    { text: "Zor olacak ama mümkün.", effect: { teamMorale: -1 } },
                    { text: "Her ihtimal masada.", effect: { teamMorale: 0 } }
                ]
            },
            {
                question: "Takımınız bugün organize atak üretemedi. Bu şanssızlık mı hazırlıksızlık mı?",
                options: [
                    { text: "Hazırlıksızlıktı.", effect: { teamMorale: -3 } },
                    { text: "Şanssızlık da vardı.", effect: { teamMorale: -1 } },
                    { text: "Her yönüyle kötüydük.", effect: { teamMorale: -4 } }
                ]
            },
            {
                question: "Rakip taraftarın tezahüratları oyuncuları etkiledi mi?",
                options: [
                    { text: "Evet, baskı kurdular.", effect: { teamMorale: -2 } },
                    { text: "Hayır, buna bahane bulmayacağız.", effect: { teamMorale: 1 } },
                    { text: "Birkaç oyuncu etkilendi.", effect: { teamMorale: -1 } }
                ]
            },
            {
                question: "Bu kadar kötü bir performansı bekliyor muydunuz?",
                options: [
                    { text: "Hayır, şaşkınım.", effect: { teamMorale: -2 } },
                    { text: "Bazı işaretler vardı.", effect: { teamMorale: -1 } },
                    { text: "Kötü performansı kabul ediyorum.", effect: { teamMorale: -3 } }
                ]
            },
            {
                question: "Maç boyunca kenardan çok sinirliydiniz. Oyuncular sizi hayal kırıklığına mı uğrattı?",
                options: [
                    { text: "Evet, daha iyisini bekliyordum.", effect: { teamMorale: -4 } },
                    { text: "Hayal kırıklığı değil, konsantrasyon.", effect: { teamMorale: -1 } },
                    { text: "Hepimiz kötüydük.", effect: { teamMorale: -2 } }
                ]
            },
            {
                question: "Sakat oyuncuların yokluğu performansı ne kadar etkiledi?",
                options: [
                    { text: "Çok etkiledi.", effect: { teamMorale: -2 } },
                    { text: "Bahane değil.", effect: { teamMorale: 1 } },
                    { text: "Alternatifler yeterli değildi.", effect: { teamMorale: -3 } }
                ]
            },
            {
                question: "Basında takım içi huzursuzluk haberleri çıktı. Bu mağlubiyet o iddiaları güçlendirir mi?",
                options: [
                    { text: "Hayır, takım içinde sorun yok.", effect: { teamMorale: 1 } },
                    { text: "Bu haberler abartı.", effect: { teamMorale: 0 } },
                    { text: "Bazı rahatsızlıklar var.", effect: { teamMorale: -4 } }
                ]
            },
            {
                question: "Sonuçtan bağımsız olarak oyun da tatmin etmedi. Taraftara mesajınız nedir?",
                options: [
                    { text: "Özür dileriz, düzelteceğiz.", effect: { teamMorale: -1, trustUpdate: { fans: 5 } } },
                    { text: "Destekleri bizim için önemli.", effect: { teamMorale: 1 } },
                    { text: "Eleştiriler haklı.", effect: { teamMorale: -2 } }
                ]
            },
            {
                question: "Savunmada yapılan hatalar pahalıya patladı. Bu oyunculara güveniniz sarsıldı mı?",
                options: [
                    { text: "Hatalar olur, arkasında duracağım.", effect: { teamMorale: 5 } },
                    { text: "Bazı oyuncular sorumluluk almakta zorlandı.", effect: { teamMorale: -3 } },
                    { text: "Bu seviyede bu hatalar kabul edilemez.", effect: { teamMorale: -5 } }
                ]
            }
        ],
        'DRAW': [
            {
                question: "Zorlu bir mücadele oldu, 1 puan kazanç mı kayıp mı?",
                options: [
                    { text: "Deplasmanda alınan 1 puan her zaman değerlidir.", effect: { teamMorale: 2 } },
                    { text: "Kesinlikle 2 puan bıraktık.", effect: { teamMorale: -2 } },
                    { text: "Oyunun hakkı beraberlikti.", effect: { teamMorale: 0 } }
                ]
            }
        ]
    };

    useEffect(() => {
        // Calculate scores from events for accurate diff checking
        const myScore = events.filter(e => e.type === 'GOAL' && e.teamName === myTeam.name).length;
        const oppScore = events.filter(e => e.type === 'GOAL' && e.teamName === opponentTeam.name).length;

        const ctx: InterviewContext = {
            result,
            events,
            myTeamName: myTeam.name,
            opponentName: opponentTeam.name,
            myScore,
            oppScore
        };

        // 1. Check Scenarios sorted by priority
        const activeScenarios = SCENARIOS.filter(s => s.condition(ctx)).sort((a,b) => b.priority - a.priority);
        
        let foundQuestion = null;
        let pId: string | undefined = undefined;

        if (activeScenarios.length > 0) {
            const scenario = activeScenarios[0];
            const randomTemplate = scenario.templates[Math.floor(Math.random() * scenario.templates.length)];
            
            // Dynamic Name Replacement Logic
            let finalQuestionText = randomTemplate.question;
            let subjectPlayerName = "Oyuncunuz";

            // Determine Subject Player based on Scenario ID
            if (scenario.id === 'HAT_TRICK') {
                 // Find the hat-trick hero
                 const scorers = events.filter(e => e.type === 'GOAL' && e.teamName === myTeam.name).map(e => e.scorer);
                 const counts: Record<string, number> = {};
                 let htHero = null;
                 scorers.forEach(s => { 
                     if(s) {
                         counts[s] = (counts[s] || 0) + 1;
                         if(counts[s] >= 3) htHero = s;
                     } 
                 });
                 if(htHero) {
                     const p = myTeam.players.find(x => x.name === htHero);
                     if(p) {
                         subjectPlayerName = p.name;
                         pId = p.id;
                     }
                 }
            } 
            else if (scenario.id === 'MY_RED_CARD') {
                const evt = events.find(e => e.type === 'CARD_RED' && e.teamName === myTeam.name);
                subjectPlayerName = getPlayerNameFromEvent(evt);
                pId = getPlayerIdFromEvent(evt);
            } 
            else if (scenario.id === 'PLAYER_INJURY') {
                const evt = events.find(e => e.type === 'INJURY' && e.teamName === myTeam.name);
                subjectPlayerName = getPlayerNameFromEvent(evt);
                pId = getPlayerIdFromEvent(evt);
            } 
            else if (scenario.id === 'PENALTY_MISS') {
                const evt = events.find(e => e.type === 'MISS' && e.teamName === myTeam.name && e.description.toLowerCase().includes('penaltı'));
                subjectPlayerName = getPlayerNameFromEvent(evt);
                pId = getPlayerIdFromEvent(evt);
            }

            finalQuestionText = finalQuestionText.replace('{player}', subjectPlayerName);

            foundQuestion = {
                question: finalQuestionText,
                options: randomTemplate.options
            };
        } else {
            // 2. Fallback to Result Based Questions
            const pool = QUESTIONS_BY_RESULT[result] || QUESTIONS_BY_RESULT['DRAW'];
            const randomQ = pool[Math.floor(Math.random() * pool.length)];
            foundQuestion = randomQ;
        }

        setCurrentQuestion(foundQuestion);
        setRelatedPlayerId(pId);

    }, [result, events, myTeam, opponentTeam]);

    const handleOptionClick = (opt: QuestionOption) => {
        // Pass the effect and the related player ID back to the main app
        onComplete(opt.effect || {}, relatedPlayerId);
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
                            onClick={() => handleOptionClick(opt)} 
                            className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-4 rounded-lg text-left text-sm transition-all text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white hover:shadow-lg group"
                         >
                             <span className="font-bold text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 mr-2">{idx + 1}.</span> {opt.text}
                             
                             {/* Optional: Dev helper to see effects */}
                             {/* 
                             {opt.effect?.teamMorale !== undefined && <span className="text-xs ml-2 text-slate-400">Team: {opt.effect.teamMorale > 0 ? '+' : ''}{opt.effect.teamMorale}</span>}
                             {opt.effect?.playerMorale !== undefined && <span className="text-xs ml-2 text-slate-400">Player: {opt.effect.playerMorale > 0 ? '+' : ''}{opt.effect.playerMorale}</span>}
                             */}
                         </button>
                     ))}
                 </div>
             </div>
        </div>
    );
};

export default PostMatchInterview;