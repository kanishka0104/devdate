// Chat functionality

let activeMatchId = null;
let messagesListener = null;
let isSendingMessage = false;

// Load chat list
let chatListCache = null;
let chatListCacheTime = 0;
const CHAT_CACHE_DURATION = 30000; // 30 seconds

async function loadChatList() {
    const chatList = document.getElementById('chat-list');
    
    // Use cache if available
    const now = Date.now();
    if (chatListCache && (now - chatListCacheTime) < CHAT_CACHE_DURATION) {
        chatList.innerHTML = chatListCache;
        return;
    }
    
    chatList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const matchIds = userProfile.matches || [];
        
        if (matchIds.length === 0) {
            chatList.innerHTML = `
                <div class="empty-state">
                    <h2>No Matches Yet</h2>
                    <p>Start swiping to connect with developers!</p>
                    <button onclick="showPage('discover')" class="btn btn-primary">Start Swiping</button>
                </div>
            `;
            return;
        }

        // Load all matches in parallel for better performance
        const chatItemsPromises = matchIds.slice(0, 20).map(async (matchId) => {
            try {
                const matchDocId = [currentUser.uid, matchId].sort().join('_');
                
                // Load user and match data in parallel
                const [userDoc, matchDoc] = await Promise.all([
                    db.collection('users').doc(matchId).get(),
                    db.collection('matches').doc(matchDocId).get().catch(() => null)
                ]);
                
                if (!userDoc.exists) return null;
                
                const userData = userDoc.data();
                const matchData = matchDoc?.exists ? matchDoc.data() : {};
                
                return {
                    userId: matchId,
                    matchId: matchDocId,
                    userData,
                    lastMessage: matchData.lastMessage || null,
                    lastMessageTime: matchData.lastMessageTime || null
                };
            } catch (err) {
                console.error('Error loading match:', matchId, err);
                return null;
            }
        });
        
        const results = await Promise.all(chatItemsPromises);
        const chatItems = results.filter(item => item !== null)

        // Sort by last message time
        chatItems.sort((a, b) => {
            const timeA = a.lastMessageTime?.seconds || 0;
            const timeB = b.lastMessageTime?.seconds || 0;
            return timeB - timeA;
        });

        chatList.innerHTML = '';
        chatItems.forEach(item => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.onclick = () => openChatWindow(item.userId);
            
            const timeStr = item.lastMessageTime 
                ? formatTimeAgo(item.lastMessageTime.seconds * 1000)
                : '';
            
            chatItem.innerHTML = `
                <div class="chat-avatar">
                    ${item.userData.profileImage 
                        ? `<img src="${item.userData.profileImage}" alt="${item.userData.name}">` 
                        : `<div class="avatar-placeholder">${item.userData.name?.charAt(0)}</div>`
                    }
                </div>
                <div class="chat-info">
                    <div class="chat-header">
                        <h3>${item.userData.name}</h3>
                        ${timeStr ? `<span class="chat-time">${timeStr}</span>` : ''}
                    </div>
                    <p class="chat-preview">${item.lastMessage || 'Start a conversation!'}</p>
                </div>
            `;
            
            chatList.appendChild(chatItem);
        });
        
        // Cache the rendered HTML
        chatListCache = chatList.innerHTML;
        chatListCacheTime = Date.now();
    } catch (error) {
        console.error('Error loading chat list:', error);
        chatList.innerHTML = '<p>Error loading chats</p>';
    }
}

// Back to chat list
function backToChats() {
    // Clean up message listener
    if (messagesListener) {
        messagesListener();
        messagesListener = null;
    }
    
    document.getElementById('chat-window').style.display = 'none';
    document.getElementById('chat-list').style.display = 'block';
    activeMatchId = null;
    
    // Refresh chat list
    chatListCache = null; // Invalidate cache
    loadChatList();
}

// Open chat window
async function openChatWindow(otherUserId) {
    console.log('=== OPENING CHAT WINDOW ===');
    console.log('Other user ID:', otherUserId);
    console.log('Type of otherUserId:', typeof otherUserId);
    console.log('Current user ID:', currentUser?.uid);
    
    if (!otherUserId || otherUserId === 'undefined' || otherUserId === 'null') {
        console.error('No user ID provided to openChatWindow');
        console.error('Stack trace:', new Error().stack);
        alert('Error: Cannot open chat - no user specified');
        return;
    }
    
    activeMatchId = [currentUser.uid, otherUserId].sort().join('_');
    console.log('Active match ID set to:', activeMatchId);
    
    const chatList = document.getElementById('chat-list');
    const chatWindow = document.getElementById('chat-window');
    
    if (!chatList || !chatWindow) {
        console.error('Chat elements not found!');
        console.log('chatList exists:', !!chatList);
        console.log('chatWindow exists:', !!chatWindow);
        alert('Error: Chat interface not ready. Please try again.');
        return;
    }
    
    chatList.style.display = 'none';
    chatWindow.style.display = 'flex';

    // Load other user info
    try {
        const userDoc = await db.collection('users').doc(otherUserId).get();
        
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        
        console.log('Loaded user data for chat:', userData?.name);
        
        const chatUserInfo = document.getElementById('chat-user-info');
        if (!chatUserInfo) {
            throw new Error('Chat user info element not found');
        }
        
        chatUserInfo.innerHTML = `
            <div class="chat-avatar">
                ${userData.profileImage 
                    ? `<img src="${userData.profileImage}" alt="${userData.name}">` 
                    : `<div class="avatar-placeholder">${userData.name?.charAt(0)}</div>`
                }
            </div>
            <div>
                <h3>${userData.name}</h3>
                <p>${userData.bio?.substring(0, 50) || ''}</p>
            </div>
        `;

        // Load messages
        console.log('Loading messages for match:', activeMatchId);
        loadMessages();
    } catch (error) {
        console.error('Error opening chat window:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        alert('Error loading chat: ' + error.message);
    }
}

function backToChats() {
    if (messagesListener) {
        messagesListener();
        messagesListener = null;
    }
    
    document.getElementById('chat-window').style.display = 'none';
    document.getElementById('chat-list').style.display = 'block';
    activeMatchId = null;
}

// Load and listen to messages
function loadMessages() {
    const container = document.getElementById('messages-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    if (messagesListener) {
        messagesListener();
    }

    // First try to load messages ordered by timestamp (last 100 messages)
    messagesListener = db.collection('matches')
        .doc(activeMatchId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .limitToLast(100)
        .onSnapshot(
            snapshot => {
                container.innerHTML = '';
                
                if (snapshot.empty) {
                    container.innerHTML = '<div class="empty-chat"><p>Send a message to start the conversation!</p></div>';
                    return;
                }

                snapshot.forEach(doc => {
                    const message = doc.data();
                    renderMessage(message, container);
                });

                // Scroll to bottom
                setTimeout(() => {
                    container.scrollTop = container.scrollHeight;
                }, 100);
            },
            error => {
                // If ordering by timestamp fails (index not created), load without ordering
                console.log('Loading messages without timestamp ordering:', error);
                loadMessagesWithoutOrder(container);
            }
        );
}

// Fallback: Load messages without ordering (for old messages without timestamps)
function loadMessagesWithoutOrder(container) {
    db.collection('matches')
        .doc(activeMatchId)
        .collection('messages')
        .onSnapshot(snapshot => {
            container.innerHTML = '';
            
            if (snapshot.empty) {
                container.innerHTML = '<div class="empty-chat"><p>Send a message to start the conversation!</p></div>';
                return;
            }

            // Manually sort by timestamp if available
            const messages = [];
            snapshot.forEach(doc => {
                messages.push({ id: doc.id, ...doc.data() });
            });

            messages.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeA - timeB;
            });

            messages.forEach(message => {
                renderMessage(message, container);
            });

            // Scroll to bottom
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        });
}

// Render message bubble
function renderMessage(message, container) {
    const isOwn = message.senderId === currentUser.uid;
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isOwn ? 'own' : 'other'}`;
    
    const timeStr = message.timestamp 
        ? formatTimeAgo(message.timestamp.seconds * 1000)
        : 'Just now';
    
    bubble.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(message.message)}</p>
        </div>
        <span class="message-time">${timeStr}</span>
    `;
    
    container.appendChild(bubble);
    
    // Animate message bubble
    if (window.DevDateAnimations) {
        window.DevDateAnimations.animateMessageBubble(bubble);
    }
}

// Send message
async function sendMessage() {
    console.log('=== SEND MESSAGE CALLED ===');
    
    if (isSendingMessage) {
        console.log('Already sending a message, please wait...');
        return;
    }
    
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    console.log('Message input value:', message);
    console.log('Active match ID:', activeMatchId);
    console.log('Current user:', currentUser?.uid);
    
    if (!message) {
        console.log('No message entered');
        return;
    }
    
    if (!activeMatchId) {
        console.error('No active match ID - cannot send message');
        alert('Error: No active chat. Please select a chat first.');
        return;
    }
    
    if (!currentUser || !currentUser.uid) {
        console.error('No current user - cannot send message');
        alert('Error: You must be logged in to send messages.');
        return;
    }

    // Clear input and set sending state
    input.value = '';
    input.disabled = true;
    isSendingMessage = true;

    try {
        const [userId1, userId2] = activeMatchId.split('_');
        const receiverId = userId1 === currentUser.uid ? userId2 : userId1;
        
        console.log('Sending message to:', receiverId);
        console.log('Match ID:', activeMatchId);

        // Add message to subcollection
        const messageRef = await db.collection('matches').doc(activeMatchId).collection('messages').add({
            senderId: currentUser.uid,
            receiverId,
            message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        
        console.log('✓ Message added to messages subcollection with ID:', messageRef.id);

        // Update or create last message in match document
        await db.collection('matches').doc(activeMatchId).set({
            lastMessage: message,
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            users: [userId1, userId2]
        }, { merge: true });
        
        console.log('✓ Match document updated');
        console.log('✅ Message sent successfully!');
    } catch (error) {
        console.error('❌ Error sending message:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Put the message back in the input on error
        input.value = message;
        
        let errorMsg = 'Error sending message: ';
        if (error.code === 'permission-denied') {
            errorMsg += 'Permission denied. Please check your Firestore rules.';
        } else {
            errorMsg += error.message;
        }
        alert(errorMsg);
    } finally {
        // Re-enable input
        input.disabled = false;
        input.focus();
        isSendingMessage = false;
        console.log('Send message operation completed');
    }
}

// Enter key to send
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('message-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// Format time ago
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return Math.floor(seconds / 604800) + 'w ago';
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
