// Firebase Configuration
// Sostituisci questi valori con quelli del tuo progetto Firebase
const firebaseConfig = {
  apiKey: "YAIzaSyBys1J3Ac2grNDOyRSU_D9uYdiqx7HUGTQ",
  authDomain: "architech-project-9b91e.firebaseapp.com",
  projectId: "architech-project-9b91e",
  storageBucket: "architech-project-9b91e.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = firebase.auth();

// Initialize Firestore
const db = firebase.firestore();

// Export per utilizzo in altri file
window.auth = auth;
window.db = db;
