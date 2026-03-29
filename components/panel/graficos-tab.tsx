"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrendingDown, TrendingUp, Wallet, Plus, Trash2, Package } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import { createClient } from "@/lib/supabase/client"
import type { StockItem } from "@/app/page"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface GraficosTabProps {
  stock: StockItem[]
  totalVendido: number
  totalCosto: number
  gananciaTotal: number
  invertidoStock: number
}

interface Inversion {
  id: string
  descripcion: string
  monto: number
  created_at: string
}

export function GraficosTab({ stock, totalVendido, totalCosto, gananciaTotal, invertidoStock }: GraficosTabProps) {
  const supabase = createClient()
  const [inversiones, setInversiones] = useState<Inversion[]>([])
  const [desc, setDesc] = useState("")
  const [monto, setMonto] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => { cargarInversiones() }, [])

  const cargarInversiones = async () => {
    const { data } = await supabase.from("inversiones").select("*").order("created_at", { ascending: false })
    if (data) setInversiones(data)
  }

  const agregarInversion = async () => {
    if (!desc.trim() || !monto) return
    setGuardando(true)
    await supabase.from("inversiones").insert({ descripcion: desc.trim(), monto: parseFloat(monto) || 0 })
    setDesc(""); setMonto("")
    setMostrarForm(false)
    await cargarInversiones()
    setGuardando(false)
  }

  const eliminarInversion = async (id: string) => {
    await supabase.from("inversiones").delete().eq("id", id)
    await cargarInversiones()
  }

  const totalInvertido = inversiones.reduce((s, i) => s + i.monto, 0)

  const barData = [
    { name: 'Vendido', value: totalVendido, fill: '#10b981' },
    { name: 'Costo', value: totalCosto, fill: '#ef4444' },
    { name: 'Ganancia', value: gananciaTotal, fill: '#3b82f6' },
  ]

  const resumenData = [
    { name: 'Total invertido', value: totalInvertido, fill: '#ef4444' },
    { name: 'Stock actual', value: invertidoStock, fill: '#f59e0b' },
    { name: 'Vendido', value: totalVendido, fill: '#10b981' },
  ]

  const cats = [...new Set(stock.map(s => s.cat))]
  const stockPorCategoria = cats.map(cat => ({
    name: cat,
    value: stock.filter(s => s.cat === cat).reduce((a, s) => a + s.qty, 0)
  })).filter(d => d.value > 0)

  const inversionPorCategoria = cats.map(cat => ({
    name: cat,
    value: stock.filter(s => s.cat === cat).reduce((a, s) => a + s.precio * s.qty, 0)
  })).filter(d => d.value > 0)

  return (
    <div className="space-y-5">
      {/* Resumen financiero — 3 números separados */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Resumen financiero</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 p-3 border border-red-200/50">
            <div className="flex items-center gap-2 text-[10px] text-red-700 mb-1">
              <TrendingDown className="h-3 w-3" />Total invertido
            </div>
            <div className="text-xl font-semibold text-red-600">{fmt(totalInvertido)}</div>
            <div className="text-[10px] text-red-400">Todo lo que gastaste</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 border border-amber-200/50">
            <div className="flex items-center gap-2 text-[10px] text-amber-700 mb-1">
              <Package className="h-3 w-3" />Stock actual
            </div>
            <div className="text-xl font-semibold text-amber-600">{fmt(invertidoStock)}</div>
            <div className="text-[10px] text-amber-400">Mercadería en mano</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 border border-emerald-200/50">
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 mb-1">
              <TrendingUp className="h-3 w-3" />Vendido total
            </div>
            <div className="text-xl font-semibold text-emerald-600">{fmt(totalVendido)}</div>
            <div className="text-[10px] text-emerald-400">Lo que cobraste</div>
          </div>
        </div>
        <div className="mt-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 border border-blue-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-blue-700">
              <Wallet className="h-3 w-3" />Ganancia neta
            </div>
            <div className="text-lg font-semibold text-blue-600">{fmt(gananciaTotal)}</div>
          </div>
        </div>
      </div>

      {/* Gráfico comparativo */}
      <Card className="border-0 bg-card/80">
        <CardContent className="p-4">
          <p className="text-xs font-medium mb-3">Inversión vs Stock vs Ventas</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumenData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + Math.round(v / 1000) + 'k'} />
                <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {resumenData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Registro de inversiones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Registro de inversiones</p>
          <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => setMostrarForm(!mostrarForm)}>
            <Plus className="h-3 w-3" />Agregar
          </Button>
        </div>

        {mostrarForm && (
          <Card className="border-0 bg-card/80 mb-3">
            <CardContent className="p-3 space-y-2">
              <Input placeholder="Descripción (ej: Compra RAM Kingston x2)" value={desc} onChange={e => setDesc(e.target.value)} className="h-8 text-xs" />
              <Input type="number" placeholder="Monto ($)" value={monto} onChange={e => setMonto(e.target.value)} className="h-8 text-xs" />
              <div className="flex gap-2">
                <Button size="sm" onClick={agregarInversion} disabled={guardando} className="h-7 text-xs">
                  {guardando ? "Guardando..." : "Agregar"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMostrarForm(false)} className="h-7 text-xs">Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-1.5">
          {inversiones.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">Sin inversiones registradas</div>
          ) : (
            inversiones.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 bg-card/80 rounded-xl px-3 py-2 group">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{inv.descripcion}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(inv.created_at).toLocaleDateString('es-AR')}</div>
                </div>
                <div className="text-xs font-semibold text-red-600">{fmt(inv.monto)}</div>
                <button onClick={() => eliminarInversion(inv.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ventas vs Costos */}
      <Card className="border-0 bg-card/80">
        <CardContent className="p-4">
          <p className="text-xs font-medium mb-3">Ventas vs Costos</p>
          <div className="h-[180px]">
            {totalVendido > 0 || totalCosto > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + Math.round(v / 1000) + 'k'} />
                  <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Registra ventas para ver el grafico</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de torta */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4">
            <p className="text-xs font-medium mb-3">Stock por categoria (unidades)</p>
            <div className="h-[200px]">
              {stockPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stockPorCategoria} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                      {stockPorCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v + ' unid.', '']} contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none' }} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Sin datos</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/80">
          <CardContent className="p-4">
            <p className="text-xs font-medium mb-3">Stock actual por categoria ($)</p>
            <div className="h-[200px]">
              {inversionPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={inversionPorCategoria} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                      {inversionPorCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none' }} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Sin datos</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
