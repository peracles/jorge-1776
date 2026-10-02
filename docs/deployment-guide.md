# Guia de Despliegue — AWS EC2 Free Tier

> Documento tecnico detallado del deploy ejecutado el 2026-10-02 en AWS EC2 t3.micro.
> Incluye explicacion de cada comando, problemas encontrados y soluciones aplicadas.

---

## 1. Arquitectura del Deploy

```
Internet
    ↓
Cloudflare DNS (snail.peracles.dev → IP EC2)
    ↓
EC2 t3.micro (Ubuntu 24.04 LTS)
    ↓
Nginx (puerto 80/443)
    ├─ / → /var/www/snail-racing (frontend estatico)
    └─ /api/* → localhost:3000 (Express backend)
         ↓
    PM2 + Node.js 24
         ↓
    JSON files (users.json, sessions.json)
```

### Costo: $0/mes

| Recurso | Free Tier | Uso |
|---|---|---|
| EC2 t3.micro | 750 hrs/mes (12 meses) | 1 instancia 24/7 = ~730 hrs |
| SSL | Let's Encrypt | Gratis |
| DNS | Cloudflare | Gratis |
| Dominio | peracles.dev (existente) | Subdominio snail.peracles.dev |

---

## 2. Paso a Paso Detallado

### PASO 1: Configuracion de AWS

#### 1.1 Crear cuenta AWS

**Comando:** N/A (via navegador en aws.amazon.com)

**Que hace:** Crea una cuenta en AWS con tarjeta de credito para verificacion. No se cobra nada durante los primeros 12 meses si se mantiene dentro del Free Tier.

**Por que:** Necesitamos una cuenta AWS para acceder a EC2.

---

#### 1.2 Crear Key Pair

**Comando:** N/A (via AWS Console → EC2 → Key Pairs → Create Key Pair)

**Configuracion:**
- Nombre: `snail-racing-key`
- Tipo: RSA
- Formato: `.pem` (para OpenSSH) o `.ppk` (para PuTTY)

**Que hace:** Genera un par de claves criptograficas (publica/privada). La clave publica se almacena en AWS y se usa para verificar la identidad del servidor. La clave privada se descarga y se usa para autenticarse desde tu maquina.

**Por que:** SSH requiere autenticacion por clave en EC2 (no permite password por seguridad).

**Nota:** El archivo `.pem` solo se descarga una vez. Si se pierde, hay que crear un nuevo Key Pair.

---

#### 1.3 Convertir .pem a .ppk (solo para PuTTY en Windows)

**Herramienta:** PuTTYgen (descargar de putty.org)

**Pasos:**
1. Abrir PuTTYgen
2. Click en "Load" → seleccionar archivo `.pem`
3. Click en "Save private key" → guardar como `.ppk`

**Que hace:** Convierte el formato de clave de OpenSSH (.pem) al formato de PuTTY (.ppk). Ambos formatos contienen la misma clave privada pero en formatos diferentes.

**Por que:** PuTTY no puede leer archivos `.pem` directamente. Si usas OpenSSH desde PowerShell, no necesitas esta conversion.

---

#### 1.4 Crear Security Group

**Comando:** N/A (via AWS Console → EC2 → Security Groups → Create Security Group)

**Configuracion:**
- Nombre: `snail-racing-sg`
- Reglas de entrada (Inbound Rules):

| Tipo | Puerto | Origen | Proposito |
|---|---|---|---|
| SSH | 22 | Tu IP (201.173.64.222/32) | Acceso admin |
| HTTP | 80 | 0.0.0.0/0 | Trafico web |
| HTTPS | 443 | 0.0.0.0/0 | Trafico web SSL |

**Reglas de salida (Outbound):** Dejar por defecto (allow all)

**Que hace:** Un Security Group es un firewall virtual que controla que trafico puede entrar y salir de la instancia EC2.

**Por que:**
- **SSH puerto 22:** Necesario para conectarse al servidor y configurarlo. Restringido a tu IP para que nadie mas pueda entrar.
- **HTTP puerto 80:** Necesario para que los usuarios accedan a la app via HTTP. Nginx escucha en este puerto.
- **HTTPS puerto 443:** Necesario para que los usuarios accedan via HTTPS (SSL). Nginx escucha en este puerto despues de configurar Certbot.
- **Outbound allow all:** El servidor necesita salir para descargar paquetes (`apt install`, `npm install`), clonar el repo de GitHub, y comunicarse con Let's Encrypt para renovar el SSL.

**Alternativas descartadas:**
- Abrir SSH a 0.0.0.0/0: **Descartado** — permitiria que cualquiera intente conectarse por SSH (ataques de fuerza bruta)
- No abrir HTTP/HTTPS: **Descartado** — nadie podria acceder a la app

---

#### 1.5 Lanzar instancia EC2

**Comando:** N/A (via AWS Console → EC2 → Instances → Launch Instance)

**Configuracion:**
- Nombre: `snail-racing-server`
- AMI: Ubuntu 24.04 LTS (ami-0b6d9d333ba97d99)
- Instance type: **t3.micro** (2 vCPU, 1 GB RAM)
- Key pair: `snail-racing-key`
- Security group: `snail-racing-sg`
- Storage: 8 GiB gp3 (dentro del limite de 30 GB del Free Tier)

**Que hace:** Lanza una maquina virtual en la nube de AWS con Ubuntu 24.04.

**Por que t3.micro en lugar de t2.micro:**
- AWS actualizo el Free Tier en 2024 — el t2.micro ya no esta incluido
- El t3.micro es la generacion actual (t2 es de 2014)
- t3.micro tiene **2 vCPU** en lugar de 1 (mejor performance)
- Mismo costo: $0/mes dentro del Free Tier

**Por que Ubuntu 24.04:**
- LTS (Long Term Support) — soporte hasta 2029
- AMI oficial de Canonical optimizada para EC2
- SSH viene pre-configurado y habilitado por defecto
- Compatibilidad con todos los paquetes que necesitamos (Node.js, Nginx, Certbot)

---

#### 1.6 Obtener IP publica

**Comando:** N/A (via AWS Console → EC2 → Instances → copiar "Public IPv4 address")

**Que hace:** La IP publica es la direccion de internet de tu servidor. Es como el numero de telefono de tu servidor — sin ella, nadie puede conectarse.

**Nota importante:** Si detienes y reinicias la instancia, la IP publica **cambia**. Para evitar esto, se puede asignar una **Elastic IP** (gratis mientras este asociada a una instancia corriendo).

---

### PASO 2: Conectarse al servidor por SSH

#### Opcion A: OpenSSH (PowerShell en Windows 10/11)

**Comando:**
```bash
ssh -i "C:\ruta\a\snail-racing-key.pem" ubuntu@TU_IP_PUBLICA
```

**Que hace cada parte:**
- `ssh`: Cliente SSH (incluido en Windows 10/11)
- `-i "C:\ruta\a\snail-racing-key.pem"`: Especifica el archivo de clave privada para autenticacion
- `ubuntu@TU_IP_PUBLICA`: Usuario `ubuntu` (default en EC2 Ubuntu) + IP publica del servidor

**Por que el usuario es `ubuntu`:** Las AMIs de Ubuntu en EC2 vienen configuradas con el usuario `ubuntu` por defecto (no `root` ni `ec2-user`). El usuario `ubuntu` tiene permisos `sudo` configurados.

**Por que tenemos `sudo` desde el principio:** El usuario `ubuntu` en EC2 viene pre-configurado en el grupo `sudo` con permisos `NOPASSWD` para ciertos comandos. Esto es una decision de diseno de Canonical/Amazon para facilitar la administracion inicial. En un servidor de produccion real, se recomendaria crear un usuario separado y restringir permisos, pero para una demo es aceptable.

---

#### Opcion B: PuTTY

**Configuracion:**
1. Host Name: `ubuntu@TU_IP_PUBLICA`
2. Port: 22
3. Connection → SSH → Auth → Credentials → Private key file: `snail-racing-key.ppk`
4. Click en "Open"

**Que hace:** PuTTY es un cliente SSH grafico para Windows. Es equivalente a OpenSSH pero con interfaz grafica.

**Por que PuTTY en lugar de OpenSSH:** Preferencia personal. Ambos hacen lo mismo. OpenSSH es mas simple (un solo comando), PuTTY requiere configuracion grafica pero permite guardar sesiones.

---

### PASO 3: Configurar el servidor

> Todos los comandos de aqui en adelante se ejecutan **dentro del servidor EC2** via SSH.

#### 3.1 Actualizar sistema

**Comando:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Que hace cada parte:**
- `sudo`: Ejecuta el comando con permisos de root (administrador)
- `apt update`: Actualiza la lista de paquetes disponibles desde los repositorios de Ubuntu. **No instala nada**, solo descarga la lista de versiones disponibles.
- `&&`: Operador logico "AND" — ejecuta el siguiente comando solo si el anterior fue exitoso
- `apt upgrade -y`: Instala las versiones mas recientes de todos los paquetes ya instalados. El flag `-y` responde "yes" automaticamente a las confirmaciones.

**Por que:** Es buena practica actualizar el sistema antes de instalar software nuevo. Esto asegura que tengamos las ultimas versiones de seguridad y compatibilidad.

**Alternativas descartadas:**
- `apt full-upgrade`: **Descartado** — puede eliminar paquetes si es necesario para resolver dependencias, muy agresivo para un servidor nuevo
- `apt dist-upgrade`: **Descartado** — similar a full-upgrade, puede cambiar dependencias criticas

---

#### 3.2 Instalar Node.js 24.x

**Comando:**
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

**Que hace cada parte:**
- `curl -fsSL https://deb.nodesource.com/setup_24.x`: Descarga el script de instalacion de NodeSource para Node.js 24
  - `-f`: Fail silently on server errors (no mostrar errores HTTP)
  - `-s`: Silent mode (no mostrar barra de progreso)
  - `-S`: Show errors (mostrar errores si fallan)
  - `-L`: Follow redirects (seguir redirecciones HTTP)
- `|`: Pipe — pasa la salida del comando anterior como entrada al siguiente
- `sudo -E bash -`: Ejecuta el script descargado con permisos de root, preservando variables de entorno (`-E`)
- `sudo apt install -y nodejs`: Instala Node.js (que incluye npm)
- `node -v` y `npm -v`: Verifican la instalacion mostrando las versiones

**Por que NodeSource en lugar de `apt install nodejs`:**
- Los repositorios oficiales de Ubuntu tienen versiones antiguas de Node.js (18.x o 20.x)
- NodeSource mantiene repositorios actualizados con las ultimas versiones LTS
- Nuestro proyecto requiere Node.js 24.x (especificado en el README)

**Alternativas descartadas:**
- `nvm` (Node Version Manager): **Descartado** — util para desarrollo local con multiples versiones, pero innecesario en produccion donde solo necesitamos una version
- Instalar desde codigo fuente: **Descartado** — mas complejo, requiere compilar, innecesario cuando existen repositorios pre-compilados

---

#### 3.3 Instalar pnpm

**Comando:**
```bash
sudo corepack enable
sudo corepack prepare pnpm@12.5.1 --activate
pnpm -v
```

**Que hace cada parte:**
- `sudo corepack enable`: Habilita Corepack, un gestor de package managers incluido con Node.js 16.10+. Crea symlinks en `/usr/bin/` para `pnpm`, `yarn`, etc.
- `sudo corepack prepare pnpm@12.5.1 --activate`: Descarga e instala pnpm version 12.5.1 especificamente, y lo activa como el package manager por defecto
- `pnpm -v`: Verifica la instalacion mostrando la version

**Por que `sudo` en corepack:**
- `corepack enable` necesita crear symlinks en `/usr/bin/`, que es un directorio del sistema que requiere permisos de root
- Sin `sudo`, falla con error: `EACCES: permission denied, symlink '../lib/node_modules/corepack/dist/pnpm.js' -> '/usr/bin/pnpm'`

**Problema encontrado:**
```
Internal Error: EACCES: permission denied, symlink '../lib/node_modules/corepack/dist/pnpm.js' -> '/usr/bin/pnpm'
```

**Causa:** El comando `corepack enable` sin `sudo` intenta crear un symlink en `/usr/bin/`, que es propiedad de root. El usuario `ubuntu` no tiene permisos de escritura en ese directorio.

**Solucion:** Agregar `sudo` al comando: `sudo corepack enable`

**Por que pnpm en lugar de npm:**
- pnpm es 2-3x mas rapido que npm gracias a su estrategia de hard links
- Ahorra ~40-60% de espacio en disco comparado con npm
- Soporte nativo de workspaces para monorepos
- Ya lo usamos en desarrollo local, mantener consistencia

---

#### 3.4 Instalar Nginx

**Comando:**
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

**Que hace cada parte:**
- `sudo apt install -y nginx`: Instala Nginx desde los repositorios de Ubuntu
- `sudo systemctl enable nginx`: Configura Nginx para que inicie automaticamente al reiniciar el servidor
- `sudo systemctl start nginx`: Inicia el servicio Nginx inmediatamente
- `sudo systemctl status nginx`: Muestra el estado actual del servicio (activo/inactivo, errores, logs recientes)

**Que es Nginx:**
Nginx (pronunciado "engine-x") es un servidor web y reverse proxy de alto rendimiento. Es el segundo servidor web mas usado del mundo (despues de Apache), powering ~33% de todos los sitios web.

**Por que Nginx en lugar de Apache:**
- **Performance:** Nginx usa un modelo asincrono basado en eventos (patron reactor), mientras que Apache usa un modelo por conexion (process-per-connection). Para aplicaciones Node.js, Nginx es mas eficiente porque maneja miles de conexiones concurrentes con un solo thread.
- **Reverse proxy:** Nginx es excelente como reverse proxy (reenviar peticiones a otro servidor). Apache puede hacerlo pero con mas configuracion.
- **Static files:** Nginx sirve archivos estaticos (HTML, CSS, JS) mas rapido que Apache gracias a su implementacion de sendfile() y aio.
- **Configuracion:** La sintaxis de Nginx es mas limpia y facil de entender que la de Apache (.htaccess).

**Alternativas descartadas:**
- Apache: **Descartado** — mas pesado, modelo por conexion menos eficiente para Node.js
- Caddy: **Descartado** — SSL automatico integrado pero menos documentado, comunidad mas pequena
- Servir directamente desde Node.js: **Descartado** — Node.js no es eficiente sirviendo archivos estaticos, mejor dejar que Nginx lo haga

---

#### 3.5 Instalar PM2

**Comando:**
```bash
sudo npm install -g pm2
pm2 -v
```

**Que hace cada parte:**
- `sudo npm install -g pm2`: Instala PM2 globalmente (`-g`) en el sistema
- `pm2 -v`: Verifica la instalacion mostrando la version

**Que es PM2:**
PM2 es un process manager para aplicaciones Node.js. Mantiene la aplicacion corriendo en background, la reinicia automaticamente si falla, y proporciona gestion de logs.

**Por que PM2 en lugar de `node app.js` o `nohup`:**
- **Auto-restart:** Si la app crashea, PM2 la reinicia automaticamente. Con `node app.js`, si crashea, se queda abajo hasta que alguien la reinicie manualmente.
- **Log management:** PM2 captura stdout/stderr y lo guarda en archivos de log rotados. Con `nohup`, los logs se mezclan y no se rotan.
- **Zero-downtime restart:** PM2 puede reiniciar la app sin downtime (cluster mode). Con `kill` + `start`, hay downtime.
- **Monitoring:** PM2 proporciona comandos como `pm2 status`, `pm2 logs`, `pm2 monit` para monitorear la app.
- **Startup scripts:** `pm2 startup` genera un script de systemd para que las apps inicien automaticamente al reiniciar el servidor.

**Alternativas descartadas:**
- `systemd` directamente: **Descartado** — mas complejo de configurar, PM2 es mas simple para apps Node.js
- `forever`: **Descartado** — proyecto menos mantenido, PM2 es el standard actual
- `nodemon`: **Descartado** — solo para desarrollo (hot-reload), no para produccion

---

#### 3.6 Instalar Git

**Comando:**
```bash
sudo apt install -y git
git --version
```

**Que hace:** Instala Git para poder clonar el repositorio desde GitHub.

**Por que:** Necesitamos Git para descargar el codigo del proyecto. Podriamos descargar un ZIP desde GitHub, pero Git nos permite hacer `git pull` para actualizaciones futuras.

---

#### 3.7 Instalar Certbot

**Comando:**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

**Que hace:**
- `certbot`: Cliente de Let's Encrypt para generar certificados SSL
- `python3-certbot-nginx`: Plugin de Certbot que modifica automaticamente la configuracion de Nginx para usar SSL

**Que es Let's Encrypt:**
Let's Encrypt es una autoridad certificadora (CA) gratuita, automatizada y abierta. Proporciona certificados SSL/TLS gratuitos que son validos por 90 dias y se pueden renovar automaticamente.

**Por que Let's Encrypt en lugar de certificados pagos:**
- **Gratis:** $0 vs $50-200/año de certificados comerciales
- **Valido:** Los certificados de Let's Encrypt son reconocidos por todos los navegadores modernos
- **Automatizado:** Certbot puede renovar automaticamente los certificados antes de que expiren
- **Suficiente:** Para una demo/aplicacion personal, no necesitamos validacion extendida (EV) que ofrecen los certificados pagos

**Alternativas descartadas:**
- Certificado autofirmado: **Descartado** — los navegadores muestran advertencia de seguridad, mala experiencia de usuario
- Cloudflare SSL: **Descartado** — requiere activar proxy de Cloudflare (nube naranja), queremos SSL directo en el servidor inicialmente

---

### PASO 4: Clonar el proyecto

**Comando:**
```bash
cd /home/ubuntu
git clone https://github.com/peracles/jorge-1776.git
cd jorge-1776
ls
```

**Que hace cada parte:**
- `cd /home/ubuntu`: Cambia al directorio home del usuario `ubuntu`
- `git clone https://github.com/peracles/jorge-1776.git`: Descarga una copia completa del repositorio desde GitHub
- `cd jorge-1776`: Entra al directorio del proyecto clonado
- `ls`: Lista los archivos para verificar que el clone fue exitoso

**Por que `/home/ubuntu`:**
- Es el directorio home del usuario `ubuntu`
- Tiene permisos de escritura para el usuario `ubuntu` (no requiere `sudo`)
- Es una ubicacion estandar para proyectos en servidores Linux

**Alternativas descartadas:**
- `/var/www/jorge-1776`: **Descartado** — requiere `sudo` para escribir, menos conveniente para desarrollo
- `/opt/jorge-1776`: **Descartado** — convencion para software de terceros, no para proyectos personales

---

### PASO 5: Configurar y buildear el backend

#### 5.1 Crear archivo .env de produccion

**Comando:**
```bash
cd /home/ubuntu/jorge-1776/apps/backend

cat > .env << 'EOF'
PORT=3000
CORS_ORIGINS=https://snail.peracles.dev
SESSION_DURATION_HOURS=24
NODE_ENV=production
EOF
```

**Que hace cada parte:**
- `cat > .env << 'EOF'`: Crea un archivo `.env` con el contenido que sigue hasta encontrar `EOF`
- `PORT=3000`: Puerto en el que el backend escucha
- `CORS_ORIGINS=https://snail.peracles.dev`: Origen permitido para CORS (Cross-Origin Resource Sharing). Solo este dominio puede hacer peticiones al backend.
- `SESSION_DURATION_HOURS=24`: Duracion de las sesiones de usuario en horas
- `NODE_ENV=production`: Variable de entorno que indica a Node.js que estamos en produccion (habilita optimizaciones, deshabilita logs de desarrollo)

**Por que un subdominio (`snail.peracles.dev`) en lugar del dominio raiz:**
- El dominio raiz `peracles.dev` ya tiene una landing page hosteada en Cloudflare Pages
- Usar un subdominio permite tener ambas aplicaciones coexistiendo sin interferencia
- Los subdominios son "gratis" — ya pagamos el dominio, podemos crear infinitos subdominios

**Por que `cat > .env << 'EOF'` en lugar de `echo`:**
- `cat << 'EOF'` (heredoc) permite escribir multiples lineas de forma legible
- Las comillas simples alrededor de `'EOF'` previenen la expansion de variables (si el contenido tuviera `$VAR`, no se expandiria)
- `echo` solo puede escribir una linea a la vez, requeriria multiples comandos o `\n`

---

#### 5.2 Instalar dependencias y buildear

**Comando:**
```bash
pnpm install
pnpm build
pnpm prune --prod
```

**Que hace cada parte:**
- `pnpm install`: Instala todas las dependencias (incluyendo `devDependencies` como TypeScript, Vitest, etc.)
- `pnpm build`: Ejecuta el script `build` del `package.json`, que corre `tsc` (TypeScript compiler) para compilar `.ts` a `.js` en la carpeta `dist/`
- `pnpm prune --prod`: Elimina las `devDependencies` del `node_modules` para ahorrar espacio en disco

**Problema encontrado:**
```
$ tsc
sh: 1: tsc: not found
```

**Causa:** Inicialmente use `pnpm install --prod`, que solo instala dependencias de produccion (excluye `devDependencies`). Pero TypeScript (`tsc`) esta en `devDependencies`, entonces no estaba disponible para el build.

**Solucion:**
1. `pnpm install` (sin `--prod`) — instala TODO, incluyendo TypeScript
2. `pnpm build` — ahora `tsc` esta disponible y puede compilar
3. `pnpm prune --prod` — elimina las devDependencies despues del build para ahorrar espacio

**Por que no dejar las devDependencies instaladas:**
- Ocupan espacio en disco innecesario en produccion (~200-300 MB extra)
- No se usan en runtime (solo se necesitan para compilar/testear)
- Buena practica de seguridad: menos codigo = menor superficie de ataque

---

#### 5.3 Crear directorio de datos y archivos JSON

**Comando:**
```bash
mkdir -p /home/ubuntu/jorge-1776/apps/backend/data

cat > /home/ubuntu/jorge-1776/apps/backend/data/users.json << 'EOF'
{
  "users": []
}
EOF

cat > /home/ubuntu/jorge-1776/apps/backend/data/sessions.json << 'EOF'
{
  "sessions": []
}
EOF
```

**Que hace:**
- `mkdir -p`: Crea el directorio `data/` (el flag `-p` no falla si ya existe)
- Crea `users.json` con estructura `{ "users": [] }` (objeto con array vacio)
- Crea `sessions.json` con estructura `{ "sessions": [] }` (objeto con array vacio)

**Problema encontrado:**
```
TypeError: Cannot read properties of undefined (reading 'find')
at Object.findByEmail (/home/ubuntu/jorge-1776/apps/backend/src/models/user.ts:31:29)
```

**Causa:** Inicialmente cree los archivos JSON con `echo '[]' > users.json`, que produce un array directo `[]`. Pero el codigo del backend espera un objeto con propiedad `users`:

```typescript
// src/models/user.ts
const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
return data.users.find(u => u.email === email); // data.users es undefined si el archivo es []
```

Cuando el archivo contiene `[]`, `data` es un array, no un objeto. Entonces `data.users` es `undefined`, y llamar `.find()` en `undefined` lanza el error.

**Solucion:** Crear los archivos con la estructura correcta:
```json
{
  "users": []
}
```

**Por que los archivos JSON no se clonan desde Git:**
- El archivo `.gitignore` excluye `data/*.json` para no commitear datos sensibles (usuarios reales, sesiones)
- En desarrollo local, los archivos se crean automaticamente la primera vez que el backend escribe
- En produccion, necesitamos crearlos manualmente la primera vez

---

#### 5.4 Iniciar backend con PM2

**Comando:**
```bash
cd /home/ubuntu/jorge-1776/apps/backend
pm2 start dist/app.js --name "snail-backend"
pm2 save
pm2 startup
```

**Que hace cada parte:**
- `pm2 start dist/app.js --name "snail-backend"`: Inicia la aplicacion Node.js en background con PM2, asignandole el nombre "snail-backend" para identificarla facilmente
- `pm2 save`: Guarda la lista de procesos actuales en `~/.pm2/dump.pm2`. Esto permite que PM2 recuerde que apps debe iniciar al reiniciar el servidor.
- `pm2 startup`: Genera un comando de systemd que configura PM2 para iniciar automaticamente al boot del servidor. El comando generado debe copiarse y ejecutarse.

**Por que `dist/app.js` en lugar de `src/app.ts`:**
- En produccion, corremos el codigo compilado (JavaScript), no el codigo fuente (TypeScript)
- `pnpm build` compila `src/**/*.ts` a `dist/**/*.js`
- Correr JavaScript es mas rapido que correr TypeScript (no necesita transpilacion en runtime)
- En desarrollo usamos `tsx watch src/app.ts` para hot-reload, pero en produccion no necesitamos watch

**Comando de `pm2 startup`:**
El comando generado se ve algo asi:
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Este comando crea un servicio de systemd que ejecuta `pm2 resurrect` al iniciar el servidor, lo cual carga los procesos guardados con `pm2 save`.

---

#### 5.5 Verificar backend

**Comando:**
```bash
curl http://localhost:3000/api/health
```

**Que hace:** Hace una peticion HTTP GET al endpoint de health check del backend.

**Respuesta esperada:**
```json
{"status":"ok"}
```

**Por que `localhost` en lugar de la IP publica:**
- Estamos ejecutando el comando **dentro del servidor**, entonces `localhost` se refiere al propio servidor
- Usar la IP publica desde dentro del servidor funcionaria pero es innecesario y mas lento (la peticion saldria a internet y volveria)
- Este test verifica que el backend esta corriendo correctamente antes de exponerlo a internet

---

### PASO 6: Buildear el frontend

#### 6.1 Crear .env.production

**Comando:**
```bash
cd /home/ubuntu/jorge-1776/apps/frontend

cat > .env.production << 'EOF'
VITE_API_URL=https://snail.peracles.dev/api
EOF
```

**Que hace:**
- Crea un archivo `.env.production` que Vite usa durante el build de produccion
- `VITE_API_URL` es la URL base de la API backend. El frontend usa esta variable para hacer peticiones a la API.

**Por que `.env.production` en lugar de `.env`:**
- Vite soporta multiples archivos de entorno: `.env` (todos los ambientes), `.env.local` (override local), `.env.production` (solo produccion), `.env.development` (solo desarrollo)
- En desarrollo, el frontend usa `VITE_API_URL=http://localhost:3000/api` (desde `.env`)
- En produccion, el frontend usa `VITE_API_URL=https://snail.peracles.dev/api` (desde `.env.production`)
- Esto permite que el mismo codigo funcione en ambos ambientes sin cambios

**Por que la URL es absoluta (`https://snail.peracles.dev/api`) en lugar de relativa (`/api`):**
- En realidad, podria ser relativa porque el frontend y el backend estan en el mismo dominio
- Pero usar URL absoluta es mas explicito y facilita cambiar el backend de dominio en el futuro
- Ademas, Vite reemplaza `import.meta.env.VITE_API_URL` en build time, entonces no hay overhead en runtime

---

#### 6.2 Build de produccion

**Comando:**
```bash
pnpm install
pnpm build
```

**Que hace:**
- `pnpm install`: Instala todas las dependencias (incluyendo devDependencies como Vite, TypeScript, etc.)
- `pnpm build`: Ejecuta `tsc -b && vite build`
  - `tsc -b`: Compila TypeScript en modo "build" (incremental, mas rapido)
  - `vite build`: Buildea el frontend para produccion (minifica CSS/JS, optimiza assets, genera hash en filenames para cache busting)

**Resultado:**
Se genera la carpeta `dist/` con archivos estaticos optimizados:
```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js      (JavaScript minificado con hash)
│   ├── index-def456.css     (CSS minificado con hash)
│   └── ...
├── favicon.svg
└── icons.svg
```

**Por que los archivos tienen hash en el nombre:**
- El hash (ej: `abc123`) cambia cuando el contenido cambia
- Esto permite cache aggressivo en el navegador: si el hash no cambia, el navegador usa la version cacheada
- Si el contenido cambia, el hash cambia, y el navegador descarga la nueva version
- Esto se llama "cache busting" y es una buena practica de performance

---

#### 6.3 Copiar archivos estaticos a Nginx

**Comando:**
```bash
sudo mkdir -p /var/www/snail-racing
sudo cp -r dist/* /var/www/snail-racing/
sudo chown -R www-data:www-data /var/www/snail-racing
```

**Que hace cada parte:**
- `sudo mkdir -p /var/www/snail-racing`: Crea el directorio donde Nginx servira los archivos estaticos. `/var/www/` es la ubicacion estandar para sitios web en Linux.
- `sudo cp -r dist/* /var/www/snail-racing/`: Copia todos los archivos del build (`dist/`) al directorio de Nginx. El flag `-r` es para recursivo (copiar subdirectorios como `assets/`).
- `sudo chown -R www-data:www-data /var/www/snail-racing`: Cambia el propietario de los archivos a `www-data` (el usuario que corre Nginx). El flag `-R` es para recursivo.

**Por que `/var/www/` en lugar de `/home/ubuntu/`:**
- `/var/www/` es la convencion estandar en Linux para sitios web
- Nginx por defecto busca sitios en `/var/www/`
- Permisos mas controlados: solo `www-data` puede escribir, otros usuarios solo leer
- Separacion de responsabilidades: codigo del proyecto en `/home/ubuntu/`, archivos servidos en `/var/www/`

**Por que cambiar propietario a `www-data`:**
- Nginx corre bajo el usuario `www-data` por seguridad (no corre como root)
- Si los archivos son propiedad de `ubuntu`, Nginx podria no tener permisos de lectura
- Cambiar a `www-data` asegura que Nginx pueda leer los archivos sin problemas

---

### PASO 7: Configurar Nginx

#### 7.1 Crear configuracion de Nginx

**Comando:**
```bash
sudo tee /etc/nginx/sites-available/snail-racing << 'EOF'
server {
    listen 80;
    server_name snail.peracles.dev;

    root /var/www/snail-racing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

**Explicacion de cada directiva:**

**`server { ... }`:**
- Define un "server block" (bloque de servidor) en Nginx
- Cada server block maneja un dominio o subdominio diferente
- Podemos tener multiples server blocks en un solo servidor Nginx

**`listen 80;`:**
- Indica que este server block escucha en el puerto 80 (HTTP)
- Despues de configurar SSL, Certbot agrega `listen 443 ssl;` para HTTPS

**`server_name snail.peracles.dev;`:**
- Especifica que este server block responde solo a peticiones para `snail.peracles.dev`
- Si alguien accede a la IP directa o a otro dominio, este server block no responde
- Esto permite hostear multiples sitios en un solo servidor (virtual hosting)

**`root /var/www/snail-racing;`:**
- Define el directorio raiz donde Nginx busca los archivos estaticos
- Cuando alguien pide `https://snail.peracles.dev/index.html`, Nginx busca en `/var/www/snail-racing/index.html`

**`index index.html;`:**
- Define el archivo por defecto cuando se pide un directorio
- Si alguien pide `https://snail.peracles.dev/`, Nginx sirve `/var/www/snail-racing/index.html`

**`location / { try_files $uri $uri/ /index.html; }`:**
- Maneja todas las peticiones a rutas del frontend
- `try_files` intenta servir el archivo exacto (`$uri`), luego el directorio (`$uri/`), y si ninguno existe, sirve `index.html`
- Esto es necesario para SPAs (Single Page Applications) como React: todas las rutas (`/login`, `/register`, `/dashboard`) deben servir `index.html` para que React Router maneje la navegacion del lado del cliente
- Sin esto, si alguien recarga la pagina en `/dashboard`, Nginx buscaria `/var/www/snail-racing/dashboard` que no existe, y daria 404

**`location /api/ { ... }`:**
- Maneja todas las peticiones que empiezan con `/api/`
- Estas peticiones se reenvian al backend Express en `localhost:3000`

**`proxy_pass http://localhost:3000;`:**
- Reenvia la peticion al backend
- Nginx actua como "reverse proxy": recibe la peticion del cliente, la reenvia al backend, y devuelve la respuesta al cliente

**`proxy_http_version 1.1;`:**
- Usa HTTP/1.1 para la conexion con el backend (en lugar de HTTP/1.0 por defecto)
- HTTP/1.1 soporta keep-alive (reutilizar conexiones), lo cual es mas eficiente

**`proxy_set_header Upgrade $http_upgrade;` y `proxy_set_header Connection 'upgrade';`:**
- Permite WebSocket upgrades (necesario para hot-reload en desarrollo, no critical en produccion pero buena practica)

**`proxy_set_header Host $host;`:**
- Pasa el header `Host` original al backend
- Sin esto, el backend veria `Host: localhost:3000` en lugar de `Host: snail.peracles.dev`

**`proxy_set_header X-Real-IP $remote_addr;`:**
- Pasa la IP real del cliente al backend
- Sin esto, el backend veria la IP de Nginx (127.0.0.1) en lugar de la IP del cliente

**`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`:**
- Header estandar para rastrear la IP original del cliente a traves de proxies
- Si hay multiples proxies, este header acumula todas las IPs

**`proxy_set_header X-Forwarded-Proto $scheme;`:**
- Indica al backend si la peticion original fue HTTP o HTTPS
- Necesario porque Nginx maneja SSL, entonces la conexion entre Nginx y backend es HTTP, pero la peticion original del cliente fue HTTPS

**`proxy_cache_bypass $http_upgrade;`:**
- No cachea peticiones WebSocket (upgrade)

---

**Problema encontrado con `sudo cat >`:**
```
-bash: /etc/nginx/sites-available/snail-racing: Permission denied
```

**Causa:**
Cuando ejecutas `sudo cat > /etc/nginx/sites-available/snail-racing`, el shell procesa el redirect `>` **antes** de ejecutar `cat`. El redirect se ejecuta con permisos del usuario actual (`ubuntu`), no con `sudo`. Entonces falla porque `ubuntu` no tiene permisos de escritura en `/etc/nginx/`.

**Solucion:**
Usar `sudo tee` en lugar de `sudo cat >`:
```bash
sudo tee /etc/nginx/sites-available/snail-racing << 'EOF'
contenido
EOF
```

`tee` escribe el contenido tanto a stdout como al archivo. Con `sudo`, `tee` tiene permisos de root para escribir en `/etc/nginx/`.

**Por que `cat >` funciona sin `sudo` en `/home/ubuntu/` pero no en `/etc/nginx/`:**
- `/home/ubuntu/` es propiedad del usuario `ubuntu` — tiene permisos de escritura
- `/etc/nginx/` es propiedad de `root` — solo root puede escribir
- El redirect `>` siempre se ejecuta con permisos del usuario actual, no con `sudo`

---

#### 7.2 Habilitar el sitio

**Comando:**
```bash
sudo ln -s /etc/nginx/sites-available/snail-racing /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

**Que hace cada parte:**
- `sudo ln -s ...`: Crea un symlink (enlace simbolico) desde `sites-enabled/` a `sites-available/`. Nginx lee todos los archivos en `sites-enabled/` para determinar que sitios estan activos.
- `sudo rm -f /etc/nginx/sites-enabled/default`: Elimina el sitio por defecto de Nginx (pagina de bienvenida). El flag `-f` no falla si el archivo no existe.
- `sudo nginx -t`: Testea la configuracion de Nginx para verificar que no hay errores de sintaxis.
- `sudo systemctl reload nginx`: Recarga la configuracion de Nginx sin interrumpir las conexiones activas (zero-downtime reload).

**Por que symlink en lugar de copiar el archivo:**
- Permite tener el archivo original en `sites-available/` y multiples symlinks en `sites-enabled/` si es necesario
- Facilita deshabilitar un sitio: solo se elimina el symlink, no el archivo original
- Es la convencion estandar de Nginx en Debian/Ubuntu

**Por que eliminar el sitio `default`:**
- El sitio default de Nginx escucha en el puerto 80 para cualquier dominio que no tenga un server block especifico
- Si no se elimina, podria interceptar peticiones antes de que lleguen a nuestro server block
- Ademas, muestra la pagina de bienvenida de Nginx, que no queremos

---

**Problema encontrado:**
```
ln: failed to create symbolic link '/etc/nginx/sites-enabled/snail-racing': File exists
```

**Causa:**
El symlink ya existia de un intento anterior. `ln` por defecto no sobrescribe archivos existentes.

**Solucion:**
```bash
sudo rm -f /etc/nginx/sites-enabled/snail-racing
sudo ln -s /etc/nginx/sites-available/snail-racing /etc/nginx/sites-enabled/
```

O usar el flag `-f` de `ln`:
```bash
sudo ln -sf /etc/nginx/sites-available/snail-racing /etc/nginx/sites-enabled/
```

---

### PASO 8: Configurar DNS en Cloudflare

**Comando:** N/A (via Cloudflare Dashboard → DNS → Records → Add record)

**Configuracion:**
- Type: A
- Name: `snail`
- IPv4 address: `TU_IP_PUBLICA_EC2`
- Proxy status: DNS only (gris)

**Que hace:**
- Crea un registro DNS tipo A que mapea `snail.peracles.dev` a la IP publica de la instancia EC2
- Cuando alguien visita `snail.peracles.dev`, su navegador consulta el DNS de Cloudflare, que devuelve la IP de EC2
- El navegador entonces se conecta a esa IP

**Por que "DNS only" (nube gris) en lugar de "Proxied" (nube naranja):**
- **DNS only:** Cloudflare solo resuelve el DNS, el trafico va directo a EC2. Necesario para que Certbot pueda verificar el dominio (Certbot necesita conectarse directamente al servidor en puerto 80).
- **Proxied:** Cloudflare actua como proxy CDN, el trafico pasa por los servidores de Cloudflare antes de llegar a EC2. Proporciona CDN, proteccion DDoS, y SSL automatico de Cloudflare.

**Secuencia correcta:**
1. Inicialmente: DNS only (nube gris) para que Certbot funcione
2. Despues de configurar SSL: Se puede activar Proxied (nube naranja) para CDN y proteccion DDoS

**Por que no activar Proxied desde el inicio:**
- Certbot necesita verificar que el dominio apunta al servidor conectandose directamente en puerto 80
- Si Cloudflare esta en modo Proxied, la conexion pasa por Cloudflare, y Certbot no puede verificar el dominio
- Despues de que SSL esta configurado, se puede activar Proxied sin problemas

---

### PASO 9: SSL con Certbot

**Comando:**
```bash
sudo certbot --nginx -d snail.peracles.dev
```

**Que hace:**
1. Verifica que el dominio `snail.peracles.dev` apunta al servidor (hace una peticion HTTP al puerto 80)
2. Se comunica con Let's Encrypt para generar un certificado SSL
3. Modifica automaticamente la configuracion de Nginx para usar SSL (agrega `listen 443 ssl;`, rutas a certificados, etc.)
4. Configura redirect automatico HTTP → HTTPS
5. Configura auto-renovacion con un cron job o systemd timer

**Interaccion interactiva:**
1. **Email:** Ingresa tu email para notificaciones de renovacion y seguridad
2. **Terminos:** Acepta los terminos de servicio de Let's Encrypt (escribe `A`)
3. **EFF:** Opcionalmente comparte tu email con Electronic Frontier Foundation (escribe `N` para no)
4. **Redirect:** Elige si redirect HTTP a HTTPS (escribe `2` para redirect automatico)

**Problema encontrado:**
```
Frontend returns 404: curl -I http://localhost → HTTP/1.1 404 Not Found
```

**Causa:**
Certbot agrego un segundo server block al final del archivo de configuracion:
```nginx
server {
    server_name snail.peracles.dev;
    return 404; # managed by Certbot
}
```

Este server block duplicado interceptaba todas las peticiones antes de que el server block principal (con SSL y proxy) pudiera manejarlas.

**Por que pasa esto:**
Certbot a veces crea un server block de "fallback" para manejar casos edge. Pero en nuestra configuracion, este fallback intercepta todas las peticiones porque Nginx procesa los server blocks en orden y el ultimo con `server_name` matching gana.

**Solucion:**
Editar manualmente `/etc/nginx/sites-available/snail-racing` para tener:
1. **Un server block** para HTTP (puerto 80) + HTTPS (puerto 443) con SSL inline
2. **Un server block de redirect** de Certbot para HTTP→HTTPS

Configuracion correcta:
```nginx
server {
    listen 80;
    listen 443 ssl; # managed by Certbot
    server_name snail.peracles.dev;

    root /var/www/snail-racing;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/snail.peracles.dev/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/snail.peracles.dev/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        # ... proxy headers ...
    }
}

server {
    if ($host = snail.peracles.dev) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name snail.peracles.dev;
    return 404; # managed by Certbot
}
```

**Por que esta solucion funciona:**
- El primer server block maneja tanto HTTP como HTTPS (gracias a `listen 80;` y `listen 443 ssl;`)
- Las directivas SSL estan inline en el mismo server block
- El segundo server block solo sirve para redirect HTTP→HTTPS (cuando alguien accede por HTTP, lo redirect a HTTPS)
- No hay duplicacion de server blocks que puedan interceptar peticiones

---

#### 9.1 Verificar auto-renovacion

**Comando:**
```bash
sudo certbot renew --dry-run
```

**Que hace:**
- Simula la renovacion del certificado SSL sin realmente renovarlo
- Verifica que el proceso de renovacion automatica funcionara cuando el certificado expire (en 90 dias)

**Por que es importante:**
- Los certificados de Let's Encrypt expiran cada 90 dias
- Si la renovacion automatica falla, el certificado expira y los navegadores muestran advertencia de seguridad
- Este test asegura que la renovacion funcionara sin intervencion manual

**Como funciona la renovacion automatica:**
- Certbot instala un cron job o systemd timer que corre `certbot renew` dos veces al dia
- Si el certificado esta por expirar (menos de 30 dias), lo renueva automaticamente
- Si no, no hace nada
- Este proceso es completamente automatico y no requiere intervencion manual

---

### PASO 10: Verificar el deploy

**Comandos:**
```bash
# Backend health check
curl http://localhost:3000/api/health

# Frontend servido por Nginx
curl -I http://localhost

# API proxy a traves de Nginx
curl https://snail.peracles.dev/api/health
```

**Que verifica cada comando:**
1. **Backend health check:** Verifica que el backend Express esta corriendo y respondiendo en `localhost:3000`
2. **Frontend servido por Nginx:** Verifica que Nginx esta sirviendo el frontend estatico correctamente (deberia devolver `HTTP/1.1 200 OK`)
3. **API proxy:** Verifica que Nginx esta reenviando peticiones `/api/*` al backend correctamente (deberia devolver `{"status":"ok"}`)

**Respuestas esperadas:**
```bash
# Backend health check
{"status":"ok"}

# Frontend servido por Nginx
HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Content-Type: text/html
...

# API proxy
{"status":"ok"}
```

**Verificacion final en navegador:**
Abre https://snail.peracles.dev en tu navegador. Deberias ver:
- La app cargando correctamente
- Certificado SSL valido (candado verde en la barra de direccion)
- Registro y login funcionando
- Dashboard accesible despues de login

---

### PASO 11: Script de deploy para actualizaciones futuras

**Comando:**
```bash
cat > /home/ubuntu/deploy.sh << 'SCRIPT'
#!/bin/bash
set -e

echo "=== Snail Racing Deploy ==="
cd /home/ubuntu/jorge-1776

git pull origin main

echo "--- Building backend ---"
cd apps/backend
pnpm install
pnpm build
pnpm prune --prod
pm2 restart snail-backend

echo "--- Building frontend ---"
cd ../frontend
pnpm install
pnpm build
sudo cp -r dist/* /var/www/snail-racing/
sudo chown -R www-data:www-data /var/www/snail-racing

echo "=== Deploy complete ==="
SCRIPT

chmod +x /home/ubuntu/deploy.sh
```

**Que hace cada parte:**
- `#!/bin/bash`: Shebang — indica que este script debe ejecutarse con Bash
- `set -e`: Sale inmediatamente si cualquier comando falla (evita continuar con errores)
- `git pull origin main`: Descarga los ultimos cambios de la rama `main`
- `pnpm install && pnpm build && pnpm prune --prod`: Instala, buildea y limpia dependencias del backend
- `pm2 restart snail-backend`: Reinicia el backend con PM2 para aplicar los cambios (zero-downtime restart)
- `pnpm install && pnpm build`: Instala y buildea el frontend
- `sudo cp -r dist/* /var/www/snail-racing/`: Copia los archivos estaticos al directorio de Nginx
- `sudo chown -R www-data:www-data`: Ajusta permisos
- `chmod +x deploy.sh`: Hace el script ejecutable

**Como usarlo:**
```bash
./deploy.sh
```

**Por que un script en lugar de comandos manuales:**
- **Repetibilidad:** Mismos pasos cada vez, sin olvidar ninguno
- **Velocidad:** Un solo comando en lugar de 10+
- **Consistencia:** Reduce errores humanos
- **Documentacion:** El script sirve como documentacion del proceso de deploy

**Alternativas descartadas:**
- CI/CD con GitHub Actions: **Descartado** — requiere configurar secrets de SSH, workflow files, mas complejo para una demo
- Docker Compose: **Descartado** — ya tenemos PM2 funcionando, Docker agregaria complejidad innecesaria

---

## 3. Comandos utiles para mantenimiento

### PM2

```bash
# Ver status de procesos
pm2 status

# Ver logs en tiempo real
pm2 logs snail-backend

# Reiniciar backend
pm2 restart snail-backend

# Detener backend
pm2 stop snail-backend

# Monitoreo en tiempo real (CPU, memoria)
pm2 monit
```

### Nginx

```bash
# Testear configuracion
sudo nginx -t

# Recargar configuracion (zero-downtime)
sudo systemctl reload nginx

# Reiniciar Nginx (con downtime breve)
sudo systemctl restart nginx

# Ver logs de error
sudo tail -f /var/log/nginx/error.log

# Ver logs de acceso
sudo tail -f /var/log/nginx/access.log
```

### SSL

```bash
# Verificar renovacion
sudo certbot renew --dry-run

# Ver certificados instalados
sudo certbot certificates

# Forzar renovacion (solo si es necesario)
sudo certbot renew --force-renewal
```

### Sistema

```bash
# Ver espacio en disco
df -h

# Ver uso de memoria
free -h

# Ver procesos corriendo
ps aux | grep node

# Ver puertos abiertos
sudo netstat -tulpn | grep -E '80|443|3000'
```

---

## 4. Arquitectura y Justificacion Tecnica

### 4.1 Por que Nginx como reverse proxy

**Patron:** Reverse Proxy (Nginx) + Application Server (Node.js)

**Justificacion teorica:**
- **Separacion de responsabilidades:** Nginx es excelente sirviendo archivos estaticos y manejando SSL. Node.js es excelente ejecutando logica de aplicacion. Combinarlos permite que cada uno haga lo que mejor sabe hacer.
- **Performance:** Nginx usa el patron reactor (Schmidt 1996) con epoll en Linux, que es O(1) por evento. Esto permite manejar miles de conexiones concurrentes con un solo thread. Node.js tambien es single-threaded con event loop, pero no es tan eficiente sirviendo archivos estaticos como Nginx.
- **SSL termination:** Nginx maneja SSL/TLS, liberando a Node.js de la carga computacional de encriptacion/desencriptacion. Esto es importante porque SSL puede consumir ~10-15% de CPU.
- **Load balancing (futuro):** Si la app crece, Nginx puede distribuir trafico a multiples instancias de Node.js sin cambios en el codigo de la app.

**Alternativas descartadas:**
- Node.js directo en puerto 80/443: **Descartado** — Node.js no es eficiente sirviendo archivos estaticos, manejar SSL en Node.js requiere codigo adicional, no hay load balancing nativo
- Apache: **Descartado** — modelo por conexion (process-per-connection) menos eficiente que Nginx para aplicaciones Node.js
- Caddy: **Descartado** — SSL automatico integrado pero menos documentado, comunidad mas pequena, menos usado en produccion

---

### 4.2 Por que PM2 como process manager

**Justificacion teorica:**
- **Process management:** PM2 mantiene la aplicacion corriendo en background, la reinicia si falla, y proporciona log management.
- **Zero-downtime restarts:** PM2 puede reiniciar la aplicacion sin interrumpir peticiones en curso (cluster mode).
- **Startup scripts:** PM2 genera scripts de systemd para iniciar automaticamente al boot del servidor.
- **Monitoring:** PM2 proporciona metrics de CPU, memoria, y logs en tiempo real.

**Alternativas descartadas:**
- systemd directamente: **Descartado** — mas complejo de configurar, PM2 es mas simple para apps Node.js
- forever: **Descartado** — proyecto menos mantenido, PM2 es el standard actual
- nodemon: **Descartado** — solo para desarrollo (hot-reload), no para produccion

---

### 4.3 Por que Let's Encrypt para SSL

**Justificacion teorica:**
- **Gratuito:** $0 vs $50-200/año de certificados comerciales
- **Valido:** Reconocido por todos los navegadores modernos
- **Automatizado:** Renovacion automatica cada 90 dias sin intervencion manual
- **ACME protocol:** Let's Encrypt usa el protocolo ACME (RFC 8555) para automatizar la emision y renovacion de certificados

**Alternativas descartadas:**
- Certificado autofirmado: **Descartado** — navegadores muestran advertencia de seguridad
- Cloudflare SSL: **Descartado** — requiere activar proxy de Cloudflare, queremos SSL directo inicialmente
- Certificados pagos (DigiCert, Let's Encrypt Plus): **Descartado** — innecesario para una demo, no necesitamos validacion extendida (EV)

---

### 4.4 Por que subdominio en lugar de dominio raiz

**Justificacion:**
- El dominio raiz `peracles.dev` ya tiene una landing page hosteada en Cloudflare Pages
- Usar un subdominio (`snail.peracles.dev`) permite tener ambas aplicaciones coexistiendo sin interferencia
- Los subdominios son "gratis" — ya pagamos el dominio, podemos crear infinitos subdominios
- Aislamiento: si la app de snail racing tiene problemas, no afecta la landing page principal

**Alternativas descartadas:**
- Reemplazar la landing page: **Descartado** — la landing page es importante para el portfolio de Jorge
- Path-based routing (`peracles.dev/snail/`): **Descartado** — mas complejo de configurar, requiere cambios en la landing page y en el frontend de snail racing

---

## 5. Problemas Encontrados y Soluciones

### 5.1 `tsc: not found` al hacer build

**Error:**
```
$ tsc
sh: 1: tsc: not found
```

**Causa:**
Use `pnpm install --prod`, que solo instala dependencias de produccion (excluye `devDependencies`). Pero TypeScript (`tsc`) esta en `devDependencies`, entonces no estaba disponible.

**Solucion:**
```bash
pnpm install              # Instala TODO, incluyendo TypeScript
pnpm build                # Ahora tsc esta disponible
pnpm prune --prod         # Elimina devDependencies despues del build
```

**Leccion:**
En produccion, necesitamos las devDependencies para el build, pero no para runtime. La secuencia correcta es: instalar todo → buildear → limpiar.

---

### 5.2 `Permission denied` al escribir en `/etc/nginx/`

**Error:**
```
-bash: /etc/nginx/sites-available/snail-racing: Permission denied
```

**Causa:**
`sudo cat > /etc/nginx/sites-available/snail-racing` no funciona porque el shell procesa el redirect `>` **antes** de ejecutar `cat`. El redirect se ejecuta con permisos del usuario actual (`ubuntu`), no con `sudo`.

**Explicacion tecnica:**
Cuando escribes `sudo cat > archivo`, el shell:
1. Primero procesa el redirect `>` y abre el archivo con permisos del usuario actual
2. Luego ejecuta `sudo cat` con permisos de root
3. `cat` escribe a stdout, que el shell redirige al archivo abierto en el paso 1
4. Pero el archivo se abrio con permisos de `ubuntu`, no de root → Permission denied

**Solucion:**
Usar `sudo tee` en lugar de `sudo cat >`:
```bash
sudo tee /etc/nginx/sites-available/snail-racing << 'EOF'
contenido
EOF
```

`tee` escribe el contenido tanto a stdout como al archivo. Con `sudo`, `tee` tiene permisos de root para escribir en `/etc/nginx/`.

**Leccion:**
En Linux, los redirects de shell (`>`, `>>`) siempre se ejecutan con permisos del usuario actual, no con `sudo`. Para escribir en archivos protegidos, usar `sudo tee` o `sudo bash -c 'cat > archivo'`.

---

### 5.3 Certbot creo server block duplicado con `return 404`

**Error:**
```
Frontend returns 404: curl -I http://localhost → HTTP/1.1 404 Not Found
```

**Causa:**
Certbot agrego un segundo server block al final del archivo:
```nginx
server {
    server_name snail.peracles.dev;
    return 404; # managed by Certbot
}
```

Este server block interceptaba todas las peticiones antes de que el server block principal pudiera manejarlas.

**Por que pasa esto:**
Certbot a veces crea un server block de "fallback" para manejar casos edge. Nginx procesa los server blocks en orden, y el ultimo con `server_name` matching puede ganar dependiendo de la configuracion.

**Solucion:**
Editar manualmente `/etc/nginx/sites-available/snail-racing` para tener un solo server block con SSL inline:
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name snail.peracles.dev;
    
    ssl_certificate /etc/letsencrypt/live/snail.peracles.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/snail.peracles.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # ... resto de la configuracion ...
}
```

**Leccion:**
Certbot no siempre genera la configuracion optima. Es importante revisar la configuracion de Nginx despues de correr Certbot y ajustar si es necesario.

---

### 5.4 Error 500 en registro/login — archivos JSON con estructura incorrecta

**Error:**
```
TypeError: Cannot read properties of undefined (reading 'find')
at Object.findByEmail (/home/ubuntu/jorge-1776/apps/backend/src/models/user.ts:31:29)
```

**Causa:**
Cree los archivos JSON con `echo '[]' > users.json`, que produce:
```json
[]
```

Pero el codigo del backend espera:
```json
{
  "users": []
}
```

Cuando el archivo contiene `[]`, `data` es un array, no un objeto. Entonces `data.users` es `undefined`, y llamar `.find()` en `undefined` lanza el error.

**Codigo problematico:**
```typescript
// src/models/user.ts
const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
return data.users.find(u => u.email === email); // data.users es undefined si el archivo es []
```

**Solucion:**
Crear los archivos con la estructura correcta:
```bash
cat > users.json << 'EOF'
{
  "users": []
}
EOF
```

**Leccion:**
Siempre verificar la estructura de datos que el codigo espera antes de crear archivos de inicializacion. Los archivos JSON de persistencia deben coincidir exactamente con el schema que el codigo asume.

---

## 6. Notas Adicionales

### 6.1 Por que tenemos `sudo` desde el principio

El usuario `ubuntu` en EC2 viene pre-configurado en el grupo `sudo` con permisos `NOPASSWD` para ciertos comandos. Esto es una decision de diseno de Canonical/Amazon para facilitar la administracion inicial.

**Configuracion en `/etc/sudoers`:**
```
ubuntu ALL=(ALL) NOPASSWD:ALL
```

Esto permite que el usuario `ubuntu` ejecute cualquier comando con `sudo` sin ingresar password.

**Por que es aceptable para una demo:**
- Es una instancia de prueba, no un servidor de produccion real
- El acceso SSH esta restringido a una sola IP (la de Jorge)
- No hay datos sensibles en el servidor (solo datos de demo)

**Para un servidor de produccion real:**
- Crear un usuario separado con permisos limitados
- Restringir `sudo` a comandos especificos
- Usar SSH keys con passphrase
- Implementar 2FA para SSH
- Usar un bastion host o VPN para acceso admin

---

### 6.2 Elastic IP (opcional)

Si detienes y reinicias la instancia EC2, la IP publica cambia. Para evitar esto, puedes asignar una **Elastic IP**:

1. Ve a **EC2 → Elastic IPs → Allocate Elastic IP address**
2. Selecciona la instancia y haz clic en **Associate**

**Costo:**
- Gratis mientras este asociada a una instancia corriendo
- $0.005/hora si esta asociada a una instancia detenida (~$3.60/mes)

**Por que no la usamos:**
- Para una demo, no es necesario
- Podemos simplemente verificar la IP publica antes de conectarnos
- Si la IP cambia, solo hay que actualizar el registro DNS en Cloudflare

---

### 6.3 Monitoreo y Alertas

**PM2:**
```bash
pm2 monit              # Monitoreo en tiempo real (CPU, memoria, logs)
pm2 logs snail-backend # Logs en tiempo real
pm2 status             # Status de todos los procesos
```

**Nginx:**
```bash
sudo tail -f /var/log/nginx/error.log   # Errores de Nginx
sudo tail -f /var/log/nginx/access.log  # Acceso a Nginx
```

**Sistema:**
```bash
df -h                   # Espacio en disco
free -h                 # Uso de memoria
top                     # Procesos en tiempo real
```

**AWS CloudWatch (opcional):**
- AWS proporciona metrics basicos de EC2 gratis (CPU, network, disk)
- Para alertas personalizadas, se necesita CloudWatch Alerts (costo adicional minimo)

---

## 7. Resumen de Comandos

### Setup inicial del servidor
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@12.5.1 --activate
sudo apt install -y nginx git certbot python3-certbot-nginx
sudo npm install -g pm2
```

### Clonar y configurar proyecto
```bash
cd /home/ubuntu
git clone https://github.com/peracles/jorge-1776.git
cd jorge-1776/apps/backend

cat > .env << 'EOF'
PORT=3000
CORS_ORIGINS=https://snail.peracles.dev
SESSION_DURATION_HOURS=24
NODE_ENV=production
EOF

pnpm install
pnpm build
pnpm prune --prod

mkdir -p data
cat > data/users.json << 'EOF'
{ "users": [] }
EOF
cat > data/sessions.json << 'EOF'
{ "sessions": [] }
EOF

pm2 start dist/app.js --name "snail-backend"
pm2 save
pm2 startup
```

### Frontend
```bash
cd /home/ubuntu/jorge-1776/apps/frontend

cat > .env.production << 'EOF'
VITE_API_URL=https://snail.peracles.dev/api
EOF

pnpm install
pnpm build

sudo mkdir -p /var/www/snail-racing
sudo cp -r dist/* /var/www/snail-racing/
sudo chown -R www-data:www-data /var/www/snail-racing
```

### Nginx
```bash
sudo tee /etc/nginx/sites-available/snail-racing << 'EOF'
server {
    listen 80;
    server_name snail.peracles.dev;
    root /var/www/snail-racing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/snail-racing /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### SSL
```bash
sudo certbot --nginx -d snail.peracles.dev
sudo certbot renew --dry-run
```

### Deploy de actualizaciones
```bash
cd /home/ubuntu/jorge-1776
git pull origin main

cd apps/backend
pnpm install && pnpm build && pnpm prune --prod
pm2 restart snail-backend

cd ../frontend
pnpm install && pnpm build
sudo cp -r dist/* /var/www/snail-racing/
sudo chown -R www-data:www-data /var/www/snail-racing
```

---

## 8. Referencias

- **Nginx Documentation:** https://nginx.org/en/docs/
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Let's Encrypt / Certbot:** https://letsencrypt.org/
- **AWS EC2 Free Tier:** https://aws.amazon.com/free/
- **Cloudflare DNS:** https://www.cloudflare.com/dns/
- **NodeSource:** https://nodesource.com/
- **Corepack:** https://nodejs.org/api/corepack.html
- **Patron Reactor (Schmidt 1996):** https://www.cs.wustl.edu/~schmidt/PDF/reactor-siemens.pdf
- **ACME Protocol (RFC 8555):** https://tools.ietf.org/html/rfc8555
