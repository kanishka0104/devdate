// Authentication functions

// Test function to verify script is loaded
console.log('auth.js loaded successfully');

function showLogin() {
    console.log('showLogin called');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
}

function showSignup() {
    console.log('showSignup called');
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    if (!email || !password) {
        showError(errorDiv, 'Please fill in all fields');
        return;
    }

    showLoading();
    try {
        await auth.signInWithEmailAndPassword(email, password);
        hideLoading();
        // Redirect to app after successful login
        window.location.href = 'app.html';
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        
        // Show user-friendly error messages
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            showError(errorDiv, 'Invalid email or password. Please check your credentials or sign up for a new account.');
        } else if (error.code === 'auth/invalid-email') {
            showError(errorDiv, 'Invalid email format.');
        } else if (error.code === 'auth/too-many-requests') {
            showError(errorDiv, 'Too many failed attempts. Please try again later or reset your password.');
        } else {
            showError(errorDiv, error.message);
        }
    }
}

async function signup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');

    console.log('Signup clicked:', { name, email, password: '***' });

    if (!name || !email || !password) {
        showError(errorDiv, 'Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError(errorDiv, 'Password must be at least 6 characters');
        return;
    }

    showLoading();
    try {
        console.log('Creating user...');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log('User created:', userCredential.user.uid);
        await userCredential.user.updateProfile({ displayName: name });
        console.log('Profile updated, redirecting to profile setup...');
        
        hideLoading();
        window.location.href = 'profile-setup.html';
    } catch (error) {
        hideLoading();
        console.error('Signup error:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showError(errorDiv, 'This email is already registered. Please login instead.');
        } else if (error.code === 'auth/invalid-email') {
            showError(errorDiv, 'Invalid email format.');
        } else if (error.code === 'auth/weak-password') {
            showError(errorDiv, 'Password is too weak. Use at least 6 characters.');
        } else {
            showError(errorDiv, error.message);
        }
    }
}

async function loginWithGoogle() {
    showLoading();
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        // Try popup first, fallback to redirect if it fails
        try {
            await auth.signInWithPopup(provider);
        } catch (popupError) {
            console.log('Popup blocked or failed, trying redirect...', popupError);
            // If popup fails, use redirect instead
            await auth.signInWithRedirect(provider);
        }
    } catch (error) {
        hideLoading();
        console.error('Google login error:', error);
        alert('Error signing in with Google: ' + error.message);
    }
}

async function loginWithGithub() {
    showLoading();
    try {
        const provider = new firebase.auth.GithubAuthProvider();
        await auth.signInWithPopup(provider);
    } catch (error) {
        hideLoading();
        alert(error.message);
    }
}

async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showLoading();
        await auth.signOut();
        window.location.href = 'auth.html';
    }
}

async function resetPassword() {
    const email = prompt('Enter your email address to reset password:');
    
    if (!email) {
        return;
    }
    
    showLoading();
    try {
        await auth.sendPasswordResetEmail(email);
        hideLoading();
        alert('Password reset email sent! Check your inbox.');
    } catch (error) {
        hideLoading();
        console.error('Reset password error:', error);
        
        if (error.code === 'auth/user-not-found') {
            alert('No account found with this email. Please sign up first.');
        } else if (error.code === 'auth/invalid-email') {
            alert('Invalid email format.');
        } else {
            alert('Error: ' + error.message);
        }
    }
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}
