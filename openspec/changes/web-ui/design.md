## Context

See `proposal.md` - Why. El proyecto ya tiene un motor de búsqueda (Node.js + driver oficial `mongodb`) en `src/search.js` que cumple la capacidad `search` sobre una pipe de agregación (`$match` regex case-insensitive → score de relevancia por prefijo → `$sort` determinista → proyección `{ _id, title }`). Hoy solo se expone por CLI (`index.js`) contra la base chica `movie_search` (seed de 7 películas). El catálogo real con posters vive en `samples_mflix.movies` (~23.539 documentos con `title`, `poster`, `year`, `genres`, `plot`).

## Goals / Non-Goals

**Goals:**
- Servidor HTTP local que sirva una página de búsqueda y una API JSON consultando `samples_mflix.movies`.
- Reutilizar la semántica y la pipe de agregación existente (subcadena, case-insensitive, prefijo primero, orden determinista).
- No romper el contrato actual: CLI (`npm start`), seed y verify siguen apuntando a `movie_search`.
- Página responsive: resultados acotados y posters con fallback.

**Non-Goals:**
- Autenticación, paginación completa, búsqueda full-text (Atlas Search), ranking avanzado, soporte multi-idioma, deploy a producción ni frameworks de frontend (SPA/SSR).

## Decisions

### D1. Servidor Express con dos rutas
Se agrega `express` (única dependencia nueva) y un `server.js` que expone:
- `GET /` → sirve los estáticos de `public/` (página de búsqueda).
- `GET /api/search?q=<termino>&limit=<n>` → JSON `{ query, results }`.

**Alternativa descartada:** `http` nativo de Node — funcional pero agrega manejo manual de content-type/estáticos y verbosidad que Express elimina; Express es el estándar del curso.

### D2. La API reutiliza el motor de búsqueda con opciones limit/proyección
Se extiende `src/search.js` con opciones opcionales, sin cambiar el comportamiento por defecto:
- `buildPipeline(term, { limit, fields })` — agrega `$limit` después del `$sort` (acota sobre los más relevantes) y permite proyección extendida.
- `searchMovies(query, { limit, fields })` — pasa las opciones a la pipe. Sin opciones, el comportamiento queda idéntico al actual (CLI/verify intactos).

El servidor usa `{ limit, fields: { _id:1, title:1, poster:1, year:1, genres:1 } }`. Los resultados con `poster` nulo llegan como `poster: null`.

**Alternativa descartada:** construir una segunda pipe independiente en el servidor — duplica lógica de escape/score/sort; mantener una sola fuente reduce desvío con la spec de `search`.

### D3. Selección de base por parámetro en `connect`
Se extiende `src/db.js` a `connect(uri, dbName)` con `dbName` por defecto `MONGO_DB` (`movie_search`). El servidor se conecta con `connect(undefined, 'samples_mflix')` y usa la misma colección `movies`. CLI/seed/verify conservan el default y no cambian su comportamiento.

**Alternativa descartada:** setear `process.env.MONGO_DB` en `server.js` antes del `require` — depende del orden de carga de módulos y es frágil.

### D4. Frontend de página única vanilla (HTML/CSS/JS)
En `public/`: input de búsqueda + botón, grilla de tarjetas (`<img>` poster, título, año, géneros), placeholder local para posters faltantes (SVG embebido) y fallback `onerror` en cada `<img>` para URLs caídas. Estados de "cargando" y "sin resultados". Lanzamiento con debounce sobre input/Enter, y protección de respuestas fuera de orden con un token de request (la última búsqueda gana).

## Risks / Trade-offs

- **Regex `.*term.*` sobre 23.539 docs (collection scan)** → el `$limit` posterior al `$sort` acota el resultado final, pero el match recorre la colección; a escala de curso es aceptable (decenas de ms). Si escala, migrar a Atlas Search manteniendo la misma spec.
- **URLs de posters (Amazon/m.media-amazon.com) pueden fallar por hotlink o indisponibilidad** → fallback `onerror` en cada `<img>` hacia el placeholder local; el resultado se muestra igual con título/año/géneros.
- **Términos como "the" generan miles de matches** → el cap de `limit` (default 50) mantiene la respuesta y el render livianos.
- **Resultados sin `poster`** → el API devuelve `poster: null` y la UI lo reemplaza con placeholder (requisito cubierto).
- **Coincidencias de prefijo abundantes** → para términos comunes (p. ej. "star", "dark") hay >50 prefijos alfabéticos, por lo que las subcadenas internas (p. ej. "A Star Is Born") quedan fuera del top 50. Refleja el requisito "prefijo primero" de `search`; la spec de `web/search-interface` verifica el ordenamiento con un término acotado (p. ej. "titanic"). Si en el futuro se quiere surfacing de subcadenas populares, aplicar una combinación de score (relevancia) más balanceada recién cuando la `search` lo defina.

## Migration Plan

No hay migración de datos: el servidor lee `samples_mflix` de solo lectura y no altera documentos. Rollback: detener `server.js`; la CLI, el seed y verify no se ven afectados.

## Open Questions

_None: las decisiones de framework, acotación de resultados, targeting de base y fallback de posters quedan resueltas; no hay incógnitas que cambien spec, enfoque o desglose de tareas._