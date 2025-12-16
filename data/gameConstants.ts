

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const INJURY_TYPES = [
    { type: 'Çekme (Strain)', minWeeks: 1, maxWeeks: 2, desc: 'Anlık kas kasılması sonucu.', probability: 12 },
    { type: 'Kasık Ağrısı', minWeeks: 1, maxWeeks: 2, desc: 'Aşırı yüklenme sonucu.', probability: 8 },
    { type: 'Ayak Bileği Burkulması', minWeeks: 3, maxWeeks: 5, desc: 'İkili mücadele sonrası.', probability: 8 },
    { type: 'Arka Adale', minWeeks: 2, maxWeeks: 4, desc: 'Koşu sırasında zorlanma.', probability: 7 },
    { type: 'Kas Spazmı', minWeeks: 1, maxWeeks: 1, desc: 'Kasın anlık olarak kilitlenmesi.', probability: 6 },
    { type: 'Virüs Enfeksiyonu', minWeeks: 1, maxWeeks: 2, desc: 'Hastalık nedeniyle kondisyon kaybı.', probability: 5 },
    { type: 'Alt Baldır Zorlanması', minWeeks: 1, maxWeeks: 3, desc: 'Koşu sırasında aşırı çekme.', probability: 5 },
    { type: 'Kaval Kemiği Darbesi', minWeeks: 2, maxWeeks: 3, desc: 'Sert darbe sonucu ödem.', probability: 5 },
    { type: 'Quadriceps Zorlanması', minWeeks: 2, maxWeeks: 4, desc: 'Şut anında kas zorlanması.', probability: 5 },
    { type: 'Bel Fıtığı Ağrısı', minWeeks: 3, maxWeeks: 6, desc: 'Ani hareket sonucu sinir sıkışması.', probability: 5 },
    { type: 'Mide Zehirlenmesi', minWeeks: 1, maxWeeks: 1, desc: 'Hafif gıda zehirlenmesi.', probability: 4 },
    { type: 'Ayak Parmağı Morarması', minWeeks: 1, maxWeeks: 2, desc: 'Rakip oyuncunun krampon darbesi.', probability: 4 },
    { type: 'Kaburga Çatlağı', minWeeks: 3, maxWeeks: 5, desc: 'Hava mücadelelerinde alınan darbe.', probability: 4 },
    { type: 'Omuz Çıkması', minWeeks: 4, maxWeeks: 8, desc: 'Düşme sonucu omuzun yerinden çıkması.', probability: 4 },
    { type: 'Hamstring Yırtığı', minWeeks: 4, maxWeeks: 7, desc: 'Sprint sırasında aşırı gerilme.', probability: 4 },
    { type: 'Boyun Zedelenmesi', minWeeks: 1, maxWeeks: 2, desc: 'Kafa topu mücadelesinde çarpışma.', probability: 3 },
    { type: 'Burun Kırılması', minWeeks: 2, maxWeeks: 3, desc: 'Hava topu mücadelesinde çarpışma.', probability: 3 },
    { type: 'Menisküs Problemi', minWeeks: 5, maxWeeks: 9, desc: 'Dizde dönme hareketi sonrası.', probability: 3 },
    { type: 'Arka Çapraz Bağ (PCL)', minWeeks: 5, maxWeeks: 8, desc: 'Diz stabilitesini etkileyen darbe.', probability: 2 },
    { type: 'Bilek Bağları Kopması', minWeeks: 6, maxWeeks: 12, desc: 'Ağır darbe veya ters basma.', probability: 2 },
    { type: 'Aşil Tendonu Zorlanması', minWeeks: 4, maxWeeks: 6, desc: 'Aşil bölgesine aşırı yük binmesi.', probability: 2 },
    { type: 'Aşil Tendonu Kopması', minWeeks: 20, maxWeeks: 30, desc: 'Kariyeri etkileyebilecek ciddi sakatlık.', probability: 1 }
];

export const GAME_CALENDAR = {
    START_DATE: new Date(2025, 6, 1), // 1 July 2025 (Preparation)
    LEAGUE_START_DATE: new Date(2025, 7, 8), // 8 Aug 2025 (Official Start)
    SUMMER_TRANSFER_DEADLINE: new Date(2025, 8, 1), // 1 Sept 2025
    WINTER_TRANSFER_OPEN: new Date(2026, 0, 1), // 1 Jan 2026
    WINTER_TRANSFER_CLOSE: new Date(2026, 1, 1), // 1 Feb 2026
    LEAGUE_END_DATE: new Date(2026, 5, 2), // 2 June 2026
    NEW_SEASON_START: new Date(2026, 6, 1) // 1 July 2026
};