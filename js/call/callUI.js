// Call UI Manager

class CallUI {
    constructor() {
        this.callModal = null;
        this.localVideo = null;
        this.remoteVideo = null;
        this.isCameraOn = true;
        this.isMicOn = true;
        this.callType = null;
    }

    // Show call modal
    showCallModal(callType, isIncoming = false, callerName = '') {
        this.callType = callType;
        
        // Create modal HTML
        const modalHTML = `
            <div id="call-modal" class="call-modal">
                <div class="call-container">
                    <div class="call-header">
                        <h2>${isIncoming ? 'Incoming' : ''} ${callType === 'video' ? 'Video' : 'Audio'} Call</h2>
                        <p class="caller-name">${callerName || 'Connecting...'}</p>
                        <p class="call-status" id="call-status">Connecting...</p>
                    </div>

                    <div class="videos-container ${callType === 'audio' ? 'audio-only' : ''}">
                        ${callType === 'video' ? `
                            <video id="remote-video" class="remote-video" autoplay playsinline></video>
                            <video id="local-video" class="local-video" autoplay playsinline muted></video>
                        ` : `
                            <div class="audio-call-avatar">
                                <i class="fas fa-user-circle"></i>
                                <p>${callerName || 'User'}</p>
                            </div>
                            <audio id="remote-audio" autoplay></audio>
                            <audio id="local-audio" muted></audio>
                        `}
                    </div>

                    <div class="call-controls">
                        ${callType === 'video' ? `
                            <button id="toggle-camera-btn" class="control-btn camera-btn" title="Toggle Camera">
                                <i class="fas fa-video"></i>
                            </button>
                        ` : ''}
                        <button id="toggle-mic-btn" class="control-btn mic-btn" title="Toggle Microphone">
                            <i class="fas fa-microphone"></i>
                        </button>
                        <button id="end-call-btn" class="control-btn end-call-btn" title="End Call">
                            <i class="fas fa-phone-slash"></i>
                        </button>
                    </div>

                    ${isIncoming ? `
                        <div class="incoming-call-actions">
                            <button id="accept-call-btn" class="btn btn-success">
                                <i class="fas fa-phone"></i> Accept
                            </button>
                            <button id="reject-call-btn" class="btn btn-danger">
                                <i class="fas fa-phone-slash"></i> Reject
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.callModal = document.getElementById('call-modal');
        
        if (callType === 'video') {
            this.localVideo = document.getElementById('local-video');
            this.remoteVideo = document.getElementById('remote-video');
        }

        // Add event listeners
        this.attachEventListeners();
    }

    // Attach event listeners to buttons
    attachEventListeners() {
        const toggleCameraBtn = document.getElementById('toggle-camera-btn');
        const toggleMicBtn = document.getElementById('toggle-mic-btn');
        const endCallBtn = document.getElementById('end-call-btn');

        if (toggleCameraBtn) {
            toggleCameraBtn.onclick = () => this.onToggleCamera();
        }

        if (toggleMicBtn) {
            toggleMicBtn.onclick = () => this.onToggleMic();
        }

        if (endCallBtn) {
            endCallBtn.onclick = () => this.onEndCall();
        }
    }

    // Set local stream
    setLocalStream(stream) {
        if (this.callType === 'video' && this.localVideo) {
            this.localVideo.srcObject = stream;
        }
    }

    // Set remote stream
    setRemoteStream(stream) {
        if (this.callType === 'video' && this.remoteVideo) {
            this.remoteVideo.srcObject = stream;
        } else if (this.callType === 'audio') {
            const remoteAudio = document.getElementById('remote-audio');
            if (remoteAudio) {
                remoteAudio.srcObject = stream;
            }
        }
    }

    // Update call status
    updateStatus(status) {
        const statusElement = document.getElementById('call-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    // Toggle camera callback
    onToggleCamera() {
        if (window.currentWebRTC) {
            this.isCameraOn = window.currentWebRTC.toggleCamera();
            const btn = document.getElementById('toggle-camera-btn');
            if (btn) {
                btn.classList.toggle('disabled', !this.isCameraOn);
                btn.querySelector('i').className = this.isCameraOn ? 'fas fa-video' : 'fas fa-video-slash';
            }
        }
    }

    // Toggle microphone callback
    onToggleMic() {
        if (window.currentWebRTC) {
            this.isMicOn = window.currentWebRTC.toggleMicrophone();
            const btn = document.getElementById('toggle-mic-btn');
            if (btn) {
                btn.classList.toggle('disabled', !this.isMicOn);
                btn.querySelector('i').className = this.isMicOn ? 'fas fa-microphone' : 'fas fa-microphone-slash';
            }
        }
    }

    // End call callback
    onEndCall() {
        if (window.endCurrentCall) {
            window.endCurrentCall();
        }
        this.closeModal();
    }

    // Close modal
    closeModal() {
        if (this.callModal) {
            this.callModal.remove();
            this.callModal = null;
            this.localVideo = null;
            this.remoteVideo = null;
        }
    }

    // Show incoming call notification
    showIncomingCallNotification(callData, callerName) {
        this.showCallModal(callData.callType, true, callerName);
        
        // Set up accept/reject buttons
        const acceptBtn = document.getElementById('accept-call-btn');
        const rejectBtn = document.getElementById('reject-call-btn');

        if (acceptBtn) {
            acceptBtn.onclick = () => {
                if (window.acceptIncomingCall) {
                    window.acceptIncomingCall(callData);
                }
                // Hide action buttons
                const actionsDiv = document.querySelector('.incoming-call-actions');
                if (actionsDiv) actionsDiv.style.display = 'none';
            };
        }

        if (rejectBtn) {
            rejectBtn.onclick = () => {
                if (window.rejectIncomingCall) {
                    window.rejectIncomingCall(callData.id);
                }
                this.closeModal();
            };
        }
    }
}

// Export for use in other modules
window.CallUI = CallUI;
