
const CACHE_NAME = "mathgallery-v1";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icon.svg"
];

// Instalar y guardar los archivos del juego
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ARCHIVOS);
        })
    );

    self.skipWaiting();
});

// Activar la nueva versión y eliminar cachés antiguos
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((nombres) => {
            return Promise.all(
                nombres
                    .filter((nombre) => nombre !== CACHE_NAME)
                    .map((nombre) => caches.delete(nombre))
            );
        })
    );

    self.clients.claim();
});

// Buscar primero en caché para permitir el uso sin conexión
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // No interceptar solicitudes de otros sitios
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then((respuestaGuardada) => {
            if (respuestaGuardada) {
                return respuestaGuardada;
            }

            return fetch(event.request).then((respuesta) => {
                if (respuesta.ok) {
                    const copia = respuesta.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, copia);
                    });
                }

                return respuesta;
            });
        }).catch(() => {
            if (event.request.mode === "navigate") {
                return caches.match("./index.html");
            }
        })
    );
});
