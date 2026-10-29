const CACHE='gymspot-shell-v4';
const SHELL=['/','/index.html','/app.js','/style.css','/mobile.css','/mobile.js','/manifest.webmanifest','/assets/home.svg','/assets/discover.svg','/assets/chat.svg','/assets/profile.svg','/assets/icon-192.png','/assets/icon-512.png','/assets/apple-touch-icon.png','/node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2','/node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2','/node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2'];
SHELL.push('/health.js','/health-core.js','/dropdowns.js','/dropdowns.css','/assets/vendor/health-runtime.js');
SHELL.push('/moderation.js','/maps.js','/chat-client.js');
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('spotter-shell-')||k.startsWith('gymspot-shell-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(!SHELL.includes(url.pathname)&&e.request.mode!=='navigate')return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const clone=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,clone)));}return r;}).catch(async()=>await caches.match(e.request)||(e.request.mode==='navigate'?await caches.match('/index.html'):Response.error())));
});
