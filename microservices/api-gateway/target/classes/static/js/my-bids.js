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
        const container = document.getElementById('my-bids-container');
        if (!container) return;
        try {
            const resp = await fetch(`/api/bids/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                container.textContent = 'Failed to load bids';
                return;
            }
            const data = await resp.json();
            allBids = Array.isArray(data) ? data : [];
            displayBids(allBids);
        } catch (err) {
            if (container) container.textContent = 'Error loading bids';
        }
    }

    function displayBids(bids) {
        const listEl = document.getElementById('bids-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        if (!bids || bids.length === 0) {
            listEl.textContent = 'No bids found';
            return;
        }
        bids.forEach(b => {
            const li = document.createElement('div');
            li.className = 'bid-row';
            li.innerHTML = `
                <div class="bid-item">${b.itemName || 'Item #' + (b.itemId || '')}</div>
                <div class="bid-amount">$${(b.amount || 0).toFixed ? (b.amount).toFixed(2) : b.amount}</div>
                <div class="bid-time">${b.createdAt || ''}</div>
            `;
            listEl.appendChild(li);
        });
    }

    // init when present
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('my-bids-container');
        if (container) loadMyBids();
    });

    // expose for debugging/tests if needed
    window._myBids = { loadMyBids, displayBids };
})();