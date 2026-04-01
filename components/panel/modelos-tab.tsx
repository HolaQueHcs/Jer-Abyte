"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ChevronDown, ChevronUp, Zap, Eye, EyeOff, Copy, Tag } from "lucide-react"
import type { StockItem } from "@/app/page"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')
const redondear = (n: number) => Math.ceil(n / 1000) * 1000

interface Componente {
  nombre: string
  cat: string
  precio: number
  qty: number
  sidx: number
}

interface ModeloPC {
  id: string
  nombre: string
  descripcion: string
  componentes: Componente[]
  precio_base: number
  precio_cliente: number
  precio_amigo: number
  descuento_amigo: number
  publicado: boolean
}

interface ModelosTabProps {
  stock: StockItem[]
  setStock: (updater: StockItem[] | ((prev: StockItem[]) => StockItem[])) => Promise<void>
  onConfirmarArmado?: (nombrePc: string, cliente: string, componentes: any[], precioFinal: number, costoTotal: number) => Promise<void>
}

export function ModelosTab({ stock, setStock, onConfirmarArmado }: ModelosTabProps) {
  const supabase = createClient()
  const [modelos, setModelos] = useState<ModeloPC[]>([])
  const [expandido, setExpandido] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [clienteNombre, setClienteNombre] = useState("")

  // Form nuevo modelo
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [descAmigo, setDescAmigo] = useState("10")
  const [compSeleccionados, setCompSeleccionados] = useState<{sidx: number, qty: number}[]>([])
  const [margen, setMargen] = useState("25")

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const { data } = await supabase.from("modelos_pc").select("*").order("created_at", { ascending: false })
    if (data) setModelos(data.map((m: any) => ({ ...m, componentes: m.componentes || [] })))
  }

  const calcularCosto = (comps: {sidx: number, qty: number}[]) =>
    comps.reduce((s, c) => s + (stock[c.sidx]?.precio || 0) * c.qty, 0)

  const crearModelo = async () => {
    if (!nombre.trim() || compSeleccionados.length === 0) return
    setGuardando(true)
    const componentes = compSeleccionados.map(c => ({
      nombre: stock[c.sidx]?.nombre || "",
      cat: stock[c.sidx]?.cat || "",
      precio: stock[c.sidx]?.precio || 0,
      qty: c.qty,
      sidx: c.sidx
    }))
    const costo = calcularCosto(compSeleccionados)
    const pCliente = redondear(costo * (1 + parseFloat(margen) / 100))
    const pAmigo = redondear(pCliente * (1 - parseFloat(descAmigo) / 100))
    await supabase.from("modelos_pc").insert({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      componentes,
      precio_base: costo,
      precio_cliente: pCliente,
      precio_amigo: pAmigo,
      descuento_amigo: parseFloat(descAmigo) || 10,
      publicado: false
    })
    setNombre(""); setDescripcion(""); setCompSeleccionados([]); setMargen("25")
    setMostrarForm(false)
    await cargar()
    setGuardando(false)
  }

  const togglePublicado = async (modelo: ModeloPC) => {
    await supabase.from("modelos_pc").update({ publicado: !modelo.publicado }).eq("id", modelo.id)
    await cargar()
  }

  const eliminar = async (id: string) => {
    await supabase.from("modelos_pc").delete().eq("id", id)
    await cargar()
  }

  const actualizarPrecio = async (modelo: ModeloPC, campo: string, valor: number) => {
    const updates: any = { [campo]: valor, updated_at: new Date().toISOString() }
    // Si cambia precio_cliente, recalcular precio_amigo
    if (campo === "precio_cliente") {
      updates.precio_amigo = redondear(valor * (1 - modelo.descuento_amigo / 100))
    }
    await supabase.from("modelos_pc").update(updates).eq("id", modelo.id)
    await cargar()
  }

  const confirmarVenta = async (modelo: ModeloPC, precio: number) => {
    if (!clienteNombre.trim()) return
    setGuardando(true)
    // Descontar stock
    const newStock = stock.map((s, idx) => {
      const comp = modelo.componentes.find(c => c.sidx === idx)
      if (comp && s.qty > 0) return { ...s, qty: Math.max(0, s.qty - comp.qty) }
      return s
    })
    await setStock(newStock)
    // Registrar PC armada
    if (onConfirmarArmado) {
      const compsArmado = modelo.componentes.map(c => ({
        nombre: c.nombre, cat: c.cat, pcosto: c.precio,
        pventa: Math.round(precio / modelo.componentes.length),
        qty: c.qty, sidx: c.sidx, ext: false
      }))
      await onConfirmarArmado(modelo.nombre, clienteNombre, compsArmado, precio, modelo.precio_base)
    }
    setConfirmandoId(null)
    setClienteNombre("")
    setGuardando(false)
  }

  const agregarComponente = (sidx: number) => {
    const existe = compSeleccionados.find(c => c.sidx === sidx)
    if (existe) {
      setCompSeleccionados(compSeleccionados.map(c => c.sidx === sidx ? { ...c, qty: c.qty + 1 } : c))
    } else {
      setCompSeleccionados([...compSeleccionados, { sidx, qty: 1 }])
    }
  }

  const quitarComponente = (sidx: number) => {
    setCompSeleccionados(compSeleccionados.filter(c => c.sidx !== sidx))
  }

  const costoForm = calcularCosto(compSeleccionados)
  const precioSugeridoForm = redondear(costoForm * (1 + parseFloat(margen) / 100))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Modelos de PC</p>
          <p className="text-[10px] text-muted-foreground">Armados pre-definidos con precio listo</p>
        </div>
        <Button size="sm" onClick={() => setMostrarForm(!mostrarForm)} className="h-8 text-xs gap-1">
          <Plus className="h-3 w-3" />Nuevo modelo
        </Button>
      </div>

      {/* Form nuevo modelo */}
      {mostrarForm && (
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium">Crear modelo de PC</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nombre del modelo *</label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="ej: PC Gamer Básica" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Margen de ganancia (%)</label>
                <Input type="number" value={margen} onChange={e => setMargen(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-muted-foreground">Descripción</label>
                <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="ej: Ideal para gaming 1080p" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Descuento para amigos (%)</label>
                <Input type="number" value={descAmigo} onChange={e => setDescAmigo(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            {/* Selector de componentes */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-2 block">Componentes del modelo</label>
              <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
                {stock.map((s, idx) => {
                  const seleccionado = compSeleccionados.find(c => c.sidx === idx)
                  return (
                    <div key={idx} className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${seleccionado ? 'bg-blue-50 border border-blue-200' : 'bg-muted/30 hover:bg-muted/60'}`}
                      onClick={() => seleccionado ? quitarComponente(idx) : agregarComponente(idx)}>
                      <div>
                        <span className="text-xs font-medium">{s.nombre}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{s.cat} · {fmt(s.precio)}</span>
                        {s.qty === 0 && <Badge className="ml-1 text-[8px] px-1 bg-slate-100 text-slate-500 border-0">Sin stock</Badge>}
                      </div>
                      {seleccionado && (
                        <div className="flex items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); setCompSeleccionados(compSeleccionados.map(c => c.sidx === idx ? { ...c, qty: Math.max(1, c.qty - 1) } : c)) }}
                            className="w-5 h-5 rounded bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center">-</button>
                          <span className="text-xs font-medium w-4 text-center">{seleccionado.qty}</span>
                          <button onClick={e => { e.stopPropagation(); agregarComponente(idx) }}
                            className="w-5 h-5 rounded bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center">+</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {costoForm > 0 && (
              <div className="bg-blue-50 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Costo total:</span>
                  <span className="font-medium text-red-600">{fmt(costoForm)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Precio cliente ({margen}% margen, redondeado):</span>
                  <span className="font-semibold text-emerald-600">{fmt(precioSugeridoForm)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Precio amigo ({descAmigo}% desc):</span>
                  <span className="font-medium text-blue-600">{fmt(redondear(precioSugeridoForm * (1 - parseFloat(descAmigo) / 100)))}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={crearModelo} disabled={guardando || !nombre.trim() || compSeleccionados.length === 0} className="h-8 text-xs">
                {guardando ? "Guardando..." : "Crear modelo"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMostrarForm(false)} className="h-8 text-xs">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de modelos */}
      {modelos.length === 0 ? (
        <div className="text-center py-10 text-xs text-muted-foreground">
          No hay modelos todavía. Creá uno para tener armados pre-definidos listos.
        </div>
      ) : (
        <div className="space-y-3">
          {modelos.map(modelo => {
            const abierto = expandido === modelo.id
            const confirmando = confirmandoId === modelo.id
            const stockSuficiente = modelo.componentes.every(c => (stock[c.sidx]?.qty || 0) >= c.qty)
            return (
              <Card key={modelo.id} className="border-0 bg-card/80 overflow-hidden">
                <CardContent className="p-0">
                  {/* Cabecera */}
                  <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpandido(abierto ? null : modelo.id)}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${stockSuficiente ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      <Zap className={`h-4 w-4 ${stockSuficiente ? 'text-emerald-600' : 'text-amber-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{modelo.nombre}</span>
                        {modelo.publicado && <Badge className="text-[9px] px-1.5 border-0 bg-emerald-100 text-emerald-700">Publicado</Badge>}
                        {!stockSuficiente && <Badge className="text-[9px] px-1.5 border-0 bg-amber-100 text-amber-700">Stock bajo</Badge>}
                      </div>
                      {modelo.descripcion && <div className="text-[10px] text-muted-foreground">{modelo.descripcion}</div>}
                      <div className="text-[10px] text-muted-foreground">{modelo.componentes.length} componentes</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-emerald-600">{fmt(modelo.precio_cliente)}</div>
                      <div className="text-[10px] text-blue-500">Amigo: {fmt(modelo.precio_amigo)}</div>
                    </div>
                    {abierto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>

                  {/* Detalle */}
                  {abierto && (
                    <div className="border-t border-border px-4 py-3 space-y-3">
                      {/* Componentes */}
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Componentes</p>
                        <div className="space-y-1">
                          {modelo.componentes.map((comp, i) => {
                            const enStock = (stock[comp.sidx]?.qty || 0) >= comp.qty
                            return (
                              <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-1.5">
                                <div>
                                  <span className="text-[11px] font-medium">{comp.nombre}</span>
                                  <span className="text-[10px] text-muted-foreground ml-2">{comp.cat} × {comp.qty}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!enStock && <Badge className="text-[8px] px-1 border-0 bg-amber-100 text-amber-700">Sin stock</Badge>}
                                  <span className="text-[10px] text-red-500">{fmt(comp.precio * comp.qty)}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Precios editables */}
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Precios</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">Precio cliente ($)</label>
                            <input type="number" defaultValue={modelo.precio_cliente}
                              onBlur={e => actualizarPrecio(modelo, "precio_cliente", parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs px-2 border border-emerald-300 rounded-lg bg-emerald-50 text-emerald-700 font-semibold" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" />Precio amigo ($)
                            </label>
                            <input type="number" defaultValue={modelo.precio_amigo}
                              onBlur={e => actualizarPrecio(modelo, "precio_amigo", parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs px-2 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 font-semibold" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" className="h-6 text-[10px]"
                            onClick={() => actualizarPrecio(modelo, "precio_cliente", redondear(modelo.precio_cliente))}>
                            Redondear precio
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-[10px]"
                            onClick={() => actualizarPrecio(modelo, "precio_amigo", redondear(modelo.precio_cliente * (1 - modelo.descuento_amigo / 100)))}>
                            Recalcular amigo
                          </Button>
                        </div>
                      </div>

                      {/* Confirmar venta */}
                      {confirmando ? (
                        <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                          <p className="text-xs font-medium text-blue-700">¿A quién le vendés?</p>
                          <Input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                            placeholder="Nombre del cliente" className="h-8 text-xs" />
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" onClick={() => confirmarVenta(modelo, modelo.precio_cliente)}
                              disabled={guardando || !clienteNombre.trim()} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                              Precio normal {fmt(modelo.precio_cliente)}
                            </Button>
                            <Button size="sm" onClick={() => confirmarVenta(modelo, modelo.precio_amigo)}
                              disabled={guardando || !clienteNombre.trim()} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                              Precio amigo {fmt(modelo.precio_amigo)}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setConfirmandoId(null); setClienteNombre("") }} className="h-7 text-xs">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" onClick={() => setConfirmandoId(modelo.id)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                            <Zap className="h-3 w-3 mr-1" />Vender esta PC
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => togglePublicado(modelo)}
                            className="h-7 text-xs gap-1">
                            {modelo.publicado ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {modelo.publicado ? "Despublicar" : "Publicar"}
                          </Button>
                          <button onClick={() => eliminar(modelo.id)} className="text-[10px] text-red-400 hover:text-red-600 ml-auto">
                            Eliminar
                          </button>
                        </div>
                      )}
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
