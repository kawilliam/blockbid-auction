// ===== TAB SWITCHING =====
document.getElementById('signin-tab').addEventListener('click', () => {
    document.getElementById('signin-tab').classList.add('active');
    document.getElementById('signup-tab').classList.remove('active');
    document.getElementById('signin-form').classList.add('active');
    document.getElementById('signup-form').classList.remove('active');
    clearMessage();
});

document.getElementById('signup-tab').addEventListener('click', () => {
    document.getElementById('signup-tab').classList.add('active');
    document.getElementById('signin-tab').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
    document.getElementById('signin-form').classList.remove('active');
    clearMessage();
});

// ===== SIGN IN =====
document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signin-username').value;
    const password = document.getElementById('signin-password').value;
    
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to catalogue
            setTimeout(() => {
                window.location.href = '/catalogue.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Error connecting to server', 'error');
    }
});

// ===== SIGN UP =====
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const firstName = document.getElementById('signup-firstname').value;
    const lastName = document.getElementById('signup-lastname').value;
    const address = document.getElementById('signup-address').value;
    
    // Client-side validation
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                firstName,
                lastName,
                address
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registration successful! Please sign in.', 'success');
            
            // Switch to sign in tab after 2 seconds
            setTimeout(() => {
                document.getElementById('signin-tab').click();
                document.getElementById('signin-username').value = username;
            }, 2000);
        } else {
            showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Error connecting to server', 'error');
    }
});

// ===== UTILITY FUNCTIONS =====
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

function clearMessage() {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = 'message';
}

// ===== CHECK IF ALREADY LOGGED IN =====
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // User is already logged in, redirect to catalogue
        window.location.href = '/catalogue.html';
    }
});