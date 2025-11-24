// WebRTC Calling Service - Firestore Signaling

class CallService {
    constructor() {
        this.db = firebase.firestore();
        this.currentCallId = null;
        this.unsubscribers = [];
    }

    // Create a new call in Firestore
    async createCall(callerId, receiverId, callType, offer) {
        try {
            const callData = {
                callerId: callerId,
                receiverId: receiverId,
                callType: callType, // 'video' or 'audio'
                offer: offer,
                answer: null,
                status: 'calling', // calling, answered, ended, rejected
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const callRef = await this.db.collection('calls').add(callData);
            this.currentCallId = callRef.id;
            
            console.log('Call created:', callRef.id);
            return callRef.id;
        } catch (error) {
            console.error('Error creating call:', error);
            throw error;
        }
    }

    // Listen for answer from receiver
    listenForAnswer(callId, onAnswer) {
        const callRef = this.db.collection('calls').doc(callId);
        
        const unsubscribe = callRef.onSnapshot(snapshot => {
            const data = snapshot.data();
            if (data && data.answer && data.status === 'answered') {
                console.log('Answer received:', data.answer);
                onAnswer(data.answer);
            } else if (data && data.status === 'rejected') {
                console.log('Call rejected');
                onAnswer(null);
            }
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Answer a call
    async answerCall(callId, answer) {
        try {
            await this.db.collection('calls').doc(callId).update({
                answer: answer,
                status: 'answered',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Call answered:', callId);
        } catch (error) {
            console.error('Error answering call:', error);
            throw error;
        }
    }

    // Reject a call
    async rejectCall(callId) {
        try {
            await this.db.collection('calls').doc(callId).update({
                status: 'rejected',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Call rejected:', callId);
        } catch (error) {
            console.error('Error rejecting call:', error);
            throw error;
        }
    }

    // End a call
    async endCall(callId) {
        try {
            if (!callId) callId = this.currentCallId;
            if (!callId) return;

            await this.db.collection('calls').doc(callId).update({
                status: 'ended',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Call ended:', callId);
            this.cleanup();
        } catch (error) {
            console.error('Error ending call:', error);
            throw error;
        }
    }

    // Add ICE candidate
    async addIceCandidate(callId, candidate, isOffer) {
        try {
            const candidateData = {
                candidate: candidate,
                type: isOffer ? 'offer' : 'answer',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('calls').doc(callId)
                .collection('candidates').add(candidateData);
            
            console.log('ICE candidate added:', candidate);
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
            throw error;
        }
    }

    // Listen for ICE candidates
    listenForCandidates(callId, type, onCandidate) {
        const candidatesRef = this.db.collection('calls').doc(callId)
            .collection('candidates')
            .where('type', '==', type);

        const unsubscribe = candidatesRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const candidateData = change.doc.data();
                    console.log('New ICE candidate received:', candidateData.candidate);
                    onCandidate(candidateData.candidate);
                }
            });
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Listen for incoming calls
    listenForIncomingCalls(userId, onIncomingCall) {
        const callsRef = this.db.collection('calls')
            .where('receiverId', '==', userId)
            .where('status', '==', 'calling');

        const unsubscribe = callsRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const callData = { id: change.doc.id, ...change.doc.data() };
                    console.log('Incoming call detected:', callData);
                    onIncomingCall(callData);
                }
            });
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Listen for call status changes (for auto-disconnect)
    listenForCallStatus(callId, onStatusChange) {
        const callRef = this.db.collection('calls').doc(callId);
        
        const unsubscribe = callRef.onSnapshot(snapshot => {
            const data = snapshot.data();
            if (data && data.status) {
                console.log('Call status changed:', data.status);
                onStatusChange(data.status);
            }
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Get call details
    async getCall(callId) {
        try {
            const doc = await this.db.collection('calls').doc(callId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting call:', error);
            throw error;
        }
    }

    // Cleanup listeners
    cleanup() {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.currentCallId = null;
    }
}

// Export for use in other modules
window.CallService = CallService;
