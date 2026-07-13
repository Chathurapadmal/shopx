import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzS-_Hw4gQfevwz0GHaWga7f-hIGZpa74",
  authDomain: "stuplann.firebaseapp.com",
  databaseURL: "https://stuplann-default-rtdb.firebaseio.com",
  projectId: "stuplann",
  storageBucket: "stuplann.firebasestorage.app",
  messagingSenderId: "538924467456",
  appId: "1:538924467456:web:6f4191cbace83f06fd1fe5",
  measurementId: "G-221FFXCGFZ",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

export const analytics = isSupported().then((yes) => (yes ? getAnalytics(app) : null));
