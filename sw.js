const CACHE = 'sebas-os-v11';
const FILES = ['./', './index.html', './core.js', './planner-core.js', './planner-ui.js', './app.js', './styles.css', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('sebas-os-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!FILES.some(path => new URL(path, self.registration.scope).pathname === url.pathname)) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});

self.addEventListener('push', event => {
  let message={};try{message=event.data?.json()||{}}catch{}
  event.waitUntil(self.registration.showNotification('SEBAS OS', {body:typeof message.body==='string'?message.body:'Tienes una actualización en tus sesiones de hoy.',tag:message.tag||'sebas-session',data:{path:'./?view=impulso'},icon:undefined}));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();const url=new URL('./?view=impulso',self.registration.scope).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{const current=windows.find(w=>w.url.startsWith(self.registration.scope));if(current){await current.navigate(url);return current.focus()}return clients.openWindow(url)}));
});
