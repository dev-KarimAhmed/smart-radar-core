importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAFT3H05Ncxx_gN-SW58tFyxPhxkW4M_xs",
  authDomain: "studio-5595524581-fad96.firebaseapp.com",
  projectId: "studio-5595524581-fad96",
  storageBucket: "studio-5595524581-fad96.firebasestorage.app",
  messagingSenderId: "593334132398",
  appId: "1:593334132398:web:7f777278267a09a9a0d73f"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SOVEREIGN_FCM_SW] إشارة مستلمة في السبات:', payload);
  if (payload.notification) {
    self.registration.showNotification(payload.notification.title, {
      body: payload.notification.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge.png',
      data: payload.data,
    });
  }
});
