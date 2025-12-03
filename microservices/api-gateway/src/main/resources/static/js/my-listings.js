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
                <div class="listing-card">
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
                        <a href="/bidding.html?itemId=${item.itemId}" class="btn btn-secondary">View Auction</a>
                    </div>
                </div>
            `;
        }).join('');
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

    document.addEventListener('DOMContentLoaded', () => {
        loadMyListings();
    });

    window._myListings = { loadMyListings, displayListings, updateStats };
})();