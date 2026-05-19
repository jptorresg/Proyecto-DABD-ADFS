# SAT Frontend

Frontend del módulo SAT en HTML estático + Tailwind CSS + Alpine.js + Chart.js
(mismo stack que el frontend de Bedly).

## Stack

- TailwindCSS (CDN)
- Bootstrap Icons (CDN)
- Alpine.js (CDN)
- Chart.js (CDN)
- Inter font (Google Fonts)
- Vanilla `fetch()` con JWT Bearer guardado en `localStorage`

## Páginas

| Archivo | Descripción |
|---|---|
| `index.html` | Redirección automática a `dashboard.html` o `login.html` según token |
| `login.html` | Form de login. POST `/api/auth/login` → token JWT guardado |
| `dashboard.html` | Cards de totales + 3 gráficas (Chart.js): ingresos por mes, por tipo de proveedor, por estado |
| `facturas.html` | Listado con filtros (estado, emisor) + botón "Descargar PDF" por fila |
| `crear-factura.html` | Formulario con líneas dinámicas, IVA 12% calculado en vivo |
| `desde-bedly.html` | Input de ID de reserva + botón para facturarla desde Bedly |
| `reportes.html` | 5 cards de reportes con filtros + botón descarga PDF, más Excel |

## Setup

El SAT backend debe estar corriendo en `http://localhost:8090` con CORS
habilitado (ya está, ver `CorsConfig.java`).

### Opción 1 — Abrir directamente

Doble click en `index.html`. Funciona desde `file://` porque el backend
tiene `Allow-Origin: *`.

### Opción 2 — VS Code Live Server (recomendado)

1. En VS Code, abrí la carpeta `sat-frontend/sat/`.
2. Click derecho en `index.html` → "Open with Live Server".
3. Abre en `http://127.0.0.1:5500/index.html`.

## Credenciales

```
Email:    admin@sat.local
Password: admin123
```

## Configuración

En `js/sat-common.js`:

```js
const SAT_API_BASE = 'http://localhost:8090';     // backend SAT
const SAT_BEDLY_BASE = 'http://localhost:5043';   // Bedly1 (informativo)
```

Si los puertos son distintos, editá esas líneas.
