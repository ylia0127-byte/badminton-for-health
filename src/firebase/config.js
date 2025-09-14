import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDA0vxcYJjwYQRjPxwvnzVFSCL6U47Zfj4',
  authDomain: 'ycl-badminton-for-health.firebaseapp.com',
  projectId: 'ycl-badminton-for-health',
  storageBucket: 'ycl-badminton-for-health.firebasestorage.app',
  messagingSenderId: '3287198331',
  appId: '1:3287198331:web:f9d8b5d85cc13cc2b990de',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }
