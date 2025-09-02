import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⬇️ Side-effect import: ensures the Auth component registers
import "firebase/auth";

import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyBZBoJag83L5uMAUuMARZqphUyaFG-ePhA",
  authDomain: "homeday-7b571.firebaseapp.com",
  projectId: "homeday-7b571",
  storageBucket: "homeday-7b571.firebasestorage.app",
  messagingSenderId: "616268227395",
  appId: "1:616268227395:web:d7122f04464cecb81605f6",
  measurementId: "G-6HPQ8RHVCD",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);


// Native: initialize with AsyncStorage persistence.
// If Auth is already initialized (fast refresh), fall back to getAuth.
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

export { auth };
export const db = getFirestore(app);