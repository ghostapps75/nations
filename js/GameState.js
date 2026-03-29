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
            GDP: 25462,
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



    resolveRound() {
        if (!this.roundResult) return;
        const { winner } = this.roundResult;

        if (winner === 'player') {
            this.playerScore++;
            this.cpuDeck.shift();
            if (this.drawPile.length < 1) this.drawPile = [...this.allCards].sort(() => Math.random() - 0.5);
            this.cpuDeck.push(this.drawPile.shift());
        } else if (winner === 'cpu') {
            this.cpuScore++;
            this.playerDeck.shift();
            if (this.drawPile.length < 1) this.drawPile = [...this.allCards].sort(() => Math.random() - 0.5);
            this.playerDeck.push(this.drawPile.shift());
        } else {
            this.playerDeck.shift();
            this.cpuDeck.shift();
            if (this.drawPile.length < 2) this.drawPile = [...this.allCards].sort(() => Math.random() - 0.5);
            this.playerDeck.push(this.drawPile.shift());
            this.cpuDeck.push(this.drawPile.shift());
        }
        
        this.currentTurn = (this.currentTurn === 'player') ? 'cpu' : 'player';

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
        
        // VISUAL ORDER: Area, Pop, GDP, Elev, Neighbors
        const stats = ['Area', 'Population', 'GDP', 'HighestPoint', 'NeighboringCountries'];
        let pickedStat = stats[0];

        if (this.difficulty === 'easy') pickedStat = stats[Math.floor(Math.random() * stats.length)];
        else if (this.difficulty === 'medium') {
            if (Math.random() > 0.6) pickedStat = stats[Math.floor(Math.random() * stats.length)];
            else pickedStat = this.getBestStat(card, stats);
        } else pickedStat = this.getBestStat(card, stats);

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
}