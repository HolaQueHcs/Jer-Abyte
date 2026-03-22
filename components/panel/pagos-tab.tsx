"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, CheckCircle, Clock, Trash2, ChevronDown, ChevronUp, DollarSign } from "lucide-react"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

interface Pago {
  id: string
  monto: number
  fecha: string
  nota: string
}

interface PagoParcial {
  id: string
  cliente: string
  descripcion: string
  total: number
  pagado: number
  pagos: Pago[]
  estado: string
  created_at: string
}

export function PagosTab() {
  const supabase = createClient()
  const [registros, setRegistros] = useState<PagoParcial[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState<"Todos" | "Pendiente" | "Saldado">("Todos")

  // Form nueva venta
  const [cliente, setCliente] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [total, setTotal] = useState("")
  const [primerPago, setPrimerPago] = useState("")
  const [primerNota, setPrimerNota] = useState("")

  // Form nuevo pago parcial
  const [nuevoPago, setNuevoPago] = useState<Record<string, string>>({})
  const [nuevaNota, setNuevaNota] = useState<Record<string, string>>({})

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("pagos_parciales")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setRegistros(data.map((r: any) => ({ ...r, pagos: r.pagos || [] })))
    setLoading(false)
  }

  const crearVenta = async () => {
    if (!cliente.trim() || !total) return
    setGuardando(true)
    const t = parseFloat(total) || 0
    const p = parseFloat(primerPago) || 0
    const pagosInit: Pago[] = p > 0 ? [{
      id: Date.now().toString(),
      monto: p,
      fecha: new Date().toLocaleDateString('es-AR'),
      nota: primerNota || "Seña inicial"
    }] : []
    const estado = p >= t ? "Saldado" : "Pendiente"
    await supabase.from("pagos_parciales").insert({
      cliente: cliente.trim(),
      descripcion: descripcion.trim(),
      total: t,
      pagado: p,
      pagos: pagosInit,
      estado
    })
    setCliente(""); setDescripcion(""); setTotal(""); setPrimerPago(""); setPrimerNota("")
    setMostrarForm(false)
    await cargar()
    setGuardando(false)
  }

  const agregarPago = async (registro: PagoParcial) => {
    const monto = parseFloat(nuevoPago[registro.id] || "0") || 0
    if (!monto) return
    const nota = nuevaNota[registro.id] || ""
    const nuevosPagos = [...registro.pagos, {
      id: Date.now().toString(),
      monto,
      fecha: new Date().toLocaleDateString('es-AR'),
      nota
    }]
    const nuevoPagado = registro.pagado + monto
    const estado = nuevoPagado >= registro.total ? "Saldado" : "Pendiente"
    await supabase.from("pagos_parciales").update({
      pagos: nuevosPagos,
      pagado: nuevoPagado,
      estado,
      updated_at: new Date().toISOString()
    }).eq("id", registro.id)
    setNuevoPago(prev => ({ ...prev, [registro.id]: "" }))
    setNuevaNota(prev => ({ ...prev, [registro.id]: "" }))
    await cargar()
  }

  const eliminarPago = async (registro: PagoParcial, pagoId: string) => {
    const pagosActualizados = registro.pagos.filter(p => p.id !== pagoId)
    const nuevoPagado = pagosActualizados.reduce((s, p) => s + p.monto, 0)
    const estado = nuevoPagado >= registro.total ? "Saldado" : "Pendiente"
    await supabase.from("pagos_parciales").update({
      pagos: pagosActualizados,
      pagado: nuevoPagado,
      estado,
      updated_at: new Date().toISOString()
    }).eq("id", registro.id)
    await cargar()
  }

  const eliminarRegistro = async (id: string) => {
    await supabase.from("pagos_parciales").delete().eq("id", id)
    await cargar()
  }

  const marcarSaldado = async (registro: PagoParcial) => {
    const faltante = registro.total - registro.pagado
    if (faltante <= 0) return
    const nuevosPagos = [...registro.pagos, {
      id: Date.now().toString(),
      monto: faltante,
      fecha: new Date().toLocaleDateString('es-AR'),
      nota: "Pago final — saldado"
    }]
    await supabase.from("pagos_parciales").update({
      pagos: nuevosPagos,
      pagado: registro.total,
      estado: "Saldado",
      updated_at: new Date().toISOString()
    }).eq("id", registro.id)
    await cargar()
  }

  const filtrados = registros.filter(r => filtro === "Todos" || r.estado === filtro)
  const totalPendiente = registros.filter(r => r.estado === "Pendiente").reduce((s, r) => s + (r.total - r.pagado), 0)
  const totalCobrado = registros.reduce((s, r) => s + r.pagado, 0)

  return (
    <div className="space-y-5">
      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/80 border border-border rounded-xl p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Total cobrado</div>
          <div className="text-lg font-semibold text-emerald-600">{fmt(totalCobrado)}</div>
        </div>
        <div className="bg-card/80 border border-border rounded-xl p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Pendiente de cobro</div>
          <div className="text-lg font-semibold text-orange-500">{fmt(totalPendiente)}</div>
        </div>
        <div className="bg-card/80 border border-border rounded-xl p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Ventas activas</div>
          <div className="text-lg font-semibold text-blue-600">{registros.filter(r => r.estado === "Pendiente").length}</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {(["Todos", "Pendiente", "Saldado"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${filtro === f ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-muted-foreground hover:border-blue-400'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setMostrarForm(!mostrarForm)}>
          <Plus className="h-3 w-3" />Nueva venta con pagos
        </Button>
      </div>

      {/* Form nueva venta */}
      {mostrarForm && (
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium">Registrar venta con pagos parciales</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nombre del cliente *</label>
                <Input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="ej: Juan Pérez" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Precio total de la PC ($) *</label>
                <Input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="ej: 950000" className="h-8 text-sm" />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-muted-foreground">Descripción (ej: nombre de la PC)</label>
                <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="ej: PC Gaming Ryzen 5" className="h-8 text-sm" />
              </div>
            </div>

            {/* Seña inicial opcional */}
            <div className="border-t border-border pt-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-2">Seña inicial (opcional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Monto de la seña ($)</label>
                  <Input type="number" value={primerPago} onChange={e => setPrimerPago(e.target.value)} placeholder="ej: 300000" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Nota</label>
                  <Input value={primerNota} onChange={e => setPrimerNota(e.target.value)} placeholder="ej: Seña para armar" className="h-8 text-sm" />
                </div>
              </div>
            </div>

            {/* Preview */}
            {total && (
              <div className={`rounded-lg px-3 py-2 text-xs flex justify-between ${parseFloat(primerPago) >= parseFloat(total) ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                <span>Saldo pendiente:</span>
                <span className="font-semibold">{fmt(Math.max(0, (parseFloat(total) || 0) - (parseFloat(primerPago) || 0)))}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={crearVenta} disabled={guardando || !cliente.trim() || !total} className="h-8 text-xs">
                {guardando ? "Guardando..." : "Crear venta"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMostrarForm(false)} className="h-8 text-xs">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de ventas */}
      {loading ? (
        <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-10 text-xs text-muted-foreground">
          {registros.length === 0 ? "Sin ventas registradas todavía." : "Sin ventas en este estado."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(r => {
            const faltante = r.total - r.pagado
            const pct = Math.min(100, Math.round((r.pagado / r.total) * 100))
            const abierto = expandido === r.id
            return (
              <Card key={r.id} className="border-0 bg-card/80 overflow-hidden">
                <CardContent className="p-0">
                  {/* Cabecera */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => setExpandido(abierto ? null : r.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${r.estado === 'Saldado' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                      {r.estado === 'Saldado'
                        ? <CheckCircle className="h-4 w-4 text-emerald-600" />
                        : <Clock className="h-4 w-4 text-orange-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">{r.cliente}</span>
                        <Badge className={`text-[9px] px-1.5 border-0 ${r.estado === 'Saldado' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {r.estado}
                        </Badge>
                      </div>
                      {r.descripcion && <div className="text-[11px] text-muted-foreground truncate">{r.descripcion}</div>}
                      {/* Barra de progreso */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${r.estado === 'Saldado' ? 'bg-emerald-500' : 'bg-orange-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{pct}%</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-emerald-600">{fmt(r.pagado)}</div>
                      {faltante > 0 && <div className="text-[10px] text-orange-500">Falta {fmt(faltante)}</div>}
                      <div className="text-[10px] text-muted-foreground">Total {fmt(r.total)}</div>
                    </div>
                    {abierto ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  </div>

                  {/* Detalle expandido */}
                  {abierto && (
                    <div className="border-t border-border px-4 py-3 space-y-3">
                      {/* Historial de pagos */}
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Historial de pagos</p>
                        {r.pagos.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground italic">Sin pagos registrados</div>
                        ) : (
                          <div className="space-y-1.5">
                            {r.pagos.map((pago, idx) => (
                              <div key={pago.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 group">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[9px] font-bold text-blue-600">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-emerald-600">{fmt(pago.monto)}</span>
                                    <span className="text-[10px] text-muted-foreground">{pago.fecha}</span>
                                  </div>
                                  {pago.nota && <div className="text-[10px] text-muted-foreground">{pago.nota}</div>}
                                </div>
                                <button
                                  onClick={() => eliminarPago(r, pago.id)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Agregar nuevo pago */}
                      {r.estado !== "Saldado" && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Registrar nuevo pago</p>
                          <div className="flex gap-2 flex-wrap">
                            <Input
                              type="number"
                              placeholder={`Monto (falta ${fmt(faltante)})`}
                              value={nuevoPago[r.id] || ""}
                              onChange={e => setNuevoPago(prev => ({ ...prev, [r.id]: e.target.value }))}
                              className="h-8 text-xs flex-1 min-w-[120px]"
                            />
                            <Input
                              placeholder="Nota (opcional)"
                              value={nuevaNota[r.id] || ""}
                              onChange={e => setNuevaNota(prev => ({ ...prev, [r.id]: e.target.value }))}
                              className="h-8 text-xs flex-1 min-w-[120px]"
                            />
                            <Button size="sm" onClick={() => agregarPago(r)} className="h-8 text-xs">
                              <Plus className="h-3 w-3 mr-1" />Agregar
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => marcarSaldado(r)}
                            className="h-7 text-xs mt-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />Marcar como saldado
                          </Button>
                        </div>
                      )}

                      {/* Eliminar registro */}
                      <button
                        onClick={() => eliminarRegistro(r.id)}
                        className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                      >
                        Eliminar esta venta
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
