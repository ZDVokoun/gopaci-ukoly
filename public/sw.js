function receivePushNotification(event) {
  console.log("[Service Worker] Push Received.");

  const { url, title, body } = event.data.json();

  const options = {
    data: url,
    body: body,
    icon: "/favicon.ico",
    vibrate: [200, 100, 200],
    badge: "/favicon.ico",
    actions: [{ action: "Detail", title: "Více", icon: "https://via.placeholder.com/128/ff0000" }]
  };
  event.waitUntil(self.registration.showNotification(title, options));
}

function openPushNotification(event) {
  console.log("[Service Worker] Notification click Received.", event.notification.data);

  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
}

self.addEventListener("push", receivePushNotification);
self.addEventListener("notificationclick", openPushNotification);
