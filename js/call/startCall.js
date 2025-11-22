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

        // Listen for answer
        currentCallService.listenForAnswer(currentCallId, async (answer) => {
            if (!answer) {
                currentCallUI.updateStatus('Call rejected');
                setTimeout(() => endCurrentCall(), 2000);
                return;
            }

            console.log('Got answer, setting remote description');
            await currentWebRTC.setRemoteAnswer(answer);
            currentCallUI.updateStatus('Connecting...');
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
async function endCurrentCall() {
    console.log('Ending current call...');

    // Calculate call duration
    let duration = 0;
    if (callConnectedTime) {
        duration = Math.floor((Date.now() - callConnectedTime) / 1000); // in seconds
    }

    // Save call history to chat if call was connected
    if (callConnectedTime && callReceiverId && typeof window.saveCallHistory === 'function') {
        await window.saveCallHistory(callReceiverId, callType, duration, true);
    }

    if (currentCallId && currentCallService) {
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
