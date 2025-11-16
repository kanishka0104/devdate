# DevDate - Developer Collaboration Platform

A Tinder-like platform for developers to connect, collaborate, and network. Built with pure **HTML, CSS, and JavaScript** - no npm, no build tools, no frameworks!

## 🚀 Features

✅ **Authentication**
- Email/Password login & signup
- Google OAuth
- GitHub OAuth
- Firebase Authentication

✅ **User Profiles**
- Complete profile onboarding
- Profile image upload
- Skills, tech stack, project interests
- GitHub/LinkedIn integration
- Mentor/Recruiter modes

✅ **Swipe Matching**
- Tinder-style card swipes
- Smart compatibility algorithm
- Match notifications
- Real-time match detection

✅ **Real-Time Chat**
- Firebase Firestore real-time messaging
- Chat history
- Message timestamps
- Match-based conversations

✅ **AI Integration**
- Google AI Studio (Gemini) integration
- Bio suggestions
- Conversation starters
- Skill recommendations

## 📦 Tech Stack

- **Frontend**: Pure HTML, CSS, JavaScript
- **Backend/Database**: Firebase (Auth, Firestore, Storage)
- **AI**: Google AI Studio (Gemini Pro API)
- **Icons**: Font Awesome CDN
- **Firebase**: CDN (no npm required)

## 🛠️ Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "DevDate"
3. Enable Authentication:
   - Email/Password
   - Google
   - GitHub (optional)
4. Create Firestore Database (production mode)
5. Enable Storage
6. Get your Firebase config from Project Settings

### 2. Configure the App

Open `js/config.js` and replace with your Firebase credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Google AI Studio Setup (Optional)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `js/config.js`:

```javascript
const GOOGLE_AI_API_KEY = "YOUR_GOOGLE_AI_API_KEY";
```

### 4. Set Up Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth.uid == userId;
    }
    
    match /swipes/{swipeId} {
      allow read, write: if request.auth != null;
    }
    
    match /matches/{matchId} {
      allow read, write: if request.auth != null;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### 5. Set Up Storage Security Rules

In Firebase Console → Storage → Rules, paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-images/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### 6. Run the App

Simply open `index.html` in your browser!

Or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using PHP
php -S localhost:8000

# Using Node.js (if you have it)
npx http-server
```

Then open `http://localhost:8000`

## 📁 Project Structure

```
devdate/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # All styles
├── js/
│   ├── config.js          # Firebase & AI configuration
│   ├── firebase.js        # Firebase initialization
│   ├── auth.js            # Authentication logic
│   ├── profile.js         # Profile management
│   ├── swipe.js           # Swipe & matching system
│   ├── chat.js            # Real-time chat
│   ├── ai.js              # Google AI integration
│   └── app.js             # Main app logic
└── README.md
```

## 🎯 How to Use

1. **Sign Up**: Create an account or use OAuth
2. **Onboarding**: Complete your developer profile
3. **Discover**: Swipe right on developers you want to connect with
4. **Match**: When both swipe right, you match!
5. **Chat**: Message your matches in real-time

## 🔐 Security

- Firebase Authentication for user management
- Firestore security rules protect user data
- Storage rules control file uploads
- Input sanitization in chat
- XSS protection

## 🌟 AI Features

The app uses Google AI Studio (Gemini Pro) for:

- **Bio Generation**: AI suggests professional bios based on skills
- **Conversation Starters**: Smart ice-breaker messages
- **Skill Suggestions**: Recommendations for complementary skills
- **Match Insights**: Collaboration ideas for matched users

## 📱 Responsive Design

- Mobile-first approach
- Works on all screen sizes
- Touch-friendly swipe gestures
- Responsive navigation

## 🚧 No Build Tools Required

This project runs directly in the browser - no npm, webpack, or build process needed!

## 📝 License

MIT License - feel free to use for your own projects

## 🤝 Contributing

This is a demo project. Feel free to fork and modify!

## 🐛 Troubleshooting

### Firebase Errors
- Check console for error messages
- Verify Firebase config in `config.js`
- Ensure authentication providers are enabled
- Check security rules are published

### Swipe Not Working
- Clear browser cache
- Check browser console for errors
- Verify Firestore data structure

### Chat Not Loading
- Ensure match exists in Firestore
- Check network tab for Firebase calls
- Verify security rules allow message reads/writes

## 🎨 Customization

- Colors: Edit CSS variables in `css/style.css`
- Features: Modify JavaScript in `js/` folder
- Layout: Update HTML in `index.html`

## 📞 Support

For issues with:
- Firebase: [Firebase Docs](https://firebase.google.com/docs)
- Google AI: [Gemini API Docs](https://ai.google.dev/docs)

---

**Built with ❤️ using vanilla JavaScript - no frameworks, just code!**
