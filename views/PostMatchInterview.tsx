
import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

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
                question: "Bugün çok kötü bir şekilde rakbinize kaybettiniz sebep ne?",
                options: [
                    "Valla çimler uzundu o yüzden kaybettik.",
                    "Kesinlikle hakemin suçu vardı yoksa ben kötü birisi değilim.",
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

export default PostMatchInterview;
