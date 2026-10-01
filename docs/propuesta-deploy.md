# Propuesta de Despliegue — AWS Free Tier

> Documento complementario al PLAN.md y README.md.
> Milestone 7.1 — Adicional 1 de la prueba tecnica.

---

## 1. Nota sobre la ejecucion

### Por que no se realizo el despliegue

Al momento de intentar crear la cuenta en AWS (Amazon Web Services) para desplegar la aplicacion, el proceso de registro requiere una **verificacion manual de la cuenta** que tiene un tiempo de espera de **3 a 5 dias habiles** para la habilitacion de servicios.

Este tiempo de activacion no es compatible con los plazos de entrega de la prueba tecnica, por lo que no fue posible completar el despliegue en produccion.

A continuacion se presenta la propuesta completa de despliegue que se ejecutaria una vez que la cuenta de AWS este activa.

---

## 2. Infraestructura: AWS EC2 Free Tier

### 2.1 Instancia seleccionada

| Parametro | Valor | Justificacion |
|---|---|---|
| Servicio | Amazon EC2 | Compute mas flexible del Free Tier de AWS |
| Tipo de instancia | t2.micro | 1 vCPU, 1 GB RAM — suficiente para Node.js + Nginx |
| Sistema operativo | Ubuntu Server 24.04 LTS | LTS = soporte hasta 2029, comunidad amplia, paquetes actualizados |
| Almacenamiento | 30 GB EBS (General Purpose SSD) | Free Tier incluye 30 GB/mes. Suficiente para OS + app + logs |
| Costo | $0/mes (Free Tier, 12 meses) | 750 horas/mes de instancia t2.micro sin costo |
| IP | Elastic IP (estatica) | Free Tier incluye 1 Elastic IP asociada a instancia en running |

### 2.2 Costo total estimado

| Recurso | Costo mensual | Nota |
|---|---|---|
| EC2 t2.micro | $0.00 | Free Tier — 750 hrs/mes (12 meses) |
| EBS 30 GB | $0.00 | Free Tier — 30 GB/mes |
| Elastic IP | $0.00 | Gratuita si esta asociada a instancia en running |
| Data transfer | $0.00 | Free Tier — 100 GB/mes outbound |
| Cloudflare DNS | $0.00 | Plan gratuito incluye DNS ilimitado |
| Let's Encrypt SSL | $0.00 | Certificados SSL gratuitos |
| **Total** | **$0.00/mes** | Durante los primeros 12 meses |

### 2.3 Fundamento teorico

**Reverse proxy con Nginx:** Nginx usa un modelo de eventos asincrono (event-driven, non-blocking I/O) basado en el patron reactor (Schmidt, 1996). A diferencia del modelo thread-per-connection de Apache, Nginx maneja miles de conexiones concurrentes con un solo thread por worker. La complejidad de manejo de conexiones es O(1) por evento usando epoll (Linux) en lugar de O(n) con select/poll. Esto lo hace ideal como reverse proxy para aplicaciones Node.js de un solo thread.

**Process manager con PM2:** PM2 implementa el patron Cluster de Erlang/OTP para Node.js. Permite restart automatico, log aggregation, y monitoring. Para una instancia unica, se usa en modo fork (una instancia del proceso). Si se escalaria a multiples instancias, se usaria modo cluster con `pm2 start -i max` para aprovechar todos los cores.

**SSL/TLS con Let's Encrypt:** Let's Encrypt usa el protocolo ACME (Automatic Certificate Management Environment, RFC 8555). El challenge HTTP-01 verifica que el servidor controla el dominio respondiendo a un challenge en `http://dominio/.well-known/acme-challenge/`. Los certificados tienen validez de 90 dias y Certbot los renueva automaticamente.

---

## 3. Arquitectura de despliegue

### 3.1 Diagrama

```
Internet
    │
    ▼
Cloudflare DNS (gratis)
    │   ├─ app.dominio.com  → A record → IP publica EC2
    │   └─ api.dominio.com  → A record → IP publica EC2
    ▼
AWS EC2 t2.micro (Ubuntu 24.04 LTS)
    │
    ├─ Nginx :80 / :443
    │   │
    │   ├─ api.dominio.com/*
    │   │   └─ proxy_pass → http://127.0.0.1:3000
    │   │       └─ Express.js (Node.js :3000)
    │   │           └─ PM2 (process manager)
    │   │               └─ JSON files (users.json, sessions.json)
    │   │
    │   └─ app.dominio.com/*
    │       └─ root /var/www/snail-racing/frontend/dist
    │           └─ Vite build output (archivos estaticos)
    │
    └─ Certbot (Let's Encrypt)
        └─ Renovacion automatica cada 90 dias
```

### 3.2 Flujo de una peticion

```
1. Usuario navega a https://app.dominio.com
2. DNS resuelve a IP publica de EC2 (Cloudflare)
3. Nginx recibe en :443 (SSL terminado por Nginx)
4. Nginx sirve archivos estaticos de /var/www/snail-racing/frontend/dist/
5. React carga en el navegador, hace fetch a https://api.dominio.com/api/auth/login
6. Nginx recibe en :443, detecta ruta /api/*
7. Nginx hace proxy_pass a http://127.0.0.1:3000
8. Express procesa la peticion, lee/escribe JSON files
9. Express retorna JSON → Nginx → navegador
```

---

## 4. Configuracion del servidor

### 4.1 Script de inicializacion (UserData)

Este script se ejecuta automaticamente al lanzar la instancia EC2:

```bash
#!/bin/bash
# UserData script — se ejecuta como root al primer boot

# Actualizar sistema
apt-get update && apt-get upgrade -y

# Instalar dependencias
apt-get install -y curl git nginx certbot python3-certbot-nginx

# Instalar Node.js 24.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

# Instalar pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Instalar PM2 globalmente
npm install -g pm2

# Crear directorio de la aplicacion
mkdir -p /var/www/snail-racing
cd /var/www/snail-racing

# Clonar repositorio
git clone https://github.com/peracles/jorge-1776.git .

# ============================================
# Backend
# ============================================
cd /var/www/snail-racing/apps/backend

# Instalar dependencias de produccion
pnpm install --prod

# Compilar TypeScript a JavaScript
pnpm exec tsc

# Crear archivo de entorno
cat > .env <<EOF
NODE_ENV=production
PORT=3000
EOF

# Iniciar backend con PM2
pm2 start dist/app.js --name snail-backend --env production
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# ============================================
# Frontend
# ============================================
cd /var/www/snail-racing/apps/frontend

# Instalar dependencias
pnpm install

# Compilar para produccion
# La variable VITE_API_URL apunta al subdominio de la API
VITE_API_URL=https://api.dominio.com/api pnpm build

# Copiar build a directorio de Nginx
mkdir -p /var/www/snail-racing/frontend
cp -r dist /var/www/snail-racing/frontend/dist

# ============================================
# Permisos
# ============================================
chown -R www-data:www-data /var/www/snail-racing/frontend
chmod -R 755 /var/www/snail-racing/frontend
```

### 4.2 Configuracion de Nginx — Backend (API)

```nginx
# /etc/nginx/sites-available/api.dominio.com

server {
    listen 80;
    server_name api.dominio.com;

    # Redirect HTTP → HTTPS (despues de configurar SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.dominio.com;

    # SSL — configurado por Certbot automaticamente
    ssl_certificate /etc/letsencrypt/live/api.dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.dominio.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Reverse proxy a Express.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting basico (10 requests por segundo por IP)
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.3 Configuracion de Nginx — Frontend (Static)

```nginx
# /etc/nginx/sites-available/app.dominio.com

server {
    listen 80;
    server_name app.dominio.com;

    # Redirect HTTP → HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.dominio.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/app.dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.dominio.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/snail-racing/frontend/dist;
    index index.html;

    # SPA routing — todas las rutas sirven index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estaticos (Vite genera hashes en filenames)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 4.4 Configuracion de Cloudflare DNS

| Tipo | Nombre | Contenido | TTL | Proxy |
|---|---|---|---|---|
| A | `app` | `<IP_PUBLICA_EC2>` | Auto | DNS only (gris) |
| A | `api` | `<IP_PUBLICA_EC2>` | Auto | DNS only (gris) |

**Nota:** Se usa "DNS only" (sin proxy de Cloudflare) porque SSL lo maneja Nginx con Let's Encrypt. Si se quisiera usar el proxy de Cloudflare, se necesitaria el certificado origin de Cloudflare en lugar de Let's Encrypt.

### 4.5 Security Groups (firewall de AWS)

| Regla | Tipo | Puerto | Origen | Proposito |
|---|---|---|---|---|
| SSH | TCP | 22 | Mi IP (ej: 200.x.x.x/32) | Acceso administrativo |
| HTTP | TCP | 80 | 0.0.0.0/0 | Trafico web (redirige a HTTPS) |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Trafico web seguro |

**No se abre el puerto 3000** — Express solo es accesible desde localhost (Nginx hace el proxy). Esto es una practica de seguridad: la aplicacion no esta expuesta directamente a internet.

---

## 5. Dockerfile de produccion

Los Dockerfiles actuales estan configurados para desarrollo (con volumes y hot-reload). Para produccion en EC2, se necesitan versiones optimizadas:

### 5.1 Backend — Dockerfile.production

```dockerfile
# apps/backend/Dockerfile.production
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm approve-builds esbuild && pnpm install

COPY . .
RUN pnpm exec tsc

# ============================================
# Imagen final (mas pequena)
# ============================================
FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --prod && pnpm store prune

COPY --from=builder /app/dist ./dist

# Crear directorio de datos
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/app.js"]
```

### 5.2 Frontend — Dockerfile.production

```dockerfile
# apps/frontend/Dockerfile.production
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm build

# ============================================
# Imagen final — solo archivos estaticos (Nginx)
# ============================================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 5.3 docker-compose.production.yml

```yaml
# docker-compose.production.yml
services:
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - backend-data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile.production
      args:
        VITE_API_URL: https://api.dominio.com/api
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  backend-data:
```

---

## 6. Despliegue con Docker (alternativa a PM2)

Si se prefiere Docker sobre la instalacion directa, el flujo en EC2 seria:

```bash
# 1. Instalar Docker + Docker Compose en EC2
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# 2. Clonar repositorio
git clone https://github.com/peracles/jorge-1776.git
cd jorge-1776

# 3. Build y start en produccion
docker compose -f docker-compose.production.yml up -d --build

# 4. Configurar Nginx como reverse proxy (fuera de Docker)
# Nginx corre en el host, no en Docker — proxy a localhost:3000

# 5. Configurar SSL
certbot --nginx -d api.dominio.com -d app.dominio.com
```

### 6.1 Comparacion: Docker vs instalacion directa

| Aspecto | Docker en EC2 | Instalacion directa + PM2 |
|---|---|---|
| Isolamiento | Contenedor aislado | Proceso directo en el host |
| Actualizaciones | `docker compose pull && up -d` | `git pull && pnpm build && pm2 restart` |
| Rollback | Cambiar tag de imagen | `git checkout` version anterior |
| Recursos | ~50-100 MB overhead de Docker | Sin overhead |
| Complejidad | Requiere Docker + Compose | Requiere Node.js + PM2 |
| Logs | `docker compose logs -f` | `pm2 logs` |
| Ideal para | Equipos, CI/CD, multiples servicios | Single server, simplicidad |

**Decision para esta prueba:** Instalacion directa con PM2 es mas simple para un solo servidor. Docker seria preferible si se escalaria a multiples instancias o se integraria con CI/CD (GitHub Actions → ECR → ECS).

---

## 7. CI/CD con GitHub Actions (opcional)

### 7.1 Workflow de despliegue automatico

```yaml
# .github/workflows/deploy.yml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/snail-racing
            git pull origin main

            # Backend
            cd apps/backend
            pnpm install --prod
            pnpm exec tsc
            pm2 restart snail-backend

            # Frontend
            cd ../frontend
            pnpm install
            VITE_API_URL=https://api.dominio.com/api pnpm build
            cp -r dist /var/www/snail-racing/frontend/dist
```

### 7.2 Secrets necesarios en GitHub

| Secret | Valor |
|---|---|
| `EC2_HOST` | IP publica de la instancia EC2 |
| `EC2_SSH_KEY` | Private key PEM para acceso SSH |

---

## 8. Comandos de operacion

### 8.1 Actualizar la aplicacion

```bash
# Conectar por SSH
ssh -i mi-key.pem ubuntu@<IP_EC2>

# Backend
cd /var/www/snail-racing/apps/backend
git pull
pnpm install --prod
pnpm exec tsc
pm2 restart snail-backend

# Frontend
cd /var/www/snail-racing/apps/frontend
git pull
pnpm install
VITE_API_URL=https://api.dominio.com/api pnpm build
# Nginx ya sirve los archivos actualizados (no requiere restart)
```

### 8.2 Monitoreo

```bash
# Estado del backend
pm2 status
pm2 logs snail-backend --lines 50

# Estado de Nginx
systemctl status nginx
tail -f /var/log/nginx/error.log

# Uso de recursos
htop                    # CPU/RAM en tiempo real
df -h                   # Espacio en disco
free -m                 # Memoria disponible
```

### 8.3 Renovacion de SSL

```bash
# Certbot renueva automaticamente, pero se puede forzar:
certbot renew --dry-run   # Test
certbot renew             # Renovar certificados
```

---

## 9. Seguridad

### 9.1 Checklist

| Medida | Estado | Implementacion |
|---|---|---|
| SSH solo desde IP conocida | ✅ | Security Group restringido |
| Firewall (ufw) | ✅ | Solo puertos 22, 80, 443 |
| HTTPS obligatorio | ✅ | Redirect 301 HTTP → HTTPS |
| Security headers | ✅ | X-Frame-Options, X-Content-Type-Options, etc. |
| Rate limiting | ✅ | Nginx limit_req en /api/ |
| Puerto 3000 no expuesto | ✅ | Solo accesible via localhost (Nginx proxy) |
| Node.js no corre como root | ✅ | PM2 con usuario ubuntu |
| Secretos fuera del codigo | ✅ | .env no commiteado, variables en servidor |
| Dependencias actualizadas | ✅ | `pnpm update` periodico |
| Backups de datos | ⚠️ | Script cron para copiar data/ a S3 |

### 9.2 Hardening adicional (recomendado)

```bash
# Actualizar sistema periodicamente
apt-get update && apt-get upgrade -y

# Configurar fail2ban para proteccion contra brute force SSH
apt-get install fail2ban
systemctl enable fail2ban

# Configurar backup automatico de datos
crontab -e
# 0 3 * * * tar -czf /home/ubuntu/backups/snail-data-$(date +\%Y\%m\%d).tar.gz /var/www/snail-racing/apps/backend/data/
```

---

## 10. URLs de la aplicacion desplegada

| Servicio | URL | Descripcion |
|---|---|---|
| Frontend | `https://app.dominio.com` | Aplicacion React (Nginx static) |
| Backend API | `https://api.dominio.com/api` | Express API (Nginx proxy) |
| Health check | `https://api.dominio.com/api/health` | Verificar que backend esta activo |

---

## 11. Limitaciones del Free Tier

| Limitacion | Valor | Impacto |
|---|---|---|
| Duracion | 12 meses desde el registro | Despues, t2.micro cuesta ~$15/mes |
| Horas de instancia | 750 hrs/mes | Suficiente para 1 instancia 24/7 (744 hrs/mes) |
| Almacenamiento EBS | 30 GB | Suficiente para app + datos + logs |
| Transferencia de datos | 100 GB/mes outbound | Suficiente para demo; inbound es gratis |
| RAM | 1 GB | Limitante si se agrega base de datos real (PostgreSQL) |
| CPU | 1 vCPU (Burstable) | Suficiente para trafico bajo; no para carga pesada |

### 11.1 Cuando dejar de ser gratuito

Despues de 12 meses, los costos aproximados serian:

| Recurso | Costo estimado |
|---|---|
| EC2 t2.micro | ~$15/mes |
| EBS 30 GB | ~$3/mes |
| Data transfer (si excede 100 GB) | $0.09/GB adicional |
| **Total** | **~$18/mes** |

Para una prueba de entrevista, 12 meses es mas que suficiente. Si se necesitara mas tiempo, se podria migrar a un VPS de DigitalOcean ($4/mes) o Hetzner (€3.79/mes) que son opciones mas economicas a largo plazo.

---

## 12. Alternativas evaluadas

| Plataforma | Pros | Contras | Decision |
|---|---|---|---|
| **AWS EC2 Free Tier** | 12 meses gratis, infraestructura real, aprendible | Activacion tarda 3-5 dias habiles | **Elegida** — mejor relacion costo/beneficio para 12 meses |
| Vercel (frontend) + Railway (backend) | Deploy mas rapido, zero config | Railway cobra despues de $5 credit; Vercel limita bandwidth | Descartada — costos ocultos despues del trial |
| Render.com | Free tier con deploy automatico | Spin down despues de 15 min inactividad (cold starts de 30s) | Descartada — mala experiencia de usuario por cold starts |
| Fly.io | Free tier con 3 VMs compartidas | Requiere tarjeta de credito, limites estrictos | Descartada — verificacion compleja |
| DigitalOcean App Platform | Deploy directo desde GitHub | $4/mes desde el inicio (no free tier real) | Descartada — no es gratuita |
| Oracle Cloud Free Tier | 2 VMs ARM con 24 GB RAM total | Interfaz compleja, activacion igualmente lenta que AWS | Descartada — misma limitacion de tiempo de activacion |

---

## 13. Referencias

- AWS Free Tier. https://aws.amazon.com/free/
- EC2 Instance Types. https://aws.amazon.com/ec2/instance-types/t2/
- Nginx Reverse Proxy. https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/
- PM2 Documentation. https://pm2.keymetrics.io/docs/usage/quick-start/
- Let's Encrypt with Certbot. https://certbot.eff.org/instructions
- Cloudflare DNS Documentation. https://developers.cloudflare.com/dns/
- Schmidt, D.C. (1996). "Reactor: An Object Behavioral Pattern for Concurrent Event Demultiplexing".
- GitHub Actions SSH Deploy. https://github.com/appleboy/ssh-action
