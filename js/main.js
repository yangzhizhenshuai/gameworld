/**
 * 主要JavaScript文件，负责页面初始化和事件处理
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化页面
    await initPage();
    
    // 设置事件监听器
    setupEventListeners();
});

/**
 * 页面初始化
 */
async function initPage() {
    // 加载游戏数据
    await gameManager.fetchGames();
    
    if (!gameManager.gamesData) {
        showErrorMessage('无法加载游戏数据，请刷新页面重试。');
        return;
    }
    
    // 获取游戏容器
    const featuredContainer = document.getElementById('featured-games-container');
    const popularContainer = document.getElementById('popular-games-container');
    const newContainer = document.getElementById('new-games-container');
    
    // 渲染游戏卡片
    gameManager.renderGames(gameManager.gamesData.featured, featuredContainer);
    gameManager.renderGames(gameManager.gamesData.popular, popularContainer);
    gameManager.renderGames(gameManager.gamesData.new, newContainer);
    
    console.log('页面初始化完成');
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 导航栏移动端菜单切换
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuBtn && mainNav) {
        menuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
    
    // 搜索功能
    const searchForm = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            handleSearch(searchTerm);
        });
        
        // 实时搜索（可选）
        searchInput.addEventListener('input', debounce(() => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm.length >= 2 || searchTerm === '') {
                handleSearch(searchTerm);
            }
        }, 500));
    }
    
    // 分类筛选
    const categoryLinks = document.querySelectorAll('.categories a');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 更新active类
            categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // 获取分类并筛选
            const category = link.getAttribute('data-category');
            filterGamesByCategory(category);
        });
    });
}

/**
 * 处理搜索功能
 * @param {string} searchTerm - 搜索关键词
 */
function handleSearch(searchTerm) {
    // 获取所有游戏容器
    const allContainers = document.querySelectorAll('.games-grid');
    
    // 如果搜索词为空，恢复默认显示
    if (!searchTerm) {
        document.getElementById('featured-games-container').innerHTML = '';
        document.getElementById('popular-games-container').innerHTML = '';
        document.getElementById('new-games-container').innerHTML = '';
        
        gameManager.renderGames(gameManager.gamesData.featured, document.getElementById('featured-games-container'));
        gameManager.renderGames(gameManager.gamesData.popular, document.getElementById('popular-games-container'));
        gameManager.renderGames(gameManager.gamesData.new, document.getElementById('new-games-container'));
        
        // 显示所有部分
        document.querySelectorAll('main section').forEach(section => {
            section.style.display = 'block';
        });
        
        return;
    }
    
    // 搜索游戏
    const searchResults = gameManager.searchGames(searchTerm);
    
    // 隐藏所有部分
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 创建搜索结果部分（如果不存在）
    let searchSection = document.getElementById('search-results');
    let searchContainer = document.getElementById('search-results-container');
    
    if (!searchSection) {
        searchSection = document.createElement('section');
        searchSection.className = 'search-results';
        searchSection.id = 'search-results';
        
        const h2 = document.createElement('h2');
        h2.textContent = '搜索结果';
        
        searchContainer = document.createElement('div');
        searchContainer.className = 'games-grid';
        searchContainer.id = 'search-results-container';
        
        searchSection.appendChild(h2);
        searchSection.appendChild(searchContainer);
        document.querySelector('main .container').appendChild(searchSection);
    } else {
        searchSection.style.display = 'block';
    }
    
    // 渲染搜索结果
    gameManager.renderGames(searchResults, searchContainer);
    
    // 更新搜索结果标题
    const h2 = searchSection.querySelector('h2');
    h2.textContent = `搜索结果: ${searchResults.length} 个游戏`;
}

/**
 * 根据分类筛选游戏
 * @param {string} category - 游戏分类
 */
function filterGamesByCategory(category) {
    if (category === 'all') {
        // 恢复默认显示
        document.getElementById('featured-games-container').innerHTML = '';
        document.getElementById('popular-games-container').innerHTML = '';
        document.getElementById('new-games-container').innerHTML = '';
        
        gameManager.renderGames(gameManager.gamesData.featured, document.getElementById('featured-games-container'));
        gameManager.renderGames(gameManager.gamesData.popular, document.getElementById('popular-games-container'));
        gameManager.renderGames(gameManager.gamesData.new, document.getElementById('new-games-container'));
        
        // 显示所有部分
        document.querySelectorAll('main section').forEach(section => {
            if (section.id !== 'search-results') {
                section.style.display = 'block';
            }
        });
        
        // 隐藏搜索结果部分
        const searchSection = document.getElementById('search-results');
        if (searchSection) {
            searchSection.style.display = 'none';
        }
        
        return;
    }
    
    // 筛选游戏
    const filteredGames = gameManager.filterGamesByCategory(category);
    
    // 隐藏所有部分
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 创建分类结果部分（如果不存在）
    let categorySection = document.getElementById('category-results');
    let categoryContainer = document.getElementById('category-results-container');
    
    if (!categorySection) {
        categorySection = document.createElement('section');
        categorySection.className = 'category-results';
        categorySection.id = 'category-results';
        
        const h2 = document.createElement('h2');
        
        categoryContainer = document.createElement('div');
        categoryContainer.className = 'games-grid';
        categoryContainer.id = 'category-results-container';
        
        categorySection.appendChild(h2);
        categorySection.appendChild(categoryContainer);
        document.querySelector('main .container').appendChild(categorySection);
    } else {
        categorySection.style.display = 'block';
    }
    
    // 获取分类中文名
    const categoryName = getCategoryName(category);
    
    // 更新分类结果标题
    const h2 = categorySection.querySelector('h2');
    h2.textContent = `${categoryName} 游戏 (${filteredGames.length})`;
    
    // 渲染筛选结果
    gameManager.renderGames(filteredGames, categoryContainer);
}

/**
 * 获取分类的中文名称
 * @param {string} category - 分类英文名
 * @returns {string} 分类中文名
 */
function getCategoryName(category) {
    const categories = {
        'action': '动作',
        'adventure': '冒险',
        'puzzle': '益智',
        'rpg': '角色扮演',
        'strategy': '策略',
        'sports': '体育',
        'casual': '休闲'
    };
    
    return categories[category] || category;
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
        setTimeout(() => {
            errorDiv.remove();
        }, 300);
    }, 5000);
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
} 