import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
  throw new Error('Missing FIREBASE_ADMIN_PROJECT_ID environment variable');
}
if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
  throw new Error('Missing FIREBASE_ADMIN_CLIENT_EMAIL environment variable');
}
if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  throw new Error('Missing FIREBASE_ADMIN_PRIVATE_KEY environment variable');
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
// Firebase Storage bucket name from Firebase Console: gs://snipr-a4b1e.firebasestorage.app
const bucketName = process.env.FIREBASE_ADMIN_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

console.log('Initializing Firebase Admin with bucket:', bucketName);

const firebaseAdminConfig = {
  credential: cert({
    projectId: projectId,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    // Handle private key with or without \n characters
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  storageBucket: bucketName
};

// Initialize Firebase Admin if it hasn't been initialized
const apps = getApps();
const app = apps.length === 0 ? initializeApp(firebaseAdminConfig) : apps[0];

// Export admin instances
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
export const storageBucketName = bucketName; 