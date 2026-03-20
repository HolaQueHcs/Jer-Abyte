"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
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

export function GraficosTab({ stock, totalVendido, totalCosto, gananciaTotal, invertidoStock }: GraficosTabProps) {
  // Datos para grafico de barras
  const barData = [
    { name: 'Vendido', value: totalVendido, fill: '#10b981' },
    { name: 'Costo', value: totalCosto, fill: '#ef4444' },
    { name: 'Ganancia', value: gananciaTotal, fill: '#3b82f6' },
  ]

  // Datos para grafico de categorias (unidades)
  const cats = [...new Set(stock.map(s => s.cat))]
  const stockPorCategoria = cats.map(cat => ({
    name: cat,
    value: stock.filter(s => s.cat === cat).reduce((a, s) => a + s.qty, 0)
  })).filter(d => d.value > 0)

  // Datos para grafico de inversion por categoria
  const inversionPorCategoria = cats.map(cat => ({
    name: cat,
    value: stock.filter(s => s.cat === cat).reduce((a, s) => a + s.precio * s.qty, 0)
  })).filter(d => d.value > 0)

  return (
    <div className="space-y-5">
      {/* Resumen financiero */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Resumen financiero</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 p-3 border border-red-200/50">
            <div className="flex items-center gap-2 text-[10px] text-red-700 mb-1">
              <TrendingDown className="h-3 w-3" />
              Invertido en stock
            </div>
            <div className="text-xl font-semibold text-red-600">{fmt(invertidoStock)}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 border border-emerald-200/50">
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 mb-1">
              <TrendingUp className="h-3 w-3" />
              Vendido total
            </div>
            <div className="text-xl font-semibold text-emerald-600">{fmt(totalVendido)}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 border border-blue-200/50">
            <div className="flex items-center gap-2 text-[10px] text-blue-700 mb-1">
              <Wallet className="h-3 w-3" />
              Ganancia neta
            </div>
            <div className="text-xl font-semibold text-blue-600">{fmt(gananciaTotal)}</div>
          </div>
        </div>
      </div>

      {/* Grafico de barras - Ventas vs Costos */}
      <Card className="border-0 bg-card/80">
        <CardContent className="p-4">
          <p className="text-xs font-medium mb-3">Ventas vs Costos</p>
          <div className="h-[220px]">
            {totalVendido > 0 || totalCosto > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => '$' + Math.round(value / 1000) + 'k'}
                  />
                  <Tooltip 
                    formatter={(value: number) => [fmt(value), '']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Registra ventas para ver el grafico
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Graficos de torta */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4">
            <p className="text-xs font-medium mb-3">Stock por categoria (unidades)</p>
            <div className="h-[200px]">
              {stockPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stockPorCategoria.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value + ' unid.', '']}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Sin datos de stock
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/80">
          <CardContent className="p-4">
            <p className="text-xs font-medium mb-3">Inversion por categoria ($)</p>
            <div className="h-[200px]">
              {inversionPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inversionPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {inversionPorCategoria.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [fmt(value), '']}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Sin datos de inversion
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
