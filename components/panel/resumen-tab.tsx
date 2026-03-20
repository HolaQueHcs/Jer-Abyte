"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Monitor, BarChart3, Package, Wallet, TrendingUp, Cpu, AlertTriangle } from "lucide-react"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

interface ResumenTabProps {
  ventas: number
  gananciaTotal: number
  pcArmadas: number
  stockBajo: number
  setVentas: (v: number | ((v: number) => number)) => void
  setGananciaTotal: (v: number | ((v: number) => number)) => void
  setTotalVendido: (v: number | ((v: number) => number)) => void
  setTotalCosto: (v: number | ((v: number) => number)) => void
  totalVendido: number
  totalCosto: number
  onNavigate: (tab: string) => void
  onGuardarVenta?: (monto: number, costo: number) => Promise<void>
}

export function ResumenTab({
  ventas,
  gananciaTotal,
  pcArmadas,
  stockBajo,
  setVentas,
  setGananciaTotal,
  setTotalVendido,
  setTotalCosto,
  onNavigate,
  onGuardarVenta
}: ResumenTabProps) {
  const [precio, setPrecio] = useState("")
  const [costo, setCosto] = useState("")
  const [mensaje, setMensaje] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [guardando, setGuardando] = useState(false)

  const registrarVenta = async () => {
    const p = parseFloat(precio) || 0
    const c = parseFloat(costo) || 0
    if (!p || !c) {
      setMensaje({ text: "Completa precio y costo.", type: "error" })
      return
    }
    setGuardando(true)
    if (onGuardarVenta) await onGuardarVenta(p, c)
    setVentas((v: number) => v + 1)
    setGananciaTotal((g: number) => g + (p - c))
    setTotalVendido((tv: number) => tv + p)
    setTotalCosto((tc: number) => tc + c)
    setMensaje({ text: `Venta registrada. Ganancia: ${fmt(p - c)}`, type: "success" })
    setPrecio("")
    setCosto("")
    setGuardando(false)
  }

  return (
    <div className="space-y-5">
      {/* Header con logo */}
      <Card className="bg-gradient-to-r from-blue-50/80 to-orange-50/50 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              JA
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Jer Abyte</div>
              <div className="text-xs text-muted-foreground">La PC que cumple con tus exigencias diarias</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metricas */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Estado del negocio</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 border border-slate-200/50">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              PCs vendidas
            </div>
            <div className="text-xl font-semibold text-foreground">{ventas}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 border border-emerald-200/50">
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 mb-1">
              <Wallet className="h-3 w-3" />
              Ganancia total
            </div>
            <div className="text-xl font-semibold text-emerald-600">{fmt(gananciaTotal)}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 border border-blue-200/50">
            <div className="flex items-center gap-2 text-[10px] text-blue-700 mb-1">
              <Cpu className="h-3 w-3" />
              PCs armadas
            </div>
            <div className="text-xl font-semibold text-blue-600">{pcArmadas}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 border border-amber-200/50">
            <div className="flex items-center gap-2 text-[10px] text-amber-700 mb-1">
              <AlertTriangle className="h-3 w-3" />
              Stock bajo
            </div>
            <div className="text-xl font-semibold text-amber-600">{stockBajo}</div>
          </div>
        </div>
      </div>

      {/* Acciones rapidas */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Acciones rapidas</p>
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-0 bg-card/80"
            onClick={() => onNavigate("armado")}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium">Armar nueva PC</div>
                  <div className="text-[10px] text-muted-foreground">Con doble precio y PDF</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-0 bg-card/80"
            onClick={() => onNavigate("graficos")}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium">Ver graficos</div>
                  <div className="text-[10px] text-muted-foreground">Gastos y ventas</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-0 bg-card/80"
            onClick={() => onNavigate("inventario")}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium">Inventario</div>
                  <div className="text-[10px] text-muted-foreground">Stock y componentes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-0 bg-card/80"
            onClick={() => onNavigate("calculadora")}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium">Calculadora</div>
                  <div className="text-[10px] text-muted-foreground">Margen e impuestos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Registrar venta */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Registrar venta</p>
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Precio de venta al cliente ($)</label>
                <Input
                  type="number"
                  placeholder="ej: 950000"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Costo real de componentes ($)</label>
                <Input
                  type="number"
                  placeholder="ej: 620000"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <Button onClick={registrarVenta} disabled={guardando} className="h-8 text-xs">
              {guardando ? "Guardando..." : "Registrar venta"}
            </Button>
            {mensaje && (
              <p className={`mt-2 text-xs ${mensaje.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {mensaje.text}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
