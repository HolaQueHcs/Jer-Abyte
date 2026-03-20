-- ============================================================
-- JER ABYTE — Script de base de datos completo
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- Tabla de inventario/stock
CREATE TABLE IF NOT EXISTS public.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  precio NUMERIC(12,2) NOT NULL DEFAULT 0,
  minimo INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de armados de PC
CREATE TABLE IF NOT EXISTS public.armados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  componentes JSONB NOT NULL DEFAULT '[]',
  costo_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_venta NUMERIC(12,2) NOT NULL DEFAULT 0,
  margen NUMERIC(5,2) NOT NULL DEFAULT 25,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS public.ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT,
  monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  costo NUMERIC(12,2) NOT NULL DEFAULT 0,
  ganancia NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de metricas diarias
CREATE TABLE IF NOT EXISTS public.metricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  ventas_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  ganancia_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  pc_armadas INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fecha)
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas ENABLE ROW LEVEL SECURITY;

-- Stock: cualquier usuario autenticado puede leer y escribir
CREATE POLICY "stock_select" ON public.stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_insert" ON public.stock FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stock_update" ON public.stock FOR UPDATE TO authenticated USING (true);
CREATE POLICY "stock_delete" ON public.stock FOR DELETE TO authenticated USING (true);

-- Armados
CREATE POLICY "armados_select" ON public.armados FOR SELECT TO authenticated USING (true);
CREATE POLICY "armados_insert" ON public.armados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "armados_update" ON public.armados FOR UPDATE TO authenticated USING (true);
CREATE POLICY "armados_delete" ON public.armados FOR DELETE TO authenticated USING (true);

-- Ventas
CREATE POLICY "ventas_select" ON public.ventas FOR SELECT TO authenticated USING (true);
CREATE POLICY "ventas_insert" ON public.ventas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ventas_update" ON public.ventas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ventas_delete" ON public.ventas FOR DELETE TO authenticated USING (true);

-- Metricas
CREATE POLICY "metricas_select" ON public.metricas FOR SELECT TO authenticated USING (true);
CREATE POLICY "metricas_insert" ON public.metricas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "metricas_update" ON public.metricas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "metricas_delete" ON public.metricas FOR DELETE TO authenticated USING (true);
