import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC7mRbQmVxcDv5vzu6Lcy-CbZVHTs6rCVk",
  authDomain: "sales-tracker-12781.firebaseapp.com",
  projectId: "sales-tracker-12781",
  storageBucket: "sales-tracker-12781.appspot.com", // ✅ 正しい形式
  messagingSenderId: "299320885074",
  appId: "1:299320885074:web:15f3a601c789edce9e848b",
  measurementId: "G-2DKBXX9GH8"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
