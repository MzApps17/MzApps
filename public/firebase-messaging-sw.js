importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBlEh0t3iq0GNxQChO-5JbezwKGK4N_q0k",
  authDomain: "mzapps-899ef.firebaseapp.com",
  projectId: "mzapps-899ef",
  storageBucket: "mzapps-899ef.firebasestorage.app",
  messagingSenderId: "695233919091",
  appId: "1:695233919091:web:5b7926b663b5c54ce6d206"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
