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
        const container = document.getElementById('my-listings-container');
        if (!container) return;
        try {
            const resp = await fetch(`/api/auctions/seller/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                container.textContent = 'Failed to load listings';
                return;
            }
            const data = await resp.json();
            allListings = Array.isArray(data) ? data : [];
            displayListings(allListings);
            updateStats(allListings);
        } catch (err) {
            if (container) container.textContent = 'Error loading listings';
        }
    }

    function updateStats(listings) {
        const totalEl = document.getElementById('total-listings');
        if (totalEl) totalEl.textContent = String((listings || []).length);
    }

    function displayListings(listings) {
        const listEl = document.getElementById('listings-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        if (!listings || listings.length === 0) {
            showNoListings();
            return;
        }
        listings.forEach(item => {
            const row = document.createElement('div');
            row.className = 'listing-row';
            row.innerHTML = `
                <div class="listing-title">${item.name || 'Untitled'}</div>
                <div class="listing-price">$${(item.startingPrice || 0).toFixed ? (item.startingPrice).toFixed(2) : item.startingPrice}</div>
                <div class="listing-actions"><a href="/bidding.html?itemId=${item.itemId}">View</a></div>
            `;
            listEl.appendChild(row);
        });
    }

    function showNoListings() {
        const listEl = document.getElementById('listings-list');
        if (!listEl) return;
        listEl.innerHTML = '<div class="empty">You have no listings</div>';
    }

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('my-listings-container');
        if (container) loadMyListings();
    });

    window._myListings = { loadMyListings, displayListings, updateStats };
})();