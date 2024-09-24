import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB0tk8RCrRjjnAoiP1xywQzRqGfxsfGLmk",
  authDomain: "reactchat-d0d36.firebaseapp.com",
  projectId: "reactchat-d0d36",
  storageBucket: "reactchat-d0d36.appspot.com",
  messagingSenderId: "318099347035",
  appId: "1:318099347035:web:3d3037b2affb9a2089517e"
};

const app = initializeApp(firebaseConfig);

export const auth=getAuth(app)
export const db=getFirestore(app)
export const storage=getStorage(app)