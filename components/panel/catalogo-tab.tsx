"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Eye, EyeOff, ImageIcon, TrendingUp, TrendingDown, Download, Share2, Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { StockItem } from "@/app/page"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')
const MARCA = "Jer Abyte"
const LEMA = "La PC que cumple con tus exigencias diarias — vas a tener nuestra confianza y lealtad ante cualquier dificultad."

interface CatalogoItem {
  id?: string
  nombre: string
  descripcion: string
  precio_venta: number
  costo_total: number
  componentes: { nombre: string; qty: number; pcosto: number }[]
  estado: string
  foto_url: string
}

interface CatalogoTabProps {
  stock: StockItem[]
  setStock: (updater: StockItem[] | ((prev: StockItem[]) => StockItem[])) => Promise<void>
}

const ORDEN_SLOTS = [
  { cat: "Motherboard", label: "Motherboard" },
  { cat: "CPU", label: "Procesador (CPU)" },
  { cat: "RAM", label: "Memoria RAM", multi: true },
  { cat: "Almacenamiento", label: "Almacenamiento", multi: true },
  { cat: "Fuente", label: "Fuente de alimentación" },
  { cat: "Cooler", label: "Refrigeración" },
  { cat: "Gabinete", label: "Gabinete" },
  { cat: "GPU", label: "Placa de video (GPU)" },
  { cat: "Sistema Operativo", label: "Sistema Operativo" },
  { cat: "Adaptadores", label: "Adaptadores", multi: true },
]

export function CatalogoTab({ stock, setStock }: CatalogoTabProps) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [vistaCliente, setVistaCliente] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string>("")
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [componentsSeleccionados, setComponentsSeleccionados] = useState<{ sidx: number; qty: number; cat: string }[]>([])
  const [margen, setMargen] = useState(25)
  const [copiado, setCopiado] = useState(false)

  // Form state
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [costoTotal, setCostoTotal] = useState(0)

  const linkPublico = typeof window !== 'undefined'
    ? `${window.location.origin}/catalogo`
    : '/catalogo'

  const copiarLink = () => {
    navigator.clipboard.writeText(linkPublico)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const generarPDF = async () => {
    const disponibles = catalogo.filter(c => c.estado === 'Disponible')
    if (disponibles.length === 0) return

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210, mg = 18, cw = W - mg * 2

    // Header
    doc.setFillColor(15, 40, 80); doc.rect(0, 0, W, 36, 'F')
    doc.setFillColor(24, 95, 165); doc.circle(mg + 8, 18, 8, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('JA', mg + 8, 20, { align: 'center' })
    doc.setFontSize(20); doc.text(MARCA, mg + 20, 14)
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(180, 210, 255)
    doc.text('Catalogo de PCs disponibles', mg + 20, 22)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 220, 255)
    doc.text(new Date().toLocaleDateString('es-AR'), W - mg, 14, { align: 'right' })

    let y = 46

    for (const item of disponibles) {
      if (y > 230) { doc.addPage(); y = 20 }

      // Intentar cargar imagen si existe
      if (item.foto_url) {
        try {
          const resp = await fetch(item.foto_url)
          const blob = await resp.blob()
          const reader = new FileReader()
          await new Promise<void>(resolve => {
            reader.onload = () => {
              try {
                doc.addImage(reader.result as string, 'JPEG', mg, y, 50, 38)
              } catch { }
              resolve()
            }
            reader.readAsDataURL(blob)
          })
          // Texto al lado de la imagen
          doc.setTextColor(15, 40, 80); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
          doc.text(item.nombre, mg + 55, y + 8)
          if (item.descripcion) {
            doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
            const lines = doc.splitTextToSize(item.descripcion, cw - 60)
            lines.slice(0, 2).forEach((l: string, i: number) => { doc.text(l, mg + 55, y + 16 + i * 5) })
          }
          doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
          doc.text(fmt(item.precio_venta), mg + 55, y + 32)
          y += 46
        } catch {
          // Sin imagen
          doc.setTextColor(15, 40, 80); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
          doc.text(item.nombre, mg, y + 6)
          if (item.descripcion) {
            doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
            doc.text(item.descripcion.slice(0, 80), mg, y + 13)
          }
          doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
          doc.text(fmt(item.precio_venta), mg, y + 22)
          y += 32
        }
      } else {
        doc.setTextColor(15, 40, 80); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
        doc.text(item.nombre, mg, y + 6)
        if (item.descripcion) {
          doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
          doc.text(item.descripcion.slice(0, 80), mg, y + 13)
        }
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
        doc.text(fmt(item.precio_venta), mg, y + 22)
        y += 32
      }

      // Línea separadora
      doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3)
      doc.line(mg, y, W - mg, y)
      y += 6
    }

    // Footer
    const np = doc.internal.getNumberOfPages()
    for (let p = 1; p <= np; p++) {
      doc.setPage(p)
      doc.setFillColor(15, 40, 80); doc.rect(0, 285, W, 12, 'F')
      doc.setTextColor(180, 210, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'italic')
      doc.text(LEMA, W / 2, 292, { align: 'center' })
    }

    doc.save(`JerAbyte_Catalogo_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`)
  }

  useEffect(() => {
    cargarCatalogo()
  }, [])

  // Recalcular costo cuando cambian componentes seleccionados
  useEffect(() => {
    const ct = componentsSeleccionados.reduce((sum, c) => {
      const s = stock[c.sidx]
      return sum + (s ? s.precio * c.qty : 0)
    }, 0)
    setCostoTotal(ct)
    // Aplicar margen automáticamente si el usuario no editó el precio
    if (ct > 0) {
      setPrecioVenta(String(Math.round(ct * (1 + margen / 100))))
    }
  }, [componentsSeleccionados, margen])

  const pv = parseFloat(precioVenta) || 0
  const ganancia = pv - costoTotal
  const margenReal = costoTotal > 0 ? Math.round((ganancia / costoTotal) * 100) : 0
  const enRojo = ganancia < 0

  const cargarCatalogo = async () => {
    setLoading(true)
    const { data } = await supabase.from("catalogo").select("*").order("created_at", { ascending: false })
    if (data) {
      setCatalogo(data.map((r: any) => ({
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion || "",
        precio_venta: parseFloat(r.precio_venta),
        costo_total: parseFloat(r.costo_total),
        componentes: r.componentes || [],
        estado: r.estado,
        foto_url: r.foto_url || "",
      })))
    }
    setLoading(false)
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const agregarComponenteSlot = (sidx: number, cat: string) => {
    const yaEsta = componentsSeleccionados.find(c => c.sidx === sidx)
    if (yaEsta) return
    setComponentsSeleccionados(prev => [...prev, { sidx, qty: 1, cat }])
  }

  const quitarComponenteSlot = (sidx: number) => {
    setComponentsSeleccionados(prev => prev.filter(c => c.sidx !== sidx))
  }

  const limpiarForm = () => {
    setNombre("")
    setDescripcion("")
    setPrecioVenta("")
    setCostoTotal(0)
    setFotoPreview("")
    setFotoFile(null)
    setComponentsSeleccionados([])
    setMargen(25)
    setMostrarForm(false)
  }

  const guardarPC = async () => {
    if (!nombre.trim()) return
    setGuardando(true)

    let foto_url = ""
    if (fotoFile) {
      const ext = fotoFile.name.split(".").pop()
      const path = `${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage
        .from("pc-fotos")
        .upload(path, fotoFile, { upsert: true })

      if (uploadData) {
        const { data: urlData } = supabase.storage.from("pc-fotos").getPublicUrl(path)
        foto_url = urlData.publicUrl
      }
    }

    const comps = componentsSeleccionados.map(c => ({
      nombre: stock[c.sidx].nombre,
      qty: c.qty,
      pcosto: stock[c.sidx].precio,
      sidx: c.sidx,
    }))

    await supabase.from("catalogo").insert({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio_venta: pv,
      costo_total: costoTotal,
      componentes: comps,
      estado: "Disponible",
      foto_url,
    })

    await cargarCatalogo()
    limpiarForm()
    setGuardando(false)
  }

  const cambiarEstado = async (id: string, estado: string, item: CatalogoItem) => {
    // Si se marca como vendida, descontar del inventario
    if (estado === "Vendida" && item.estado !== "Vendida") {
      const newStock = stock.map((s, idx) => {
        const usado = (item.componentes as any[]).filter((c: any) => c.sidx === idx).reduce((t: number, c: any) => t + c.qty, 0)
        return usado > 0 ? { ...s, qty: Math.max(0, s.qty - usado) } : s
      })
      await setStock(newStock)
    }
    await supabase.from("catalogo").update({ estado, updated_at: new Date().toISOString() }).eq("id", id)
    await cargarCatalogo()
  }

  const eliminarPC = async (id: string, foto_url: string) => {
    if (foto_url) {
      const path = foto_url.split("/").pop()
      if (path) await supabase.storage.from("pc-fotos").remove([path])
    }
    await supabase.from("catalogo").delete().eq("id", id)
    await cargarCatalogo()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Catálogo de PCs armadas
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={copiarLink}
          >
            {copiado ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            {copiado ? "¡Copiado!" : "Copiar link"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={generarPDF}
            disabled={catalogo.filter(c => c.estado === 'Disponible').length === 0}
          >
            <Download className="h-3 w-3" />
            PDF catálogo
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setVistaCliente(!vistaCliente)}
          >
            {vistaCliente ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {vistaCliente ? "Vista interna" : "Vista cliente"}
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMostrarForm(!mostrarForm)}
          >
            <Plus className="h-3 w-3" />
            Nueva PC
          </Button>
        </div>
      </div>

      {/* Formulario nueva PC */}
      {mostrarForm && (
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4 space-y-4">
            <p className="text-xs font-medium">Agregar PC al catálogo</p>

            {/* Foto */}
            <div
              className="border-2 border-dashed border-muted rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {fotoPreview ? (
                <img src={fotoPreview} alt="preview" className="max-h-48 mx-auto rounded-lg object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs">Tocá para subir una foto de la PC</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            </div>

            {/* Nombre y descripción */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nombre de la PC</label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="ej: Gaming Entry Level" className="h-8 text-sm" />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-muted-foreground">Descripción</label>
                <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="ej: Ideal para gaming 1080p y trabajo diario" className="text-sm min-h-[60px]" />
              </div>
            </div>

            {/* Componentes por slot */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Componentes</p>
              {ORDEN_SLOTS.map(slot => {
                const stockDeCat = stock.filter(s => s.cat === slot.cat && s.qty > 0)
                const seleccionados = componentsSeleccionados.filter(c => stock[c.sidx]?.cat === slot.cat)
                return (
                  <div key={slot.cat} className={`rounded-lg px-3 py-2 ${seleccionados.length > 0 ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-medium">{slot.label}</span>
                      {seleccionados.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {seleccionados.map(c => (
                            <div key={c.sidx} className="flex items-center gap-1 bg-white dark:bg-black/20 rounded px-2 py-0.5">
                              <span className="text-[10px]">{stock[c.sidx]?.nombre}</span>
                              <button onClick={() => quitarComponenteSlot(c.sidx)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {(slot.multi || seleccionados.length === 0) && stockDeCat.length > 0 && (
                        <Select value="" onValueChange={val => agregarComponenteSlot(parseInt(val), slot.cat)}>
                          <SelectTrigger className="h-6 text-[10px] w-auto min-w-[140px]">
                            <SelectValue placeholder="+ Agregar" />
                          </SelectTrigger>
                          <SelectContent>
                            {stockDeCat.map(s => {
                              const idx = stock.indexOf(s)
                              const yaUsado = componentsSeleccionados.find(c => c.sidx === idx)
                              if (yaUsado) return null
                              return <SelectItem key={idx} value={String(idx)}>{s.nombre} — {fmt(s.precio)}</SelectItem>
                            })}
                          </SelectContent>
                        </Select>
                      )}
                      {stockDeCat.length === 0 && seleccionados.length === 0 && (
                        <span className="text-[10px] text-muted-foreground italic">Sin stock</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Precio con margen editable */}
            <div className="space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Precio y margen</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Costo total</label>
                  <div className="h-8 px-3 flex items-center text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-200">
                    {fmt(costoTotal)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Margen base (%)</label>
                  <Input
                    type="number"
                    value={margen}
                    onChange={e => setMargen(parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Precio de venta (editable)</label>
                  <Input
                    type="number"
                    value={precioVenta}
                    onChange={e => setPrecioVenta(e.target.value)}
                    className={`h-8 text-sm font-medium ${enRojo ? 'border-red-400 bg-red-50' : 'border-emerald-400 bg-emerald-50'}`}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Indicador ganancia/pérdida */}
              {costoTotal > 0 && (
                <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${enRojo ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                  {enRojo
                    ? <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                    : <TrendingUp className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  }
                  <div className="flex gap-4 flex-wrap">
                    <span className="text-xs">
                      <span className="text-muted-foreground">Ganancia: </span>
                      <span className={`font-semibold ${enRojo ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(ganancia)}</span>
                    </span>
                    <span className="text-xs">
                      <span className="text-muted-foreground">Margen real: </span>
                      <span className={`font-semibold ${enRojo ? 'text-red-600' : 'text-emerald-600'}`}>{margenReal}%</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={guardarPC} disabled={guardando || !nombre.trim()} className="h-8 text-xs">
                {guardando ? "Guardando..." : "Agregar al catálogo"}
              </Button>
              <Button size="sm" variant="outline" onClick={limpiarForm} className="h-8 text-xs">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Catálogo */}
      {loading ? (
        <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">Cargando catálogo...</div>
      ) : catalogo.length === 0 ? (
        <div className="text-center py-10 text-xs text-muted-foreground">
          No hay PCs en el catálogo todavía. Agregá la primera con el botón de arriba.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {catalogo.map(item => (
            <Card key={item.id} className={`border-0 overflow-hidden ${item.estado === 'Vendida' ? 'opacity-60' : ''}`}>
              {/* Foto */}
              {item.foto_url ? (
                <div className="relative h-44 bg-muted">
                  <img src={item.foto_url} alt={item.nombre} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <Badge className={`text-[9px] ${item.estado === 'Disponible' ? 'bg-emerald-600' : item.estado === 'Reservada' ? 'bg-amber-500' : 'bg-gray-500'}`}>
                      {item.estado}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="h-24 bg-muted/50 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  <Badge className={`absolute top-2 right-2 text-[9px] ${item.estado === 'Disponible' ? 'bg-emerald-600' : item.estado === 'Reservada' ? 'bg-amber-500' : 'bg-gray-500'}`}>
                    {item.estado}
                  </Badge>
                </div>
              )}

              <CardContent className="p-3 space-y-2">
                <div>
                  <h3 className="text-sm font-semibold">{item.nombre}</h3>
                  {item.descripcion && <p className="text-[11px] text-muted-foreground mt-0.5">{item.descripcion}</p>}
                </div>

                {/* Precio al cliente siempre visible */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Precio de venta</div>
                    <div className="text-lg font-bold text-emerald-600">{fmt(item.precio_venta)}</div>
                  </div>

                  {/* Vista interna — costo y ganancia */}
                  {!vistaCliente && (
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Costo / Ganancia</div>
                      <div className="text-xs text-red-500">{fmt(item.costo_total)}</div>
                      <div className={`text-xs font-medium ${item.precio_venta - item.costo_total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.precio_venta - item.costo_total >= 0 ? '+' : ''}{fmt(item.precio_venta - item.costo_total)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Componentes */}
                {!vistaCliente && item.componentes.length > 0 && (
                  <div className="space-y-0.5">
                    {(item.componentes as any[]).map((c: any, i: number) => (
                      <div key={i} className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{c.nombre} x{c.qty}</span>
                        <span>{fmt(c.pcosto * c.qty)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Acciones */}
                {!vistaCliente && (
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <Select value={item.estado} onValueChange={val => cambiarEstado(item.id!, val, item)}>
                      <SelectTrigger className="h-6 text-[10px] flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Disponible">Disponible</SelectItem>
                        <SelectItem value="Reservada">Reservada</SelectItem>
                        <SelectItem value="Vendida">Vendida</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-600"
                      onClick={() => eliminarPC(item.id!, item.foto_url)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
