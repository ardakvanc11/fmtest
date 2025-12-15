

import { Team, Player, Position, TacticStyle, PlayerStats, AttackStyle, PressingStyle, Mentality, PassingStyle, Tempo, Width, CreativeFreedom, FinalThird, Crossing, DefensiveLine, Tackling, PressingFocus, TimeWasting, PlayerFaceData } from './types';

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

// FACE ASSETS (IMGUR LINKS)
export const FACE_ASSETS = {
    skin: [
        'https://imgur.com/sAlSd9N.png', // skin_1 (Original) - Light
        'https://imgur.com/QjsOqAT.png', // skin_2 - Medium/Latino
        'https://imgur.com/4CCIFgM.png'  // skin_3 - Dark
    ],
    brows: [
        'https://imgur.com/6yuuhSe.png', // 1
        'https://imgur.com/p9YkaCn.png', // 2
        'https://imgur.com/MeoE2eX.png', // 4
        'https://imgur.com/EV7ZMKf.png'  // 5
    ],
    eyes: [
        'https://imgur.com/Mxzu3wO.png', // 1
        'https://imgur.com/9WzIval.png', // 2
        'https://imgur.com/vK8QodM.png', // 4
        'https://imgur.com/DSHZ0bK.png', // 5
        'https://imgur.com/DHC7Vdb.png', // 6
        'https://imgur.com/4RkbaDc.png'  // 7
    ],
    hair: [
        // Old Hairs (1-5) - Assuming these are generally applicable or primarily for Skin 1
        'https://imgur.com/SyZICK0.png', // 1
        'https://imgur.com/uKM3x9I.png', // 2
        'https://imgur.com/X4V8Oaw.png', // 3
        'https://imgur.com/rfu089x.png', // 4
        'https://imgur.com/OfBeRn0.png', // 5
        
        // New Hairs
        'https://imgur.com/lBKSLaJ.png', // 6 (skin 2,3)
        'https://imgur.com/fmrpncz.png', // 7 (skin 1)
        'https://imgur.com/6JdqPyE.png', // 8 (skin 1)
        'https://imgur.com/KG5yeif.png', // 9 (skin 1)
        'https://imgur.com/YMwAtRC.png', // 10 (skin 1,2)
        'https://imgur.com/u63XsEJ.png', // 11 (skin 1)
        'https://imgur.com/bFH26yj.png', // 12 (skin 1)
        'https://imgur.com/krdMdiA.png', // 13 (skin 1)
        'https://imgur.com/X3BmAGt.png', // 14 (skin 1)
        'https://imgur.com/J8jrGsi.png', // 15 (all)
        'https://imgur.com/oDHTeAK.png', // 16 (all)
        'https://imgur.com/8rcEtB5.png', // 17 (all)
        'https://imgur.com/JnxnaR6.png'  // 18 (all)
    ],
    beard: [
        'https://imgur.com/ykkE5bM.png', // beard_1 (index 0)
        'https://imgur.com/zwdfWmT.png', // beard_2 (index 1)
        'https://imgur.com/smplMOA.png'  // beard_3 (index 2)
    ],
    freckles: [
        'https://imgur.com/X28mAPS.png'
    ],
    tattoo: [
        'https://imgur.com/rnbP7XS.png', // tatoo_1 (skin 3 only)
        'https://imgur.com/QF77VkW.png'  // tatoo_2 (skin 1, 2 only)
    ],
    shirt: {
        outfield: 'https://imgur.com/O1J9xSW.png',
        gk: 'https://imgur.com/aLpywTB.png'
    }
};

const AFRICAN_NATIONS = [
    'Nijerya', 'Gana', 'Senegal', 'Mali', 'Fas', 'Cezayir', 'Angola', 'Fildişi Sahili', 'Gine'
];

const SOUTH_AMERICAN_NATIONS = [
    'Brezilya', 'Arjantin', 'Şili', 'Kolombiya', 'Bolivya', 'Ekvador', 'Venezuela', 'Paraguay', 'Uruguay', 'Peru', 'Meksika', 'Küba'
];

const EUROPEAN_NATIONS = [
    'İtalya', 'Fransa', 'İngiltere', 'Sırbistan', 'Hırvatistan', 'Makedonya', 'Finlandiya', 'Almanya', 'İsveç', 'Danimarka', 'Yunanistan', 'İspanya', 'Portekiz', 'Hollanda', 'Belçika', 'Rusya', 'Ukrayna', 'Polonya'
];

const NORTH_AMERICAN_NATIONS = [
    'ABD', 'Kanada'
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
    { name: 'Ricardo Leone', nation: 'Venezuela' },
    { name: 'Erling Nordvik', nation: 'Norveç' },
    { name: 'Jonas Høiland', nation: 'Norveç' },
    { name: 'Sander Kristoff', nation: 'Norveç' },
    { name: 'Lucas Mendieta', nation: 'Arjantin' },
    { name: 'Thiago Barrenechea', nation: 'Arjantin' },
    { name: 'Facundo Pereyra', nation: 'Arjantin' },
    { name: 'Vinicius Rocha', nation: 'Brezilya' },
    { name: 'Matheus Guimaraes', nation: 'Brezilya' },
    { name: 'Joao Victor Neves', nation: 'Brezilya' },
    { name: 'Rafael Pacheco', nation: 'Brezilya' },
    { name: 'Alvaro Montiel', nation: 'İspanya' },
    { name: 'Sergio Valcarce', nation: 'İspanya' },
    { name: 'Iker Santamaria', nation: 'İspanya' },
    { name: 'Federico Zanetti', nation: 'İtalya' },
    { name: 'Matteo Ricciardi', nation: 'İtalya' },
    { name: 'Alessio Gabbiani', nation: 'İtalya' },
    { name: 'Julien Mercier', nation: 'Fransa' },
    { name: 'Theo Marchand', nation: 'Fransa' },
    { name: 'Romain Lefevre', nation: 'Fransa' },
    { name: 'Leon Hoffmann', nation: 'Almanya' },
    { name: 'Tobias Kern', nation: 'Almanya' },
    { name: 'Niklas Weigel', nation: 'Almanya' },
    { name: 'Milan Dragovic', nation: 'Sırbistan' },
    { name: 'Nikola Jovanek', nation: 'Sırbistan' },
    { name: 'Ivan Radosevic', nation: 'Hırvatistan' },
    { name: 'Ante Brkic', nation: 'Hırvatistan' },
    { name: 'Pawel Zielak', nation: 'Polonya' },
    { name: 'Krzysztof Mazur', nation: 'Polonya' },
    { name: 'Andriy Kovalenko', nation: 'Ukrayna' },
    { name: 'Mykhailo Hrytsenko', nation: 'Ukrayna' },
    { name: 'Sergey Malenkov', nation: 'Rusya' },
    { name: 'Dmitri Antonov', nation: 'Rusya' },
    { name: 'Marek Novak', nation: 'Çekya' },
    { name: 'Tomas Havel', nation: 'Çekya' },
    { name: 'Bence Horvath', nation: 'Macaristan' },
    { name: 'Adam Szabo', nation: 'Macaristan' },
    { name: 'Kasper Lundqvist', nation: 'İsveç' },
    { name: 'Oskar Nyström', nation: 'İsveç' },
    { name: 'Mads Olesen', nation: 'Danimarka' },
    { name: 'Frederik Mikkelsen', nation: 'Danimarka' },
    { name: 'Jari Koskinen', nation: 'Finlandiya' },
    { name: 'Teemu Laakso', nation: 'Finlandiya' },
    { name: 'Declan Murray', nation: 'İrlanda' },
    { name: 'Sean Gallagher', nation: 'İrlanda' },
    { name: 'Callum Wright', nation: 'İngiltere' },
    { name: 'Oliver Hastings', nation: 'İngiltere' },
    { name: 'Noah Whitaker', nation: 'ABD' },
    { name: 'Tyler Morrison', nation: 'ABD' },
    { name: 'Ethan Brooks', nation: 'Kanada' },
    { name: 'Liam OConnell', nation: 'Kanada' },
    { name: 'Youssef Amrani', nation: 'Fas' },
    { name: 'Hakim Boussoufa', nation: 'Fas' },
    { name: 'Karim Zeroual', nation: 'Cezayir' },
    { name: 'Nabil Cherif', nation: 'Cezayir' },
    { name: 'Moussa Traore', nation: 'Mali' },
    { name: 'Ibrahim Doumbia', nation: 'Fildişi Sahili' },
    { name: 'Kwame Boateng', nation: 'Gana' },
    { name: 'Samuel Kante', nation: 'Gine' },
    { name: 'Luis Fonseca', nation: 'Portekiz' },
    { name: 'Tiago Pires', nation: 'Portekiz' },
    { name: 'Sebastian Rojas', nation: 'Şili' },
    { name: 'Cristobal Mena', nation: 'Şili' },
    { name: 'Diego Figueroa', nation: 'Uruguay' },
    { name: 'Martin Caceres', nation: 'Uruguay' },
    { name: 'Jose Valenzuela', nation: 'Meksika' },
    { name: 'Hector Salgado', nation: 'Meksika' },
    { name: 'Alexis Paredes', nation: 'Paraguay' },
    { name: 'Bruno Escobar', nation: 'Paraguay' },
    { name: 'Nicolas Arce', nation: 'Peru' },
    { name: 'Renato Villanueva', nation: 'Peru' },
    { name: 'Erik Lundgren', nation: 'İsveç' },
    { name: 'Albin Karlsson', nation: 'İsveç' },
    { name: 'Viktor Sjöberg', nation: 'İsveç' },
    { name: 'Magnus Eklund', nation: 'İsveç' },
    { name: 'Jonas Nyberg', nation: 'İsveç' },
    { name: 'Morten Hald', nation: 'Danimarka' },
    { name: 'Rasmus Kjær', nation: 'Danimarka' },
    { name: 'Frederik Holm', nation: 'Danimarka' },
    { name: 'Søren Vinter', nation: 'Danimarka' },
    { name: 'Anders Møller', nation: 'Danimarka' },
    { name: 'Olli Kinnunen', nation: 'Finlandiya' },
    { name: 'Joonas Heikkilä', nation: 'Finlandiya' },
    { name: 'Petteri Vuori', nation: 'Finlandiya' },
    { name: 'Sami Lehtonen', nation: 'Finlandiya' },
    { name: 'Teemu Hakkarainen', nation: 'Finlandiya' },
    { name: 'Erling Fossum', nation: 'Norveç' },
    { name: 'Sindre Aaberg', nation: 'Norveç' },
    { name: 'Mats Johansen', nation: 'Norveç' },
    { name: 'Kristoffer Lie', nation: 'Norveç' },
    { name: 'Tobias Strand', nation: 'Norveç' },
    { name: 'Lukas Brandner', nation: 'Almanya' },
    { name: 'Felix Hartwig', nation: 'Almanya' },
    { name: 'Jonas Reuter', nation: 'Almanya' },
    { name: 'Maximilian Vogt', nation: 'Almanya' },
    { name: 'Sebastian Kühn', nation: 'Almanya' },
    { name: 'Julian Ahrens', nation: 'Almanya' },
    { name: 'Matteo Bellucci', nation: 'İtalya' },
    { name: 'Andrea Gualtieri', nation: 'İtalya' },
    { name: 'Riccardo Fabbri', nation: 'İtalya' },
    { name: 'Nicola Marangoni', nation: 'İtalya' },
    { name: 'Paolo Rinaldesi', nation: 'İtalya' },
    { name: 'Giacomo Venturi', nation: 'İtalya' },
    { name: 'Hugo Renard', nation: 'Fransa' },
    { name: 'Bastien Collin', nation: 'Fransa' },
    { name: 'Loïc Fontaine', nation: 'Fransa' },
    { name: 'Mathieu Perrin', nation: 'Fransa' },
    { name: 'Antoine Vasseur', nation: 'Fransa' },
    { name: 'Clément Roche', nation: 'Fransa' },
    { name: 'Iñigo Larrain', nation: 'İspanya' },
    { name: 'Daniel Escudero', nation: 'İspanya' },
    { name: 'Mario Quintana', nation: 'İspanya' },
    { name: 'Javier Robledo', nation: 'İspanya' },
    { name: 'Sergi Palou', nation: 'İspanya' },
    { name: 'Alberto Miralles', nation: 'İspanya' },
    { name: 'Tiago Loureiro', nation: 'Portekiz' },
    { name: 'Bruno Azevedo', nation: 'Portekiz' },
    { name: 'Miguel Seabra', nation: 'Portekiz' },
    { name: 'Ruben Falcão', nation: 'Portekiz' },
    { name: 'Diogo Matos', nation: 'Portekiz' },
    { name: 'Andrej Milenkovic', nation: 'Sırbistan' },
    { name: 'Marko Radunovic', nation: 'Sırbistan' },
    { name: 'Stefan Kostic', nation: 'Sırbistan' },
    { name: 'Nikola Pavlovic', nation: 'Sırbistan' },
    { name: 'Lazar Jankovic', nation: 'Sırbistan' },
    { name: 'Ante Perisic', nation: 'Hırvatistan' },
    { name: 'Dario Bozic', nation: 'Hırvatistan' },
    { name: 'Ivan Segedin', nation: 'Hırvatistan' },
    { name: 'Luka Radic', nation: 'Hırvatistan' },
    { name: 'Matej Kovacek', nation: 'Hırvatistan' },
    { name: 'Tomasz Kurek', nation: 'Polonya' },
    { name: 'Michal Sobczak', nation: 'Polonya' },
    { name: 'Kacper Wilk', nation: 'Polonya' },
    { name: 'Bartosz Piotrowski', nation: 'Polonya' },
    { name: 'Adrian Cieslak', nation: 'Polonya' },
    { name: 'Ondrej Blazek', nation: 'Çekya' },
    { name: 'Petr Mach', nation: 'Çekya' },
    { name: 'Jan Vondra', nation: 'Çekya' },
    { name: 'Radek Simek', nation: 'Çekya' },
    { name: 'Filip Nemec', nation: 'Slovakya' },
    { name: 'Martin Hronec', nation: 'Slovakya' },
    { name: 'Tibor Nagy', nation: 'Macaristan' },
    { name: 'Zoltan Balogh', nation: 'Macaristan' },
    { name: 'Roland Toth', nation: 'Macaristan' },
    { name: 'Alexandru Ionescu', nation: 'Romanya' },
    { name: 'Mihai Stanescu', nation: 'Romanya' },
    { name: 'Radu Petrescu', nation: 'Romanya' },
    { name: 'Georgi Dimitrov', nation: 'Bulgaristan' },
    { name: 'Petar Iliev', nation: 'Bulgaristan' },
    { name: 'Nikolay Todorov', nation: 'Bulgaristan' },
    { name: 'Dimitris Kanelos', nation: 'Yunanistan' },
    { name: 'Giorgos Papalexis', nation: 'Yunanistan' },
    { name: 'Stavros Kalogeras', nation: 'Yunanistan' },
    { name: 'Lucas Ferreyra', nation: 'Arjantin' },
    { name: 'Matias Olmedo', nation: 'Arjantin' },
    { name: 'Bruno Arostegui', nation: 'Arjantin' },
    { name: 'Agustin Latorre', nation: 'Arjantin' },
    { name: 'Nicolas Bressan', nation: 'Arjantin' },
    { name: 'Pedro Alencar', nation: 'Brezilya' },
    { name: 'Renan Tavares', nation: 'Brezilya' },
    { name: 'Caue Ribeiro', nation: 'Brezilya' },
    { name: 'Thiago Bastos', nation: 'Brezilya' },
    { name: 'Igor Mendonca', nation: 'Brezilya' },
    { name: 'Diego Arancibia', nation: 'Şili' },
    { name: 'Cristobal Fuentes', nation: 'Şili' },
    { name: 'Sebastian Oyarzun', nation: 'Şili' },
    { name: 'Matias Salgado', nation: 'Şili' },
    { name: 'Esteban Loyola', nation: 'Şili' },
    { name: 'Martin Benitez', nation: 'Uruguay' },
    { name: 'Federico Silveira', nation: 'Uruguay' },
    { name: 'Agustin Cabrera', nation: 'Uruguay' },
    { name: 'Rodrigo Bentancur', nation: 'Uruguay' },
    { name: 'Lucas Pereiro', nation: 'Uruguay' },
    { name: 'Juan Camacho', nation: 'Kolombiya' },
    { name: 'Santiago Lemos', nation: 'Kolombiya' },
    { name: 'Andres Mosquera', nation: 'Kolombiya' },
    { name: 'Felipe Angulo', nation: 'Kolombiya' },
    { name: 'Carlos Mena', nation: 'Kolombiya' },
    { name: 'Jose Villalobos', nation: 'Venezuela' },
    { name: 'Rafael Uzcategui', nation: 'Venezuela' },
    { name: 'Luis Arismendi', nation: 'Venezuela' },
    { name: 'Manuel Rondon', nation: 'Venezuela' },
    { name: 'Edgar Paredes', nation: 'Venezuela' },
    { name: 'Miguel Benavides', nation: 'Peru' },
    { name: 'Renzo Cardenas', nation: 'Peru' },
    { name: 'Jorge Huaman', nation: 'Peru' },
    { name: 'Luis Zegarra', nation: 'Peru' },
    { name: 'Paolo Vilchez', nation: 'Peru' },
    { name: 'Oscar Candia', nation: 'Bolivya' },
    { name: 'Diego Quispe', nation: 'Bolivya' },
    { name: 'Marco Torrico', nation: 'Bolivya' },
    { name: 'Juan Choque', nation: 'Bolivya' },
    { name: 'Cristian Flores', nation: 'Bolivya' },
    { name: 'Alexis Cardozo', nation: 'Paraguay' },
    { name: 'Hernan Velazquez', nation: 'Paraguay' },
    { name: 'Luis Caballero', nation: 'Paraguay' },
    { name: 'Matheo Rivarola', nation: 'Paraguay' },
    { name: 'Richard Rojas', nation: 'Paraguay' },
    { name: 'Edison Caicedo', nation: 'Ekvador' },
    { name: 'Bryan Preciado', nation: 'Ekvador' },
    { name: 'Kevin Minda', nation: 'Ekvador' },
    { name: 'Youssouf Traore', nation: 'Mali' },
    { name: 'Ibrahima Konate', nation: 'Mali' },
    { name: 'Sekou Doumbia', nation: 'Mali' },
    { name: 'Amadou Diallo', nation: 'Gine' },
    { name: 'Mohamed Bangoura', nation: 'Gine' },
    { name: 'Naby Camara', nation: 'Gine' },
    { name: 'Kofi Asare', nation: 'Gana' },
    { name: 'Yaw Boateng', nation: 'Gana' },
    { name: 'Kwesi Mensimah', nation: 'Gana' },
    { name: 'Sadiq Lawal', nation: 'Nijerya' },
    { name: 'Abdul Sadiq', nation: 'Nijerya' },
    { name: 'Ismail Bello', nation: 'Nijerya' },
    { name: 'Achraf El Mansouri', nation: 'Fas' },
    { name: 'Yassine Boudlal', nation: 'Fas' },
    { name: 'Rachid Ait Lahcen', nation: 'Fas' },
    { name: 'Karim Benabid', nation: 'Cezayir' },
    { name: 'Nabil Bensaid', nation: 'Cezayir' },
    { name: 'Sofiane Mechri', nation: 'Cezayir' },
    { name: 'Aliou Cisse', nation: 'Senegal' },
    { name: 'Pape Ndiaye', nation: 'Senegal' },
    { name: 'Moussa Fall', nation: 'Senegal' },
    { name: 'Hassan El Taher', nation: 'Mısır' },
    { name: 'Mostafa Abdelrahman', nation: 'Mısır' },
    { name: 'Ahmed Salahdin', nation: 'Mısır' },
    { name: 'Salem Al Ghazali', nation: 'Tunus' },
    { name: 'Anis Ben Youssef', nation: 'Tunus' },
    { name: 'Firas Trabelsi', nation: 'Tunus' },
    { name: 'Abdoulaye Sow', nation: 'Fildişi Sahili' },
    { name: 'Serge Kouassi', nation: 'Fildişi Sahili' },
    { name: 'Wilfried Kone', nation: 'Fildişi Sahili' },
    { name: 'Leo Mersan', nation: 'Arjantin' },
    { name: 'Cristian Rovaldo', nation: 'Portekiz' },
    { name: 'Kylien Mbaret', nation: 'Fransa' },
    { name: 'Erik Halvors', nation: 'Norveç' },
    { name: 'Neyson Junior', nation: 'Brezilya' },
    { name: 'Kevin Bruner', nation: 'Belçika' },
    { name: 'Lucas Modran', nation: 'Hırvatistan' },
    { name: 'Mohamed Selim', nation: 'Mısır' },
    { name: 'Robert Lewan', nation: 'Polonya' },
    { name: 'Karim Benza', nation: 'Fransa' },
    { name: 'Antoine Grison', nation: 'Fransa' },
    { name: 'Virgil Van Doren', nation: 'Hollanda' },
    { name: 'Sadio Mande', nation: 'Senegal' },
    { name: 'Harry Kalen', nation: 'İngiltere' },
    { name: 'Jude Bellington', nation: 'İngiltere' },
    { name: 'Pedro Gonzal', nation: 'İspanya' },
    { name: 'Gavriel Martinez', nation: 'İspanya' },
    { name: 'Xander Hernandez', nation: 'İspanya' },
    { name: 'Andres Inigo', nation: 'İspanya' },
    { name: 'Zlatan Ibravic', nation: 'İsveç' },
    { name: 'Paulo Dybari', nation: 'Arjantin' },
    { name: 'Angel Di Mora', nation: 'Arjantin' },
    { name: 'Bruno Fernandeson', nation: 'Portekiz' },
    { name: 'Bernard Silvares', nation: 'Portekiz' },
    { name: 'Joan Canceloz', nation: 'Portekiz' },
    { name: 'Toni Kraus', nation: 'Almanya' },
    { name: 'Manuel Neurer', nation: 'Almanya' },
    { name: 'Thomas Mulleran', nation: 'Almanya' },
    { name: 'Marco Reusen', nation: 'Almanya' },
    { name: 'Joshua Kimler', nation: 'Almanya' },
    { name: 'Rafael Leonis', nation: 'Portekiz' },
    { name: 'Theo Hernan', nation: 'Fransa' },
    { name: 'Mike Magnier', nation: 'Fransa' },
    { name: 'Lautaro Marten', nation: 'Arjantin' },
    { name: 'Julian Alvarex', nation: 'Arjantin' },
    { name: 'Bukayo Sakar', nation: 'İngiltere' },
    { name: 'Phil Fodenko', nation: 'İngiltere' },
    { name: 'Rodrigo De Paulin', nation: 'Arjantin' },
    { name: 'Casemir Dos Santos', nation: 'Brezilya' },
    { name: 'Vinicio Juniora', nation: 'Brezilya' },
    { name: 'Eduardo Camar', nation: 'Fransa' },
    { name: 'Riyad Mahrezli', nation: 'Cezayir' },
    { name: 'Hakim Ziyechi', nation: 'Fas' },
    { name: 'Son Heung-Min', nation: 'Güney Kore' },
    { name: 'Achraf Hakani', nation: 'Fas' },
    { name: 'Ilkay Gundar', nation: 'Almanya' },
    { name: 'Frenkie De Yong', nation: 'Hollanda' },
    { name: 'Matthijs De Lorn', nation: 'Hollanda' },
    { name: 'Jhon Duranes', nation: 'Kolombiya' },
    { name: 'Wilfrid Singaro', nation: 'Fildişi Sahili' },
    { name: 'Orkun Kokturk', nation: 'Türkiye' },
    { name: 'Baris Alper Yilmazer', nation: 'Türkiye' },
    { name: 'Leroy Sanaro', nation: 'Almanya' },
    { name: 'Edson Alvarezio', nation: 'Meksika' },
    { name: 'Youssef Ennasir', nation: 'Fas' },
    { name: 'Kerem Aktur', nation: 'Türkiye' },
    { name: 'Gabriel Saro', nation: 'Brezilya' },
    { name: 'Andre Onaro', nation: 'Kamerun' },
    { name: 'Davinson Sanchev', nation: 'Kolombiya' },
    { name: 'Eder Son', nation: 'Brezilya' },
    { name: 'Marco Asenzo', nation: 'İspanya' },
    { name: 'Dorgeles Neno', nation: 'Mali' },
    { name: 'Jayden Ooster', nation: 'Hollanda' },
    { name: 'Yunus Akguner', nation: 'Türkiye' },
    { name: 'Tamy Abran', nation: 'İngiltere' },
    { name: 'Ugurcan Cakirli', nation: 'Türkiye' },
    { name: 'El Bilal Tourex', nation: 'Mali' },
    { name: 'Jota Silvan', nation: 'Portekiz' },
    { name: 'Sebastian Szyman', nation: 'Polonya' },
    { name: 'Lucas Torreya', nation: 'Uruguay' },
    { name: 'Milan Skrinaro', nation: 'Slovakya' },
    { name: 'Wilfred Ndidio', nation: 'Nijerya' },
    { name: 'Oguz Aydinoglu', nation: 'Türkiye' },
    { name: 'Ismail Yuksel', nation: 'Türkiye' },
    { name: 'Archie Browner', nation: 'İngiltere' },
    { name: 'Roland Sallari', nation: 'Macaristan' },
    { name: 'Frederico Alves', nation: 'Brezilya' },
    { name: 'Ernest Muco', nation: 'Arnavutluk' },
    { name: 'Nelson Semador', nation: 'Portekiz' },
    { name: 'Taliskan', nation: 'Brezilya' },
    { name: 'Oleksandr Zubko', nation: 'Ukrayna' },
    { name: 'Vaclav Cernek', nation: 'Çekya' },
    { name: 'Tiago Djaloz', nation: 'Portekiz' },
    { name: 'Mauro Icardan', nation: 'Arjantin' },
    { name: 'Abbos Fayzulayev', nation: 'Özbekistan' },
    { name: 'Arseniy Batakov', nation: 'Ukrayna' },
    { name: 'Caglar Soyuncuoglu', nation: 'Türkiye' },
    { name: 'Ismail Jakobsen', nation: 'Senegal' },
    { name: 'Rafa Silvano', nation: 'Portekiz' },
    { name: 'Cengiz Undar', nation: 'Türkiye' },
    { name: 'Abdulkerim Bardak', nation: 'Türkiye' },
    { name: 'Mario Lemino', nation: 'Gabon' },
    { name: 'Amine Haroun', nation: 'Fas' },
    { name: 'Jesurun Raksy', nation: 'İngiltere' },
    { name: 'Benjamin Bouchari', nation: 'Fas' },
    { name: 'Danylo Sikov', nation: 'Ukrayna' },
    { name: 'Paul Onuachy', nation: 'Nijerya' }
];

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

// User Defined Teams with provided Imgur Logos and Stadium Capacities
export const TEAM_TEMPLATES = [
    { 
        name: 'Ayıboğanspor SK', 
        logo: 'https://i.imgur.com/eV74XlV.png', 
        jersey: 'https://imgur.com/7PcfX6O.png',
        jerseyGK: 'https://imgur.com/DMnuhsQ.png', // GK Overlay
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
        jersey: 'https://imgur.com/abV3t3m.png',
        jerseyGK: 'https://imgur.com/CP63fXc.png', // GK Overlay
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
        jersey: 'https://imgur.com/Zv3XZTY.png',
        jerseyGK: 'https://imgur.com/aKFKHs7.png', // GK Overlay
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
        jersey: 'https://imgur.com/jfH3kal.png',
        // jerseyGK: undefined, // No GK Overlay provided
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
        jersey: 'https://imgur.com/PidWwuV.png',
        jerseyGK: 'https://imgur.com/EF7HVUU.png', // GK Overlay
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
        jersey: 'https://imgur.com/C2xKJtO.png',
        jerseyGK: 'https://imgur.com/hHtmxQv.png', // GK Overlay
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
        jersey: 'https://imgur.com/eHAW2Fg.png',
        jerseyGK: 'https://imgur.com/Nz7hWFC.png', // GK Overlay
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
        jersey: 'https://imgur.com/bdI85Wq.png',
        jerseyGK: 'https://imgur.com/eT3Qn69.png', // GK Overlay
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
        jersey: 'https://imgur.com/k64QPcT.png',
        jerseyGK: 'https://imgur.com/H2oygfo.png', // GK Overlay
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
        jersey: 'https://imgur.com/augQrXj.png',
        jerseyGK: 'https://imgur.com/G73BOHq.png', // GK Overlay
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
        jersey: 'https://imgur.com/BOyr0e6.png',
        jerseyGK: 'https://imgur.com/wAOAVng.png', // GK Overlay
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
        jersey: 'https://imgur.com/BP2TPF8.png',
        jerseyGK: 'https://imgur.com/rhp2PXq.png', // GK Overlay
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
        jersey: 'https://imgur.com/eqUzVTA.png',
        jerseyGK: 'https://imgur.com/ZjPlTwJ.png', // GK Overlay
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
        jersey: 'https://imgur.com/QtcPbrG.png',
        jerseyGK: 'https://imgur.com/syiHDWW.png', // GK Overlay
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
        jersey: 'https://imgur.com/9JuH2nU.png',
        jerseyGK: 'https://imgur.com/00KMILk.png', // GK Overlay
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
        jersey: 'https://imgur.com/z3S5RuL.png',
        jerseyGK: 'https://imgur.com/HXvBipD.png', // GK Overlay
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
        jersey: 'https://imgur.com/QDHs7Sy.png',
        jerseyGK: 'https://imgur.com/r4F2Ykh.png', // GK Overlay
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
        jersey: 'https://imgur.com/g5voy0X.png',
        jerseyGK: 'https://imgur.com/W71pkOG.png', // GK Overlay
        colors: ['bg-green-500', 'text-green-900'], 
        stars: 0, 
        stadium: 'Barış Parkı',
        capacity: 33100,
        fans: 1950000, 
        budget: 8, 
        targetStrength: 74 
    }
];

// Rivalry Definitions
export const RIVALRIES = [
    ['Ayıboğanspor SK', 'Kedispor'],
    ['Kedispor', 'Eşşekboğanspor FK'],
    ['Eşşekboğanspor FK', 'Ayıboğanspor SK'],
    ['Kedispor', 'Köpekspor'],
    ['Bedirspor', 'Yakhubspor']
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
        case Position.SNT: // Santrafor
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
        case Position.SLK: // Sol Kanat
        case Position.SGK: // Sağ Kanat
            stats = {
                pace: getStat(1.1), // Daha hızlı
                shooting: getStat(0.95), 
                passing: getStat(0.9),
                dribbling: getStat(1.1), // Daha iyi top süren
                defending: getStat(0.5), 
                physical: getStat(0.8),
                finishing: getStat(0.85), 
                heading: getStat(0.6),
                corners: getStat(1.0), // Korner kullanabilir
                stamina: getStat(1.0)
            };
            break;
        case Position.OOS: // Ofansif Orta Saha
            stats = {
                pace: getStat(0.9),
                shooting: getStat(0.95),
                passing: getStat(1.15), // Mükemmel pasör
                dribbling: getStat(1.05),
                defending: getStat(0.6),
                physical: getStat(0.75),
                finishing: getStat(0.9),
                heading: getStat(0.6),
                corners: getStat(1.1), 
                stamina: getStat(0.95)
            };
            break;
        case Position.OS: // Merkez Orta Saha
            stats = {
                pace: getStat(0.85),
                shooting: getStat(0.8),
                passing: getStat(1.1), 
                dribbling: getStat(0.9),
                defending: getStat(0.8), // Dengeli
                physical: getStat(0.85),
                finishing: getStat(0.7),
                heading: getStat(0.7),
                corners: getStat(0.9), 
                stamina: getStat(1.1) // Yüksek dayanıklılık
            };
            break;
        case Position.SLB: // Sol Bek
        case Position.SGB: // Sağ Bek
            stats = {
                pace: getStat(1.0),
                shooting: getStat(0.5),
                passing: getStat(0.8),
                dribbling: getStat(0.8),
                defending: getStat(0.95), 
                physical: getStat(0.9),
                finishing: getStat(0.4),
                heading: getStat(0.8), 
                corners: getStat(0.5),
                stamina: getStat(1.05)
            };
            break;
        case Position.STP: // Stoper
            stats = {
                pace: getStat(0.7),
                shooting: getStat(0.3),
                passing: getStat(0.6),
                dribbling: getStat(0.5),
                defending: getStat(1.2), // En iyi defans
                physical: getStat(1.15), // En güçlü
                finishing: getStat(0.2),
                heading: getStat(1.2), // İyi kafa topu
                corners: getStat(0.2),
                stamina: getStat(0.9)
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

// --- UPDATED DETAILED VALUE CALCULATION ---
// Based on specific tiers requested:
// Baseline: Forward (SNT) at Age 28.
// 79-75 Güç: 16M - 4M
// 75-70 Güç: 4M - 1M
// < 70 Güç: < 1M
const calculateMarketValue = (position: Position, skill: number, age: number): number => {
    let baseValue = 0;

    // 1. BASE VALUE CALCULATION (Based on Forward/SNT standards as baseline)
    if (skill >= 90) {
        // Elite: 100M+
        baseValue = 100 + (skill - 90) * 15;
    } else if (skill >= 85) {
        // World Class: 50M -> 100M
        baseValue = 50 + ((skill - 85) / 5) * 50;
    } else if (skill >= 80) {
        // High Tier: 20M -> 50M
        baseValue = 20 + ((skill - 80) / 5) * 30;
    } else if (skill >= 75) {
        // Requested Range: 75-79 -> 4M to 16M
        // 75 = 4M, 79 = 16M -> Range is 12M over 4 skill points
        const range = 16 - 4; 
        const progress = (skill - 75) / 4; // 0 to 1
        baseValue = 4 + (progress * range);
    } else if (skill >= 70) {
        // Requested Range: 70-74 -> 1M to 4M
        const range = 4 - 1; 
        const progress = (skill - 70) / 5;
        baseValue = 1 + (progress * range);
    } else {
        // Requested Range: 50-69 -> 0.1M to 1M (approx)
        const effectiveSkill = Math.max(50, skill);
        const range = 1 - 0.1;
        const progress = (effectiveSkill - 50) / 20;
        baseValue = 0.1 + (progress * range);
    }

    // 2. POSITION MULTIPLIERS (Reducing value for non-forwards from the baseline)
    let posMultiplier = 1.0;
    switch (position) {
        case Position.SNT:
            posMultiplier = 1.0;
            break;
        case Position.SLK:
        case Position.SGK:
        case Position.OOS:
            posMultiplier = 0.95; // Wingers/CAM slightly less than pure striker
            break;
        case Position.OS:
            posMultiplier = 0.85; // CM
            break;
        case Position.SLB:
        case Position.SGB:
            posMultiplier = 0.75; // Fullbacks
            break;
        case Position.STP:
            posMultiplier = 0.70; // CB
            break;
        case Position.GK:
            posMultiplier = 0.60; // GK usually lowest market value relative to impact
            break;
    }

    // 3. AGE MULTIPLIERS (Baseline 28 years old = 1.0)
    let ageMultiplier = 1.0;
    if (age <= 19) ageMultiplier = 2.5; // High potential premium
    else if (age <= 21) ageMultiplier = 1.8;
    else if (age <= 24) ageMultiplier = 1.4;
    else if (age <= 27) ageMultiplier = 1.1;
    // UPDATED: Value doesn't drop until after 30
    else if (age <= 30) ageMultiplier = 1.0; 
    else if (age <= 32) ageMultiplier = 0.75; // Smoother drop after 30
    else if (age <= 34) ageMultiplier = 0.45;
    else ageMultiplier = 0.15; // Retirement age

    // Calculate Final Value
    let finalValue = baseValue * posMultiplier * ageMultiplier;

    // Add slight random variance (+/- 5%)
    finalValue = finalValue * (0.95 + Math.random() * 0.10);

    // Rounding for cleaner UI
    if (finalValue > 20) {
        return Math.round(finalValue);
    } else if (finalValue > 1) {
        return Number(finalValue.toFixed(1));
    } else {
        return Number(finalValue.toFixed(2));
    }
};

// Modified to accept exact target skill instead of abstract tier
// Added canBeForeign parameter to respect squad limits
// Added jersey parameter for team specific shirt
export const generatePlayer = (position: Position, targetSkill: number, teamId: string, canBeForeign: boolean = true, jersey?: string): Player => {
    // 1. Calculate Skill First to determine Nationality logic
    let skill = Math.min(99, Math.max(40, targetSkill + getRandomInt(-4, 4)));

    // 2. Determine Nationality based on Skill
    // Constraint: Strongest players (82+) are generally foreign. Turkish 82+ is rare.
    let isForeign = false;

    if (canBeForeign) {
        if (skill > 82) {
            // High Skill Zone: 90% chance to be Foreign
            // This makes 82+ Turkish players rare (10%)
            if (Math.random() < 0.90) {
                isForeign = true;
            }
        } else {
            // Normal/Low Skill Zone
            // Standard probability distribution based on team strength context
            // Strong teams need foreigners to fill roster, weak teams mostly Turkish
            const baseForeignChance = targetSkill >= 75 ? 0.20 : 0.05;
            if (Math.random() < baseForeignChance) {
                isForeign = true;
            }
        }
    } else {
        isForeign = false;
    }

    // 3. Name Generation
    let name = `${FIRST_NAMES[getRandomInt(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[getRandomInt(0, LAST_NAMES.length - 1)]}`;
    let nation = 'Türkiye';
    
    if (isForeign && FOREIGN_STARS.length > 0) {
        const star = FOREIGN_STARS[getRandomInt(0, FOREIGN_STARS.length - 1)];
        name = star.name;
        nation = star.nation;
    }

    // 4. Age Generation
    let age = getRandomInt(17, 36);

    // Rule: 18-22 Foreigners are rare. If generated in this range, reroll to 23+ mostly.
    if (isForeign && age >= 18 && age <= 22) {
        // 85% chance to force older age for foreigners
        if (Math.random() < 0.85) {
            age = getRandomInt(23, 35);
        }
    }
    
    // --- CONSTRAINT: 32+ Yaş ve 86+ Güç Nadirliği ---
    if (age > 32 && skill >= 86) {
        // %95 ihtimalle müdahale et (Çok nadir olsun)
        if (Math.random() < 0.95) {
            // Ya yaşı düşür ya da gücü düşür
            if (Math.random() < 0.5) {
                // Yaşı küçült (Prime yaşa çek)
                age = getRandomInt(27, 31);
            } else {
                // Gücü düşür (Yaşlı ama iyi oyuncu seviyesi)
                skill = getRandomInt(79, 85);
            }
        }
    }

    // --- RARITY CHECK FOR YOUNG STARS ---
    if (skill >= 80 && age < 22) {
        if (Math.random() > 0.05) {
            age = getRandomInt(23, 34);
        }
    }

    // --- SECONDARY POSITION LOGIC ---
    let secondaryPosition: Position | undefined = undefined;
    
    // 35% chance to have a secondary position (excluding GK mostly)
    if (position !== Position.GK && Math.random() < 0.35) {
        switch (position) {
            case Position.STP: 
                secondaryPosition = [Position.SLB, Position.SGB, Position.OS][getRandomInt(0, 2)];
                break;
            case Position.SLB:
                secondaryPosition = [Position.STP, Position.SLK][getRandomInt(0, 1)];
                break;
            case Position.SGB:
                secondaryPosition = [Position.STP, Position.SGK][getRandomInt(0, 1)];
                break;
            case Position.OS:
                secondaryPosition = [Position.OOS, Position.STP][getRandomInt(0, 1)];
                break;
            case Position.OOS:
                secondaryPosition = [Position.SLK, Position.SGK, Position.OS, Position.SNT][getRandomInt(0, 3)];
                break;
            case Position.SLK:
            case Position.SGK:
                secondaryPosition = [Position.OOS, Position.SNT, Position.SLB, Position.SGB][getRandomInt(0, 3)];
                break;
            case Position.SNT:
                secondaryPosition = [Position.SLK, Position.SGK, Position.OOS][getRandomInt(0, 2)];
                break;
        }
    }

    // NEW VALUE CALCULATION (Use the higher value of the two positions)
    const valPrimary = calculateMarketValue(position, skill, age);
    let valSecondary = 0;
    
    if (secondaryPosition) {
        valSecondary = calculateMarketValue(secondaryPosition, skill, age);
    }

    const value = Math.max(valPrimary, valSecondary);

    const stats = generateStats(position, skill);

    // --- FACE GENERATION LOGIC ---
    
    // 1. Determine Skin Index based on Nation
    const rand = Math.random();
    let skinIndex = 0; // Default Skin 1

    if (nation === 'Türkiye') {
        // Turkish: 70% Skin 1, 30% Skin 2
        skinIndex = rand < 0.7 ? 0 : 1;
    } else if (SOUTH_AMERICAN_NATIONS.includes(nation)) {
        // South American: 10% Skin 1, 80% Skin 2, 10% Skin 3
        if (rand < 0.1) skinIndex = 0; 
        else if (rand < 0.9) skinIndex = 1;
        else skinIndex = 2;
    } else if (AFRICAN_NATIONS.includes(nation)) {
        // African: 20% Skin 2, 80% Skin 3
        if (rand < 0.2) skinIndex = 1;
        else skinIndex = 2;
    } else if (EUROPEAN_NATIONS.includes(nation)) {
        // European: 80% Skin 1, 20% Skin 2
        skinIndex = rand < 0.8 ? 0 : 1;
    } else if (NORTH_AMERICAN_NATIONS.includes(nation)) {
        // North American: 60% Skin 1, 40% Skin 3
        skinIndex = rand < 0.6 ? 0 : 2;
    } else {
        // Rest of the World (Fallback): 70% Skin 1, 30% Skin 2
        skinIndex = rand < 0.7 ? 0 : 1;
    }

    const skin = FACE_ASSETS.skin[skinIndex];
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    // 2. Select Hair based on Skin
    let allowedHairs: string[] = [];
    const oldHairs = FACE_ASSETS.hair.slice(0, 5);
    const universalHairs = FACE_ASSETS.hair.slice(14, 18);

    if (skinIndex === 0) { 
        // Skin 1
        const specificHairs = FACE_ASSETS.hair.slice(6, 14);
        allowedHairs = [...oldHairs, ...universalHairs, ...specificHairs];
    } else if (skinIndex === 1) {
        // Skin 2
        allowedHairs = [...oldHairs, ...universalHairs, FACE_ASSETS.hair[5], FACE_ASSETS.hair[9]];
    } else if (skinIndex === 2) {
        // Skin 3
        allowedHairs = [...oldHairs, ...universalHairs, FACE_ASSETS.hair[5]];
    } else {
        allowedHairs = oldHairs;
    }

    const hair = pick(allowedHairs);

    // 3. Select Tattoo based on Skin
    let tattoo: string | undefined = undefined;
    if (Math.random() < 0.04) { // 4% Probability
        if (skinIndex === 2) { 
            tattoo = FACE_ASSETS.tattoo[0];
        } else {
            tattoo = FACE_ASSETS.tattoo[1];
        }
    }

    // 4. Beard Selection Logic
    // Rules:
    // beard_1 (index 0): Only for Skin 1
    // beard_2 (index 1), beard_3 (index 2): Not for Skin 2
    // Implied: Skin 2 gets NO beard.
    
    let allowedBeardIndices: number[] = [];
    
    if (skinIndex === 0) {
        // Skin 1: Allows all beards
        allowedBeardIndices = [0, 1, 2];
    } else if (skinIndex === 1) {
        // Skin 2: Allows NO beards (beard_1, beard_2, beard_3 explicitly banned or not allowed)
        allowedBeardIndices = [];
    } else if (skinIndex === 2) {
        // Skin 3: beard_1 is incompatible (it's for skin 1 only). beard_2 and beard_3 are allowed.
        allowedBeardIndices = [1, 2];
    }

    let beard: string | undefined = undefined;
    // 40% chance to have beard IF allowed
    if (allowedBeardIndices.length > 0 && Math.random() < 0.4) {
        const bIdx = allowedBeardIndices[Math.floor(Math.random() * allowedBeardIndices.length)];
        beard = FACE_ASSETS.beard[bIdx];
    }

    // 5. Freckles - 15% Probability
    const freckles = Math.random() < 0.15 ? pick(FACE_ASSETS.freckles) : undefined;

    const faceData: PlayerFaceData = {
        skin,
        brows: pick(FACE_ASSETS.brows),
        eyes: pick(FACE_ASSETS.eyes),
        hair,
        beard,
        freckles,
        tattoo
    };

    // Calculate Injury Susceptibility (0-100)
    let baseSusceptibility = getRandomInt(1, 20);
    if (age > 28) baseSusceptibility += (age - 28) * 2;
    if (stats.physical < 60) baseSusceptibility += 10;
    if (Math.random() < 0.1) baseSusceptibility += 30;

    const injurySusceptibility = Math.min(100, Math.max(1, baseSusceptibility));

    return {
        id: generateId(),
        name,
        position,
        secondaryPosition,
        skill,
        stats,
        seasonStats: { goals: 0, assists: 0, ratings: [], averageRating: 0, matchesPlayed: 0 }, 
        face: faceData,
        jersey,
        age,
        value,
        nationality: nation,
        teamId,
        morale: getRandomInt(70, 100),
        injurySusceptibility,
        injuryHistory: []
    };
};

export const initializeTeams = (): Team[] => {
    return TEAM_TEMPLATES.map((tmpl) => {
        const teamId = generateId();
        
        // Define foreign player limits based on team strength
        // > 80 Strength: Max 11 foreigners
        // < 80 Strength: Max 5 foreigners
        const maxForeigners = tmpl.targetStrength >= 80 ? 11 : 5;
        let currentForeigners = 0;

        // Helper wrapper to create player and track foreign count
        const createPlayer = (pos: Position, strength: number) => {
            const canBeForeign = currentForeigners < maxForeigners;
            // Determine Jersey: If GK, use the GK overlay. If outfield, use normal jersey.
            const jerseyToUse = pos === Position.GK ? tmpl.jerseyGK : tmpl.jersey;
            
            const p = generatePlayer(pos, strength, teamId, canBeForeign, jerseyToUse);
            if (p.nationality !== 'Türkiye') {
                currentForeigners++;
            }
            return p;
        }
        
        // Construct detailed 4-4-2 Lineup (0-10) with specific positions
        
        // 1. GK
        const gk = createPlayer(Position.GK, tmpl.targetStrength);
        
        // 2. Defense Line (SLB - STP - STP - SGB)
        const slb = createPlayer(Position.SLB, tmpl.targetStrength);
        const stp1 = createPlayer(Position.STP, tmpl.targetStrength);
        const stp2 = createPlayer(Position.STP, tmpl.targetStrength);
        const sgb = createPlayer(Position.SGB, tmpl.targetStrength);
        
        // 3. Midfield Line (SLK - OS - OS - SGK)
        const slk = createPlayer(Position.SLK, tmpl.targetStrength);
        const os1 = createPlayer(Position.OS, tmpl.targetStrength);
        const os2 = createPlayer(Position.OS, tmpl.targetStrength);
        const sgk = createPlayer(Position.SGK, tmpl.targetStrength);
        
        // 4. Attack Line (SNT - SNT)
        const snt1 = createPlayer(Position.SNT, tmpl.targetStrength);
        const snt2 = createPlayer(Position.SNT, tmpl.targetStrength);

        // --- SUBSTITUTES (7 Players) ---
        const subGK = createPlayer(Position.GK, tmpl.targetStrength - 5);
        const subDEF1 = createPlayer(Position.STP, tmpl.targetStrength - 5);
        const subDEF2 = createPlayer(Position.SLB, tmpl.targetStrength - 5); // Or SGB
        const subMID1 = createPlayer(Position.OS, tmpl.targetStrength - 5);
        const subMID2 = createPlayer(Position.OOS, tmpl.targetStrength - 5); // Include OOS as option
        const subFWD1 = createPlayer(Position.SLK, tmpl.targetStrength - 5); // Or SGK
        const subFWD2 = createPlayer(Position.SNT, tmpl.targetStrength - 5);

        // --- RESERVES (Balanced Mix) ---
        const reserves = [];
        reserves.push(createPlayer(Position.GK, tmpl.targetStrength - 10));
        reserves.push(createPlayer(Position.SGB, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.STP, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.OS, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.SGK, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.SNT, tmpl.targetStrength - 8));

        // Combine all in standard order
        // 0-10: XI
        // 11-17: Subs
        // 18+: Reserves
        const players = [
            gk, 
            slb, stp1, stp2, sgb, 
            slk, os1, os2, sgk, 
            snt1, snt2,
            subGK, subDEF1, subDEF2, subMID1, subMID2, subFWD1, subFWD2,
            ...reserves
        ];

        return {
            id: teamId,
            name: tmpl.name,
            colors: tmpl.colors as [string, string],
            logo: tmpl.logo,
            jersey: tmpl.jersey,
            stars: tmpl.stars,
            fanBase: tmpl.fans,
            stadiumName: tmpl.stadium,
            stadiumCapacity: tmpl.capacity,
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
