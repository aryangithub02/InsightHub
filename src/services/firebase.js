import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD0ez39Pk1aDWsPDCx3oncypU6mXjOGeSc",
    authDomain: "my-crud-app-4fe35.firebaseapp.com",
    projectId: "my-crud-app-4fe35",
    storageBucket: "my-crud-app-4fe35.firebasestorage.app",
    messagingSenderId: "550263873994",
    appId: "1:550263873994:web:3ae9d23c21d2f544a86f33"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app,db };
