(function () {
    // Authentication check (file-local)
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (!token) {
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

    // Load seller's listings
    let allListings = [];
    let currentFilter = 'all';

    async function loadMyListings() {
        const container = document.getElementById('listings-container');
        if (!container) return;
        try {
            const resp = await fetch(`/api/auctions/seller/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                container.innerHTML = '<div class="loading">Failed to load listings</div>';
                return;
            }
            const data = await resp.json();
            allListings = Array.isArray(data) ? data : [];
            displayListings(allListings);
            updateStats(allListings);
        } catch (err) {
            console.error('Error loading listings:', err);
            if (container) container.innerHTML = '<div class="loading">Error loading listings</div>';
        }
    }

    function updateStats(listings) {
        const totalEl = document.getElementById('total-listings');
        if (totalEl) totalEl.textContent = String((listings || []).length);
    }

    function displayListings(listings) {
        const container = document.getElementById('listings-container');
        if (!container) return;

        if (!listings || listings.length === 0) {
            showNoListings();
            return;
        }

        container.innerHTML = listings.map(item => {
            const timeRemaining = getTimeRemaining(item.endTime);
            const statusClass = item.status === 'ACTIVE' ? 'active' : 'ended';

            return `
                <div class="listing-card" data-item-id="${item.itemId}">
                    <div class="listing-content">
                        <div class="listing-header">
                            <h3>${item.name || 'Untitled'}</h3>
                            <span class="status-badge ${statusClass}">${item.status}</span>
                        </div>
                        <p class="listing-description">${item.description || 'No description'}</p>
                        <div class="listing-details">
                            <div class="detail-item">
                                <span class="label">Starting Price:</span>
                                <span class="value">$${(item.startingPrice || 0).toFixed(2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Current Price:</span>
                                <span class="value">$${(item.currentPrice || 0).toFixed(2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Total Bids:</span>
                                <span class="value">${item.totalBids || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Time Remaining:</span>
                                <span class="value">${timeRemaining}</span>
                            </div>
                        </div>
                        <div class="listing-actions">
                            <a href="/bidding.html?itemId=${item.itemId}" class="btn-view" onclick="event.stopPropagation()">View Auction</a>
                            ${item.status === 'ACTIVE' ?
                                `<button class="btn-danger" onclick="endAuctionEarly(${item.itemId}); event.stopPropagation()">End Auction Early</button>` :
                                ''}
                        </div>
                    </div>
                    <div class="expanded-details">
                        <div class="expanded-section">
                            <h4>Bid History</h4>
                            <div class="bid-history-list" id="bid-history-${item.itemId}">
                                <div class="loading">Click to load bid history...</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers to cards
        document.querySelectorAll('.listing-card').forEach(card => {
            card.addEventListener('click', function() {
                toggleCardExpansion(this);
            });
        });
    }

    function getTimeRemaining(endTime) {
        if (!endTime) return 'N/A';

        const endDate = new Date(endTime);
        const now = new Date();
        const distance = endDate - now;

        if (distance <= 0) return 'Ended';

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    function showNoListings() {
        const container = document.getElementById('listings-container');
        const noListingsEl = document.getElementById('no-listings');

        if (container) container.style.display = 'none';
        if (noListingsEl) noListingsEl.style.display = 'block';
    }

    // Toggle card expansion and load bid history
    async function toggleCardExpansion(card) {
        const wasExpanded = card.classList.contains('expanded');

        // Collapse all other cards
        document.querySelectorAll('.listing-card.expanded').forEach(c => {
            if (c !== card) c.classList.remove('expanded');
        });

        // Toggle this card
        if (wasExpanded) {
            card.classList.remove('expanded');
        } else {
            card.classList.add('expanded');

            // Load bid history if not already loaded
            const itemId = card.getAttribute('data-item-id');
            const bidHistoryContainer = document.getElementById(`bid-history-${itemId}`);

            if (bidHistoryContainer && bidHistoryContainer.querySelector('.loading')) {
                await loadBidHistory(itemId);
            }
        }
    }

    // Load bid history for an item
    async function loadBidHistory(itemId) {
        const container = document.getElementById(`bid-history-${itemId}`);
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading">Loading bid history...</div>';

            const resp = await fetch(`/api/auctions/${itemId}/bids`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!resp.ok) {
                container.innerHTML = '<div class="no-bids">Failed to load bid history</div>';
                return;
            }

            const bids = await resp.json();

            if (!bids || bids.length === 0) {
                container.innerHTML = '<div class="no-bids">No bids yet</div>';
                return;
            }

            container.innerHTML = bids.map(bid => {
                const bidTime = new Date(bid.bidTime);
                const formattedTime = bidTime.toLocaleString();

                return `
                    <div class="bid-item">
                        <div class="bid-item-info">
                            <div class="bid-bidder">${bid.bidderName || 'User #' + bid.bidderId}</div>
                            <div class="bid-time">${formattedTime}</div>
                        </div>
                        <div class="bid-amount">$${(bid.amount || 0).toFixed(2)}</div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error('Error loading bid history:', err);
            container.innerHTML = '<div class="no-bids">Error loading bid history</div>';
        }
    }

    // End auction early
    async function endAuctionEarly(itemId) {
        if (!confirm('Are you sure you want to end this auction early? This action cannot be undone.')) {
            return;
        }

        try {
            const resp = await fetch(`/api/auctions/${itemId}/end`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!resp.ok) {
                const error = await resp.json();
                alert('Failed to end auction: ' + (error.message || 'Unknown error'));
                return;
            }

            alert('Auction ended successfully!');

            // Reload listings to show updated status
            await loadMyListings();

        } catch (err) {
            console.error('Error ending auction:', err);
            alert('Failed to end auction. Please try again.');
        }
    }

    // Make endAuctionEarly available globally
    window.endAuctionEarly = endAuctionEarly;

    document.addEventListener('DOMContentLoaded', () => {
        loadMyListings();
    });

    window._myListings = { loadMyListings, displayListings, updateStats, toggleCardExpansion, loadBidHistory };
})();