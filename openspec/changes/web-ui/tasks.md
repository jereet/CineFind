## 1. Configuración y motor extendido

- [x] 1.1 Agregar dependencia `express` a `package.json` y el script `npm run server`; verificar que `npm install` ejecuta y el script queda registrado
- [x] 1.2 Extender `src/db.js` a `connect(uri, dbName)` con default `movie_search`; verificar que `npm run verify` sigue pasando (compatibilidad CLI/seed/verify)
- [x] 1.3 Extender `src/search.js` con opciones `{ limit, fields }` en `buildPipeline`/`searchMovies`; verificar que la pipe agrega `$limit` tras `$sort` y proyección extendida sin cambiar el default (`npm run verify` intacto)

## 2. Servidor y API HTTP

- [x] 2.1 Crear `server.js` (Express): servir estáticos de `public/` en `/` y `GET /api/search?q=&limit=`; conectarse a `samples_mflix` y reutilizar `searchMovies` con proyección `_id, title, poster, year, genres` y limit default 50
- [x] 2.2 En `GET /api/search`, si `q` es vacío o solo espacios devolver `{ query, results: [] }` sin ejecutar consulta a la base
- [x] 2.3 Aceptar `limit` como query param (default 50, clamp 1..100) y verificar por HTTP que la respuesta respeta el límite
- [x] 2.4 Verificar la API contra `samples_mflix`: "star" devuelve los campos completos, "titanic" ordena prefijos antes que subcadena interna (ej. "Titanic" antes de "Raise the Titanic"), dos llamadas dan el mismo orden, y un documento sin `poster` devuelve `poster: null`

## 3. Frontend de búsqueda

- [x] 3.1 Crear `public/index.html`, `public/styles.css` y `public/app.js`: input de búsqueda, grilla de tarjetas con poster/título/año/géneros que consulta `/api/search` sin recargar la página
- [x] 3.2 Mostrar placeholder local cuando `poster` es nulo y fallback `onerror` en cada `<img>` para URLs caídas; verificar en navegador con un resultado sin poster
- [x] 3.3 Implementar estados de "cargando" y "sin resultados"; verificar buscando "zzzzzz" y encadenando búsquedas rápidas
- [x] 3.4 Aplicar debounce a la búsqueda y proteger contra respuestas fuera de orden (solo gana la última búsqueda)

## 4. Integración y verificación final

- [x] 4.1 Levantar el servidor y verificar E2E en navegador: abrir `/`, buscar "star" y ver posters, títulos, años, géneros y orden correcto; consulta vacía no genera error
- [x] 4.2 Ejecutar `npm run verify` y confirmar que la capacidad `search` existente no se rompió
- [x] 4.3 Ejecutar `openspec validate` sobre el change `web-ui` y actualizar el README con cómo levantar el servidor y usar la página, reflejando la capacidad `web/search-interface`