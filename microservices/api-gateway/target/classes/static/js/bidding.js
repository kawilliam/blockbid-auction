// ===== CHECK AUTHENTICATION =====
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');

if (!token) {
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
let currentItem = null;
let highestBid = null;
let itemId = null;
let auctionTimer = null;

// ===== GET ITEM ID FROM URL =====
function getItemIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('itemId');
}

// ===== LOAD PAGE DATA =====
window.addEventListener('DOMContentLoaded', () => {
    itemId = getItemIdFromUrl();
    
    if (!itemId) {
        alert('No item specified');
        window.location.href = '/catalogue.html';
        return;
    }
    
    loadItemDetails();
    loadBidHistory();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadItemDetails();
        loadBidHistory();
    }, 30000);
});

// ===== LOAD ITEM DETAILS =====
async function loadItemDetails() {
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            currentItem = await response.json();
            displayItemDetails(currentItem);
            setupBiddingSection(currentItem);
            startAuctionTimer(currentItem.endTime);
        } else if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
        } else if (response.status === 404) {
            showError('Item not found');
        } else {
            showError('Error loading item details');
        }
    } catch (error) {
        console.error('Error loading item:', error);
        showError('Error connecting to server');
    }
}

// ===== DISPLAY ITEM DETAILS =====
function displayItemDetails(item) {
    // Basic item info
    document.getElementById('item-title').textContent = item.name;
    document.getElementById('item-description').textContent = item.description;
    document.getElementById('current-price').textContent = `$${item.currentPrice.toFixed(2)}`;
    document.getElementById('bid-count').textContent = item.bidCount || 0;
    document.getElementById('seller-name').textContent = item.sellerName || 'Unknown';
    
    // Status badge
    const statusBadge = document.getElementById('status-badge');
    const timeRemaining = getTimeRemaining(item.endTime);
    
    if (item.status === 'ACTIVE') {
        if (timeRemaining.includes('Ended')) {
            statusBadge.textContent = 'Ended';
            statusBadge.className = 'status-badge ended';
        } else {
            const hours = parseInt(timeRemaining);
            if (hours <= 24) {
                statusBadge.textContent = 'Ending Soon';
                statusBadge.className = 'status-badge ending';
            } else {
                statusBadge.textContent = 'Active';
                statusBadge.className = 'status-badge active';
            }
        }
    } else {
        statusBadge.textContent = 'Ended';
        statusBadge.className = 'status-badge ended';
    }
}

// ===== SETUP BIDDING SECTION =====
function setupBiddingSection(item) {
    const biddingSection = document.getElementById('bidding-section');
    const endedSection = document.getElementById('auction-ended-section');
    
    if (item.status !== 'ACTIVE' || getTimeRemaining(item.endTime).includes('Ended')) {
        // Auction ended
        biddingSection.style.display = 'none';
        endedSection.style.display = 'block';
        
        showAuctionEndedResult(item);
    } else {
        // Auction active
        biddingSection.style.display = 'block';
        endedSection.style.display = 'none';
        
        setupActiveBidding(item);
    }
}

// ===== SETUP ACTIVE BIDDING =====
function setupActiveBidding(item) {
    // Update bid info
    document.getElementById('highest-bid-amount').textContent = `$${item.currentPrice.toFixed(2)}`;
    
    if (item.highestBidder) {
        document.getElementById('highest-bidder').textContent = item.highestBidder;
    } else {
        document.getElementById('highest-bidder').textContent = 'No bids yet';
    }
    
    // Set minimum bid
    const minBid = item.currentPrice + 0.01;
    document.getElementById('min-bid').textContent = minBid.toFixed(2);
    document.getElementById('bid-amount').min = minBid.toFixed(2);
    document.getElementById('bid-amount').placeholder = minBid.toFixed(2);
    
    // Setup bid form
    setupBidForm();
}

// ===== SETUP BID FORM =====
function setupBidForm() {
    const bidForm = document.getElementById('bid-form');
    
    bidForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bidAmount = parseFloat(document.getElementById('bid-amount').value);
        const minBid = currentItem.currentPrice + 0.01;
        
        // Validation
        if (bidAmount < minBid) {
            showBidMessage(`Bid must be at least $${minBid.toFixed(2)}`, 'error');
            return;
        }
        
        await placeBid(bidAmount);
    });
}

// ===== PLACE BID =====
async function placeBid(amount) {
    const placeBidBtn = document.getElementById('place-bid-btn');
    
    try {
        placeBidBtn.disabled = true;
        placeBidBtn.textContent = 'Placing Bid...';
        
        const response = await fetch(`/api/auctions/${itemId}/bid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: amount,
                userId: userId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showBidMessage('Bid placed successfully!', 'success');
            
            // Clear form
            document.getElementById('bid-amount').value = '';
            
            // Refresh data
            setTimeout(() => {
                loadItemDetails();
                loadBidHistory();
            }, 1000);
            
        } else {
            showBidMessage(result.message || 'Failed to place bid', 'error');
        }
        
    } catch (error) {
        console.error('Error placing bid:', error);
        showBidMessage('Error connecting to server', 'error');
    } finally {
        placeBidBtn.disabled = false;
        placeBidBtn.textContent = 'Place Bid';
    }
}

// ===== LOAD BID HISTORY =====
async function loadBidHistory() {
    try {
        const response = await fetch(`/api/auctions/${itemId}/bids`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const bids = await response.json();
            displayBidHistory(bids);
        } else {
            document.getElementById('bid-history').innerHTML = 
                '<div class="loading">Unable to load bid history</div>';
        }
    } catch (error) {
        console.error('Error loading bid history:', error);
        document.getElementById('bid-history').innerHTML = 
            '<div class="loading">Error loading bid history</div>';
    }
}

// ===== DISPLAY BID HISTORY =====
function displayBidHistory(bids) {
    const historyContainer = document.getElementById('bid-history');
    
    if (bids.length === 0) {
        historyContainer.innerHTML = '<div class="loading">No bids placed yet</div>';
        return;
    }
    
    const historyHtml = bids.map(bid => `
        <div class="bid-entry">
            <div class="bid-info">
                <div class="bid-amount">$${bid.amount.toFixed(2)}</div>
                <div class="bid-user">by ${bid.bidderName || 'Unknown'}</div>
            </div>
            <div class="bid-time">${formatBidTime(bid.timestamp)}</div>
        </div>
    `).join('');
    
    historyContainer.innerHTML = historyHtml;
}

// ===== AUCTION TIMER =====
function startAuctionTimer(endTime) {
    // Clear existing timer
    if (auctionTimer) {
        clearInterval(auctionTimer);
    }
    
    const updateTimer = () => {
        const timeRemaining = getTimeRemaining(endTime);
        document.getElementById('time-remaining').textContent = timeRemaining;
        
        if (timeRemaining === 'Ended') {
            clearInterval(auctionTimer);
            // Refresh page to show ended state
            setTimeout(() => {
                loadItemDetails();
            }, 1000);
        }
    };
    
    updateTimer();
    auctionTimer = setInterval(updateTimer, 1000);
}

// ===== SHOW AUCTION ENDED RESULT =====
function showAuctionEndedResult(item) {
    const finalResult = document.getElementById('final-result');
    
    if (!item.highestBidder) {
        finalResult.innerHTML = `
            <div class="loser-message">
                <h3>No bids were placed</h3>
                <p>This auction ended without any bids.</p>
            </div>
        `;
    } else if (item.highestBidderId == userId) {
        // User won the auction
        finalResult.innerHTML = `
            <div class="winner-announcement">
                <h3>Congratulations! You won this auction!</h3>
                <p>Winning bid: <strong>$${item.currentPrice.toFixed(2)}</strong></p>
                <button class="btn btn-primary" onclick="proceedToPayment()">
                    Proceed to Payment
                </button>
            </div>
        `;
    } else {
        // User lost the auction
        finalResult.innerHTML = `
            <div class="loser-message">
                <h3>Auction ended</h3>
                <p>Winner: <strong>${item.highestBidder}</strong></p>
                <p>Winning bid: <strong>$${item.currentPrice.toFixed(2)}</strong></p>
            </div>
        `;
    }
}

// ===== PROCEED TO PAYMENT =====
function proceedToPayment() {
    window.location.href = `/payment.html?itemId=${itemId}`;
}

// ===== UTILITY FUNCTIONS =====
function getTimeRemaining(endTime) {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const distance = end - now;
    
    if (distance < 0) return 'Ended';
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function formatBidTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function showBidMessage(text, type) {
    const messageDiv = document.getElementById('bid-message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 5000);
}

function showError(message) {
    alert(message);
    window.location.href = '/catalogue.html';
}