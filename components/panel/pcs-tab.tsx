"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle, Cpu, Trash2, ChevronDown, ChevronUp, Download } from "lucide-react"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

const MARCA = "Jer Abyte"
const LEMA = "La PC que cumple con tus exigencias diarias, vas a tener nuestra confianza y lealtad ante cualquier dificultad."
const GARANTIA = 6

interface Componente {
  nombre: string
  cat: string
  pcosto: number
  pventa: number
  qty: number
}

interface PcArmada {
  id: string
  nombre: string
  cliente: string
  componentes: Componente[]
  costo_total: number
  precio_venta: number
  margen: number
  estado: string
  created_at: string
}

interface PcsTabProps {
  onVentaRegistrada?: (monto: number, costo: number) => Promise<void>
}

export function PcsTab({ onVentaRegistrada }: PcsTabProps) {
  const supabase = createClient()
  const [pcs, setPcs] = useState<PcArmada[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<"Todas" | "En stock" | "Vendida">("Todas")
  const [editando, setEditando] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState("")
  const [editCliente, setEditCliente] = useState("")
  const [editPrecio, setEditPrecio] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [preguntarStock, setPreguntarStock] = useState<string | null>(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from("pcs_armadas").select("*").order("created_at", { ascending: false })
    if (data) setPcs(data.map((p: any) => ({ ...p, componentes: p.componentes || [] })))
    setLoading(false)
  }

  const marcarVendida = async (pc: PcArmada) => {
    await supabase.from("pcs_armadas").update({ estado: "Vendida", updated_at: new Date().toISOString() }).eq("id", pc.id)
    if (onVentaRegistrada) await onVentaRegistrada(pc.precio_venta, pc.costo_total)
    await cargar()
  }

  const guardarEdicion = async (id: string) => {
    const precio = parseFloat(editPrecio) || 0
    const pc = pcs.find(p => p.id === id)
    const margen = pc && pc.costo_total > 0 ? Math.round(((precio - pc.costo_total) / pc.costo_total) * 100) : 0
    await supabase.from("pcs_armadas").update({
      nombre: editNombre, cliente: editCliente, precio_venta: precio, margen, updated_at: new Date().toISOString()
    }).eq("id", id)
    setEditando(null)
    await cargar()
  }

  const eliminar = async (id: string, devolverStock: boolean) => {
    if (devolverStock) {
      const pc = pcs.find(p => p.id === id)
      if (pc && pc.componentes.length > 0) {
        const { data: stockActual } = await supabase.from("stock").select("*")
        if (stockActual) {
          for (const comp of pc.componentes) {
            if (comp.sidx !== undefined && comp.sidx !== null) {
              const item = stockActual[comp.sidx]
              if (item) {
                await supabase.from("stock").update({ cantidad: item.cantidad + comp.qty, updated_at: new Date().toISOString() }).eq("id", item.id)
              }
            }
          }
        }
      }
    }
    await supabase.from("pcs_armadas").delete().eq("id", id)
    setPreguntarStock(null)
    setConfirmDelete(null)
    await cargar()
  }

  const iniciarEliminar = (id: string) => {
    setPreguntarStock(id)
  }

  const genPDFCliente = async (pc: PcArmada) => {
    const jspdfModule = await import('jspdf')
    const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210, mg = 18, cw = W - mg * 2
    const nom = pc.nombre || 'PC sin nombre'
    const cli = pc.cliente || '—'
    const fecha = new Date(pc.created_at).toLocaleDateString('es-AR')

    doc.setFillColor(15, 40, 80); doc.rect(0, 0, W, 38, 'F')
    doc.setFillColor(24, 95, 165); doc.circle(mg + 8, 19, 8, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('JA', mg + 8, 21, { align: 'center' })
    doc.setFontSize(20); doc.text(MARCA, mg + 20, 16)
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(180, 210, 255)
    doc.text('La PC que cumple con tus exigencias diarias', mg + 20, 23)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 220, 255)
    doc.text('Fecha: ' + fecha, W - mg, 14, { align: 'right' })
    doc.setFillColor(24, 95, 165); doc.rect(0, 38, W, 12, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text('FICHA TÉCNICA DEL EQUIPO', W / 2, 46, { align: 'center' })

    let y = 60
    const info = [['Equipo', nom], ['Cliente', cli], ['Fecha de armado', fecha]]
    info.forEach(([l, v], i) => {
      if (i % 2 === 0) { doc.setFillColor(235, 241, 251); doc.rect(mg, y - 3.5, cw, 8, 'F') }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 40, 80); doc.setFontSize(9)
      doc.text(l + ':', mg + 2, y + 1)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20)
      doc.text(String(v), mg + 40, y + 1); y += 8
    }); y += 6

    doc.setFillColor(15, 40, 80); doc.rect(mg, y, cw, 7, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold')
    doc.text('Componente', mg + 2, y + 4.8)
    doc.text('Categoría', mg + 110, y + 4.8)
    doc.text('Cant.', mg + 150, y + 4.8)
    doc.text('Precio', W - mg - 2, y + 4.8, { align: 'right' }); y += 9

    let total = 0
    doc.setFont('helvetica', 'normal')
    pc.componentes.forEach((a, i) => {
      const sub = a.pventa * a.qty; total += sub
      if (i % 2 === 0) { doc.setFillColor(248, 249, 252); doc.rect(mg, y - 3.5, cw, 8, 'F') }
      doc.setTextColor(20, 20, 20); doc.setFontSize(8.5)
      doc.text(a.nombre.length > 55 ? a.nombre.slice(0, 53) + '...' : a.nombre, mg + 2, y + 1)
      doc.setTextColor(100, 100, 100); doc.setFontSize(8); doc.text(a.cat, mg + 110, y + 1)
      doc.setTextColor(20, 20, 20); doc.setFontSize(8.5); doc.text(String(a.qty), mg + 152, y + 1)
      doc.setFont('helvetica', 'bold'); doc.text(fmt(sub), W - mg - 2, y + 1, { align: 'right' })
      doc.setFont('helvetica', 'normal'); y += 8
      if (y > 255) { doc.addPage(); y = 20 }
    }); y += 2

    doc.setFillColor(15, 40, 80); doc.rect(mg, y, cw, 9, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('Total', mg + 3, y + 6); doc.text(fmt(pc.precio_venta || total), W - mg - 2, y + 6, { align: 'right' }); y += 14

    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFillColor(234, 243, 222); doc.rect(mg, y, cw, 32, 'F')
    doc.setDrawColor(59, 109, 17); doc.setLineWidth(0.4); doc.rect(mg, y, cw, 32)
    doc.setTextColor(39, 80, 10); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('Garantía de mano de obra — ' + GARANTIA + ' meses', mg + 4, y + 7)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    const gt = `${MARCA} garantiza la mano de obra de este equipo por ${GARANTIA} meses desde la fecha de entrega. La garantía cubre únicamente defectos derivados del proceso de armado. Queda excluida ante manipulación por terceros, daños físicos, líquidos, caídas, modificaciones no autorizadas o mal uso del equipo.`
    let gy = y + 14
    doc.splitTextToSize(gt, cw - 8).forEach((l: string) => { doc.text(l, mg + 4, gy); gy += 5 }); y = gy + 8

    if (y > 258) { doc.addPage(); y = 20 }
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
    doc.text('Firma del cliente: ___________________________', mg, y + 6)
    doc.text('Firma ' + MARCA + ': ___________________________', W - mg, y + 6, { align: 'right' })

    const np = doc.internal.getNumberOfPages()
    for (let p = 1; p <= np; p++) {
      doc.setPage(p)
      doc.setFillColor(15, 40, 80); doc.rect(0, 285, W, 12, 'F')
      doc.setTextColor(180, 210, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'italic')
      doc.text(LEMA, W / 2, 292, { align: 'center' })
      doc.setFont('helvetica', 'normal'); doc.text('Pág ' + p + ' de ' + np, W - mg, 292, { align: 'right' })
    }
    doc.save(`JerAbyte_Cliente_${nom.replace(/[^a-z0-9]/gi, '_')}_${cli.replace(/[^a-z0-9]/gi, '_')}.pdf`)
  }

  const genPDFInterno = async (pc: PcArmada) => {
    const jspdfModule = await import('jspdf')
    const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210, mg = 18, cw = W - mg * 2
    const nom = pc.nombre || 'PC sin nombre'
    const cli = pc.cliente || '—'
    const fecha = new Date(pc.created_at).toLocaleDateString('es-AR')

    doc.setFillColor(80, 20, 20); doc.rect(0, 0, W, 38, 'F')
    doc.setFillColor(160, 50, 50); doc.circle(mg + 8, 19, 8, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('JA', mg + 8, 21, { align: 'center' })
    doc.setFontSize(17); doc.text(MARCA + ' — USO INTERNO', mg + 20, 16)
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(255, 180, 180)
    doc.text('DOCUMENTO PRIVADO — No compartir con el cliente', mg + 20, 24)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 200, 200)
    doc.text('Fecha: ' + fecha, W - mg, 14, { align: 'right' })
    doc.setFillColor(160, 50, 50); doc.rect(0, 38, W, 12, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text('FICHA INTERNA — DOBLE PRECIO', W / 2, 46, { align: 'center' })

    let y = 60
    const info = [['Equipo', nom], ['Cliente', cli], ['Fecha', fecha], ['Estado', pc.estado]]
    info.forEach(([l, v], i) => {
      if (i % 2 === 0) { doc.setFillColor(255, 245, 245); doc.rect(mg, y - 3.5, cw, 8, 'F') }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 30, 30); doc.setFontSize(9)
      doc.text(l + ':', mg + 2, y + 1)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20)
      doc.text(String(v), mg + 40, y + 1); y += 8
    }); y += 6

    doc.setFillColor(80, 20, 20); doc.rect(mg, y, cw, 7, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.text('Componente', mg + 2, y + 4.8)
    doc.text('Cat.', mg + 78, y + 4.8)
    doc.text('Cant.', mg + 100, y + 4.8)
    doc.text('Costo', mg + 118, y + 4.8)
    doc.text('P.Cliente', mg + 143, y + 4.8)
    doc.text('Ganancia', W - mg - 2, y + 4.8, { align: 'right' }); y += 9

    let tc = 0, tv = 0
    doc.setFont('helvetica', 'normal')
    pc.componentes.forEach((a, i) => {
      const sc = a.pcosto * a.qty, sv = a.pventa * a.qty, gan = sv - sc; tc += sc; tv += sv
      if (i % 2 === 0) { doc.setFillColor(255, 248, 248); doc.rect(mg, y - 3.5, cw, 8, 'F') }
      doc.setTextColor(20, 20, 20); doc.setFontSize(7.5)
      doc.text(a.nombre.length > 35 ? a.nombre.slice(0, 33) + '...' : a.nombre, mg + 2, y + 1)
      doc.setTextColor(100, 100, 100); doc.text(a.cat, mg + 78, y + 1)
      doc.setTextColor(20, 20, 20); doc.text(String(a.qty), mg + 102, y + 1)
      doc.setTextColor(160, 50, 50); doc.setFont('helvetica', 'bold')
      doc.text(fmt(a.pcosto), mg + 138, y + 1, { align: 'right' })
      doc.setTextColor(39, 80, 10)
      doc.text(fmt(a.pventa), mg + 163, y + 1, { align: 'right' })
      doc.setTextColor(24, 95, 165)
      doc.text(fmt(gan), W - mg - 2, y + 1, { align: 'right' })
      doc.setFont('helvetica', 'normal'); y += 8
      if (y > 255) { doc.addPage(); y = 20 }
    }); y += 3

    const tvFinal = pc.precio_venta || tv
    const gananciaFinal = tvFinal - tc
    const margenReal = tc > 0 ? Math.round((gananciaFinal / tc) * 100) : 0

    doc.setFillColor(80, 20, 20); doc.rect(mg, y, cw, 14, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('Totales', mg + 3, y + 5)
    doc.setTextColor(255, 180, 180); doc.text('Costo: ' + fmt(tc), mg + 35, y + 5)
    doc.setTextColor(180, 255, 180); doc.text('Venta: ' + fmt(tvFinal), mg + 90, y + 5)
    doc.setTextColor(180, 210, 255); doc.text('Ganancia: ' + fmt(gananciaFinal), mg + 145, y + 5)
    doc.setTextColor(255, 255, 180); doc.setFontSize(8)
    doc.text('Margen real: ' + margenReal + '%', W - mg - 2, y + 11, { align: 'right' })

    const np = doc.internal.getNumberOfPages()
    for (let p = 1; p <= np; p++) {
      doc.setPage(p)
      doc.setFillColor(80, 20, 20); doc.rect(0, 285, W, 12, 'F')
      doc.setTextColor(255, 180, 180); doc.setFontSize(7.5); doc.setFont('helvetica', 'italic')
      doc.text('DOCUMENTO INTERNO JER ABYTE — CONFIDENCIAL', W / 2, 292, { align: 'center' })
      doc.setFont('helvetica', 'normal'); doc.text('Pág ' + p + ' de ' + np, W - mg, 292, { align: 'right' })
    }
    doc.save(`JerAbyte_INTERNO_${nom.replace(/[^a-z0-9]/gi, '_')}_${cli.replace(/[^a-z0-9]/gi, '_')}.pdf`)
  }

  const filtradas = pcs.filter(p => filtro === "Todas" || p.estado === filtro)
  const enStock = pcs.filter(p => p.estado === "En stock").length
  const vendidas = pcs.filter(p => p.estado === "Vendida").length

  return (
    <div className="space-y-5">
      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/80 border border-border rounded-xl p-3">
          <div className="text-[10px] text-muted-foreground mb-1">En stock</div>
          <div className="text-lg font-semibold text-blue-600">{enStock}</div>
        </div>
        <div className="bg-card/80 border border-border rounded-xl p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Vendidas</div>
          <div className="text-lg font-semibold text-emerald-600">{vendidas}</div>
        </div>
        <div className="bg-card/80 border border-border rounded-xl p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Total armadas</div>
          <div className="text-lg font-semibold text-foreground">{pcs.length}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1">
        {(["Todas", "En stock", "Vendida"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${filtro === f ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-muted-foreground hover:border-blue-400'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">Cargando...</div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-10 text-xs text-muted-foreground">
          {pcs.length === 0 ? "No hay PCs armadas todavía. Armá una desde la pestaña 'Armado de PC' y confirmá el stock." : "Sin PCs en este estado."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(pc => {
            const abierto = expandido === pc.id
            const ganancia = pc.precio_venta - pc.costo_total
            return (
              <Card key={pc.id} className={`border-0 overflow-hidden ${pc.estado === 'Vendida' ? 'bg-emerald-50/50' : 'bg-card/80'}`}>
                <CardContent className="p-0">
                  {/* Cabecera */}
                  <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => setExpandido(abierto ? null : pc.id)}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${pc.estado === 'Vendida' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                      {pc.estado === 'Vendida' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Cpu className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-medium truncate">{pc.nombre}</span>
                        <Badge className={`text-[9px] px-1.5 border-0 ${pc.estado === 'Vendida' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {pc.estado}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {pc.cliente || "Sin cliente"} · {new Date(pc.created_at).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-emerald-600">{fmt(pc.precio_venta)}</div>
                      <div className="text-[10px] text-muted-foreground">Costo {fmt(pc.costo_total)}</div>
                      <div className="text-[10px] text-blue-600">+{fmt(ganancia)} ({pc.margen}%)</div>
                    </div>
                    {abierto ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  </div>

                  {/* Detalle */}
                  {abierto && (
                    <div className="border-t border-border px-4 py-3 space-y-3">

                      {/* Editar */}
                      {editando === pc.id ? (
                        <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase">Editar PC</p>
                          <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre de la PC" className="h-7 text-xs" />
                          <Input value={editCliente} onChange={e => setEditCliente(e.target.value)} placeholder="Cliente" className="h-7 text-xs" />
                          <Input type="number" value={editPrecio} onChange={e => setEditPrecio(e.target.value)} placeholder="Precio de venta ($)" className="h-7 text-xs" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => guardarEdicion(pc.id)} className="h-7 text-xs">Guardar</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditando(null)} className="h-7 text-xs">Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setEditando(pc.id); setEditNombre(pc.nombre); setEditCliente(pc.cliente); setEditPrecio(String(pc.precio_venta)) }}
                          className="text-[10px] text-blue-500 hover:text-blue-700">✏️ Editar datos</button>
                      )}

                      {/* Componentes */}
                      {pc.componentes.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Componentes</p>
                          <div className="space-y-1">
                            {pc.componentes.map((comp, i) => (
                              <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-1.5">
                                <div>
                                  <span className="text-[11px] font-medium">{comp.nombre}</span>
                                  <span className="text-[10px] text-muted-foreground ml-2">{comp.cat} × {comp.qty}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] text-red-500">Costo: {fmt(comp.pcosto)}</div>
                                  <div className="text-[10px] text-emerald-600">Cliente: {fmt(comp.pventa)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PDFs */}
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => genPDFCliente(pc)} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                          <Download className="h-3 w-3 mr-1" />PDF Cliente
                        </Button>
                        <Button size="sm" onClick={() => genPDFInterno(pc)} className="h-7 text-xs">
                          <Download className="h-3 w-3 mr-1" />PDF Interno
                        </Button>
                        {pc.estado !== "Vendida" && (
                          <Button size="sm" onClick={() => marcarVendida(pc)} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                            <CheckCircle className="h-3 w-3 mr-1" />Marcar vendida
                          </Button>
                        )}
                      </div>

                      {/* Eliminar con pregunta de stock */}
                      {preguntarStock === pc.id ? (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl p-3 space-y-2">
                          <p className="text-xs font-medium text-red-700">¿Devolver componentes al inventario?</p>
                          <p className="text-[10px] text-red-500">Si los componentes fueron usados en esta PC y querés volver a tenerlos en stock, seleccioná "Sí".</p>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => eliminar(pc.id, true)} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                              Sí, devolver stock
                            </Button>
                            <Button size="sm" onClick={() => eliminar(pc.id, false)} variant="outline" className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50">
                              No, solo eliminar
                            </Button>
                            <Button size="sm" onClick={() => setPreguntarStock(null)} variant="ghost" className="h-7 text-xs">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => iniciarEliminar(pc.id)}
                          className="text-[10px] text-red-400 hover:text-red-600 transition-colors">
                          Eliminar esta PC
                        </button>
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
