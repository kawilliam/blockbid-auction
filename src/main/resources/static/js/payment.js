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

// ===== VALIDATE PAYMENT FORM =====
function validatePaymentForm() {
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiry-date').value;
    const cvv = document.getElementById('cvv').value;
    const cardholderName = document.getElementById('cardholder-name').value.trim();
    
    // Card number validation (simplified)
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        showPaymentMessage('Please enter a valid card number', 'error');
        return false;
    }
    
    // Expiry date validation
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        showPaymentMessage('Please enter a valid expiry date (MM/YY)', 'error');
        return false;
    }
    
    // Check if expiry date is not in the past
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        showPaymentMessage('Card has expired', 'error');
        return false;
    }
    
    // CVV validation
    if (cvv.length < 3 || cvv.length > 4) {
        showPaymentMessage('Please enter a valid CVV', 'error');
        return false;
    }
    
    // Cardholder name validation
    if (cardholderName.length < 2) {
        showPaymentMessage('Please enter cardholder name', 'error');
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