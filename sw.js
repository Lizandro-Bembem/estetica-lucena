/* =========================================================
   Estética Lucena — Service Worker (PWA)
   - Páginas, CSS e JS: busca na internet primeiro (sempre atualizado)
     e usa a cópia salva quando estiver sem conexão.
   - Fotos, ícones e fontes: usa a cópia salva (rápido) e atualiza por trás.
   IMPORTANTE: ao mudar a lista ESSENCIAIS, aumente o número da VERSAO.
   ========================================================= */
const VERSAO = 'lucena-v2';
const CACHE_SITE = `${VERSAO}-site`;
const CACHE_MIDIA = `${VERSAO}-midia`;

const ESSENCIAIS = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'auth.js',
    'favicon.svg',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/apple-touch-icon.png',
];

const FONTES = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_SITE)
            .then(cache => cache.addAll(ESSENCIAIS.map(u => new Request(u, { cache: 'reload' }))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSAO)).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Guarda só respostas válidas (nunca erros 404/500)
function guardar(cacheName, request, response) {
    if (response && (response.ok || response.type === 'opaque')) {
        const copia = response.clone();
        caches.open(cacheName).then(c => c.put(request, copia)).catch(() => {});
    }
    return response;
}

// Internet primeiro, cópia salva se estiver offline
async function redePrimeiro(request) {
    try {
        return guardar(CACHE_SITE, request, await fetch(request));
    } catch (erro) {
        const salvo = await caches.match(request, { ignoreSearch: true });
        if (salvo) return salvo;
        if (request.mode === 'navigate') {
            const inicio = await caches.match('index.html') || await caches.match('./');
            if (inicio) return inicio;
        }
        throw erro;
    }
}

// Cópia salva primeiro, atualiza em segundo plano
async function salvoPrimeiro(request) {
    const salvo = await caches.match(request);
    const daRede = fetch(request).then(r => guardar(CACHE_MIDIA, request, r)).catch(() => null);
    if (salvo) return salvo;
    const r = await daRede;
    if (r) return r;
    return new Response('', { status: 504, statusText: 'Sem conexão' });
}

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return; // cadastro, login etc. nunca passam pelo cache

    const url = new URL(request.url);
    const mesmoSite = url.origin === self.location.origin;

    if (mesmoSite) {
        if (/\/api\//.test(url.pathname)) return; // respostas do servidor nunca ficam salvas
        const midia = request.destination === 'image' || /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname);
        event.respondWith(midia ? salvoPrimeiro(request) : redePrimeiro(request));
        return;
    }
    if (FONTES.includes(url.hostname)) {
        event.respondWith(salvoPrimeiro(request));
    }
    // demais endereços externos (mapa, Instagram, WhatsApp) seguem direto pela internet
});
