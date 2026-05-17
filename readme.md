# Proyecto Final DADB1 / ADFS

Este repositorio contiene el frontend estático del proyecto,
organizado por módulos: Aerolínea, Hotel y Agencia de Viajes.

Tecnologías:
- HTML5
- CSS
- Bootstrap 5

## Setup del backend de Aerolínea

El backend Java (`aerolinea-backend`, `aerolinea-backend-2`, `aerolinea-backend-3`)
requiere dos archivos con credenciales que NO están versionados (ver `.gitignore`):

- `src/main/resources/db.properties` — credenciales de Oracle.
- `src/main/java/com/halcon/aerolineas/config/DatabaseConfig.java` — clase Java
  que carga el `db.properties`. Está gitignored por la regla
  `**/DatabaseConfig.java` (histórico: antes se editaba con credenciales en duro).

Para que un clon limpio compile, se incluyen dos plantillas versionadas. Pasos
(repetir para cada backend que se vaya a usar):

```bash
cd aerolinea-backend/src/main/resources
cp db.properties.example db.properties
# editar db.properties con las credenciales reales

cd ../java/com/halcon/aerolineas/config
cp DatabaseConfig.java.example DatabaseConfig.java
# no requiere edición; lee de db.properties en runtime
```

`DatabaseConfig` expone `getConnection()`, `testConnection()` y un `main`
para validar la conexión: `mvn -q exec:java -Dexec.mainClass=com.halcon.aerolineas.config.DatabaseConfig`.
