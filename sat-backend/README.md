# SAT Backend

Backend del módulo SAT (Sistema de Administración Tributaria) del proyecto
DABD-ADFS. Java 17 + Spring Boot 3.2, Oracle 18c XE.

## Estado actual (fase 1)

- Login `POST /api/auth/login` contra tabla `USUARIOS` con BCrypt.
- Sin Spring Security todavía (endpoints abiertos). JWT/seguridad
  completa entra en fase 2 junto con la integración con Bedly.

## Setup

### 1. Base de datos (una sola vez)

Si vas a crear el usuario Oracle desde cero:

```sql
-- como SYSDBA en XEPDB1
CREATE USER sat_db IDENTIFIED BY tu_password_aqui;
GRANT CONNECT, RESOURCE, UNLIMITED TABLESPACE TO sat_db;
```

Después, conectado como `sat_db`, correr el schema:

```powershell
cd C:\Users\José Rueda\Desktop\Proyecto_Modulo_Hotel_Final\Proyecto-DABD-ADFS\sat-backend\migrations
sqlplus --% sat_db/tu_password_aqui@localhost:1521/XEPDB1 @20260519_sat_db_schema.sql
```

> **Si ya corriste partes en DBeaver:** las sentencias que ya existen
> tirarán `ORA-00955` (nombre ya en uso). Eso está bien. Si en su momento
> insertaste el admin con `password_hash = 'REEMPLAZAR_CON_HASH_REAL'`,
> corré el `UPDATE` que está comentado al final del `.sql` para fijar el
> hash real de `admin123`.

### 2. Configuración

```powershell
cd C:\Users\José Rueda\Desktop\Proyecto_Modulo_Hotel_Final\Proyecto-DABD-ADFS\sat-backend\src\main\resources
copy application.properties.example application.properties
# editar application.properties con tu password real de sat_db
```

### 3. Build & Run

```powershell
cd C:\Users\José Rueda\Desktop\Proyecto_Modulo_Hotel_Final\Proyecto-DABD-ADFS\sat-backend
mvn -q clean package
mvn spring-boot:run
```

Servidor en `http://localhost:8090`.

### 4. Probar login

```powershell
curl.exe -X POST http://localhost:8090/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@sat.local\",\"password\":\"admin123\"}'
```

Respuesta esperada (HTTP 200):

```json
{
  "idUsuario": 1,
  "email": "admin@sat.local",
  "nombres": "Admin",
  "apellidos": "SAT",
  "tipoUsuario": "ADMIN"
}
```

Credenciales malas → HTTP 401 `{"error":"Credenciales inválidas"}`.

## Estructura

```
sat-backend/
├── pom.xml
├── migrations/
│   └── 20260519_sat_db_schema.sql
└── src/main/
    ├── java/com/halcon/sat/
    │   ├── SatApplication.java
    │   ├── config/PasswordConfig.java
    │   ├── controller/AuthController.java
    │   ├── dto/{LoginRequest,LoginResponse}.java
    │   ├── model/Usuario.java
    │   ├── repository/UsuarioRepository.java
    │   └── service/AuthService.java
    └── resources/
        └── application.properties.example
```

## Fase 2 (pendiente)

- Tablas: `FACTURAS`, `EMISORES`, `RECEPTORES`, `DETALLE_FACTURA`.
- Cliente HTTP a Bedly (`sat.bedly.base-url`) para consumir reservas y
  emitir facturas SAT.
- Spring Security + JWT (token Bearer) en endpoints protegidos.
- Endpoints CRUD de facturas y consulta histórica.
