const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// ── GET /api/historial ────────────────────────────────────────────────────────
// Query params: sucursal, estado, fecha_desde, fecha_hasta, page, limit
router.get('/', async (req, res) => {
  const {
    sucursal,
    estado,
    fecha_desde,
    fecha_hasta,
    page = 1,
    limit = 50,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('pedidos')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (sucursal) query = query.eq('sucursal_id', sucursal);
  if (estado) query = query.eq('estado', estado);
  if (fecha_desde) query = query.gte('created_at', fecha_desde);
  if (fecha_hasta) query = query.lte('created_at', fecha_hasta + 'T23:59:59');

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    pedidos: data,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / parseInt(limit)),
  });
});

// ── GET /api/historial/resumen ────────────────────────────────────────────────
// Resumen del día: total pedidos, piezas, urgentes
router.get('/resumen', async (req, res) => {
  const { sucursal } = req.query;
  const now = new Date();
  const hoy = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  let query = supabase
    .from('pedidos')
    .select('estado, urgente, total_piezas')
    .gte('created_at', hoy + 'T00:00:00-05:00');

  if (sucursal) query = query.eq('sucursal_id', sucursal);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const resumen = {
    totalPedidos: data.length,
    totalPiezas: data.reduce((s, p) => s + (p.total_piezas || 0), 0),
    urgentes: data.filter(p => p.urgente).length,
    pendientes: data.filter(p => p.estado === 'pendiente').length,
    en_proceso: data.filter(p => p.estado === 'en_proceso').length,
    listos: data.filter(p => p.estado === 'listo').length,
    entregados: data.filter(p => p.estado === 'entregado').length,
  };

  res.json(resumen);
});

module.exports = router;
