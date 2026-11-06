import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCEu7KWOsn1yvZ5lch0OkvJoDWwJFPjWcc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'kpl-tournament-manager.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kpl-tournament-manager',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'kpl-tournament-manager.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '101022353099',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:022353099:web:9ed738d39853af8f1cbd4e'
}

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
)

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
