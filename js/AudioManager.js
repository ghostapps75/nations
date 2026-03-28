class AudioManager {
    constructor() {
        this.basePath = './assets/audio/aidanvoice/';
        this.pools = {
            intro: [
                'choose.a.category.mp3',
                'mynameisaidan-intro.mp3',
                'think you can beat me intro.mp3',
                'up.for.a.challenge.mp3'
            ],
            win: [
                'bragging.mp3',
                'chirping.mp3',
                'gloating.mp3',
                'haha.i.win.mp3',
                'i got ya.mp3',
                'i.am.the.champion.mp3',
                'i.love.winning.mp3',
                'nations.with.aidan.lets.play.mp3'
            ],
            lose: [
                'after a loss.mp3',
                'bored.mp3',
                'embarassed.mp3',
                'mindblowing.mp3',
                'nervous.mp3',
                'not.my.day.mp3',
                'shouda.seen.a.movie.mp3',
                'what.just.happened.mp3',
                'you.cant.be.that.good.mp3',
                'you.got.lucky.mp3'
            ]
        };

        this.folders = {
            intro: 'intros/',
            win: 'after winning/',
            lose: 'after losing/'
        };

        this.unplayed = { intro: [], win: [], lose: [] };
        this.currentAudio = null;
    }

    playRandom(category) {
        if (!this.pools[category]) return;
        
        if (this.unplayed[category].length === 0) {
            this.unplayed[category] = [...this.pools[category]].sort(() => Math.random() - 0.5);
        }
        
        const randomFile = this.unplayed[category].pop();
        const fullPath = this.basePath + this.folders[category] + randomFile;
        
        this.stop();
        this.currentAudio = new Audio(fullPath);
        this.currentAudio.play().catch(e => console.warn(`Audio play failed for ${fullPath}:`, e));
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }
}
