self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("fetch", e => {
  // base vacía por ahora
});


// =======================
// PUSH RECEIVER
// =======================
self.addEventListener("push", event => {
  if (!event.data) return;

  const data = event.data.json();

  const title = data.title || "Legends Bot";
  const options = {
    body: data.body || "Nueva notificación",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    data: data.url || "/"
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      if (list.length > 0) {
        list[0].focus();
      } else {
        clients.openWindow("/");
      }
    })
  );
});
