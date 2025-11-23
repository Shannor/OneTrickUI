import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA6SF9UbC3df_PWgERiwrfzOF2h3tJDXe8',
  authDomain: 'gruntt-destiny.firebaseapp.com',
  projectId: 'gruntt-destiny',
  storageBucket: 'gruntt-destiny.firebasestorage.app',
  messagingSenderId: '63827765203',
  appId: '1:63827765203:web:7bd098550dcb2140d6f126',
  measurementId: 'G-EQN0Y59J6B',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
