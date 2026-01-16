// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration (loaded from Vite env variables)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCInKL8O00bvkHLmc889YdDy_AF5IJ2WkI",
  authDomain: "document-preecha.firebaseapp.com",
  projectId: "document-preecha",
  storageBucket: "document-preecha.firebasestorage.app",
  messagingSenderId: "671044536616",
  appId: "1:671044536616:web:6c3b1e46faeabc6802681d",
  measurementId: "G-2NM2R5XTD3"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
