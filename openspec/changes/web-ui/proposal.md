## Why

El buscador de películas solo se puede usar desde consola (CLI). El usuario quiere interactuar con el catálogo real (`samples_mflix.movies`, ~23.500 películas con `poster`, `year`, `genres`, `plot`) desde un navegador: escribir un término, ver resultados con su poster e información básica, servidos por un servidor HTTP local.

## What Changes

- Nuevo **servidor HTTP** (Express) que expone dos rutas:
  - `GET /` — página web de búsqueda (HTML/CSS/JS estáticos).
  - `GET /api/search?q=<termino>&limit=<n>` — API JSON que busca sobre `samples_mflix.movies`.
- La búsqueda de la API reutiliza el motor existente (`src/search.js`): coincidencia parcial case-insensitive sobre `title`, relevancia con prefijo primero y orden determinista.
- Cada resultado expone `_id`, `title`, `poster`, `year` y `genres` para poder mostrar el poster en la página.
- La página muestra los resultados en una grilla con poster, título, año y géneros; usa una imagen placeholder cuando un documento no tiene `poster`.
- La API acota la cantidad de resultados (default 50, configurable vía `limit`) para mantener la página responsive sobre el dataset real.
- Documentación (README) actualizada con cómo levantar el servidor y usar la página.
- **Sin cambios** sobre la especificación de búsqueda existente (`search`): el motor y sus escenarios se mantienen.

## Capabilities

### New Capabilities
- `web/search-interface`: Interfaz web de búsqueda servida por un servidor HTTP que consulta el catálogo real de películas (`samples_mflix.movies`) y muestra resultados con poster, título, año y géneros.

### Modified Capabilities
- `search`: no se modifica ningún requisito de comportamiento; la web consume la capacidad existente. (Sin delta spec para `search`.)

## Impact

- **Código**: se crean `server.js` (servidor Express), `public/index.html` + `public/styles.css` + `public/app.js` (frontend); se extiende la configuración de `src/db.js` para poder apuntar a `samples_mflix` sin romper CLI/seed/verify actuales.
- **Dependencias**: se agrega `express`.
- **Datos**: el servidor lee la base real `samples_mflix` (colección `movies`); la base `movie_search` del seed actual queda intacta.
- **Sistemas**: MongoDB local existente (127.0.0.1:27017), Node.js 18+.