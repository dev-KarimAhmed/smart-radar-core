import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// التهيئة السيادية لقاعدة البيانات للاتصال السحابي الحي (Live Cloud)
// تطبيق بروتوكول SC55: استخدام Long Polling لضمان العبور رغماً عن أي حجب محلي
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

const auth = getAuth(app);

export { db, app, auth };

