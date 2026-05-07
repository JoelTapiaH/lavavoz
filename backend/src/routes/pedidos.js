const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../supabase');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── POST /api/pedidos ─────────────────────────────────────────────────────────
// Body: { transcript: string, sucursalId: string }
// Header: x-sucursal-id (opcional, puede venir en body o header)
router.post('/', async (req, res) => {
  const { transcript, sucursalId } = req.body;
  const sucursal = sucursalId || req.headers['x-sucursal-id'] || 'principal';

  if (!transcript || transcript.trim().length < 3) {
    return res.status(400).json({ error: 'El texto del pedido está vacío.' });
  }

  try {
    // 1️⃣ Llamar a Claude para interpretar el pedido
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: `Eres el asistente de una lavandería profesional.
Extrae los datos de pedidos dictados por voz y responde SOLO con JSON válido, sin markdown ni explicaciones.
Formato exacto:
{
  "numeroOrden": "número mencionado o null",
  "cliente": "nombre completo o Sin nombre",
  "telefono": "número o null",
  "prendas": [{"tipo": "camisa", "cantidad": 3}],
  "servicio": "lavado normal | lavado a mano | lavado en seco | planchado | lavado+planchado",
  "urgente": true,
  "horaEntrega": "HH:MM en formato 24h o null. Ejemplos: 'a las 3' → '15:00', 'a las 3 de la tarde' → '15:00', 'al mediodía' → '12:00', 'a las 8 de la mañana' → '08:00'",
  "notas": "instrucciones especiales o null",
  "totalPiezas": 3
}`,
      messages: [
        { role: 'user', content: `Pedido dictado: "${transcript}"` },
      ],
    });

    const rawText = message.content.find(b => b.type === 'text')?.text || '{}';
    const pedidoData = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    // 2️⃣ Guardar en Supabase
    const { data, error } = await supabase
      .from('pedidos')
      .insert([{
        sucursal_id: sucursal,
        cliente: pedidoData.cliente || 'Sin nombre',
        telefono: pedidoData.telefono || null,
        numero_orden_cliente: pedidoData.numeroOrden || null,
        servicio: pedidoData.servicio || 'lavado normal',
        prendas: pedidoData.prendas || [],
        total_piezas: pedidoData.totalPiezas || 0,
        urgente: pedidoData.urgente || false,
        hora_entrega: pedidoData.horaEntrega || null,
        notas: pedidoData.notas || null,
        transcript_original: transcript,
        estado: 'pendiente',
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, pedido: data });
  } catch (err) {
    console.error('Error procesando pedido:', err.message);
    res.status(500).json({ error: 'No se pudo procesar el pedido.' });
  }
});

// ── PATCH /api/pedidos/:id/estado ─────────────────────────────────────────────
// Body: { estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado' }
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'en_proceso', 'listo', 'entregado'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(404).json({ error: 'Pedido no encontrado.' });
  res.json({ ok: true, pedido: data });
});

// ── DELETE /api/pedidos/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(404).json({ error: 'Pedido no encontrado.' });
  res.json({ ok: true });
});

module.exports = router;
