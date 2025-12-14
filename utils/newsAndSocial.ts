
import { Fixture, Team, NewsItem, Message, Player } from '../types';
import { generateId, RIVALRIES } from '../constants';
import { FAN_NAMES, DERBY_TWEETS_WIN, DERBY_TWEETS_LOSS, FAN_TWEETS_WIN, FAN_TWEETS_LOSS, FAN_TWEETS_DRAW, RESIGNATION_TWEETS } from '../data/tweetPool';
import { getGameDate, isTransferWindowOpen } from './calendarAndFixtures';

// --- FAN TWEETS LOGIC ---

export const generateMatchTweets = (fixture: Fixture, teams: Team[], isUserTeam: boolean = false): NewsItem[] => {
    const home = teams.find(t => t.id === fixture.homeTeamId);
    const away = teams.find(t => t.id === fixture.awayTeamId);
    
    if (!home || !away || fixture.homeScore === null || fixture.awayScore === null) return [];

    const isDerby = RIVALRIES.some(pair => 
        (pair.includes(home.name) && pair.includes(away.name))
    );

    const tweets: NewsItem[] = [];
    const tweetCount = isUserTeam ? 4 : (isDerby ? 3 : 2); 

    const getRandomFan = () => FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
    
    // Shuffle helper to avoid consecutive duplicates
    const shuffle = (array: string[]) => array.sort(() => 0.5 - Math.random());

    let homePool: string[] = [];
    let awayPool: string[] = [];
    
    // Merge standard and derby tweets if it's a derby
    const winSource = isDerby ? [...DERBY_TWEETS_WIN, ...DERBY_TWEETS_WIN, ...FAN_TWEETS_WIN] : [...FAN_TWEETS_WIN];
    const lossSource = isDerby ? [...DERBY_TWEETS_LOSS, ...DERBY_TWEETS_LOSS, ...FAN_TWEETS_LOSS] : [...FAN_TWEETS_LOSS];
    const drawSource = [...FAN_TWEETS_DRAW];

    if (fixture.homeScore > fixture.awayScore) {
        // Home Won: Home fans Happy, Away fans Angry
        homePool = shuffle(winSource);
        awayPool = shuffle(lossSource);
    } else if (fixture.homeScore < fixture.awayScore) {
        // Away Won: Home fans Angry, Away fans Happy
        homePool = shuffle(lossSource);
        awayPool = shuffle(winSource);
    } else {
        // Draw: Both mixed
        homePool = shuffle(drawSource);
        awayPool = shuffle(drawSource);
    }

    // We alternate creating tweets for home and away fans to keep the feed diverse
    for (let i = 0; i < tweetCount; i++) {
        // Even index = Home Fan Tweet, Odd index = Away Fan Tweet
        const isHomeFan = i % 2 === 0;
        
        const fan = getRandomFan();
        const content = isHomeFan ? homePool[i % homePool.length] : awayPool[i % awayPool.length];
        const fanTeam = isHomeFan ? home : away;
        
        // Format: "Name|Handle|TeamName" to pass structure to UI
        const fanTitle = `${fan.name}|${fan.handle}|${fanTeam.name}`;

        tweets.push({
            id: generateId(),
            week: fixture.week,
            type: 'MATCH', // Re-using MATCH type for tweets related to matches
            title: fanTitle, 
            content: content
        });
    }

    return tweets;
};

export const generateResignationTweets = (week: number, myTeam: Team): NewsItem[] => {
    const tweets: NewsItem[] = [];
    const count = 3; // Generate 3 angry tweets

    for(let i=0; i<count; i++) {
        const fan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
        const content = RESIGNATION_TWEETS[Math.floor(Math.random() * RESIGNATION_TWEETS.length)];
        
        tweets.push({
            id: generateId(),
            week,
            type: 'MATCH', // Use MATCH type for tweets
            title: `${fan.name}|${fan.handle}|${myTeam.name}`,
            content: content
        });
    }
    return tweets;
};

export const generateWeeklyNews = (week: number, fixtures: Fixture[], teams: Team[], myTeamId?: string | null): NewsItem[] => {
    const socialFeed: NewsItem[] = [];
    
    // Filter for played matches this week
    const playedFixtures = fixtures.filter(f => f.week === week && f.played);

    playedFixtures.forEach(fixture => {
        // If it's the user's match, skip it because tweets were generated instantly after match
        if (myTeamId && (fixture.homeTeamId === myTeamId || fixture.awayTeamId === myTeamId)) {
            return;
        }

        // For other computer matches, generate tweets
        const matchTweets = generateMatchTweets(fixture, teams, false);
        socialFeed.push(...matchTweets);
    });

    // --- TRANSFER WINDOW FAN REACTIONS ---
    if (isTransferWindowOpen(week)) {
        
        // 1. Generic Rumors & Demands
        const genericRumors = [
            "Yönetim uyuma transfer yap! Takımın takviyeye ihtiyacı var.",
            "Orta saha çöktü, transfer lazım!",
            "Bir tane golcü almamız şart!",
            "Bu takıma 10 numara lazım, oyun kuramıyoruz.",
            "Savunma evlere şenlik, stoper alın.",
            "Kanatlar çalışmıyor, hızlı bir açık oyuncusu şart.",
            "Transfer dönemi bitiyor hala ses yok, sabrımız taşıyor.",
            "Genç yeteneklere yönelmemiz lazım.",
            "Yıldız transferi bekliyoruz başkan!",
            "Başkan, kasayı açma zamanı geldi!",
            "Bir tane oyun kurucu getirseniz yeter lan SİKERİM BÖYLE YÖNETİMİ!",
            "Transfer istiyoruz, açıklama değil!",
            "Bu takıma lider stoper lazım.",
            "Transfer yoksa başarı da yok.",
            "Başkan bu taraftarın sabrı kalmadı.",
            "Genç değil direkt oynayacak adam lazım!",
            "Rakipler çağı yakaladı biz hala bekliyoruz.",
            "Lige damga vuracak bir yıldız lazım.",
            "Yönetim bu transfer işini ciddiye alsın.",
        ];

        // Only generate user-specific transfer demands if user team is known
        if (myTeamId) {
            const myTeam = teams.find(t => t.id === myTeamId);
            const myLastFixture = playedFixtures.find(f => f.homeTeamId === myTeamId || f.awayTeamId === myTeamId);

            if (myTeam) {
                const fan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                
                // Logic 1: Bad Performance Targeting
                if (myLastFixture && myLastFixture.stats) {
                    const myRatings = myLastFixture.homeTeamId === myTeamId ? myLastFixture.stats.homeRatings : myLastFixture.stats.awayRatings;
                    // Find a player with bad rating (< 6.0)
                    const badPlayer = myRatings.find(p => p.rating < 6.0);
                    
                    if (badPlayer && Math.random() > 0.5) {
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan.name}|${fan.handle}|${myTeam.name}`,
                            content: `${badPlayer.name} bu takımın oyuncusu değil. Derhal gönderilmeli ve yerine adam alınmalı!`
                        });
                    }
                }

                // Logic 2: Need Striker (If scored 0 goals in last match)
                if (myLastFixture) {
                    const myScore = myLastFixture.homeTeamId === myTeamId ? myLastFixture.homeScore : myLastFixture.awayScore;
                    if (myScore === 0 && Math.random() > 0.6) {
                        const fan2 = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan2.name}|${fan2.handle}|${myTeam.name}`,
                            content: "İleri uçta çoğalamıyoruz, gol yollarında etkisiziz. Acil forvet transferi şart!"
                        });
                    }
                    
                    // Logic 3: Need Defender (If conceded 2+ goals)
                    const oppScore = myLastFixture.homeTeamId === myTeamId ? myLastFixture.awayScore : myLastFixture.homeScore;
                    if (oppScore !== null && oppScore >= 2 && Math.random() > 0.6) {
                        const fan3 = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan3.name}|${fan3.handle}|${myTeam.name}`,
                            content: "Savunma yol geçen hanı oldu. Yönetim stoper almıyor mu, bizi mi sınıyor?"
                        });
                    }
                }

                // Logic 4: Don't Sell Star Player
                if (Math.random() > 0.7) {
                    const starPlayer = [...myTeam.players].sort((a,b) => b.value - a.value)[0];
                    if (starPlayer) {
                         const fan4 = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                         socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan4.name}|${fan4.handle}|${myTeam.name}`,
                            content: `${starPlayer.name} kırmızı çizgimizdir! Ona gelen teklifleri reddedin, takımı sırtlayan o.`
                        });
                    }
                }
            }
        }

        // Add a random generic rumor from another team
        if (Math.random() > 0.3) {
            const randomFan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            const content = genericRumors[Math.floor(Math.random() * genericRumors.length)];
            
            socialFeed.push({
                id: generateId(),
                week,
                type: 'TRANSFER',
                title: `${randomFan.name}|${randomFan.handle}|${randomTeam.name}`,
                content: content
            });
        }
    }

    return socialFeed.reverse(); // Newest first
};

// --- PLAYER COMPLAINTS GENERATOR ---
export const generatePlayerMessages = (week: number, myTeam: Team, fixtures: Fixture[]): Message[] => {
    // Requires at least 3 weeks of data to judge "last 3 games"
    if (week <= 3) return [];

    // Find the last 3 matches for the user's team that have been played
    const teamMatches = fixtures
        .filter(f => f.played && (f.homeTeamId === myTeam.id || f.awayTeamId === myTeam.id))
        .sort((a, b) => b.week - a.week) // Sort descending by week (newest first)
        .slice(0, 3); // Take top 3

    // If for some reason we don't have 3 matches (e.g. bye weeks), skip
    if (teamMatches.length < 3) return [];

    const complainingPlayers: Player[] = [];

    // Iterate through all players to find those who didn't play
    myTeam.players.forEach(player => {
        // Don't complain if injured or suspended (they know why they aren't playing)
        if (player.injury || (player.suspendedUntilWeek && player.suspendedUntilWeek > week)) return;

        // Check if player appeared in ANY of the last 3 matches
        const playedRecently = teamMatches.some(match => {
            const stats = match.stats;
            // Defensive check if stats don't exist
            if (!stats) return false;

            const isHome = match.homeTeamId === myTeam.id;
            // Check rating lists to see if player played
            const playerPerformanceList = isHome ? stats.homeRatings : stats.awayRatings;
            
            return playerPerformanceList.some(p => p.playerId === player.id);
        });

        // If NOT played recently, add to candidates
        if (!playedRecently) {
             complainingPlayers.push(player);
        }
    });

    // Limit to MAXIMUM 1 message per week
    if (complainingPlayers.length === 0) return [];

    // Pick one random unhappy player
    const player = complainingPlayers[Math.floor(Math.random() * complainingPlayers.length)];

    // Generate Message Content
    // Random chance (e.g. 30% per week for unhappy players) to avoid spamming every single week
    // Also higher chance if morale is already low
    const complaintChance = player.morale < 70 ? 0.4 : 0.2;
    
    if (Math.random() < complaintChance) {
        const isStar = player.skill > 80;
        
        let subject = "Forma Şansı";
        let text = "Hocam, son 3 maçtır forma yüzü göremiyorum. Kendimi göstermek istiyorum.";
        let options = [
            "Çok çalış, formayı kap.",
            "Sıran gelecek, sabırlı ol.",
            "Şu an kadro planlamamda yoksun."
        ];

        if (isStar) {
            subject = "Durumum Hakkında Acil";
            text = "Hocam, ben yedek kulübesinde oturmak için gelmedim. Son 3 maçtır yokum, eğer oynamayacaksam menajerimle konuşacağım.";
            options = [
                "Sen bu takımın yıldızısın, haklısın. İlk maçta sahadasın.",
                "Kimse bu takımda formayı garanti göremez, çalışacaksın.",
                "Kapı orada, gitmek istersen tutmam."
            ];
        } 

        return [{
            id: parseInt(generateId() + Math.floor(Math.random() * 1000).toString(), 36) || Date.now() + Math.random(),
            sender: player.name,
            subject: subject,
            preview: text,
            date: 'Bugün',
            read: false,
            avatarColor: player.position === 'GK' ? 'bg-yellow-600' : player.position === 'DEF' ? 'bg-blue-600' : player.position === 'MID' ? 'bg-green-600' : 'bg-red-600',
            history: [
                { id: Date.now(), text: text, time: '09:00', isMe: false }
            ],
            options: options
        }];
    }

    return [];
};