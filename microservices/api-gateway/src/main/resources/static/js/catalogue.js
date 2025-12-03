const catalogueTimers = new Map();

// ===== CHECK AUTHENTICATION =====
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');

if (!token) {
    // Not logged in, redirect to login page
    window.location.href = '/';
}

// Display username in navbar
document.getElementById('username-display').textContent = username;

// ===== LOGOUT FUNCTIONALITY =====
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/';
});


// ===== GLOBAL VARIABLES =====
let allItems = [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'newest';

// ===== SEARCH VALIDATION =====
function validateSearchKeyword(keyword) {
    if (!keyword || keyword.trim().length === 0) {
        return { valid: false, error: 'Please enter a search term' };
    }
    
    if (keyword.trim().length < 2) {
        return { valid: false, error: 'Search term must be at least 2 characters' };
    }
    
    if (keyword.trim().length > 100) {
        return { valid: false, error: 'Search term is too long (max 100 characters)' };
    }
    
    return { valid: true };
}

function showSearchError(message) {
    const searchInput = document.getElementById('search-input');
    searchInput.style.borderColor = '#dc2626';
    
    const existingError = searchInput.parentElement.querySelector('.search-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'search-error';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    searchInput.parentElement.appendChild(errorDiv);
    
    // Auto-clear after 3 seconds
    setTimeout(() => {
        const error = searchInput.parentElement.querySelector('.search-error');
        if (error) {
            error.remove();
            searchInput.style.borderColor = '';
        }
    }, 3000);
}

function clearSearchError() {
    const searchInput = document.getElementById('search-input');
    const existingError = searchInput.parentElement.querySelector('.search-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    searchInput.style.borderColor = '';
}

// ===== LOAD ITEMS ON PAGE LOAD =====
window.addEventListener('DOMContentLoaded', () => {
    loadItems();
});

// ===== SEARCH FUNCTIONALITY =====
document.getElementById('search-btn').addEventListener('click', () => {
    console.log('=== SEARCH BUTTON CLICKED ===');
    clearSearchError();
    
    const keyword = document.getElementById('search-input').value.trim();
    console.log('Raw input value:', document.getElementById('search-input').value);
    console.log('Trimmed keyword:', keyword);
    console.log('Keyword length:', keyword.length);
    
    if (!keyword) {
        console.log('Empty search - loading all items');
        loadItems();
        return;
    }
    
    const validation = validateSearchKeyword(keyword);
    console.log('Validation result:', validation);
    
    if (!validation.valid) {
        console.log('Validation failed:', validation.error);
        showSearchError(validation.error);
        return;
    }
    
    console.log('Starting search with keyword:', keyword);
    searchItems(keyword);
});

// Clear error on input
document.getElementById('search-input').addEventListener('input', clearSearchError);

// Search on Enter key
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('search-btn').click();
    }
});

// ===== CLEAR SEARCH =====
document.getElementById('clear-btn').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    loadItems();
});

// ===== FILTER FUNCTIONALITY =====
document.querySelectorAll('input[name="status"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        filterItems();
    });
});

// Category filter
document.getElementById('category-filter').addEventListener('change', (e) => {
    currentCategory = e.target.value;
    filterItems();
});

// Sort dropdown
document.getElementById('sort-by').addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterItems();
});

// ===== LOAD ALL ITEMS =====
async function loadItems() {
    console.log('=== LOAD ALL ITEMS DEBUG START ===');
    console.log('Token exists:', !!token);
    
    showLoading(true);
    
    try {
        const url = '/api/items';
        console.log('Loading from URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            allItems = await response.json();
            console.log('Items loaded:', allItems.length);
            console.log('First item:', allItems[0]);
            filterItems();
        } else if (response.status === 401) {
            console.error('Authentication failed - clearing storage and redirecting');
            localStorage.clear();
            window.location.href = '/';
        } else {
            console.error('Load items failed:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            showNoResults();
        }
    } catch (error) {
        console.error('Load items error:', error);
        console.error('Error stack:', error.stack);
        showNoResults();
    } finally {
        showLoading(false);
        console.log('=== LOAD ALL ITEMS DEBUG END ===');
    }
}

// ===== SEARCH ITEMS =====
async function searchItems(keyword) {
    console.log('=== SEARCH DEBUG START ===');
    console.log('Search keyword:', keyword);
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
    
    showLoading(true);
    
    try {
        const url = `/api/items/search?keyword=${encodeURIComponent(keyword)}`;
        console.log('Search URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        console.log('Response headers:', response.headers);
        
        if (response.ok) {
            const items = await response.json();
            console.log('Items received:', items.length);
            console.log('First item:', items[0]);
            
            allItems = items;
            filterItems();
            
            console.log('Search successful - displaying', items.length, 'items');
        } else {
            console.error('Search failed with status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            showNoResults();
        }
    } catch (error) {
        console.error('Search error:', error);
        console.error('Error stack:', error.stack);
        showNoResults();
    } finally {
        showLoading(false);
        console.log('=== SEARCH DEBUG END ===');
    }
}

// ===== FILTER ITEMS =====
function filterItems() {
    let filteredItems = allItems;
    
    // Filter by status
    if (currentFilter === 'active') {
        filteredItems = filteredItems.filter(item => item.status === 'ACTIVE');
    } else if (currentFilter === 'ending-soon') {
        const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        filteredItems = filteredItems.filter(item => {
            const endTime = new Date(item.endTime);
            return item.status === 'ACTIVE' && endTime <= oneDayFromNow;
        });
    }
    
    // Filter by category
    if (currentCategory !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === currentCategory);
    }
    
    // Sort items
    filteredItems = sortItems(filteredItems, currentSort);
    
    displayItems(filteredItems);
}

function sortItems(items, sortBy) {
    const sorted = [...items];
    
    switch(sortBy) {
        case 'price-low':
            return sorted.sort((a, b) => a.currentPrice - b.currentPrice);
        case 'price-high':
            return sorted.sort((a, b) => b.currentPrice - a.currentPrice);
        case 'ending':
            return sorted.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
        case 'newest':
        default:
            return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
}

// ===== DISPLAY ITEMS =====
function displayItems(items) {
    const container = document.getElementById('items-container');
    const noResults = document.getElementById('no-results');
    
    if (items.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    container.innerHTML = items.map(item => createItemCard(item)).join('');
    
    // Start timers for active items
    items.forEach(item => {
        if (item.status === 'ACTIVE') {
            startTimer(item.id, item.endTime);
        }
    });
}

// ===== CREATE ITEM CARD HTML =====
function createItemCard(item) {
    const statusClass = getStatusClass(item.status, item.endTime);
    const statusText = getStatusText(item.status, item.endTime);
    
    return `
        <div class="item-card" onclick="viewItem(${item.id})">
            <div class="item-image">
                <span style="font-size: 3rem;">ITEM</span>
            </div>
            <div class="item-content">
                <h3 class="item-title">${escapeHtml(item.name)}</h3>
                <p class="item-description">${escapeHtml(item.description)}</p>
                <div class="item-price">$${item.currentPrice.toFixed(2)}</div>
                <div class="item-info">
                    <span class="item-bids">${item.bidCount || 0} bids</span>
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>
                ${item.status === 'ACTIVE' ? `
                    <div class="item-timer" id="timer-${item.id}">
                        Time: ${getTimeRemaining(item.endTime)}
                    </div>
                ` : ''}
                <div class="item-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); viewItem(${item.id})">
                        ${item.status === 'ACTIVE' ? 'Place Bid' : 'View Details'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== TIMER FUNCTIONALITY =====
function startTimer(itemId, endTime) {
    const timerElement = document.getElementById(`timer-${itemId}`);
    if (!timerElement) return;

    // clear existing timer for this item
    if (catalogueTimers.has(itemId)) {
        clearInterval(catalogueTimers.get(itemId));
        catalogueTimers.delete(itemId);
    }

    const updateTimer = () => {
        const now = new Date().getTime();
        const end = new Date(endTime).getTime();
        const distance = end - now;
        
        if (distance < 0) {
            timerElement.textContent = 'Time: Auction Ended';
            return;
        }
        
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        timerElement.textContent = `Time: ${hours}h ${minutes}m ${seconds}s`;
    };
    
    updateTimer();
    const handle = setInterval(updateTimer, 1000);
    catalogueTimers.set(itemId, handle);
}

// ===== UTILITY FUNCTIONS =====
function getTimeRemaining(endTime) {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const distance = end - now;
    
    if (distance < 0) return 'Ended';
    
    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
}

function getStatusClass(status, itemEndTime) {
    if (status !== 'ACTIVE') return 'status-ended';
    
    const now = new Date().getTime();
    const end = new Date(itemEndTime).getTime();
    const hoursRemaining = (end - now) / (1000 * 60 * 60);
    
    if (hoursRemaining <= 24 && hoursRemaining > 0) return 'status-ending';
    return 'status-active';
}

function getStatusText(status, itemEndTime) {
    if (status !== 'ACTIVE') return 'Ended';
    
    const now = new Date().getTime();
    const end = new Date(itemEndTime).getTime();
    const hoursRemaining = (end - now) / (1000 * 60 * 60);
    
    if (hoursRemaining <= 24 && hoursRemaining > 0) return 'Ending Soon';
    return 'Active';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showNoResults() {
    document.getElementById('items-container').innerHTML = '';
    document.getElementById('no-results').style.display = 'block';
}

// ===== VIEW ITEM DETAILS =====
function viewItem(itemId) {
    window.location.href = `/bidding.html?itemId=${itemId}`;
}