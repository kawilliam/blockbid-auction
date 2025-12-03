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
let ws = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectDelay = 1000;

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
    connectWebSocket();

    // Fallback polling every 60 seconds (in case WebSocket fails)
    setInterval(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            loadItemDetails();
            loadBidHistory();
        }
    }, 60000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (ws) {
        ws.close();
    }
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
    // Defensive null-checks
    const titleEl = document.getElementById('item-title');
    const descEl = document.getElementById('item-description');
    const priceEl = document.getElementById('current-price');
    const bidCountEl = document.getElementById('bid-count');
    const sellerEl = document.getElementById('seller-name');
    const statusBadge = document.getElementById('status-badge');

    if (titleEl) titleEl.textContent = item.name || '';
    if (descEl) descEl.textContent = item.description || '';
    if (priceEl) priceEl.textContent = `$${(item.currentPrice || 0).toFixed(2)}`;
    if (bidCountEl) bidCountEl.textContent = item.bidCount || 0;
    if (sellerEl) sellerEl.textContent = item.sellerName || 'Unknown';

    // Status badge decision uses numeric hours remaining to avoid parseInt on strings
    const hoursLeft = getHoursRemaining(item.endTime);

    if (statusBadge) {
        if (item.status === 'ACTIVE') {
            if (hoursLeft === 0) {
                statusBadge.textContent = 'Ended';
                statusBadge.className = 'status-badge ended';
            } else if (hoursLeft <= 24) {
                statusBadge.textContent = 'Ending Soon';
                statusBadge.className = 'status-badge ending';
            } else {
                statusBadge.textContent = 'Active';
                statusBadge.className = 'status-badge active';
            }
        } else {
            statusBadge.textContent = 'Ended';
            statusBadge.className = 'status-badge ended';
        }
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

    if (!bidForm || !bidInput) return;

    // Replace event handlers to avoid stacking listeners on repeated setup
    bidInput.oninput = clearBidFieldError;

    bidForm.onsubmit = async (e) => {
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
    };
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

// ===== WEBSOCKET CONNECTION =====
function connectWebSocket() {
    try {
        // Determine WebSocket protocol based on current page protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/auction/${itemId}?token=${token}`;

        console.log('Connecting to WebSocket:', wsUrl);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected');
            reconnectAttempts = 0;
            updateConnectionStatus('connected');

            // Subscribe to bid updates for this item
            ws.send(JSON.stringify({
                type: 'SUBSCRIBE',
                itemId: itemId,
                userId: userId
            }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus('error');
        };

        ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            updateConnectionStatus('disconnected');

            // Attempt to reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1);
                console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

                setTimeout(() => {
                    connectWebSocket();
                }, delay);
            } else {
                console.error('Max reconnection attempts reached');
                updateConnectionStatus('failed');
            }
        };

    } catch (error) {
        console.error('Error creating WebSocket:', error);
        updateConnectionStatus('error');
    }
}

function handleWebSocketMessage(message) {
    console.log('WebSocket message received:', message);

    switch (message.type) {
        case 'NEW_BID':
            handleNewBid(message.data);
            break;

        case 'AUCTION_ENDED':
            handleAuctionEnded(message.data);
            break;

        case 'PRICE_UPDATE':
            handlePriceUpdate(message.data);
            break;

        case 'ERROR':
            console.error('WebSocket error message:', message.message);
            showBidMessage(message.message || 'WebSocket error', 'error');
            break;

        default:
            console.warn('Unknown WebSocket message type:', message.type);
    }
}

function handleNewBid(bidData) {
    console.log('New bid received:', bidData);

    // Update current item data
    if (currentItem) {
        currentItem.currentPrice = bidData.amount;
        currentItem.highestBidder = bidData.bidderName;
        currentItem.highestBidderId = bidData.bidderId;
        currentItem.bidCount = (currentItem.bidCount || 0) + 1;
    }

    // Update UI elements
    const priceEl = document.getElementById('current-price');
    if (priceEl) {
        priceEl.textContent = `$${bidData.amount.toFixed(2)}`;
        // Add flash animation
        priceEl.classList.add('price-flash');
        setTimeout(() => priceEl.classList.remove('price-flash'), 1000);
    }

    const bidCountEl = document.getElementById('bid-count');
    if (bidCountEl && currentItem) {
        bidCountEl.textContent = currentItem.bidCount;
    }

    const highestBidAmountEl = document.getElementById('highest-bid-amount');
    if (highestBidAmountEl) {
        highestBidAmountEl.textContent = `$${bidData.amount.toFixed(2)}`;
    }

    const highestBidderEl = document.getElementById('highest-bidder');
    if (highestBidderEl) {
        highestBidderEl.textContent = bidData.bidderName || 'Unknown';
    }

    // Update minimum bid
    const minBid = bidData.amount + 0.01;
    const minBidEl = document.getElementById('min-bid');
    if (minBidEl) {
        minBidEl.textContent = minBid.toFixed(2);
    }

    const bidAmountInput = document.getElementById('bid-amount');
    if (bidAmountInput) {
        bidAmountInput.min = minBid.toFixed(2);
        bidAmountInput.placeholder = minBid.toFixed(2);
    }

    // Reload bid history to show new bid
    loadBidHistory();

    // Show notification if it's not the current user's bid
    if (bidData.bidderId != userId) {
        showBidNotification(`${bidData.bidderName} placed a bid of $${bidData.amount.toFixed(2)}`);
    }
}

function handleAuctionEnded(data) {
    console.log('Auction ended:', data);

    // Update item status
    if (currentItem) {
        currentItem.status = 'ENDED';
    }

    // Reload to show ended state
    loadItemDetails();

    // Show notification
    showBidNotification('This auction has ended!');
}

function handlePriceUpdate(data) {
    console.log('Price update:', data);

    if (currentItem) {
        currentItem.currentPrice = data.currentPrice;
        currentItem.highestBidder = data.highestBidder;
        currentItem.bidCount = data.bidCount;
    }

    displayItemDetails(currentItem);
}

function updateConnectionStatus(status) {
    const statusIndicator = document.getElementById('connection-status');
    if (!statusIndicator) return;

    statusIndicator.style.display = 'block';
    statusIndicator.className = `connection-status ${status}`;

    switch (status) {
        case 'connected':
            statusIndicator.textContent = '● Live';
            statusIndicator.title = 'Real-time updates active';
            break;
        case 'disconnected':
            statusIndicator.textContent = '● Reconnecting...';
            statusIndicator.title = 'Attempting to reconnect';
            break;
        case 'error':
            statusIndicator.textContent = '● Connection Error';
            statusIndicator.title = 'WebSocket connection error';
            break;
        case 'failed':
            statusIndicator.textContent = '● Offline';
            statusIndicator.title = 'Connection failed - using polling';
            break;
    }
}

function showBidNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'bid-notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showBidMessage(message, type) {
    const messageEl = document.getElementById('bid-message');
    if (!messageEl) {
        // Fallback to console if element doesn't exist
        console.log(`[${type}] ${message}`);
        return;
    }

    messageEl.textContent = message;
    messageEl.className = `bid-message ${type}`;
    messageEl.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

function showError(message) {
    showBidMessage(message, 'error');
}

// ===== UTILITY FUNCTIONS =====
// Robust parsing for endTime (supports ISO string or Java LocalDateTime array)
function parseEndTimeToDate(endTime) {
    if (!endTime) return null;

    // If array format [year, month, day, hour, minute, second, nano]
    if (Array.isArray(endTime) && endTime.length >= 3) {
        return new Date(
            endTime[0],
            (endTime[1] || 1) - 1, // month -> 0-based
            endTime[2],
            endTime[3] || 0,
            endTime[4] || 0,
            endTime[5] || 0,
            0
        );
    }

    // If string (ISO) or numeric
    const d = new Date(endTime);
    if (!isNaN(d.getTime())) return d;

    return null;
}

function getTimeRemaining(endTime) {
    const endDate = parseEndTimeToDate(endTime);
    if (!endDate) return 'Ended';

    const now = Date.now();
    const end = endDate.getTime();
    const distance = end - now;

    if (isNaN(distance) || distance <= 0) return 'Ended';

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

// Helper to return total hours remaining as a number (used by status logic)
function getHoursRemaining(endTime) {
    const endDate = parseEndTimeToDate(endTime);
    if (!endDate) return 0;
    const ms = endDate.getTime() - Date.now();
    return Math.max(0, ms / (1000 * 60 * 60));
}