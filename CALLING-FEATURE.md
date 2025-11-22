# Video/Audio Calling Feature Documentation

## Overview
Complete WebRTC-based video and audio calling system integrated into DevDate. Uses Firebase Firestore for signaling and WebRTC for peer-to-peer media streaming.

## Architecture

### File Structure
```
js/call/
├── callService.js      - Firestore signaling operations
├── webrtc.js          - WebRTC connection management
├── callUI.js          - Call modal UI and DOM manipulation
├── startCall.js       - Outgoing call initiator logic
└── receiveCall.js     - Incoming call receiver logic

css/
└── call.css           - Complete call UI styling
```

## Features

### ✅ Video Calling
- Full-screen video interface
- Local video PIP (bottom-right corner)
- Remote video fills screen
- Camera toggle on/off

### ✅ Audio Calling
- Audio-only mode with avatar display
- Microphone toggle on/off
- No video streams

### ✅ Call Controls
- Toggle camera (video calls only)
- Toggle microphone
- End call button
- Visual feedback for muted states

### ✅ Incoming Call Notifications
- Modal notification with caller name
- Accept/Reject buttons
- Auto-dismisses on answer/reject

### ✅ Call States
- Connecting
- Connected
- Ended
- Rejected
- Error handling

## How It Works

### 1. Signaling (Firestore)
```
/calls/{callId}
  - callerId: string
  - receiverId: string
  - callerName: string
  - receiverName: string
  - callType: 'video' | 'audio'
  - status: 'calling' | 'active' | 'ended' | 'rejected'
  - offer: RTCSessionDescription (SDP)
  - answer: RTCSessionDescription (SDP)
  - createdAt: timestamp

/calls/{callId}/candidates/{candidateId}
  - candidate: RTCIceCandidate
  - type: 'caller' | 'receiver'
  - timestamp: timestamp
```

### 2. WebRTC Flow

#### Outgoing Call (startCall.js)
1. User clicks video/audio button in chat
2. Request camera/microphone permissions
3. Create RTCPeerConnection
4. Add local media stream to connection
5. Create SDP offer
6. Save offer to Firestore (`/calls/{callId}`)
7. Listen for answer from receiver
8. Listen for ICE candidates
9. Connect when both peers exchange SDP + ICE

#### Incoming Call (receiveCall.js)
1. Real-time listener on `/calls` collection
2. Filter for calls where `receiverId === currentUser.uid`
3. Show incoming call notification
4. On accept:
   - Request camera/microphone permissions
   - Create RTCPeerConnection
   - Add local media stream
   - Set remote offer from Firestore
   - Create SDP answer
   - Save answer to Firestore
   - Exchange ICE candidates
5. On reject:
   - Update call status to 'rejected'

### 3. ICE Candidate Exchange
- Both peers generate ICE candidates (network routes)
- Candidates saved to `/calls/{callId}/candidates` subcollection
- Each peer listens to opponent's candidates
- Add candidates to RTCPeerConnection for NAT traversal

## Usage

### Initiate Call from Chat
```javascript
// Video call
window.startVideoCall(); // Called from chat header button

// Audio call
window.startAudioCall(); // Called from chat header button
```

### Programmatic Call
```javascript
// Video call
window.startCall(receiverId, receiverName, 'video');

// Audio call
window.startCall(receiverId, receiverName, 'audio');
```

### End Call
```javascript
window.endCurrentCall();
```

### Accept Incoming Call
```javascript
// Called automatically when user clicks "Accept"
window.acceptIncomingCall();
```

### Reject Incoming Call
```javascript
// Called automatically when user clicks "Reject"
window.rejectIncomingCall();
```

## UI Components

### Call Modal
- Full-screen overlay with dark background
- Dismisses on call end
- Displays call status (Connecting, Connected, etc.)

### Video Layout
```
┌─────────────────────────────────┐
│                                 │
│     Remote Video (Full)         │
│                                 │
│                                 │
│                       ┌─────┐   │
│                       │Local│   │
│                       │Video│   │
│   [🎥] [🎤] [📞]      └─────┘   │
└─────────────────────────────────┘
```

### Audio Layout
```
┌─────────────────────────────────┐
│                                 │
│           👤                    │
│        User Name                │
│                                 │
│                                 │
│                                 │
│                                 │
│   [🎤] [📞]                     │
└─────────────────────────────────┘
```

### Chat Integration
- Video call button (📹) in chat header
- Audio call button (📞) in chat header
- Buttons only visible when chat is open

## Configuration

### STUN Servers
```javascript
// In webrtc.js
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};
```

### Media Constraints
```javascript
// Video call
const constraints = {
    video: true,
    audio: true
};

// Audio call
const constraints = {
    video: false,
    audio: true
};
```

## Firestore Security Rules

Current rules allow authenticated users to read/write all documents:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Recommended Production Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Calls collection
    match /calls/{callId} {
      // Allow users to create calls where they are the caller
      allow create: if request.auth != null 
        && request.resource.data.callerId == request.auth.uid;
      
      // Allow users to read/update calls where they are involved
      allow read, update: if request.auth != null 
        && (resource.data.callerId == request.auth.uid 
            || resource.data.receiverId == request.auth.uid);
      
      // Allow users to delete their own calls
      allow delete: if request.auth != null 
        && resource.data.callerId == request.auth.uid;
      
      // ICE candidates subcollection
      match /candidates/{candidateId} {
        allow read, write: if request.auth != null 
          && (get(/databases/$(database)/documents/calls/$(callId)).data.callerId == request.auth.uid
              || get(/databases/$(database)/documents/calls/$(callId)).data.receiverId == request.auth.uid);
      }
    }
  }
}
```

## Testing Checklist

### ✅ Outgoing Video Call
- [ ] Click video button in chat
- [ ] Camera/microphone permissions requested
- [ ] Local video appears in PIP
- [ ] Call modal shows "Connecting..."
- [ ] Remote video appears when receiver answers
- [ ] Status changes to "Connected"

### ✅ Outgoing Audio Call
- [ ] Click audio button in chat
- [ ] Microphone permission requested
- [ ] Avatar displayed instead of video
- [ ] Call modal shows "Connecting..."
- [ ] Audio works when receiver answers

### ✅ Incoming Call
- [ ] Incoming call notification appears
- [ ] Shows caller name
- [ ] Accept button works
- [ ] Reject button works
- [ ] Notification dismisses after action

### ✅ Call Controls
- [ ] Camera toggle (video only)
- [ ] Microphone toggle
- [ ] End call button
- [ ] Visual feedback for muted states

### ✅ Error Handling
- [ ] Permission denied shows error
- [ ] Network errors handled gracefully
- [ ] Call cleanup on errors
- [ ] Firestore errors logged

### ✅ Cleanup
- [ ] Media streams stopped on call end
- [ ] Peer connections closed
- [ ] Firestore listeners unsubscribed
- [ ] UI reset to default state

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Edge 80+
- ✅ Safari 13+
- ✅ Opera 67+

### Required Permissions
- Camera (for video calls)
- Microphone (for all calls)
- HTTPS or localhost (WebRTC requirement)

## Troubleshooting

### Call Not Connecting
1. Check browser console for errors
2. Verify both users have granted permissions
3. Check Firestore rules allow read/write
4. Verify STUN servers are accessible
5. Check network connectivity

### No Video/Audio
1. Check camera/microphone permissions
2. Verify media devices are available
3. Check browser console for getUserMedia errors
4. Try different browser
5. Restart browser/computer

### ICE Connection Failed
1. Network may require TURN servers (not included)
2. Firewall/corporate network blocking WebRTC
3. NAT traversal issues (rare with Google STUN)

### Call Automatically Ends
1. Check for JavaScript errors in console
2. Verify Firestore listeners are active
3. Check peer connection state
4. Verify call status in Firestore

## Future Enhancements

### Potential Features
- [ ] TURN servers for better connectivity
- [ ] Screen sharing
- [ ] Group calls (multi-peer)
- [ ] Call history/logs
- [ ] Recording capability
- [ ] Picture-in-picture mode
- [ ] Chat during call
- [ ] Network quality indicator
- [ ] Bandwidth adaptation
- [ ] Background blur/virtual backgrounds

### Performance Optimizations
- [ ] Lazy load WebRTC scripts
- [ ] Compress video streams
- [ ] Adaptive bitrate
- [ ] Connection quality detection
- [ ] Automatic fallback to audio-only

## Technical Notes

### Why Firestore for Signaling?
- Real-time updates (onSnapshot)
- Automatic synchronization
- No separate signaling server needed
- Built-in authentication
- Scalable and reliable

### Why Not Socket.io/WebSockets?
- Additional server infrastructure required
- More complex deployment
- Firestore already integrated
- Real-time database sufficient for signaling

### Performance Considerations
- Peer-to-peer: No media through server
- STUN servers: Only for NAT traversal
- ICE candidates: Minimal data exchange
- Firestore reads: ~3-5 per call setup

## Dependencies

### External Libraries
- None (Vanilla JavaScript)

### Firebase Services
- Firestore (signaling)
- Auth (user authentication)

### Browser APIs
- RTCPeerConnection
- getUserMedia
- MediaStream
- RTCIceCandidate
- RTCSessionDescription

## License
Part of DevDate application. All rights reserved.

## Support
For issues or questions, check browser console for detailed error logs.
