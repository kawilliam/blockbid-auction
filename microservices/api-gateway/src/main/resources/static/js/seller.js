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

// ===== PAGE LOAD SETUP =====
window.addEventListener('DOMContentLoaded', () => {
    setupFormValidation();
    setupLivePreview();
    setupCharacterCounters();
    setupFormSubmission();
});

// ===== SETUP LIVE PREVIEW =====
function setupLivePreview() {
    // Update preview when form fields change
    document.getElementById('item-name').addEventListener('input', updatePreviewName);
    document.getElementById('item-description').addEventListener('input', updatePreviewDescription);
    document.getElementById('starting-price').addEventListener('input', updatePreviewPrice);
    document.getElementById('auction-duration').addEventListener('change', updatePreviewDuration);
    document.getElementById('item-category').addEventListener('change', updatePreviewCategory);
}

function updatePreviewName() {
    const name = document.getElementById('item-name').value.trim();
    document.getElementById('preview-name').textContent = name || 'Enter item name...';
}

function updatePreviewDescription() {
    const description = document.getElementById('item-description').value.trim();
    document.getElementById('preview-description').textContent = description || 'Enter item description...';
}

function updatePreviewPrice() {
    const price = document.getElementById('starting-price').value;
    document.getElementById('preview-price').textContent = price ? parseFloat(price).toFixed(2) : '0.00';
}

function updatePreviewDuration() {
    const duration = document.getElementById('auction-duration').value;
    const durationMap = {
        '1': '1 Day',
        '3': '3 Days',
        '5': '5 Days',
        '7': '7 Days',
        '10': '10 Days'
    };
    document.getElementById('preview-duration-text').textContent = durationMap[duration] || 'Select duration';
}

function updatePreviewCategory() {
    const category = document.getElementById('item-category').value;
    const categoryMap = {
        'electronics': 'Electronics',
        'clothing': 'Clothing & Accessories',
        'home': 'Home & Garden',
        'sports': 'Sports & Recreation',
        'books': 'Books & Media',
        'collectibles': 'Collectibles & Art',
        'automotive': 'Automotive',
        'other': 'Other'
    };
    document.getElementById('preview-category-text').textContent = categoryMap[category] || 'Select category';
}

// ===== CHARACTER COUNTERS =====
function setupCharacterCounters() {
    addCharacterCounter('item-name', 100);
    addCharacterCounter('item-description', 500);
    addCharacterCounter('shipping-details', 200);
}

function addCharacterCounter(inputId, maxLength) {
    const input = document.getElementById(inputId);
    const counterDiv = document.createElement('div');
    counterDiv.className = 'char-counter';
    
    const updateCounter = () => {
        const remaining = maxLength - input.value.length;
        counterDiv.textContent = `${remaining} characters remaining`;
        
        if (remaining < 20) {
            counterDiv.className = 'char-counter danger';
        } else if (remaining < 50) {
            counterDiv.className = 'char-counter warning';
        } else {
            counterDiv.className = 'char-counter';
        }
    };
    
    input.addEventListener('input', updateCounter);
    input.parentNode.appendChild(counterDiv);
    updateCounter();
}

// ===== FORM VALIDATION =====
function setupFormValidation() {
    const form = document.getElementById('seller-form');
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
    
    // Reserve price should be >= starting price
    document.getElementById('reserve-price').addEventListener('input', validateReservePrice);
}

function validateField(event) {
    const field = event.target;
    clearFieldError(event);
    
    if (!field.value.trim() && field.required) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Specific validations
    switch (field.id) {
        case 'starting-price':
            if (parseFloat(field.value) <= 0) {
                showFieldError(field, 'Starting price must be greater than $0');
                return false;
            }
            break;
            
        case 'item-name':
            if (field.value.trim().length < 3) {
                showFieldError(field, 'Item name must be at least 3 characters');
                return false;
            }
            break;
            
        case 'item-description':
            if (field.value.trim().length < 10) {
                showFieldError(field, 'Description must be at least 10 characters');
                return false;
            }
            break;
    }
    
    return true;
}

function validateReservePrice() {
    const startingPrice = parseFloat(document.getElementById('starting-price').value) || 0;
    const reservePrice = parseFloat(document.getElementById('reserve-price').value) || 0;
    
    if (reservePrice > 0 && reservePrice < startingPrice) {
        showFieldError(document.getElementById('reserve-price'), 'Reserve price must be greater than starting price');
    } else {
        clearFieldError({ target: document.getElementById('reserve-price') });
    }
}

function showFieldError(field, message) {
    clearFieldError({ target: field });
    
    field.style.borderColor = 'var(--danger-color)';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = 'var(--danger-color)';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(event) {
    const field = event.target;
    const errorDiv = field.parentNode.querySelector('.field-error');
    
    if (errorDiv) {
        errorDiv.remove();
    }
    
    field.style.borderColor = '';
}

// ===== FORM SUBMISSION =====
function setupFormSubmission() {
    document.getElementById('seller-form').addEventListener('submit', handleFormSubmission);
}

async function handleFormSubmission(event) {
    event.preventDefault();
    
    // Validate entire form
    if (!validateForm()) {
        showSellerMessage('Please fix the errors above', 'error');
        return;
    }
    
    // Collect form data
    const formData = collectFormData();
    
    // Submit to backend
    await submitAuctionItem(formData);
}

function validateForm() {
    const form = document.getElementById('seller-form');
    const requiredFields = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    return isValid;
}

function collectFormData() {
    const durationDays = parseInt(document.getElementById('auction-duration').value);
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + durationDays);
    
    return {
        name: document.getElementById('item-name').value.trim(),
        description: document.getElementById('item-description').value.trim(),
        category: document.getElementById('item-category').value,
        condition: document.getElementById('item-condition').value,
        startingPrice: parseFloat(document.getElementById('starting-price').value),
        reservePrice: parseFloat(document.getElementById('reserve-price').value) || null,
        auctionType: document.getElementById('auction-type').value,
        endTime: endTime.toISOString(),
        shippingCost: parseFloat(document.getElementById('shipping-cost').value) || 0,
        expeditedShippingCost: parseFloat(document.getElementById('expedited-shipping').value) || 15,
        shippingDetails: document.getElementById('shipping-details').value.trim() || null,
        sellerId: userId
    };
}

async function submitAuctionItem(itemData) {
    const createBtn = document.getElementById('create-auction-btn');
    
    try {
        createBtn.disabled = true;
        createBtn.textContent = 'Creating Auction...';
        
        const response = await fetch('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(itemData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccessOverlay(result);
        } else if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
        } else {
            showSellerMessage(result.message || 'Failed to create auction', 'error');
        }
        
    } catch (error) {
        console.error('Error creating auction:', error);
        showSellerMessage('Error connecting to server', 'error');
    } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'Create Auction';
    }
}

// ===== SUCCESS HANDLING =====
function showSuccessOverlay(auctionData) {
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    
    overlay.innerHTML = `
        <div class="success-message">
            <div class="success-icon">✓</div>
            <h3>Auction Created Successfully!</h3>
            <p>Your item "${auctionData.name}" is now live and ready for bidding.</p>
            <button class="btn btn-primary" onclick="goToAuction(${auctionData.id})">
                View Your Auction
            </button>
            <button class="btn btn-secondary" onclick="goToCatalogue()" style="margin-left: 10px;">
                Browse Auctions
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-remove overlay after 10 seconds
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
            goToCatalogue();
        }
    }, 10000);
}

function goToAuction(itemId) {
    window.location.href = `/bidding.html?itemId=${itemId}`;
}

function goToCatalogue() {
    window.location.href = '/catalogue.html';
}

// ===== UTILITY FUNCTIONS =====
function showSellerMessage(text, type) {
    const messageDiv = document.getElementById('seller-message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    }
}

// ===== REMOVE EMOJI FROM SUCCESS ICON =====
// Update success overlay to not use emoji
function showSuccessOverlayNoEmoji(auctionData) {
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    
    overlay.innerHTML = `
        <div class="success-message">
            <div class="success-icon">SUCCESS</div>
            <h3>Auction Created Successfully!</h3>
            <p>Your item "${auctionData.name}" is now live and ready for bidding.</p>
            <button class="btn btn-primary" onclick="goToAuction(${auctionData.id})">
                View Your Auction
            </button>
            <button class="btn btn-secondary" onclick="goToCatalogue()" style="margin-left: 10px;">
                Browse Auctions
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-remove overlay after 10 seconds
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
            goToCatalogue();
        }
    }, 10000);
}

// Replace the original function
showSuccessOverlay = showSuccessOverlayNoEmoji;