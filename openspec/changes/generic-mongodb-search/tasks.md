## 1. Preparación del entorno de datos

- [x] 1.1 Definir y documentar el esquema de la colección `movies` (campo `title` de tipo string, `_id` único) y los pasos para conectarse a la instancia de MongoDB
- [x] 1.2 Crear un script de seed que inserte un conjunto representativo de películas (incluyendo títulos con prefijos/subcadenas repetibles: "Star Wars", "A Star Is Born", "The Dark Knight", "Dark Shadows", "Titanic", "Interstellar", "Fantastic") y verificar que la colección quede poblada consultando el conteo
- [x] 1.3 Verificar que la colección `movies` está accesible desde el entorno de ejecución elegido (conexión y listing simple de documentos)

## 2. Conservación y validación de la consulta

- [x] 2.1 Implementar la normalización/validación de la consulta: si queda vacía o contiene solo espacios y sin caracteres significativos, retornar lista vacía sin ejecutar consulta a la base
- [x] 2.2 Implementar el escape de caracteres especiales de expresiones regulares (`.`, `*`, `$`, `[`, `]`, `{`, `}`, `(`, `)`, `^`, `|`, `+`, `?`, `\`) dentro del término de búsqueda y verificar que buscar "t*" devuelve únicamente títulos con "t*" literal (posiblemente vacío)

## 3. Construcción de la búsqueda por subcadena

- [x] 3.1 Construir el filtro `$regex` con case-insensitive (`$options: "i"`) sobre `title` que coincida con el término en cualquier posición (patrón `.*<escape(consulta)>.*`) y verificar que buscar "t" devuelve todas las películas cuyo título contenga "t"
- [x] 3.2 Verificar escenarios de subcadena: "dark" matchea "The Dark Knight" y "Dark Shadows" (posición media/inicio), y "tic" matchea títulos que terminan en "tic". Verificar que "zzzzzz" devuelve 0 resultados
- [x] 3.3 Verificar que la búsqueda sin distinguir mayúsculas produce los mismos resultados para "DARK", "dark" y "Dark" (incluyendo títulos con mayúsculas mezcladas)

## 4. Relevancia y ordenamiento

- [x] 4.1 Implementar el patrón/marcador de prefijo (`^<escape(consulta)>.*`) que identifique títulos que comienzan con el término y asignar score mayor que el de subcadena interna
- [x] 4.2 Implementar `$sort` por score descendente con tiebreak determinista (por ejemplo `title`/`_id` ascendente) y verificar que buscar "star" lista "Star Wars" antes que "A Star Is Born"
- [x] 4.3 Verificar que ejecutar la misma búsqueda dos veces devuelve el mismo orden de resultados

## 5. Formato de los resultados

- [x] 5.1 Agregar una etapa de proyección que exponga por cada resultado el `_id` y el campo `title` (y no campos internos innecesarios) y verificar que la respuesta incluye ambos atributos
- [x] 5.2 Asegurar que la operación de búsqueda se ejecute en una única operación de agregación sobre la colección y verificar que la traza de la consulta no ejecute búsquedas adicionales

## 6. Integración y verificación final

- [x] 6.1 Ejecutar las verificaciones de todos los escenarios de la spec (`openspec/specs/search/spec.md`) contra la colección poblada y confirmar que cada una produce el comportamiento esperado
- [x] 6.2 Ejecutar `openspec validate` sobre el change y actualizar documentación del proyecto (si existe) reflejando la capacidad `search` disponible