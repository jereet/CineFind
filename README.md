# Buscador MongoDB

Buscador genérico (tipo Google) por título de películas sobre MongoDB, usando el driver oficial de Node.js, con interfaz web para explorar el catálogo **`samples_mflix`** (posters, año, géneros).

## Requisitos

- Node.js 18+
- MongoDB corriendo localmente (servicio `MongoDB` por defecto en `127.0.0.1:27017`)
- Base `samples_mflix` cargada (se consulta de solo lectura) y base `movie_search` para el seed/CLI/verify

## Esquema de la colección `movies`

| Campo   | Tipo   | Descripción                                        |
| ------- | ------ | -------------------------------------------------- |
| `_id`   | `ObjectId` | Identificador único del documento (auto-generado) |
| `title` | `string` | Título de la película (sujeto a búsqueda)         |

Colección: `movies` dentro de la base `movie_search`.

## Conexión a la instancia

La conexión usa el driver oficial `mongodb`:

```js
const { connect } = require('./src/db');

await connect(); // mongodb://127.0.0.1:27017 -> db movie_search
```

Variables de entorno (opcionales):

- `MONGO_URI` — URI de conexión (por defecto `mongodb://127.0.0.1:27017`)
- `MONGO_DB` — nombre de la base (por defecto `movie_search`)

## Uso

```bash
npm run seed     # puebla la colección movies (base movie_search)
npm start -- "star"   # busca "star" por consola (base movie_search)
npm run server   # levanta la web sobre samples_mflix → http://localhost:3000
npm run verify   # ejecuta todas las verificaciones de la spec (busqueda)
```

## Interfaz web (capacidad `web/search-interface`)

El servidor consulta el catálogo real `samples_mflix.movies` y expone:

- `GET /` — página de búsqueda con resultados en grilla (poster, título, año, géneros). Poster nulo → placeholder.
- `GET /api/search?q=<termino>&limit=<n>` — API JSON. Cada resultado expone `_id`, `title`, `poster`, `year` y `genres`; usa la misma semántica de `search` (subcadena, case-insensitive, prefijo primero). `q` vacío → `results: []` sin tocar la base. `limit` default 50, máximo 100.

```bash
npm run server   # escucha en http://localhost:3000
# luego abrila en el navegador y buscá, p. ej. "star" o "titanic"
```

## Módulos

- `src/db.js` — conexión y acceso a la colección (`connect(uri, dbName)` permite apuntar a `samples_mflix`).
- `src/search.js` — búsqueda genérica: validación, escape de regex, pipeline de agregación con relevancia por prefijo y opciones `limit`/`fields`.
- `scripts/seed.js` — carga de datos de ejemplo.
- `test/verify.js` — verificación de los escenarios definidos en `openspec/changes/generic-mongodb-search/specs/search/spec.md`.
- `server.js` + `public/` — servidor Express y frontend de la capa `web/search-interface`.