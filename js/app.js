// Main app logic and navigation

// Page navigation with debouncing
let lastPageChange = 0;
const PAGE_CHANGE_DELAY = 300;

function showPage(pageName) {
    const now = Date.now();
    if (now - lastPageChange < PAGE_CHANGE_DELAY) {
        return; // Prevent rapid page switching
    }
    lastPageChange = now;
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(`${pageName}-page`);
    targetPage.classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');

    // Animate page transition
    if (window.DevDateAnimations) {
        window.DevDateAnimations.animatePageTransition(pageName);
    }

    // Load page content
    switch(pageName) {
        case 'discover':
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                if (recommendedUsers.length === 0) {
                    loadRecommendations();
                } else {
                    renderSwipeCards();
                }
            }, 100);
            break;
        case 'matches':
            loadMatches();
            break;
        case 'chat':
            loadChatList();
            break;
        case 'profile':
            loadProfileView();
            break;
    }
}

// Load profile view
function loadProfileView() {
    const container = document.getElementById('profile-view');
    container.innerHTML = '';
    
    if (userProfile) {
        window.renderProfileCard(userProfile, container, false);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('App page loaded, DOM ready');
    
    // Verify critical elements exist
    const appContainer = document.getElementById('app-container');
    const discoverPage = document.getElementById('discover-page');
    const swipeDeck = document.getElementById('swipe-deck');
    
    console.log('App container exists:', !!appContainer);
    console.log('Discover page exists:', !!discoverPage);
    console.log('Swipe deck exists:', !!swipeDeck);
    
    // Check if user is authenticated
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            console.log('No user, redirecting to auth');
            window.location.href = 'auth.html';
            return;
        }
        
        // Load user profile
        await loadUserProfile(user.uid);
        
        if (!userProfile || !userProfile.bio) {
            console.log('No profile, redirecting to profile setup');
            window.location.href = 'profile-setup.html';
            return;
        }
        
        // User is authenticated and has profile, show app
        console.log('User authenticated, loading app');
        hideLoading();
        
        // Wait for DOM to be fully ready, then load initial content
        setTimeout(() => {
            console.log('Loading recommendations...');
            loadRecommendations();
        }, 300);
    });
});
