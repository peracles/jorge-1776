# Snail Racing Bets

Aplicacion web de apuestas en carreras de caracoles. Desarrollada con React + Express + TypeScript.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Zod
- **Backend:** Express, TypeScript, bcryptjs
- **Testing:** Vitest, React Testing Library, supertest
- **Infraestructura:** Docker, pnpm workspaces (monorepo)

## Requisitos

- Node.js v24.21.0
- pnpm 12.5.1
- Docker 29.7.2
- Docker Compose v5.4.0

## Ejecucion local

### Backend
```bash
cd apps/backend
pnpm install
pnpm dev
```
El backend corre en `http://localhost:3000`.

### Frontend
```bash
cd apps/frontend
pnpm install
pnpm dev
```
El frontend corre en `http://localhost:5173`.

## Ejecucion con Docker

```bash
docker-compose up --build
```

## Ejecucion de pruebas

### Backend
```bash
cd apps/backend
pnpm test              # Todos los tests
pnpm vitest            # Modo watch (re-ejecuta al guardar)
pnpm vitest run tests/unit/auth.service.test.ts    # Un archivo especifico
```

### Frontend
```bash
cd apps/frontend
pnpm test
```

---

## Documentacion de pruebas

### Backend — Unit Tests

#### AuthService (8 tests)
| Test | Que verifica | Como probarlo |
|---|---|---|
| `should create a new user and return user + token` | Registro exitoso retorna user sin passwordHash + token | `pnpm vitest run tests/unit/auth.service.test.ts -t "create a new user"` |
| `should throw ConflictError if email already exists` | Email duplicado lanza error 409 | `pnpm vitest run tests/unit/auth.service.test.ts -t "ConflictError"` |
| `should hash the password with bcrypt` | Password se guarda hasheado con formato `$2a$10$...` | `pnpm vitest run tests/unit/auth.service.test.ts -t "hash the password"` |
| `should return user + token with correct credentials` | Login exitoso con credenciales correctas | `pnpm vitest run tests/unit/auth.service.test.ts -t "correct credentials"` |
| `should throw AuthenticationError with wrong password` | Password incorrecto lanza error 401 | `pnpm vitest run tests/unit/auth.service.test.ts -t "wrong password"` |
| `should throw AuthenticationError with non-existent email` | Email inexistente lanza error 401 | `pnpm vitest run tests/unit/auth.service.test.ts -t "non-existent email"` |
| `should delete the session` | Logout elimina sesion del store | `pnpm vitest run tests/unit/auth.service.test.ts -t "delete the session"` |
| `should throw NotFoundError for invalid token` | Token invalido lanza error 404 | `pnpm vitest run tests/unit/auth.service.test.ts -t "invalid token"` |

#### SnailPayService (7 tests)
| Test | Que verifica | Como probarlo |
|---|---|---|
| `should approve payment with valid card data` | Tarjeta `1234123412341234`, CVV `543`, exp `12/26` → approved | `pnpm vitest run tests/unit/snailpay.service.test.ts -t "approve payment"` |
| `should reject payment with wrong card number` | Tarjeta diferente → rejected "Card declined" | `pnpm vitest run tests/unit/snailpay.service.test.ts -t "wrong card number"` |
| `should reject payment with wrong CVV` | CVV diferente a `543` → rejected "Invalid CVV" | `pnpm vitest run tests/unit/snailpay.service.test.ts -t "wrong CVV"` |
| `should reject payment with wrong expiry date` | Fecha diferente a `12/26` → rejected "Card expired" | `pnpm vitest run tests/unit/snailpay.service.test.ts -t "wrong expiry"` |
| `should reject payment with invalid amount` | Monto <= 0 → rejected "Invalid amount" | `pnpm vitest run tests/unit/snailpay.service.test.ts -t "invalid amount"` |
| `should throw SystemError when simulateSystemError is true` | Flag system_error → lanza error 500 | `pnpm vitest run tests/unit/snailpay.service.test.ts -t "SystemError"` |
| `should generate unique id and reference for each payment` | Cada pago genera id y reference unicos | `pnpm vitest run tests/unit/snailpay.service.test.ts -t "unique id"` |

### Backend — Integration Tests

#### Auth Endpoints (8 tests)
| Test | Que verifica | Como probarlo |
|---|---|---|
| `should register a new user` | POST /api/auth/register → 201 con user + token | `pnpm vitest run tests/integration/auth.test.ts -t "register a new user"` |
| `should return 409 for duplicate email` | Email duplicado → 409 | `pnpm vitest run tests/integration/auth.test.ts -t "409 for duplicate"` |
| `should return 400 for invalid data` | Datos invalidos (email sin formato, password corto) → 400 | `pnpm vitest run tests/integration/auth.test.ts -t "400 for invalid"` |
| `should login with correct credentials` | POST /api/auth/login → 200 con user + token | `pnpm vitest run tests/integration/auth.test.ts -t "correct credentials"` |
| `should return 401 for wrong password` | Password incorrecto → 401 | `pnpm vitest run tests/integration/auth.test.ts -t "wrong password"` |
| `should return 401 for non-existent email` | Email inexistente → 401 | `pnpm vitest run tests/integration/auth.test.ts -t "non-existent email"` |
| `should logout successfully` | POST /api/auth/logout con token → 200 | `pnpm vitest run tests/integration/auth.test.ts -t "logout successfully"` |
| `should return 404 without token` | Logout sin token → 404 (session not found) | `pnpm vitest run tests/integration/auth.test.ts -t "404 without token"` |

#### SnailPay Endpoint (5 tests)
| Test | Que verifica | Como probarlo |
|---|---|---|
| `should process approved payment` | Pago con tarjeta valida → 200 approved | `pnpm vitest run tests/integration/snailpay.test.ts -t "approved payment"` |
| `should reject payment with wrong card` | Tarjeta invalida → 200 rejected | `pnpm vitest run tests/integration/snailpay.test.ts -t "wrong card"` |
| `should return 500 for system error` | Header `X-SnailPay-Simulate: system_error` → 500 | `pnpm vitest run tests/integration/snailpay.test.ts -t "system error"` |
| `should return 401 without auth token` | Request sin token → 401 | `pnpm vitest run tests/integration/snailpay.test.ts -t "401 without auth"` |
| `should return 400 for invalid data` | Datos invalidos (cardNumber corto, amount negativo) → 400 | `pnpm vitest run tests/integration/snailpay.test.ts -t "400 for invalid"` |

### Escenarios de prueba manual

Para probar manualmente con curl o Postman:

```bash
# 1. Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jorge","email":"jorge@test.com","password":"Password1!"}'

# 2. Login (copiar el token de la respuesta)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jorge@test.com","password":"Password1!"}'

# 3. Pago exitoso (usar token del login)
curl -X POST http://localhost:3000/api/snailpay/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"cardNumber":"1234123412341234","expiryDate":"12/26","cvv":"543","fullName":"Jorge Perales","amount":100,"payerId":"<USER_ID>","payerEmail":"jorge@test.com"}'

# 4. Pago rechazado (tarjeta incorrecta)
curl -X POST http://localhost:3000/api/snailpay/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"cardNumber":"9999999999999999","expiryDate":"12/26","cvv":"543","fullName":"Jorge Perales","amount":100,"payerId":"<USER_ID>","payerEmail":"jorge@test.com"}'

# 5. Error de sistema
curl -X POST http://localhost:3000/api/snailpay/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-SnailPay-Simulate: system_error" \
  -d '{"cardNumber":"1234123412341234","expiryDate":"12/26","cvv":"543","fullName":"Jorge Perales","amount":100,"payerId":"<USER_ID>","payerEmail":"jorge@test.com"}'
```

### Frontend — Unit Tests

#### Zod Validators (11 tests)
| Test | Que verifica | Como probarlo |
|---|---|---|
| `should accept valid registration data` | Datos de registro validos pasan la validacion | `pnpm vitest run tests/unit/validators.test.ts -t "accept valid registration"` |
| `should reject fullName less than 2 characters` | Nombre muy corto → invalido | `pnpm vitest run tests/unit/validators.test.ts -t "fullName less than 2"` |
| `should reject invalid email format` | Email sin formato valido → invalido | `pnpm vitest run tests/unit/validators.test.ts -t "invalid email format"` |
| `should reject password less than 8 characters` | Password corto → invalido | `pnpm vitest run tests/unit/validators.test.ts -t "password less than 8"` |
| `should reject password without uppercase letter` | Sin mayuscula → invalido | `pnpm vitest run tests/unit/validators.test.ts -t "without uppercase"` |
| `should reject password without number` | Sin numero → invalido | `pnpm vitest run tests/unit/validators.test.ts -t "without number"` |
| `should reject password without special character` | Sin caracter especial → invalido | `pnpm vitest run tests/unit/validators.test.ts -t "without special character"` |
| `should reject when passwords do not match` | Passwords diferentes → invalido | `pnpm vitest run tests/unit/validators.test.ts -t "passwords do not match"` |
| `should accept valid login data` | Datos de login validos pasan la validacion | `pnpm vitest run tests/unit/validators.test.ts -t "accept valid login"` |
| `should reject invalid email format` (login) | Email invalido en login → invalido | `pnpm vitest run tests/unit/validators.test.ts -t "reject invalid email" -t "loginSchema"` |
| `should reject empty password` | Password vacio en login → invalido | `pnpm vitest run tests/unit/validators.test.ts -t "empty password"` |

### Frontend — Component Tests

#### LoginForm (3 tests)
| Test | Que verifica | Como probarlo |
|---|---|---|
| `should render email and password fields` | Formulario tiene campos de email y password | `pnpm vitest run tests/components/LoginForm.test.tsx -t "email and password fields"` |
| `should render sign in button` | Boton de sign in esta presente | `pnpm vitest run tests/components/LoginForm.test.tsx -t "sign in button"` |
| `should render link to register page` | Texto de bienvenida visible | `pnpm vitest run tests/components/LoginForm.test.tsx -t "link to register"` |

#### RegisterForm (3 tests)
| Test | Que verifica | Como probarlo |
|---|---|---|
| `should render all form fields` | 4 campos: nombre, email, password, confirm password | `pnpm vitest run tests/components/RegisterForm.test.tsx -t "all form fields"` |
| `should render sign up button` | Boton de sign up esta presente | `pnpm vitest run tests/components/RegisterForm.test.tsx -t "sign up button"` |
| `should render create account title` | Titulo del formulario visible | `pnpm vitest run tests/components/RegisterForm.test.tsx -t "create account title"` |

#### DonutChart (3 tests)
| Test | Que verifica | Como probarlo |
|---|---|---|
| `should render without crashing` | Componente se renderiza sin errores | `pnpm vitest run tests/components/DonutChart.test.tsx -t "render without crashing"` |
| `should render responsive container` | Contenedor de Recharts presente | `pnpm vitest run tests/components/DonutChart.test.tsx -t "responsive container"` |
| `should render with empty data` | Componente maneja datos vacios | `pnpm vitest run tests/components/DonutChart.test.tsx -t "empty data"` |

#### BarChart (3 tests)
| Test | Que verifica | Como probarlo |
|---|---|---|
| `should render without crashing` | Componente se renderiza sin errores | `pnpm vitest run tests/components/BarChart.test.tsx -t "render without crashing"` |
| `should render responsive container` | Contenedor de Recharts presente | `pnpm vitest run tests/components/BarChart.test.tsx -t "responsive container"` |
| `should render with empty data` | Componente maneja datos vacios | `pnpm vitest run tests/components/BarChart.test.tsx -t "empty data"` |

## Autenticacion

Se implemento autenticacion **stateful basada en sesion** con bcryptjs para hashing de contrasenas (cost factor 10).

### Por que session-based y no JWT

| Aspecto | Session (implementado) | JWT (alternativa) |
|---|---|---|
| Estado | Servidor almacena datos de usuario | Servidor no guarda estado |
| Logout | Instantaneo (se borra sesion) | No se puede invalidar hasta expiracion |
| Complejidad | Simple — localStorage + flag isActive | Requiere secret key, expiracion, refresh tokens |
| Escalabilidad | Requiere sesion compartida en multiples servidores | Cualquier servidor verifica la firma |

**Decision:** Para una prueba tecnica con un solo usuario a la vez, session-based es suficiente y mas simple de implementar. JWT seria over-engineering para este alcance.

### Como se implementaria JWT

1. Instalar `jsonwebtoken` y generar un `JWT_SECRET` como variable de entorno
2. En login exitoso, firmar un token: `jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' })`
3. El cliente envia el token en header `Authorization: Bearer <token>` en cada request
4. Crear middleware que verifica el token con `jwt.verify(token, JWT_SECRET)`
5. Para refresh tokens: almacenar un token de larga duracion (7d) y emitir access tokens cortos (1h)
6. Para invalidar tokens: implementar una allowlist/blocklist en Redis o base de datos

## Arquitectura de datos — MVC vs Repository Pattern

Se implemento **MVC tradicional (Active Record)** donde el model contiene tanto la estructura de datos como los metodos de persistencia (CRUD). Esta decision se tomo porque la prueba requiere explicitamente "MVC pattern".

### Como se desglosaria con Repository Pattern (preferencia personal)

En un proyecto personal o a mayor escala, se prefiera separar responsabilidades en mas capas:

```
types/        → Interfaces puras (solo estructura, sin comportamiento)
models/       → Definicion del objeto (schema, validacion de forma)
repositories/ → Acceso a datos (CRUD contra DB/JSON/file)
services/     → Logica de negocio (reglas, validaciones, orquestacion)
controllers/  → HTTP request/response (extrae datos, llama service, retorna)
```

Ejemplo con User:

```typescript
// types/user.ts — interfaz pura
interface User { id: string; email: string; ... }

// repositories/user.repository.ts — solo acceso a datos
class UserRepository {
  create(data: User): User { /* escribe a DB */ }
  findByEmail(email: string): User | null { /* lee de DB */ }
}

// services/auth.service.ts — logica de negocio
class AuthService {
  constructor(private userRepo: UserRepository) {}
  async register(email: string, password: string) {
    // valida email unico, hashea password, llama repo.create()
  }
}
```

### Comparacion

| Aspecto | MVC Active Record (implementado) | Repository Pattern (preferencia personal) |
|---|---|---|
| Archivos por entidad | 2 (type + model) | 4 (type + model + repository + service) |
| Testabilidad | Model acoplado a persistencia | Repository mockeable, service testeable en aislamiento |
| Cambio de persistencia | Modificar cada model | Cambiar solo el repository (inyeccion de dependencias) |
| Complejidad | Menos abstraccion | Mas capas pero mas flexible |
| Ideal para | Apps pequenas, prototipos, pruebas tecnicas | Apps medianas-grandes, equipos grandes |

**Nota:** Para esta prueba tecnica, MVC es la decision correcta por scope y requerimientos. En un proyecto real se usaria Repository Pattern con inyeccion de dependencias para mejor testabilidad y separacion de preocupaciones.

## Escenarios de SnailPay

### Cobro exitoso
- Numero de tarjeta: `1234123412341234`
- Fecha de vencimiento: `12/26`
- CVV: `543`
- Nombre completo: cualquier valor no vacio
- Monto: cualquier cantidad > 0

### Error de transaccion
- Usar un numero de tarjeta diferente a `1234123412341234` → Tarjeta rechazada
- Usar un CVV diferente a `543` → CVV invalido
- Usar una fecha de vencimiento distinta a `12/26` → Tarjeta vencida

### Error de sistema
- Enviar header `X-SnailPay-Simulate: system_error` en la peticion

## Documentacion adicional

| Documento | Descripcion |
|---|---|
| [Propuesta de base de datos](docs/propuesta-base-datos.md) | Diseno de schema PostgreSQL 17 + Prisma ORM, tablas, queries, migraciones y cambios necesarios en el backend para migrar de JSON store a base de datos relacional |
| [Propuesta de despliegue](docs/propuesta-deploy.md) | Despliegue en AWS EC2 Free Tier con Nginx, PM2, Let's Encrypt y Cloudflare. Incluye nota sobre por que no se ejecuto el deploy real |

## Estructura del proyecto

```
jorge-1776/
├── apps/
│   ├── backend/     # Express + TypeScript (MVC)
│   └── frontend/    # React + TypeScript (Feature-based)
├── docs/
│   ├── propuesta-base-datos.md   # Propuesta PostgreSQL + Prisma
│   └── propuesta-deploy.md       # Propuesta deploy AWS Free Tier
├── docker-compose.yml
└── README.md
```
