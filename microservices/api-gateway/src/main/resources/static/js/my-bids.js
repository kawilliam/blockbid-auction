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

// Load user's bids
let allBids = [];
let currentFilter = 'all';

async function loadMyBids() {
    try {
        const response = await fetch(`/api/auctions/users/${userId}/bids`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            allBids = await response.json();
            
            // Fetch item details for each bid
            const bidsWithItems = await Promise.all(allBids.map(async (bid) => {
                try {
                    const itemResponse = await fetch(`/api/items/${bid.itemId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (itemResponse.ok) {
                        bid.item = await itemResponse.json();
                    }
                } catch (e) {
                    console.error('Error loading item:', e);
                }
                return bid;
            }));

            allBids = bidsWithItems;
            displayBids(allBids);
        } else {
            showNoBids();
        }
    } catch (error) {
        console.error('Error loading bids:', error);
        showNoBids();
    }
}

function displayBids(bids) {
    const container = document.getElementById('bids-container');
    const noBidsDiv = document.getElementById('no-bids');

    if (!bids || bids.length === 0) {
        container.style.display = 'none';
        noBidsDiv.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    noBidsDiv.style.display = 'none';

    container.innerHTML = bids.map(bid => {
        const item = bid.item || {};
        const isWinning = bid.status === 'WINNING';
        const isOutbid = bid.status === 'OUTBID';
        const isActive = item.status === 'ACTIVE';
        
        return `
            <div class="bid-card">
                <div class="bid-item-info">
                    <div class="bid-item-name">${item.name || 'Loading...'}</div>
                    <div class="bid-details">
                        Your bid: $${bid.amount.toFixed(2)} • 
                        Current price: $${item.currentPrice?.toFixed(2) || 'N/A'} •
                        ${isActive ? 'Active' : 'Ended'}
                    </div>
                </div>
                <div class="bid-status">
                    <div class="bid-amount">$${bid.amount.toFixed(2)}</div>
                    <span class="status-badge status-${bid.status.toLowerCase()}">${bid.status}</span>
                    <div class="bid-actions">
                        <button class="btn btn-sm btn-secondary" onclick="location.href='/bidding.html?itemId=${bid.itemId}'">
                            View Auction
                        </button>
                        ${isWinning && !isActive ? '<button class="btn btn-sm btn-primary" onclick="location.href=\'/payment.html?itemId=' + bid.itemId + '\'">Pay Now</button>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showNoBids() {
    document.getElementById('bids-container').style.display = 'none';
    document.getElementById('no-bids').style.display = 'block';
}

// Filter functionality
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        currentFilter = filter;
        
        if (filter === 'all') {
            displayBids(allBids);
        } else {
            const filtered = allBids.filter(bid => bid.status.toLowerCase() === filter);
            displayBids(filtered);
        }
    });
});

// Load bids on page load
window.addEventListener('DOMContentLoaded', loadMyBids);