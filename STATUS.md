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

---
