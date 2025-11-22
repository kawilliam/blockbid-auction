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

// ===== FIELD VALIDATION FUNCTIONS =====
function validateUsername(username) {
    if (!username || username.trim().length === 0) {
        return { valid: false, error: 'Username is required' };
    }
    if (username.length < 3) {
        return { valid: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
        return { valid: false, error: 'Username cannot exceed 20 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    return { valid: true };
}

function validateEmail(email) {
    if (!email || email.trim().length === 0) {
        return { valid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true };
}

function validatePassword(password) {
    if (!password || password.length === 0) {
        return { valid: false, error: 'Password is required' };
    }
    if (password.length < 6) {
        return { valid: false, error: 'Password must be at least 6 characters' };
    }
    if (password.length > 50) {
        return { valid: false, error: 'Password cannot exceed 50 characters' };
    }
    if (!/[A-Za-z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number' };
    }
    return { valid: true };
}

function validateName(name, fieldName) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: `${fieldName} is required` };
    }
    if (name.length < 2) {
        return { valid: false, error: `${fieldName} must be at least 2 characters` };
    }
    if (name.length > 50) {
        return { valid: false, error: `${fieldName} cannot exceed 50 characters` };
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
        return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
    }
    return { valid: true };
}

function validateAddress(address) {
    if (!address || address.trim().length === 0) {
        return { valid: false, error: 'Address is required' };
    }
    if (address.length < 10) {
        return { valid: false, error: 'Please enter a complete address (at least 10 characters)' };
    }
    if (address.length > 200) {
        return { valid: false, error: 'Address is too long (max 200 characters)' };
    }
    return { valid: true };
}

function showFieldError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentElement.querySelector('.field-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    field.style.borderColor = '#dc2626';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = errorMessage;
    
    field.parentElement.appendChild(errorDiv);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentElement.querySelector('.field-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    field.style.borderColor = '';
}

function clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('input').forEach(input => input.style.borderColor = '');
}

// ===== SIGN IN =====
document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();
    clearMessage();
    
    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value;
    
    // Validate fields
    let hasErrors = false;
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        showFieldError('signin-username', usernameValidation.error);
        hasErrors = true;
    }
    
    if (!password) {
        showFieldError('signin-password', 'Password is required');
        hasErrors = true;
    }
    
    if (hasErrors) {
        showMessage('Please fix the errors above', 'error');
        return;
    }
    
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
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            
            showMessage('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = '/catalogue.html';
            }, 1000);
        } else {
            // Backend validation errors
            if (data.field) {
                showFieldError(`signin-${data.field}`, data.message);
            } else {
                showMessage(data.message || 'Invalid credentials', 'error');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Error connecting to server', 'error');
    }
});

// ===== SIGN UP =====
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();
    clearMessage();
    
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const firstName = document.getElementById('signup-firstname').value.trim();
    const lastName = document.getElementById('signup-lastname').value.trim();
    const address = document.getElementById('signup-address').value.trim();
    
    // Validate all fields
    let hasErrors = false;
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        showFieldError('signup-username', usernameValidation.error);
        hasErrors = true;
    }
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        showFieldError('signup-email', emailValidation.error);
        hasErrors = true;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showFieldError('signup-password', passwordValidation.error);
        hasErrors = true;
    }
    
    const firstNameValidation = validateName(firstName, 'First name');
    if (!firstNameValidation.valid) {
        showFieldError('signup-firstname', firstNameValidation.error);
        hasErrors = true;
    }
    
    const lastNameValidation = validateName(lastName, 'Last name');
    if (!lastNameValidation.valid) {
        showFieldError('signup-lastname', lastNameValidation.error);
        hasErrors = true;
    }
    
    const addressValidation = validateAddress(address);
    if (!addressValidation.valid) {
        showFieldError('signup-address', addressValidation.error);
        hasErrors = true;
    }
    
    if (hasErrors) {
        showMessage('Please fix the errors above', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/users/signup', {
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
            
            setTimeout(() => {
                document.getElementById('signin-tab').click();
                document.getElementById('signin-username').value = username;
            }, 2000);
        } else {
            // Backend validation errors
            if (data.field) {
                showFieldError(`signup-${data.field}`, data.message);
            } else {
                showMessage(data.message || 'Registration failed', 'error');
            }
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