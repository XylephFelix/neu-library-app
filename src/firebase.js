import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
   apiKey: "AIzaSyBKXw4QcycQQD60czhWTlkGfif9nFi6YAo",
  authDomain: "neu-library-app-d3684.firebaseapp.com",
  projectId: "neu-library-app-d3684",
  storageBucket: "neu-library-app-d3684.firebasestorage.app",
  messagingSenderId: "211135152127",
  appId: "1:211135152127:web:9dfad0ef57bb76a230f1ca",
  measurementId: "G-GJWDLZGSKV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);