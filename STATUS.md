# STATUS.md — Snail Racing Bets

> Documento de seguimiento de avances. Se actualiza con cada commit.
> Formato basado en los requerimientos del documento de respuesta de SISU Technologies.

---

## Resumen del proceso seguido

_Pendiente — se actualizara al finalizar el proyecto._

---

## Decisiones principales

| # | Decision | Justificacion | Commit |
|---|---|---|---|
| 1 | pnpm workspaces para monorepo | Mas rapido que npm/yarn, soporte nativo de workspaces, Jorge ya lo usa | 1 |
| 2 | MVC para backend | Requerido por la prueba, separacion clara de responsabilidades | 1 |
| 3 | Feature-based structure para frontend | Agrupa por dominio funcional, escala mejor que estructura plana | 1 |
| 4 | React Hook Form + Zod para formularios | Standard actual de facto, mejor DX, inferencia de tipos automatica | 1 |
| 5 | Recharts para graficas | Libreria mas popular para React, API declarativa, buen soporte TS | 1 |
| 6 | bcryptjs sobre bcrypt | JS puro sin dependencias nativas, mas portable, mismo resultado | 1 |
| 7 | Vitest sobre Jest | Integracion nativa con Vite, mas rapido, API compatible | 1 |
| 8 | Session-based auth sobre JWT | Prueba tecnica con 1 usuario, logout instantaneo, menor complejidad. JWT requiere secret key, refresh tokens y no permite invalidacion facil | 6 |
| 9 | MVC Active Record sobre Repository Pattern | Requerido por la prueba (MVC explicito). Preferencia personal es Repository Pattern (types + models + repositories + services) para mejor testabilidad y separacion de persistencia, pero over-engineering para este scope | 7 |

---

## Herramientas, librerias y plantillas utilizadas

### Frontend
| Herramienta | Uso | Parte propia / tomada de plantilla |
|---|---|---|
| — | — | — |

### Backend
| Herramienta | Uso | Parte propia / tomada de plantilla |
|---|---|---|
| — | — | — |

### Infraestructura
| Herramienta | Uso | Parte propia / tomada de plantilla |
|---|---|---|
| pnpm 12.5.1 | Package manager con workspaces | Configuracion propia |
| Docker 29.7.2 | Contenedores para desarrollo | Configuracion propia |
| Docker Compose v5.4.0 | Orquestacion de servicios | Configuracion propia |
| Node.js v24.21.0 | Runtime de JavaScript | — |

---

## Uso de inteligencia artificial y forma de validacion

| Herramienta IA | Para que se uso | Como se valido |
|---|---|---|
| Qwen Code | Plan de implementacion, arquitectura, seleccion de tecnologias, creacion de archivos base, documentacion | Revision manual del plan, comparacion con alternativas documentadas |

---

## Pruebas implementadas y razon de su eleccion

| Tipo | Que se prueba | Por que es importante |
|---|---|---|
| — | — | — |

---

## Funcionalidades terminadas

| # | Funcionalidad | Estado | Notas |
|---|---|---|---|
| — | — | — | — |

---

## Funcionalidades incompletas o problemas conocidos

| # | Funcionalidad | Estado | Que falta |
|---|---|---|---|
| — | — | — | — |

---

## Tiempo aproximado invertido

| Fase | Tiempo |
|---|---|
| Setup | — |
| Backend | — |
| Frontend | — |
| Integracion | — |
| Testing | — |
| Documentacion | — |
| **Total** | **—** |

---

## Liga al repositorio publico

**URL:** https://github.com/peracles/jorge-1776

---

## Log de cambios por commit

### Commit 1: Initial commit
- **Fecha:** 2026-09-28
- **Branch:** feature/monorepo-setup
- **Descripcion:** Creacion del repositorio y archivos base de documentacion
- **Archivos modificados:** PLAN.md, STATUS.md, README.md, .gitignore, apps/backend/data/.gitkeep
- **Decisiones tomadas:**
  - Estructura de monorepo con pnpm workspaces
  - Patron MVC para backend
  - Feature-based structure para frontend
  - Seleccion de tecnologias documentada en PLAN.md
- **Siguiente paso:** Scaffolding del backend con estructura MVC

### Commit 2: Backend scaffolding
- **Fecha:** 2026-09-28
- **Branch:** feature/backend-scaffolding
- **Descripcion:** Estructura MVC base del backend con Express + TypeScript
- **Archivos modificados:** apps/backend/package.json, tsconfig.json, Dockerfile, src/app.ts, src/config/index.ts, src/middleware/error.ts, src/routes/health.ts, src/types/index.ts
- **Decisiones tomadas:**
  - Express 5.x con TypeScript ESM
  - bcryptjs sobre bcrypt por portabilidad (JS puro sin dependencias nativas)
  - Estructura MVC: routes → middleware → controllers → services → models
- **Siguiente paso:** Scaffolding del frontend

### Commit 3: Frontend scaffolding
- **Fecha:** 2026-09-28
- **Branch:** feature/frontend-scaffolding
- **Descripcion:** Estructura base del frontend con Vite + React + TypeScript + Tailwind + shadcn/ui
- **Archivos modificados:** apps/frontend/ (completo)
- **Decisiones tomadas:**
  - Vite 8 con React 19 y TypeScript
  - Tailwind CSS 4 con plugin de Vite
  - shadcn/ui para componentes accesibles y customizables
  - Feature-based structure para organizar por dominio funcional
  - React Router para navegacion con ProtectedRoute
- **Siguiente paso:** Docker Compose para desarrollo

### Commit 4: Docker Compose
- **Fecha:** 2026-09-29
- **Branch:** feature/docker-compose
- **Descripcion:** Docker Compose para desarrollo con hot-reload y apps independientes
- **Archivos modificados:** docker-compose.yml, apps/frontend/Dockerfile, apps/frontend/vite.config.ts, apps/backend/Dockerfile, apps/backend/.dockerignore, apps/frontend/.dockerignore, apps/backend/pnpm-workspace.yaml
- **Decisiones tomadas:**
  - Apps independientes sin workspace de pnpm (cada una con su propio node_modules y lockfile)
  - Volumes para hot-reload en desarrollo
  - Red bridge (snail-net) para comunicacion entre contenedores
  - .dockerignore para evitar copiar node_modules local al build context
  - pnpm approve-builds en Dockerfile para permitir build scripts de esbuild
  - Vite server.host = 0.0.0.0 para acceso desde contenedor
- **Siguiente paso:** Modelos y tipos del backend

### Commit 5: Backend models and types
- **Fecha:** 2026-09-29
- **Branch:** feature/backend-models-types
- **Descripcion:** Interfaces TypeScript y User model con persistencia en JSON file
- **Archivos modificados:** src/types/index.ts, src/models/user.ts, data/users.json, src/app.ts, src/routes/health.ts
- **Decisiones tomadas:**
  - Interfaces: User, Transaction, SnailPayChargeRequest, SnailPayChargeResponse, AppError
  - User model con metodos findById, findByEmail, create, updateBalance
  - Persistencia con JSON file (data/users.json) como base de datos simulada
  - UUID v4 para IDs de usuarios
  - Fix de type annotations en app.ts y health.ts para compatibilidad con pnpm + TypeScript
- **Siguiente paso:** Servicio de autenticacion (Milestone 2.2)

### Commit 6: Backend auth service
- **Fecha:** 2026-09-29
- **Branch:** feature/backend-auth-service
- **Descripcion:** Servicio de autenticacion con registro y login usando bcryptjs
- **Archivos modificados:** src/services/auth.ts, src/controllers/auth.ts, src/routes/auth.ts, src/app.ts
- **Decisiones tomadas:**
  - bcryptjs con cost factor 10 (2^10 = 1024 iteraciones, balance seguridad/performance)
  - sanitizeUser() elimina passwordHash de las respuestas (nunca exponer el hash)
  - Controller delega toda la logica al Service, solo extrae datos del request
  - Errores con statusCode se propagan via next() al errorHandler global
  - Mensaje generico "Invalid credentials" para login fallido (no revelar si email existe)
- **Siguiente paso:** Middleware de autenticacion (Milestone 2.3)

### Commit 7: Backend auth middleware
- **Fecha:** 2026-09-29
- **Branch:** feature/backend-auth-middleware
- **Descripcion:** Middleware de autenticacion con session tokens y endpoint de logout
- **Archivos modificados:** src/middleware/auth.ts, src/models/session.ts, src/services/auth.ts, src/controllers/auth.ts, src/routes/auth.ts, src/types/index.ts, data/sessions.json
- **Decisiones tomadas:**
  - Session tokens como UUID v4 almacenados en sessions.json (stateful)
  - Middleware authenticate() valida token en header Authorization: Bearer
  - Login y register ahora retornan { user, token } para que el cliente guarde el token
  - Endpoint POST /api/auth/logout para invalidar sesiones
  - SessionModel con CRUD: create, findByToken, delete, deleteByUserId
  - AuthRequest interface extiende Request con userId para controllers protegidos
- **Siguiente paso:** SnailPay mock payment service (Milestone 2.4)

### Commit 8: SnailPay mock payment service
- **Fecha:** 2026-09-29
- **Branch:** feature/snailpay-service
- **Descripcion:** Servicio mock de pagos SnailPay con 5 escenarios de respuesta
- **Archivos modificados:** src/services/snailpay.ts, src/controllers/snailpay.ts, src/routes/snailpay.ts, src/app.ts
- **Decisiones tomadas:**
  - 5 escenarios: cobro exitoso, tarjeta rechazada, CVV invalido, tarjeta vencida, error de sistema
  - Error de sistema se activa con header X-SnailPay-Simulate: system_error (retorna HTTP 500)
  - Ruta protegida con middleware authenticate() — solo usuarios autenticados pueden pagar
  - Respuesta incluye todos los campos del spec: id, status, statusDetail, transactionAmount, dateCreated, authorizationCode, reference, payerId, payerEmail
  - authorizationCode solo se genera en cobros exitosos (6 digitos aleatorios)
- **Siguiente paso:** Validacion de inputs con Zod (wip)

---
