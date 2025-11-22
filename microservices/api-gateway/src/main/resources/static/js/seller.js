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

// ===== COMPREHENSIVE ITEM VALIDATION =====
function validateItemName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Item name is required' };
    }
    if (name.trim().length < 3) {
        return { valid: false, error: 'Item name must be at least 3 characters' };
    }
    if (name.trim().length > 100) {
        return { valid: false, error: 'Item name cannot exceed 100 characters' };
    }
    return { valid: true };
}

function validateItemDescription(description) {
    if (!description || description.trim().length === 0) {
        return { valid: false, error: 'Description is required' };
    }
    if (description.trim().length < 10) {
        return { valid: false, error: 'Description must be at least 10 characters' };
    }
    if (description.trim().length > 500) {
        return { valid: false, error: 'Description cannot exceed 500 characters' };
    }
    return { valid: true };
}

function validateStartingPrice(price) {
    if (!price || price === '') {
        return { valid: false, error: 'Starting price is required' };
    }
    
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
        return { valid: false, error: 'Price must be a valid number' };
    }
    
    if (numericPrice <= 0) {
        return { valid: false, error: 'Starting price must be greater than $0' };
    }
    
    if (numericPrice > 1000000) {
        return { valid: false, error: 'Starting price cannot exceed $1,000,000' };
    }
    
    if ((numericPrice * 100) % 1 !== 0) {
        return { valid: false, error: 'Price can only have up to 2 decimal places' };
    }
    
    return { valid: true };
}

function validateReservePriceAgainstStarting(reservePrice, startingPrice) {
    if (!reservePrice || reservePrice === '') {
        return { valid: true }; // Optional field
    }
    
    const numericReserve = parseFloat(reservePrice);
    const numericStarting = parseFloat(startingPrice);
    
    if (isNaN(numericReserve)) {
        return { valid: false, error: 'Reserve price must be a valid number' };
    }
    
    if (numericReserve < numericStarting) {
        return { valid: false, error: `Reserve price must be at least $${numericStarting.toFixed(2)} (starting price)` };
    }
    
    return { valid: true };
}

function validateCategory(category) {
    if (!category || category === '') {
        return { valid: false, error: 'Please select a category' };
    }
    return { valid: true };
}

function validateCondition(condition) {
    if (!condition || condition === '') {
        return { valid: false, error: 'Please select item condition' };
    }
    return { valid: true };
}

function validateDuration(duration) {
    if (!duration || duration === '') {
        return { valid: false, error: 'Please select auction duration' };
    }
    return { valid: true };
}

function showSellerFieldError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentElement.querySelector('.seller-field-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    field.style.borderColor = '#dc2626';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'seller-field-error';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = errorMessage;
    
    field.parentElement.appendChild(errorDiv);
}

function clearSellerFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentElement.querySelector('.seller-field-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    field.style.borderColor = '';
}

function clearAllSellerErrors() {
    document.querySelectorAll('.seller-field-error').forEach(error => error.remove());
    document.querySelectorAll('#seller-form input, #seller-form textarea, #seller-form select').forEach(input => {
        input.style.borderColor = '';
    });
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
    clearAllSellerErrors();
    let hasErrors = false;
    
    // Validate item name
    const name = document.getElementById('item-name').value;
    const nameValidation = validateItemName(name);
    if (!nameValidation.valid) {
        showSellerFieldError('item-name', nameValidation.error);
        hasErrors = true;
    }
    
    // Validate description
    const description = document.getElementById('item-description').value;
    const descValidation = validateItemDescription(description);
    if (!descValidation.valid) {
        showSellerFieldError('item-description', descValidation.error);
        hasErrors = true;
    }
    
    // Validate category
    const category = document.getElementById('item-category').value;
    const categoryValidation = validateCategory(category);
    if (!categoryValidation.valid) {
        showSellerFieldError('item-category', categoryValidation.error);
        hasErrors = true;
    }
    
    // Validate condition
    const condition = document.getElementById('item-condition').value;
    const conditionValidation = validateCondition(condition);
    if (!conditionValidation.valid) {
        showSellerFieldError('item-condition', conditionValidation.error);
        hasErrors = true;
    }
    
    // Validate starting price
    const startingPrice = document.getElementById('starting-price').value;
    const priceValidation = validateStartingPrice(startingPrice);
    if (!priceValidation.valid) {
        showSellerFieldError('starting-price', priceValidation.error);
        hasErrors = true;
    }
    
    // Validate reserve price (against starting price)
    const reservePrice = document.getElementById('reserve-price').value;
    const reserveValidation = validateReservePriceAgainstStarting(reservePrice, startingPrice);
    if (!reserveValidation.valid) {
        showSellerFieldError('reserve-price', reserveValidation.error);
        hasErrors = true;
    }
    
    // Validate duration
    const duration = document.getElementById('auction-duration').value;
    const durationValidation = validateDuration(duration);
    if (!durationValidation.valid) {
        showSellerFieldError('auction-duration', durationValidation.error);
        hasErrors = true;
    }
    
    if (hasErrors) {
        showSellerMessage('Please fix the errors above', 'error');
        const firstError = document.querySelector('.seller-field-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    return !hasErrors;
}

function collectFormData() {
    const durationDays = parseInt(document.getElementById('auction-duration').value);
    
    // Calculate end time properly
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + durationDays);
    
    // Format as ISO string for Java LocalDateTime (remove milliseconds and Z)
    const endTimeISO = endTime.toISOString().split('.')[0]; // "2025-11-27T22:31:00"
    
    return {
        name: document.getElementById('item-name').value.trim(),
        description: document.getElementById('item-description').value.trim(),
        category: document.getElementById('item-category').value,
        condition: document.getElementById('item-condition').value,
        startingPrice: parseFloat(document.getElementById('starting-price').value),
        reservePrice: parseFloat(document.getElementById('reserve-price').value) || null,
        auctionType: document.getElementById('auction-type').value,
        endTime: endTimeISO,  // Properly formatted ISO string
        shippingCost: parseFloat(document.getElementById('shipping-cost').value) || 0,
        expeditedShippingCost: parseFloat(document.getElementById('expedited-shipping').value) || 15,
        shippingDetails: document.getElementById('shipping-details').value.trim() || null,
        sellerId: userId
    };
}

async function submitAuctionItem(itemData) {
    const createBtn = document.getElementById('create-auction-btn');
    
    // Log the data being sent for debugging
    console.log('Submitting auction item:', itemData);
    console.log('End Time:', itemData.endTime);
    
    // Validate data one more time
    if (!itemData.name || !itemData.description || !itemData.startingPrice) {
        showSellerMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (itemData.startingPrice <= 0) {
        showSellerMessage('Starting price must be greater than $0', 'error');
        return;
    }
    
    // Validate endTime format
    if (!itemData.endTime || itemData.endTime.length < 19) {
        showSellerMessage('Invalid auction end time', 'error');
        console.error('Invalid endTime format:', itemData.endTime);
        return;
    }
    
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
        
        if (response.status === 401) {
            showSellerMessage('Session expired. Please log in again.', 'error');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/';
            }, 2000);
            return;
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            // Handle field-specific errors
            if (result.field) {
                showSellerFieldError(result.field, result.message);
                showSellerMessage(result.message, 'error');
            } else {
                showSellerMessage(result.message || 'Failed to create auction', 'error');
            }
            return;
        }
        
        showSuccessOverlay(result);
        
    } catch (error) {
        console.error('Error creating auction:', error);
        showSellerMessage('Error connecting to server. Please try again.', 'error');
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