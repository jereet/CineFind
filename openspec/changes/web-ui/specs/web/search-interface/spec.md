## Purpose

Proporciona una interfaz web para la búsqueda de películas: un servidor HTTP sirve una página en la que el usuario escribe un término, consulta el catálogo real (`samples_mflix.movies`) y ve los resultados con poster, título, año y géneros.

## ADDED Requirements

### Requirement: Página de búsqueda servida por HTTP
El sistema SHALL servir una página web de búsqueda a través de HTTP que permita escribir un término de búsqueda y visualizar los resultados en la misma página, con un input de búsqueda y un área de resultados.

#### Scenario: Acceso a la página
- **WHEN** el usuario accede a la raíz del servidor (`/`)
- **THEN** el sistema devuelve una página HTML con un campo de búsqueda y un área de resultados vacía

#### Scenario: Buscar desde la página
- **WHEN** el usuario escribe "star" y envía la búsqueda
- **THEN** la página muestra los resultados de la búsqueda sin recargar la página completa

### Requirement: API de búsqueda JSON
El sistema SHALL exponer un endpoint HTTP `GET /api/search` que reciba el término de búsqueda en el parámetro `q` y devuelva una respuesta JSON con la lista de resultados. Cada resultado SHALL incluir el identificador único (`_id`), el título (`title`), el URL de poster (`poster`), el año (`year`) y los géneros (`genres`). La coincidencia SHALL seguir la semántica de la capacidad `search`: parcial, case-insensitive, con coincidencias de prefijo ordenadas antes que las subcadenas internas y orden determinista.

#### Scenario: Respuesta con resultados y campos completos
- **WHEN** el usuario consulta `/api/search?q=star`
- **THEN** la respuesta es JSON con `results` donde cada elemento expone `_id`, `title`, `poster`, `year` y `genres`

#### Scenario: Prefijo antes que subcadena interna
- **WHEN** el usuario consulta `/api/search?q=titanic`
- **THEN** al menos un título que comienza con "titanic" (por ejemplo "Titanic" o "Titanic Town") aparece antes que uno que lo contiene internamente (por ejemplo "Raise the Titanic")

#### Scenario: orden determinista
- **WHEN** el usuario consulta `/api/search?q=star` dos veces
- **THEN** ambas respuestas devuelven los resultados en el mismo orden

#### Scenario: documento sin poster
- **WHEN** un resultado no tiene campo `poster`
- **THEN** la respuesta incluye ese resultado con `poster` nulo y el resto de sus campos

### Requirement: Consulta vacía o sin caracteres significativos
El sistema SHALL devolver una lista vacía de resultados cuando `q` está vacío o contiene solo espacios, sin ejecutar una búsqueda en la base de datos.

#### Scenario: Consulta vacía
- **WHEN** el usuario consulta `/api/search?q=` o `/api/search?q=%20%20%20`
- **THEN** la respuesta JSON contiene `results: []`

### Requirement: Resultados acotados por la API
El sistema SHALL limitar la cantidad máxima de resultados devueltos por la API para mantener la respuesta responsiva sobre el catálogo completo, ordenando primero por relevancia antes de aplicar el límite.

#### Scenario: límite por defecto
- **WHEN** el usuario consulta `/api/search?q=the` sin especificar límite
- **THEN** la respuesta contiene a lo sumo 50 resultados y son los más relevantes del catálogo

#### Scenario: límite configurable
- **WHEN** el usuario consulta `/api/search?q=the&limit=10`
- **THEN** la respuesta contiene a lo sumo 10 resultados

### Requirement: Visualización de resultados con poster
El sistema SHALL renderizar cada resultado en la página mostrando su imagen de poster, el título, el año y los géneros. Cuando un resultado no tiene poster, SHALL mostrarse una imagen placeholder en su lugar, manteniendo el resto de la información.

#### Scenario: resultado con poster
- **WHEN** la búsqueda devuelve una película con campo `poster` definido
- **THEN** la página muestra la imagen del poster junto al título, año y géneros

#### Scenario: resultado sin poster
- **WHEN** la búsqueda devuelve una película sin campo `poster`
- **THEN** la página muestra una imagen placeholder en lugar del poster, con título, año y géneros

### Requirement: Estados de la interfaz de resultados
El sistema SHALL mostrar en la página un estado de "sin resultados" cuando la búsqueda devuelve una lista vacía, y un estado de carga mientras la búsqueda está en curso, sin romper la interfaz.

#### Scenario: sin resultados
- **WHEN** el usuario busca "zzzzzz" desde la página
- **THEN** la página muestra un mensaje de que no se encontraron resultados

#### Scenario: búsqueda en curso
- **WHEN** el usuario envía una búsqueda mientras la anterior está en curso
- **THEN** la página reemplaza el contenido de resultados y muestra un indicador de carga