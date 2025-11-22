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

// ===== GLOBAL VARIABLES =====
let itemId = null;
let orderDetails = null;
let shippingCost = 0;
let expeditedShippingCost = 15.00;

// ===== GET ITEM ID FROM URL =====
function getItemIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('itemId');
}

// ===== PAGE LOAD =====
window.addEventListener('DOMContentLoaded', () => {
    itemId = getItemIdFromUrl();
    
    if (!itemId) {
        alert('No item specified');
        window.location.href = '/catalogue.html';
        return;
    }
    
    loadOrderDetails();
    loadUserAddress();
    setupPaymentForm();
    setupShippingOptions();
});

// ===== LOAD ORDER DETAILS =====
async function loadOrderDetails() {
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            orderDetails = await response.json();
            
            // Verify user won this auction
            if (orderDetails.highestBidderId != userId) {
                alert('You are not the winner of this auction');
                window.location.href = '/catalogue.html';
                return;
            }
            
            displayOrderSummary(orderDetails);
            updateCostBreakdown();
        } else if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
        } else {
            showError('Error loading order details');
        }
    } catch (error) {
        console.error('Error loading order:', error);
        showError('Error connecting to server');
    }
}

// ===== DISPLAY ORDER SUMMARY =====
function displayOrderSummary(order) {
    const itemSummary = document.getElementById('item-summary');
    
    itemSummary.innerHTML = `
        <div class="item-card-summary">
            <div class="item-image-small">
                <span>ITEM</span>
            </div>
            <div class="item-info">
                <div class="item-name">${escapeHtml(order.name)}</div>
                <div class="item-description-short">${escapeHtml(order.description.substring(0, 80))}...</div>
                <div class="winning-bid">Winning bid: $${order.currentPrice.toFixed(2)}</div>
            </div>
        </div>
    `;
}

// ===== LOAD USER ADDRESS =====
async function loadUserAddress() {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            document.getElementById('shipping-address').value = user.address || 'No address on file';
        } else {
            document.getElementById('shipping-address').value = 'Unable to load address';
        }
    } catch (error) {
        console.error('Error loading address:', error);
        document.getElementById('shipping-address').value = 'Error loading address';
    }
}

// ===== SETUP SHIPPING OPTIONS =====
function setupShippingOptions() {
    const shippingOptions = document.querySelectorAll('input[name="shipping"]');
    
    shippingOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            if (e.target.value === 'expedited') {
                shippingCost = expeditedShippingCost;
            } else {
                shippingCost = 0;
            }
            updateCostBreakdown();
        });
    });
    
    // Update expedited cost display
    document.getElementById('expedited-cost').textContent = `+$${expeditedShippingCost.toFixed(2)}`;
}

// ===== UPDATE COST BREAKDOWN =====
function updateCostBreakdown() {
    if (!orderDetails) return;
    
    const itemPrice = orderDetails.currentPrice;
    const totalAmount = itemPrice + shippingCost;
    
    const costBreakdown = document.getElementById('cost-breakdown');
    costBreakdown.innerHTML = `
        <div class="cost-row subtotal">
            <span>Item Price:</span>
            <span>$${itemPrice.toFixed(2)}</span>
        </div>
        <div class="cost-row shipping">
            <span>Shipping:</span>
            <span>${shippingCost === 0 ? 'Free' : '$' + shippingCost.toFixed(2)}</span>
        </div>
        <div class="cost-row total">
            <span>Total:</span>
            <span>$${totalAmount.toFixed(2)}</span>
        </div>
    `;
    
    document.getElementById('total-amount').textContent = `$${totalAmount.toFixed(2)}`;
}

// ===== SETUP PAYMENT FORM =====
function setupPaymentForm() {
    const paymentForm = document.getElementById('payment-form');
    
    // Credit card number formatting
    const cardNumberInput = document.getElementById('card-number');
    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });
    
    // Expiry date formatting
    const expiryInput = document.getElementById('expiry-date');
    expiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
    
    // CVV numeric only
    const cvvInput = document.getElementById('cvv');
    cvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    
    // Form submission
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await processPayment();
    });
	
    // Real-time validation
    cardNumberInput.addEventListener('blur', () => {
        const validation = validateCardNumber(cardNumberInput.value);
        if (!validation.valid) {
            showPaymentFieldError('card-number', validation.error);
        }
    });
    
    cardNumberInput.addEventListener('focus', () => {
        clearPaymentFieldError('card-number');
    });
    
    expiryInput.addEventListener('blur', () => {
        const validation = validateExpiryDate(expiryInput.value);
        if (!validation.valid) {
            showPaymentFieldError('expiry-date', validation.error);
        }
    });
    
    expiryInput.addEventListener('focus', () => {
        clearPaymentFieldError('expiry-date');
    });
    
    cvvInput.addEventListener('blur', () => {
        const validation = validateCVV(cvvInput.value);
        if (!validation.valid) {
            showPaymentFieldError('cvv', validation.error);
        }
    });
    
    cvvInput.addEventListener('focus', () => {
        clearPaymentFieldError('cvv');
    });
    
    const cardholderInput = document.getElementById('cardholder-name');
    cardholderInput.addEventListener('blur', () => {
        const validation = validateCardholderName(cardholderInput.value);
        if (!validation.valid) {
            showPaymentFieldError('cardholder-name', validation.error);
        }
    });
    
    cardholderInput.addEventListener('focus', () => {
        clearPaymentFieldError('cardholder-name');
    });
}

// ===== PROCESS PAYMENT =====
async function processPayment() {
    const payNowBtn = document.getElementById('pay-now-btn');
    
    // Validate form
    if (!validatePaymentForm()) {
        return;
    }
    
    // Get form data
    const paymentData = {
        itemId: itemId,
        userId: userId,
        totalAmount: orderDetails.currentPrice + shippingCost,
        shippingType: document.querySelector('input[name="shipping"]:checked').value,
        paymentDetails: {
            cardNumber: document.getElementById('card-number').value,
            expiryDate: document.getElementById('expiry-date').value,
            cvv: document.getElementById('cvv').value,
            cardholderName: document.getElementById('cardholder-name').value
        }
    };
    
    try {
        payNowBtn.disabled = true;
        payNowBtn.textContent = 'Processing Payment...';
        
        const response = await fetch('/api/payments/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showPaymentMessage('Payment processed successfully! Redirecting...', 'success');
            
            // Redirect to receipt page
            setTimeout(() => {
                window.location.href = `/receipt.html?paymentId=${result.paymentId}`;
            }, 2000);
        } else {
            showPaymentMessage(result.message || 'Payment failed', 'error');
        }
        
    } catch (error) {
        console.error('Error processing payment:', error);
        showPaymentMessage('Error connecting to server', 'error');
    } finally {
        payNowBtn.disabled = false;
        payNowBtn.textContent = 'Pay Now';
    }
}

// ===== PAYMENT FIELD VALIDATION =====
function validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (!cleaned) {
        return { valid: false, error: 'Card number is required' };
    }
    
    if (!/^\d+$/.test(cleaned)) {
        return { valid: false, error: 'Card number can only contain digits' };
    }
    
    if (cleaned.length < 13) {
        return { valid: false, error: 'Card number is too short (minimum 13 digits)' };
    }
    
    if (cleaned.length > 19) {
        return { valid: false, error: 'Card number is too long (maximum 19 digits)' };
    }
    
    // Luhn algorithm check
    if (!luhnCheck(cleaned)) {
        return { valid: false, error: 'Invalid card number (failed checksum)' };
    }
    
    return { valid: true };
}

function luhnCheck(cardNumber) {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

function validateExpiryDate(expiryDate) {
    if (!expiryDate) {
        return { valid: false, error: 'Expiry date is required' };
    }
    
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        return { valid: false, error: 'Expiry date must be in MM/YY format' };
    }
    
    const [month, year] = expiryDate.split('/').map(num => parseInt(num));
    
    if (month < 1 || month > 12) {
        return { valid: false, error: 'Invalid month (must be 01-12)' };
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { valid: false, error: 'Card has expired' };
    }
    
    if (year > currentYear + 20) {
        return { valid: false, error: 'Expiry date is too far in the future' };
    }
    
    return { valid: true };
}

function validateCVV(cvv) {
    if (!cvv) {
        return { valid: false, error: 'CVV is required' };
    }
    
    if (!/^\d{3,4}$/.test(cvv)) {
        return { valid: false, error: 'CVV must be 3 or 4 digits' };
    }
    
    return { valid: true };
}

function validateCardholderName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Cardholder name is required' };
    }
    
    if (name.trim().length < 2) {
        return { valid: false, error: 'Name is too short (minimum 2 characters)' };
    }
    
    if (name.trim().length > 50) {
        return { valid: false, error: 'Name is too long (maximum 50 characters)' };
    }
    
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
        return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }
    
    return { valid: true };
}

function showPaymentFieldError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentElement.querySelector('.payment-field-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    field.style.borderColor = '#dc2626';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'payment-field-error';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = errorMessage;
    
    field.parentElement.appendChild(errorDiv);
}

function clearPaymentFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentElement.querySelector('.payment-field-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    field.style.borderColor = '';
}

function clearAllPaymentErrors() {
    document.querySelectorAll('.payment-field-error').forEach(error => error.remove());
    document.querySelectorAll('#payment-form input').forEach(input => input.style.borderColor = '');
}

// ===== VALIDATE PAYMENT FORM =====
function validatePaymentForm() {
    clearAllPaymentErrors();
    
    const cardNumber = document.getElementById('card-number').value;
    const expiryDate = document.getElementById('expiry-date').value;
    const cvv = document.getElementById('cvv').value;
    const cardholderName = document.getElementById('cardholder-name').value;
    
    let hasErrors = false;
    
    // Validate card number
    const cardValidation = validateCardNumber(cardNumber);
    if (!cardValidation.valid) {
        showPaymentFieldError('card-number', cardValidation.error);
        hasErrors = true;
    }
    
    // Validate expiry date
    const expiryValidation = validateExpiryDate(expiryDate);
    if (!expiryValidation.valid) {
        showPaymentFieldError('expiry-date', expiryValidation.error);
        hasErrors = true;
    }
    
    // Validate CVV
    const cvvValidation = validateCVV(cvv);
    if (!cvvValidation.valid) {
        showPaymentFieldError('cvv', cvvValidation.error);
        hasErrors = true;
    }
    
    // Validate cardholder name
    const nameValidation = validateCardholderName(cardholderName);
    if (!nameValidation.valid) {
        showPaymentFieldError('cardholder-name', nameValidation.error);
        hasErrors = true;
    }
    
    if (hasErrors) {
        showPaymentMessage('Please fix the errors above', 'error');
        return false;
    }
    
    return true;
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showPaymentMessage(text, type) {
    const messageDiv = document.getElementById('payment-message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    }
}

function showError(message) {
    alert(message);
    window.location.href = '/catalogue.html';
}