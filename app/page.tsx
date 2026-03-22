"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Monitor, Cpu, Calculator, Package, BarChart3, CheckSquare, LogOut, Store, Wallet } from "lucide-react"
import { ResumenTab } from "@/components/panel/resumen-tab"
import { ArmadoTab } from "@/components/panel/armado-tab"
import { CalculadoraTab } from "@/components/panel/calculadora-tab"
import { InventarioTab } from "@/components/panel/inventario-tab"
import { GraficosTab } from "@/components/panel/graficos-tab"
import { ChecklistTab } from "@/components/panel/checklist-tab"
import { CatalogoTab } from "@/components/panel/catalogo-tab"
import { ChecklistSidebar } from "@/components/panel/checklist-sidebar"
import { AgendaSidebar } from "@/components/panel/agenda-sidebar"
import { PagosTab } from "@/components/panel/pagos-tab"
import { DecorativeBackground } from "@/components/decorative-background"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export interface StockItem {
  id?: string
  nombre: string
  cat: string
  qty: number
  precio: number
  min: number
  nota?: string
}

export interface ArmadoItem {
  nombre: string
  cat: string
  pcosto: number
  pventa: number
  qty: number
  sidx: number | null
  ext: boolean
  slotId?: string
}

export interface ChecklistItem {
  t: string
  c: string
  done: boolean
}

const initialChecklist: ChecklistItem[] = [
  { t: "Verificar compatibilidad de componentes", c: "Preparacion", done: false },
  { t: "Preparar gabinete", c: "Preparacion", done: false },
  { t: "Instalar fuente (PSU)", c: "Instalacion", done: false },
  { t: "Colocar CPU en la motherboard", c: "Instalacion", done: false },
  { t: "Aplicar pasta termica e instalar cooler", c: "Instalacion", done: false },
  { t: "Instalar modulos de RAM", c: "Instalacion", done: false },
  { t: "Montar motherboard en el gabinete", c: "Instalacion", done: false },
  { t: "Instalar almacenamiento (SSD/HDD)", c: "Instalacion", done: false },
  { t: "Instalar GPU", c: "Instalacion", done: false },
  { t: "Conectar todos los cables", c: "Cableado", done: false },
  { t: "Gestion de cables", c: "Cableado", done: false },
  { t: "Verificar conexiones antes de encender", c: "Pruebas", done: false },
  { t: "Primer encendido (POST test)", c: "Pruebas", done: false },
  { t: "Instalar sistema operativo", c: "Software", done: false },
  { t: "Instalar drivers esenciales", c: "Software", done: false },
  { t: "Prueba de estres CPU y GPU (15 min)", c: "Pruebas", done: false },
  { t: "Verificar temperaturas en carga", c: "Pruebas", done: false },
  { t: "Documentar y entregar al cliente", c: "Entrega", done: false },
]

export default function PanelOperativo() {
  const [stock, setStockState] = useState<StockItem[]>([])
  const [loadingStock, setLoadingStock] = useState(true)
  const [armado, setArmado] = useState<ArmadoItem[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist)
  const [ventas, setVentas] = useState(0)
  const [gananciaTotal, setGananciaTotal] = useState(0)
  const [pcArmadas, setPcArmadas] = useState(0)
  const [totalVendido, setTotalVendido] = useState(0)
  const [totalCosto, setTotalCosto] = useState(0)
  const [margenGlobal, setMargenGlobal] = useState(25)
  const [activeTab, setActiveTab] = useState("resumen")
  const router = useRouter()
  const supabase = createClient()

  const cargarStock = useCallback(async () => {
    setLoadingStock(true)
    const { data, error } = await supabase.from("stock").select("*").order("created_at", { ascending: true })
    if (!error && data) {
      setStockState(data.map((row: any) => ({
        id: row.id, nombre: row.nombre, cat: row.categoria,
        qty: row.cantidad, precio: parseFloat(row.precio), min: row.minimo, nota: row.nota || "",
      })))
    }
    setLoadingStock(false)
  }, [])

  const cargarMetricas = useCallback(async () => {
    const { data: ventasData } = await supabase.from("ventas").select("monto, costo, ganancia")
    if (ventasData) {
      setVentas(ventasData.length)
      setTotalVendido(ventasData.reduce((s: number, r: any) => s + parseFloat(r.monto), 0))
      setTotalCosto(ventasData.reduce((s: number, r: any) => s + parseFloat(r.costo), 0))
      setGananciaTotal(ventasData.reduce((s: number, r: any) => s + parseFloat(r.ganancia), 0))
    }
    const { data: metData } = await supabase.from("metricas").select("pc_armadas")
    if (metData) setPcArmadas(metData.reduce((s: number, r: any) => s + r.pc_armadas, 0))
  }, [])

  useEffect(() => { cargarStock(); cargarMetricas() }, [cargarStock, cargarMetricas])

  const setStock = async (updater: StockItem[] | ((prev: StockItem[]) => StockItem[])) => {
    const prev = stock
    const newStock = typeof updater === "function" ? updater(prev) : updater
    const inserts = newStock.filter(i => !i.id)
    for (const item of inserts) {
      const { data } = await supabase.from("stock").insert({ nombre: item.nombre, categoria: item.cat, cantidad: item.qty, precio: item.precio, minimo: item.min, nota: item.nota || "" }).select().single()
      if (data) item.id = data.id
    }
    const updates = newStock.filter(i => {
      if (!i.id) return false
      const orig = prev.find(p => p.id === i.id)
      return orig && (orig.qty !== i.qty || orig.precio !== i.precio || orig.min !== i.min || orig.nombre !== i.nombre || orig.cat !== i.cat || orig.nota !== i.nota)
    })
    for (const item of updates) {
      await supabase.from("stock").update({ nombre: item.nombre, categoria: item.cat, cantidad: item.qty, precio: item.precio, minimo: item.min, nota: item.nota || "", updated_at: new Date().toISOString() }).eq("id", item.id)
    }
    const deletes = prev.filter(p => p.id && !newStock.find(n => n.id === p.id))
    for (const item of deletes) await supabase.from("stock").delete().eq("id", item.id!)
    setStockState([...newStock])
  }

  const guardarVenta = async (monto: number, costo: number) => {
    const ganancia = monto - costo
    await supabase.from("ventas").insert({ monto, costo, ganancia })
    const hoy = new Date().toISOString().split("T")[0]
    const { data: ex } = await supabase.from("metricas").select("*").eq("fecha", hoy).single()
    if (ex) {
      await supabase.from("metricas").update({ ventas_total: parseFloat(ex.ventas_total) + monto, ganancia_total: parseFloat(ex.ganancia_total) + ganancia, updated_at: new Date().toISOString() }).eq("fecha", hoy)
    } else {
      await supabase.from("metricas").insert({ fecha: hoy, ventas_total: monto, ganancia_total: ganancia, pc_armadas: 0 })
    }
    await cargarMetricas()
  }

  const guardarPcArmada = async () => {
    const hoy = new Date().toISOString().split("T")[0]
    const { data: ex } = await supabase.from("metricas").select("*").eq("fecha", hoy).single()
    if (ex) {
      await supabase.from("metricas").update({ pc_armadas: ex.pc_armadas + 1 }).eq("fecha", hoy)
    } else {
      await supabase.from("metricas").insert({ fecha: hoy, ventas_total: 0, ganancia_total: 0, pc_armadas: 1 })
    }
    await cargarMetricas()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const stockBajo = stock.filter(s => s.qty <= s.min).length
  const invertidoStock = stock.reduce((a, s) => a + s.precio * s.qty, 0)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <DecorativeBackground />
      <div className="relative z-10">
        <div className="border-b bg-gradient-to-r from-card/90 via-card/80 to-secondary/30 backdrop-blur-sm">
          <div className="mx-auto max-w-[1400px] px-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-orange-400 text-white shadow-lg font-bold text-sm ring-2 ring-blue-500/20">JA</div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Jer Abyte</h1>
                  <p className="text-xs text-muted-foreground">La PC que cumple con tus exigencias diarias</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 border border-emerald-200">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-700">Sistema activo</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Salir</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-5">
          <div className="flex gap-4">

            <div className="hidden xl:flex flex-col w-64 flex-shrink-0">
              <div className="sticky top-5 bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4 h-[calc(100vh-120px)] overflow-hidden">
                <ChecklistSidebar checklist={checklist} setChecklist={setChecklist} initialChecklist={initialChecklist} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-5 w-full justify-start overflow-x-auto bg-card/70 backdrop-blur-sm border border-blue-100/50 shadow-sm">
                  <TabsTrigger value="resumen" className="gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Monitor className="h-3.5 w-3.5" />Resumen
                  </TabsTrigger>
                  <TabsTrigger value="armado" className="gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Cpu className="h-3.5 w-3.5" />Armado de PC
                  </TabsTrigger>
                  <TabsTrigger value="calculadora" className="gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Calculator className="h-3.5 w-3.5" />Calculadora
                  </TabsTrigger>
                  <TabsTrigger value="inventario" className="gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Package className="h-3.5 w-3.5" />Inventario
                  </TabsTrigger>
                  <TabsTrigger value="graficos" className="gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-400 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <BarChart3 className="h-3.5 w-3.5" />Graficos
                  </TabsTrigger>
                  <TabsTrigger value="checklist" className="gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <CheckSquare className="h-3.5 w-3.5" />Checklist
                  </TabsTrigger>
                  <TabsTrigger value="catalogo" className="gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Store className="h-3.5 w-3.5" />Catálogo
                  </TabsTrigger>
                  <TabsTrigger value="pagos" className="gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Wallet className="h-3.5 w-3.5" />Pagos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="resumen">
                  <ResumenTab ventas={ventas} gananciaTotal={gananciaTotal} pcArmadas={pcArmadas} stockBajo={stockBajo} setVentas={setVentas} setGananciaTotal={setGananciaTotal} setTotalVendido={setTotalVendido} setTotalCosto={setTotalCosto} totalVendido={totalVendido} totalCosto={totalCosto} onNavigate={setActiveTab} onGuardarVenta={guardarVenta} />
                </TabsContent>
                <TabsContent value="armado">
                  <ArmadoTab stock={stock} setStock={setStock} armado={armado} setArmado={setArmado} margenGlobal={margenGlobal} setMargenGlobal={setMargenGlobal} setPcArmadas={setPcArmadas} onPcArmada={guardarPcArmada} />
                </TabsContent>
                <TabsContent value="calculadora"><CalculadoraTab /></TabsContent>
                <TabsContent value="inventario">
                  <InventarioTab stock={stock} setStock={setStock} loading={loadingStock} />
                </TabsContent>
                <TabsContent value="graficos">
                  <GraficosTab stock={stock} totalVendido={totalVendido} totalCosto={totalCosto} gananciaTotal={gananciaTotal} invertidoStock={invertidoStock} />
                </TabsContent>
                <TabsContent value="checklist">
                  <ChecklistTab checklist={checklist} setChecklist={setChecklist} initialChecklist={initialChecklist} />
                </TabsContent>
                <TabsContent value="catalogo">
                  <CatalogoTab stock={stock} setStock={setStock} />
                </TabsContent>
                <TabsContent value="pagos">
                  <PagosTab />
                </TabsContent>
              </Tabs>
            </div>

            <div className="hidden xl:flex flex-col w-72 flex-shrink-0">
              <div className="sticky top-5 bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4 h-[calc(100vh-120px)] overflow-hidden">
                <AgendaSidebar />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
