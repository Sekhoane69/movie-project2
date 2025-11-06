// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBM8xDARUBYRUmzH6ed1wttzdQd5lr2RWg",
  authDomain: "manlike-ecb0c.firebaseapp.com",
  projectId: "manlike-ecb0c",
  storageBucket: "manlike-ecb0c.firebasestorage.app",
  messagingSenderId: "1009702417675",
  appId: "1:1009702417675:web:3ce41ef06e38d8c0731e0e",
  measurementId: "G-XVLC7KJZ09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export { app, analytics };