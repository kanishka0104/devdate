// WebRTC Connection Manager

class WebRTCManager {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
    }

    // Initialize peer connection
    createPeerConnection() {
        this.peerConnection = new RTCPeerConnection(this.configuration);
        console.log('Peer connection created');
        return this.peerConnection;
    }

    // Get user media (camera and/or microphone)
    async getUserMedia(callType) {
        try {
            const constraints = callType === 'video' 
                ? { video: true, audio: true }
                : { video: false, audio: true };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Got user media:', callType);
            return this.localStream;
        } catch (error) {
            console.error('Error getting user media:', error);
            throw new Error('Failed to access camera/microphone. Please grant permissions.');
        }
    }

    // Add local stream to peer connection
    addLocalStream() {
        if (!this.localStream || !this.peerConnection) {
            throw new Error('Local stream or peer connection not initialized');
        }

        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
            console.log('Added track to peer connection:', track.kind);
        });
    }

    // Create SDP offer
    async createOffer() {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            console.log('Created offer:', offer);
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            throw error;
        }
    }

    // Create SDP answer
    async createAnswer(offer) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            console.log('Created answer:', answer);
            return answer;
        } catch (error) {
            console.error('Error creating answer:', error);
            throw error;
        }
    }

    // Set remote answer
    async setRemoteAnswer(answer) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('Remote answer set');
        } catch (error) {
            console.error('Error setting remote answer:', error);
            throw error;
        }
    }

    // Add ICE candidate
    async addIceCandidate(candidate) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('ICE candidate added');
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    // Toggle camera (video calls only)
    toggleCamera() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                console.log('Camera toggled:', videoTrack.enabled);
                return videoTrack.enabled;
            }
        }
        return false;
    }

    // Toggle microphone
    toggleMicrophone() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                console.log('Microphone toggled:', audioTrack.enabled);
                return audioTrack.enabled;
            }
        }
        return false;
    }

    // End call and cleanup
    endCall() {
        console.log('Ending call and cleaning up...');

        // Stop all local tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped track:', track.kind);
            });
            this.localStream = null;
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
            console.log('Peer connection closed');
        }

        this.remoteStream = null;
    }

    // Get connection state
    getConnectionState() {
        return this.peerConnection ? this.peerConnection.connectionState : 'closed';
    }
}

// Export for use in other modules
window.WebRTCManager = WebRTCManager;
