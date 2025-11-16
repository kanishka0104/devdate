// Swipe and matching system

let recommendedUsers = [];
let currentCardIndex = 0;
let isSwipping = false; // Prevent multiple simultaneous swipes

// Load recommended users
let lastLoadTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

async function loadRecommendations() {
    if (!userProfile) {
        console.error('No user profile loaded');
        return;
    }
    
    // Use cache if available and recent
    const now = Date.now();
    if (recommendedUsers.length > 0 && (now - lastLoadTime) < CACHE_DURATION) {
        console.log('Using cached recommendations');
        renderSwipeCards();
        return;
    }
    
    showLoading();
    
    try {
        const swipedUsers = [
            ...(userProfile.swipedRight || []),
            ...(userProfile.swipedLeft || []),
            ...(userProfile.matches || [])
        ];

        // Limit query to 50 users for better performance
        const allUsers = await db.collection('users')
            .where(firebase.firestore.FieldPath.documentId(), '!=', currentUser.uid)
            .limit(50)
            .get();

        recommendedUsers = [];
        allUsers.forEach(doc => {
            // Exclude already swiped users and matched users
            if (!swipedUsers.includes(doc.id)) {
                const userData = { id: doc.id, ...doc.data() };
                // Filter based on preferences
                if (matchesPreferences(userData)) {
                    recommendedUsers.push(userData);
                }
            }
        });

        // Score and sort by compatibility
        recommendedUsers = recommendedUsers.map(user => ({
            ...user,
            score: calculateCompatibilityScore(user)
        })).sort((a, b) => b.score - a.score);

        console.log(`Found ${recommendedUsers.length} recommended users`);
        currentCardIndex = 0;
        lastLoadTime = now;
        renderSwipeCards();
    } catch (error) {
        console.error('Error loading recommendations:', error);
        alert('Error loading recommendations: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Check if user matches preferences
function matchesPreferences(otherUser) {
    // Basic filter - ensure user has required profile fields
    if (!otherUser.name || !otherUser.bio) return false;
    
    // Show all users with complete profiles
    return true;
}

// Check if preferences overlap between two users
function hasPreferenceOverlap(user1, user2) {
    const user1LookingFor = user1.lookingFor || [];
    const user2LookingFor = user2.lookingFor || [];
    
    // Check if there's any overlap in what both are looking for
    const hasOverlap = user1LookingFor.some(goal => user2LookingFor.includes(goal));
    
    return hasOverlap || user1LookingFor.length === 0 || user2LookingFor.length === 0;
}

// Calculate compatibility score
function calculateCompatibilityScore(otherUser) {
    let score = 0;

    // Shared skills (highest weight)
    const sharedSkills = (userProfile.skills || []).filter(skill =>
        (otherUser.skills || []).some(s => s.toLowerCase() === skill.toLowerCase())
    );
    score += sharedSkills.length * 15;

    // Shared hobbies
    const sharedHobbies = (userProfile.hobbies || []).filter(hobby =>
        (otherUser.hobbies || []).some(h => h.toLowerCase() === hobby.toLowerCase())
    );
    score += sharedHobbies.length * 10;

    // Shared lookingFor goals
    const sharedGoals = (userProfile.lookingFor || []).filter(goal =>
        (otherUser.lookingFor || []).includes(goal)
    );
    score += sharedGoals.length * 20;

    // Location proximity
    if (userProfile.city === otherUser.city) {
        score += 25;
    } else if (userProfile.state === otherUser.state) {
        score += 15;
    }

    // Similar profession field
    if (userProfile.profession && otherUser.profession) {
        const userProf = userProfile.profession.toLowerCase();
        const otherProf = otherUser.profession.toLowerCase();
        
        // Simple keyword matching
        const keywords = ['developer', 'designer', 'engineer', 'data', 'frontend', 'backend', 'fullstack', 'mobile'];
        for (const keyword of keywords) {
            if (userProf.includes(keyword) && otherProf.includes(keyword)) {
                score += 10;
                break;
            }
        }
    }

    // Mentor-mentee matching
    if (userProfile.lookingFor?.includes('mentor') && 
        otherUser.lookingFor?.includes('mentee')) {
        score += 30;
    }
    if (userProfile.lookingFor?.includes('mentee') && 
        otherUser.lookingFor?.includes('mentor')) {
        score += 30;
    }

    return score;
}

// Render swipe cards
const DEBUG_MODE = false; // Set to true for debugging

function renderSwipeCards() {
    if (DEBUG_MODE) {
        console.log('=== RENDER SWIPE CARDS CALLED ===');
        console.log('Current index:', currentCardIndex);
        console.log('Total users:', recommendedUsers.length);
        console.log('Remaining:', recommendedUsers.length - currentCardIndex);
    }
    
    // Safety check: Only render if we're on app.html
    if (!window.location.pathname.includes('app.html') && window.location.pathname !== '/') {
        return;
    }
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        const deck = document.getElementById('swipe-deck');
        const noMoreCards = document.getElementById('no-more-cards');
        
        if (!deck || !noMoreCards) {
            // Retry with longer delay
            setTimeout(() => {
                const retryDeck = document.getElementById('swipe-deck');
                const retryNoMore = document.getElementById('no-more-cards');
                
                if (!retryDeck || !retryNoMore) {
                    if (DEBUG_MODE) console.error('Cannot render cards - DOM elements missing');
                    return;
                }
                
                renderSwipeCardsInternal(retryDeck, retryNoMore);
            }, 200);
            return;
        }
        
        renderSwipeCardsInternal(deck, noMoreCards);
    });
}

function renderSwipeCardsInternal(deck, noMoreCards) {
    if (DEBUG_MODE) console.log('=== RENDERING CARDS (INTERNAL) ===');
    
    // Clear the deck completely
    deck.innerHTML = '';
    deck.style.display = 'block';

    if (currentCardIndex >= recommendedUsers.length) {
        if (DEBUG_MODE) console.log('No more cards to show');
        noMoreCards.style.display = 'flex';
        deck.style.display = 'none';
        return;
    }

    noMoreCards.style.display = 'none';
    deck.style.display = 'block';

    // Show top 3 cards in stack starting from current index
    const remainingCards = recommendedUsers.length - currentCardIndex;
    const cardsToShow = Math.min(3, remainingCards);
    
    if (DEBUG_MODE) console.log('Will attempt to show', cardsToShow, 'cards');
    
    // Get list of already swiped users and matches for filtering
    const swipedUsers = [
        ...(userProfile.swipedRight || []),
        ...(userProfile.swipedLeft || []),
        ...(userProfile.matches || [])
    ];
    
    let cardsRendered = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < cardsToShow && cardsRendered < 3; i++) {
        const userIndex = currentCardIndex + i + skippedCount;
        
        if (userIndex >= recommendedUsers.length) {
            console.log('Reached end of users list');
            break;
        }
        
        const user = recommendedUsers[userIndex];
        
        // Ensure user has an ID
        if (!user || !user.id) {
            if (DEBUG_MODE) console.error('User missing ID at index:', userIndex);
            skippedCount++;
            i--;
            continue;
        }
        
        // Skip if user has already been swiped (safety check)
        if (swipedUsers.includes(user.id)) {
            if (DEBUG_MODE) console.log('Skipping already swiped user:', user.name);
            skippedCount++;
            i--;
            continue;
        }
        
        if (DEBUG_MODE) console.log('Creating card for user:', user.name, 'at position', cardsRendered);
        
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'swipe-card';
        cardWrapper.style.zIndex = 100 - cardsRendered;
        cardWrapper.style.transform = `scale(${1 - cardsRendered * 0.05}) translateY(${cardsRendered * -10}px)`;
        cardWrapper.style.opacity = '1';
        cardWrapper.setAttribute('data-user-id', user.id);
        
        if (cardsRendered === 0) {
            if (DEBUG_MODE) console.log('Setting up swipe gestures for top card');
            setupSwipeGestures(cardWrapper);
        }

        // Always show swipe buttons
        window.renderProfileCard(user, cardWrapper, true);
        
        // Append to fragment for better performance
        if (!cardFragment) {
            var cardFragment = document.createDocumentFragment();
        }
        cardFragment.appendChild(cardWrapper);
        
        cardsRendered++;
    }
    
    // Add all cards to DOM at once
    if (cardFragment) {
        deck.appendChild(cardFragment);
        
        // Animate only the top card after all are added
        if (window.DevDateAnimations && deck.children.length > 0) {
            window.DevDateAnimations.animateProfileCard(deck.children[0]);
        }
    }
    
    if (DEBUG_MODE) {
        console.log('=== RENDER COMPLETE ===');
        console.log('Total cards rendered:', cardsRendered);
        console.log('Cards skipped:', skippedCount);
    }
    
    // Update currentCardIndex to skip over any swiped users
    if (skippedCount > 0) {
        currentCardIndex += skippedCount;
        console.log('Updated currentCardIndex to:', currentCardIndex, 'after skipping swiped users');
    }
}

// Setup swipe gestures
function setupSwipeGestures(card) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    function startDrag(e) {
        // Don't start drag if clicking on a button
        if (e.target.closest('.btn-action') || e.target.closest('button')) {
            return;
        }
        
        isDragging = true;
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        card.style.transition = 'none';
    }

    function drag(e) {
        if (!isDragging) return;
        
        currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const diff = currentX - startX;
        
        card.style.transform = `translateX(${diff}px) rotate(${diff / 20}deg)`;
        
        // Show indicators
        const opacity = Math.min(Math.abs(diff) / 100, 1);
        if (diff > 0) {
            card.querySelector('.btn-like')?.parentElement.style.setProperty('--like-opacity', opacity);
        } else {
            card.querySelector('.btn-pass')?.parentElement.style.setProperty('--pass-opacity', opacity);
        }
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        
        const diff = currentX - startX;
        card.style.transition = 'transform 0.3s ease';
        
        // Clean up event listeners immediately
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        
        if (Math.abs(diff) > 100) {
            const direction = diff > 0 ? 'right' : 'left';
            const userId = card.getAttribute('data-user-id');
            animateSwipeOff(card, direction);
            swipe(direction, userId);
        } else {
            card.style.transform = 'translateX(0) rotate(0)';
        }
    }

    card.addEventListener('mousedown', startDrag);
    card.addEventListener('touchstart', startDrag);
}

function animateSwipeOff(card, direction) {
    const distance = window.innerWidth;
    card.style.transform = `translateX(${direction === 'right' ? distance : -distance}px) rotate(${direction === 'right' ? 30 : -30}deg)`;
    card.style.opacity = '0';
    
    // Remove the card from DOM after animation completes
    setTimeout(() => {
        if (card && card.parentNode) {
            card.parentNode.removeChild(card);
            console.log('Card removed from DOM after animation');
        }
    }, 400);
    
    // Add swipe indicator animation
    if (window.DevDateAnimations) {
        window.DevDateAnimations.animateSwipeAction(direction);
    }
    
    setTimeout(() => {
        if (card && card.parentNode) {
            card.remove();
        }
    }, 300);
}

function scrollToNextProfile() {
    console.log('Scroll button clicked');
    if (isSwipping) {
        console.log('Swipe already in progress - scroll button temporarily disabled');
        return;
    }

    const deck = document.getElementById('swipe-deck');
    const topCard = deck ? deck.querySelector('.swipe-card') : null;

    if (!topCard) {
        console.warn('No card available to scroll');
        updateScrollButtonState();
        return;
    }

    const userId = topCard.getAttribute('data-user-id');
    if (!userId) {
        console.error('Top card does not have a user ID associated');
        updateScrollButtonState();
        return;
    }

    console.log('Scrolling past user:', userId);
    const scrollBtn = document.getElementById('scroll-next-btn');
    if (scrollBtn) {
        scrollBtn.disabled = true;
    }
    animateSwipeOff(topCard, 'left');
    swipe('left', userId);
}

// Swipe action
async function swipe(direction, targetUserId) {
    console.log('=== SWIPE STARTED ===');
    console.log('Direction:', direction);
    console.log('Target User ID:', targetUserId);
    console.log('Current Card Index:', currentCardIndex);
    console.log('Current user:', currentUser?.uid);
    console.log('isSwipping flag:', isSwipping);
    
    // Validate target user ID
    if (!targetUserId || targetUserId === 'undefined') {
        console.error('Invalid target user ID:', targetUserId);
        alert('Error: Invalid user ID. Please refresh the page.');
        return;
    }
    
    // Prevent multiple simultaneous swipes
    if (isSwipping) {
        console.log('Already processing a swipe, ignoring...');
        return;
    }
    
    if (!currentUser || !currentUser.uid) {
        console.error('No current user found');
        alert('Please log in again');
        return;
    }
    
    isSwipping = true;
    showLoading();

    try {
        // Record swipe
        console.log('Recording swipe...');
        console.log('Current user UID:', currentUser.uid);
        console.log('Target user ID:', targetUserId);
        console.log('Direction:', direction);
        
        await db.collection('swipes').add({
            userId: currentUser.uid,
            targetUserId,
            direction,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Swipe recorded successfully');

        // Update user's swipe arrays
        console.log('Updating user swipe arrays...');
        const arrayField = direction === 'right' ? 'swipedRight' : 'swipedLeft';
        console.log('Array field to update:', arrayField);
        
        // Use set with merge to ensure fields exist
        const updateData = {
            [arrayField]: firebase.firestore.FieldValue.arrayUnion(targetUserId)
        };
        console.log('Update data:', updateData);
        
        await db.collection('users').doc(currentUser.uid).set(updateData, { merge: true });
        console.log('✅ User arrays updated successfully');
        
        // Also update local userProfile - prevent duplicates
        if (!userProfile[arrayField]) {
            userProfile[arrayField] = [];
        }
        if (!userProfile[arrayField].includes(targetUserId)) {
            userProfile[arrayField].push(targetUserId);
        }
        console.log('Local userProfile updated. Swiped users count:', 
            (userProfile.swipedRight?.length || 0) + (userProfile.swipedLeft?.length || 0));

        // Move to next card FIRST
        currentCardIndex++;
        console.log('Card index incremented to:', currentCardIndex);
        
        // Check if we have more cards
        const hasMoreCards = currentCardIndex < recommendedUsers.length;
        
        if (!hasMoreCards) {
            console.log('No more cards to show');
            hideLoading();
            isSwipping = false;
            setTimeout(() => {
                const noMoreCards = document.getElementById('no-more-cards');
                const deck = document.getElementById('swipe-deck');
                if (noMoreCards) noMoreCards.style.display = 'flex';
                if (deck) deck.style.display = 'none';
            }, 450);
            return;
        }
        
        // For right swipes: check for match and show modal
        if (direction === 'right') {
            const targetUser = await db.collection('users').doc(targetUserId).get();
            const targetData = { id: targetUserId, ...targetUser.data() };
            
            // Check if preferences match
            const preferencesMatch = hasPreferenceOverlap(userProfile, targetData);
            
            // Check if other user also swiped right
            const mutualLike = targetData.swipedRight?.includes(currentUser.uid);
            
            // Hide loading and reset flag
            hideLoading();
            isSwipping = false;
            
            // Render next cards immediately (they'll be behind the modal)
            setTimeout(() => {
                console.log('Rendering next cards (will be behind modal)...');
                renderSwipeCards();
            }, 450);
            
            if (mutualLike) {
                // Scenario 2: Mutual like - both swiped right
                console.log('Mutual like found! Creating match.');
                await createMatch(targetUserId, targetData);
                setTimeout(() => showMatchModal(targetData, 'mutual'), 500);
            } else if (preferencesMatch) {
                // Scenario 1: Preferences match but waiting for their response
                console.log('Preferences match! Waiting for them to like back.');
                setTimeout(() => showMatchModal(targetData, 'preference-match'), 500);
            } else {
                // Scenario 3: No preference match, waiting for their response
                console.log('Right swipe recorded. Waiting for them to like back.');
                setTimeout(() => showMatchModal(targetData, 'pending'), 500);
            }
        } else {
            // Left swipe - render next cards and reset flags
            console.log('Left swipe - rendering next cards after animation');
            hideLoading();
            isSwipping = false;
            setTimeout(() => {
                console.log('Rendering next cards...');
                renderSwipeCards();
            }, 450);
        }
    } catch (error) {
        console.error('❌ Error swiping:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        console.error('Error stack:', error.stack);
        
        let errorMessage = 'Error processing swipe: ';
        if (error.code === 'permission-denied') {
            errorMessage += 'Permission denied. Try these steps:\n';
            errorMessage += '1. Check Firebase Console → Firestore → Rules\n';
            errorMessage += '2. Make sure rules are published\n';
            errorMessage += '3. Sign out and sign in again\n';
            errorMessage += '4. Check browser console for detailed logs';
        } else if (error.code === 'not-found') {
            errorMessage += 'User profile not found.';
        } else if (error.code === 'unauthenticated') {
            errorMessage += 'Not authenticated. Please log in again.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        
        // Don't increment if there was an error - let user try again
        hideLoading();
        isSwipping = false;
        return;
    }
}

// Create match
async function createMatch(otherUserId, otherUserData) {
    const matchId = [currentUser.uid, otherUserId].sort().join('_');
    
    await db.collection('matches').doc(matchId).set({
        users: [currentUser.uid, otherUserId],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        lastMessageTime: null
    });

    // Update both users' match arrays
    await db.collection('users').doc(currentUser.uid).update({
        matches: firebase.firestore.FieldValue.arrayUnion(otherUserId)
    });
    await db.collection('users').doc(otherUserId).update({
        matches: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
    });
    
    // Update local userProfile
    if (!userProfile.matches) {
        userProfile.matches = [];
    }
    if (!userProfile.matches.includes(otherUserId)) {
        userProfile.matches.push(otherUserId);
    }
}

// Show match modal
let currentMatchUserId = null;
let currentMatchType = null;

function showMatchModal(matchedUser, matchType) {
    currentMatchUserId = matchedUser.id || Object.keys(matchedUser).find(k => k !== 'id');
    currentMatchType = matchType;
    
    const modal = document.getElementById('match-modal');
    const icon = document.querySelector('.match-icon');
    const title = document.querySelector('#match-title');
    const text = document.querySelector('#match-text');
    const actions = document.querySelector('.match-actions');
    
    // Configure modal based on match type
    if (matchType === 'mutual') {
        // Scenario 2: Both liked each other
        if (icon) icon.textContent = '🎉';
        if (title) title.textContent = "It's a Match!";
        if (text) text.textContent = `You both liked each other. Now send a message and have a chance to collaborate together!`;
        if (actions) {
            actions.innerHTML = `
                <button onclick="closeMatchModal()" class="btn btn-secondary">Keep Swiping</button>
                <button onclick="goToChat()" class="btn btn-primary">Send Message</button>
            `;
        }
    } else if (matchType === 'preference-match') {
        // Scenario 1: Preferences align
        if (icon) icon.textContent = '💫';
        if (title) title.textContent = "It's a Match!";
        if (text) text.textContent = `Your preferences align with each other. Wait for them to like you back.`;
        if (actions) {
            actions.innerHTML = `
                <button onclick="closeMatchModal()" class="btn btn-primary">Keep Swiping</button>
            `;
        }
    } else if (matchType === 'pending') {
        // Scenario 3: No preference match, waiting
        if (icon) icon.textContent = '💌';
        if (title) title.textContent = "Like Sent!";
        if (text) text.textContent = `Wait for them to like you back.`;
        if (actions) {
            actions.innerHTML = `
                <button onclick="closeMatchModal()" class="btn btn-primary">Keep Swiping</button>
            `;
        }
    }
    
    const profileContainer = document.getElementById('match-profile');
    if (profileContainer) {
        profileContainer.innerHTML = `
            <div class="match-image">
                ${matchedUser.profileImage 
                    ? `<img src="${matchedUser.profileImage}" alt="${matchedUser.name}">` 
                    : `<div class="profile-placeholder">${matchedUser.name?.charAt(0)}</div>`
                }
            </div>
            <h2>${matchedUser.name}</h2>
            <p>${matchedUser.bio || ''}</p>
        `;
    }
    
    if (modal) {
        modal.style.display = 'flex';
    }
    
    // Animate match modal appearance
    if (window.DevDateAnimations) {
        if (matchType === 'mutual') {
            window.DevDateAnimations.animateMatchModal();
        } else {
            // Simpler animation for non-mutual matches
            const modalContent = modal?.querySelector('.modal-content');
            if (modalContent && window.anime) {
                anime({
                    targets: modalContent,
                    scale: [0.8, 1],
                    opacity: [0, 1],
                    duration: 400,
                    easing: 'easeOutCubic'
                });
            }
        }
    }
}

function closeMatchModal() {
    console.log('=== KEEP SWIPING BUTTON CLICKED ===');
    
    const modal = document.getElementById('match-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentMatchUserId = null;
    currentMatchType = null;
    
    console.log('Modal closed, cards should already be visible');
}

function goToChat() {
    const modal = document.getElementById('match-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset swipe state
    isSwipping = false;
    hideLoading();
    
    // If there's a current match user, open their chat
    if (currentMatchUserId) {
        showPage('chat');
        // Store the ID in a local variable to preserve it
        const matchUserId = currentMatchUserId;
        
        // Clear the global variables immediately
        currentMatchUserId = null;
        currentMatchType = null;
        
        // Increased delay to ensure chat page elements are fully loaded
        setTimeout(() => {
            const chatWindow = document.getElementById('chat-window');
            const chatList = document.getElementById('chat-list');
            
            if (chatWindow && chatList) {
                openChatWindow(matchUserId);
            } else {
                console.error('Chat elements not found, retrying...');
                setTimeout(() => {
                    openChatWindow(matchUserId);
                }, 200);
            }
        }, 150);
    } else {
        showPage('chat');
        currentMatchUserId = null;
        currentMatchType = null;
    }
}

// Load matches page
async function loadMatches() {
    const grid = document.getElementById('matches-grid');
    grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const matchIds = userProfile.matches || [];
        
        if (matchIds.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h2>No Matches Yet</h2>
                    <p>Start scrolling to find developers!</p>
                    <button onclick="showPage('discover')" class="btn btn-primary">Start Scrolling</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        
        for (const matchId of matchIds) {
            if (!matchId) {
                console.warn('Empty matchId found, skipping');
                continue;
            }
            
            const userDoc = await db.collection('users').doc(matchId).get();
            if (userDoc.exists) {
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                matchCard.onclick = () => {
                    console.log('Match card clicked, matchId:', matchId);
                    if (!matchId) {
                        console.error('Cannot open chat: matchId is null/undefined');
                        alert('Error opening chat. Please try again.');
                        return;
                    }
                    currentMatchUserId = matchId;
                    showPage('chat');
                    setTimeout(() => openChatWindow(matchId), 100);
                };
                
                const userData = userDoc.data();
                matchCard.innerHTML = `
                    <div class="match-avatar">
                        ${userData.profileImage 
                            ? `<img src="${userData.profileImage}" alt="${userData.name}">` 
                            : `<div class="avatar-placeholder">${userData.name?.charAt(0)}</div>`
                        }
                    </div>
                    <h3>${userData.name}</h3>
                    <p>${userData.bio?.substring(0, 60)}...</p>
                `;
                
                grid.appendChild(matchCard);
            }
        }
        
        // Animate matches grid
        if (window.DevDateAnimations) {
            setTimeout(() => window.DevDateAnimations.animateMatchesGrid(), 100);
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        grid.innerHTML = '<p>Error loading matches</p>';
    }
}
