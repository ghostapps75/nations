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

        this.sfxPools = {
            'lose challenge': ['mixkit-arcade-space-shooter-dead-notification-272.wav', 'mixkit-cartoon-whistle-game-over-606.wav', 'mixkit-crowd-disappointment-long-boo-463.wav', 'mixkit-game-over-dark-orchestra-633.wav', 'mixkit-robot-system-fail-2960.wav', 'mixkit-wrong-answer-bass-buzzer-948.wav'],
            'lose game': ['mixkit-fairytale-game-over-1945.wav', 'mixkit-game-over-trombone-1940.wav', 'mixkit-sad-game-over-trombone-471.wav'],
            'lose point': ['mixkit-failure-arcade-alert-notification-240.wav', 'mixkit-record-player-vinyl-scratch-702.wav', 'mixkit-system-beep-buzzer-fail-2964.wav'],
            'win challenge': ['mixkit-animated-small-group-applause-523.wav', 'mixkit-correct-answer-reward-952.wav'],
            'win point': ['mixkit-achievement-bell-600.wav', 'mixkit-arcade-bonus-alert-767.wav', 'mixkit-correct-answer-notification-947.wav', 'mixkit-correct-answer-tone-2870.wav', 'mixkit-male-voice-cheer-2010.wav', 'mixkit-melodic-bonus-collect-1938.wav', 'mixkit-winning-swoosh-2017.wav'],
            'winning game': ['mixkit-auditorium-moderate-applause-and-cheering-502.wav', 'mixkit-cheering-crowd-loud-whistle-610 (1).wav', 'mixkit-cheering-crowd-loud-whistle-610.wav', 'mixkit-huge-crowd-cheering-victory-462.wav']
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
        
        this.sfxUnplayed = {
            'lose challenge': [], 'lose game': [], 'lose point': [], 'win challenge': [], 'win point': [], 'winning game': []
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

    playSFX(category) {
        return new Promise((resolve) => {
            if (!this.sfxPools[category] || this.sfxPools[category].length === 0) return resolve();
            
            if (this.sfxUnplayed[category].length === 0) {
                this.sfxUnplayed[category] = [...this.sfxPools[category]].sort(() => Math.random() - 0.5);
            }
            const randomFile = this.sfxUnplayed[category].pop();
            const fullPath = this.basePath + category + '/' + randomFile;
            
            const playWithWebAudio = async () => {
                try {
                    const res = await fetch(fullPath);
                    const arrayBuffer = await res.arrayBuffer();
                    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                    const source = this.ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(this.ctx.destination);
                    source.onended = () => resolve();
                    source.start(0);
                } catch (e) {
                    console.warn(`WebAudio fallback SFX: ${fullPath}`, e);
                    const fb = new Audio(fullPath);
                    fb.onended = () => resolve();
                    fb.onloadedmetadata = () => { setTimeout(() => resolve(), (fb.duration * 1000) + 100); };
                    fb.play().catch(()=>{ resolve(); });
                }
            };
            playWithWebAudio();
        });
    }

    playRandom(category) {
        return new Promise(async (resolve) => {
            const currentPools = this.pools[this.voiceMode];
            if (!currentPools || !currentPools[category] || currentPools[category].length === 0) return resolve();
            
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
                
                this.currentSource.onended = () => resolve();
                
                this.currentSource.start(0);
            } catch (e) {
                console.warn(`WebAudio API play failed for ${fullPath}:`, e);
                // Fallback for extremely old browsers if decodeAudioData fails
                const fb = new Audio(fullPath);
                fb.onended = () => resolve();
                fb.onloadedmetadata = () => { setTimeout(() => resolve(), fb.duration * 1000 + 100); };
                fb.play().catch(()=>{ resolve(); });
            }
        });
    }

    stop() {
        if (this.currentSource) {
            try { this.currentSource.stop(); } catch (e) {}
            this.currentSource = null;
        }
    }
}
