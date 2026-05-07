"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Minus, Trash2, Camera, X, Check, Search, Upload, Package, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { StockItem } from "@/app/page"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

interface InventarioTabProps {
  stock: StockItem[]
  setStock: (updater: StockItem[] | ((prev: StockItem[]) => StockItem[])) => Promise<void>
  loading?: boolean
}

const categorias = ["CPU", "GPU", "RAM", "Almacenamiento", "Motherboard", "Fuente", "Gabinete", "Cooler", "Servicio Técnico", "Otro"]

export function InventarioTab({ stock, setStock, loading = false }: InventarioTabProps) {
  const [nombre, setNombre] = useState("")
  const [categoria, setCategoria] = useState("CPU")
  const [precio, setPrecio] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [minimo, setMinimo] = useState("2")
  const [nota, setNota] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [tipoProducto, setTipoProducto] = useState<'HARDWARE' | 'SERVICIO'>('HARDWARE')
  const supabase = createClient()
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'HARDWARE' | 'SERVICIO'>('todos')
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
      qty: tipoProducto === 'SERVICIO' ? 999 : (parseInt(cantidad) || 0),
      min: tipoProducto === 'SERVICIO' ? 0 : (parseInt(minimo) || 1),
      nota: nota.trim(),
      tipo: tipoProducto
    }])
    setNombre(""); setPrecio(""); setPrecioVenta(""); setCantidad(""); setMinimo("2"); setNota("")
    setGuardando(false)
  }

  const cambiarStock = async (index: number, delta: number) => {
    const item = stock[index]
    if (item.tipo === 'SERVICIO') return
    const newItems = [...stock]
    newItems[index] = { ...newItems[index], qty: Math.max(0, newItems[index].qty + delta) }
    await setStock(newItems)
  }

  const toggleServicioActivo = async (index: number) => {
    const item = stock[index]
    if (item.tipo !== 'SERVICIO') return
    const newItems = [...stock]
    // Usar qty como flag: 999 = activo, 0 = inactivo
    newItems[index] = { ...newItems[index], qty: item.qty > 0 ? 0 : 999 }
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
  const cantServicio = stock.filter(s => s.tipo === 'SERVICIO').length
  const cantHardware = stock.filter(s => s.tipo === 'HARDWARE').length

  return (
    <div className="space-y-5">
      {/* Agregar componente */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Agregar producto</p>
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4 space-y-3">
            {/* Tipo de producto */}
            <div className="flex gap-2">
              <button
                onClick={() => { setTipoProducto('HARDWARE'); setCategoria('CPU') }}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-colors flex items-center justify-center gap-2 ${tipoProducto === 'HARDWARE' ? 'bg-blue-500 text-white border-blue-500' : 'border-border text-muted-foreground hover:border-blue-400'}`}>
                <Package className="h-3.5 w-3.5" />
                HARDWARE — componentes físicos
              </button>
              <button
                onClick={() => { setTipoProducto('SERVICIO'); setCategoria('Servicio Técnico') }}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-colors flex items-center justify-center gap-2 ${tipoProducto === 'SERVICIO' ? 'bg-orange-500 text-white border-orange-500' : 'border-border text-muted-foreground hover:border-orange-400'}`}>
                <Settings className="h-3.5 w-3.5" />
                SERVICIO — sin stock físico
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nombre</label>
                <Input placeholder={tipoProducto === 'HARDWARE' ? "ej: RTX 4060" : "ej: Mantenimiento Preventivo"} value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Categoría</label>
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
                <label className="text-[10px] text-muted-foreground">
                  {tipoProducto === 'HARDWARE' ? 'Precio de costo ($)' : 'Costo interno ($)'}
                </label>
                <Input type="number" placeholder="ej: 180000" value={precio} onChange={(e) => setPrecio(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">💰 Precio al cliente ($)</label>
                <Input type="number" placeholder="ej: 220000" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} className="h-8 text-sm bg-emerald-50 border-emerald-200" />
              </div>

              {tipoProducto === 'HARDWARE' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Cantidad inicial</label>
                    <Input type="number" placeholder="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Stock mínimo (alerta)</label>
                    <Input type="number" placeholder="2" value={minimo} onChange={(e) => setMinimo(e.target.value)} className="h-8 text-sm" />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">
                {tipoProducto === 'HARDWARE' ? 'Notas / Especificaciones' : 'Descripción del servicio'}
              </label>
              <Input 
                placeholder={tipoProducto === 'HARDWARE' ? "ej: 8GB DDR4 3200MHz" : "ej: Incluye limpieza profunda y cambio de pasta térmica"} 
                value={nota} 
                onChange={(e) => setNota(e.target.value)} 
                className="h-8 text-sm" 
              />
            </div>

            <Button onClick={agregarComponente} disabled={guardando || !nombre.trim()} className="w-full h-9">
              <Plus className="h-4 w-4 mr-2" />
              {guardando ? "Guardando..." : `Agregar ${tipoProducto === 'HARDWARE' ? 'componente' : 'servicio'}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filtro === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('todos')}
          className="h-8 text-xs"
        >
          Todos ({stock.length})
        </Button>
        <Button
          variant={filtro === 'HARDWARE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('HARDWARE')}
          className="h-8 text-xs"
        >
          <Package className="h-3 w-3 mr-1" />
          Hardware ({cantHardware})
        </Button>
        <Button
          variant={filtro === 'SERVICIO' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('SERVICIO')}
          className="h-8 text-xs"
        >
          <Settings className="h-3 w-3 mr-1" />
          Servicios ({cantServicio})
        </Button>
      </div>

      {/* Lista de inventario */}
      <div>
        {loading ? (
          <div className="text-center py-10 text-xs text-muted-foreground">Cargando inventario...</div>
        ) : stockFiltrado.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            {filtro === 'todos' ? 'No hay productos cargados todavía.' : `No hay ${filtro === 'HARDWARE' ? 'componentes' : 'servicios'} en inventario.`}
          </div>
        ) : (
          <div className="space-y-4">
            {categoriasConItems.map(cat => {
              const items = stockFiltrado.filter(s => s.cat === cat)
              return (
                <div key={cat}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{cat}</p>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {items.map((item, globalIndex) => {
                      const index = stock.findIndex(s => s === item)
                      const isConfirming = confirmDelete === index
                      const esServicio = item.tipo === 'SERVICIO'
                      const servicioActivo = esServicio && item.qty > 0

                      let color = "text-muted-foreground"
                      if (!esServicio) {
                        if (item.qty === 0) color = "text-red-500"
                        else if (item.qty <= item.min) color = "text-amber-500"
                        else color = "text-emerald-600"
                      }

                      return (
                        <Card key={index} className="border-0 bg-card/60 hover:bg-card transition-colors">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              {/* Badge tipo */}
                              <div className="flex-shrink-0">
                                {esServicio ? (
                                  <Badge className={`text-[9px] px-2 ${servicioActivo ? 'bg-emerald-500' : 'bg-slate-400'} text-white border-0`}>
                                    {servicioActivo ? 'ACTIVO' : 'INACTIVO'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] px-2">HARDWARE</Badge>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <span className="text-sm font-medium truncate">{item.nombre}</span>
                                  {!esServicio && item.qty <= item.min && item.qty > 0 && (
                                    <Badge className="text-[8px] px-1.5 border-0 bg-amber-100 text-amber-700">Stock bajo</Badge>
                                  )}
                                  {!esServicio && item.qty === 0 && (
                                    <Badge className="text-[8px] px-1.5 border-0 bg-red-100 text-red-700">Sin stock</Badge>
                                  )}
                                </div>
                                {item.nota && <p className="text-[10px] text-muted-foreground truncate">{item.nota}</p>}
                                <div className="flex gap-3 mt-1">
                                  <span className="text-[10px] text-red-500">Costo: {fmt(item.precio)}</span>
                                  {item.precio_venta > 0 && (
                                    <span className="text-[10px] text-emerald-600">Venta: {fmt(item.precio_venta)}</span>
                                  )}
                                </div>
                              </div>

                              {/* Controles */}
                              {esServicio ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground">{servicioActivo ? 'Activo' : 'Inactivo'}</span>
                                    <Switch
                                      checked={servicioActivo}
                                      onCheckedChange={() => toggleServicioActivo(index)}
                                      className="scale-75"
                                    />
                                  </div>
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
                                </div>
                              ) : (
                                <div className="text-center min-w-[60px]">
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
                                </div>
                              )}

                              {/* Foto + Eliminar */}
                              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                                {!esServicio && (
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
                                )}
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Foto del producto</h3>
                <p className="text-[11px] text-muted-foreground">{stock[fotoModal]?.nombre}</p>
              </div>
              <button onClick={() => { setFotoModal(null); setUrlManual(""); setPreviewUrl("") }}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

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

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-blue-500" />
                <p className="text-xs font-medium">Pegar URL de imagen</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Buscá en Google Images, clic derecho → "Copiar dirección de imagen".</p>
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
              {previewUrl && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-xl border border-blue-200">
                  <img src={previewUrl} alt="" className="h-12 w-12 object-cover rounded-lg border"
                    onError={() => setPreviewUrl("")} />
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-blue-700">Vista previa</p>
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

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground">o</span>
              <div className="flex-1 h-px bg-border" />
            </div>

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
