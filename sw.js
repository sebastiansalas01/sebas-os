const CACHE = 'sebas-os-v30';
const FILES = ['./', './index.html', './core.js', './planner-core.js', './planner-ui.js', './recap-core.js', './recap-ui.js', './life-core.js', './life-ui.js', './ops-core.js', './ops-ui.js', './closing-core.js', './closing-ui.js', './results-core.js', './results-ui.js', './app.js', './styles.css', './assets/breakfast.webp', './assets/snackam.webp', './assets/lunch.webp', './assets/snackpm.webp', './assets/dinner.webp', './assets/beef.webp', './assets/scene-dawn.webp','./assets/scene-prayer.webp','./assets/scene-training.webp','./assets/scene-reading.webp','./assets/scene-prepare.webp','./assets/scene-focus.webp','./assets/scene-rest.webp', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(FILES.map(async path => {
    const canonical = new URL(path, self.registration.scope);
    const fresh = new URL(canonical); fresh.searchParams.set('sebas_version', CACHE);
    const response = await fetch(fresh, {cache:'no-store'});
    if (!response.ok) throw Error('Unable to refresh app shell');
    await cache.put(canonical, response);
  }))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('sebas-os-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!FILES.some(path => new URL(path, self.registration.scope).pathname === url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request, {ignoreSearch:true})).then(cached => cached || fetch(event.request)));
});

self.addEventListener('push', event => {
  let message={};try{message=event.data?.json()||{}}catch{}
  event.waitUntil(self.registration.showNotification('SEBAS OS', {body:typeof message.body==='string'?message.body:'Tienes una actualización en tus sesiones de hoy.',tag:message.tag||'sebas-session',data:{path:'./?view=impulso'},icon:undefined}));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();const url=new URL('./?view=impulso',self.registration.scope).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{const current=windows.find(w=>w.url.startsWith(self.registration.scope));if(current){await current.navigate(url);return current.focus()}return clients.openWindow(url)}));
});

