// Authentication check
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');

if (!token) {
    window.location.href = '/';
}

document.getElementById('username-display').textContent = username;

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/';
});

// Load seller's listings
let allListings = [];
let currentFilter = 'all';

async function loadMyListings() {
    try {
        const response = await fetch(`/api/items/seller/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            allListings = await response.json();
            
            // Fetch auction details for each listing
            const listingsWithAuctions = await Promise.all(allListings.map(async (item) => {
                try {
                    const auctionResponse = await fetch(`/api/auctions/${item.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (auctionResponse.ok) {
                        const auctionData = await auctionResponse.json();
                        item.auction = auctionData.auction;
                        item.totalBids = auctionData.totalBids || 0;
                    }
                } catch (e) {
                    console.error('Error loading auction:', e);
                }
                return item;
            }));

            allListings = listingsWithAuctions;
            updateStats(allListings);
            displayListings(allListings);
        } else {
            showNoListings();
        }
    } catch (error) {
        console.error('Error loading listings:', error);
        showNoListings();
    }
}

function updateStats(listings) {
    const activeListings = listings.filter(l => l.status === 'ACTIVE');
    const soldListings = listings.filter(l => l.status === 'ENDED' && l.highestBidderId);
    const totalBids = listings.reduce((sum, l) => sum + (l.totalBids || 0), 0);
    const totalRevenue = soldListings.reduce((sum, l) => sum + (l.currentPrice || 0), 0);

    document.getElementById('total-listings').textContent = listings.length;
    document.getElementById('active-listings').textContent = activeListings.length;
    document.getElementById('total-bids').textContent = totalBids;
    document.getElementById('total-revenue').textContent = '$' + totalRevenue.toFixed(2);
}

function displayListings(listings) {
    const container = document.getElementById('listings-container');
    const noListingsDiv = document.getElementById('no-listings');

    if (!listings || listings.length === 0) {
        container.style.display = 'none';
        noListingsDiv.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    noListingsDiv.style.display = 'none';

    container.innerHTML = listings.map(item => {
        const isActive = item.status === 'ACTIVE';
        const isSold = item.status === 'ENDED' && item.highestBidderId;
        const timeRemaining = isActive ? getTimeRemaining(item.endTime) : 'Ended';
        
        let statusClass = 'status-active';
        let statusText = 'Active';
        if (isSold) {
            statusClass = 'status-sold';
            statusText = 'Sold';
        } else if (!isActive) {
            statusClass = 'status-ended';
            statusText = 'Ended';
        }

        return `
            <div class="listing-card">
                <div class="listing-image">
                    <span>ITEM</span>
                </div>
                <div class="listing-content">
                    <span class="listing-status-badge ${statusClass}">${statusText}</span>
                    <h3 class="listing-title">${item.name}</h3>
                    <p class="listing-description">${item.description}</p>
                    
                    <div class="listing-stats">
                        <div class="listing-stat">
                            <div class="listing-stat-value">$${item.currentPrice.toFixed(2)}</div>
                            <div class="listing-stat-label">Current Price</div>
                        </div>
                        <div class="listing-stat">
                            <div class="listing-stat-value">${item.totalBids || 0}</div>
                            <div class="listing-stat-label">Bids</div>
                        </div>
                        <div class="listing-stat">
                            <div class="listing-stat-value">${timeRemaining}</div>
                            <div class="listing-stat-label">${isActive ? 'Remaining' : 'Status'}</div>
                        </div>
                    </div>
                    
                    <div class="listing-actions">
                        <button class="btn btn-sm btn-secondary" onclick="location.href='/bidding.html?itemId=${item.id}'">
                            View Details
                        </button>
                        ${isActive ? '<button class="btn btn-sm btn-outline" onclick="endAuction(' + item.id + ')">End Early</button>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showNoListings() {
    document.getElementById('listings-container').style.display = 'none';
    document.getElementById('no-listings').style.display = 'block';
}

function getTimeRemaining(endTime) {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const distance = end - now;
    
    if (distance < 0) return 'Ended';
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes}m`;
    }
}

async function endAuction(itemId) {
    if (!confirm('Are you sure you want to end this auction early?')) {
        return;
    }

    try {
        const response = await fetch(`/api/auctions/${itemId}/end`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Auction ended successfully');
            loadMyListings(); // Reload listings
        } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'Failed to end auction'));
        }
    } catch (error) {
        console.error('Error ending auction:', error);
        alert('Error connecting to server');
    }
}

// Filter functionality
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        currentFilter = filter;
        
        let filtered = allListings;
        if (filter === 'active') {
            filtered = allListings.filter(l => l.status === 'ACTIVE');
        } else if (filter === 'ended') {
            filtered = allListings.filter(l => l.status === 'ENDED' && !l.highestBidderId);
        } else if (filter === 'sold') {
            filtered = allListings.filter(l => l.status === 'ENDED' && l.highestBidderId);
        }
        
        displayListings(filtered);
    });
});

// Load listings on page load
window.addEventListener('DOMContentLoaded', loadMyListings);