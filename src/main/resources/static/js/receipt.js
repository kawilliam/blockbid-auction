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
    
    if (!paymentId) {
        // If no paymentId, try to get from localStorage (fallback)
        paymentId = localStorage.getItem('lastPaymentId');
        
        if (!paymentId) {
            alert('No receipt found');
            window.location.href = '/catalogue.html';
            return;
        }
    }
    
    loadReceiptData();
});

// ===== LOAD RECEIPT DATA =====
async function loadReceiptData() {
    try {
        const response = await fetch(`/api/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            receiptData = await response.json();
            
            // Verify this payment belongs to current user
            if (receiptData.userId != userId) {
                alert('Access denied: This receipt does not belong to you');
                window.location.href = '/catalogue.html';
                return;
            }
            
            displayReceiptData(receiptData);
        } else if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
        } else if (response.status === 404) {
            showError('Receipt not found');
        } else {
            showError('Error loading receipt');
        }
    } catch (error) {
        console.error('Error loading receipt:', error);
        showError('Error connecting to server');
    }
}

// ===== DISPLAY RECEIPT DATA =====
function displayReceiptData(receipt) {
    // Order metadata
    document.getElementById('order-number').textContent = receipt.id || 'N/A';
    document.getElementById('order-date').textContent = formatDate(receipt.timestamp || new Date());
    
    // Item details
    displayItemDetails(receipt.item);
    
    // Payment summary
    displayPaymentSummary(receipt);
    
    // Shipping information
    displayShippingInfo(receipt);
    
    // Payment method info
    displayPaymentMethodInfo(receipt.paymentDetails);
    
    // Update delivery estimate
    updateDeliveryEstimate(receipt.shippingType);
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

function showError(message) {
    alert(message);
    window.location.href = '/catalogue.html';
}

// ===== MOCK DATA FALLBACK =====
// If backend doesn't have receipt endpoint yet, use mock data
function createMockReceiptData() {
    return {
        id: Math.floor(Math.random() * 10000),
        timestamp: new Date().toISOString(),
        userId: userId,
        item: {
            name: 'Sample Auction Item',
            description: 'This is a sample item for testing the receipt page.',
            currentPrice: 125.50
        },
        shippingType: 'standard',
        shippingAddress: '123 Main St, Toronto, ON, M1M 1M1',
        paymentDetails: {
            cardNumber: '4532 1234 5678 9012',
            cardholderName: 'John Doe'
        }
    };
}

// ===== FALLBACK FOR MISSING BACKEND ENDPOINT =====
async function loadReceiptDataWithFallback() {
    try {
        // Try to load real data first
        await loadReceiptData();
    } catch (error) {
        console.warn('Receipt endpoint not available, using mock data');
        
        // Use mock data for demonstration
        receiptData = createMockReceiptData();
        displayReceiptData(receiptData);
    }
}

// ===== REPLACE loadReceiptData call in DOMContentLoaded =====
// Comment out the original loadReceiptData() call and use this instead
// if your backend doesn't have the receipt endpoint yet:
// loadReceiptDataWithFallback();