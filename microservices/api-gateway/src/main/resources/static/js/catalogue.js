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

// ===== LOAD ITEMS ON PAGE LOAD =====
window.addEventListener('DOMContentLoaded', () => {
    loadItems();
});

// ===== SEARCH FUNCTIONALITY =====
document.getElementById('search-btn').addEventListener('click', () => {
    const keyword = document.getElementById('search-input').value.trim();
    if (keyword) {
        searchItems(keyword);
    } else {
        loadItems();
    }
});

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

// ===== LOAD ALL ITEMS =====
async function loadItems() {
    showLoading(true);
    
    try {
        const response = await fetch('/api/items', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            allItems = await response.json();
            filterItems();
        } else if (response.status === 401) {
            // Token expired or invalid
            localStorage.clear();
            window.location.href = '/';
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Error loading items:', error);
        showNoResults();
    } finally {
        showLoading(false);
    }
}

// ===== SEARCH ITEMS =====
async function searchItems(keyword) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/items/search?keyword=${encodeURIComponent(keyword)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            allItems = await response.json();
            filterItems();
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Error searching items:', error);
        showNoResults();
    } finally {
        showLoading(false);
    }
}

// ===== FILTER ITEMS =====
function filterItems() {
    let filteredItems = allItems;
    
    if (currentFilter === 'active') {
        filteredItems = allItems.filter(item => item.status === 'ACTIVE');
    } else if (currentFilter === 'ending-soon') {
        // Items ending within 24 hours
        const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        filteredItems = allItems.filter(item => {
            const endTime = new Date(item.endTime);
            return item.status === 'ACTIVE' && endTime <= oneDayFromNow;
        });
    }
    
    displayItems(filteredItems);
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
    const timeRemaining = getTimeRemaining(item.endTime);
    const statusClass = getStatusClass(item.status, timeRemaining);
    const statusText = getStatusText(item.status, timeRemaining);
    
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
                        Time: ${timeRemaining}
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
    setInterval(updateTimer, 1000);
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

function getStatusClass(status, timeRemaining) {
    if (status !== 'ACTIVE') return 'status-ended';
    
    const hours = parseInt(timeRemaining);
    if (hours <= 24) return 'status-ending';
    return 'status-active';
}

function getStatusText(status, timeRemaining) {
    if (status !== 'ACTIVE') return 'Ended';
    
    const hours = parseInt(timeRemaining);
    if (hours <= 24) return 'Ending Soon';
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