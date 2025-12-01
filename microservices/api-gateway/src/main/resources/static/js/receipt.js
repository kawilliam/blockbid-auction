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
let itemId = null;

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
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('paymentId');
    
    if (!paymentId) {
        showError('No payment information found');
        return;
    }
    
    try {
        const receiptResponse = await fetch(`/api/payments/${paymentId}/receipt`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (receiptResponse.ok) {
            const receiptData = await receiptResponse.json();
            displayReceipt(receiptData);
        } else {
            showError('Payment receipt not found');
        }
        
    } catch (error) {
        console.error('Error loading receipt:', error);
        showError('Error loading receipt: ' + error.message);
    }
}

function displayReceipt(receiptData) {
    console.log('Receipt data:', receiptData); // Debug
    
    // Order details
    document.getElementById('order-number').textContent = receiptData.id || 'N/A';
    document.getElementById('order-date').textContent = new Date(receiptData.timestamp || receiptData.paymentDate).toLocaleDateString();
    
    // Item details - populate the receipt-item container
    const receiptItem = document.getElementById('receipt-item');
    const itemName = receiptData.item?.name || 'Item details unavailable';
    const itemDescription = receiptData.item?.description || '';
    const itemPrice = receiptData.itemPrice || receiptData.item?.currentPrice || 0;
    
    receiptItem.innerHTML = `
        <div class="item-details">
            <div class="item-image-receipt">
                <span>ITEM</span>
            </div>
            <div class="item-info-receipt">
                <div class="item-name-receipt">${escapeHtml(itemName)}</div>
                <div class="item-description-receipt">${escapeHtml(itemDescription)}</div>
                <div class="item-price-receipt">$${itemPrice.toFixed(2)}</div>
            </div>
        </div>
    `;
    
    // Payment summary - populate the payment-summary container
    const paymentSummary = document.getElementById('payment-summary');
    const shippingCost = receiptData.shippingCost || 0;
    const totalAmount = receiptData.totalAmount || 0;
    
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
    
    // Shipping address
    if (receiptData.shippingAddress) {
        document.getElementById('shipping-address').textContent = receiptData.shippingAddress;
    } else if (receiptData.user) {
        const user = receiptData.user;
        const addressText = `${user.firstName || ''} ${user.lastName || ''}\n${user.streetNumber || ''} ${user.streetName || ''}\n${user.city || ''}, ${user.province || ''} ${user.postalCode || ''}\n${user.country || ''}`;
        document.getElementById('shipping-address').textContent = addressText;
    }
    
    // Shipping method
    const shippingType = receiptData.shippingType || 'standard';
    const isExpedited = shippingType === 'expedited';
    document.getElementById('shipping-method').textContent = isExpedited ? 
        'Expedited Shipping (2-3 business days)' : 
        'Standard Shipping (5-7 business days)';
    
    // Estimated delivery
    const days = isExpedited ? 3 : 7;
    document.getElementById('estimated-delivery').textContent = `Estimated delivery in ${days} business days`;
    document.getElementById('delivery-estimate').textContent = `Estimated delivery in ${days} business days`;
    
    // Payment method
    const cardLastFour = receiptData.cardLastFour || receiptData.cardNumber || '****';
    document.getElementById('card-info').textContent = `Card ending in ${cardLastFour}`;
    
    // Transaction ID
    const transactionId = receiptData.transactionId || `TXN${receiptData.id}`;
    document.getElementById('transaction-id').textContent = `Transaction ID: ${transactionId}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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