## Why

El proyecto necesita un buscador genérico (tipo Google) sobre MongoDB para datos de películas: al escribir "t" se deben listar todas las películas cuyo título contenga "t" (de forma parcial y flexible), en lugar de exigir coincidencia exacta o el título completo. La búsqueda actual o esperada resulta demasiado rígida para ser útil como buscador.

## What Changes

- Nueva capacidad de **búsqueda genérica por título**: dado un término de búsqueda, se devuelven todas las películas cuyo `title` coincide de forma parcial y flexible (no exacta).
- El término de búsqueda se aplica como coincidencia parcial: buscar "t" encuentra títulos como "The Dark Knight", "Interstellar", "Titanic", etc., en cualquier posición del título.
- La búsqueda es **case-insensitive** (no distingue mayúsculas/minúsculas).
- Búsqueda opcional por **prefijo** (matches que empiezan con el término) y por **subcadena** (matches en cualquier parte del título), siendo la coincidencia por subcadena el comportamiento base.
- Resultados ordenados con un criterio de relevancia básico (coincidencias de prefijo primero, luego por posición/alfabético).
- La especificación es **agnóstica de stack**: define el comportamiento esperado sin prescribir Node.js, Python u otro lenguaje, ni una API REST u otra interfaz. Solo define qué debe poder hacer el buscador.
- Aplica a documentos de una colección de películas con un campo `title` de tipo string.

## Capabilities

### New Capabilities
- `search`: Búsqueda genérica y flexible por título de películas en MongoDB, con coincidencia parcial case-insensitive, soporte de prefijo/subcadena y ordenamiento básico por relevancia.

### Modified Capabilities
_Vacío: no existen capacidades previas en el proyecto._

## Impact

- **Especificaciones**: se crea `openspec/specs/search/spec.md` definiendo los requisitos de comportamiento de la búsqueda genérica.
- **Código**: ningún código de aplicación todavía — el proyecto está en fase de especificación (greenfield).
- **Dependencias**: ninguna nueva dependencia definida a nivel de especificación.
- **Datos**: colección de películas con un campo `title` de tipo string.
- **Sistemas**: MongoDB (motor de base de datos); la especificación no fija el driver, lenguaje ni interfaz de exposición.