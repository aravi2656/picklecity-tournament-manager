import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCEu7KWOsn1yvZ5lch0OkvJoDWwJFPjWcc",
  authDomain: "kpl-tournament-manager.firebaseapp.com",
  projectId: "kpl-tournament-manager",
  storageBucket: "kpl-tournament-manager.firebasestorage.app",
  messagingSenderId: "101022353099",
  appId: "1:101022353099:web:9ed738d39853af8f1cbd4e"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const firebaseConfigured = true
