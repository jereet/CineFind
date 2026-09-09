## Purpose

Define cómo un buscador genérico (tipo Google) recupera películas por su título en MongoDB: coincidencia parcial y flexible, sin exigir exactitud ni orden rígido.

## ADDED Requirements

### Requirement: Búsqueda por subcadena en el título
El sistema SHALL devolver todas las películas cuyo campo `title` contenga el término de búsqueda como subcadena, en cualquier posición del título. El término de búsqueda que el usuario provee como consulta textual SHALL ser considerado el único término de búsqueda para esta coincidencia.

#### Scenario: Término de una letra
- **WHEN** el usuario busca "t"
- **THEN** el sistema devuelve todas las películas cuyo título contiene la letra "t" en cualquier posición

#### Scenario: Subcadena en el medio del título
- **WHEN** el usuario busca "dark"
- **THEN** el sistema devuelve películas como "The Dark Knight" y "Dark Shadows"

#### Scenario: Solo termina en subcadena al final
- **WHEN** el usuario busca "tic"
- **THEN** el sistema devuelve títulos que terminan en "tic", como "Fantastic", y no exige que el título comience con "tic"

#### Scenario: Sin coincidencias
- **WHEN** el usuario busca "zzzzzz"
- **THEN** el sistema devuelve una lista vacía de resultados

### Requirement: Búsqueda sin distinguir mayúsculas y minúsculas
El sistema SHALL tratar la consulta sin distinguir mayúsculas ni minúsculas, de modo que "DARK", "dark" y "Dark" produzcan los mismos resultados.

#### Scenario: Consulta en mayúsculas
- **WHEN** el usuario busca "DARK"
- **THEN** el sistema devuelve los mismos resultados que al buscar "dark"

#### Scenario: Título con mayúsculas mezcladas
- **WHEN** el usuario busca "dark"
- **THEN** el sistema devuelve "The Dark Knight" aunque el título contenga mayúsculas

### Requirement: Coincidencia por prefijo
El sistema SHALL reconocer las coincidencias donde el título comienza exactamente con el término de búsqueda (coincidencia de prefijo) como un tipo de coincidencia válido dentro de los resultados.

#### Scenario: Prefijo exacto del título
- **WHEN** el usuario busca "Tita"
- **THEN** el sistema devuelve "Titanic" y otros títulos que comienzan con "Tita"

#### Scenario: Prefijo coincide parcialmente
- **WHEN** el usuario busca "Inter"
- **THEN** el sistema devuelve una lista no vacía que incluye títulos que comienzan con "Inter"

### Requirement: Ordenamiento por relevancia
El sistema SHALL ordenar los resultados de modo que las coincidencias de prefijo (título que comienza con el término) aparezcan antes que las coincidencias de subcadena en otra posición. Dentro de un mismo tipo de coincidencia, el sistema SHALL mantener un orden estable y determinista.

#### Scenario: Prefijo antes que subcadena interna
- **WHEN** el usuario busca "star"
- **THEN** el sistema lista primero títulos como "Star Wars" y luego títulos donde "star" ocurre en otra posición, como "A Star Is Born"

#### Scenario: Orden determinista
- **WHEN** el usuario realiza la misma búsqueda dos veces
- **THEN** el sistema devuelve los resultados en el mismo orden ambas veces

### Requirement: Consulta vacía o sin caracteres significativos
El sistema SHALL devolver una lista vacía de resultados cuando la consulta está vacía o no contiene caracteres significativos, sin ejecutar una búsqueda general de toda la colección.

#### Scenario: Consulta vacía
- **WHEN** el usuario envía una consulta con cero caracteres o solo espacios
- **THEN** el sistema devuelve una lista vacía de resultados

### Requirement: Resultado provee identificador y título
El sistema SHALL exponer en cada resultado al menos el título (`title`) del documento, junto con su identificador único, de modo que el consumidor pueda mostrar y referenciar cada película.

#### Scenario: Atributos expuestos
- **WHEN** la búsqueda devuelve una película
- **THEN** el resultado incluye el identificador único del documento y su campo `title`

### Requirement: Caracteres especiales tratados literalmente
El sistema SHALL tratar los caracteres especiales provistos en la consulta (por ejemplo ".", "*", "$") como texto literal y no como metaparámetros de búsqueda, evitando resultados inesperados o errores de consulta.

#### Scenario: Carácter con significado de expresión regular
- **WHEN** el usuario busca "t*"
- **THEN** el sistema interpreta "t*" como texto literal y devuelve únicamente títulos que contienen "t*" (posiblemente vacío)