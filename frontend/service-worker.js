const CACHE_NAME = "hearthline-pwa-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./login.html",
  "./signup.html",
  "./forgot.html",
  "./reset.html",
  "./create-article.html",
  "./post.html",
  "./theme.css",
  "./index.page.css",
  "./login.page.css",
  "./signup.page.css",
  "./forgot.page.css",
  "./reset.page.css",
  "./create-article.page.css",
  "./post.page.css",
  "./index.page.js",
  "./login.page.js",
  "./signup.page.js",
  "./forgot.page.js",
  "./reset.page.js",
  "./create-article.page.js",
  "./post.page.js",
  "./hearthline-favicon.svg",
  "./app-icon.svg",
  "./manifest.webmanifest",
  "./pwa-register.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match(request).then(match => match || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached =>
      cached ||
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
    )
  );
});
