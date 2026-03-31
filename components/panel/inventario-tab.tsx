"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Trash2, Camera, X, Check, Search, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { StockItem } from "@/app/page"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

interface InventarioTabProps {
  stock: StockItem[]
  setStock: (updater: StockItem[] | ((prev: StockItem[]) => StockItem[])) => Promise<void>
  loading?: boolean
}

const categorias = ["CPU", "GPU", "RAM", "Almacenamiento", "Motherboard", "Fuente", "Gabinete", "Cooler", "Otro"]

export function InventarioTab({ stock, setStock, loading = false }: InventarioTabProps) {
  const [nombre, setNombre] = useState("")
  const [categoria, setCategoria] = useState("CPU")
  const [precio, setPrecio] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [minimo, setMinimo] = useState("2")
  const [nota, setNota] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [tipo, setTipo] = useState<'real' | 'referencia'>('real')
  const supabase = createClient()
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'real' | 'referencia'>('todos')
  // Estados para manejo de fotos
  const [fotoModal, setFotoModal] = useState<number | null>(null)
  const [urlManual, setUrlManual] = useState("")
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")

  const guardarFoto = async (index: number, url: string) => {
    if (!url.trim()) return
    setSubiendoFoto(true)
    const newItems = [...stock]
    newItems[index] = { ...newItems[index], foto_url: url.trim() }
    await setStock(newItems)
    setFotoModal(null)
    setUrlManual("")
    setPreviewUrl("")
    setSubiendoFoto(false)
  }

  const subirFotoManual = async (index: number, file: File) => {
    setSubiendoFoto(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `componente-${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('componentes-fotos').upload(path, file, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('componentes-fotos').getPublicUrl(path)
        await guardarFoto(index, urlData.publicUrl)
      }
    } catch {}
    setSubiendoFoto(false)
  }

  const eliminarFoto = async (index: number) => {
    const newItems = [...stock]
    newItems[index] = { ...newItems[index], foto_url: "" }
    await setStock(newItems)
  }

  const agregarComponente = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    await setStock([...stock, {
      nombre: nombre.trim(),
      cat: categoria,
      precio: parseFloat(precio) || 0,
      precio_venta: parseFloat(precioVenta) || 0,
      qty: tipo === 'referencia' ? 0 : (parseInt(cantidad) || 0),
      min: tipo === 'referencia' ? 0 : (parseInt(minimo) || 1),
      nota: nota.trim(),
      tipo
    }])
    setNombre(""); setPrecio(""); setPrecioVenta(""); setCantidad(""); setMinimo("2"); setNota("")
    setGuardando(false)
  }

  const cambiarStock = async (index: number, delta: number) => {
    const item = stock[index]
    if (item.tipo === 'referencia') return
    const newItems = [...stock]
    newItems[index] = { ...newItems[index], qty: Math.max(0, newItems[index].qty + delta) }
    await setStock(newItems)
  }

  const eliminarComponente = async (index: number) => {
    if (confirmDelete === index) {
      setGuardando(true)
      await setStock(stock.filter((_, i) => i !== index))
      setConfirmDelete(null)
      setGuardando(false)
    } else {
      setConfirmDelete(index)
      setTimeout(() => setConfirmDelete(c => c === index ? null : c), 3000)
    }
  }

  const stockFiltrado = filtro === 'todos' ? stock : stock.filter(s => s.tipo === filtro)
  const categoriasConItems = [...new Set(stockFiltrado.map(s => s.cat))]
  const cantRef = stock.filter(s => s.tipo === 'referencia').length
  const cantReal = stock.filter(s => s.tipo !== 'referencia').length

  return (
    <div className="space-y-5">
      {/* Agregar componente */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Agregar componente</p>
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4 space-y-3">
            {/* Tipo */}
            <div className="flex gap-2">
              <button
                onClick={() => setTipo('real')}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-colors ${tipo === 'real' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-border text-muted-foreground hover:border-emerald-400'}`}>
                🟢 Real — tengo en stock
              </button>
              <button
                onClick={() => setTipo('referencia')}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-colors ${tipo === 'referencia' ? 'bg-amber-500 text-white border-amber-500' : 'border-border text-muted-foreground hover:border-amber-400'}`}>
                🟡 Referencia — para presupuestos
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nombre</label>
                <Input placeholder="ej: RTX 4060" value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Categoria</label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Precio de costo ($)</label>
                <Input type="number" placeholder="ej: 180000" value={precio} onChange={(e) => setPrecio(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">💰 Precio sugerido de venta ($) <span className="text-muted-foreground/60">(opcional)</span></label>
                <Input type="number" placeholder="ej: 220000" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} className="h-8 text-sm bg-emerald-50 border-emerald-200" />
              </div>
              {tipo === 'real' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Cantidad en stock</label>
                  <Input type="number" placeholder="ej: 3" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="h-8 text-sm" />
                </div>
              )}
            </div>
            {tipo === 'real' && (
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Stock minimo para alerta</label>
                <Input type="number" value={minimo} onChange={(e) => setMinimo(e.target.value)} className="h-8 text-sm w-24" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">📝 Nota privada (ej: dónde comprarlo)</label>
              <Input placeholder="ej: MercadoLibre — vendedor TechStore" value={nota} onChange={(e) => setNota(e.target.value)} className="h-8 text-sm" />
            </div>
            <Button size="sm" onClick={agregarComponente} disabled={guardando} className="h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" />{guardando ? "Guardando..." : "Agregar al inventario"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Inventario actual */}
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Inventario — {cantReal} reales · {cantRef} de referencia
          </p>
          {guardando && <span className="text-[10px] text-blue-500 animate-pulse">Guardando...</span>}
        </div>

        {/* Filtros */}
        <div className="flex gap-1 mb-3">
          {(['todos', 'real', 'referencia'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${filtro === f ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-muted-foreground hover:border-blue-400'}`}>
              {f === 'todos' ? 'Todos' : f === 'real' ? '🟢 Reales' : '🟡 Referencia'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">Cargando inventario...</div>
        ) : stockFiltrado.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Sin componentes.</div>
        ) : (
          <div className="space-y-4">
            {categoriasConItems.map(cat => {
              const items = stockFiltrado.filter(s => s.cat === cat)
              return (
                <div key={cat}>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">{cat}</p>
                  <div className="space-y-2">
                    {items.map(item => {
                      const index = stock.indexOf(item)
                      const esRef = item.tipo === 'referencia'
                      const nivel = esRef ? 0 : Math.min(100, Math.round((item.qty / (item.min * 3)) * 100))
                      const estado = esRef ? 'ref' : item.qty <= item.min ? 'bajo' : item.qty <= item.min * 1.5 ? 'moderado' : 'ok'
                      const color = estado === 'bajo' ? '#ef4444' : estado === 'moderado' ? '#f59e0b' : estado === 'ref' ? '#f59e0b' : '#10b981'
                      const isConfirming = confirmDelete === index
                      return (
                        <Card key={index} className={`border-0 ${esRef ? 'bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50' : 'bg-card/80'}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <input
                                    type="text"
                                    defaultValue={item.nombre}
                                    onBlur={async (e) => {
                                      const nuevo = e.target.value.trim()
                                      if (nuevo && nuevo !== item.nombre) {
                                        const newItems = [...stock]
                                        newItems[index] = { ...newItems[index], nombre: nuevo }
                                        await setStock(newItems)
                                      }
                                    }}
                                    className="text-xs font-medium bg-transparent border-b border-transparent hover:border-border focus:border-blue-400 focus:outline-none px-0.5 min-w-[100px]"
                                  />
                                  {esRef && <Badge className="text-[8px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300">Ref.</Badge>}
                                  {!esRef && estado === 'bajo' && <Badge variant="destructive" className="text-[8px] px-1.5 py-0">Stock bajo</Badge>}
                                  {!esRef && estado === 'moderado' && <Badge className="text-[8px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300">Moderado</Badge>}
                                  {!esRef && estado === 'ok' && <Badge className="text-[8px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-300">OK</Badge>}
                                </div>
                                {!esRef && <p className="text-[10px] text-muted-foreground">Min: {item.min}</p>}
                                {esRef && <p className="text-[10px] text-amber-600">Solo para presupuestos — no descuenta stock</p>}
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="text-[10px] text-muted-foreground">Costo:</span>
                                  <input
                                    type="number"
                                    defaultValue={item.precio}
                                    onBlur={async (e) => {
                                      const nuevo = parseFloat(e.target.value) || 0
                                      if (nuevo !== item.precio) {
                                        const newItems = [...stock]
                                        newItems[index] = { ...newItems[index], precio: nuevo }
                                        await setStock(newItems)
                                      }
                                    }}
                                    className="w-24 h-6 text-[11px] px-2 border border-border rounded-md bg-background text-foreground"
                                  />
                                  <span className="text-[10px] text-emerald-600 font-medium ml-1">💰 Venta:</span>
                                  <input
                                    type="number"
                                    defaultValue={item.precio_venta || ""}
                                    placeholder="sin precio"
                                    onBlur={async (e) => {
                                      const nuevo = parseFloat(e.target.value) || 0
                                      if (nuevo !== (item.precio_venta || 0)) {
                                        const newItems = [...stock]
                                        newItems[index] = { ...newItems[index], precio_venta: nuevo }
                                        await setStock(newItems)
                                      }
                                    }}
                                    className="w-24 h-6 text-[11px] px-2 border border-emerald-200 rounded-md bg-emerald-50 text-foreground placeholder:text-muted-foreground/40"
                                  />
                                  {item.precio_venta && item.precio_venta > 0 && item.precio > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-semibold">
                                      +{Math.round(((item.precio_venta - item.precio) / item.precio) * 100)}%
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-[10px] text-muted-foreground">📝</span>
                                  <input
                                    type="text"
                                    defaultValue={item.nota || ""}
                                    placeholder="Nota privada"
                                    onBlur={async (e) => {
                                      const nueva = e.target.value.trim()
                                      if (nueva !== (item.nota || "")) {
                                        const newItems = [...stock]
                                        newItems[index] = { ...newItems[index], nota: nueva }
                                        await setStock(newItems)
                                      }
                                    }}
                                    className="flex-1 h-6 text-[11px] px-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground/50"
                                  />
                                </div>
                                {!esRef && (
                                  <div className="h-1 rounded-full bg-muted mt-1.5 overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${nivel}%`, backgroundColor: color }} />
                                  </div>
                                )}
                              </div>

                              {/* Cantidad */}
                              <div className="text-center min-w-[60px]">
                                {esRef ? (
                                  <div className="text-[10px] text-amber-600 font-medium text-center">Precio<br/>ref.</div>
                                ) : (
                                  <>
                                    <div className="text-xl font-semibold" style={{ color }}>{item.qty}</div>
                                    <div className="text-[9px] text-muted-foreground">unidades</div>
                                    <div className="flex gap-1 mt-1">
                                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => cambiarStock(index, -1)}>
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => cambiarStock(index, 1)}>
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Foto + Eliminar */}
                              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                                {/* Botón foto */}
                                <button
                                  onClick={() => { setFotoModal(index); setUrlManual(""); setPreviewUrl("") }}
                                  title={item.foto_url ? "Cambiar foto" : "Agregar foto"}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-border hover:border-blue-400 hover:bg-blue-50 transition-all relative overflow-hidden"
                                >
                                  {item.foto_url ? (
                                    <img src={item.foto_url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </button>
                                {/* Eliminar */}
                                <Button
                                  variant={isConfirming ? "destructive" : "ghost"}
                                  size="icon"
                                  className={`h-7 w-7 transition-all ${isConfirming ? "" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"}`}
                                  onClick={() => eliminarComponente(index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                {isConfirming && <span className="text-[8px] text-red-500 text-center leading-tight w-12">¿Confirmar?</span>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de foto */}
      {fotoModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Foto del componente</h3>
                <p className="text-[11px] text-muted-foreground">{stock[fotoModal]?.nombre}</p>
              </div>
              <button onClick={() => { setFotoModal(null); setUrlManual(""); setPreviewUrl("") }}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Foto actual */}
            {stock[fotoModal]?.foto_url && (
              <div className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-xl border border-border">
                <img src={stock[fotoModal].foto_url} alt="" className="h-14 w-14 object-cover rounded-lg border" />
                <div className="flex-1">
                  <p className="text-xs font-medium">Foto actual</p>
                  <button onClick={() => { eliminarFoto(fotoModal!); setFotoModal(null) }}
                    className="text-[11px] text-red-500 hover:text-red-700 mt-0.5 transition-colors">
                    Eliminar foto
                  </button>
                </div>
              </div>
            )}

            {/* Opción 1: Pegar URL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-blue-500" />
                <p className="text-xs font-medium">Pegar URL de imagen</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Buscá en Google Images, clic derecho en la foto → "Copiar dirección de imagen" y pegala acá.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlManual}
                  onChange={e => { setUrlManual(e.target.value); setPreviewUrl(e.target.value) }}
                  placeholder="https://..."
                  className="flex-1 h-8 text-xs px-2 border border-border rounded-lg bg-background outline-none focus:border-blue-400"
                />
                {urlManual && (
                  <button onClick={() => { setUrlManual(""); setPreviewUrl("") }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {/* Preview de URL */}
              {previewUrl && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-xl border border-blue-200">
                  <img src={previewUrl} alt="" className="h-12 w-12 object-cover rounded-lg border"
                    onError={() => setPreviewUrl("")} />
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-blue-700">Vista previa</p>
                    <p className="text-[10px] text-blue-500">Si se ve bien, confirmá.</p>
                  </div>
                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                    disabled={subiendoFoto}
                    onClick={() => fotoModal !== null && guardarFoto(fotoModal, urlManual)}>
                    <Check className="h-3 w-3 mr-1" />
                    {subiendoFoto ? "..." : "OK"}
                  </Button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground">o</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Opción 2: Subir manual */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-xs font-medium">Subir desde tu dispositivo</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-3 border-2 border-dashed border-border rounded-xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {subiendoFoto ? "Subiendo..." : "Elegir imagen (jpg, png, webp)"}
                </span>
                <input type="file" accept="image/*" className="hidden" disabled={subiendoFoto}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file && fotoModal !== null) subirFotoManual(fotoModal, file)
                  }} />
              </label>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
