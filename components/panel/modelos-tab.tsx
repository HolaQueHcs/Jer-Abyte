"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ChevronDown, ChevronUp, Zap, Eye, EyeOff, AlertTriangle, DollarSign, Percent } from "lucide-react"
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
  margen_ganancia: number
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

  // SINCRONIZACIÓN AUTOMÁTICA: Cuando cambie el stock, recalcular precios de modelos
  useEffect(() => {
    sincronizarPrecios()
  }, [stock])

  const cargar = async () => {
    const { data } = await supabase.from("modelos_pc").select("*").order("created_at", { ascending: false })
    if (data) {
      setModelos(data.map((m: any) => ({
        ...m,
        componentes: m.componentes || [],
        margen_ganancia: m.margen_ganancia || 25
      })))
    }
  }

  // FUNCIÓN DE SINCRONIZACIÓN: Recalcular precios si cambió algún componente
  const sincronizarPrecios = async () => {
    if (modelos.length === 0) return
    
    let huboActualizacion = false
    const modelosActualizados = modelos.map(modelo => {
      // Recalcular costo basándose en stock actual
      const costoActual = modelo.componentes.reduce((sum, comp) => {
        const itemStock = stock[comp.sidx]
        if (!itemStock) return sum
        // Si el precio cambió, actualizar
        if (itemStock.precio !== comp.precio) {
          comp.precio = itemStock.precio
          huboActualizacion = true
        }
        return sum + itemStock.precio * comp.qty
      }, 0)

      const precioClienteNuevo = redondear(costoActual * (1 + modelo.margen_ganancia / 100))
      const precioAmigoNuevo = redondear(precioClienteNuevo * (1 - modelo.descuento_amigo / 100))

      // Si cambió el costo, actualizar DB
      if (costoActual !== modelo.precio_base || precioClienteNuevo !== modelo.precio_cliente) {
        huboActualizacion = true
        return {
          ...modelo,
          precio_base: costoActual,
          precio_cliente: precioClienteNuevo,
          precio_amigo: precioAmigoNuevo
        }
      }
      return modelo
    })

    if (huboActualizacion) {
      // Actualizar en DB
      for (const modelo of modelosActualizados) {
        await supabase.from("modelos_pc").update({
          componentes: modelo.componentes,
          precio_base: modelo.precio_base,
          precio_cliente: modelo.precio_cliente,
          precio_amigo: modelo.precio_amigo,
          updated_at: new Date().toISOString()
        }).eq("id", modelo.id)
      }
      setModelos(modelosActualizados)
    }
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
      margen_ganancia: parseFloat(margen) || 25,
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

  const actualizarMargen = async (modelo: ModeloPC, nuevoMargen: number) => {
    const precioClienteNuevo = redondear(modelo.precio_base * (1 + nuevoMargen / 100))
    const precioAmigoNuevo = redondear(precioClienteNuevo * (1 - modelo.descuento_amigo / 100))
    await supabase.from("modelos_pc").update({
      margen_ganancia: nuevoMargen,
      precio_cliente: precioClienteNuevo,
      precio_amigo: precioAmigoNuevo,
      updated_at: new Date().toISOString()
    }).eq("id", modelo.id)
    await cargar()
  }

  const actualizarPrecio = async (modelo: ModeloPC, campo: string, valor: number) => {
    const updates: any = { [campo]: valor, updated_at: new Date().toISOString() }
    if (campo === "precio_cliente") {
      updates.precio_amigo = redondear(valor * (1 - modelo.descuento_amigo / 100))
    }
    await supabase.from("modelos_pc").update(updates).eq("id", modelo.id)
    await cargar()
  }

  const confirmarVenta = async (modelo: ModeloPC, precio: number) => {
    if (!clienteNombre.trim()) return
    setGuardando(true)
    const newStock = stock.map((s, idx) => {
      const comp = modelo.componentes.find(c => c.sidx === idx)
      if (comp && s.qty > 0) return { ...s, qty: Math.max(0, s.qty - comp.qty) }
      return s
    })
    await setStock(newStock)
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

  // Solo hardware para los modelos
  const hardwareStock = stock.filter(s => s.tipo !== 'SERVICIO')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Modelos de PC</p>
          <p className="text-[10px] text-muted-foreground">START · FLOW · TITAN</p>
        </div>
        <Button size="sm" onClick={() => setMostrarForm(!mostrarForm)} className="h-8 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Crear modelo
        </Button>
      </div>

      {/* Form crear modelo */}
      {mostrarForm && (
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nombre del modelo</label>
                <Input placeholder="ej: FLOW Ryzen 5 3400G" value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Margen de ganancia (%)
                </label>
                <Input type="number" placeholder="25" value={margen} onChange={(e) => setMargen(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Descripción</label>
              <Input placeholder="ej: Ideal para gaming 1080p y streaming" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="h-8 text-sm" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Descuento para amigos (%)</label>
              <Input type="number" placeholder="10" value={descAmigo} onChange={(e) => setDescAmigo(e.target.value)} className="h-8 text-sm" />
            </div>

            {/* Selector de componentes */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Seleccionar componentes (solo hardware)
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {hardwareStock.map((item, index) => {
                  const seleccionado = compSeleccionados.find(c => c.sidx === index)
                  return (
                    <div key={index} className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${seleccionado ? 'bg-blue-50 border border-blue-200' : 'bg-muted/30 hover:bg-muted/50'}`}
                      onClick={() => seleccionado ? quitarComponente(index) : agregarComponente(index)}>
                      <div className="flex-1">
                        <span className="font-medium">{item.nombre}</span>
                        <span className="text-muted-foreground ml-2">({item.cat})</span>
                        <span className="text-red-500 ml-2">{fmt(item.precio)}</span>
                      </div>
                      {seleccionado && (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-medium">× {seleccionado.qty}</span>
                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); quitarComponente(index) }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Preview precios */}
            {compSeleccionados.length > 0 && (
              <div className="bg-muted/40 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Costo total (sin margen):</span>
                  <span className="font-medium text-red-600">{fmt(costoForm)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Precio cliente ({margen}% margen):</span>
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
          No hay modelos todavía. Creá START, FLOW o TITAN para tener armados predefinidos.
        </div>
      ) : (
        <div className="space-y-3">
          {modelos.map(modelo => {
            const abierto = expandido === modelo.id
            const confirmando = confirmandoId === modelo.id
            
            // VERIFICACIÓN DE STOCK: Si algún componente está en 0, mostrar "Consultar disponibilidad"
            const componentesSinStock = modelo.componentes.filter(c => (stock[c.sidx]?.qty || 0) === 0)
            const stockSuficiente = componentesSinStock.length === 0
            const stockBajo = !stockSuficiente || modelo.componentes.some(c => {
              const item = stock[c.sidx]
              return item && item.qty > 0 && item.qty < c.qty
            })

            return (
              <Card key={modelo.id} className="border-0 bg-card/80 overflow-hidden">
                <CardContent className="p-0">
                  {/* Cabecera */}
                  <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20" onClick={() => setExpandido(abierto ? null : modelo.id)}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${stockSuficiente ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      {stockSuficiente ? (
                        <Zap className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{modelo.nombre}</span>
                        {modelo.publicado && <Badge className="text-[9px] px-1.5 border-0 bg-emerald-100 text-emerald-700">Publicado</Badge>}
                        {!stockSuficiente && (
                          <Badge className="text-[9px] px-1.5 border-0 bg-amber-100 text-amber-700">Consultar disponibilidad</Badge>
                        )}
                        {stockBajo && stockSuficiente && (
                          <Badge className="text-[9px] px-1.5 border-0 bg-orange-100 text-orange-700">Stock justo</Badge>
                        )}
                      </div>
                      {modelo.descripcion && <div className="text-[10px] text-muted-foreground">{modelo.descripcion}</div>}
                      <div className="text-[10px] text-muted-foreground">{modelo.componentes.length} componentes · Margen {modelo.margen_ganancia}%</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-emerald-600">{fmt(modelo.precio_cliente)}</div>
                      <div className="text-[10px] text-blue-500">Amigo: {fmt(modelo.precio_amigo)}</div>
                      <div className="text-[9px] text-red-400">Costo: {fmt(modelo.precio_base)}</div>
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
                            const itemStock = stock[comp.sidx]
                            const enStock = (itemStock?.qty || 0) >= comp.qty
                            const sinStock = (itemStock?.qty || 0) === 0
                            // Detectar si el precio cambió
                            const precioCambio = itemStock && itemStock.precio !== comp.precio
                            
                            return (
                              <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-1.5">
                                <div className="flex-1">
                                  <span className="text-[11px] font-medium">{comp.nombre}</span>
                                  <span className="text-[10px] text-muted-foreground ml-2">{comp.cat} × {comp.qty}</span>
                                  {precioCambio && (
                                    <Badge className="text-[8px] px-1 ml-2 border-0 bg-blue-100 text-blue-700">Precio actualizado</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {sinStock && <Badge className="text-[8px] px-1 border-0 bg-red-100 text-red-700">Sin stock</Badge>}
                                  {!enStock && !sinStock && <Badge className="text-[8px] px-1 border-0 bg-amber-100 text-amber-700">Stock insuficiente</Badge>}
                                  <span className="text-[10px] text-red-500">{fmt(comp.precio * comp.qty)}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Margen ajustable */}
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Margen y precios
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">Margen (%)</label>
                            <input type="number" defaultValue={modelo.margen_ganancia}
                              onBlur={e => actualizarMargen(modelo, parseFloat(e.target.value) || 25)}
                              className="w-full h-7 text-xs px-2 border border-border rounded-lg bg-background font-semibold" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">Precio cliente ($)</label>
                            <input type="number" defaultValue={modelo.precio_cliente}
                              onBlur={e => actualizarPrecio(modelo, "precio_cliente", parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs px-2 border border-emerald-300 rounded-lg bg-emerald-50 text-emerald-700 font-semibold" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">Precio amigo ($)</label>
                            <input type="number" defaultValue={modelo.precio_amigo}
                              onBlur={e => actualizarPrecio(modelo, "precio_amigo", parseFloat(e.target.value) || 0)}
                              className="w-full h-7 text-xs px-2 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 font-semibold" />
                          </div>
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
                            disabled={!stockSuficiente}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                            <Zap className="h-3 w-3 mr-1" />
                            {stockSuficiente ? 'Vender esta PC' : 'Stock insuficiente'}
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
