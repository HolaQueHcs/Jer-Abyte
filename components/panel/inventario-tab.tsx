"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Trash2 } from "lucide-react"
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
  const [tipo, setTipo] = useState<'real' | 'referencia'>('real')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'real' | 'referencia'>('todos')

  const agregarComponente = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    await setStock([...stock, {
      nombre: nombre.trim(),
      cat: categoria,
      precio: parseFloat(precio) || 0,
      qty: tipo === 'referencia' ? 0 : (parseInt(cantidad) || 0),
      min: tipo === 'referencia' ? 0 : (parseInt(minimo) || 1),
      nota: nota.trim(),
      tipo
    }])
    setNombre(""); setPrecio(""); setCantidad(""); setMinimo("2"); setNota("")
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
                                <div className="flex items-center gap-1.5 mt-1">
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
                                    className="w-28 h-6 text-[11px] px-2 border border-border rounded-md bg-background text-foreground"
                                  />
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

                              {/* Eliminar */}
                              <div className="flex flex-col items-center gap-1 min-w-[40px]">
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
    </div>
  )
}
