// Firebase Configuration Template v8
// Copia questo file come firebase-config.js e sostituisci i valori con quelli del tuo progetto
// IMPORTANTE: Non committare mai firebase-config.js con le tue chiavi reali!

// Your web app's Firebase configuration
// Sostituisci questi placeholder con i tuoi valori reali
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();

console.log('🔥 Firebase initialized successfully!');

// Export per utilizzo in altri file
window.auth = auth;
window.db = db;
window.analytics = analytics;
