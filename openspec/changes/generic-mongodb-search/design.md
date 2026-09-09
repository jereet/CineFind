## Context

Proyecto greenfield sin código de aplicación. La única fuente de motivación es la propuesta (ver `proposal.md` → Why) y los requisitos de comportamiento en `specs/search/spec.md`. El proyecto define solamente la especificación (stack-agnóstica), por lo que este diseño describe el enfoque a nivel del motor de datos (MongoDB) sin comprometer un lenguaje, driver ni forma de exponer la búsqueda (CLI, biblioteca o API). La colección de datos asumida contiene documentos de películas con un campo `title` de tipo string y `_id` como identificador.

## Goals / Non-Goals

**Goals:**
- Búsqueda por subcadena tipo Google sobre `title`, case-insensitive, con orden de relevancia (prefijo primero).
- Mantener el diseño expresado en términos de MongoDB para que cualquier stack posterior pueda implementarlo.
- Resultados deterministas y sin impacto en toda la colección ante consultas vacías.

**Non-Goals:**
- Fijar lenguaje de programación, framework, driver ni interfaz de exposición.
- Búsqueda por otros campos (género, elenco, descripción) ni búsqueda full-text con stemming/sinónimos (analizadores).
- Paginación, ranking avanzado (Atlas Search `$searchMeta` con scoring complejo) ni tolerancia a errores ortográficos.

## Decisions

### D1. Coincidencia por subcadena usando expresiones regulares ancladas y literalmente escapadas
Se implementa la coincidencia parcial con un patrón de expresión regular sobre MongoDB ejecutada en `title` con `$regex` y `$options: "i"` (case-insensitive). El texto de la consulta SHALL escaparse antes de construir el patrón de modo que los caracteres especiales (`.`, `*`, `$`, etc.) se traten literalmente (requisito "Caracteres especiales tratados literalmente").

- **Patrón base (substring):** `.*<escapedQuery>.*` — coincide en cualquier posición.
- **Patrón prefijo:** `^<escapedQuery>.*` — detecta si el título comienza con el término.
- **Alternativa descartada:** index de texto (`text index`) con `$text` — no admite búsqueda por subcadena arbitraria en cualquier posición ni patrones "t → todas las t"; queda reservado si en el futuro se busca full-text.
- **Alternativa descartada (Atlas Search):** operator `$search` — brinda más potencia pero requiere Atlas y cluster; inaceptable como requisito base en un proyecto que debe correr contra MongoDB autónomo.

### D2. Ordenamiento por relevancia con scoring en pipeline de agregación
La relevancia se computa en una etapa del pipeline (no en el driver): cada documento recibe un score según su tipo de coincidencia y posición del match; luego `$sort` por score descendente y por `title`/`_id` ascendente como tiebreak determinista (requisito "Orden determinista").

- **Score prefijo (mayor):** el `title` comienza con el término → score alto.
- **Score subcadena interna (menor):** el término ocurre en otra posición → score bajo.
- **Alternativa descartada:** dos consultas separadas y concatenar — duplica I/O y exige deduplicar; el pipeline lo resuelve en una sola pasada.

### D3. Consumo directo del pipeline controlado en una sola operación
Toda la lógica (match + score + sort + proyección) se ejecuta con un único `db.movies.aggregate(...)`. Los resultados se proyectan a `{ _id, title }` cumpliendo "Resultado provee identificador y título", evitando devolver campos internos innecesarios.

- **Alternativa descartada:** filtrar en aplicación y luego consultar — traslada lógica y agrega latencia; la proyección en servidor mantiene la carga mínima.

### D4. Validación previa de la consulta
Antes de construir el pipeline, la capa de interfaz valida la consulta: si está vacía o solo contiene espacios (y se normaliza a cero caracteres significativos), se devuelve lista vacía sin tocar la base (requisito "Consulta vacía o sin caracteres significativos"). Esta validación es responsabilidad de cualquier implementación concreta y queda reflejada en `tasks.md`.

## Risks / Trade-offs

- **Subcadena sin índice utilizable** → la coincidencia `.*termino.*` recorre la colección (collection scan) y degrada con volúmenes grandes. Mitigación aceptable para el alcance actual (colección de películas del curso); si escala, migrar a Atlas Search (`$search` con tokenización) manteniendo la misma spec.
- **Textos en distintos idiomas / acentos** → `$options: "i"` no normaliza acentos ("telefono" no matchea "teléfono"). Mitigación: no exigido por la spec; anotar como posible requisito futuro.
- **Render de `$regex` en frameworks** → los drivers/shells modernos usan `$regex` en objeto en vez del operador con `//` sintaxis; riesgo de escape incorrecto del término. Mitigación: escapar siempre el literal y construir con `$regex` explícito.

## Migration Plan

No aplicable en la fase de especificación: no existe base de código que migrar. Al implementar, se sumará un index de soporte y scripts de datos (seed) para la colección `movies` con campo `title`; el patrón de búsqueda no altera datos existentes.

## Open Questions

_None: las decisiones de búsqueda (subcadena, prefijo, relevancia) están cubiertas por la spec y el diseño; cualquier detalle restante (lenguaje, interfaz) corresponde a una fase posterior que aún no forma parte de la especificación._