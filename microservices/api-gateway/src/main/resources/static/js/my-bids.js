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

// Load user's bids
let allBids = [];
let currentFilter = 'all';

async function loadMyBids() {
    try {
        const response = await fetch(`/api/auctions/users/${userId}/bids`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            let bids = await response.json();
            
            // Remove duplicate bids - keep only the highest bid per item
            const bidsByItem = new Map();
            bids.forEach(bid => {
                const existing = bidsByItem.get(bid.itemId);
                if (!existing || bid.amount > existing.amount) {
                    bidsByItem.set(bid.itemId, bid);
                }
            });
            
            allBids = Array.from(bidsByItem.values());
            
            // Fetch item details for each bid
            const bidsWithItems = await Promise.all(allBids.map(async (bid) => {
                try {
                    const itemResponse = await fetch(`/api/items/${bid.itemId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (itemResponse.ok) {
                        const item = await itemResponse.json();
                        bid.item = item;
                        
                        // Determine actual status
                        if (item.status === 'ENDED') {
                            bid.displayStatus = (item.highestBidderId === parseInt(userId)) ? 'WON' : 'LOST';
                        } else {
                            bid.displayStatus = (item.highestBidderId === parseInt(userId)) ? 'WINNING' : 'OUTBID';
                        }
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

    container.style.display = 'grid';
    noBidsDiv.style.display = 'none';

    container.innerHTML = bids.map(bid => {
        const item = bid.item;
        if (!item) return '';
        
        const isWon = bid.displayStatus === 'WON';
		const isPaid = item.paymentStatus === 'PAID';
        
        let statusClass = 'status-outbid';
        if (isWon) statusClass = 'status-won';
        else if (bid.displayStatus === 'WINNING') statusClass = 'status-winning';
        
        return `
            <div class="bid-card" onclick="location.href='/bidding.html?itemId=${item.id}'" style="cursor: pointer;">
                <div class="bid-image">
                    <span>ITEM</span>
                </div>
                <div class="bid-content">
                    <span class="bid-status-badge ${statusClass}">${isPaid ? 'PAID' : bid.displayStatus}</span>
                    <h3 class="bid-title">${item.name}</h3>
                    <p class="bid-description">${item.description}</p>
                    
                    <div class="bid-stats">
                        <div class="bid-stat">
                            <div class="bid-stat-label">Your Bid</div>
                            <div class="bid-stat-value">$${bid.amount.toFixed(2)}</div>
                        </div>
                        <div class="bid-stat">
                            <div class="bid-stat-label">Current Price</div>
                            <div class="bid-stat-value">$${item.currentPrice.toFixed(2)}</div>
                        </div>
                        <div class="bid-stat">
                            <div class="bid-stat-label">Status</div>
                            <div class="bid-stat-value">${item.status}</div>
                        </div>
                    </div>
                    
                    <div class="bid-actions">
                        ${(isWon && !isPaid) ? 
                            '<button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); location.href=\'/payment.html?itemId=' + item.id + '\'">Pay Now</button>' :
                            isPaid ? '<button class="btn btn-sm btn-success" disabled>Paid</button>' : ''
                        }
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
        
        let filtered = allBids;
        if (filter === 'winning') {
            filtered = allBids.filter(b => b.displayStatus === 'WINNING');
        } else if (filter === 'outbid') {
            filtered = allBids.filter(b => b.displayStatus === 'OUTBID');
        } else if (filter === 'won') {
            filtered = allBids.filter(b => b.displayStatus === 'WON');
        } else if (filter === 'lost') {
            filtered = allBids.filter(b => b.displayStatus === 'LOST');
        }
        
        displayBids(filtered);
    });
});

// Load bids on page load
window.addEventListener('DOMContentLoaded', loadMyBids);