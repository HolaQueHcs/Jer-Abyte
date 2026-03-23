"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Monitor, BarChart3, Package, Wallet, TrendingUp, Cpu, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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

interface PcArmada {
  id: string
  nombre: string
  cliente: string
  precio_venta: number
  costo_total: number
  estado: string
  created_at: string
}

export function ResumenTab({
  ventas, gananciaTotal, pcArmadas, stockBajo,
  setVentas, setGananciaTotal, setTotalVendido, setTotalCosto,
  onNavigate, onGuardarVenta
}: ResumenTabProps) {
  const supabase = createClient()
  const [precio, setPrecio] = useState("")
  const [costo, setCosto] = useState("")
  const [mensaje, setMensaje] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [pcsArmadas, setPcsArmadas] = useState<PcArmada[]>([])
  const [mostrarPCs, setMostrarPCs] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState("")
  const [editCliente, setEditCliente] = useState("")
  const [editPrecio, setEditPrecio] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { cargarPCs() }, [])

  const cargarPCs = async () => {
    const { data } = await supabase
      .from("pcs_armadas")
      .select("id, nombre, cliente, precio_venta, costo_total, estado, created_at")
      .order("created_at", { ascending: false })
    if (data) setPcsArmadas(data)
  }

  const registrarVenta = async () => {
    const p = parseFloat(precio) || 0
    const c = parseFloat(costo) || 0
    if (!p || !c) { setMensaje({ text: "Completa precio y costo.", type: "error" }); return }
    setGuardando(true)
    if (onGuardarVenta) await onGuardarVenta(p, c)
    setVentas((v: number) => v + 1)
    setGananciaTotal((g: number) => g + (p - c))
    setTotalVendido((tv: number) => tv + p)
    setTotalCosto((tc: number) => tc + c)
    setMensaje({ text: `Venta registrada. Ganancia: ${fmt(p - c)}`, type: "success" })
    setPrecio(""); setCosto("")
    setGuardando(false)
  }

  const marcarVendida = async (pc: PcArmada) => {
    await supabase.from("pcs_armadas").update({ estado: "Vendida", updated_at: new Date().toISOString() }).eq("id", pc.id)
    if (onGuardarVenta) await onGuardarVenta(pc.precio_venta, pc.costo_total)
    setVentas((v: number) => v + 1)
    setGananciaTotal((g: number) => g + (pc.precio_venta - pc.costo_total))
    setTotalVendido((tv: number) => tv + pc.precio_venta)
    await cargarPCs()
  }

  const guardarEdicion = async (id: string) => {
    await supabase.from("pcs_armadas").update({
      nombre: editNombre, cliente: editCliente, precio_venta: parseFloat(editPrecio) || 0, updated_at: new Date().toISOString()
    }).eq("id", id)
    setEditando(null)
    await cargarPCs()
  }

  const eliminarPC = async (id: string) => {
    if (confirmDelete === id) {
      await supabase.from("pcs_armadas").delete().eq("id", id)
      setConfirmDelete(null)
      await cargarPCs()
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(c => c === id ? null : c), 3000)
    }
  }

  const enStock = pcsArmadas.filter(p => p.estado === "En stock").length
  const vendidas = pcsArmadas.filter(p => p.estado === "Vendida").length

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-r from-blue-50/80 to-orange-50/50 border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">JA</div>
            <div>
              <div className="text-sm font-medium text-foreground">Jer Abyte</div>
              <div className="text-xs text-muted-foreground">La PC que cumple con tus exigencias diarias</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Estado del negocio</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 border border-slate-200/50">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1"><TrendingUp className="h-3 w-3" />PCs vendidas</div>
            <div className="text-xl font-semibold text-foreground">{ventas}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 border border-emerald-200/50">
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 mb-1"><Wallet className="h-3 w-3" />Ganancia total</div>
            <div className="text-xl font-semibold text-emerald-600">{fmt(gananciaTotal)}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 border border-blue-200/50">
            <div className="flex items-center gap-2 text-[10px] text-blue-700 mb-1"><Cpu className="h-3 w-3" />PCs armadas</div>
            <div className="text-xl font-semibold text-blue-600">{pcArmadas}</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 border border-amber-200/50">
            <div className="flex items-center gap-2 text-[10px] text-amber-700 mb-1"><AlertTriangle className="h-3 w-3" />Stock bajo</div>
            <div className="text-xl font-semibold text-amber-600">{stockBajo}</div>
          </div>
        </div>
      </div>

      {/* Lista de PCs */}
      <div>
        <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setMostrarPCs(!mostrarPCs)}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            PCs armadas — {enStock} en stock · {vendidas} vendidas
          </p>
          {mostrarPCs ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>

        {mostrarPCs && (
          <div className="space-y-2">
            {pcsArmadas.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground bg-card/80 rounded-xl border border-border">
                No hay PCs armadas todavía.
              </div>
            ) : (
              pcsArmadas.map(pc => (
                <Card key={pc.id} className={`border-0 ${pc.estado === 'Vendida' ? 'bg-emerald-50/50' : 'bg-card/80'}`}>
                  <CardContent className="p-3">
                    {editando === pc.id ? (
                      <div className="space-y-2">
                        <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre de la PC" className="h-7 text-xs" />
                        <Input value={editCliente} onChange={e => setEditCliente(e.target.value)} placeholder="Cliente" className="h-7 text-xs" />
                        <Input type="number" value={editPrecio} onChange={e => setEditPrecio(e.target.value)} placeholder="Precio de venta ($)" className="h-7 text-xs" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => guardarEdicion(pc.id)} className="h-7 text-xs">Guardar</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditando(null)} className="h-7 text-xs">Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${pc.estado === 'Vendida' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                          {pc.estado === 'Vendida' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Cpu className="h-3.5 w-3.5 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium truncate">{pc.nombre || "Sin nombre"}</span>
                            <Badge className={`text-[9px] px-1.5 border-0 ${pc.estado === 'Vendida' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {pc.estado}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground">{pc.cliente || "Sin cliente"}</div>
                          <div className="text-[10px] text-muted-foreground">{new Date(pc.created_at).toLocaleDateString('es-AR')} · {fmt(pc.precio_venta)}</div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {pc.estado !== 'Vendida' && (
                            <Button size="sm" onClick={() => marcarVendida(pc)} className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 px-2">
                              Marcar vendida
                            </Button>
                          )}
                          <div className="flex gap-1">
                            <button onClick={() => { setEditando(pc.id); setEditNombre(pc.nombre); setEditCliente(pc.cliente); setEditPrecio(String(pc.precio_venta)) }}
                              className="text-[10px] text-blue-400 hover:text-blue-600">✏️</button>
                            <button onClick={() => eliminarPC(pc.id)}
                              className={`text-[10px] transition-colors ${confirmDelete === pc.id ? 'text-red-600 font-medium' : 'text-red-400 hover:text-red-600'}`}>
                              {confirmDelete === pc.id ? '¿Confirmar?' : '🗑️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Acciones rapidas</p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-0 bg-card/80" onClick={() => onNavigate("armado")}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Monitor className="h-4 w-4" /></div>
                <div><div className="text-xs font-medium">Armar nueva PC</div><div className="text-[10px] text-muted-foreground">Con doble precio y PDF</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-0 bg-card/80" onClick={() => onNavigate("graficos")}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><BarChart3 className="h-4 w-4" /></div>
                <div><div className="text-xs font-medium">Ver graficos</div><div className="text-[10px] text-muted-foreground">Gastos y ventas</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-0 bg-card/80" onClick={() => onNavigate("inventario")}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Package className="h-4 w-4" /></div>
                <div><div className="text-xs font-medium">Inventario</div><div className="text-[10px] text-muted-foreground">Stock y componentes</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-0 bg-card/80" onClick={() => onNavigate("calculadora")}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600"><Wallet className="h-4 w-4" /></div>
                <div><div className="text-xs font-medium">Calculadora</div><div className="text-[10px] text-muted-foreground">Margen e impuestos</div></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Registrar venta rápida */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Registrar venta rápida</p>
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Precio de venta al cliente ($)</label>
                <Input type="number" placeholder="ej: 950000" value={precio} onChange={(e) => setPrecio(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Costo real de componentes ($)</label>
                <Input type="number" placeholder="ej: 620000" value={costo} onChange={(e) => setCosto(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <Button onClick={registrarVenta} disabled={guardando} className="h-8 text-xs">
              {guardando ? "Guardando..." : "Registrar venta"}
            </Button>
            {mensaje && <p className={`mt-2 text-xs ${mensaje.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{mensaje.text}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
