"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

export function CalculadoraTab() {
  const [componentes, setComponentes] = useState("")
  const [manoObra, setManoObra] = useState("")
  const [margen, setMargen] = useState("25")
  const [iva, setIva] = useState("0")

  const comp = parseFloat(componentes) || 0
  const mano = parseFloat(manoObra) || 0
  const margenNum = parseFloat(margen) || 0
  const ivaNum = parseFloat(iva) || 0

  const base = comp + mano
  const ganancia = base * (margenNum / 100)
  const subtotal = base + ganancia
  const total = subtotal * (1 + ivaNum / 100)

  const desglose = [
    { label: 'Componentes', valor: comp },
    { label: 'Mano de obra', valor: mano },
    { label: `Margen (${margenNum}%)`, valor: ganancia },
    ...(ivaNum > 0 ? [{ label: `Impuestos (${ivaNum}%)`, valor: total - subtotal }] : [])
  ]

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Calculadora de precio de venta</p>
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Costo de componentes ($)</label>
                <Input
                  type="number"
                  placeholder="ej: 600000"
                  value={componentes}
                  onChange={(e) => setComponentes(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Mano de obra ($)</label>
                <Input
                  type="number"
                  placeholder="ej: 50000"
                  value={manoObra}
                  onChange={(e) => setManoObra(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Margen de ganancia (%)</label>
                <Input
                  type="number"
                  value={margen}
                  onChange={(e) => setMargen(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Impuestos (%)</label>
                <Input
                  type="number"
                  value={iva}
                  onChange={(e) => setIva(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 border border-slate-200/50">
          <div className="text-[10px] text-muted-foreground mb-1">Costo base</div>
          <div className="text-xl font-semibold text-foreground">{fmt(base)}</div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 border border-emerald-200/50">
          <div className="text-[10px] text-emerald-700 mb-1">Tu ganancia</div>
          <div className="text-xl font-semibold text-emerald-600">{fmt(ganancia)}</div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 border border-blue-200/50">
          <div className="text-[10px] text-blue-700 mb-1">Precio final</div>
          <div className="text-xl font-semibold text-blue-600">{fmt(total)}</div>
        </div>
      </div>

      {/* Desglose */}
      {base > 0 && (
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4">
            <p className="text-xs font-medium mb-3">Desglose</p>
            <div className="space-y-2">
              {desglose.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium text-foreground">{fmt(item.valor)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
