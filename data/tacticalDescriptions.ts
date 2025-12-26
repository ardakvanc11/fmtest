
import { PassingStyle, Tempo, Width, AttackingTransition, CreativeFreedom, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefensiveLine, DefLineMobility, PressIntensity, DefensiveTransition, Tackling, PreventCrosses, PressingFocus } from '../types';

export interface TacticDetail {
    label: string;
    description: string;
    pros: string[];
    cons: string[];
}

export const TACTICAL_DESCRIPTIONS: Record<string, Record<string, TacticDetail>> = {
    'PASSING': {
        [PassingStyle.EXTREME_SHORT]: {
            label: 'Aşırı Kısa Pas',
            description: 'Oyuncular risk almaktan kaçınır ve her zaman en yakın takım arkadaşına oynar. Tiki-taka için idealdir.',
            pros: ['Topa sahip olma maksimuma çıkar.', 'Top kaybı azalır.'],
            cons: ['Oyun sıkışabilir.', 'Hücum yavaşlar.']
        },
        [PassingStyle.SHORT]: {
            label: 'Kısa Pas',
            description: 'Topu yere indirip kısa, güvenli paslarla oyun kurmaya yönlendirilir.',
            pros: ['Oyunun kontrolü elimizde olur.', 'Rakibi yorar.'],
            cons: ['Hücum temposu düşebilir.']
        },
        [PassingStyle.STANDARD]: {
            label: 'Standart',
            description: 'Dengeli bir yaklaşım.',
            pros: ['Esneklik sağlar.'],
            cons: ['Belirgin bir kimlik oluşturmaz.']
        },
        [PassingStyle.DIRECT]: {
            label: 'Dikine Uzun',
            description: 'Topu kazanır kazanmaz en hızlı şekilde rakip kaleye gitmeye odaklanır.',
            pros: ['Hızlı hücum fırsatları.', 'Rakibi hazırlıksız yakalar.'],
            cons: ['Top kaybı artar.']
        },
        [PassingStyle.PUMP_BALL]: {
            label: 'İleri Şişir',
            description: 'Orta sahayı pas geçip topu doğrudan forvetlere uzun vurur.',
            pros: ['Baskıdan çabuk çıkılır.', 'Kaos yaratır.'],
            cons: ['Topun hakimiyeti tamamen rakibe geçebilir.']
        }
    },
    'TEMPO': {
        [Tempo.VERY_SLOW]: {
            label: 'Çok Düşük',
            description: 'Oyun adeta durma noktasına gelir. Amaç topu tutmak ve zaman öldürmektir.',
            pros: ['Skoru korumak için mükemmel.', 'Kondisyon harcanmaz.'],
            cons: ['Rakip savunma tamamen yerleşir.', 'Gol atmak çok zordur.']
        },
        [Tempo.SLOW]: {
            label: 'Düşük',
            description: 'Sabırlı oyun. Boşluk bulana kadar paslaşılır.',
            pros: ['Top kontrolü artar.'],
            cons: ['Heyecan düşer.']
        },
        [Tempo.STANDARD]: {
            label: 'Standart',
            description: 'Dengeli tempo.',
            pros: ['Duruma göre hızlanır.'],
            cons: ['Yok.']
        },
        [Tempo.HIGH]: {
            label: 'Yüksek',
            description: 'Topu hızlı dolaştırır ve rakibi hataya zorlar.',
            pros: ['Rakip dengesiz yakalanır.'],
            cons: ['Pas hatası riski artar.']
        },
        [Tempo.BEAST_MODE]: {
            label: 'Hayvan Gibi',
            description: 'Oyuncular ciğerleri patlayana kadar koşar ve oyunu hızlandırır.',
            pros: ['Rakibi boğar.', 'Taraftarı coşturur.'],
            cons: ['Kondisyon 60. dakikada biter.', 'Sakatlık riski çok yüksek.']
        }
    },
    'WIDTH': {
        [Width.VERY_NARROW]: {
            label: 'Çok Dar Alan',
            description: 'Tüm takım merkeze yığılır.',
            pros: ['Merkezde mutlak üstünlük.'],
            cons: ['Kanatlar otobana döner.']
        },
        [Width.NARROW]: {
            label: 'Dar Alan',
            description: 'Merkez ağırlıklı oyun.',
            pros: ['Kısa pasa uygun.'],
            cons: ['Genişlik kullanılamaz.']
        },
        [Width.STANDARD]: {
            label: 'Standart',
            description: 'Dengeli saha kullanımı.',
            pros: ['Denge.'],
            cons: ['Yok.']
        },
        [Width.WIDE]: {
            label: 'Geniş Alan',
            description: 'Kanat oyuncuları çizgiye basar.',
            pros: ['Rakip savunma açılır.'],
            cons: ['Merkezde boşluklar olabilir.']
        },
        [Width.VERY_WIDE]: {
            label: 'Çok Geniş Alan',
            description: 'Sahayı enlemesine sonuna kadar kullanır.',
            pros: ['Uzun paslar için alan açar.'],
            cons: ['Oyuncular arası mesafe çok artar, paslaşmak zorlaşır.']
        }
    },
    'ATTACK_TRANSITION': {
        [AttackingTransition.KEEP_SHAPE]: { label: 'Dağılımı Koru', description: 'Topu kapınca pozisyonlarını bozmazlar.', pros: ['Güvenli.'], cons: ['Kontra şansı azalır.'] },
        [AttackingTransition.STANDARD]: { label: 'Standart', description: 'Dengeli çıkış.', pros: ['Denge.'], cons: ['Yok.'] },
        [AttackingTransition.PUSH_FORWARD]: { label: 'İleri Çık', description: 'Top kazanılınca bekler ve orta saha hemen ileri koşar.', pros: ['Hızlı hücum.'], cons: ['Savunma arkası boş kalır.'] }
    },
    'CREATIVE': {
        [CreativeFreedom.DISCIPLINED]: { label: 'Disiplinli', description: 'Taktik dışına çıkılmaz.', pros: ['Organizasyon bozulmaz.'], cons: ['Sürpriz yaratılmaz.'] },
        [CreativeFreedom.STANDARD]: { label: 'Standart', description: 'Dengeli.', pros: ['Normal.'], cons: ['Yok.'] },
        [CreativeFreedom.CREATIVE]: { label: 'Yaratıcı', description: 'Oyuncular inisiyatif alır.', pros: ['Kilidi açabilir.'], cons: ['Disiplin sorunu olabilir.'] }
    },
    'SET_PIECE': {
        [SetPiecePlay.RECYCLE]: { label: 'Oyun İçinde Kalsın', description: 'Duran topta riske girmez.', pros: ['Kontra yemezsiniz.'], cons: ['Gol şansı düşer.'] },
        [SetPiecePlay.TRY_SCORE]: { label: 'Kazanmaya Çalış', description: 'Stoperler de ileri çıkar.', pros: ['Gol şansı artar.'], cons: ['Kontra riski.'] }
    },
    'PLAY_STRATEGY': {
        [PlayStrategy.TRY_BREAK]: { label: 'Presi Kırmaya Çalış', description: 'Pasla çıkmaya çalışır.', pros: ['Top bizde kalır.'], cons: ['Hata riski.'] },
        [PlayStrategy.STANDARD]: { label: 'Standart', description: 'Dengeli.', pros: ['Denge.'], cons: ['Yok.'] },
        [PlayStrategy.BREAK_PRESS]: { label: 'Presi Kır', description: 'Gerekirse uzun vurarak baskıdan kurtulur.', pros: ['Güvenli.'], cons: ['Top kaybı.'] }
    },
    'GOAL_KICK': {
        [GoalKickType.SHORT]: { label: 'Kısa', description: 'Stoperlere pas.', pros: ['Oyun kurma.'], cons: ['Pres yeme riski.'] },
        [GoalKickType.STANDARD]: { label: 'Standart', description: 'Duruma göre.', pros: ['Esnek.'], cons: ['Yok.'] },
        [GoalKickType.LONG]: { label: 'Uzun', description: 'İleri vurur.', pros: ['Güvenli.'], cons: ['Hava topu mücadelesi.'] }
    },
    'GK_DIST_TARGET': {
        [GKDistributionTarget.CBS]: { label: 'Stoperlere', description: 'Defanstan oyun kurar.', pros: ['Kontrollü.'], cons: ['Riskli.'] },
        [GKDistributionTarget.FULLBACKS]: { label: 'Beklere', description: 'Kanatlardan kurar.', pros: ['Genişlik.'], cons: ['Taç çizgisi sıkışması.'] },
        [GKDistributionTarget.MIDFIELD]: { label: 'Orta Saha', description: 'Merkeze oynar.', pros: ['Oyunun kalbi.'], cons: ['Top kaybı tehlikeli.'] },
        [GKDistributionTarget.WINGS]: { label: 'Kanatlar', description: 'Açıklara uzun.', pros: ['Hızlı atak.'], cons: ['İsabet oranı düşük.'] },
        [GKDistributionTarget.STRIKER]: { label: 'Forvete', description: 'Pivot santrafora.', pros: ['İndirilen toplar.'], cons: ['Fizik güç ister.'] }
    },
    'SUPPORT_RUNS': {
        [SupportRuns.BALANCED]: { label: 'Dengeli', description: 'Fırsat bulunca.', pros: ['Denge.'], cons: ['Yok.'] },
        [SupportRuns.RIGHT]: { label: 'Sağdan', description: 'Sağ bek bindirir.', pros: ['Sağ kanat aktif.'], cons: ['Sağ arka boş.'] },
        [SupportRuns.LEFT]: { label: 'Soldan', description: 'Sol bek bindirir.', pros: ['Sol kanat aktif.'], cons: ['Sol arka boş.'] },
        [SupportRuns.CENTER]: { label: 'Ortadan', description: 'Merkezden deler.', pros: ['Kalabalık hücum.'], cons: ['Kanatlar yalnız kalır.'] }
    },
    'DRIBBLING': {
        [Dribbling.DISCOURAGE]: { label: 'Vazgeçir', description: 'Pas öncelikli.', pros: ['Top kaybı azalır.'], cons: ['Yaratıcılık düşer.'] },
        [Dribbling.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [Dribbling.ENCOURAGE]: { label: 'Destekle', description: 'Çalım serbest.', pros: ['Adam eksiltme.'], cons: ['Top kaybı artar.'] }
    },
    'FOCUS_AREA': {
        [FocusArea.STANDARD]: { label: 'Standart', description: 'Karışık.', pros: ['Tahmin edilemez.'], cons: ['Yok.'] },
        [FocusArea.LEFT]: { label: 'Soldan', description: 'Sol kanat ağırlıklı.', pros: ['Solu zorlar.'], cons: ['Tek yönlü.'] },
        [FocusArea.RIGHT]: { label: 'Sağdan', description: 'Sağ kanat ağırlıklı.', pros: ['Sağı zorlar.'], cons: ['Tek yönlü.'] },
        [FocusArea.CENTER]: { label: 'Ortadan', description: 'Göbekten.', pros: ['Kısa yol.'], cons: ['Kalabalık.'] },
        [FocusArea.BOTH_WINGS]: { label: 'Her İki Kanat', description: 'Kanatları kullanır.', pros: ['Genişlik.'], cons: ['Merkez boşalır.'] }
    },
    'PASS_TARGET': {
        [PassTarget.FEET]: { label: 'Ayağına Ver', description: 'Garantili pas.', pros: ['Top bizde kalır.'], cons: ['Yavaş oyun.'] },
        [PassTarget.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [PassTarget.SPACE]: { label: 'Koşu Yoluna', description: 'Boşluğa pas.', pros: ['Tehlike yaratır.'], cons: ['İsabet oranı düşer.'] }
    },
    'PATIENCE': {
        [Patience.EARLY_CROSS]: { label: 'Fazla Bekletmeden Orta Aç', description: 'Kenara inince hemen orta.', pros: ['Sürpriz gol.'], cons: ['Hazırlıksız hücum.'] },
        [Patience.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [Patience.WORK_INTO_BOX]: { label: 'Paslaşarak Gir', description: 'Net pozisyon arar.', pros: ['Kesin gol şansı.'], cons: ['Şut sayısı düşebilir.'] }
    },
    'LONG_SHOTS': {
        [LongShots.DISCOURAGE]: { label: 'Vazgeçir', description: 'Ceza sahasına girmeye çalış.', pros: ['Garantili oyun.'], cons: ['Kapanan savunmayı açamaz.'] },
        [LongShots.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [LongShots.ENCOURAGE]: { label: 'Destekle', description: 'Gördüğün yerden vur.', pros: ['Sürpriz goller.'], cons: ['Toplar dağa taşa gidebilir.'] }
    },
    'CROSSING': {
        [CrossingType.LOW]: { label: 'Yerden', description: 'Sert yerden orta.', pros: ['Hızlı forvetler için.'], cons: ['Savunma kesebilir.'] },
        [CrossingType.STANDARD]: { label: 'Standart', description: 'Karışık.', pros: ['Denge.'], cons: ['Yok.'] },
        [CrossingType.HIGH]: { label: 'Havadan', description: 'Arka direğe şişir.', pros: ['Pivot forvetler için.'], cons: ['Kaleci toplayabilir.'] }
    },
    'GK_SPEED': {
        [GKDistributionSpeed.SLOW]: { label: 'Yavaş', description: 'Oyunu soğutur.', pros: ['Takım yerleşir.'], cons: ['Kontra şansı yok.'] },
        [GKDistributionSpeed.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [GKDistributionSpeed.FAST]: { label: 'Hızlı', description: 'Hemen başlatır.', pros: ['Kontra atak.'], cons: ['Hata riski.'] }
    },
    'PRESS_LINE': {
        [PressingLine.LOW]: { label: 'Geride', description: 'Kendi sahasında karşılar.', pros: ['Alan bırakmaz.'], cons: ['Rakip rahat oynar.'] },
        [PressingLine.MID]: { label: 'Ortada', description: 'Orta sahada basar.', pros: ['Denge.'], cons: ['Yok.'] },
        [PressingLine.HIGH]: { label: 'İleride', description: 'Rakip stoperlere basar.', pros: ['Oyun kurdurmaz.'], cons: ['Arka taraf boşalır.'] }
    },
    'DEF_LINE': {
        [DefensiveLine.VERY_DEEP]: { label: 'Çok Geride', description: 'Ceza sahasına gömülür.', pros: ['Otobüsü çeker.'], cons: ['Çok baskı yer.'] },
        [DefensiveLine.DEEP]: { label: 'Geride', description: 'Güvenli oyun.', pros: ['Arkaya top atılmaz.'], cons: ['Hücumdan uzak.'] },
        [DefensiveLine.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [DefensiveLine.HIGH]: { label: 'İleride', description: 'Orta sahaya yakın.', pros: ['Ofsayt taktiği.'], cons: ['Arkaya atılan toplar.'] },
        [DefensiveLine.VERY_HIGH]: { label: 'Çok İleride', description: 'Santraya yakın.', pros: ['Rakibi boğar.'], cons: ['İntihar riski.'] }
    },
    'DEF_MOBILITY': {
        [DefLineMobility.STEP_UP]: { label: 'Daha Sık Önde Savun', description: 'Ofsayt taktiği dener.', pros: ['Rakibi düşürür.'], cons: ['Zamanlama hatası gol olur.'] },
        [DefLineMobility.BALANCED]: { label: 'Dengeli', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [DefLineMobility.DROP_BACK]: { label: 'Daha Sık Geriye Yaslan', description: 'Süpürücü görevi.', pros: ['Güvenli.'], cons: ['Rakibi tutar.'] }
    },
    'PRESS_INTENSITY': {
        [PressIntensity.VERY_LOW]: { label: 'Çok Az', description: 'Gölge pres.', pros: ['Enerji saklar.'], cons: ['Rakip elini kolunu sallayarak oynar.'] },
        [PressIntensity.LOW]: { label: 'Az Şiddetli', description: 'Alan kapatır.', pros: ['Disiplin.'], cons: ['Pas kanallarını kapatamaz.'] },
        [PressIntensity.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [PressIntensity.HIGH]: { label: 'Şiddetli Pres', description: 'Agresif.', pros: ['Top kazanır.'], cons: ['Faul riski.'] },
        [PressIntensity.VERY_HIGH]: { label: 'Çok Şiddetli Pres', description: 'Gegenpress.', pros: ['Rakibi boğar.'], cons: ['Kondisyon biter.'] }
    },
    'DEF_TRANSITION': {
        [DefensiveTransition.REGROUP]: { label: 'Kademeye Dön', description: 'Topu kaybedince geri koş.', pros: ['Güvenli.'], cons: ['Rakip rahat çıkar.'] },
        [DefensiveTransition.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [DefensiveTransition.COUNTER_PRESS]: { label: 'Karşı Pres', description: 'Kaybedince hemen bas.', pros: ['Topu geri kazanır.'], cons: ['Eksik yakalanır.'] }
    },
    'TACKLING': {
        [Tackling.CAUTIOUS]: { label: 'Sert Yok', description: 'Ayakta kal.', pros: ['Kart görmez.'], cons: ['Rakip rahat geçer.'] },
        [Tackling.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [Tackling.AGGRESSIVE]: { label: 'Sert Dal', description: 'Kayarak müdahale.', pros: ['Topu söker alır.'], cons: ['Kırmızı kart ve penaltı.'] }
    },
    'PREVENT_CROSS': {
        [PreventCrosses.STOP_CROSS]: { label: 'Ortaları Engelle', description: 'Kanatları kapat.', pros: ['Kafa golü yemez.'], cons: ['Merkez boşalabilir.'] },
        [PreventCrosses.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [PreventCrosses.ALLOW_CROSS]: { label: 'İzin Ver', description: 'Merkezi kapat.', pros: ['Şut imkanı vermez.'], cons: ['Yan toplarda tehlike.'] }
    },
    'PRESS_FOCUS': {
        [PressingFocus.CENTER]: { label: 'Rakibi Merkezden Preslet', description: 'Ortayı kalabalık tut.', pros: ['Oyun kurdurmaz.'], cons: ['Kanatlar boş kalır.'] },
        [PressingFocus.BALANCED]: { label: 'Dengeli', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [PressingFocus.WINGS]: { label: 'Kanatlardan Prese Zorla', description: 'Çizgiye sıkıştır.', pros: ['Taç atışı kazanır.'], cons: ['Merkez boşalır.'] }
    }
};
