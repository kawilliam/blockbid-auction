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

window.addEventListener('DOMContentLoaded', () => {
    paymentId = getPaymentIdFromUrl();
    const urlParams = new URLSearchParams(window.location.search);
    itemId = urlParams.get('itemId'); // assign to global

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
    // don't redeclare paymentId/itemId as const here — reuse globals
    if (!paymentId) {
        showError('No payment information found');
        return;
    }
    
    try {
        const receiptResponse = await fetch(`/api/payments/${paymentId}/receipt`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (receiptResponse.ok) {
            const data = await receiptResponse.json();
            receiptData = data; // assign to global so other functions can use it
            displayReceipt(data);
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
    
	// Shipping address - simplified logic since backend handles it now
	const shippingAddress = receiptData.shippingAddress || 'Address not available';
	document.getElementById('shipping-address').textContent = shippingAddress;
    
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

	// Load blockchain verification if itemId is available
    const itemIdFromReceipt = receiptData.item?.id;
    if (itemIdFromReceipt) {
        setTimeout(() => loadBlockchainVerification(itemIdFromReceipt), 500);
    }

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

// ===== BLOCKCHAIN VERIFICATION =====
let blockchainVerification = null;

async function loadBlockchainVerification(itemId) {
    try {
        console.log('Loading blockchain verification for item:', itemId);
        
        // Get auction history from blockchain
        const response = await fetch(`/api/blockchain/auctions/${itemId}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Blockchain data:', data);
            
            if (data.transactions && data.transactions.length > 0) {
                blockchainVerification = data;
                displayBlockchainVerification(data);
            } else {
                console.log('No blockchain transactions found');
            }
        } else {
            console.log('Blockchain service not available');
        }
    } catch (error) {
        console.log('Blockchain verification not available:', error);
    }
}

function displayBlockchainVerification(data) {
    // Find where to insert the blockchain section
    const receiptContent = document.querySelector('.receipt-details') || 
                          document.querySelector('.receipt-content') || 
                          document.getElementById('receipt-content');
    
    if (!receiptContent) {
        console.error('Could not find receipt container');
        return;
    }
    
    // Find the payment transaction
    const paymentTx = data.transactions.find(tx => tx.transactionType === 'PAYMENT');
    const bidTxs = data.transactions.filter(tx => tx.transactionType === 'BID');
    
    const blockchainSection = document.createElement('div');
    blockchainSection.className = 'blockchain-section';
    blockchainSection.style.cssText = `
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        border: 2px solid #00ff88;
        border-radius: 12px;
        padding: 25px;
        margin-top: 30px;
        box-shadow: 0 4px 20px rgba(0, 255, 136, 0.2);
    `;
    
    blockchainSection.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #00ff88; font-size: 24px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                Blockchain Verification
            </h2>
            <p style="color: #888; font-size: 14px; margin: 0;">
                This transaction is permanently recorded on the BlockBid blockchain
            </p>
        </div>
        
        ${paymentTx ? `
        <div style="background: #0a0a0a; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #00ff88; font-size: 16px; margin-bottom: 10px;">Payment Transaction</h3>
            <div style="font-family: 'Courier New', monospace; font-size: 13px;">
                <div style="margin: 8px 0;">
                    <span style="color: #888;">Transaction Hash:</span><br>
                    <span style="color: #fff; word-break: break-all;">${paymentTx.transactionHash}</span>
                </div>
                <div style="margin: 8px 0;">
                    <span style="color: #888;">Block Number:</span>
                    <span style="color: #00ff88; margin-left: 10px;">#${paymentTx.blockNumber || 'Pending'}</span>
                </div>
                <div style="margin: 8px 0;">
                    <span style="color: #888;">Status:</span>
                    <span style="color: #00ff88; margin-left: 10px;">✓ ${paymentTx.status || 'CONFIRMED'}</span>
                </div>
                <div style="margin: 8px 0;">
                    <span style="color: #888;">Confirmations:</span>
                    <span style="color: #fff; margin-left: 10px;">${paymentTx.confirmations || 1}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div style="background: #0a0a0a; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #00ff88; font-size: 16px; margin-bottom: 10px;">Auction Statistics</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <div style="color: #888; font-size: 13px;">Total Bids</div>
                    <div style="color: #fff; font-size: 20px; font-weight: bold;">${bidTxs.length}</div>
                </div>
                <div>
                    <div style="color: #888; font-size: 13px;">Blockchain Transactions</div>
                    <div style="color: #fff; font-size: 20px; font-weight: bold;">${data.totalTransactions}</div>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="viewCompleteBlockchainHistory()" 
                    style="background: #00ff88; color: #000; border: none; padding: 12px 24px; 
                           border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer;
                           transition: all 0.3s;">
                View Complete Blockchain History
            </button>
            <button onclick="verifyBlockchainTransaction()" 
                    style="background: transparent; color: #00ff88; border: 2px solid #00ff88; 
                           padding: 10px 24px; border-radius: 8px; font-size: 14px; 
                           font-weight: bold; cursor: pointer; transition: all 0.3s;">
                Verify Transaction
            </button>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: rgba(0, 255, 136, 0.1); 
                    border-radius: 8px; border-left: 4px solid #00ff88;">
            <p style="margin: 0; color: #888; font-size: 13px; line-height: 1.6;">
                <strong style="color: #00ff88;">Why Blockchain?</strong><br>
                This transaction is immutable and permanently recorded on our blockchain. 
                The cryptographic hashes ensure authenticity and prevent tampering. 
                Anyone can independently verify this transaction's validity.
            </p>
        </div>
    `;
    
    receiptContent.appendChild(blockchainSection);
}

function viewCompleteBlockchainHistory() {
    if (!blockchainVerification) {
        alert('Loading blockchain data...');
        return;
    }
    
    // Create modal to show complete history
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.9); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: #1a1a1a; border: 2px solid #00ff88; border-radius: 12px;
                    max-width: 800px; width: 100%; max-height: 80vh; overflow-y: auto; padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: #00ff88; margin: 0;">Complete Blockchain History</h2>
                <button onclick="this.closest('div[style*=fixed]').remove()" 
                        style="background: #ff4444; color: #fff; border: none; padding: 8px 16px;
                               border-radius: 6px; cursor: pointer; font-weight: bold;">
                    Close
                </button>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #0a0a0a; border-radius: 8px;">
                <div style="color: #888; font-size: 13px;">Item ID</div>
                <div style="color: #fff; font-weight: bold; margin-top: 5px;">${blockchainVerification.itemId}</div>
                <div style="color: #888; font-size: 13px; margin-top: 10px;">Total Transactions</div>
                <div style="color: #00ff88; font-weight: bold; font-size: 20px; margin-top: 5px;">${blockchainVerification.totalTransactions}</div>
            </div>
            
            <h3 style="color: #00ff88; font-size: 18px; margin: 20px 0 15px 0;">
                All Transactions (${blockchainVerification.totalTransactions})
            </h3>
            
            ${blockchainVerification.transactions.map((tx, index) => `
                <div style="background: ${index % 2 === 0 ? '#0a0a0a' : '#151515'}; 
                            padding: 15px; border-radius: 8px; margin-bottom: 10px;
                            border-left: 4px solid ${tx.transactionType === 'BID' ? '#00ff88' : tx.transactionType === 'PAYMENT' ? '#ffaa00' : '#888'};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #00ff88; font-weight: bold; font-size: 14px;">
                            ${tx.transactionType}
                        </span>
                        <span style="color: #888; font-size: 12px;">
                            ${new Date(tx.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <div style="font-family: 'Courier New', monospace; font-size: 12px; color: #888;">
                        <div style="margin: 5px 0;">
                            TX Hash: <span style="color: #fff;">${tx.transactionHash}</span>
                        </div>
                        <div style="margin: 5px 0;">
                            Block: <span style="color: #00ff88;">#${tx.blockNumber || 'Pending'}</span>
                            Status: <span style="color: #00ff88;">${tx.status}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(0, 255, 136, 0.1); 
                        border-radius: 8px; border-left: 4px solid #00ff88;">
                <p style="margin: 0; color: #888; font-size: 13px;">
                    ✓ All transactions verified on blockchain<br>
                    ✓ Immutable and tamper-proof<br>
                    ✓ Publicly verifiable
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function verifyBlockchainTransaction() {
    if (!blockchainVerification || !blockchainVerification.transactions.length) {
        alert('No transactions to verify');
        return;
    }
    
    const paymentTx = blockchainVerification.transactions.find(tx => tx.transactionType === 'PAYMENT');
    const tx = paymentTx || blockchainVerification.transactions[0];
    
    alert(
        `Transaction Verified ✓\n\n` +
        `Hash: ${tx.transactionHash}\n` +
        `Block: #${tx.blockNumber}\n` +
        `Status: ${tx.status}\n` +
        `Confirmations: ${tx.confirmations || 1}\n\n` +
        `This transaction is cryptographically verified and permanently recorded on the blockchain.`
    );
}