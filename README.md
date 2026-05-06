# LavoVoz — Sistema de Pedidos por Voz para Lavandería

## Estructura del proyecto

```
lavovoz/
├── frontend/
│   ├── index.html       ← App completa (1 archivo)
│   └── vercel.json      ← Config de Vercel
├── backend/
│   ├── src/
│   │   ├── index.js          ← Servidor Express
│   │   ├── supabase.js       ← Cliente de base de datos
│   │   └── routes/
│   │       ├── pedidos.js    ← POST/PATCH/DELETE pedidos
│   │       └── historial.js  ← GET historial y resumen
│   ├── schema.sql       ← SQL para crear la tabla en Supabase
│   ├── package.json
│   ├── railway.toml     ← Config de Railway
│   └── .env.example     ← Variables de entorno de ejemplo
└── .gitignore
```

---

## PASO 1 — Crear cuenta en GitHub y subir el código

1. Crea cuenta en https://github.com si no tienes
2. Crea un repositorio nuevo llamado `lavovoz`
3. En tu computadora, abre una terminal y ejecuta:

```bash
cd lavovoz
git init
git add .
git commit -m "primer commit lavovoz"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/lavovoz.git
git push -u origin main
```

---

## PASO 2 — Configurar Supabase (base de datos)

1. Ve a https://supabase.com y crea cuenta gratis
2. Crea un nuevo proyecto (elige región: South America)
3. Espera ~2 minutos a que el proyecto esté listo
4. Ve a **SQL Editor** > **New Query**
5. Pega el contenido de `backend/schema.sql` y presiona **Run**
6. Ve a **Settings** > **API** y copia:
   - `Project URL` → será tu `SUPABASE_URL`
   - `service_role` (secret) → será tu `SUPABASE_SERVICE_KEY`

---

## PASO 3 — Obtener API Key de Anthropic (Claude)

1. Ve a https://console.anthropic.com
2. Crea cuenta y ve a **API Keys**
3. Crea una nueva key → cópiala
4. Recarga créditos: mínimo $5 (dura meses con el uso de una lavandería)

---

## PASO 4 — Desplegar el Backend en Railway

1. Ve a https://railway.app y crea cuenta (puedes entrar con GitHub)
2. Clic en **New Project** > **Deploy from GitHub repo**
3. Selecciona tu repositorio `lavovoz`
4. Cuando te pregunte qué carpeta, selecciona `backend/`
5. Railway detecta automáticamente Node.js
6. Ve a **Variables** y agrega estas variables de entorno:

```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxx
SUPABASE_URL      = https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY = eyxxxxxxxxxxxxxxxxx
FRONTEND_URL      = https://lavovoz.vercel.app   (lo cambias después)
PORT              = 3001
```

7. Railway despliega automáticamente. Copia la URL que te da, ejemplo:
   `https://lavovoz-production.railway.app`

---

## PASO 5 — Desplegar el Frontend en Vercel

1. Ve a https://vercel.com y crea cuenta con GitHub
2. Clic en **Add New Project**
3. Importa tu repositorio `lavovoz`
4. En **Root Directory** escribe `frontend`
5. Clic en **Deploy**
6. Vercel te da una URL, ejemplo: `https://lavovoz.vercel.app`

---

## PASO 6 — Conectar Frontend con Backend

1. Abre `frontend/index.html`
2. Busca esta línea (aprox. línea 200):
   ```js
   : 'https://TU-BACKEND.railway.app/api';  // ← reemplazar
   ```
3. Reemplaza `TU-BACKEND.railway.app` por tu URL real de Railway
4. Guarda, haz commit y push:
   ```bash
   git add .
   git commit -m "conectar frontend con backend"
   git push
   ```
5. Vercel redespliega automáticamente en 30 segundos

---

## PASO 7 — Actualizar FRONTEND_URL en Railway

1. Ve a Railway > tu proyecto > Variables
2. Cambia `FRONTEND_URL` por tu URL real de Vercel
3. Railway redespliega automáticamente

---

## USO DEL SISTEMA

- Abre la URL de Vercel en Chrome o Edge (no Safari)
- Selecciona la sucursal en el menú superior
- Presiona el micrófono y dicta el pedido
- Presiona "Registrar pedido"
- El pedido aparece en el panel derecho con estado "Pendiente"
- Cambia el estado desde el dropdown de cada tarjeta
- Descarga el CSV con el botón "⬇ CSV"

---

## Costo estimado mensual

| Servicio   | Plan     | Costo    |
|------------|----------|----------|
| Vercel     | Hobby    | GRATIS   |
| Railway    | Starter  | GRATIS   |
| Supabase   | Free     | GRATIS   |
| Claude API | Pay/uso  | ~$5-9/mes|
| **Total**  |          | **~$5-9/mes** |

---

## Problemas frecuentes

**"Error de CORS"** → Verifica que `FRONTEND_URL` en Railway tenga tu URL exacta de Vercel (sin slash al final)

**"No se pudo procesar el pedido"** → Verifica que `ANTHROPIC_API_KEY` esté correcto en Railway

**"Error de base de datos"** → Verifica `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`. Asegúrate de haber ejecutado el `schema.sql`

**Micrófono no funciona** → Usa Chrome o Edge. La URL debe ser HTTPS (Vercel la provee automáticamente)
# lavavoz
