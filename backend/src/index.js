require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const pedidosRouter = require('./routes/pedidos');
const historialRouter = require('./routes/historial');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:5500',
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-sucursal-id'],
}));

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(express.json());

// Rate limit: 60 requests / minuto por IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Demasiadas solicitudes, espera un momento.' },
});
app.use(limiter);

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/pedidos', pedidosRouter);
app.use('/api/historial', historialRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`LavoVoz backend corriendo en puerto ${PORT}`);
});
