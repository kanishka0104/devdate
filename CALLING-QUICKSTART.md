# Video/Audio Calling - Quick Start Guide

## ✅ Installation Complete!

The WebRTC calling feature has been fully integrated into DevDate.

## What Was Added

### 📁 New Files Created
1. **js/call/callService.js** - Firestore signaling service
2. **js/call/webrtc.js** - WebRTC connection manager
3. **js/call/callUI.js** - Call UI components
4. **js/call/startCall.js** - Outgoing call logic
5. **js/call/receiveCall.js** - Incoming call listener
6. **css/call.css** - Call interface styling

### 🔧 Files Modified
1. **app.html**
   - Added `<link>` for `call.css`
   - Added 5 `<script>` tags for call functionality
   - Added video/audio call buttons in chat header

2. **js/chat.js**
   - Added `startVideoCall()` function
   - Added `startAudioCall()` function
   - Store chat user info for calls

## How to Use

### 1. Start a Call
1. Open a chat conversation with a match
2. Click the **📹 Video** button for video call
3. Or click the **📞 Audio** button for audio call
4. Grant camera/microphone permissions
5. Wait for the other person to answer

### 2. Receive a Call
1. An incoming call notification will appear automatically
2. You'll see the caller's name
3. Click **Accept** to answer
4. Or click **Reject** to decline

### 3. During a Call
- **Toggle Camera**: Click camera button (video calls only)
- **Toggle Microphone**: Click microphone button
- **End Call**: Click red phone button

## Testing the Feature

### Test with Two Browser Windows
1. **Window 1**: Login as User A
2. **Window 2**: Login as User B (use incognito/private mode)
3. Make sure both users are matched
4. Open chat between them
5. User A clicks video/audio call button
6. User B accepts the call
7. Verify video/audio works both ways

### What to Check
- ✅ Camera/microphone permissions prompt
- ✅ Local video appears in bottom-right corner
- ✅ Remote video fills the screen
- ✅ Audio is clear and synchronized
- ✅ Call controls work (camera, mic, end)
- ✅ Call ends cleanly on hangup

## Troubleshooting

### Call Not Connecting?
1. **Check permissions**: Both users must grant camera/microphone access
2. **Check console**: Open browser DevTools → Console for errors
3. **Refresh page**: Sometimes WebRTC needs a fresh start
4. **Try different browser**: Use Chrome/Firefox/Edge

### No Video/Audio?
1. **Check permissions**: Browser settings → Site permissions
2. **Check devices**: Make sure camera/mic are working
3. **Try different device**: USB webcam, built-in camera, etc.
4. **Check mute status**: Unmute camera/microphone

### Incoming Call Not Showing?
1. **Check listener**: Should auto-start on login
2. **Check console**: Look for "Listening for incoming calls"
3. **Refresh page**: Restart the app
4. **Check Firestore**: Verify call document exists

## Browser Requirements

### Minimum Versions
- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+

### Required Features
- WebRTC support
- getUserMedia API
- HTTPS or localhost (for camera/mic access)

## Firestore Structure

### Call Document
```
/calls/{callId}
  - callerId: "user123"
  - receiverId: "user456"
  - callerName: "John Doe"
  - receiverName: "Jane Smith"
  - callType: "video" | "audio"
  - status: "calling" | "active" | "ended" | "rejected"
  - offer: { ... SDP ... }
  - answer: { ... SDP ... }
  - createdAt: timestamp
```

### ICE Candidates
```
/calls/{callId}/candidates/{candidateId}
  - candidate: { ... ICE candidate ... }
  - type: "caller" | "receiver"
  - timestamp: timestamp
```

## Security Notes

### Current Rules (Development)
All authenticated users can read/write everything.

### Production Recommendation
Update `firestore.rules` to restrict:
- Users can only create calls as caller
- Users can only read/update calls they're involved in
- See `CALLING-FEATURE.md` for detailed rules

## Next Steps

### 🚀 Ready to Test!
1. Deploy to Firebase Hosting (or test locally)
2. Open app in two browsers
3. Start a call between matched users
4. Verify everything works

### 📚 Learn More
- **CALLING-FEATURE.md** - Complete technical documentation
- **js/call/** - Browse the source code
- **css/call.css** - Customize the UI

## Common Issues

### "getUserMedia is not defined"
- Must use HTTPS or localhost
- HTTP won't work for camera/mic access

### "Permission denied"
- User blocked camera/mic access
- Check browser settings → Site permissions
- Grant access and refresh

### "Connection failed"
- Network firewall blocking WebRTC
- Try different network (mobile hotspot, etc.)
- May need TURN servers for restrictive networks

### "Call modal not showing"
- Check if call.css is loaded
- Verify scripts loaded in correct order
- Check browser console for errors

## Support

### Debug Information
Always check browser console (F12) for:
- Permission errors
- WebRTC connection states
- Firestore read/write errors
- ICE candidate failures

### Log Locations
- **callService.js**: Firestore operations
- **webrtc.js**: Peer connection states
- **startCall.js**: Outgoing call flow
- **receiveCall.js**: Incoming call listener

## Success! 🎉

You now have a complete video/audio calling system integrated into DevDate. Happy coding!
