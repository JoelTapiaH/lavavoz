-- ============================================================
-- LavoVoz — Schema para Supabase (PostgreSQL)
-- Ejecutar en: Supabase > SQL Editor > New Query
-- ============================================================

-- Tabla principal de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sucursal_id          TEXT NOT NULL DEFAULT 'principal',
  cliente              TEXT NOT NULL DEFAULT 'Sin nombre',
  telefono             TEXT,
  numero_orden_cliente TEXT,
  servicio             TEXT NOT NULL DEFAULT 'lavado normal',
  prendas              JSONB NOT NULL DEFAULT '[]',
  total_piezas         INTEGER NOT NULL DEFAULT 0,
  urgente              BOOLEAN NOT NULL DEFAULT false,
  notas                TEXT,
  transcript_original  TEXT,
  estado               TEXT NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente','en_proceso','listo','entregado')),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_pedidos_sucursal   ON pedidos (sucursal_id);
CREATE INDEX idx_pedidos_estado     ON pedidos (estado);
CREATE INDEX idx_pedidos_created_at ON pedidos (created_at DESC);
CREATE INDEX idx_pedidos_urgente    ON pedidos (urgente) WHERE urgente = true;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (deshabilitar para uso con service key)
-- ============================================================
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Datos de prueba (opcional, borrar en producción)
-- ============================================================
INSERT INTO pedidos (sucursal_id, cliente, servicio, prendas, total_piezas, urgente, estado)
VALUES
  ('principal', 'María López',  'lavado normal',  '[{"tipo":"camisa","cantidad":3}]', 3, false, 'pendiente'),
  ('principal', 'Juan Pérez',   'planchado',       '[{"tipo":"pantalón","cantidad":2}]', 2, true,  'en_proceso'),
  ('sucursal2', 'Ana Torres',   'lavado a mano',   '[{"tipo":"vestido","cantidad":1}]', 1, false, 'listo');
