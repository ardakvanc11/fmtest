
import { Team, Player, Position, TacticStyle, PlayerStats, AttackStyle, PressingStyle, Mentality, PassingStyle, Tempo, Width, CreativeFreedom, FinalThird, Crossing, DefensiveLine, Tackling, PressingFocus, TimeWasting } from './types';

// Random Turkish First Names
const FIRST_NAMES = [
    'Ahmet','Mehmet','Mustafa','Can','Burak','Emre','Arda','Semih','Cenk','Hakan','Oğuzhan','Volkan','Onur','Gökhan','Selçuk','Mert','Altay','Uğur','Kerem','Yunus','Barış','Ferdi','İrfan','Ozan','Salih','Taylan','Berkan','Halil','Kenan','Umut','Enes','Çağlar','Yiğit','Efe','Berat','Emir','Kaan','Doruk','Çınar','Rüzgar',
    'Tolga','Serdar','Nazım','Metin','Harun','Batuhan','Kubilay','Furkan','Ömer','Tugay','Zafer','Serhat','Nevzat','Cihan','Serkan','Alper','Yasin','Mevlüt','Cem','Erdem','Ertuğrul','İsmail','Melih','Recep','Utku','Samet','Sezer','Burhan','Adem','Fatih','Sedat','Orhan','Raşit','Bekir','Kazım','Levent','Erman','Çağan','Talha',
    'Sarp','Eralp','Giray','Taner','Oktay','Berk','Koral','Altan','Demir','Seçkin','Sinan','Tarık','Koray','Fırat','Tamer','Oğuz','Ender','Tuncay','Bora','Kadir','Süleyman','Mahmut','Serkan','Kutay','Deniz','Atakan','Taha','Emin','Hasan','Eren','Ulaş','Rıdvan','Tufan','Arif','Suat','Erkut','Batıkan','Buğra','Bünyamin',
    'Ege','Yiğitalp','Baran','Ata','Kutlu','Ensar','Batı','Gökalp','Yahya','Talat','Hilmi','Ekrem','Mazlum','Timur','Yavuz','Tuğrul','Ekin','Dorukan','Cavit','Mirza','Mehdi','Özgür','Musa','Aziz','Nihat','Sedat','Tamer','Rasim','Saffet','Yekta','Bünyamin','Serkan','Veysel','Mücahit','Anıl','Hüseyin','İlker','Tunahan',
    'Enver','İlhan','Sefer','Mutlu','Nazif','Ertan','Burçin','Ataberk','Kayra','Nesim','Kutberk','Aras','Talay','Baturalp','Miran','Eymen','Göktuğ','Atlas','Yalın','Koralp','Ender','Yekta','Altın','Orçun','Selami','Rasih','Semican','Fikret','Çetin','Sezai','Murat','Doğukan','Yusuf','Mahsun','Toygar','İlter','Himmet','Özkan',
    'Oktay','Alican','Okan','Şükrü','Bahadır','Kıvanç','Berke','Hamza','Tuana','Erçin','Korcan','Tolunay','Hakan','Ömür','Ataç','Tümer','Atabey','Çağdaş','Doğaç','Arın','Çelebi','Serkan','Oğuzcan','Alkan','Arifcan','Erenalp','Egehan','Tekin','Fethi','Şahap','Ferzan','Kuzey','Mirkan','Emirhan','Umutcan'
];

// Random Turkish Last Names
const LAST_NAMES = [
    'Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Öztürk','Aydın','Özdemir','Arslan','Doğan','Kılıç','Aslan','Çetin','Kara','Koç','Kurt','Özkan','Şimşek','Polat','Yalçın','Erdoğan','Bulut','Keskin','Güler','Yavuz','Uçar','Korkmaz','Sönmez','Yüksel','Aktaş','Erol','Avcı','Ersoy','Taş','Bozkurt','İnce','Özbay','Köse',
    'Ergün','Tuna','Erden','Güner','Başaran','Balcı','Tema','Toprak','Karadaş','Karaca','Çoban','Zengin','Ekşi','Göksu','Ulusoy','Sezer','Ayaz','Mercan','Kalaycı','Korkut','Sağlam','Kaplan','Ateş','Boz','Akar','Meriç','İlhan','Çakır','Çömez','Ertaş','Çevik','Tetik','Bican','Demirtaş','Eken','Baysal','Aksoy','Ekinci','Ermiş',
    'Tüfekçi','Boyar','Demiralp','Karaman','Mutlu','Çakmak','Tunç','Durmaz','Kocabaş','Aksu','Zorlu','Acar','Erciyes','Uzun','Yiğit','Özer','Demiroğlu','Arıkan','İpek','Turan','Yardımcı','Kılıçoğlu','Alkan','Türkmen','Güçlü','Karagöz','Günay','Batur','Demirel','Gencay','Arı','Tetik','Gündoğan','Duman','Ayan','Şahiner','Yalman',
    'Canpolat','Alperen','Koyuncu','Turna','Bayındır','Aliş','Ertem','Tetikçi','Karabıyık','Tokgöz','Göçer','Sarar','Kalkan','Dişli','Erkoç','Cebeci','Sandıkçı','Güney','Orhanlı','Yankı','Erten','Ersever','Sarıoğlu','Temizel','Karayılan','Özsarı','Gülmez','Kuşçu','Bozkuş','Yurttaş','Erbaş','Göksal','Emrecan','Karadoğan','Altun',
    'İlter','Kavruk','Dedeoğlu','Baysu','Kuşçu','Kahriman','Bayraktar','Göçmen','Dikmen','Kalkan','Sayın','Yurtsever','Ateşoğlu','Şenyurt','Demirkol','Hasanoğlu','Sarıgül','Tataroğlu','Uzuner','Bilgiç','Cevahir','Karaduman','Arısoy','Ekmekçi','Koparan','Gökmen','Karakuş','Erşan','Güntekin','Yardımcıoğlu','Zeybek','Erbaş','Yolcu',
    'Akpınar','Ekmekçioğlu','Kaynakoğlu','Gürbuğa','Kınacı','Aydoğdu','Baytekin','Kurtuluş','Altınsoy','Erkoç','Tırak','Geçin','Kuzucu','Yenilmez','Artun','Göksun','Dalkıran','Savran','Başer','Özdilek','Yurtoğlu','Erginer','Karabulut','Torun','Gülperi','Aykan','Denktaş','Topçu','Kaygusuz','Büyükoğlu','Özçelik','Korsan'
];

// Some foreign stars for spice
const FOREIGN_STARS = [
    { name: 'David Souza', nation: 'Brezilya' },
    { name: 'Ronaldo Teixeira', nation: 'Brezilya' },
    { name: 'Marco Velasquez', nation: 'İspanya' },
    { name: 'Diego Santoro', nation: 'Arjantin' },
    { name: 'Luis Calderon', nation: 'Şili' },
    { name: 'Enzo Alvarado', nation: 'Arjantin' },
    { name: 'Ricardo Montero', nation: 'Meksika' },
    { name: 'Carlos Esteban', nation: 'Kolombiya' },
    { name: 'Thiago Morello', nation: 'Brezilya' },
    { name: 'Henrique Batista', nation: 'Brezilya' },
    { name: 'Mateo Fiorenzi', nation: 'İtalya' },
    { name: 'Carmine Vescovi', nation: 'İtalya' },
    { name: 'Gianni Lombardi', nation: 'İtalya' },
    { name: 'Luca Beraldi', nation: 'İtalya' },
    { name: 'Rafael Correira', nation: 'Portekiz' },
    { name: 'Miguel Faria', nation: 'Portekiz' },
    { name: 'João Reis', nation: 'Portekiz' },
    { name: 'Emmanuel Oshoba', nation: 'Nijerya' },
    { name: 'Tunde Okafor', nation: 'Nijerya' },
    { name: 'Kofi Mensah', nation: 'Gana' },
    { name: 'Abdoulaye Ndiaye', nation: 'Senegal' },
    { name: 'Samba Diarra', nation: 'Mali' },
    { name: 'Mamadou Keita', nation: 'Fas' },
    { name: 'Yassine Haddad', nation: 'Fas' },
    { name: 'Karim Belhadi', nation: 'Cezayir' },
    { name: 'Adnan Zekiri', nation: 'Makedonya' },
    { name: 'Miran Kovacevic', nation: 'Sırbistan' },
    { name: 'Dario Vukovic', nation: 'Hırvatistan' },
    { name: 'Luka Petrovic', nation: 'Sırbistan' },
    { name: 'Stjepan Kovac', nation: 'Bosna' },
    { name: 'Dragomir Stefanov', nation: 'Bulgaristan' },
    { name: 'Viktor Hlebov', nation: 'Ukrayna' },
    { name: 'Sergei Volkov', nation: 'Rusya' },
    { name: 'Nikolai Shorin', nation: 'Rusya' },
    { name: 'Tomasz Wrobel', nation: 'Polonya' },
    { name: 'Jakub Rybak', nation: 'Polonya' },
    { name: 'Mateusz Kowal', nation: 'Polonya' },
    { name: 'Jean-Luc Moreau', nation: 'Fransa' },
    { name: 'Antoine Carille', nation: 'Fransa' },
    { name: 'Mathis Delacroix', nation: 'Fransa' },
    { name: 'Hugo Lambert', nation: 'Fransa' },
    { name: 'Maximilian Ritter', nation: 'Almanya' },
    { name: 'Erik Schreiber', nation: 'Almanya' },
    { name: 'Leonhard Kruger', nation: 'Almanya' },
    { name: 'Johann Bauer', nation: 'Almanya' },
    { name: 'Elias Holmberg', nation: 'İsveç' },
    { name: 'Jonas Dahlström', nation: 'İsveç' },
    { name: 'Mikkel Andersen', nation: 'Danimarka' },
    { name: 'Soren Kristensen', nation: 'Danimarka' },
    { name: 'Aapo Niemi', nation: 'Finlandiya' },
    { name: 'Marko Viitala', nation: 'Finlandiya' },
    { name: 'Angelo Silva', nation: 'Angola' },
    { name: 'Nelson Campos', nation: 'Bolivya' },
    { name: 'Pablo Cisneros', nation: 'Ekvador' },
    { name: 'Javier Montenegro', nation: 'Venezuela' },
    { name: 'Alexi Duarte', nation: 'Paraguay' },
    { name: 'Rocco Mancini', nation: 'İtalya' },
    { name: 'Elio Baresi', nation: 'İtalya' },
    { name: 'Nando Carvalho', nation: 'Brezilya' },
    { name: 'Eduardo Sanabria', nation: 'Kostarika' },
    { name: 'Gabriel Quintana', nation: 'Peru' },
    { name: 'Joaquin Banderas', nation: 'Arjantin' },
    { name: 'Esteban Corral', nation: 'Şili' },
    { name: 'Alejandro Barrios', nation: 'Uruguay' },
    { name: 'Dimitri Papadakis', nation: 'Yunanistan' },
    { name: 'Stavros Metaxas', nation: 'Yunanistan' },
    { name: 'Henri Dubois', nation: 'Fransa' },
    { name: 'Jean Remond', nation: 'Fransa' },
    { name: 'Bruno Vásquez', nation: 'Bolivya' },
    { name: 'Martin Solano', nation: 'Meksika' },
    { name: 'Ignacio Herrera', nation: 'Küba' },
    { name: 'Victor Palencia', nation: 'Kolombiya' },
    { name: 'Samuel Koffi', nation: 'Fildişi Sahili' },
    { name: 'Abdul Naby', nation: 'Gine' },
    { name: 'James Holloway', nation: 'İngiltere' },
    { name: 'Connor McBride', nation: 'İskoçya' },
    { name: 'Liam O’Rourke', nation: 'İrlanda' },
    { name: 'Oliver Whitestone', nation: 'İngiltere' },
    { name: 'Declan Harford', nation: 'İrlanda' },
    { name: 'Ethan Blake', nation: 'Kanada' },
    { name: 'Kai Harrington', nation: 'ABD' },
    { name: 'Logan Fairchild', nation: 'ABD' },
    { name: 'Tyrese Coleman', nation: 'ABD' },
    { name: 'Ricardo Leone', nation: 'Venezuela' }
];

export const INJURY_TYPES = [
    { type: 'Arka Adale', minWeeks: 2, maxWeeks: 4, desc: 'Koşu sırasında zorlanma.' },
    { type: 'Ayak Bileği Burkulması', minWeeks: 3, maxWeeks: 5, desc: 'İkili mücadele sonrası.' },
    { type: 'Diz Bağları', minWeeks: 6, maxWeeks: 10, desc: 'Ciddi bir sakatlık.' },
    { type: 'Kasık Ağrısı', minWeeks: 1, maxWeeks: 2, desc: 'Aşırı yüklenme sonucu.' },
    { type: 'Kaval Kemiği Darbesi', minWeeks: 2, maxWeeks: 3, desc: 'Sert darbe sonucu ödem.' },
    { type: 'Arka Çapraz Bağ Zedelenmesi', minWeeks: 5, maxWeeks: 8, desc: 'Diz stabilitesini etkileyen darbe sonrası.' },
    { type: 'Hamstring Yırtığı', minWeeks: 4, maxWeeks: 7, desc: 'Sprint sırasında aşırı gerilme.' },
    { type: 'Quadriceps Zorlanması', minWeeks: 2, maxWeeks: 4, desc: 'Şut anında kas zorlanması.' },
    { type: 'Menisküs Problemi', minWeeks: 5, maxWeeks: 9, desc: 'Dizde dönme hareketi sonrası.' },
    { type: 'Bilek Bağları Kopması', minWeeks: 6, maxWeeks: 12, desc: 'Ağır darbe veya ters basma sonucu.' },
    { type: 'Kaburga Çatlağı', minWeeks: 3, maxWeeks: 5, desc: 'Hava mücadelelerinde alınan darbe.' },
    { type: 'Omuz Çıkması', minWeeks: 4, maxWeeks: 8, desc: 'Düşme sonucu omuzun yerinden çıkması.' },
    { type: 'Burun Kırılması', minWeeks: 2, maxWeeks: 3, desc: 'Hava topu mücadelesinde çarpışma.' },
    { type: 'Çekme (Strain)', minWeeks: 1, maxWeeks: 2, desc: 'Anlık kas kasılması sonucu.' },
    { type: 'Turf Toe', minWeeks: 2, maxWeeks: 3, desc: 'Ayak başparmağının zemine takılmasıyla yaşanan zorlanma.' },
    { type: 'Alt Baldır Zorlanması', minWeeks: 1, maxWeeks: 3, desc: 'Koşu sırasında aşırı çekme.' },
    { type: 'Aşil Tendonu Zorlanması', minWeeks: 4, maxWeeks: 6, desc: 'Aşil bölgesine aşırı yük binmesi sonucu.' },
    { type: 'Aşil Tendonu Kopması', minWeeks: 20, maxWeeks: 30, desc: 'Kariyeri etkileyebilecek ciddi bir sakatlık.' },
    { type: 'Bel Fıtığı Ağrısı', minWeeks: 3, maxWeeks: 6, desc: 'Ani hareket sonucu sinir sıkışması.' },
    { type: 'Boyun Zedelenmesi', minWeeks: 1, maxWeeks: 2, desc: 'Kafa topu mücadelesinde çarpışma.' },
    { type: 'Arka Kaburga Kas Yırtığı', minWeeks: 3, maxWeeks: 5, desc: 'Şut veya dönüş hareketinde yaşanan zorlanma.' },
    { type: 'Kas spazmı', minWeeks: 1, maxWeeks: 1, desc: 'Kasın anlık olarak kilitlenmesi.' },
    { type: 'Mide Zehirlenmesi', minWeeks: 1, maxWeeks: 1, desc: 'Hafif gıda zehirlenmesi sonucu sahadan uzak kalır.' },
    { type: 'Virüs Enfeksiyonu', minWeeks: 1, maxWeeks: 2, desc: 'Hastalık nedeniyle kondisyon kaybı.' },
    { type: 'Ayak Parmağı Morarması', minWeeks: 1, maxWeeks: 2, desc: 'Rakip oyuncunun krampon darbesi sonrası.' }
];

// User Defined Teams with provided Imgur Logos and Stadium Capacities
export const TEAM_TEMPLATES = [
    { 
        name: 'Ayıboğanspor SK', 
        logo: 'https://i.imgur.com/eV74XlV.png', 
        colors: ['bg-purple-600', 'text-white'], 
        stars: 3, 
        stadium: 'Mağara Arena',
        capacity: 45000, 
        fans: 12000000, 
        budget: 15, 
        targetStrength: 84 
    },
    { 
        name: 'Kedispor', 
        logo: 'https://i.imgur.com/VSUm10b.png',
        colors: ['bg-red-600', 'text-white'], 
        stars: 2, 
        stadium: 'Yumak Stadyumu', 
        capacity: 43000,
        fans: 8000000, 
        budget: 20, 
        targetStrength: 82 
    },
    { 
        name: 'Eşşekboğanspor FK', 
        logo: 'https://i.imgur.com/T1RiW8H.png',
        colors: ['bg-blue-600', 'text-yellow-400'], 
        stars: 5, 
        stadium: 'Anadolu Arena',
        capacity: 65000,
        fans: 15000000, 
        budget: 12, 
        targetStrength: 81 
    },
    { 
        name: 'Maymunspor', 
        logo: 'https://i.imgur.com/kvhASjK.png',
        colors: ['bg-purple-800', 'text-white'], 
        stars: 1, 
        stadium: 'Muz Park',
        capacity: 21000,
        fans: 3000000, 
        budget: 9, 
        targetStrength: 78 
    },
    { 
        name: 'Arıspor', 
        logo: 'https://i.imgur.com/7vkiuxd.png',
        colors: ['bg-yellow-500', 'text-white'], 
        stars: 1, 
        stadium: 'Kovan Stadyumu',
        capacity: 27000,
        fans: 1500000, 
        budget: 22, 
        targetStrength: 84 
    },
    { 
        name: 'Köpekspor', 
        logo: 'https://i.imgur.com/OoPWVvx.png',
        colors: ['bg-blue-500', 'text-white'], 
        stars: 1, 
        stadium: 'Kemik Arena',
        capacity: 41000,
        fans: 6500000, 
        budget: 13, 
        targetStrength: 80 
    },
    { 
        name: 'Bulgariaspor', 
        logo: 'https://i.imgur.com/RuCGNuc.png',
        colors: ['bg-green-600', 'text-black'], 
        stars: 0, 
        stadium: 'Tuna Park',
        capacity: 16500,
        fans: 500000, 
        budget: 5, 
        targetStrength: 75 
    },
    { 
        name: 'Bedirspor', 
        logo: 'https://i.imgur.com/pPchTUI.png',
        colors: ['bg-purple-900', 'text-white'], 
        stars: 0, 
        stadium: 'Bedir Stadı',
        capacity: 25000,
        fans: 850000, 
        budget: 6, 
        targetStrength: 73 
    },
    { 
        name: 'Yakhubspor', 
        logo: 'https://i.imgur.com/vcN5VhI.png',
        colors: ['bg-orange-500', 'text-black'], 
        stars: 0, 
        stadium: 'Çöl Fırtınası',
        capacity: 19500,
        fans: 750000, 
        budget: 6, 
        targetStrength: 72 
    },
    { 
        name: 'Tekirspor', 
        logo: 'https://i.imgur.com/JhXtd58.png',
        colors: ['bg-orange-400', 'text-white'], 
        stars: 0, 
        stadium: 'Liman Arena',
        capacity: 18000,
        fans: 1200000, 
        budget: 7, 
        targetStrength: 74 
    },
    { 
        name: 'Uzunoğullarıspor', 
        logo: 'https://i.imgur.com/S4TVTee.png',
        colors: ['bg-black', 'text-white'], 
        stars: 0, 
        stadium: 'Kule Stadı',
        capacity: 9500,
        fans: 200000, 
        budget: 4, 
        targetStrength: 71 
    },
    { 
        name: 'Hamsispor', 
        logo: 'https://i.imgur.com/LqtejWJ.png',
        colors: ['bg-red-900', 'text-blue-400'], 
        stars: 0, 
        stadium: 'Deniz Kenarı',
        capacity: 22000,
        fans: 2000000, 
        budget: 5, 
        targetStrength: 70 
    },
    { 
        name: 'Osurukspor', 
        logo: 'https://i.imgur.com/Iz505sK.png',
        colors: ['bg-green-500', 'text-white'], 
        stars: 0, 
        stadium: 'Rüzgar Vadisi',
        capacity: 14500,
        fans: 300000, 
        budget: 3, 
        targetStrength: 67 
    },
    { 
        name: 'Yeni Bozkurtspor', 
        logo: 'https://i.imgur.com/n17A3Cw.png',
        colors: ['bg-amber-800', 'text-black'], 
        stars: 0, 
        stadium: 'Ova Arena',
        capacity: 34500,
        fans: 2100000, 
        budget: 7, 
        targetStrength: 76 
    },
    { 
        name: 'Civciv FK', 
        logo: 'https://i.imgur.com/eUpKqYk.png',
        colors: ['bg-yellow-400', 'text-blue-900'], 
        stars: 0, 
        stadium: 'Kümes Park',
        capacity: 11700,
        fans: 400000, 
        budget: 2, 
        targetStrength: 68 
    },
    { 
        name: 'Aston Karakoçan', 
        logo: 'https://i.imgur.com/sw63G9H.png',
        colors: ['bg-indigo-900', 'text-blue-400'], 
        stars: 0, 
        stadium: 'Şehir Stadı',
        capacity: 29000,
        fans: 1600000, 
        budget: 8, 
        targetStrength: 75 
    },
    { 
        name: 'Küheylanspor', 
        logo: 'https://i.imgur.com/WG9bJgB.png',
        colors: ['bg-red-600', 'text-white'], 
        stars: 0, 
        stadium: 'Hipodrom Arena',
        capacity: 30300,
        fans: 450000, 
        budget: 4, 
        targetStrength: 72 
    },
    { 
        name: 'İslamspor', 
        logo: 'https://i.imgur.com/JROZfTX.png',
        colors: ['bg-green-500', 'text-green-900'], 
        stars: 0, 
        stadium: 'Barış Parkı',
        capacity: 33100,
        fans: 1950000, 
        budget: 8, 
        targetStrength: 74 
    }
];

export const generateId = () => Math.random().toString(36).substr(2, 9);

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate stats based on position and overall skill
const generateStats = (position: Position, skill: number): PlayerStats => {
    const base = skill;
    const getStat = (multiplier: number, variance = 8) => {
        let val = Math.floor(base * multiplier) + getRandomInt(-variance, variance);
        return Math.min(99, Math.max(20, val));
    };

    let stats: PlayerStats;

    switch (position) {
        case Position.FWD:
            stats = {
                pace: getStat(1.0),
                shooting: getStat(1.1), 
                passing: getStat(0.8),
                dribbling: getStat(0.95),
                defending: getStat(0.3, 5), 
                physical: getStat(0.85),
                finishing: getStat(1.15, 5), 
                heading: getStat(0.9),
                corners: getStat(0.6),
                stamina: getStat(0.9)
            };
            break;
        case Position.MID:
            stats = {
                pace: getStat(0.85),
                shooting: getStat(0.8),
                passing: getStat(1.1), 
                dribbling: getStat(0.9),
                defending: getStat(0.7),
                physical: getStat(0.8),
                finishing: getStat(0.7),
                heading: getStat(0.6),
                corners: getStat(1.1, 5), 
                stamina: getStat(1.0)
            };
            break;
        case Position.DEF:
            stats = {
                pace: getStat(0.75),
                shooting: getStat(0.4),
                passing: getStat(0.7),
                dribbling: getStat(0.6),
                defending: getStat(1.15), 
                physical: getStat(1.1),
                finishing: getStat(0.3),
                heading: getStat(1.1), 
                corners: getStat(0.4),
                stamina: getStat(0.95)
            };
            break;
        case Position.GK:
            stats = {
                pace: getStat(0.5),
                shooting: getStat(0.2),
                passing: getStat(0.7),
                dribbling: getStat(0.3),
                defending: getStat(0.9), 
                physical: getStat(0.9),
                finishing: getStat(0.1),
                heading: getStat(0.5),
                corners: getStat(0.2),
                stamina: getStat(0.8)
            };
            break;
        default:
            stats = {
                pace: getStat(1), shooting: getStat(1), passing: getStat(1),
                dribbling: getStat(1), defending: getStat(1), physical: getStat(1),
                finishing: getStat(1), heading: getStat(1), corners: getStat(1),
                stamina: getStat(1)
            };
    }
    return stats;
};

// Modified to accept exact target skill instead of abstract tier
export const generatePlayer = (position: Position, targetSkill: number, teamId: string): Player => {
    let name = `${FIRST_NAMES[getRandomInt(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[getRandomInt(0, LAST_NAMES.length - 1)]}`;
    let nation = 'Türkiye';
    
    // 5% chance for a foreign star if skill is high (>80)
    if (targetSkill > 80 && Math.random() > 0.95 && FOREIGN_STARS.length > 0) {
        const star = FOREIGN_STARS[getRandomInt(0, FOREIGN_STARS.length - 1)];
        name = star.name;
        nation = star.nation;
    }

    const age = getRandomInt(17, 36);
    // Create variance around the target skill
    const skill = Math.min(99, Math.max(40, targetSkill + getRandomInt(-4, 4)));
    
    let value = (skill * skill * (40 - age)) / 10000;
    value = Math.round(value * 10) / 10; 

    const stats = generateStats(position, skill);

    return {
        id: generateId(),
        name,
        position,
        skill,
        stats,
        seasonStats: { goals: 0, assists: 0, ratings: [], averageRating: 0, matchesPlayed: 0 }, // NEW
        age,
        value: Math.max(0.1, value),
        nationality: nation,
        teamId,
        morale: getRandomInt(70, 100)
    };
};

export const initializeTeams = (): Team[] => {
    return TEAM_TEMPLATES.map((tmpl) => {
        const teamId = generateId();
        
        // Generate players centered around the target strength
        const players: Player[] = [];
        for(let i=0; i<2; i++) players.push(generatePlayer(Position.GK, tmpl.targetStrength, teamId));
        for(let i=0; i<6; i++) players.push(generatePlayer(Position.DEF, tmpl.targetStrength, teamId));
        for(let i=0; i<6; i++) players.push(generatePlayer(Position.MID, tmpl.targetStrength, teamId));
        for(let i=0; i<4; i++) players.push(generatePlayer(Position.FWD, tmpl.targetStrength, teamId));

        return {
            id: teamId,
            name: tmpl.name,
            colors: tmpl.colors as [string, string],
            logo: tmpl.logo,
            stars: tmpl.stars,
            fanBase: tmpl.fans,
            stadiumName: tmpl.stadium,
            stadiumCapacity: tmpl.capacity, // Initialize capacity
            budget: tmpl.budget,
            players,
            // DEFAULT TACTICS
            formation: '4-4-2',
            mentality: Mentality.BALANCED,
            passing: PassingStyle.MIXED,
            tempo: Tempo.NORMAL,
            width: Width.NORMAL,
            creative: CreativeFreedom.BALANCED,
            finalThird: FinalThird.MIXED,
            crossing: Crossing.MIXED,
            defLine: DefensiveLine.STANDARD,
            tackling: Tackling.NORMAL,
            pressFocus: PressingFocus.MIXED,
            timeWasting: TimeWasting.SOMETIMES,
            
            // Legacy mapping
            tactic: TacticStyle.BALANCED,
            attackStyle: AttackStyle.MIXED,
            pressingStyle: PressingStyle.BALANCED,

            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
            strength: tmpl.targetStrength, 
            morale: 70 
        };
    });
};