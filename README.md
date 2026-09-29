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
pnpm test
```

### Frontend
```bash
cd apps/frontend
pnpm test
```

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

Se implemento **MVC tradicional (Active Record)** donde el model contiene tanto la estructura de datos como los metodos de persistencia (CRUD). Esta decision se tomo porque la prueba de SISU requiere explicitamente "MVC pattern".

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

## Estructura del proyecto

```
jorge-1776/
├── apps/
│   ├── backend/     # Express + TypeScript (MVC)
│   └── frontend/    # React + TypeScript (Feature-based)
├── docker-compose.yml
└── README.md
```
