function receivePushNotification(event) {
  console.log("[Service Worker] Push Received.");

  const { url, title, body } = event.data.json();

  const options = {
    data: url,
    body: body,
    icon: "/favicon.ico",
    vibrate: [200, 100, 200],
    actions: [{ action: "Detail", title: "Více" }]
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
