class AudioManager {
    constructor() {
        this.basePath = './assets/audio/';
        this.voiceMode = 'aidan'; // default to aidan

        this.pools = {
            aidan: {
                intro: [
                    'choose.a.category.mp3',
                    'mynameisaidan-intro.mp3',
                    'think you can beat me intro.mp3',
                    'up.for.a.challenge.mp3',
                    'nations.with.aidan.lets.play.mp3'
                ],
                win: [
                    'bragging.mp3',
                    'chirping.mp3',
                    'gloating.mp3',
                    'haha.i.win.mp3',
                    'i got ya.mp3',
                    'i.am.the.champion.mp3',
                    'i.love.winning.mp3'
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
            }
        };

        this.folders = {
            aidan: {
                intro: 'aidanvoice/intros/',
                win: 'aidanvoice/after winning/',
                lose: 'aidanvoice/after losing/'
            }
        };

        this.unplayed = { 
            aidan: { intro: [], win: [], lose: [] }
        };
        
        // WebAudio API for bulletproof Safari mobile playback
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.currentSource = null;
    }



    unlock() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    async playRandom(category) {
        const currentPools = this.pools[this.voiceMode];
        if (!currentPools || !currentPools[category] || currentPools[category].length === 0) return;
        
        const currentUnplayed = this.unplayed[this.voiceMode];
        if (currentUnplayed[category].length === 0) {
            currentUnplayed[category] = [...currentPools[category]].sort(() => Math.random() - 0.5);
        }
        
        const randomFile = currentUnplayed[category].pop();
        const fullPath = this.basePath + this.folders[this.voiceMode][category] + randomFile;
        
        this.stop();
        
        try {
            const res = await fetch(fullPath);
            const arrayBuffer = await res.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            
            this.currentSource = this.ctx.createBufferSource();
            this.currentSource.buffer = audioBuffer;
            this.currentSource.connect(this.ctx.destination);
            this.currentSource.start(0);
        } catch (e) {
            console.warn(`WebAudio API play failed for ${fullPath}:`, e);
            // Fallback for extremely old browsers if decodeAudioData fails
            const fb = new Audio(fullPath);
            fb.play().catch(()=>{});
        }
    }

    stop() {
        if (this.currentSource) {
            try { this.currentSource.stop(); } catch (e) {}
            this.currentSource = null;
        }
    }
}
