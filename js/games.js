/**
 * 游戏数据管理
 */
class GameManager {
    constructor() {
        this.gamesData = null;
        this.allGames = [];
    }

    /**
     * 获取所有游戏数据
     */
    async fetchGames() {
        try {
            const response = await fetch('data/games.json');
            if (!response.ok) {
                throw new Error('无法加载游戏数据');
            }
            this.gamesData = await response.json();
            
            // 合并所有游戏到一个数组
            this.allGames = [
                ...this.gamesData.featured,
                ...this.gamesData.popular,
                ...this.gamesData.new
            ];
            
            return this.gamesData;
        } catch (error) {
            console.error('获取游戏数据失败:', error);
            return null;
        }
    }

    /**
     * 根据类别筛选游戏
     * @param {string} category - 游戏类别
     * @returns {Array} 筛选后的游戏列表
     */
    filterGamesByCategory(category) {
        if (category === 'all') {
            return this.allGames;
        }
        return this.allGames.filter(game => game.category === category);
    }

    /**
     * 根据关键词搜索游戏
     * @param {string} keyword - 搜索关键词
     * @returns {Array} 搜索结果
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
     * 创建游戏卡片HTML
     * @param {Object} game - 游戏数据
     * @returns {string} 游戏卡片HTML
     */
    createGameCardHTML(game) {
        return `
            <div class="game-card" data-id="${game.id}" data-category="${game.category}">
                <img src="${game.image}" alt="${game.name}" class="game-image">
                <div class="game-info">
                    <h3>${game.name}</h3>
                    <p>${game.description}</p>
                    <a href="${game.url}" class="play-btn">立即开玩</a>
                </div>
            </div>
        `;
    }

    /**
     * 渲染游戏卡片到指定容器
     * @param {Array} games - 游戏数据数组
     * @param {HTMLElement} container - 目标容器
     */
    renderGames(games, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        if (games.length === 0) {
            container.innerHTML = '<p class="no-games">没有找到符合条件的游戏</p>';
            return;
        }
        
        games.forEach(game => {
            container.innerHTML += this.createGameCardHTML(game);
        });
    }
}

// 导出游戏管理器实例
const gameManager = new GameManager(); 