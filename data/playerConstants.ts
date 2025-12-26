
import { Position, PlayerStats, Player, PlayerFaceData } from '../types';
import { FACE_ASSETS } from './uiConstants';
import { generateId } from './gameConstants';

// Random Turkish First Names
const FIRST_NAMES = [
    'Ahmet','Mehmet','Mustafa','Can','Burak','Emre','Arda','Semih','Cenk','Hakan','Oğuzhan','Volkan','Onur','Gökhan','Selçuk','Mert','Altay','Uğur','Kerem','Yunus','Barış','Ferdi','İrfan','Ozan','Salih','Taylan','Berkan','Halil','Kenan','Umut','Enes','Çağlar','Yiğit','Efe','Berat','Emir','Kaan','Doruk','Çınar','Rüzgar',
    'Tolga','Serdar','Nazım','Metin','Harun','Batuhan','Kubilay','Furkan','Ömer','Tugay','Zafer','Serhat','Nevzat','Cihan','Serkan','Alper','Yasin','Mevlüt','Cem','Erdem','Ertuğrul','İsmail','Melih','Recep','Utku','Samet','Sezer','Burhan','Adem','Fatih','Sedat','Orhan','Raşit','Bekir','Kazım','Levent','Erman','Çağan','Talha',
    'Sarp','Eralp','Giray','Taner','Oktay','Berk','Koral','Altan','Demir','Seçkin','Sinan','Tarık','Koray','Fırat','Tamer','Oğuz','Ender','Tuncay','Bora','Kadir','Süleyman','Mahmut','Serkan','Kutay','Deniz','Atakan','Taha','Emin','Hasan','Eren','Ulaş','Rıdvan','Tufan','Arif','Suat','Erkut','Batıkan','Buğra','Bünyamin',
    'Ege','Yiğitalp','Baran','Ata','Kutlu','Ensar','Batı','Gökalp','Yahya','Talat','Hilmi','Ekrem','Mazlum','Timur','Yavuz','Tuğrul','Ekin','Dorukan','Cavit','Mirza','Mehdi','Özgür','Musa','Aziz','Nihat','Sedat','Tamer','Rasim','Saffet','Yekta','Bünyamin','Serkan','Veysel','Mücahit','Anıl','Hüseyin','İlker','Tunahan',
    'Enver','İlhan','Sefer','Mutlu','Nazif','Ertan','Burçin','Ataberk','Kayra','Nesim','Kutberk','Aras','Talay','Baturalp','Miran','Eymen','Göktuğ','Atlas','Yalın','Koralp','Ender','Yekta','Altın','Orçun','Selami','Rasih','Semican','Fikret','Çetin','Sezai','Murat','Doğukan','Yusuf','Mahsun','Toygar','İlker','Himmet','Özkan',
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
    { name: 'Lucas Ribeiro', nation: 'Brezilya' },
    { name: 'Matheus Falcao', nation: 'Brezilya' },
    { name: 'Renan Pacheco', nation: 'Brezilya' },
    { name: 'Igor Tavares', nation: 'Brezilya' },
    { name: 'Felipe Macedo', nation: 'Brezilya' },
    { name: 'Thiago Cunha', nation: 'Brezilya' },
    { name: 'Bruno Siqueira', nation: 'Brezilya' },
    { name: 'Rafael Moreira', nation: 'Brezilya' },
    { name: 'Caio Nogueira', nation: 'Brezilya' },
    { name: 'Pedro Alvez', nation: 'Brezilya' },
    { name: 'Enzo Ferreyra', nation: 'Arjantin' },
    { name: 'Lucas Pereyra', nation: 'Arjantin' },
    { name: 'Matias Benitez', nation: 'Arjantin' },
    { name: 'Agustin Cabrera', nation: 'Arjantin' },
    { name: 'Franco Olmedo', nation: 'Arjantin' },
    { name: 'Bruno Latorre', nation: 'Arjantin' },
    { name: 'Nicolas Bustos', nation: 'Arjantin' },
    { name: 'Julian Arce', nation: 'Arjantin' },
    { name: 'Facundo Molina', nation: 'Arjantin' },
    { name: 'Tomas Villagra', nation: 'Arjantin' },
    { name: 'Alvaro Quintana', nation: 'Ispanya' },
    { name: 'Sergio Calderon', nation: 'Ispanya' },
    { name: 'Daniel Escobar', nation: 'Ispanya' },
    { name: 'Javier Montoya', nation: 'Ispanya' },
    { name: 'Iker Palacios', nation: 'Ispanya' },
    { name: 'Mario Salgado', nation: 'Ispanya' },
    { name: 'Ruben Carrasco', nation: 'Ispanya' },
    { name: 'Pablo Santoro', nation: 'Ispanya' },
    { name: 'Hector Mendez', nation: 'Ispanya' },
    { name: 'Victor Robledo', nation: 'Ispanya' },
    { name: 'Matteo Ricci', nation: 'Italya' },
    { name: 'Andrea Galli', nation: 'Italya' },
    { name: 'Luca Ferraro', nation: 'Italya' },
    { name: 'Paolo Montesi', nation: 'Italya' },
    { name: 'Giacomo Ventola', nation: 'Italya' },
    { name: 'Davide Rinaldi', nation: 'Italya' },
    { name: 'Simone Bellini', nation: 'Italya' },
    { name: 'Nicola Farini', nation: 'Italya' },
    { name: 'Alessio Conti', nation: 'Italya' },
    { name: 'Federico Mancuso', nation: 'Italya' },
    { name: 'Julien Lefort', nation: 'Fransa' },
    { name: 'Hugo Perrin', nation: 'Fransa' },
    { name: 'Antoine Morel', nation: 'Fransa' },
    { name: 'Theo Garnier', nation: 'Fransa' },
    { name: 'Romain Dupont', nation: 'Fransa' },
    { name: 'Bastien Chevalier', nation: 'Fransa' },
    { name: 'Lucas Fontaine', nation: 'Fransa' },
    { name: 'Maxime Rolland', nation: 'Fransa' },
    { name: 'Florian Petit', nation: 'Fransa' },
    { name: 'Nicolas Barbet', nation: 'Fransa' },
    { name: 'Leon Hoffmann', nation: 'Almanya' },
    { name: 'Felix Wagner', nation: 'Almanya' },
    { name: 'Jonas Becker', nation: 'Almanya' },
    { name: 'Maximilian Vogler', nation: 'Almanya' },
    { name: 'Sebastian Kuhn', nation: 'Almanya' },
    { name: 'Tobias Kramer', nation: 'Almanya' },
    { name: 'Julian Schulte', nation: 'Almanya' },
    { name: 'Dennis Hartmann', nation: 'Almanya' },
    { name: 'Patrick Neumann', nation: 'Almanya' },
    { name: 'Lukas Brandt', nation: 'Almanya' },
    { name: 'Oliver Grant', nation: 'Ingiltere' },
    { name: 'James Collins', nation: 'Ingiltere' },
    { name: 'Harry Dawson', nation: 'Ingiltere' },
    { name: 'Callum Price', nation: 'Ingiltere' },
    { name: 'Ethan Walker', nation: 'Ingiltere' },
    { name: 'Ryan Mitchell', nation: 'Ingiltere' },
    { name: 'Connor Hughes', nation: 'Ingiltere' },
    { name: 'Daniel Foster', nation: 'Ingiltere' },
    { name: 'Samuel Brooks', nation: 'Ingiltere' },
    { name: 'Luke Harrison', nation: 'Ingiltere' },
    { name: 'Mikkel Larsen', nation: 'Danimarka' },
    { name: 'Anders Holm', nation: 'Danimarka' },
    { name: 'Rasmus Pedersen', nation: 'Danimarka' },
    { name: 'Frederik Madsen', nation: 'Danimarka' },
    { name: 'Jesper Nielsen', nation: 'Danimarka' },
    { name: 'Jonas Poulsen', nation: 'Danimarka' },
    { name: 'Lasse Kristoffersen', nation: 'Danimarka' },
    { name: 'Martin Olesen', nation: 'Danimarka' },
    { name: 'Simon Jorgensen', nation: 'Danimarka' },
    { name: 'Kasper Lund', nation: 'Danimarka' },
    { name: 'Erik Svensson', nation: 'Isvec' },
    { name: 'Jonas Karlsson', nation: 'Isvec' },
    { name: 'Oskar Lindberg', nation: 'Isvec' },
    { name: 'Magnus Berg', nation: 'Isvec' },
    { name: 'Albin Sjodin', nation: 'Isvec' },
    { name: 'Viktor Holm', nation: 'Isvec' },
    { name: 'Simon Ekstrom', nation: 'Isvec' },
    { name: 'Anton Nyberg', nation: 'Isvec' },
    { name: 'Lucas Strand', nation: 'Isvec' },
    { name: 'Felix Blom', nation: 'Isvec' },
    { name: 'Erling Johansen', nation: 'Norvec' },
    { name: 'Sander Kristiansen', nation: 'Norvec' },
    { name: 'Mats Solberg', nation: 'Norvec' },
    { name: 'Tobias Nilsen', nation: 'Norvec' },
    { name: 'Kristoffer Lie', nation: 'Norvec' },
    { name: 'Andreas Moen', nation: 'Norvec' },
    { name: 'Jonas Hauge', nation: 'Norvec' },
    { name: 'Eirik Aasen', nation: 'Norvec' },
    { name: 'Lars Pettersen', nation: 'Norvec' },
    { name: 'Martin Rekkedal', nation: 'Norvec' },
    { name: 'Pawel Kowalczyk', nation: 'Polonya' },
    { name: 'Tomasz Nowicki', nation: 'Polonya' },
    { name: 'Krzysztof Baran', nation: 'Polonya' },
    { name: 'Mateusz Duda', nation: 'Polonya' },
    { name: 'Adrian Kaczmarek', nation: 'Polonya' },
    { name: 'Michal Wojtas', nation: 'Polonya' },
    { name: 'Bartosz Zielinski', nation: 'Polonya' },
    { name: 'Kacper Piasecki', nation: 'Polonya' },
    { name: 'Damian Majewski', nation: 'Polonya' },
    { name: 'Rafal Leszczynski', nation: 'Polonya' },
    { name: 'Samuel Boateng', nation: 'Gana' },
    { name: 'Yaw Mensah', nation: 'Gana' },
    { name: 'Kwame Owusu', nation: 'Gana' },
    { name: 'Joseph Appiah', nation: 'Gana' },
    { name: 'Daniel Asamoah', nation: 'Gana' },
    { name: 'Ibrahim Diallo', nation: 'Gine' },
    { name: 'Mohamed Keita', nation: 'Gine' },
    { name: 'Amadou Camara', nation: 'Gine' },
    { name: 'Sekou Bah', nation: 'Gine' },
    { name: 'Abdoulaye Conte', nation: 'Gine' },
    { name: 'Sadiq Lawal', nation: 'Nijerya' },
    { name: 'Abdul Bello', nation: 'Nijerya' },
    { name: 'Tunde Adebayo', nation: 'Nijerya' },
    { name: 'Ismail Musa', nation: 'Nijerya' },
    { name: 'Emmanuel Okorie', nation: 'Nijerya' },
    { name: 'Cheikh Ndiaye', nation: 'Senegal' },
    { name: 'Pape Fall', nation: 'Senegal' },
    { name: 'Moussa Diouf', nation: 'Senegal' },
    { name: 'Alioune Sarr', nation: 'Senegal' },
    { name: 'Ibrahima Ba', nation: 'Senegal' },
    { name: 'Yassine Amrani', nation: 'Fas' },
    { name: 'Achraf El Idrissi', nation: 'Fas' },
    { name: 'Mehdi Lahlou', nation: 'Fas' },
    { name: 'Rachid Bensaid', nation: 'Fas' },
    { name: 'Hamza Ouazzani', nation: 'Fas' },
    { name: 'Karim Bouzid', nation: 'Cezayir' },
    { name: 'Nabil Cherif', nation: 'Cezayir' },
    { name: 'Sofiane Amari', nation: 'Cezayir' },
    { name: 'Younes Meddah', nation: 'Cezayir' },
    { name: 'Adel Mokrani', nation: 'Cezayir' },
    { name: 'George Miller', nation: 'ABD' },
    { name: 'Tyler Johnson', nation: 'ABD' },
    { name: 'Logan Peterson', nation: 'ABD' },
    { name: 'Evan Mitchell', nation: 'ABD' },
    { name: 'Noah Campbell', nation: 'ABD' },
    { name: 'Rafael Teodoro', nation: 'Brezilya' },
    { name: 'Lucas Peixoto', nation: 'Brezilya' },
    { name: 'Matheus Loureiro', nation: 'Brezilya' },
    { name: 'Bruno Meireles', nation: 'Brezilya' },
    { name: 'Felipe Guedes', nation: 'Brezilya' },
    { name: 'Caio Magalhaes', nation: 'Brezilya' },
    { name: 'Renato Azevedo', nation: 'Brezilya' },
    { name: 'Igor Paixao', nation: 'Brezilya' },
    { name: 'Diego Fonseca', nation: 'Brezilya' },
    { name: 'Thiago Portela', nation: 'Brezilya' },
    { name: 'Martin Quiroga', nation: 'Arjantin' },
    { name: 'Lucas Gaitano', nation: 'Arjantin' },
    { name: 'Matias Reynoso', nation: 'Arjantin' },
    { name: 'Agustin Cornejo', nation: 'Arjantin' },
    { name: 'Bruno Acosta', nation: 'Arjantin' },
    { name: 'Nicolas Escalante', nation: 'Arjantin' },
    { name: 'Julian Ocampo', nation: 'Arjantin' },
    { name: 'Facundo Ponce', nation: 'Arjantin' },
    { name: 'Tomas Salinas', nation: 'Arjantin' },
    { name: 'Enzo Maffei', nation: 'Arjantin' },
    { name: 'Sergio Beltran', nation: 'Ispanya' },
    { name: 'Alberto Carrillo', nation: 'Ispanya' },
    { name: 'Javier Arrieta', nation: 'Ispanya' },
    { name: 'Pablo Hurtado', nation: 'Ispanya' },
    { name: 'Daniel Oliva', nation: 'Ispanya' },
    { name: 'Mario Cuenca', nation: 'Ispanya' },
    { name: 'Victor Linares', nation: 'Ispanya' },
    { name: 'Hector Zamora', nation: 'Ispanya' },
    { name: 'Ruben Lozoya', nation: 'Ispanya' },
    { name: 'Ignacio Valero', nation: 'Ispanya' },
    { name: 'Davide Sorrentino', nation: 'Italya' },
    { name: 'Marco Bellotto', nation: 'Italya' },
    { name: 'Lorenzo Fiore', nation: 'Italya' },
    { name: 'Andrea Palumbo', nation: 'Italya' },
    { name: 'Stefano Ghidini', nation: 'Italya' },
    { name: 'Riccardo Tonelli', nation: 'Italya' },
    { name: 'Simone Parisi', nation: 'Italya' },
    { name: 'Nicola Barone', nation: 'Italya' },
    { name: 'Giorgio Malaspina', nation: 'Italya' },
    { name: 'Alessandro De Rosa', nation: 'Italya' },
    { name: 'Laurent Chemin', nation: 'Fransa' },
    { name: 'Alexis Bourdin', nation: 'Fransa' },
    { name: 'Kevin Martel', nation: 'Fransa' },
    { name: 'Tristan Boyer', nation: 'Fransa' },
    { name: 'Mathieu Giraud', nation: 'Fransa' },
    { name: 'Cedric Faure', nation: 'Fransa' },
    { name: 'Lucas Pichon', nation: 'Fransa' },
    { name: 'Guillaume Roussel', nation: 'Fransa' },
    { name: 'Florian Da Silva', nation: 'Fransa' },
    { name: 'Nicolas Hebert', nation: 'Fransa' },
    { name: 'Jan Ritter', nation: 'Almanya' },
    { name: 'Moritz Engel', nation: 'Almanya' },
    { name: 'Philipp Adler', nation: 'Almanya' },
    { name: 'Kevin Schuster', nation: 'Almanya' },
    { name: 'Tim Heinemann', nation: 'Almanya' },
    { name: 'Fabian Lorenz', nation: 'Almanya' },
    { name: 'Marcel Voigt', nation: 'Almanya' },
    { name: 'Simon Albrecht', nation: 'Almanya' },
    { name: 'Dennis Hofmann', nation: 'Almanya' },
    { name: 'Pascal Reimann', nation: 'Almanya' },
    { name: 'Aaron Fletcher', nation: 'Ingiltere' },
    { name: 'Jordan Whitby', nation: 'Ingiltere' },
    { name: 'Nathan Collins', nation: 'Ingiltere' },
    { name: 'Ben Atkinson', nation: 'Ingiltere' },
    { name: 'Lewis Turner', nation: 'Ingiltere' },
    { name: 'Jack Rowley', nation: 'Ingiltere' },
    { name: 'Tom Pritchard', nation: 'Ingiltere' },
    { name: 'Adam Wilcox', nation: 'Ingiltere' },
    { name: 'Chris Hollowell', nation: 'Ingiltere' },
    { name: 'Matthew Crowe', nation: 'Ingiltere' },
    { name: 'Milan Stojkovic', nation: 'Sirbistan' },
    { name: 'Nikola Djukic', nation: 'Sirbistan' },
    { name: 'Stefan Radic', nation: 'Sirbistan' },
    { name: 'Luka Vasiljevic', nation: 'Sirbistan' },
    { name: 'Marko Obradovic', nation: 'Sirbistan' },
    { name: 'Ivan Kralj', nation: 'Hirvatistan' },
    { name: 'Dario Sego', nation: 'Hirvatistan' },
    { name: 'Ante Milic', nation: 'Hirvatistan' },
    { name: 'Josip Kvesic', nation: 'Hirvatistan' },
    { name: 'Petar Juric', nation: 'Hirvatistan' },
    { name: 'Marek Kaczor', nation: 'Polonya' },
    { name: 'Piotr Bednarek', nation: 'Polonya' },
    { name: 'Sebastian Laska', nation: 'Polonya' },
    { name: 'Artur Pawlak', nation: 'Polonya' },
    { name: 'Grzegorz Kubiak', nation: 'Polonya' },
    { name: 'Samuel Mensimah', nation: 'Gana' },
    { name: 'Daniel Tetteh', nation: 'Gana' },
    { name: 'Isaac Boadu', nation: 'Gana' },
    { name: 'Michael Frimpong', nation: 'Gana' },
    { name: 'Abdul Karim', nation: 'Gana' },
    { name: 'Moussa Kone', nation: 'Mali' },
    { name: 'Adama Bagayoko', nation: 'Mali' },
    { name: 'Brahima Toure', nation: 'Mali' },
    { name: 'Ismael Sidibe', nation: 'Mali' },
    { name: 'Oumar Sissoko', nation: 'Mali' },
    { name: 'Ahmed Benali', nation: 'Fas' },
    { name: 'Soufiane El Khatib', nation: 'Fas' },
    { name: 'Younes Chakir', nation: 'Fas' },
    { name: 'Mehdi Ouahbi', nation: 'Fas' },
    { name: 'Hamid Rifi', nation: 'Fas' },
    { name: 'George Anderson', nation: 'ABD' },
    { name: 'Caleb Thompson', nation: 'ABD' },
    { name: 'Dylan Ramirez', nation: 'ABD' },
    { name: 'Marcus Lee', nation: 'ABD' },
    { name: 'Trevor Sullivan', nation: 'ABD' },
    { name: 'Eduardo Valente', nation: 'Brezilya' },
    { name: 'Lucas Guimaraes', nation: 'Brezilya' },
    { name: 'Matheus Brandao', nation: 'Brezilya' },
    { name: 'Rafael Queiroz', nation: 'Brezilya' },
    { name: 'Bruno Lemos', nation: 'Brezilya' },
    { name: 'Felipe Rangel', nation: 'Brezilya' },
    { name: 'Thiago Afonso', nation: 'Brezilya' },
    { name: 'Caio Freitas', nation: 'Brezilya' },
    { name: 'Igor Figueiredo', nation: 'Brezilya' },
    { name: 'Renato Pinho', nation: 'Brezilya' },
    { name: 'Nicolas Pereyro', nation: 'Arjantin' },
    { name: 'Lucas Barrionuevo', nation: 'Arjantin' },
    { name: 'Matias Cossio', nation: 'Arjantin' },
    { name: 'Agustin Moretti', nation: 'Arjantin' },
    { name: 'Bruno Varela', nation: 'Arjantin' },
    { name: 'Julian Peralta', nation: 'Arjantin' },
    { name: 'Tomas Altamirano', nation: 'Arjantin' },
    { name: 'Facundo Salvatierra', nation: 'Arjantin' },
    { name: 'Enzo Giordano', nation: 'Arjantin' },
    { name: 'Franco Monzon', nation: 'Arjantin' },
    { name: 'Sergio Montalvo', nation: 'Ispanya' },
    { name: 'Alberto Paredes', nation: 'Ispanya' },
    { name: 'Javier Rosales', nation: 'Ispanya' },
    { name: 'Daniel Benavides', nation: 'Ispanya' },
    { name: 'Pablo Cornejo', nation: 'Ispanya' },
    { name: 'Hector Villena', nation: 'Ispanya' },
    { name: 'Mario Alcazar', nation: 'Ispanya' },
    { name: 'Ruben Fajardo', nation: 'Ispanya' },
    { name: 'Victor Lafuente', nation: 'Ispanya' },
    { name: 'Ignacio Montoro', nation: 'Ispanya' },
    { name: 'Lorenzo Bianchi', nation: 'Italya' },
    { name: 'Marco Serafini', nation: 'Italya' },
    { name: 'Davide Cortesi', nation: 'Italya' },
    { name: 'Andrea Gatti', nation: 'Italya' },
    { name: 'Nicolo Bellotto', nation: 'Italya' },
    { name: 'Simone Ruggieri', nation: 'Italya' },
    { name: 'Paolo DAmico', nation: 'Italya' },
    { name: 'Giacomo Valenti', nation: 'Italya' },
    { name: 'Alessio Mazzanti', nation: 'Italya' },
    { name: 'Federico Orlandi', nation: 'Italya' },
    { name: 'Mathieu Bernard', nation: 'Fransa' },
    { name: 'Alexandre Pelletier', nation: 'Fransa' },
    { name: 'Julien Coste', nation: 'Fransa' },
    { name: 'Romain Leclerc', nation: 'Fransa' },
    { name: 'Theo Mallet', nation: 'Fransa' },
    { name: 'Lucas Briand', nation: 'Fransa' },
    { name: 'Antoine Girard', nation: 'Fransa' },
    { name: 'Baptiste Colin', nation: 'Fransa' },
    { name: 'Maxence Dupre', nation: 'Fransa' },
    { name: 'Nicolas Savary', nation: 'Fransa' },
    { name: 'Florian Becker', nation: 'Almanya' },
    { name: 'Lennard Vogt', nation: 'Almanya' },
    { name: 'Jan Schaefer', nation: 'Almanya' },
    { name: 'Niklas Reinhardt', nation: 'Almanya' },
    { name: 'Kevin Brandt', nation: 'Almanya' },
    { name: 'Patrick Ebert', nation: 'Almanya' },
    { name: 'Simon Wolff', nation: 'Almanya' },
    { name: 'Timo Schenk', nation: 'Almanya' },
    { name: 'Dennis Kruse', nation: 'Almanya' },
    { name: 'Fabian Ullrich', nation: 'Almanya' },
    { name: 'Joshua Perkins', nation: 'Ingiltere' },
    { name: 'Aaron Whitfield', nation: 'Ingiltere' },
    { name: 'Daniel Rowe', nation: 'Ingiltere' },
    { name: 'Sam Thornton', nation: 'Ingiltere' },
    { name: 'Oliver Keane', nation: 'Ingiltere' },
    { name: 'Lewis Hammond', nation: 'Ingiltere' },
    { name: 'Ryan Oakes', nation: 'Ingiltere' },
    { name: 'Matthew Sinclair', nation: 'Ingiltere' },
    { name: 'Jack Holloway', nation: 'Ingiltere' },
    { name: 'Ben Sutherland', nation: 'Ingiltere' },
    { name: 'Milan Petrov', nation: 'Sirbistan' },
    { name: 'Nikola Vukadin', nation: 'Sirbistan' },
    { name: 'Stefan Milosev', nation: 'Sirbistan' },
    { name: 'Luka Karanovic', nation: 'Sirbistan' },
    { name: 'Marko Stanic', nation: 'Sirbistan' },
    { name: 'Ivan Matic', nation: 'Hirvatistan' },
    { name: 'Dario Puljic', nation: 'Hirvatistan' },
    { name: 'Ante Vrdoljak', nation: 'Hirvatistan' },
    { name: 'Josip Prskalo', nation: 'Hirvatistan' },
    { name: 'Petar Kopic', nation: 'Hirvatistan' },
    { name: 'Kamil Urban', nation: 'Polonya' },
    { name: 'Sebastian Krupa', nation: 'Polonya' },
    { name: 'Radoslaw Milewski', nation: 'Polonya' },
    { name: 'Michal Olszewski', nation: 'Polonya' },
    { name: 'Lukasz Borowski', nation: 'Polonya' },
    { name: 'Isaac Antwi', nation: 'Gana' },
    { name: 'Samuel Darko', nation: 'Gana' },
    { name: 'Prince Agyeman', nation: 'Gana' },
    { name: 'Emmanuel Boakye', nation: 'Gana' },
    { name: 'Joseph Ntim', nation: 'Gana' },
    { name: 'Ousmane Diallo', nation: 'Gine' },
    { name: 'Ibrahima Sylla', nation: 'Gine' },
    { name: 'Mamadou Camara', nation: 'Gine' },
    { name: 'Abdoulaye Barry', nation: 'Gine' },
    { name: 'Sekou Conde', nation: 'Gine' },
    { name: 'Sadiq Musa', nation: 'Nijerya' },
    { name: 'Abdul Sadiq', nation: 'Nijerya' },
    { name: 'Tijani Lawal', nation: 'Nijerya' },
    { name: 'Isah Mohammed', nation: 'Nijerya' },
    { name: 'Kabiru Sani', nation: 'Nijerya' },
    { name: 'Cheikh Mbaye', nation: 'Senegal' },
    { name: 'Pape Gueye', nation: 'Senegal' },
    { name: 'Moustapha Ka', nation: 'Senegal' },
    { name: 'Alioune Badji', nation: 'Senegal' },
    { name: 'Ibrahima Cisse', nation: 'Senegal' },
    { name: 'Youssef Lahlafi', nation: 'Fas' },
    { name: 'Hamza Benjelloun', nation: 'Fas' },
    { name: 'Mehdi Ziani', nation: 'Fas' },
    { name: 'Rachid El Ouardi', nation: 'Fas' },
    { name: 'Anass Belkadi', nation: 'Fas' },
    { name: 'Chris Walker', nation: 'ABD' },
    { name: 'Evan Richards', nation: 'ABD' },
    { name: 'Kyle Bennett', nation: 'ABD' },
    { name: 'Justin Morales', nation: 'ABD' },
    { name: 'Andrew Coleman', nation: 'ABD' }
];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate stats based on position and overall skill
export const generateStats = (position: Position, skill: number): PlayerStats => {
    const base = skill;
    const getStat = (multiplier: number, variance = 8) => {
        let val = Math.floor(base * multiplier) + getRandomInt(-variance, variance);
        return Math.min(99, Math.max(1, val));
    };

    // Helper for role-based weights
    const getWeightedStat = (bias: 'TECHNICAL' | 'MENTAL' | 'PHYSICAL' | 'DEFENSIVE' | 'ATTACKING' | 'GENERIC', weight: number = 1.0) => {
        // Base value for the stat
        let val = base * weight;
        
        // Add some random noise
        val += getRandomInt(-10, 10);

        return Math.min(99, Math.max(1, Math.floor(val)));
    };

    let stats: Partial<PlayerStats> = {};

    // 1. PHYSICAL (Common for most but slightly biased by position)
    stats.agility = getWeightedStat('PHYSICAL', 0.95);
    stats.stamina = getWeightedStat('PHYSICAL', 1.0);
    stats.balance = getWeightedStat('PHYSICAL', 0.9);
    stats.physical = getWeightedStat('PHYSICAL', 0.95);
    stats.pace = getWeightedStat('PHYSICAL', 1.0);
    stats.acceleration = getWeightedStat('PHYSICAL', 1.0);
    stats.naturalFitness = getWeightedStat('PHYSICAL', 0.9);
    stats.jumping = getWeightedStat('PHYSICAL', 0.85);

    // 2. MENTAL (Generic Distribution)
    stats.aggression = getWeightedStat('MENTAL', 0.8);
    stats.bravery = getWeightedStat('MENTAL', 0.85);
    stats.workRate = getWeightedStat('MENTAL', 0.95);
    stats.decisions = getWeightedStat('MENTAL', 1.0);
    stats.determination = getWeightedStat('MENTAL', 1.05);
    stats.concentration = getWeightedStat('MENTAL', 0.95);
    stats.leadership = getWeightedStat('MENTAL', 0.5); // Very rare to have high leadership
    stats.anticipation = getWeightedStat('MENTAL', 1.0);
    stats.flair = getWeightedStat('MENTAL', 0.7);
    stats.positioning = getWeightedStat('MENTAL', 0.95);
    stats.composure = getWeightedStat('MENTAL', 0.9);
    stats.teamwork = getWeightedStat('MENTAL', 1.0);
    stats.offTheBall = getWeightedStat('MENTAL', 0.9);
    stats.vision = getWeightedStat('MENTAL', 0.85);

    // 3. TECHNICAL (Position Biased)
    stats.firstTouch = getWeightedStat('TECHNICAL', 0.95);
    stats.technique = getWeightedStat('TECHNICAL', 0.95);
    stats.passing = getWeightedStat('TECHNICAL', 0.9);
    stats.dribbling = getWeightedStat('TECHNICAL', 0.8);
    stats.heading = getWeightedStat('TECHNICAL', 0.8);
    stats.finishing = getWeightedStat('TECHNICAL', 0.5);
    stats.longShots = getWeightedStat('TECHNICAL', 0.5);
    stats.marking = getWeightedStat('TECHNICAL', 0.5);
    stats.tackling = getWeightedStat('TECHNICAL', 0.5);
    stats.crossing = getWeightedStat('TECHNICAL', 0.5);
    stats.corners = getWeightedStat('TECHNICAL', 0.4);
    stats.freeKick = getWeightedStat('TECHNICAL', 0.4);
    stats.penalty = getWeightedStat('TECHNICAL', 0.6);
    stats.longThrows = getWeightedStat('TECHNICAL', 0.2);

    // --- POSITION BIASING ---
    switch (position) {
        case Position.SNT:
            stats.finishing = getWeightedStat('ATTACKING', 1.2);
            stats.offTheBall = getWeightedStat('ATTACKING', 1.15);
            stats.composure = getWeightedStat('ATTACKING', 1.1);
            stats.heading = getWeightedStat('ATTACKING', 1.1);
            stats.acceleration = getWeightedStat('PHYSICAL', 1.1);
            stats.jumping = getWeightedStat('PHYSICAL', 1.1);
            break;
        case Position.SLK:
        case Position.SGK:
            stats.pace = getWeightedStat('PHYSICAL', 1.25);
            stats.acceleration = getWeightedStat('PHYSICAL', 1.25);
            stats.dribbling = getWeightedStat('TECHNICAL', 1.2);
            stats.crossing = getWeightedStat('TECHNICAL', 1.15);
            stats.flair = getWeightedStat('MENTAL', 1.2);
            stats.agility = getWeightedStat('PHYSICAL', 1.2);
            break;
        case Position.OOS:
            stats.vision = getWeightedStat('MENTAL', 1.25);
            stats.passing = getWeightedStat('TECHNICAL', 1.2);
            stats.technique = getWeightedStat('TECHNICAL', 1.2);
            stats.firstTouch = getWeightedStat('TECHNICAL', 1.15);
            stats.flair = getWeightedStat('MENTAL', 1.3);
            stats.decisions = getWeightedStat('MENTAL', 1.1);
            break;
        case Position.OS:
            stats.workRate = getWeightedStat('MENTAL', 1.25);
            stats.stamina = getWeightedStat('PHYSICAL', 1.2);
            stats.passing = getWeightedStat('TECHNICAL', 1.15);
            stats.teamwork = getWeightedStat('MENTAL', 1.15);
            stats.decisions = getWeightedStat('MENTAL', 1.1);
            stats.anticipation = getWeightedStat('MENTAL', 1.1);
            break;
        case Position.SLB:
        case Position.SGB:
            stats.pace = getWeightedStat('PHYSICAL', 1.15);
            stats.stamina = getWeightedStat('PHYSICAL', 1.15);
            stats.tackling = getWeightedStat('DEFENSIVE', 1.1);
            stats.marking = getWeightedStat('DEFENSIVE', 1.05);
            stats.crossing = getWeightedStat('TECHNICAL', 1.1);
            stats.workRate = getWeightedStat('MENTAL', 1.1);
            break;
        case Position.STP:
            stats.tackling = getWeightedStat('DEFENSIVE', 1.25);
            stats.marking = getWeightedStat('DEFENSIVE', 1.25);
            stats.physical = getWeightedStat('PHYSICAL', 1.2);
            stats.jumping = getWeightedStat('PHYSICAL', 1.2);
            stats.heading = getWeightedStat('TECHNICAL', 1.15);
            stats.positioning = getWeightedStat('MENTAL', 1.2);
            stats.bravery = getWeightedStat('MENTAL', 1.15);
            break;
        case Position.GK:
            // Generic GKs get higher "defensive" tech stats used as reflexes/handling/etc
            stats.anticipation = getWeightedStat('MENTAL', 1.15);
            stats.concentration = getWeightedStat('MENTAL', 1.2);
            stats.agility = getWeightedStat('PHYSICAL', 1.2);
            stats.positioning = getWeightedStat('MENTAL', 1.1);
            stats.bravery = getWeightedStat('MENTAL', 1.2);
            // Handling-like techs
            stats.firstTouch = getWeightedStat('TECHNICAL', 1.1);
            stats.passing = getWeightedStat('TECHNICAL', 0.8);
            break;
    }

    // Set legacy fields for engine compatibility
    stats.shooting = stats.finishing;
    stats.defending = Math.floor(((stats.marking || 50) + (stats.tackling || 50)) / 2);

    return stats as PlayerStats;
};

// --- UPDATED DETAILED VALUE CALCULATION ---
export const calculateMarketValue = (position: Position, skill: number, age: number): number => {
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
export const generatePlayer = (position: Position, targetSkill: number, teamId: string, canBeForeign: boolean = true, jersey?: string, clubName?: string): Player => {
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

    // --- POTENTIAL CALCULATION (NEW REALISTIC LOGIC) ---
    let potential = skill; // Default is current skill

    if (age > 30) {
        // 30+: No more growth potential
        potential = skill;
    } else if (age >= 25) {
        // 25-30: Very limited growth (1-2 points)
        potential = Math.min(95, skill + Math.floor(Math.random() * 2) + 1);
    } else if (age >= 22) {
        // 22-25: Limited potential (Max ~90, typically lower)
        const room = 90 - skill;
        if (room > 0) {
            potential = skill + Math.floor(Math.random() * room * 0.5); 
            if (potential > 90) potential = 90; 
        } else {
            potential = skill; 
        }
    } else {
        // 16-21: GENÇ YETENEK MANTIĞI (REVISED for STRICT REALISM)
        const genTalentRoll = Math.random();

        if (genTalentRoll < 0.001) {
            // Generational Talent (%0.1) -> 94-95
            potential = Math.floor(Math.random() * 2) + 94; 
        } else if (genTalentRoll < 0.006) { 
            // Ultra Elite / Future Balon d'Or (%0.5) -> 92-93
            potential = Math.floor(Math.random() * 2) + 92;
        } else if (genTalentRoll < 0.021) {
            // Wonderkid (%1.5) -> 90-91
            potential = Math.floor(Math.random() * 2) + 90;
        } else {
            // Standard Potential Calculation
            if (skill < 75) {
                // Decent prospect: 75-85
                potential = Math.floor(Math.random() * 11) + 75;
            } else {
                // Already good: Skill + small growth, capped at 89 usually
                // But extremely rare chance to hit 90 via this path (very unlikely due to min)
                potential = Math.min(89, skill + Math.floor(Math.random() * 8) + 3);
            }
        }
    }
    
    // Safety check: Potential can never be lower than current skill
    potential = Math.max(skill, potential);


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
    // Update to use new physical stat
    if (stats.physical < 60) baseSusceptibility += 10;
    if (Math.random() < 0.1) baseSusceptibility += 30;

    const injurySusceptibility = Math.min(100, Math.max(1, baseSusceptibility));

    // NEW PLAYER DATA
    const height = position === Position.GK ? getRandomInt(185, 205) : getRandomInt(170, 198);
    const footRoll = Math.random();
    const preferredFoot = footRoll < 0.75 ? 'Sağ' : footRoll < 0.95 ? 'Sol' : 'Her İkisi';
    const contractExpiry = 2025 + getRandomInt(1, 5);

    return {
        id: generateId(),
        name,
        position,
        secondaryPosition,
        skill,
        potential, // Set the calculated potential
        stats,
        seasonStats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratings: [], averageRating: 0, matchesPlayed: 0 }, 
        face: faceData,
        jersey,
        age,
        height,
        preferredFoot,
        contractExpiry,
        value,
        nationality: nation,
        teamId,
        clubName, // ASSIGNED HERE
        morale: getRandomInt(70, 100),
        condition: getRandomInt(90, 100), // NEW: Start of season condition is high
        injurySusceptibility,
        injuryHistory: []
    };
};
