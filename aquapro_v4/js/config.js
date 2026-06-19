// ═══════════════════════════════════════════════════════════
// CONFIGURATION FIREBASE
// Remplacez ces valeurs par celles de votre projet Firebase
// ═══════════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Mode démo automatique si Firebase non configuré
const DEMO_MODE = FIREBASE_CONFIG.apiKey === "VOTRE_API_KEY";

if (!DEMO_MODE) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

window.DEMO_MODE = DEMO_MODE;
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
