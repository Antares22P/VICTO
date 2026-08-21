import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAyDx9ghdJdiPl9fdGiaJSRCyf7lXAVfFE",
  authDomain: "victo-67c8e.firebaseapp.com",
  databaseURL: "https://victo-67c8e-default-rtdb.firebaseio.com",
  projectId: "victo-67c8e",
  storageBucket: "victo-67c8e.firebasestorage.app",
  messagingSenderId: "164933748937",
  appId: "1:164933748937:web:c0df855764c6267ced2518",
  measurementId: "G-DPC5Z32FWQ"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);