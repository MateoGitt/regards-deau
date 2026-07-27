// Service worker dédié à /regards-deau/fiches/ uniquement.
// Son "scope" se limite à ce sous-dossier : il n'a aucun effet sur le
// système de connexion (index.html) qui vit à la racine du repo.
//
// ⚠️ Incrémenter CACHE_NAME à chaque changement important du fichier
// index.html si tu veux forcer un nettoyage propre de l'ancien cache
// (ce n'est pas obligatoire pour voir les mises à jour : la stratégie
// "réseau prioritaire" ci-dessous s'en charge déjà tant que l'iPad a du
// réseau au moment de l'ouverture).
const CACHE_NAME = 'fiches-livraison-cache-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {
            // une ressource externe indisponible ne doit pas bloquer
            // l'installation du service worker
          })
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Navigation (ouverture/rechargement de la page) : réseau d'abord,
  // secours sur la page mise en cache si hors connexion.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Autres ressources (polices, jsPDF...) : même logique, réseau
  // d'abord pour rester à jour, cache en secours si hors ligne.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
