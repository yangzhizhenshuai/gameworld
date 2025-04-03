/**
 * Game Data Management
 */
class GameManager {
    constructor() {
        this.gamesData = null;
        this.allGames = [];
        this.popularGames = [];
        this.newGames = [];
    }

    /**
     * Fetch all game data
     */
    async fetchGames() {
        try {
            const response = await fetch('data/games.json');
            if (!response.ok) {
                throw new Error('Failed to load game data');
            }
            this.gamesData = await response.json();
            
            // Store all games
            this.allGames = this.gamesData.games;
            
            // Filter games by type
            this.popularGames = this.allGames.filter(game => game.type === 'popular');
            this.newGames = this.allGames.filter(game => game.type === 'new');
            
            return this.gamesData;
        } catch (error) {
            console.error('Error fetching game data:', error);
            return null;
        }
    }

    /**
     * Filter games by category
     * @param {string} category - Game category
     * @returns {Array} Filtered game list
     */
    filterGamesByCategory(category) {
        if (category === 'all') {
            return this.allGames;
        }
        return this.allGames.filter(game => game.category === category);
    }

    /**
     * Search games by keyword
     * @param {string} keyword - Search keyword
     * @returns {Array} Search results
     */
    searchGames(keyword) {
        if (!keyword.trim()) return this.allGames;
        
        const lowercaseKeyword = keyword.toLowerCase();
        return this.allGames.filter(game => 
            game.name.toLowerCase().includes(lowercaseKeyword) || 
            game.description.toLowerCase().includes(lowercaseKeyword)
        );
    }

    /**
     * Create game card HTML
     * @param {Object} game - Game data
     * @returns {string} Game card HTML
     */
    createGameCardHTML(game) {
        return `
            <div class="game-card" data-id="${game.id}" data-category="${game.category}" data-type="${game.type}">
                <img src="${game.image}" alt="${game.name}" class="game-image">
                <div class="game-info">
                    <h3>${game.name}</h3>
                    <p>${game.description}</p>
                    <a href="${game.url}" class="play-btn">Play Now</a>
                </div>
            </div>
        `;
    }

    /**
     * Render game cards to specified container
     * @param {Array} games - Game data array
     * @param {HTMLElement} container - Target container
     */
    renderGames(games, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        if (games.length === 0) {
            container.innerHTML = '<p class="no-games">No games found matching your criteria</p>';
            return;
        }
        
        games.forEach(game => {
            container.innerHTML += this.createGameCardHTML(game);
        });
    }
}

// Export game manager instance
const gameManager = new GameManager(); 