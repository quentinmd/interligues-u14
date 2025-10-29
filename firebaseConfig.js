// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjIQvTpQwo-CZUWDqsu84s1P0DT--kIA8",
  authDomain: "interligues-u14-v2.firebaseapp.com",
  projectId: "interligues-u14-v2",
  storageBucket: "interligues-u14-v2.firebasestorage.app",
  messagingSenderId: "683776458153",
  appId: "1:683776458153:web:93e97983e74d0f69ec98b8"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Obtenir référence à Firestore
const db = getFirestore(app);

export { app, db };
