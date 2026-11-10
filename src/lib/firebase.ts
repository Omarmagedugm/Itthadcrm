import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// ITTHAD CRM must use its own Firebase project; never reuse the channel or portfolio.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
const otherProjectIds = new Set([
  'gen-lang-client-0026252792', // Alexandria Channel
  'megaportfolio-d9e51', // Separate portfolio
])
export const projectConflict = otherProjectIds.has(config.projectId)
export const firebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId && !projectConflict
)
export const firebaseApp: FirebaseApp | null = firebaseConfigured ? initializeApp(config) : null
export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null
