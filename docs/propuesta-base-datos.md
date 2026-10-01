# Propuesta de Base de Datos — Snail Racing Bets

> Documento complementario al PLAN.md y README.md.
> Milestone 7.2 — Adicional 2 de la prueba tecnica de SISU Technologies.

---

## 1. Motor de base de datos: PostgreSQL 17

### 1.1 Por que PostgreSQL

| Criterio | PostgreSQL | MySQL 8 | SQLite |
|---|---|---|---|
| Tipo de datos | Rico (JSONB, ARRAY, ENUM, UUID nativo) | Limitado (JSON basico) | Basico (sin ENUM nativo) |
| Integridad referencial | FK con ON DELETE CASCADE/SET NULL completo | Soportado pero menos flexible | Limitado |
| Concurrencia | MVCC (Multi-Version Concurrency Control) — lectores no bloquean escritores | MVCC con InnoDB, pero menor rendimiento bajo carga | Lock a nivel de archivo — un escritor a la vez |
| Extensiones | PostGIS, pg_trgm, pgcrypto, etc. | Limitado | Ninguno |
| Indexacion avanzada | B-tree, Hash, GiST, GIN, BRIN, expresiones parciales | B-tree, Hash, FULLTEXT | B-tree solamente |
| Transacciones ACID | Completas con isolation levels configurables (READ COMMITTED default) | Completas con InnoDB | Completas pero con limitaciones de concurrencia |
| Disponibilidad en el proyecto | Instalado localmente (v17 nativo + Docker postgres:17-alpine) | No instalado | Built-in pero no apto para produccion |

**Decision: PostgreSQL 17** — ya disponible en el entorno, mayor riqueza de tipos (UUID nativo, JSONB para datos de tarjeta), mejor rendimiento concurrente, y es el estandar de industria para aplicaciones web modernas.

### 1.2 Fundamento teorico

PostgreSQL implementa el modelo relacional definido por E.F. Codd (1970) con las siguientes propiedades algebraicas:

- **Normalizacion hasta 3FN (Tercera Forma Normal):** Cada tabla elimina dependencias transitivas. Dado R con atributos A, B, C: si A → B y B → C, entonces C depende transitivamente de A. En 3FN, C debe estar en una tabla separada. Esto elimina anomalias de insercion, actualizacion y borrado (Codd, 1972).
- **Teorema de aislamiento SERIALIZABLE:** PostgreSQL usa MVCC con snapshot isolation. Cada transaccion ve un snapshot consistente de la base de datos. La complejidad de control de concurrencia es O(n) donde n es el numero de transacciones activas, vs O(n²) del locking pessimista (Bernstein et al., 1987).
- **Complejidad de indices B-tree:** Las operaciones de busqueda, insercion y eliminacion en un indice B-tree tienen complejidad O(log n) donde n es el numero de registros. Para 1 millon de registros, esto implica ~20 comparaciones por busqueda (Knuth, 1998, The Art of Computer Programming, Vol. 3).

---

## 2. ORM: Prisma 6

### 2.1 Por que Prisma

| Criterio | Prisma 6 | TypeORM 0.3 | Drizzle 0.4 | Knex 3 |
|---|---|---|---|---|
| Enfoque | Schema-first (DSL propio) | Decorator-first (@Entity) | Schema-first (API builder) | Query builder (no ORM) |
| Type safety | Genera tipos TypeScript automaticos desde schema | Decoradores + reflect-metadata | Tipos inferidos manualmente | Tipos parciales |
| Migraciones | Auto-generadas desde schema diff | Manual o con CLI | Auto-generadas | No incluye (solo schema) |
| GitHub Stars | ~42k | ~34k | ~26k | ~20k |
| Documentacion | Excelente (prisma.io/docs) | Buena pero fragmentada | Buena pero mas joven | Buena |
| Curva de aprendizaje | Baja (schema declarativo) | Alta (decoradores, DI) | Media | Baja |
| Cliente type-safe | Si — `prisma.user.findUnique({ where: { email } })` infiere tipos | Parcial — requiere reflect-metadata | Si — pero con API mas verbosa | No — retorna `any` |
| Studio (GUI) | Prisma Studio incluido | No | No | No |
| Pool de conexiones | Integrado con connection pooling | Depende del driver | Integrado | Integrado |

**Decision: Prisma 6** — genera tipos TypeScript automaticos desde el schema, tiene el mejor DX para proyectos Node.js + TypeScript, incluye sistema de migraciones, y Prisma Studio permite inspeccionar datos visualmente. Es la opcion con mayor adopcion en el ecosistema TypeScript actual.

### 2.2 Fundamento teorico

Prisma implementa el patron **Data Mapper** (Fowler, 2002, Patterns of Enterprise Application Architecture) en contraste con **Active Record** que se uso en la implementacion actual:

- **Active Record (implementacion actual):** El objeto contiene tanto datos como comportamiento de persistencia. `UserModel.create()` lee/escribe directamente al JSON file. Ventaja: simplicidad. Desventaja: acoplamiento fuerte entre dominio y persistencia.
- **Data Mapper (Prisma):** Una capa intermedia (el ORM) mapea entre objetos de dominio y tablas de base de datos. El codigo de negocio no conoce SQL. Ventaja: separacion de preocupaciones, testeabilidad (se puede mockear el repository). Desventaja: capa adicional de abstraccion.

La generacion automatica de tipos de Prisma se basa en **code generation** (generacion de codigo en tiempo de compilacion). El comando `prisma generate` lee el schema.prisma y produce un cliente TypeScript con tipos 100% alineados al schema de base de datos. Esto elimina la clase de errores donde el tipo TypeScript y el schema SQL se desincronizan (problema conocido como "impedance mismatch" en ORM).

---

## 3. Schema de base de datos

### 3.1 Diagrama entidad-relacion

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────────┐
│   snails    │       │     races       │       │      bets        │
├─────────────┤       ├─────────────────┤       ├──────────────────┤
│ id (PK)     │◄──┐   │ id (PK)         │   ┌──►│ id (PK)          │
│ name        │   │   │ race_number     │   │   │ user_id (FK)     │
│ color       │   │   │ scheduled_at    │   │   │ snail_id (FK)    │
│ image_url?  │   │   │ status          │   │   │ race_id (FK)     │
│ speed_factor│   │   │ winner_snail_id │───┘   │ amount           │
│ created_at  │   │   │ created_at      │       │ won              │
└─────────────┘   │   └─────────────────┘       │ payout           │
                  │                             │ created_at       │
                  │                             └──────────────────┘
                  │
┌─────────────┐   │   ┌─────────────────┐
│   users     │   │   │  transactions   │
├─────────────┤   │   ├─────────────────┤
│ id (PK)     │   │   │ id (PK)         │
│ full_name   │   │   │ user_id (FK)    │
│ email (UQ)  │   │   │ card_number     │
│ password_hash│  │   │ amount          │
│ balance     │   │   │ status          │
│ created_at  │   │   │ status_detail   │
│ updated_at  │   │   │ auth_code       │
└─────────────┘   │   │ reference       │
      │           │   │ created_at      │
      │           │   └─────────────────┘
      │           │
      │    ┌──────┴──────┐
      │    │  sessions   │
      └───►│ user_id(FK) │
           │ token (PK)  │
           │ created_at  │
           │ expires_at  │
           └─────────────┘
```

### 3.2 CREATE DATABASE

```sql
-- Crear base de datos
CREATE DATABASE snail_racing_bets;

-- Conectar a la base de datos
\c snail_racing_bets;
```

### 3.3 CREATE TABLES

```sql
-- ============================================
-- Tabla: users
-- Almacena registros de usuarios y su saldo
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    balance         DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indice para busqueda rapida por email (login)
CREATE INDEX idx_users_email ON users (email);

-- ============================================
-- Tabla: sessions
-- Sesiones activas de usuarios (stateful auth)
-- ============================================
CREATE TABLE sessions (
    token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indice para busqueda por usuario (logout invalida todas las sesiones)
CREATE INDEX idx_sessions_user_id ON sessions (user_id);

-- ============================================
-- Tabla: transactions
-- Registros de pagos SnailPay (depositos)
-- ============================================
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_number     VARCHAR(16)     NOT NULL,
    amount          DECIMAL(10, 2)  NOT NULL,
    status          VARCHAR(20)     NOT NULL CHECK (status IN ('approved', 'rejected', 'error')),
    status_detail   VARCHAR(255)    NOT NULL,
    auth_code       VARCHAR(6),
    reference       VARCHAR(50)     NOT NULL UNIQUE,
    payer_email     VARCHAR(255)    NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indice para historial de transacciones por usuario
CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_transactions_status ON transactions (status);

-- ============================================
-- Tabla: snails
-- Catalogo de caracoles participantes
-- ============================================
CREATE TABLE snails (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL,
    color           VARCHAR(7)      NOT NULL,
    image_url       VARCHAR(500),
    speed_factor    DECIMAL(3, 2)   NOT NULL DEFAULT 1.00,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: races
-- Carreras programadas y sus resultados
-- ============================================
CREATE TABLE races (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_number     INTEGER         NOT NULL UNIQUE,
    scheduled_at    TIMESTAMPTZ     NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'finished', 'cancelled')),
    winner_snail_id INTEGER         REFERENCES snails(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: bets
-- Apuestas de usuarios en carreras
-- ============================================
CREATE TABLE bets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snail_id    INTEGER         NOT NULL REFERENCES snails(id) ON DELETE RESTRICT,
    race_id     UUID            NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    amount      DECIMAL(10, 2)  NOT NULL CHECK (amount > 0),
    won         BOOLEAN         NOT NULL DEFAULT FALSE,
    payout      DECIMAL(10, 2)  NOT NULL DEFAULT 0.00,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indices para consultas frecuentes
CREATE INDEX idx_bets_user_id ON bets (user_id);
CREATE INDEX idx_bets_race_id ON bets (race_id);
CREATE INDEX idx_bets_snail_id ON bets (snail_id);
```

### 3.4 Datos iniciales (seed)

```sql
-- Insertar los 6 caracoles del catalogo
INSERT INTO snails (name, color, speed_factor) VALUES
    ('Turbo',  '#FF6B6B', 1.05),
    ('Flash',  '#4ECDC4', 0.95),
    ('Rayo',   '#45B7D1', 1.10),
    ('Veloz',  '#96CEB4', 1.00),
    ('Bolt',   '#FFEAA7', 0.90),
    ('Speedy', '#DDA0DD', 1.02);

-- Insertar 6 carreras de ejemplo
INSERT INTO races (race_number, scheduled_at, status, winner_snail_id) VALUES
    (1, '2026-10-01 10:00:00', 'finished', 1),
    (2, '2026-10-01 11:00:00', 'finished', 3),
    (3, '2026-10-01 12:00:00', 'finished', 3),
    (4, '2026-10-01 13:00:00', 'finished', 6),
    (5, '2026-10-01 14:00:00', 'finished', 3),
    (6, '2026-10-01 15:00:00', 'finished', 6);
```

---

## 4. Queries de ejemplo

### 4.1 Consultas basicas

```sql
-- Login: buscar usuario por email
SELECT id, full_name, email, password_hash, balance
FROM users
WHERE email = 'jorge@test.com';

-- Obtener sesiones activas de un usuario
SELECT s.token, s.created_at, s.expires_at
FROM sessions s
WHERE s.user_id = 'user-uuid'
  AND s.expires_at > NOW();

-- Historial de transacciones de un usuario
SELECT t.id, t.amount, t.status, t.status_detail, t.created_at
FROM transactions t
WHERE t.user_id = 'user-uuid'
ORDER BY t.created_at DESC;
```

### 4.2 Consultas de dashboard (graficas)

```sql
-- Donut chart: apuestas ganadas vs perdidas por usuario
SELECT
    CASE WHEN won THEN 'Won' ELSE 'Lost' END AS result,
    COUNT(*) AS value
FROM bets
WHERE user_id = 'user-uuid'
GROUP BY won;

-- Bar chart: victorias por caracol (para todas las carreras finalizadas)
SELECT
    s.name,
    s.color,
    COUNT(r.id) AS victories
FROM snails s
LEFT JOIN races r ON r.winner_snail_id = s.id AND r.status = 'finished'
GROUP BY s.id, s.name, s.color
ORDER BY victories DESC;

-- Historial de apuestas con datos del caracol y carrera
SELECT
    b.id,
    s.name AS snail_name,
    s.color AS snail_color,
    b.amount,
    b.won,
    b.payout,
    r.race_number,
    b.created_at
FROM bets b
JOIN snails s ON b.snail_id = s.id
JOIN races r ON b.race_id = r.id
WHERE b.user_id = 'user-uuid'
ORDER BY b.created_at DESC;
```

### 4.3 Consultas de negocio

```sql
-- Saldo actualizado de un usuario
SELECT id, full_name, email, balance FROM users WHERE id = 'user-uuid';

-- Actualizar balance despues de pago aprobado
UPDATE users
SET balance = balance + 100.00,
    updated_at = NOW()
WHERE id = 'user-uuid'
RETURNING id, full_name, email, balance;

-- Debitar saldo al crear apuesta (con validacion de fondo suficiente)
UPDATE users
SET balance = balance - 50.00,
    updated_at = NOW()
WHERE id = 'user-uuid'
  AND balance >= 50.00
RETURNING id, balance;

-- Estadisticas globales: total apostado, ganancia neta
SELECT
    COUNT(*) AS total_bets,
    SUM(amount) AS total_wagered,
    SUM(CASE WHEN won THEN payout ELSE 0 END) AS total_won,
    SUM(CASE WHEN won THEN payout - amount ELSE -amount END) AS net_profit
FROM bets
WHERE user_id = 'user-uuid';
```

---

## 5. Schema de Prisma

### 5.1 prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  fullName     String   @map("full_name") @db.VarChar(100)
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  balance      Decimal  @default(0) @db.Decimal(12, 2)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  sessions     Session[]
  transactions Transaction[]
  bets         Bet[]

  @@map("users")
}

model Session {
  token     String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")
  expiresAt DateTime @map("expires_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model Transaction {
  id           String   @id @default(uuid())
  userId       String   @map("user_id") @db.Uuid
  cardNumber   String   @map("card_number") @db.VarChar(16)
  amount       Decimal  @db.Decimal(10, 2)
  status       String   @db.VarChar(20)
  statusDetail String   @map("status_detail") @db.VarChar(255)
  authCode     String?  @map("auth_code") @db.VarChar(6)
  reference    String   @unique @db.VarChar(50)
  payerEmail   String   @map("payer_email") @db.VarChar(255)
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@map("transactions")
}

model Snail {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(50)
  color       String   @db.VarChar(7)
  imageUrl    String?  @map("image_url") @db.VarChar(500)
  speedFactor Decimal  @default(1.00) @map("speed_factor") @db.Decimal(3, 2)
  createdAt   DateTime @default(now()) @map("created_at")

  racesAsWinner Race[] @relation("RaceWinner")
  bets          Bet[]

  @@map("snails")
}

model Race {
  id            String   @id @default(uuid())
  raceNumber    Int      @unique @map("race_number")
  scheduledAt   DateTime @map("scheduled_at") @db.Timestamptz()
  status        String   @default("pending") @db.VarChar(20)
  winnerSnailId Int?     @map("winner_snail_id")
  createdAt     DateTime @default(now()) @map("created_at")

  winnerSnail Snail? @relation("RaceWinner", fields: [winnerSnailId], references: [id], onDelete: SetNull)
  bets        Bet[]

  @@map("races")
}

model Bet {
  id        String   @id @default(uuid())
  userId    String   @map("user_id") @db.Uuid
  snailId   Int      @map("snail_id")
  raceId    String   @map("race_id") @db.Uuid
  amount    Decimal  @db.Decimal(10, 2)
  won       Boolean  @default(false)
  payout    Decimal  @default(0) @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  snail Snail @relation(fields: [snailId], references: [id], onDelete: Restrict)
  race  Race  @relation(fields: [raceId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([raceId])
  @@index([snailId])
  @@map("bets")
}
```

### 5.2 Variables de entorno

```env
# .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/snail_racing_bets?schema=public"
```

---

## 6. Cambios en el codigo del backend

### 6.1 Estructura actual vs propuesta

```
apps/backend/src/
├── models/                    # ACTUAL: lee/escribe JSON files
│   ├── user.ts                #   → readFileSync / writeFileSync
│   └── session.ts             #   → JSON.parse / JSON.stringify
│
├── models/                    # PROPUESTA: delega a Prisma Client
│   ├── user.ts                #   → prisma.user.findUnique(...)
│   └── session.ts             #   → prisma.session.create(...)
│
├── prisma/                    # NUEVO: schema y migraciones
│   ├── schema.prisma
│   └── migrations/
│
└── generated/                 # NUEVO: Prisma Client generado
    └── @prisma/client/
```

### 6.2 UserModel — Antes (JSON store)

```typescript
// src/models/user.ts — IMPLEMENTACION ACTUAL
import { readFileSync, writeFileSync } from "node:fs";

export const UserModel = {
  findByEmail(email: string): User | undefined {
    return readStore().users.find((u) => u.email === email);
  },

  create(data: Omit<User, "id" | "balance" | "createdAt">): User {
    const store = readStore();
    const user: User = {
      id: uuidv4(),
      fullName: data.fullName,
      email: data.email,
      passwordHash: data.passwordHash,
      balance: 0,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    writeStore(store);
    return user;
  },

  updateBalance(id: string, amount: number): User | undefined {
    const store = readStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) return undefined;
    user.balance += amount;
    writeStore(store);
    return user;
  },
};
```

### 6.3 UserModel — Despues (Prisma)

```typescript
// src/models/user.ts — PROPUESTA CON PRISMA
import { prisma } from "../config/database.js";
import type { User } from "@prisma/client";

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        balance: 0,
      },
    });
  },

  async updateBalance(id: string, amount: number): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { balance: { increment: amount } },
    });
  },
};
```

### 6.4 SessionModel — Antes (JSON store)

```typescript
// src/models/session.ts — IMPLEMENTACION ACTUAL
export const SessionModel = {
  create(userId: string): Session {
    const store = readStore();
    const session: Session = {
      id: uuidv4(),
      userId,
      createdAt: new Date().toISOString(),
    };
    store.sessions.push(session);
    writeStore(store);
    return session;
  },

  findByToken(token: string): Session | undefined {
    return readStore().sessions.find((s) => s.id === token);
  },

  delete(token: string): boolean {
    // ... findIndex + splice + writeStore
  },
};
```

### 6.5 SessionModel — Despues (Prisma)

```typescript
// src/models/session.ts — PROPUESTA CON PRISMA
import { prisma } from "../config/database.js";
import type { Session } from "@prisma/client";

export const SessionModel = {
  async create(userId: string): Promise<Session> {
    return prisma.session.create({
      data: { userId },
    });
  },

  async findByToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { token },
    });
  },

  async delete(token: string): Promise<Session> {
    return prisma.session.delete({
      where: { token },
    });
  },

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  },
};
```

### 6.6 Configuracion de Prisma Client

```typescript
// src/config/database.ts — NUEVO ARCHIVO
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});
```

### 6.7 Cambios en AuthService

```typescript
// src/services/auth.ts — CAMBIO PRINCIPAL
// Antes: UserModel.findByEmail() retornaba undefined
// Despues: UserModel.findByEmail() retorna null (Prisma convention)

// El cambio es minimo porque la interfaz se mantiene:
async register(email: string, password: string, fullName: string) {
  const existing = await UserModel.findByEmail(email);
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ fullName, email, passwordHash });
  const session = await SessionModel.create(user.id);

  return { user: sanitizeUser(user), token: session.token };
}
```

### 6.8 Cambios en SnailPayService

```typescript
// src/services/snailpay.ts — CAMBIO PRINCIPAL
// Al aprobar un pago, se actualiza el balance en PostgreSQL en vez de JSON

async processPayment(request: SnailPayChargeRequest) {
  // ... logica de validacion de tarjeta (sin cambios)

  if (result.status === "approved") {
    // Transaccion atomica: guardar transaccion + actualizar balance
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: request.payerId,
          cardNumber: request.cardNumber,
          amount: request.amount,
          status: result.status,
          statusDetail: result.statusDetail,
          authCode: result.authorizationCode,
          reference: result.reference,
          payerEmail: request.payerEmail,
        },
      }),
      prisma.user.update({
        where: { id: request.payerId },
        data: { balance: { increment: request.amount } },
      }),
    ]);
  }
}
```

**Ventaja clave:** `prisma.$transaction()` garantiza atomicidad. Si el update de balance falla, la transaccion no se guarda. Con el JSON store actual, esto era imposible — si el proceso moria entre las dos operaciones, los datos quedaban inconsistentes.

---

## 7. Migraciones con Prisma

### 7.1 Comandos

```bash
# Instalar Prisma
pnpm add prisma @prisma/client

# Inicializar schema
pnpm prisma init

# Generar migracion desde schema
pnpm prisma migrate dev --name init

# Aplicar migraciones en produccion
pnpm prisma migrate deploy

# Generar Prisma Client
pnpm prisma generate

# Abrir Prisma Studio (GUI)
pnpm prisma studio

# Seed de datos iniciales
pnpm prisma db seed
```

### 7.2 Script de seed

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const snails = [
    { name: "Turbo",  color: "#FF6B6B", speedFactor: 1.05 },
    { name: "Flash",  color: "#4ECDC4", speedFactor: 0.95 },
    { name: "Rayo",   color: "#45B7D1", speedFactor: 1.10 },
    { name: "Veloz",  color: "#96CEB4", speedFactor: 1.00 },
    { name: "Bolt",   color: "#FFEAA7", speedFactor: 0.90 },
    { name: "Speedy", color: "#DDA0DD", speedFactor: 1.02 },
  ];

  for (const snail of snails) {
    await prisma.snail.upsert({
      where: { id: snails.indexOf(snail) + 1 },
      update: {},
      create: snail,
    });
  }

  console.log("Seed completed: 6 snails created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 8. Docker Compose actualizado

```yaml
# docker-compose.yml — agregar servicio PostgreSQL
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: snail_racing_bets
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    # ... configuracion existente
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-password}@postgres:5432/snail_racing_bets
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
```

---

## 9. Resumen de cambios por archivo

| Archivo actual | Cambio | Archivo nuevo/modificado |
|---|---|---|
| `data/users.json` | Eliminar | — |
| `data/sessions.json` | Eliminar | — |
| `src/models/user.ts` | Reemplazar readFileSync con Prisma | `src/models/user.ts` (rewritten) |
| `src/models/session.ts` | Reemplazar readFileSync con Prisma | `src/models/session.ts` (rewritten) |
| — | Nuevo | `src/config/database.ts` (PrismaClient singleton) |
| — | Nuevo | `prisma/schema.prisma` (definicion de tablas) |
| — | Nuevo | `prisma/seed.ts` (datos iniciales) |
| — | Nuevo | `prisma/migrations/` (migraciones auto-generadas) |
| `src/services/auth.ts` | Cambiar undefined → null, async/await | Modificacion minima |
| `src/services/snailpay.ts` | Agregar `$transaction` para atomicidad | Modificacion minima |
| `src/controllers/auth.ts` | Sin cambios (delega al service) | Sin cambios |
| `src/controllers/snailpay.ts` | Sin cambios (delega al service) | Sin cambios |
| `.env` | Agregar `DATABASE_URL` | Modificacion |
| `docker-compose.yml` | Agregar servicio `postgres` | Modificacion |
| `package.json` | Agregar `prisma` y `@prisma/client` | Modificacion |

---

## 10. Ventajas de la migracion

| Aspecto | JSON Store (actual) | PostgreSQL + Prisma (propuesta) |
|---|---|---|
| Concurrencia | No soportada (un escritor a la vez) | MVCC — multiples lectores/escritores |
| Atomicidad | No garantizada (dos writes separados) | Transacciones ACID con `$transaction` |
| Integridad | No hay FK, datos pueden quedar orfos | FK con CASCADE/RESTRICT garantizan consistencia |
| Consultas complejas | Imposible sin cargar todo en memoria | SQL con JOINs, agregaciones, subqueries |
| Escalabilidad | Limitado a un archivo (MBs) | PostgreSQL soporta TBs de datos |
| Type safety | Interfaces manuales (pueden desincronizarse) | Tipos generados automaticamente desde schema |
| Backups | Copiar archivo JSON | pg_dump, WAL archiving, replicas |
| Monitoring | Ninguno | pg_stat, EXPLAIN ANALYZE, query logs |

---

## 11. Alternativas consideradas

| ORM | Por que se descarto |
|---|---|
| **TypeORM** | Usa decoradores (@Entity, @Column) que requieren reflect-metadata y experimentalDecorators en tsconfig. Mas boilerplate, menos type-safe en queries. Mejor para proyectos Java-like con DI pesado. |
| **Drizzle** | Mas ligero y rapido que Prisma, pero ecosistema mas joven. No incluye Studio GUI. Las migraciones son menos maduras. Buena alternativa si se prioriza rendimiento sobre DX. |
| **Knex.js** | Es un query builder, no un ORM completo. No genera modelos, no tiene migraciones con schema diff. Requiere escribir SQL manualmente. Mejor para quienes quieren control total sobre las queries. |
| **Sequelize** | ORM mas antiguo de Node.js. API menos moderna, type safety inferior a Prisma. Todavia mantenido pero perdiendo adopcion frente a Prisma y Drizzle. |

---

## 12. Referencias

- Codd, E.F. (1970). "A Relational Model of Data for Large Shared Data Banks". Communications of the ACM, 13(6), 377-387.
- Codd, E.F. (1972). "Further Normalization of the Relational Data Model". In Rustin, R. (ed.). Data Base Systems. Courant Computer Science Symposia Series.
- Fowler, M. (2002). Patterns of Enterprise Application Architecture. Addison-Wesley. Pattern: Data Mapper vs Active Record.
- Bernstein, P.A., Hadzilacos, V., Goodman, N. (1987). Concurrency Control and Recovery in Database Systems. Addison-Wesley.
- Knuth, D.E. (1998). The Art of Computer Programming, Volume 3: Sorting and Searching. Addison-Wesley. B-tree complexity analysis.
- PostgreSQL Documentation. https://www.postgresql.org/docs/17/
- Prisma Documentation. https://www.prisma.io/docs
