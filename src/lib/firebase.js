import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAw8DASdeVpRM-ZWt0Prfg0sFgPv5O2wnk",
  authDomain: "budgetr-be0cb.firebaseapp.com",
  projectId: "budgetr-be0cb",
  storageBucket: "budgetr-be0cb.firebasestorage.app",
  messagingSenderId: "675436158540",
  appId: "1:675436158540:web:2c61d67717db7229895ee9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
