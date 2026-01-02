
import { IndividualTrainingType } from '../types';

export const INDIVIDUAL_PROGRAMS = [
    {
        id: IndividualTrainingType.FINISHING,
        label: 'Bitiricilik',
        category: 'TEKNİK',
        stats: ['finishing', 'composure', 'firstTouch'],
        pros: ['Ceza sahasında panik azalır', 'Net pozisyonlar gole döner'],
        cons: ['Fiziksel gelişim yavaşlar', 'Pres katkısı düşebilir'],
        target: ['SNT', 'SLK', 'SGK']
    },
    {
        id: IndividualTrainingType.PASSING,
        label: 'Pas & Oyun Kurma',
        category: 'TEKNİK',
        stats: ['passing', 'vision', 'decisions'],
        pros: ['Daha doğru pas seçimi', 'Baskı altında top kaybı azalır'],
        cons: ['Şut cesareti azalabilir'],
        target: ['OS', 'OOS', 'SLB', 'SGB']
    },
    {
        id: IndividualTrainingType.DRIBBLING,
        label: 'Dripling & Adam Eksiltme',
        category: 'TEKNİK',
        stats: ['dribbling', 'balance', 'acceleration'],
        pros: ['Bire birde daha fazla deneme', 'Kanatta fark yaratma'],
        cons: ['Top kaybı riski', 'Karar alma düşükse saçma çalımlar'],
        target: ['SLK', 'SGK', 'OOS', 'SNT']
    },
    {
        id: IndividualTrainingType.MENTAL_DECISION,
        label: 'Karar Alma & Soğukkanlılık',
        category: 'ZİHİNSEL',
        stats: ['decisions', 'composure', 'concentration'],
        pros: ['Yüksek tempoda hata azalır', 'Son dakikalarda panik olmaz'],
        cons: ['Fiziksel gelişim durur'],
        target: ['ALL']
    },
    {
        id: IndividualTrainingType.MENTAL_LEADERSHIP,
        label: 'Liderlik & Mental Dayanıklılık',
        category: 'ZİHİNSEL',
        stats: ['leadership', 'determination', 'teamwork'],
        pros: ['Takım savunması düzenli olur', 'Geriye düşülen maçta çözülme azalır'],
        cons: ['Bireysel hücum katkısı düşebilir'],
        target: ['STP', 'OS', 'GK']
    },
    {
        id: IndividualTrainingType.PHYSICAL_STAMINA,
        label: 'Dayanıklılık',
        category: 'FİZİKSEL',
        stats: ['stamina', 'naturalFitness'],
        pros: ['70+ dk performans düşüşü azalır', 'Pres sürekliliği artar'],
        cons: ['Maç içi patlayıcılık azalabilir'],
        target: ['ALL']
    },
    {
        id: IndividualTrainingType.PHYSICAL_SPEED,
        label: 'Hız & Patlayıcılık',
        category: 'FİZİKSEL',
        stats: ['pace', 'acceleration'],
        pros: ['Açık alan koşuları', 'Kontra etkinliği'],
        cons: ['Sakatlık riski artar'],
        target: ['SLK', 'SGK', 'SLB', 'SGB', 'SNT']
    },
    {
        id: IndividualTrainingType.PHYSICAL_STRENGTH,
        label: 'Güç & İkili Mücadele',
        category: 'FİZİKSEL',
        stats: ['physical', 'balance', 'aggression'],
        pros: ['Omuz omuza üstünlük', 'Hava topları'],
        cons: ['Çeviklik düşebilir'],
        target: ['STP', 'OS', 'SNT']
    },
    {
        id: IndividualTrainingType.GK_REFLEX,
        label: 'Refleks (Kaleci)',
        category: 'KALECİ',
        stats: ['agility', 'concentration'], // Reflexes map to agility/concentration in our model
        pros: ['Çizgi kaleciliği gelişir', 'Bire birlerde başarı'],
        cons: ['Yan toplar zayıf kalabilir'],
        target: ['GK']
    },
    {
        id: IndividualTrainingType.GK_DISTRIBUTION,
        label: 'Oyun Kurulum (Kaleci)',
        category: 'KALECİ',
        stats: ['passing', 'vision'],
        pros: ['Geriden oyun kurma', 'Kontra atak başlatma'],
        cons: ['Kurtarış odağı düşebilir'],
        target: ['GK']
    },
    {
        id: IndividualTrainingType.GK_POSITIONING,
        label: 'Pozisyon Alma (Kaleci)',
        category: 'KALECİ',
        stats: ['positioning', 'anticipation'],
        pros: ['Doğru yer tutma', 'Hatalı çıkış azalır'],
        cons: ['Refleks gelişimi yavaşlar'],
        target: ['GK']
    }
];
