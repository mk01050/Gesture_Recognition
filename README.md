# Real-Time Gesture Recognition Video Call App

A modern, AI-powered video calling application that brings real-time hand gesture recognition into your browser. Built with React, TensorFlow.js, and Firebase, this project demonstrates how machine learning and web technologies can create seamless, interactive communication experiences.

---

## 🚀 Features

- **Real-Time Video Calling:** Peer-to-peer video calls using WebRTC.
- **In-Browser Machine Learning:** Hand gesture recognition powered by TensorFlow.js and Fingerpose.
- **Gesture Debouncing & Stacking:** Intelligent gesture collection using a debouncer and stack for robust recognition.
- **Privacy First:** All ML inference runs locally in your browser—no video data leaves your device.
- **Firebase Signaling:** Uses Firebase Firestore for secure, real-time signaling between peers.
- **Modern UI:** Built with React for a responsive and interactive user experience.

---

## 🖥️ How It Works

1. **Video Stream:**  
   Users join a video call using their webcam. Video is streamed directly between peers using WebRTC.

2. **Hand Detection & Gesture Recognition:**  
   - The app runs a TensorFlow.js handpose model in the browser to detect hand landmarks from the webcam feed.
   - These landmarks are passed to a gesture estimator (Fingerpose + custom gestures) to classify hand signs (e.g., thumbs up, victory, OK sign).

3. **Signaling & Connection:**  
   - Firebase Firestore is used for exchanging connection info (signaling) between peers.
   - No video or gesture data is stored in the cloud.

5. **Interactive UI:**  
   - Recognized gestures are displayed in the UI and can be used to trigger actions or enhance communication.

---

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/gesture-video-call.git
   cd gesture-video-call
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore Database.
   - Copy your Firebase config and add it to a `.env` file:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
     ```

4. **Start the app:**
   ```bash
   npm run dev
   ```

5. **Open in your browser:**  
   Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

---

## 🧠 Technologies Used

- [React](https://reactjs.org/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Fingerpose](https://github.com/andypotato/fingerpose)
- [Firebase](https://firebase.google.com/)
- [WebRTC](https://webrtc.org/)

---

## 📂 Project Structure

```
src/
├── App.jsx                # Main React component
├── firebaseConfig.js      # Firebase setup
├── components/            # UI components
├── hooks/                 # Custom React hooks (e.g., gesture stack)
├── assets/                # Images, icons, etc.
└── ...                    # Other files
```

---


