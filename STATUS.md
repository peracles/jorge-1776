# STATUS.md — Snail Racing Bets

> Documento de seguimiento de avances. Se actualiza con cada commit.
> Formato basado en los requerimientos del documento de respuesta tecnica.

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

### Commit 9 (wip): Zod input validation
- **Fecha:** 2026-09-29
- **Branch:** feature/snailpay-service
- **Descripcion:** Validacion de inputs con Zod schemas para auth y snailpay endpoints
- **Archivos modificados:** src/validators/auth.ts, src/validators/snailpay.ts, src/controllers/auth.ts, src/controllers/snailpay.ts, package.json, pnpm-lock.yaml
- **Decisiones tomadas:**
  - Schemas separados en src/validators/ (un archivo por dominio)
  - registerSchema: fullName min 2, email valido, password min 6
  - loginSchema: email valido, password requerido
  - snailpaySchema: cardNumber 16 digitos, expiryDate formato MM/YY, cvv 3 digitos, amount positivo, payerEmail valido
  - safeParse() en controllers — retorna 400 con primer mensaje de error si validacion falla
  - parsed.data se pasa al service (tipos inferidos de Zod, no del body sin validar)
- **Siguiente paso:** Global error handling (Milestone 2.5)

### Commit 10: Global error handling
- **Fecha:** 2026-09-29
- **Branch:** feature/error-handling
- **Descripcion:** Sistema de errores tipado con clases personalizadas y handler global mejorado
- **Archivos modificados:** src/errors/app-error.ts, src/errors/index.ts, src/middleware/error.ts, src/services/auth.ts, src/services/snailpay.ts, src/controllers/auth.ts, src/controllers/snailpay.ts, src/types/index.ts, src/app.ts
- **Decisiones tomadas:**
  - Clases de error tipadas: AppError (base), NotFoundError (404), ValidationError (400), AuthenticationError (401), ConflictError (409), SystemError (500)
  - isOperational flag distingue errores esperados (no loggear) de errores inesperados (loggear con stack trace)
  - notFoundHandler captura rutas inexistentes antes del errorHandler
  - Formato de respuesta estandarizado: { error, message, statusCode, path }
  - Reemplazados todos los Object.assign(new Error, { statusCode }) por clases tipadas
  - AppError removido de types/ y movido a errors/ como clase (no interface)
- **Siguiente paso:** Inicio de Epic 3 — Frontend UI (Milestone 3.1)

### Commit 11: Frontend routing and layout
- **Fecha:** 2026-09-29
- **Branch:** feature/frontend-routing-layout
- **Descripcion:** Layout con Header, routing protegido con AppLayout, token storage en useAuth
- **Archivos modificados:** src/components/layout/Header.tsx, src/components/layout/AppLayout.tsx, src/hooks/useAuth.ts, src/App.tsx, src/features/dashboard/pages/DashboardPage.tsx, tsconfig.app.json, package.json
- **Decisiones tomadas:**
  - AppLayout usa Outlet de React Router para nested routes (escalable para futuras rutas protegidas)
  - Header muestra nombre de usuario, saldo formateado y boton de logout con shadcn Button
  - useAuth ahora almacena token en localStorage (snail_racing_token) para llamadas a API protegidas
  - login() ahora acepta (userData, token) para guardar ambos
  - Dashboard simplificado — Header ya no esta dentro de la pagina sino en el layout
  - Fix tsconfig.app.json: removido baseUrl deprecado, paths usa rutas relativas
  - Instaladas dependencias faltantes de shadcn/ui: @base-ui/react, class-variance-authority
- **Siguiente paso:** Auth Context con localStorage persistence (Milestone 3.2)

### Commit 12: Frontend auth context
- **Fecha:** 2026-09-29
- **Branch:** feature/frontend-auth-context
- **Descripcion:** AuthContext provider con useAuth hook basado en Context API
- **Archivos modificados:** src/stores/AuthContext.tsx, src/hooks/useAuth.ts, src/main.tsx
- **Decisiones tomadas:**
  - AuthContext creado en src/stores/ (separacion: stores para estado global, hooks para consumo)
  - AuthProvider envuelve App en main.tsx — estado accesible desde cualquier componente
  - useAuth ahora es un wrapper de useContext(AuthContext) con guard de error si se usa fuera del Provider
  - Logica de localStorage (loadUser, loadToken, login, logout) vive en el Context, no en el hook
  - Hook useAuth simplificado de ~50 lineas a ~8 lineas — solo consume contexto
  - Lazy initialization en useState mantiene el fix de React 19 (sin cascading renders)
- **Siguiente paso:** Registration form con Zod validation (Milestone 3.3)

### Commit 13: Frontend registration form
- **Fecha:** 2026-09-29
- **Branch:** feature/frontend-registration
- **Descripcion:** Formulario de registro con validacion Zod, react-hook-form y conexion a API backend
- **Archivos modificados:** src/components/auth/RegisterForm.tsx, src/features/auth/pages/RegisterPage.tsx
- **Decisiones tomadas:**
  - RegisterForm como componente independiente en components/auth/ (reutilizable, testeable)
  - Zod schema con refine() para validar que passwords match (validacion cross-field)
  - react-hook-form para manejo de estado del formulario (onChange validation, submit handling)
  - z.infer<typeof schema> para inferir tipos TypeScript desde el schema de Zod (single source of truth)
  - Estados: loading (disabled button), error (mensaje rojo), success (redirect via login())
  - RegisterPage integra el form + link a login (navegacion entre auth pages)
  - apiFetch reutiliza el client existente para POST /api/auth/register
- **Siguiente paso:** Login form (Milestone 3.4)

### Commit 14: Frontend login form
- **Fecha:** 2026-09-29
- **Branch:** feature/frontend-login
- **Descripcion:** Formulario de login con validacion Zod y conexion a API backend
- **Archivos modificados:** src/components/auth/LoginForm.tsx, src/features/auth/pages/LoginPage.tsx
- **Decisiones tomadas:**
  - LoginForm sigue mismo patron que RegisterForm (react-hook-form + zodResolver)
  - Schema mas simple que registro: solo email + password (sin confirmacion)
  - Login exitoso llama a login(user, token) del AuthContext → guarda en localStorage
  - LoginPage integra el form + link a registro (navegacion bidireccional entre auth pages)
  - apiFetch ya maneja token automaticamente y redirect en 401
- **Siguiente paso:** Dashboard layout (Milestone 3.5)

### Commit 15 (fix): Navigation after login and register
- **Fecha:** 2026-09-29
- **Branch:** feature/frontend-login
- **Descripcion:** Fix de navegacion post-auth usando useEffect con isAuthenticated
- **Archivos modificados:** src/components/auth/LoginForm.tsx, src/components/auth/RegisterForm.tsx
- **Decisiones tomadas:**
  - navigate() directo despues de login() no funciona porque React no ha procesado el cambio de estado del Context
  - Solucion: useEffect que observa isAuthenticated y navega cuando cambia a true
  - Mismo patron aplicado a RegisterForm y LoginForm para consistencia
  - El Navigate de App.tsx en ruta "/" no es suficiente porque el usuario esta en /login o /register, no en /
- **Siguiente paso:** Dashboard layout (Milestone 3.5)

### Commit 16: Frontend dashboard structure
- **Fecha:** 2026-09-29
- **Branch:** feature/frontend-dashboard
- **Descripcion:** Dashboard con cards de perfil y balance, boton de logout y placeholder de deposito
- **Archivos modificados:** src/features/dashboard/pages/DashboardPage.tsx, src/components/dashboard/BalanceCard.tsx
- **Decisiones tomadas:**
  - DashboardPage usa grid de 2 columnas para Profile y Balance cards
  - BalanceCard es componente separado para reutilizacion en otras vistas
  - Boton de logout en el header del dashboard (ademas del del Header global)
  - Modal de deposito es placeholder hasta Milestone 3.7 (SnailPay integration)
  - Formato de moneda con toFixed(2) para consistencia visual
- **Siguiente paso:** Dashboard charts (Milestone 3.6)

### Commit 17: Dashboard charts
- **Fecha:** 2026-09-29
- **Branch:** feature/dashboard-charts
- **Descripcion:** Graficas de dona y barras con Recharts para historial de apuestas y resultados de carreras
- **Archivos modificados:** src/components/dashboard/DonutChart.tsx, src/components/dashboard/BarChart.tsx, src/components/dashboard/mockData.ts, src/features/dashboard/pages/DashboardPage.tsx
- **Decisiones tomadas:**
  - DonutChart muestra apuestas ganadas vs perdidas (azul/rojo)
  - BarChart muestra victorias por caracol con colores individuales
  - Mock data con 6 caracoles y 6 apuestas simuladas
  - Datos congruentes: suma de victorias = 6 (una por carrera)
- **Siguiente paso:** SnailPay payment form (Milestone 3.7)

### Commit 18: SnailPay payment form
- **Fecha:** 2026-09-29
- **Branch:** feature/snailpay-form
- **Descripcion:** Formulario de pago SnailPay con validacion Zod e integracion a API backend
- **Archivos modificados:** src/components/snailpay/PaymentForm.tsx, src/types/index.ts, src/features/dashboard/pages/DashboardPage.tsx
- **Decisiones tomadas:**
  - PaymentForm con campos: cardNumber, expiryDate, cvv, fullName, amount
  - Validaciones Zod: 16 digitos tarjeta, formato MM/YY, 3 digitos CVV, monto positivo
  - Integracion con POST /api/snailpay/process del backend
  - Manejo de respuestas: approved (exitoso), rejected (error transaccion), error (sistema)
  - Alerta temporal para confirmar pago exitoso (se mejorara con toast en Milestone 4.3)
  - Tipos SnailPayChargeRequest/Response agregados al frontend
- **Siguiente paso:** E2E flow verification (Milestone 4.1)

### Commit 19: Balance update integration
- **Fecha:** 2026-09-29
- **Branch:** feature/snailpay-form
- **Descripcion:** Backend actualiza balance en users.json y frontend refresca usuario via GET /auth/me
- **Archivos modificados:** src/controllers/snailpay.ts, src/controllers/auth.ts, src/routes/auth.ts, src/stores/auth-context.ts, src/stores/AuthProvider.tsx, src/components/snailpay/PaymentForm.tsx
- **Decisiones tomadas:**
  - SnailPayController llama UserModel.updateBalance() cuando pago es aprobado
  - Nuevo endpoint GET /api/auth/me retorna datos actualizados del usuario
  - AuthContext agrega metodo updateUser() para actualizar solo el usuario sin tocar el token
  - PaymentForm usa updateUser() en vez de login() para refrescar balance despues del pago
  - Separacion de responsabilidades: login (auth completa) vs updateUser (solo datos)
- **Siguiente paso:** E2E flow verification (Milestone 4.1)

### Commit 20: Backend unit and integration tests
- **Fecha:** 2026-09-30
- **Branch:** feature/backend-tests
- **Descripcion:** Tests unitarios para AuthService y SnailPayService, tests de integracion para endpoints
- **Archivos modificados:** tests/unit/auth.service.test.ts, tests/unit/snailpay.service.test.ts, tests/integration/auth.test.ts, tests/integration/snailpay.test.ts, vitest.config.ts, src/app.ts
- **Decisiones tomadas:**
  - 28 tests totales: 15 unitarios + 13 de integracion
  - Vitest configurado con fileParallelism: false para evitar race conditions en archivos JSON
  - app.listen() condicional con NODE_ENV !== "test" para evitar conflictos de puerto
  - Cada test resetea los stores (users.json, sessions.json) en beforeEach
  - SnailPay integration tests incluyen payerId y payerEmail requeridos por el schema
- **Siguiente paso:** Frontend tests (Milestone 5.2)

### Commit 21: Frontend unit and component tests
- **Fecha:** 2026-09-30
- **Branch:** feature/frontend-tests
- **Descripcion:** Tests unitarios para schemas Zod y tests de componentes para auth forms y charts
- **Archivos modificados:** tests/unit/validators.test.ts, tests/components/LoginForm.test.tsx, tests/components/RegisterForm.test.tsx, tests/components/DonutChart.test.tsx, tests/components/BarChart.test.tsx, vite.config.ts, package.json
- **Decisiones tomadas:**
  - 23 tests frontend: 11 unitarios (Zod) + 12 componentes
  - Vitest configurado con jsdom environment y fileParallelism: false
  - Componentes auth envueltos con MemoryRouter + AuthProvider para tests
  - Charts testean renderizado de contenedor, no SVG interno (limitacion de jsdom)
  - Schemas Zod replicados en tests para aislamiento (no exportados desde componentes)
- **Siguiente paso:** README documentation (Milestone 6.1)

### Commit 22: Database proposal (Milestone 7.2)
- **Fecha:** 2026-10-01
- **Branch:** feature/database-proposal
- **Descripcion:** Propuesta completa de base de datos PostgreSQL 17 + Prisma 6 ORM como solucion de persistencia real para reemplazar el JSON store actual
- **Archivos modificados:** docs/propuesta-base-datos.md (nuevo), README.md (seccion documentacion adicional)
- **Decisiones tomadas:**
  - PostgreSQL 17 sobre MySQL/SQLite: ya instalado localmente, UUID nativo, JSONB, MVCC para concurrencia, riqueza de tipos
  - Prisma 6 sobre TypeORM/Drizzle/Knex: genera tipos TypeScript automaticos desde schema, mejor DX, incluye Studio GUI, migraciones auto-generadas
  - 6 tablas disenadas: users, sessions, transactions, snails, races, bets — con FKs, indices y constraints
  - Schema de Prisma completo con relaciones, onDelete Cascade/Restrict/SetNull
  - Queries de ejemplo para dashboard (donut chart, bar chart, estadisticas)
  - Codigo antes/despues de UserModel y SessionModel mostrando la migracion de JSON store a Prisma Client
  - prisma.$transaction() para atomicidad en SnailPay (garantiza consistencia entre transaccion y balance)
  - Docker Compose actualizado con servicio postgres:17-alpine + healthcheck
  - Fundamento teorico: normalizacion 3FN (Codd 1972), MVCC (Bernstein 1987), B-tree O(log n) (Knuth 1998), patron Data Mapper (Fowler 2002)
- **Siguiente paso:** Deploy publico (Milestone 7.1) o PDF de respuesta (Milestone 6.3)

### Commit 23: Technical response document (Milestone 6.3)
- **Fecha:** 2026-10-01
- **Branch:** fix/documentation
- **Descripcion:** Documento de respuesta tecnica en formato DOCX con todas las secciones requeridas
- **Archivos modificados:** docs/respuesta-tecnica.docx (nuevo), scripts/generate_pdf.py (nuevo)
- **Decisiones tomadas:**
  - Formato DOCX (editable) en lugar de PDF directo, para permitir edicion antes de conversion final
  - Python con python-docx para generacion automatica del documento
  - Arial 10pt, margenes estrechos (1.5cm superior/inferior, 2cm laterales) para optimizar espacio
  - 11 secciones: resumen, decisiones, herramientas, uso de IA, pruebas, funcionalidades terminadas, funcionalidades pendientes, tiempo invertido, repositorio, arquitectura tecnica, propuesta de base de datos
  - Script reutilizable (scripts/generate_pdf.py) para regenerar el documento si hay cambios
  - Nombre generico "respuesta-tecnica" sin nombres de empresas por politicas de seguridad
- **Siguiente paso:** Revision y edicion manual del documento, conversion a PDF cuando este completo

### Commit 24: Deployment proposal (Milestone 7.1)
- **Fecha:** 2026-10-01
- **Branch:** feature/deployment-proposal
- **Descripcion:** Propuesta completa de despliegue en AWS EC2 Free Tier con arquitectura Nginx + PM2 + Let's Encrypt + Cloudflare, incluyendo nota sobre por que no se ejecuto el deploy real
- **Archivos modificados:** docs/propuesta-deploy.md (nuevo), README.md (seccion documentacion adicional)
- **Decisiones tomadas:**
  - AWS EC2 t2.micro Free Tier (12 meses gratis, 750 hrs/mes, 30 GB EBS) — costo $0/mes
  - Nginx como reverse proxy: patron reactor (Schmidt 1996), O(1) por evento con epoll, ideal para Node.js
  - PM2 como process manager — restart automatico, log aggregation, zero-downtime restarts
  - Let's Encrypt con Certbot (ACME protocol, RFC 8555) — SSL gratuito con renovacion automatica
  - Cloudflare DNS para registros A apuntando a IP publica de EC2
  - Dockerfiles de produccion con multi-stage builds (imagen final mas pequena)
  - docker-compose.production.yml para despliegue con Docker como alternativa a PM2
  - CI/CD con GitHub Actions (appleboy/ssh-action) para deploy automatico en push a main
  - Security Groups: solo puertos 22 (SSH restringido), 80, 443 — puerto 3000 no expuesto
  - Nota explicativa: AWS tarda 3-5 dias habiles en activar cuenta nueva, incompatible con plazos de la prueba
  - Alternativas evaluadas: Vercel+Railway, Render, Fly.io, DigitalOcean, Oracle Cloud — todas descartadas por costos ocultos o misma limitacion de tiempo
- **Siguiente paso:** Deploy real en AWS EC2

### Commit 25: AWS deployment ejecutado (Milestone 7.1 completado)
- **Fecha:** 2026-10-02
- **Branch:** feature/aws-deployment
- **Descripcion:** Deploy real ejecutado exitosamente en AWS EC2 t3.micro con subdominio snail.peracles.dev
- **Archivos modificados:** docs/propuesta-deploy.md (eliminado), docs/deployment-guide.md (nuevo), README.md (actualizado), STATUS.md (actualizado), PLAN.md (actualizado)
- **Decisiones tomadas:**
  - EC2 t3.micro en lugar de t2.micro (t2 ya no disponible en Free Tier, t3 tiene 2 vCPU en lugar de 1)
  - Subdominio snail.peracles.dev para no interferir con landing page existente en peracles.dev
  - Nginx con server block para HTTP (80) y HTTPS (443) con SSL de Let's Encrypt
  - PM2 para gestion del proceso Node.js con auto-restart
  - JSON files (users.json, sessions.json) creados manualmente con estructura `{ "users": [] }` y `{ "sessions": [] }`
  - Cloudflare DNS con registro A apuntando a IP publica de EC2 (proxy desactivado inicialmente)
  - Certbot para SSL automatico con redirect HTTP→HTTPS
- **Problemas encontrados y resueltos:**
  - `tsc: not found` al hacer build: causado por `pnpm install --prod` que excluye devDependencies. Solucion: `pnpm install` completo, luego `pnpm prune --prod`
  - `Permission denied` al escribir en `/etc/nginx/`: `sudo cat >` no funciona porque el redirect pierde permisos de sudo. Solucion: usar `sudo tee`
  - Certbot creo server block duplicado con `return 404` que interceptaba peticiones. Solucion: editar config manualmente para tener un solo server block con SSL inline
  - Error 500 en registro/login: archivos JSON no existian o tenian estructura incorrecta (`[]` en lugar de `{ "users": [] }`). Solucion: crear archivos con estructura correcta
- **Siguiente paso:** Actualizar documento de respuesta tecnica con seccion de deploy

---
