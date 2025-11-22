// Receive Call - Receiver Logic

let incomingCallService = new CallService();
let receiverCallStartTime = null;
let receiverCallConnectedTime = null;
let receiverCallerId = null;
let receiverCallType = null;

// Listen for incoming calls
function startListeningForCalls() {
    if (!currentUser) {
        console.warn('No current user, cannot listen for calls');
        return;
    }

    console.log('Listening for incoming calls for user:', currentUser.uid);

    incomingCallService.listenForIncomingCalls(currentUser.uid, async (callData) => {
        console.log('Incoming call received:', callData);
        
        // Get caller info
        const callerDoc = await db.collection('users').doc(callData.callerId).get();
        const callerName = callerDoc.exists ? callerDoc.data().name : 'Unknown';

        // Show incoming call UI
        const callUI = new CallUI();
        callUI.showIncomingCallNotification(callData, callerName);

        // Store call data for accept/reject handlers
        window.pendingCallData = callData;
        window.pendingCallUI = callUI;
    });
}

// Accept incoming call
async function acceptIncomingCall(callData) {
    try {
        console.log('Accepting call:', callData.id);

        // Store call info
        receiverCallStartTime = Date.now();
        receiverCallConnectedTime = null;
        receiverCallerId = callData.callerId;
        receiverCallType = callData.callType;

        // Initialize WebRTC
        currentWebRTC = new WebRTCManager();
        currentCallService = incomingCallService;
        currentCallUI = window.pendingCallUI;
        currentCallId = callData.id;
        
        window.currentWebRTC = currentWebRTC;

        currentCallUI.updateStatus('Initializing...');

        // Get user media
        const localStream = await currentWebRTC.getUserMedia(callData.callType);
        currentCallUI.setLocalStream(localStream);

        // Create peer connection
        const pc = currentWebRTC.createPeerConnection();

        // Add local stream
        currentWebRTC.addLocalStream();

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            currentWebRTC.remoteStream = event.streams[0];
            currentCallUI.setRemoteStream(event.streams[0]);
            currentCallUI.updateStatus('Connected');
        };

        // Handle ICE candidates
        pc.onicecandidate = async (event) => {
            if (event.candidate && callData.id) {
                console.log('New ICE candidate:', event.candidate);
                const candidateObj = {
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid
                };
                await currentCallService.addIceCandidate(callData.id, candidateObj, false);
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
            switch(pc.connectionState) {
                case 'connected':
                    if (!receiverCallConnectedTime) {
                        receiverCallConnectedTime = Date.now();
                    }
                    currentCallUI.updateStatus('Connected');
                    break;
                case 'disconnected':
                    currentCallUI.updateStatus('Disconnected');
                    break;
                case 'failed':
                    currentCallUI.updateStatus('Connection failed');
                    setTimeout(() => endCurrentCall(), 2000);
                    break;
                case 'closed':
                    currentCallUI.updateStatus('Call ended');
                    break;
            }
        };

        // Create answer
        currentCallUI.updateStatus('Accepting call...');
        const answer = await currentWebRTC.createAnswer(callData.offer);

        // Send answer to Firestore
        await currentCallService.answerCall(callData.id, { type: answer.type, sdp: answer.sdp });

        currentCallUI.updateStatus('Connecting...');

        // Listen for remote ICE candidates
        currentCallService.listenForCandidates(callData.id, 'offer', async (candidate) => {
            await currentWebRTC.addIceCandidate(candidate);
        });

        // Clear pending call data
        window.pendingCallData = null;
        window.pendingCallUI = null;

    } catch (error) {
        console.error('Error accepting call:', error);
        alert('Failed to accept call: ' + error.message);
        endCurrentCall();
    }
}

// Reject incoming call
async function rejectIncomingCall(callId) {
    try {
        console.log('Rejecting call:', callId);
        await incomingCallService.rejectCall(callId);
        
        // Clear pending call data
        window.pendingCallData = null;
        window.pendingCallUI = null;
    } catch (error) {
        console.error('Error rejecting call:', error);
    }
}

// Make functions globally accessible
window.acceptIncomingCall = acceptIncomingCall;
window.rejectIncomingCall = rejectIncomingCall;
window.startListeningForCalls = startListeningForCalls;

// Auto-start listening when user is logged in
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) {
            setTimeout(() => startListeningForCalls(), 1000);
        }
    });
}
