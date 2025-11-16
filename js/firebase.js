// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;
let userProfile = null;
let initialAuthCheck = true;

// Auth state listener
auth.onAuthStateChanged(async (user) => {
    console.log('Auth state changed:', user ? user.uid : 'logged out');
    
    const currentPage = window.location.pathname.split('/').pop();
    
    // Don't redirect on home page - let users browse freely
    if (currentPage === 'home.html' || currentPage === 'index.html' || currentPage === '') {
        hideLoading();
        return;
    }
    
    // Don't auto-redirect on auth page - let users choose login/signup
    if (currentPage === 'auth.html') {
        if (user) {
            currentUser = user;
            await loadUserProfile(user.uid);
            
            // Only auto-redirect if profile exists AND not coming from home page
            const referrer = document.referrer;
            const fromHome = referrer.includes('home.html') || referrer.includes('index.html');
            
            if (userProfile && userProfile.bio && !fromHome) {
                console.log('Profile found, redirecting to app');
                window.location.href = 'app.html';
            }
        }
        hideLoading();
        return;
    }
    
    if (user) {
        currentUser = user;
        await loadUserProfile(user.uid);
        
        // Check if user is in edit mode
        const editMode = localStorage.getItem('editMode');
        
        if (!userProfile || !userProfile.bio) {
            console.log('No profile found, redirecting to profile setup');
            if (currentPage !== 'profile-setup.html') {
                window.location.href = 'profile-setup.html';
            }
        } else if (editMode === 'true' && currentPage === 'profile-setup.html') {
            // User is editing profile, allow them to stay on profile-setup page
            console.log('Edit mode active, staying on profile setup page');
        } else {
            console.log('Profile found, redirecting to app');
            if (currentPage !== 'app.html') {
                window.location.href = 'app.html';
            } else if (typeof loadRecommendations === 'function') {
                loadRecommendations();
            }
        }
    } else {
        console.log('User logged out');
        currentUser = null;
        userProfile = null;
        if (currentPage !== 'auth.html') {
            window.location.href = 'auth.html';
        }
    }
    hideLoading();
});

// Load user profile from Firestore
async function loadUserProfile(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            userProfile = { id: doc.id, ...doc.data() };
            console.log('Profile loaded:', userProfile);
        } else {
            userProfile = null;
            console.log('No profile document found');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        userProfile = null;
    }
}

// Show/hide containers (legacy support for same-page transitions)
function showContainer(containerId) {
    console.log('Showing container:', containerId);
    
    const element = document.getElementById(containerId);
    if (element) {
        element.style.display = 'flex';
    }
}

// Loading overlay
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}
