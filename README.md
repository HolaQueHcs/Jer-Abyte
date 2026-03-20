# Jer Abyte — Panel Operativo

## Requisitos previos
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en Netlify, Railway o Vercel (nueva cuenta gratis)

---

## 1. Configurar Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto
2. Andá a **SQL Editor** y pegá todo el contenido de `scripts/001_create_tables.sql`
3. Ejecutalo — crea las tablas y permisos automáticamente
4. Andá a **Project Settings > API** y copiá:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Variables de entorno necesarias

Creá un archivo `.env.local` en la raíz del proyecto:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

En Netlify/Railway/Vercel estas variables se cargan desde el panel de configuración del proyecto.

---

## 3. Desplegar en Netlify (recomendado — gratis)

**Opción A — desde GitHub:**
1. Subí este proyecto a GitHub
2. En Netlify: New site > Import from Git
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Agregá las variables de entorno en Site Settings > Environment Variables

**Opción B — CLI:**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## 4. Desplegar en Railway (también gratis)

1. Entrá a [railway.app](https://railway.app)
2. New Project > Deploy from GitHub repo
3. Agregá las variables de entorno en Variables tab
4. Railway detecta Next.js automáticamente

---

## 5. Correr en local

```bash
npm install
# o
pnpm install

npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

## Cómo funciona el guardado

- **Inventario**: cada vez que agregás, modificás o eliminás un componente, se guarda automáticamente en Supabase
- **Ventas**: cada venta registrada se guarda en la tabla `ventas` y actualiza las métricas del día
- **PCs armadas**: al confirmar un armado, se descuenta el stock en Supabase y se registra la métrica
- **Sincronización entre dispositivos**: al iniciar sesión desde cualquier dispositivo, los datos se cargan desde Supabase

