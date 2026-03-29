class GameState {
    constructor(countriesData) {
        this.allCards = countriesData;
        this.playerDeck = [];
        this.cpuDeck = [];
        this.drawPile = [];
        this.playerScore = 0;
        this.cpuScore = 0;
        this.currentTurn = 'player';
        this.state = 'waiting_for_start';
        this.difficulty = 'medium';
        this.TARGET_SCORE = 10;

        this.maxStats = {
            GDP_PerCapita: 203853,
            Area: 6601670, 
            Population: 1439323776, 
            HighestPoint: 29029, 
            NeighboringCountries: 14 
        };
    }

    setDifficulty(level) { this.difficulty = level; }
    setDeckSize(size) { this.TARGET_SCORE = size; }

    startGame() {
        this.drawPile = [...this.allCards].sort(() => Math.random() - 0.5);
        this.playerDeck = [this.drawPile.shift()];
        this.cpuDeck = [this.drawPile.shift()];
        this.playerScore = 0;
        this.cpuScore = 0;
        this.currentTurn = 'player';
        this.state = 'waiting_for_input';
    }

    get playerCurrentCard() { return this.playerDeck[0]; }
    get cpuCurrentCard() { return this.cpuDeck[0]; }

    evaluateTurn(statName) {
        if (this.state !== 'waiting_for_input') return null;
        this.state = 'resolving_round';
        
        const playerCard = this.playerDeck[0];
        const cpuCard = this.cpuDeck[0];

        const pVal = playerCard[statName];
        const cVal = cpuCard[statName];

        let winner = 'draw';
        if (pVal > cVal) winner = 'player';
        else if (cVal > pVal) winner = 'cpu';

        this.roundResult = { winner, statName, playerCard, cpuCard, isChallenge: false };
        return this.roundResult;
    }

    triggerChallenge() {
        if (this.state !== 'waiting_for_input') return null;
        this.state = 'waiting_for_challenge_response';

        const playerCard = this.playerDeck[0];
        const cpuCard = this.cpuDeck[0]; 

        const types = ['flag', 'capital', 'reverse_flag']; 
        const type = types[Math.floor(Math.random() * types.length)];

        let question = "";
        let headerImage = null; 
        let correctAnswer = ""; 
        let options = []; 

        if (type === 'flag') {
            question = "Aidan shows a flag. Name the country!";
            headerImage = cpuCard.FlagImageURL;
            correctAnswer = cpuCard.Name;
            const wrongOpts = this.getWrongOptions(cpuCard.Name, 'Name', 3, cpuCard);
            options = [cpuCard.Name, ...wrongOpts].sort(() => Math.random() - 0.5)
                        .map(t => ({ text: t, image: null }));

        } else if (type === 'capital') {
            question = `What is the capital of ${cpuCard.Name}?`;
            correctAnswer = cpuCard.Capital;
            const wrongOpts = this.getWrongOptions(cpuCard.Capital, 'Capital', 3, cpuCard);
            options = [cpuCard.Capital, ...wrongOpts].sort(() => Math.random() - 0.5)
                        .map(t => ({ text: t, image: null }));
        } else if (type === 'reverse_flag') {
            question = `Which flag belongs to ${cpuCard.Name}?`;
            correctAnswer = cpuCard.FlagImageURL;
            const wrongOpts = this.getWrongOptions(cpuCard.FlagImageURL, 'FlagImageURL', 3, cpuCard);
            options = [cpuCard.FlagImageURL, ...wrongOpts].sort(() => Math.random() - 0.5)
                        .map(url => ({ text: null, image: url })); 
        }

        this.roundResult = {
            isChallenge: true, type, question, headerImage, options, correctAnswer, playerCard, cpuCard
        };
        return this.roundResult;
    }

    getWrongOptions(correctVal, field, count, correctCard) {
        let pool = [...this.allCards];
        
        if (correctCard && this.difficulty === 'easy') {
            pool.sort((a, b) => a.Area - b.Area);
            const index = pool.findIndex(c => c.Name === correctCard.Name);
            if (index > pool.length / 2) pool = pool.slice(0, 30);
            else pool = pool.slice(-30);
        } else if (correctCard && this.difficulty === 'hard') {
            pool.sort((a, b) => a.Area - b.Area);
            const index = pool.findIndex(c => c.Name === correctCard.Name);
            const start = Math.max(0, index - 10);
            pool = pool.slice(start, start + 21);
        }

        const wrongs = [];
        let attempts = 0;
        while(wrongs.length < count && attempts < 100) {
            attempts++;
            const r = pool[Math.floor(Math.random() * pool.length)];
            const val = r[field];
            if (val !== correctVal && !wrongs.includes(val)) wrongs.push(val);
        }
        
        // Fallback safety
        while(wrongs.length < count) {
            const r = this.allCards[Math.floor(Math.random() * this.allCards.length)];
            const val = r[field];
            if (val !== correctVal && !wrongs.includes(val)) wrongs.push(val);
        }
        return wrongs;
    }

    resolveChallenge(userWon) {
        this.roundResult.winner = userWon ? 'player' : 'cpu';
        return this.roundResult;
    }


    resolveRound() {
        if (!this.roundResult) return;
        const { winner } = this.roundResult;

        this.playerDeck.shift();
        this.cpuDeck.shift();

        if (winner === 'player') {
            this.playerScore++;
        } else if (winner === 'cpu') {
            this.cpuScore++;
        }
        
        this.currentTurn = (this.currentTurn === 'player') ? 'cpu' : 'player';

        if (this.drawPile.length < 2) {
            this.drawPile = [...this.allCards].sort(() => Math.random() - 0.5);
        }
        
        this.playerDeck.push(this.drawPile.shift());
        this.cpuDeck.push(this.drawPile.shift());

        this.checkWinCondition();
    }

    checkWinCondition() {
        if (this.playerScore >= this.TARGET_SCORE || this.cpuScore >= this.TARGET_SCORE) {
            this.state = 'game_over';
        } else {
            this.state = 'waiting_for_input';
            if (this.currentTurn === 'cpu') {
                setTimeout(() => this.cpuDecide(), 1000);
            }
        }
    }

    cpuDecide() {
        if (this.currentTurn !== 'cpu' || this.state !== 'waiting_for_input') return;
        const card = this.cpuCurrentCard;
        
        // VISUAL ORDER: Area, Pop, GDP_PerCapita, Elev, Neighbors
        const stats = ['Area', 'Population', 'GDP_PerCapita', 'HighestPoint', 'NeighboringCountries'];
        let pickedStat = stats[0];

        if (this.difficulty === 'easy') {
            pickedStat = Math.random() > 0.15 ? stats[Math.floor(Math.random() * stats.length)] : this.getBestStat(card, stats);
        } else if (this.difficulty === 'medium') {
            pickedStat = Math.random() > 0.70 ? stats[Math.floor(Math.random() * stats.length)] : this.getBestStat(card, stats);
        } else {
            pickedStat = Math.random() > 0.85 ? stats[Math.floor(Math.random() * stats.length)] : this.getBestStat(card, stats);
        }

        if (this.onCpuPick) this.onCpuPick(pickedStat);
        else this.evaluateTurn(pickedStat);
    }

    getBestStat(card, stats) {
        let best = stats[0];
        let maxScore = -1;
        stats.forEach(s => {
            const score = card[s] / this.maxStats[s];
            if (score > maxScore) { maxScore = score; best = s; }
        });
        return best;
    }

    isPoorCard(card) {
        const stats = ['Area', 'Population', 'GDP_PerCapita', 'HighestPoint', 'NeighboringCountries'];
        for (let s of stats) {
            if ((card[s] / this.maxStats[s]) > 0.20) {
                return false; 
            }
        }
        return true;
    }
}