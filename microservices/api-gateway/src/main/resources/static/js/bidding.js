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

// Back button functionality
window.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-btn');
    const referrer = document.referrer;
    
    // Show back button if came from another page on this site
    if (referrer && referrer.includes(window.location.origin)) {
        backBtn.style.display = 'inline-block';
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
});

// ===== GLOBAL VARIABLES =====
let currentItem = null;
let highestBid = null;
let itemId = null;
let auctionTimer = null;
let isSubmittingBid = false;

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
			console.log('Current item:', currentItem); // DEBUG - check if sellerId exists
			console.log('Seller ID:', currentItem.sellerId); // DEBUG
			fetchSellerDetails(currentItem.sellerId);
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

async function fetchSellerDetails(sellerId) {
    console.log('Fetching seller details for ID:', sellerId); // DEBUG
    
    if (!sellerId) {
        console.error('No seller ID provided');
        document.getElementById('seller-name').textContent = 'Unknown Seller';
        return;
    }
    
    try {
        const url = `/api/users/${sellerId}`;
        console.log('Fetching from:', url); // DEBUG
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Response status:', response.status); // DEBUG
        
        if (response.ok) {
            const seller = await response.json();
            console.log('Seller data:', seller); // DEBUG
            
            const sellerNameElement = document.getElementById('seller-name');
            if (sellerNameElement) {
                sellerNameElement.textContent = `${seller.firstName} ${seller.lastName}`;
                console.log('Seller name set to:', `${seller.firstName} ${seller.lastName}`); // DEBUG
            } else {
                console.error('seller-name element not found in DOM');
            }
        } else {
            console.error('Failed to fetch seller:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            document.getElementById('seller-name').textContent = 'Unknown Seller';
        }
    } catch (error) {
        console.error('Error fetching seller:', error);
        document.getElementById('seller-name').textContent = 'Unknown Seller';
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
    const bidInput = document.getElementById('bid-amount');
    
    // Clear error on input
    bidInput.addEventListener('input', clearBidFieldError);
    
    bidForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearBidFieldError();
        
        const bidAmount = document.getElementById('bid-amount').value;
        
        // Validate bid amount
        const validation = validateBidAmount(bidAmount, currentItem.currentPrice);
        
        if (!validation.valid) {
            showBidFieldError(validation.error);
            return;
        }
        
        await placeBid(parseFloat(bidAmount));
    });
}

// ===== BID VALIDATION =====
function validateBidAmount(amount, currentPrice) {
    const minBid = currentPrice + 0.01;
    
    // Check if empty
    if (!amount || amount === '') {
        return { valid: false, error: 'Please enter a bid amount' };
    }
    
    // Check if numeric
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        return { valid: false, error: 'Bid amount must be a valid number' };
    }
    
    // Check if positive
    if (numericAmount <= 0) {
        return { valid: false, error: 'Bid amount must be greater than $0' };
    }
    
    // Check if meets minimum
    if (numericAmount < minBid) {
        return { valid: false, error: `Bid must be at least $${minBid.toFixed(2)}` };
    }
    
    // Check if too high (sanity check)
    if (numericAmount > currentPrice * 100) {
        return { valid: false, error: 'Bid amount seems unreasonably high. Please verify.' };
    }
    
    // Check decimal places
    if ((numericAmount * 100) % 1 !== 0) {
        return { valid: false, error: 'Bid amount can only have up to 2 decimal places' };
    }
    
    return { valid: true };
}

function showBidFieldError(message) {
    const bidInput = document.getElementById('bid-amount');
    bidInput.style.borderColor = '#dc2626';
    
    const existingError = bidInput.parentElement.querySelector('.bid-field-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bid-field-error';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    bidInput.parentElement.appendChild(errorDiv);
}

function clearBidFieldError() {
    const bidInput = document.getElementById('bid-amount');
    bidInput.style.borderColor = '';
    
    const existingError = bidInput.parentElement.querySelector('.bid-field-error');
    if (existingError) {
        existingError.remove();
    }
}

// ===== PLACE BID =====
async function placeBid(amount) {
	if (isSubmittingBid) return;
	
    const placeBidBtn = document.getElementById('place-bid-btn');
    
    // Additional validation
    if (isNaN(amount) || amount <= 0) {
        showBidMessage('Please enter a valid bid amount', 'error');
        return;
    }
    
    if (!currentItem || !itemId) {
        showBidMessage('Item information not loaded', 'error');
        return;
    }
    
    try {
		isSubmittingBid = true;
        placeBidBtn.disabled = true;
        placeBidBtn.textContent = 'Placing Bid...';
        
        console.log('Placing bid:', { itemId, amount, bidderId: userId }); // Debug log
        
        const response = await fetch(`/api/auctions/${itemId}/bid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                bidderId: parseInt(userId) 
            })
        });
        
        if (response.status === 401) {
            showBidMessage('Session expired. Please log in again.', 'error');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/';
            }, 2000);
            return;
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            // Handle field-specific errors
            if (result.field === 'amount') {
                showBidFieldError(result.message);
            } else {
                showBidMessage(result.message || 'Failed to place bid', 'error');
            }
            return;
        }
        
        showBidMessage('Bid placed successfully!', 'success');
        
        // Clear form
        document.getElementById('bid-amount').value = '';
        clearBidFieldError();
		
		loadItemDetails();
		loadBidHistory();
        
        // Refresh data
        setTimeout(() => {
            loadItemDetails();
            loadBidHistory();
        }, 1000);
        
    } catch (error) {
        console.error('Error placing bid:', error);
        showBidMessage('Error connecting to server. Please try again.', 'error');
    } finally {
		isSubmittingBid = false;
        placeBidBtn.disabled = false;
        placeBidBtn.textContent = 'Place Bid';
    }
}

// ===== LOAD BID HISTORY =====
async function loadBidHistory() {
    try {
        const response = await fetch(`/api/auctions/${itemId}/bids`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const bids = await response.json();
            displayBidHistory(bids);
            updateHighestBidDisplay(bids);
        }
    } catch (error) {
        console.error('Error loading bid history:', error);
    }
}

function displayBidHistory(bids) {
    const container = document.getElementById('bid-history');

    if (!bids || bids.length === 0) {
        container.innerHTML = '<div class="no-bids">No bids yet</div>';
        return;
    }

    container.innerHTML = bids.map((bid, index) => `
        <div class="bid-item ${index === 0 ? 'highest-bid' : ''}">
            <div class="bid-info">
                <span class="bid-bidder">${bid.bidderName || 'Unknown'}</span>
                <span class="bid-amount">$${bid.amount.toFixed(2)}</span>
            </div>
            <div class="bid-time">${formatBidTime(bid.bidTime)}</div>
            ${index === 0 ? '<span class="highest-badge">Highest Bid</span>' : ''}
        </div>
    `).join('');
}

function updateHighestBidDisplay(bids) {
	if (!bids || bids.length === 0) {
	        document.getElementById('highest-bidder').textContent = 'No bids yet';
	        return;
	    }
	    
	    const highest = bids[0];
	    document.getElementById('highest-bidder').textContent = highest.bidderName || 'Unknown';
}

function formatBidTime(bidTime) {
    const date = new Date(bidTime);
    return date.toLocaleString();
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
	try {
	        let date;
	        
	        // Handle Java LocalDateTime array format: [year, month, day, hour, minute, second, nano]
	        if (Array.isArray(timestamp)) {
	            // Month is 1-based in Java, but 0-based in JavaScript
	            date = new Date(
	                timestamp[0],        // year
	                timestamp[1] - 1,    // month (subtract 1!)
	                timestamp[2],        // day
	                timestamp[3] || 0,   // hour
	                timestamp[4] || 0,   // minute
	                timestamp[5] || 0    // second
	            );
	        } else if (typeof timestamp === 'string') {
	            // Handle ISO string format
	            date = new Date(timestamp);
	        } else {
	            return 'Recently';
	        }
	        
	        // Check if date is valid
	        if (isNaN(date.getTime())) {
	            console.error('Invalid date created from:', timestamp);
	            return 'Recently';
	        }
	        
	        // Format the date nicely
	        return date.toLocaleString('en-US', {
	            month: 'short',
	            day: 'numeric',
	            hour: 'numeric',
	            minute: '2-digit',
	            hour12: true
	        });
	        
    } catch (e) {
        console.error('Error parsing timestamp:', timestamp, e);
        return 'Recently';
    }
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