# Catálogo de cuentas contables | Prueba técnica Fullstack

Aplicación web para administrar un **catálogo jerárquico de cuentas contables**, desarrollada como prueba técnica fullstack. Permite crear, consultar, buscar, renombrar y eliminar cuentas, aplicando las reglas de negocio de su estructura contable.

**Repositorio:** https://github.com/Medina2603/helissa-prueba

## Tecnologías

- **Backend:** NestJS, TypeScript y API REST.
- **Frontend:** React, TypeScript y Vite.
- **Pruebas:** Vitest.
- **Calidad:** oxlint.
- **Almacenamiento:** repositorio en memoria mediante `Map` (sin base de datos).

## Requisitos

- Node.js **22** (`.nvmrc`).
- npm **10 o superior**.

## Instalación y ejecución

```bash
git clone https://github.com/Medina2603/helissa-prueba.git
cd helissa-prueba
nvm use            # si utilizas nvm
npm install        # instala dependencias de raíz, API y web
npm run dev        # inicia ambos servicios
```

Servicios locales:

| Servicio | Dirección |
| --- | --- |
| Interfaz web | http://localhost:5173 |
| API REST | http://localhost:3000 |

El frontend utiliza `VITE_API_URL` para definir la URL de la API (valor predeterminado: `http://localhost:3000`). El backend permite configurar el origen del frontend mediante `WEB_ORIGIN` (valor predeterminado: `http://localhost:5173`). Hay un ejemplo de configuración en `web/.env.example`.

## Funcionalidades

- Visualización del catálogo en un **árbol jerárquico** expandible.
- Creación de cuentas con validaciones en frontend y backend.
- Búsqueda de cuentas por código o nombre.
- Renombrado de cuentas sin modificar su código.
- Eliminación de cuentas que no tengan hijas.
- Visualización del nivel, naturaleza contable y disponibilidad para movimientos.
- Estados de carga, confirmaciones y mensajes de error.

## Reglas de negocio

El nivel de una cuenta se determina por la longitud de su código:

| Longitud | Nivel | Ejemplo | Código padre |
| --- | --- | --- | --- |
| 1 dígito | Clase | `1` | No aplica |
| 2 dígitos | Grupo | `11` | `1` |
| 4 dígitos | Cuenta | `1105` | `11` |
| 6 dígitos | Subcuenta | `110505` | `1105` |

- Los códigos deben ser numéricos y tener **1, 2, 4 o 6 dígitos**.
- Cada código debe ser único.
- Para crear una cuenta de nivel inferior, su cuenta padre debe existir.
- El nombre es obligatorio y no puede estar vacío.
- La naturaleza (`DEBIT` o `CREDIT`) se define en la **clase** y se hereda en los niveles inferiores.
- Una cuenta **solo admite movimientos cuando no tiene cuentas hijas**. La API expone este estado mediante `allowsMovements`; esta aplicación no implementa el registro de movimientos contables.
- No se permite eliminar cuentas con hijas.

## API REST

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/accounts/tree` | Obtener el catálogo como árbol jerárquico |
| `POST` | `/accounts` | Crear una cuenta |
| `PATCH` | `/accounts/:code` | Cambiar el nombre de una cuenta |
| `DELETE` | `/accounts/:code` | Eliminar una cuenta sin hijas |

**Ejemplo: crear una clase**

```bash
curl -X POST http://localhost:3000/accounts \
  -H 'Content-Type: application/json' \
  -d '{"code":"1","name":"Activo","nature":"DEBIT"}'
```

**Ejemplo: crear un grupo**

```bash
curl -X POST http://localhost:3000/accounts \
  -H 'Content-Type: application/json' \
  -d '{"code":"11","name":"Disponible"}'
```

Los errores de validación se responden con HTTP `400`, los recursos inexistentes con `404` y los conflictos (por ejemplo, códigos duplicados o cuentas con hijas) con `409`. Una eliminación exitosa responde con `204`.

## Arquitectura y decisiones técnicas

El backend organiza el módulo `accounts` en capas inspiradas en **Clean Architecture**:

```text
api/src/accounts/
├── domain/
│   ├── entities/            # Entidad Account y sus invariantes
│   ├── errors/              # Errores de dominio
│   └── repositories/        # Contrato del repositorio
├── application/
│   └── use-cases/           # Crear, consultar árbol, renombrar y eliminar
├── infrastructure/
│   └── repositories/        # Implementación en memoria
├── presentation/
│   └── accounts.controller.ts # Endpoints HTTP
└── accounts.module.ts       # Integración de dependencias
```

- **Dominio:** valida códigos, nombres, niveles, padres derivados del código y naturaleza.
- **Aplicación:** coordina los casos de uso y sus reglas, sin depender directamente del mecanismo de almacenamiento.
- **Infraestructura:** implementa el contrato del repositorio usando `Map`, adecuado para una prueba sin requerir configuración de base de datos.
- **Presentación:** expone la API REST y traduce los errores de negocio a respuestas HTTP.

En el frontend se utilizan componentes React y estado local para manejar el árbol, la búsqueda, los formularios y las operaciones asíncronas. Se usa TypeScript para definir los datos intercambiados con la API.

## Scripts disponibles

Ejecutar desde la raíz del repositorio:

```bash
npm run dev       # API y frontend en desarrollo
npm run dev:api   # Solo backend
npm run dev:web   # Solo frontend
npm run build     # Compilar ambos proyectos
npm test          # Ejecutar pruebas de la API
npm run lint      # Analizar código de ambos proyectos
```

Las pruebas unitarias del backend cubren reglas de la entidad y operaciones sobre el catálogo. Los resultados deben comprobarse ejecutando `npm test` en el entorno de entrega.

## Limitaciones y mejoras futuras

- **Sin persistencia:** los datos se almacenan en memoria y se pierden al reiniciar el servidor.
- **Sin movimientos contables:** se calcula qué cuentas pueden recibir movimientos, pero no se registran transacciones.
- **Sin autenticación ni autorización:** no se gestionan usuarios ni permisos.

Con más tiempo se podría incorporar una base de datos relacional, migraciones, pruebas de integración y end-to-end, validación mediante DTOs, paginación o consultas optimizadas para catálogos grandes, y una estrategia de despliegue automatizada.

## Entrega

Código fuente y documentación disponibles en:

**https://github.com/Medina2603/helissa-prueba**
