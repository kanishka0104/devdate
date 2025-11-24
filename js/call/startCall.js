// Start Call - Initiator Logic

let currentWebRTC = null;
let currentCallService = null;
let currentCallUI = null;
let currentCallId = null;
let callStartTime = null;
let callConnectedTime = null;
let callReceiverId = null;
let callType = null;

// Make these globally accessible
window.currentWebRTC = null;

// Start a call (audio or video)
async function startCall(receiverId, receiverName, callTypeParam) {
    try {
        console.log(`Starting ${callTypeParam} call to:`, receiverId);
        
        // Store call info
        callStartTime = Date.now();
        callConnectedTime = null;
        callReceiverId = receiverId;
        callType = callTypeParam;
        
        // Initialize services
        currentWebRTC = new WebRTCManager();
        currentCallService = new CallService();
        currentCallUI = new CallUI();
        
        window.currentWebRTC = currentWebRTC;

        // Show call UI
        currentCallUI.showCallModal(callType, false, receiverName);
        currentCallUI.updateStatus('Initializing...');

        // Get user media
        const localStream = await currentWebRTC.getUserMedia(callType);
        currentCallUI.setLocalStream(localStream);
        currentCallUI.updateStatus('Getting ready...');

        // Create peer connection
        const pc = currentWebRTC.createPeerConnection();

        // Add local stream
        currentWebRTC.addLocalStream();

        // Create offer
        currentCallUI.updateStatus('Creating offer...');
        const offer = await currentWebRTC.createOffer();

        // Create call in Firestore BEFORE setting up ICE handler
        currentCallId = await currentCallService.createCall(
            currentUser.uid,
            receiverId,
            callType,
            { type: offer.type, sdp: offer.sdp }
        );

        currentCallUI.updateStatus('Calling...');

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            currentWebRTC.remoteStream = event.streams[0];
            currentCallUI.setRemoteStream(event.streams[0]);
            currentCallUI.updateStatus('Connected');
        };

        // Handle ICE candidates (after callId is set)
        pc.onicecandidate = async (event) => {
            if (event.candidate && currentCallId) {
                console.log('New ICE candidate:', event.candidate);
                const candidateObj = {
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid
                };
                await currentCallService.addIceCandidate(currentCallId, candidateObj, true);
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
            switch(pc.connectionState) {
                case 'connected':
                    if (!callConnectedTime) {
                        callConnectedTime = Date.now();
                    }
                    currentCallUI.updateStatus('Connected');
                    break;
                case 'disconnected':
                    currentCallUI.updateStatus('Disconnected');
                    setTimeout(() => endCurrentCall(), 3000);
                    break;
                case 'failed':
                    currentCallUI.updateStatus('Connection failed');
                    setTimeout(() => endCurrentCall(), 2000);
                    break;
                case 'closed':
                    currentCallUI.updateStatus('Call ended');
                    setTimeout(() => endCurrentCall(true), 500);
                    break;
            }
        };

        // Listen for answer
        currentCallService.listenForAnswer(currentCallId, async (answer) => {
            if (!answer) {
                currentCallUI.updateStatus('Call rejected');
                setTimeout(() => endCurrentCall(true), 2000);
                return;
            }

            console.log('Got answer, setting remote description');
            await currentWebRTC.setRemoteAnswer(answer);
            currentCallUI.updateStatus('Connecting...');
        });

        // Listen for call status changes (for auto-disconnect)
        currentCallService.listenForCallStatus(currentCallId, (status) => {
            if (status === 'ended') {
                console.log('Call ended by other user');
                currentCallUI.updateStatus('Call ended');
                setTimeout(() => endCurrentCall(true), 1000);
            }
        });

        // Listen for remote ICE candidates
        currentCallService.listenForCandidates(currentCallId, 'answer', async (candidate) => {
            await currentWebRTC.addIceCandidate(candidate);
        });

    } catch (error) {
        console.error('Error starting call:', error);
        alert('Failed to start call: ' + error.message);
        endCurrentCall();
    }
}

// End the current call
async function endCurrentCall(skipFirestoreUpdate = false) {
    console.log('Ending current call...');

    // Calculate call duration
    let duration = 0;
    let callStatus = 'completed';
    
    if (callConnectedTime) {
        duration = Math.floor((Date.now() - callConnectedTime) / 1000); // in seconds
        callStatus = 'completed';
    } else if (callStartTime) {
        // Call was attempted but never connected
        callStatus = 'disconnected';
        duration = 0;
    }

    // Save call history to chat (for both connected and disconnected calls)
    if (callReceiverId && typeof window.saveCallHistory === 'function') {
        await window.saveCallHistory(callReceiverId, callType, duration, true, callStatus);
    }

    // Update Firestore to end the call (unless already ended by other user)
    if (currentCallId && currentCallService && !skipFirestoreUpdate) {
        await currentCallService.endCall(currentCallId);
    }

    if (currentWebRTC) {
        currentWebRTC.endCall();
    }

    if (currentCallService) {
        currentCallService.cleanup();
    }

    if (currentCallUI) {
        currentCallUI.closeModal();
    }

    currentWebRTC = null;
    currentCallService = null;
    currentCallUI = null;
    currentCallId = null;
    callStartTime = null;
    callConnectedTime = null;
    callReceiverId = null;
    callType = null;
    window.currentWebRTC = null;
}

// Make functions globally accessible
window.startCall = startCall;
window.endCurrentCall = endCurrentCall;
