(function () {
    // Authentication check (file-local)
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (!token) {
        // If not on the auth page, redirect; guard with try/catch for tests
        try { window.location.href = '/'; } catch (e) {}
        return;
    }

    const usernameEl = document.getElementById('username-display');
    if (usernameEl) usernameEl.textContent = username || '';

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '/';
        });
    }

    // Back button functionality
    window.addEventListener('DOMContentLoaded', () => {
        const backBtn = document.getElementById('back-btn');
        const referrer = document.referrer;
        if (backBtn && referrer && referrer.includes(window.location.origin)) {
            backBtn.style.display = 'inline-block';
            backBtn.addEventListener('click', () => window.history.back());
        }
    });

    // Load user's bids
    let allBids = [];
    let currentFilter = 'all';

    async function loadMyBids() {
        const container = document.getElementById('bids-container');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading your bids...</div>';

        try {
            const resp = await fetch(`/api/auctions/users/${userId}/bids`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                container.innerHTML = '<div class="loading">Failed to load bids</div>';
                return;
            }
            const bids = await resp.json();
            allBids = Array.isArray(bids) ? bids : [];

            // Enhance bids with item and auction details
            const enhancedBids = await Promise.all(allBids.map(async (bid) => {
                try {
                    // Fetch item details
                    const itemResp = await fetch(`/api/items/${bid.itemId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const item = itemResp.ok ? await itemResp.json() : null;

                    // Fetch auction details
                    const auctionResp = await fetch(`/api/auctions/${bid.itemId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const auctionData = auctionResp.ok ? await auctionResp.json() : null;

                    return {
                        ...bid,
                        itemName: item?.name || 'Unknown Item',
                        itemDescription: item?.description || '',
                        currentPrice: item?.currentPrice || bid.amount,
                        auctionStatus: auctionData?.auction?.status || 'UNKNOWN',
                        winningBidId: auctionData?.auction?.winningBidId || null
                    };
                } catch (err) {
                    console.error('Error fetching details for bid:', err);
                    return {
                        ...bid,
                        itemName: 'Item #' + bid.itemId,
                        itemDescription: '',
                        currentPrice: bid.amount,
                        auctionStatus: 'UNKNOWN',
                        winningBidId: null
                    };
                }
            }));

            allBids = enhancedBids;
            displayBids(enhancedBids);
        } catch (err) {
            console.error('Error loading bids:', err);
            if (container) container.innerHTML = '<div class="loading">Error loading bids</div>';
        }
    }

    function getBidStatus(bid) {
        const isWinning = bid.winningBidId === bid.id;
        const isActive = bid.auctionStatus === 'ACTIVE';
        const isEnded = bid.auctionStatus === 'ENDED';

        if (isActive && isWinning) return 'winning';
        if (isActive && !isWinning) return 'outbid';
        if (isEnded && isWinning) return 'won';
        if (isEnded && !isWinning) return 'lost';
        return 'unknown';
    }

    function displayBids(bids) {
        const container = document.getElementById('bids-container');
        const noBidsEl = document.getElementById('no-bids');

        if (!container) return;

        if (!bids || bids.length === 0) {
            container.style.display = 'none';
            if (noBidsEl) noBidsEl.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        if (noBidsEl) noBidsEl.style.display = 'none';

        container.innerHTML = bids.map(bid => {
            const status = getBidStatus(bid);
            const statusClass = status === 'winning' ? 'status-winning' :
                               status === 'outbid' ? 'status-outbid' :
                               status === 'won' ? 'status-won' : 'status-lost';
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);

            const bidTime = new Date(bid.bidTime);
            const formattedTime = bidTime.toLocaleString();

            return `
                <div class="bid-card">
                    <div class="bid-header">
                        <h3 class="bid-item-name">${bid.itemName}</h3>
                        <span class="bid-status ${statusClass}">${statusText}</span>
                    </div>
                    <p class="bid-description">${bid.itemDescription || 'No description available'}</p>
                    <div class="bid-details">
                        <div class="bid-detail-item">
                            <span class="label">Your Bid:</span>
                            <span class="value bid-amount">$${(bid.amount || 0).toFixed(2)}</span>
                        </div>
                        <div class="bid-detail-item">
                            <span class="label">Current Price:</span>
                            <span class="value">$${(bid.currentPrice || 0).toFixed(2)}</span>
                        </div>
                        <div class="bid-detail-item">
                            <span class="label">Bid Time:</span>
                            <span class="value">${formattedTime}</span>
                        </div>
                        <div class="bid-detail-item">
                            <span class="label">Auction Status:</span>
                            <span class="value">${bid.auctionStatus}</span>
                        </div>
                    </div>
                    <div class="bid-actions">
                        <a href="/bidding.html?itemId=${bid.itemId}" class="btn btn-primary">View Auction</a>
                        ${status === 'won' ?
                            `<a href="/payment.html?itemId=${bid.itemId}" class="btn btn-success">Pay Now</a>` :
                            ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // init when present
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('bids-container');
        if (container) loadMyBids();
    });

    // expose for debugging/tests if needed
    window._myBids = { loadMyBids, displayBids };
})();