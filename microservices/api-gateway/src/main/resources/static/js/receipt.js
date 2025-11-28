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
let paymentId = null;
let receiptData = null;

// ===== GET PAYMENT ID FROM URL =====
function getPaymentIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('paymentId');
}

// ===== PAGE LOAD =====
window.addEventListener('DOMContentLoaded', () => {
    paymentId = getPaymentIdFromUrl();
	
	const urlParams = new URLSearchParams(window.location.search);
	const itemId = urlParams.get('itemId');

	if (!itemId) {
	    alert('No item specified');
	    window.location.href = '/catalogue.html';
	    return;
	}
    
    if (!paymentId) {
        // If no paymentId, try to get from localStorage (fallback)
        paymentId = localStorage.getItem('lastPaymentId');
        
        if (!paymentId) {
            alert('No receipt found');
            window.location.href = '/catalogue.html';
            return;
        }
    }
    
    loadReceipt();
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

// ===== LOAD RECEIPT DATA =====
async function loadReceipt() {
    try {
        // Get payment details
        const paymentResponse = await fetch(`/api/payments/items/${itemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!paymentResponse.ok) {
            showError('Payment not found');
            return;
        }
        
        const payment = await paymentResponse.json();
        
        // Get item details
        const itemResponse = await fetch(`/api/items/${itemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!itemResponse.ok) {
            showError('Item not found');
            return;
        }
        
        const item = await itemResponse.json();
        
        // Get user details
        const userResponse = await fetch(`/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const user = userResponse.ok ? await userResponse.json() : null;
        
        displayReceipt(payment, item, user);
        
    } catch (error) {
        console.error('Error loading receipt:', error);
        showError('Error loading receipt: ' + error.message);
    }
}

function displayReceipt(payment, item, user) {
    document.getElementById('order-number').textContent = payment.id || 'N/A';
    document.getElementById('order-date').textContent = new Date(payment.paymentDate).toLocaleDateString();
    
    document.getElementById('item-name').textContent = item.name;
    document.getElementById('item-description').textContent = item.description;
    document.getElementById('item-price').textContent = `$${item.currentPrice.toFixed(2)}`;
    
    const shippingCost = payment.expeditedShipping ? 
        (item.expeditedShippingCost || 30) : 
        (item.shippingCost || 15);
    
    document.getElementById('shipping-cost').textContent = `$${shippingCost.toFixed(2)}`;
    document.getElementById('total-amount').textContent = `$${payment.totalAmount.toFixed(2)}`;
    
    if (user) {
        document.getElementById('shipping-address').textContent = 
            `${user.firstName} ${user.lastName}\n${user.streetNumber} ${user.streetName}\n${user.city}, ${user.province} ${user.postalCode}\n${user.country}`;
    }
    
    const lastFour = payment.cardNumber ? payment.cardNumber.slice(-4) : '****';
    document.getElementById('payment-method').textContent = `Card ending in ${lastFour}`;
}

function showError(message) {
    document.getElementById('receipt-content').innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.href='/catalogue.html'">Back to Catalogue</button>
        </div>
    `;
}

// ===== DISPLAY ITEM DETAILS =====
function displayItemDetails(item) {
    const receiptItem = document.getElementById('receipt-item');
    
    receiptItem.innerHTML = `
        <div class="item-details">
            <div class="item-image-receipt">
                <span>ITEM</span>
            </div>
            <div class="item-info-receipt">
                <div class="item-name-receipt">${escapeHtml(item.name)}</div>
                <div class="item-description-receipt">${escapeHtml(item.description)}</div>
                <div class="item-price-receipt">$${item.currentPrice.toFixed(2)}</div>
            </div>
        </div>
    `;
}

// ===== DISPLAY PAYMENT SUMMARY =====
function displayPaymentSummary(receipt) {
    const itemPrice = receipt.item.currentPrice;
    const shippingCost = receipt.shippingType === 'expedited' ? 15.00 : 0;
    const totalAmount = itemPrice + shippingCost;
    
    const paymentSummary = document.getElementById('payment-summary');
    paymentSummary.innerHTML = `
        <h3>Payment Summary</h3>
        <div class="summary-row subtotal">
            <span>Item Price:</span>
            <span>$${itemPrice.toFixed(2)}</span>
        </div>
        <div class="summary-row shipping">
            <span>Shipping:</span>
            <span>${shippingCost === 0 ? 'Free' : '$' + shippingCost.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
            <span>Total Paid:</span>
            <span>$${totalAmount.toFixed(2)}</span>
        </div>
    `;
}

// ===== DISPLAY SHIPPING INFO =====
function displayShippingInfo(receipt) {
    const shippingAddress = document.getElementById('shipping-address');
    const shippingMethod = document.getElementById('shipping-method');
    const estimatedDelivery = document.getElementById('estimated-delivery');
    
    // Display address
    shippingAddress.textContent = receipt.shippingAddress || 'Address not available';
    
    // Display shipping method
    const isExpedited = receipt.shippingType === 'expedited';
    shippingMethod.innerHTML = `
        <div class="method-name">${isExpedited ? 'Expedited Shipping' : 'Standard Shipping'}</div>
        <div class="method-details">${isExpedited ? '2-3 business days' : '5-7 business days'}</div>
    `;
    
    // Display estimated delivery
    const deliveryDate = calculateDeliveryDate(receipt.shippingType, receipt.timestamp);
    estimatedDelivery.textContent = `Estimated delivery: ${deliveryDate}`;
}

// ===== DISPLAY PAYMENT METHOD INFO =====
function displayPaymentMethodInfo(paymentDetails) {
    const cardInfo = document.getElementById('card-info');
    const transactionId = document.getElementById('transaction-id');
    
    // Mask card number (show only last 4 digits)
    const maskedCardNumber = maskCardNumber(paymentDetails.cardNumber);
    
    cardInfo.innerHTML = `
        <div class="card-icon">CARD</div>
        <div class="card-details">
            ${maskedCardNumber} • ${paymentDetails.cardholderName}
        </div>
    `;
    
    // Generate mock transaction ID
    const txId = generateTransactionId(receiptData.id);
    transactionId.textContent = `Transaction ID: ${txId}`;
}

// ===== UPDATE DELIVERY ESTIMATE =====
function updateDeliveryEstimate(shippingType) {
    const deliveryEstimate = document.getElementById('delivery-estimate');
    const estimate = shippingType === 'expedited' ? '2-3 business days' : '5-7 business days';
    deliveryEstimate.textContent = `Estimated delivery in ${estimate}`;
}

// ===== UTILITY FUNCTIONS =====
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateDeliveryDate(shippingType, orderDate) {
    const order = new Date(orderDate);
    const businessDays = shippingType === 'expedited' ? 3 : 7;
    
    // Add business days (skip weekends)
    let deliveryDate = new Date(order);
    let daysAdded = 0;
    
    while (daysAdded < businessDays) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
            daysAdded++;
        }
    }
    
    return deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function maskCardNumber(cardNumber) {
    if (!cardNumber) return 'Card ending in ****';
    
    const cleaned = cardNumber.replace(/\s/g, '');
    const lastFour = cleaned.slice(-4);
    return `**** **** **** ${lastFour}`;
}

function generateTransactionId(paymentId) {
    // Generate a mock transaction ID based on payment ID and timestamp
    const timestamp = Date.now().toString().slice(-6);
    const prefix = 'TXN';
    const suffix = (paymentId || '000').toString().padStart(3, '0');
    return `${prefix}${timestamp}${suffix}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}





// ===== REPLACE loadReceiptData call in DOMContentLoaded =====
// Comment out the original loadReceiptData() call and use this instead
// if your backend doesn't have the receipt endpoint yet:
// loadReceiptDataWithFallback();