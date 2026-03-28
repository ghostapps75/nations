class GameState {
    constructor(countriesData) {
        this.allCards = countriesData;
        this.playerDeck = [];
        this.cpuDeck = [];
        this.holdingPool = [];
        this.currentTurn = 'player';
        this.state = 'waiting_for_start';
        this.difficulty = 'medium';
        this.GAME_DECK_SIZE = 20; 

        this.maxStats = {
            GDP: 25462,
            Area: 6601670, 
            Population: 1439323776, 
            HighestPoint: 29029, 
            NeighboringCountries: 14 
        };
    }

    setDifficulty(level) { this.difficulty = level; }
    setDeckSize(size) { this.GAME_DECK_SIZE = size; }

    startGame() {
        const fullShuffle = [...this.allCards].sort(() => Math.random() - 0.5);
        const deckSize = Math.min(this.GAME_DECK_SIZE, fullShuffle.length);
        const gameDeck = fullShuffle.slice(0, deckSize);

        const mid = Math.floor(gameDeck.length / 2);
        this.playerDeck = gameDeck.slice(0, mid);
        this.cpuDeck = gameDeck.slice(mid);
        this.holdingPool = [];
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
            const wrongOpts = this.getWrongOptions(cpuCard.Name, 'Name', 3);
            options = [cpuCard.Name, ...wrongOpts].sort(() => Math.random() - 0.5)
                        .map(t => ({ text: t, image: null }));

        } else if (type === 'capital') {
            question = `What is the capital of ${cpuCard.Name}?`;
            correctAnswer = cpuCard.Capital;
            const wrongOpts = this.getWrongOptions(cpuCard.Capital, 'Capital', 3);
            options = [cpuCard.Capital, ...wrongOpts].sort(() => Math.random() - 0.5)
                        .map(t => ({ text: t, image: null }));

        } else if (type === 'reverse_flag') {
            question = `Which flag belongs to ${cpuCard.Name}?`;
            correctAnswer = cpuCard.FlagImageURL;
            const wrongOpts = this.getWrongOptions(cpuCard.FlagImageURL, 'FlagImageURL', 3);
            options = [cpuCard.FlagImageURL, ...wrongOpts].sort(() => Math.random() - 0.5)
                        .map(url => ({ text: null, image: url })); 
        }

        this.roundResult = {
            isChallenge: true, type, question, headerImage, options, correctAnswer, playerCard, cpuCard
        };
        return this.roundResult;
    }

    getWrongOptions(correctVal, field, count) {
        const wrongs = [];
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
        const { winner, playerCard, cpuCard } = this.roundResult;

        this.playerDeck.shift();
        this.cpuDeck.shift();

        const trick = [playerCard, cpuCard, ...this.holdingPool];

        if (winner === 'draw') {
            this.holdingPool = trick;
            this.currentTurn = (this.currentTurn === 'player') ? 'cpu' : 'player';
        } else {
            if (winner === 'player') {
                this.playerDeck.push(...trick);
                this.currentTurn = 'player';
            } else {
                this.cpuDeck.push(...trick);
                this.currentTurn = 'cpu';
            }
            this.holdingPool = [];
        }

        this.checkWinCondition();
    }

    checkWinCondition() {
        if (this.playerDeck.length === 0 || this.cpuDeck.length === 0) {
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