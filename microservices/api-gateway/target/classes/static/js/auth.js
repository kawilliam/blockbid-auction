(function () {
    // ===== TAB SWITCHING =====
    document.addEventListener('DOMContentLoaded', () => {
        const signinTab = document.getElementById('signin-tab');
        const signupTab = document.getElementById('signup-tab');

        if (signinTab) {
            signinTab.addEventListener('click', () => {
                const signInForm = document.getElementById('signin-form');
                const signUpForm = document.getElementById('signup-form');
                if (signInForm && signUpForm) {
                    signInForm.style.display = 'block';
                    signUpForm.style.display = 'none';
                }
            });
        }

        if (signupTab) {
            signupTab.addEventListener('click', () => {
                const signInForm = document.getElementById('signin-form');
                const signUpForm = document.getElementById('signup-form');
                if (signInForm && signUpForm) {
                    signInForm.style.display = 'none';
                    signUpForm.style.display = 'block';
                }
            });
        }
    });

    // ===== FIELD VALIDATION FUNCTIONS =====
    function validateUsername(username) {
        if (!username) return { valid: false, error: 'Username required' };
        const trimmed = username.trim();
        if (trimmed.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
        return { valid: true };
    }

    function validateEmail(email) {
        if (!email) return { valid: false, error: 'Email required' };
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return { valid: re.test(email) ? true : false, error: re.test(email) ? null : 'Invalid email' };
    }

    function validatePassword(password) {
        if (!password) return { valid: false, error: 'Password required' };
        if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
        return { valid: true };
    }

    function validateName(name, fieldName) {
        if (!name || name.trim().length === 0) return { valid: false, error: `${fieldName} is required` };
        return { valid: true };
    }

    function validateAddressField(value, fieldName, minLength = 1) {
        if (!value || value.trim().length < minLength) return { valid: false, error: `${fieldName} is required` };
        return { valid: true };
    }

    function validatePostalCode(postalCode) {
        if (!postalCode) return { valid: false, error: 'Postal code required' };
        if (postalCode.trim().length < 3) return { valid: false, error: 'Postal code too short' };
        return { valid: true };
    }

    function showFieldError(fieldId, errorMessage) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        // find/create adjacent error container
        let errorEl = field.parentElement ? field.parentElement.querySelector('.field-error') : null;
        if (!errorEl && field.parentElement) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            errorEl.style.color = '#dc2626';
            errorEl.style.fontSize = '0.85rem';
            errorEl.style.marginTop = '5px';
            field.parentElement.appendChild(errorEl);
        }
        if (errorEl) errorEl.textContent = errorMessage || '';
        field.style.borderColor = '#dc2626';
    }

    // expose validators if needed elsewhere (optional)
    window.authValidators = {
        validateUsername,
        validateEmail,
        validatePassword,
        validateName,
        validateAddressField,
        validatePostalCode,
        showFieldError
    };
})(); 

// ===== SIGN IN =====
document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();
    clearMessage();

    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value;

    // Validate fields
    let hasErrors = false;

    const usernameValidation = window.authValidators.validateUsername(username);
    if (!usernameValidation.valid) {
        window.authValidators.showFieldError('signin-username', usernameValidation.error);
        hasErrors = true;
    }

    if (!password) {
        window.authValidators.showFieldError('signin-password', 'Password is required');
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
                window.authValidators.showFieldError(`signin-${data.field}`, data.message);
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
	const streetNumber = document.getElementById('signup-street-number').value.trim();
    const streetName = document.getElementById('signup-street-name').value.trim();
    const city = document.getElementById('signup-city').value.trim();
    const province = document.getElementById('signup-province').value.trim();
    const postalCode = document.getElementById('signup-postal-code').value.trim();
    const country = document.getElementById('signup-country').value.trim();
    
    // Validate all fields
    let hasErrors = false;

    const usernameValidation = window.authValidators.validateUsername(username);
    if (!usernameValidation.valid) {
        window.authValidators.showFieldError('signup-username', usernameValidation.error);
        hasErrors = true;
    }

    const emailValidation = window.authValidators.validateEmail(email);
    if (!emailValidation.valid) {
        window.authValidators.showFieldError('signup-email', emailValidation.error);
        hasErrors = true;
    }

    const passwordValidation = window.authValidators.validatePassword(password);
    if (!passwordValidation.valid) {
        window.authValidators.showFieldError('signup-password', passwordValidation.error);
        hasErrors = true;
    }

    const firstNameValidation = window.authValidators.validateName(firstName, 'First name');
    if (!firstNameValidation.valid) {
        window.authValidators.showFieldError('signup-firstname', firstNameValidation.error);
        hasErrors = true;
    }

    const lastNameValidation = window.authValidators.validateName(lastName, 'Last name');
    if (!lastNameValidation.valid) {
        window.authValidators.showFieldError('signup-lastname', lastNameValidation.error);
        hasErrors = true;
    }

	const streetNumberValidation = window.authValidators.validateAddressField(streetNumber, 'Street number');
    if (!streetNumberValidation.valid) {
        window.authValidators.showFieldError('signup-street-number', streetNumberValidation.error);
        hasErrors = true;
    }

    const streetNameValidation = window.authValidators.validateAddressField(streetName, 'Street name', 2);
    if (!streetNameValidation.valid) {
        window.authValidators.showFieldError('signup-street-name', streetNameValidation.error);
        hasErrors = true;
    }

    const cityValidation = window.authValidators.validateAddressField(city, 'City', 2);
    if (!cityValidation.valid) {
        window.authValidators.showFieldError('signup-city', cityValidation.error);
        hasErrors = true;
    }

    const provinceValidation = window.authValidators.validateAddressField(province, 'Province/State', 2);
    if (!provinceValidation.valid) {
        window.authValidators.showFieldError('signup-province', provinceValidation.error);
        hasErrors = true;
    }

    const postalCodeValidation = window.authValidators.validatePostalCode(postalCode);
    if (!postalCodeValidation.valid) {
        window.authValidators.showFieldError('signup-postal-code', postalCodeValidation.error);
        hasErrors = true;
    }

    const countryValidation = window.authValidators.validateAddressField(country, 'Country', 2);
    if (!countryValidation.valid) {
        window.authValidators.showFieldError('signup-country', countryValidation.error);
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
				streetNumber,
                streetName,
                city,
                province,
                postalCode,
                country
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
		        const mappedField = mapBackendFieldToFrontendId(data.field);
		        window.authValidators.showFieldError(`signup-${mappedField}`, data.message);
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

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(el => el.remove());

    const fields = document.querySelectorAll('input');
    fields.forEach(field => {
        field.style.borderColor = '';
    });
}

function mapBackendFieldToFrontendId(backendField) {
    const mapping = {
        'streetNumber': 'street-number',
        'streetName': 'street-name',
        'postalCode': 'postal-code',
        'firstName': 'firstname',
        'lastName': 'lastname'
    };
    return mapping[backendField] || backendField;
}

// ===== CHECK IF ALREADY LOGGED IN =====
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // User is already logged in, redirect to catalogue
        window.location.href = '/catalogue.html';
    }
});