/**
 * Main JavaScript file responsible for page initialization and event handling
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the page
    await initPage();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Page initialization
 */
async function initPage() {
    // Load game data
    await gameManager.fetchGames();
    
    if (!gameManager.gamesData) {
        showErrorMessage('Unable to load game data. Please refresh the page and try again.');
        return;
    }
    
    // Get game containers
    const popularContainer = document.getElementById('popular-games-container');
    const newContainer = document.getElementById('new-games-container');
    
    // Render game cards
    gameManager.renderGames(gameManager.popularGames, popularContainer);
    gameManager.renderGames(gameManager.newGames, newContainer);
    
    console.log('Page initialization complete');
    console.log('Popular games:', gameManager.popularGames.length);
    console.log('New games:', gameManager.newGames.length);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Mobile menu toggle for navigation bar
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuBtn && mainNav) {
        menuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
    
    // Search functionality
    const searchForm = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            handleSearch(searchTerm);
        });
        
        // Live search (optional)
        searchInput.addEventListener('input', debounce(() => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm.length >= 2 || searchTerm === '') {
                handleSearch(searchTerm);
            }
        }, 500));
    }
    
    // Category filtering
    const categoryLinks = document.querySelectorAll('.categories a');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active class
            categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Get category and filter
            const category = link.getAttribute('data-category');
            filterGamesByCategory(category);
        });
    });
}

/**
 * Handle search functionality
 * @param {string} searchTerm - Search keyword
 */
function handleSearch(searchTerm) {
    // If search term is empty, restore default display
    if (!searchTerm) {
        document.getElementById('popular-games-container').innerHTML = '';
        document.getElementById('new-games-container').innerHTML = '';
        
        gameManager.renderGames(gameManager.popularGames, document.getElementById('popular-games-container'));
        gameManager.renderGames(gameManager.newGames, document.getElementById('new-games-container'));
        
        // Show all sections
        document.querySelectorAll('main section').forEach(section => {
            section.style.display = 'block';
        });
        
        return;
    }
    
    // Search games
    const searchResults = gameManager.searchGames(searchTerm);
    
    // Hide all sections
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Create search results section (if it doesn't exist)
    let searchSection = document.getElementById('search-results');
    let searchContainer = document.getElementById('search-results-container');
    
    if (!searchSection) {
        searchSection = document.createElement('section');
        searchSection.className = 'search-results';
        searchSection.id = 'search-results';
        
        const h2 = document.createElement('h2');
        h2.textContent = 'Search Results';
        
        searchContainer = document.createElement('div');
        searchContainer.className = 'games-grid';
        searchContainer.id = 'search-results-container';
        
        searchSection.appendChild(h2);
        searchSection.appendChild(searchContainer);
        document.querySelector('main .container').appendChild(searchSection);
    } else {
        searchSection.style.display = 'block';
    }
    
    // Render search results
    gameManager.renderGames(searchResults, searchContainer);
    
    // Update search results title
    const h2 = searchSection.querySelector('h2');
    h2.textContent = `Search Results: ${searchResults.length} games`;
}

/**
 * Filter games by category
 * @param {string} category - Game category
 */
function filterGamesByCategory(category) {
    if (category === 'all') {
        // Restore default display
        document.getElementById('popular-games-container').innerHTML = '';
        document.getElementById('new-games-container').innerHTML = '';
        
        gameManager.renderGames(gameManager.popularGames, document.getElementById('popular-games-container'));
        gameManager.renderGames(gameManager.newGames, document.getElementById('new-games-container'));
        
        // Show all sections
        document.querySelectorAll('main section').forEach(section => {
            if (section.id !== 'search-results') {
                section.style.display = 'block';
            }
        });
        
        // Hide search results section
        const searchSection = document.getElementById('search-results');
        if (searchSection) {
            searchSection.style.display = 'none';
        }
        
        return;
    }
    
    // Filter games
    const filteredGames = gameManager.filterGamesByCategory(category);
    
    // Hide all sections
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Create category results section (if it doesn't exist)
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
    
    // Get category name
    const categoryName = getCategoryName(category);
    
    // Update category results title
    const h2 = categorySection.querySelector('h2');
    h2.textContent = `${categoryName} Games (${filteredGames.length})`;
    
    // Render filtered results
    gameManager.renderGames(filteredGames, categoryContainer);
}

/**
 * Get category name
 * @param {string} category - Category in English
 * @returns {string} Category display name
 */
function getCategoryName(category) {
    const categories = {
        'action': 'Action',
        'adventure': 'Adventure',
        'puzzle': 'Puzzle',
        'rpg': 'RPG',
        'strategy': 'Strategy',
        'sports': 'Sports',
        'casual': 'Casual'
    };
    
    return categories[category] || category;
}

/**
 * Show error message
 * @param {string} message - Error message
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
 * Debounce function
 * @param {Function} func - Function to execute
 * @param {number} wait - Wait time (milliseconds)
 * @returns {Function} Debounced function
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