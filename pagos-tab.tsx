"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, CheckCircle, Clock, Trash2, ChevronDown, ChevronUp, FileText } from "lucide-react"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

interface Pago {
  id: string
  monto: number
  fecha: string
  nota: string
  nro: number
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
  cuotas: number
}

export function PagosTab() {
  const supabase = createClient()
  const [registros, setRegistros] = useState<PagoParcial[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState<"Todos" | "Pendiente" | "Saldado">("Todos")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [cliente, setCliente] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [total, setTotal] = useState("")
  const [cantCuotas, setCantCuotas] = useState("1")
  const [primerPago, setPrimerPago] = useState("")
  const [primerNota, setPrimerNota] = useState("")
  const [nuevoPago, setNuevoPago] = useState<Record<string, string>>({})
  const [nuevaNota, setNuevaNota] = useState<Record<string, string>>({})
  const [editando, setEditando] = useState<string | null>(null)
  const [editCliente, setEditCliente] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editTotal, setEditTotal] = useState("")

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from("pagos_parciales").select("*").order("created_at", { ascending: false })
    if (data) setRegistros(data.map((r: any) => ({ ...r, pagos: r.pagos || [], cuotas: r.cuotas || 1 })))
    setLoading(false)
  }

  const crearVenta = async () => {
    if (!cliente.trim() || !total) return
    setGuardando(true)
    const t = parseFloat(total) || 0
    const p = parseFloat(primerPago) || 0
    const cuotas = parseInt(cantCuotas) || 1
    const pagosInit: Pago[] = p > 0 ? [{ id: Date.now().toString(), monto: p, fecha: new Date().toLocaleDateString('es-AR'), nota: primerNota || (cuotas > 1 ? `Cuota 1 de ${cuotas}` : "Seña inicial"), nro: 1 }] : []
    const estado = p >= t ? "Saldado" : "Pendiente"
    await supabase.from("pagos_parciales").insert({ cliente: cliente.trim(), descripcion: descripcion.trim(), total: t, pagado: p, pagos: pagosInit, estado, cuotas })
    setCliente(""); setDescripcion(""); setTotal(""); setPrimerPago(""); setPrimerNota(""); setCantCuotas("1")
    setMostrarForm(false)
    await cargar()
    setGuardando(false)
  }

  const agregarPago = async (registro: PagoParcial) => {
    const monto = parseFloat(nuevoPago[registro.id] || "0") || 0
    if (!monto) return
    const nota = nuevaNota[registro.id] || `Cuota ${registro.pagos.length + 1}`
    const nuevosPagos = [...registro.pagos, { id: Date.now().toString(), monto, fecha: new Date().toLocaleDateString('es-AR'), nota, nro: registro.pagos.length + 1 }]
    const nuevoPagado = registro.pagado + monto
    const estado = nuevoPagado >= registro.total ? "Saldado" : "Pendiente"
    await supabase.from("pagos_parciales").update({ pagos: nuevosPagos, pagado: nuevoPagado, estado, updated_at: new Date().toISOString() }).eq("id", registro.id)

    // Actualizar el registro vinculado en ventas sumando este pago
    const { data: ventaVinculada } = await supabase.from("ventas").select("*").eq("pagos_parciales_id", registro.id).single()
    if (ventaVinculada) {
      const nuevoMonto = parseFloat(ventaVinculada.monto) + monto
      const nuevaGanancia = nuevoMonto - parseFloat(ventaVinculada.costo)
      await supabase.from("ventas").update({
        monto: nuevoMonto,
        ganancia: nuevaGanancia,
        updated_at: new Date().toISOString()
      }).eq("id", ventaVinculada.id)
    }

    setNuevoPago(prev => ({ ...prev, [registro.id]: "" }))
    setNuevaNota(prev => ({ ...prev, [registro.id]: "" }))
    await cargar()
  }

  const eliminarPago = async (registro: PagoParcial, pagoId: string) => {
    const pagosAct = registro.pagos.filter(p => p.id !== pagoId)
    const nuevoPagado = pagosAct.reduce((s, p) => s + p.monto, 0)
    const estado = nuevoPagado >= registro.total ? "Saldado" : "Pendiente"
    await supabase.from("pagos_parciales").update({ pagos: pagosAct, pagado: nuevoPagado, estado, updated_at: new Date().toISOString() }).eq("id", registro.id)
    await cargar()
  }

  const eliminarRegistro = async (id: string) => {
    if (confirmDelete === id) {
      await supabase.from("pagos_parciales").delete().eq("id", id)
      setConfirmDelete(null)
      await cargar()
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(c => c === id ? null : c), 3000)
    }
  }

  const guardarEdicion = async (id: string) => {
    await supabase.from("pagos_parciales").update({ cliente: editCliente, descripcion: editDesc, total: parseFloat(editTotal) || 0, updated_at: new Date().toISOString() }).eq("id", id)
    setEditando(null)
    await cargar()
  }

  const marcarSaldado = async (registro: PagoParcial) => {
    const faltante = registro.total - registro.pagado
    if (faltante <= 0) return
    const nuevosPagos = [...registro.pagos, { id: Date.now().toString(), monto: faltante, fecha: new Date().toLocaleDateString('es-AR'), nota: "Pago final — saldado", nro: registro.pagos.length + 1 }]
    await supabase.from("pagos_parciales").update({ pagos: nuevosPagos, pagado: registro.total, estado: "Saldado", updated_at: new Date().toISOString() }).eq("id", registro.id)
    await cargar()
  }

  const generarComprobante = async (registro: PagoParcial, pago: Pago) => {
    const jspdfModule = await import('jspdf')
    const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210, mg = 20, cw = W - mg * 2

    doc.setFillColor(15, 40, 80); doc.rect(0, 0, W, 40, 'F')
    doc.setFillColor(24, 95, 165); doc.circle(mg + 8, 20, 9, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('JA', mg + 8, 22, { align: 'center' })
    doc.setFontSize(20); doc.text('Jer Abyte', mg + 22, 17)
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(180, 210, 255)
    doc.text('La PC que cumple con tus exigencias diarias', mg + 22, 25)
    doc.setFillColor(24, 95, 165); doc.rect(0, 40, W, 14, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text('COMPROBANTE DE PAGO', W / 2, 50, { align: 'center' })

    let y = 65
    doc.setFillColor(240, 245, 255); doc.rect(mg, y, cw, 10, 'F')
    doc.setTextColor(15, 40, 80); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text(`N° Comprobante: ${registro.id.slice(0, 8).toUpperCase()}-${pago.nro || registro.pagos.indexOf(pago) + 1}`, mg + 3, y + 7)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
    doc.text(`Fecha: ${pago.fecha}`, W - mg - 3, y + 7, { align: 'right' })
    y += 16

    const datos = [['Cliente', registro.cliente], ['Equipo / Descripcion', registro.descripcion || '—'], ['Concepto', pago.nota]]
    datos.forEach(([l, v], i) => {
      if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mg, y - 3.5, cw, 9, 'F') }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80); doc.setFontSize(9)
      doc.text(l + ':', mg + 3, y + 2)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20)
      doc.text(String(v), mg + 60, y + 2); y += 9
    }); y += 8

    doc.setFillColor(15, 40, 80); doc.rect(mg, y, cw, 20, 'F')
    doc.setTextColor(180, 210, 255); doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Monto abonado', mg + 5, y + 8)
    doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
    doc.text(fmt(pago.monto), W - mg - 5, y + 14, { align: 'right' }); y += 26

    doc.setFillColor(235, 241, 251); doc.rect(mg, y, cw, 8, 'F')
    doc.setTextColor(15, 40, 80); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('Resumen de cuenta', mg + 3, y + 5.5); y += 12

    const totalPagado = registro.pagos.reduce((s, p) => s + p.monto, 0)
    const saldo = registro.total - totalPagado
    const resumen: [string, string][] = [['Total del equipo', fmt(registro.total)], ['Total abonado hasta la fecha', fmt(totalPagado)], ['Saldo pendiente', fmt(Math.max(0, saldo))]]
    resumen.forEach(([l, v], i) => {
      if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mg, y - 3.5, cw, 9, 'F') }
      doc.setFont('helvetica', i === 2 ? 'bold' : 'normal')
      doc.setTextColor(i === 2 && saldo > 0 ? 180 : 20, i === 2 && saldo > 0 ? 80 : 20, 20)
      doc.setFontSize(9); doc.text(l, mg + 3, y + 2); doc.text(String(v), W - mg - 3, y + 2, { align: 'right' }); y += 9
    })

    if (saldo <= 0) {
      y += 5
      doc.setFillColor(234, 243, 222); doc.rect(mg, y, cw, 12, 'F')
      doc.setDrawColor(59, 109, 17); doc.setLineWidth(0.4); doc.rect(mg, y, cw, 12)
      doc.setTextColor(39, 80, 10); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
      doc.text('CUENTA SALDADA — Gracias por su confianza', W / 2, y + 8, { align: 'center' }); y += 18
    }

    y += 10
    doc.setFillColor(235, 241, 251); doc.rect(mg, y, cw, 8, 'F')
    doc.setTextColor(15, 40, 80); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('Historial de pagos', mg + 3, y + 5.5); y += 12

    registro.pagos.forEach((p, i) => {
      if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mg, y - 3.5, cw, 9, 'F') }
      const esEste = p.id === pago.id
      doc.setFont('helvetica', esEste ? 'bold' : 'normal')
      doc.setTextColor(esEste ? 24 : 80, esEste ? 95 : 80, esEste ? 165 : 80)
      doc.setFontSize(8.5)
      doc.text(`${i + 1}. ${p.nota}`, mg + 3, y + 2); doc.text(p.fecha, mg + 100, y + 2); doc.text(fmt(p.monto), W - mg - 3, y + 2, { align: 'right' }); y += 9
      if (y > 255) { doc.addPage(); y = 20 }
    })

    y += 10
    if (y > 255) { doc.addPage(); y = 20 }
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
    doc.text('Firma del cliente: ___________________________', mg, y + 6)
    doc.text('Firma Jer Abyte: ___________________________', W - mg, y + 6, { align: 'right' })

    doc.setFillColor(15, 40, 80); doc.rect(0, 285, W, 12, 'F')
    doc.setTextColor(180, 210, 255); doc.setFontSize(7.5); doc.setFont('helvetica', 'italic')
    doc.text('Jer Abyte — La PC que cumple con tus exigencias diarias', W / 2, 292, { align: 'center' })

    doc.save(`Comprobante_${registro.cliente.replace(/[^a-z0-9]/gi, '_')}_pago${pago.nro || registro.pagos.indexOf(pago) + 1}.pdf`)
  }

  const filtrados = registros.filter(r => filtro === "Todos" || r.estado === filtro)
  const totalPendiente = registros.filter(r => r.estado === "Pendiente").reduce((s, r) => s + (r.total - r.pagado), 0)
  const totalCobrado = registros.reduce((s, r) => s + r.pagado, 0)
  const montoCuotaCalc = (t: string, c: string) => { const tv = parseFloat(t) || 0; const cv = parseInt(c) || 1; return tv > 0 ? fmt(Math.round(tv / cv)) : '$0' }

  return (
    <div className="space-y-5">
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

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {(["Todos", "Pendiente", "Saldado"] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${filtro === f ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-muted-foreground hover:border-blue-400'}`}>
              {f}
            </button>
          ))}
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setMostrarForm(!mostrarForm)}>
          <Plus className="h-3 w-3" />Nueva venta
        </Button>
      </div>

      {mostrarForm && (
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium">Registrar venta con pagos</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nombre del cliente *</label>
                <Input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="ej: Juan Pérez" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Precio total ($) *</label>
                <Input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="ej: 950000" className="h-8 text-sm" />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-muted-foreground">Descripción</label>
                <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="ej: PC Gaming Ryzen 5" className="h-8 text-sm" />
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-2">Cantidad de cuotas</p>
              <div className="flex items-center gap-2 flex-wrap">
                {["1","2","3","4","6","12"].map(n => (
                  <button key={n} onClick={() => setCantCuotas(n)}
                    className={`w-9 h-8 rounded-lg text-sm font-medium border transition-colors ${cantCuotas === n ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-muted-foreground hover:border-blue-400'}`}>
                    {n}
                  </button>
                ))}
                <Input type="number" value={cantCuotas} onChange={e => setCantCuotas(e.target.value)} className="h-8 w-16 text-sm" placeholder="Otra" />
                {total && parseInt(cantCuotas) > 1 && (
                  <span className="text-xs text-blue-600 font-medium">{cantCuotas} cuotas de {montoCuotaCalc(total, cantCuotas)}</span>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-2">{parseInt(cantCuotas) > 1 ? "Primera cuota (opcional)" : "Seña inicial (opcional)"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Monto ($)</label>
                  <Input type="number" value={primerPago} onChange={e => setPrimerPago(e.target.value)} placeholder={parseInt(cantCuotas) > 1 ? montoCuotaCalc(total, cantCuotas) : "ej: 300000"} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Nota</label>
                  <Input value={primerNota} onChange={e => setPrimerNota(e.target.value)} placeholder={parseInt(cantCuotas) > 1 ? `Cuota 1 de ${cantCuotas}` : "ej: Seña para armar"} className="h-8 text-sm" />
                </div>
              </div>
            </div>

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

      {loading ? (
        <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-10 text-xs text-muted-foreground">{registros.length === 0 ? "Sin ventas registradas." : "Sin ventas en este estado."}</div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(r => {
            const faltante = r.total - r.pagado
            const pct = Math.min(100, Math.round((r.pagado / r.total) * 100))
            const abierto = expandido === r.id
            const montoCuotaR = r.cuotas > 1 ? Math.round(r.total / r.cuotas) : 0
            return (
              <Card key={r.id} className="border-0 bg-card/80 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setExpandido(abierto ? null : r.id)}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${r.estado === 'Saldado' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                      {r.estado === 'Saldado' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-orange-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-medium truncate">{r.cliente}</span>
                        <Badge className={`text-[9px] px-1.5 border-0 ${r.estado === 'Saldado' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{r.estado}</Badge>
                        {r.cuotas > 1 && <Badge className="text-[9px] px-1.5 border-0 bg-blue-100 text-blue-700">{r.cuotas} cuotas · {fmt(montoCuotaR)} c/u</Badge>}
                      </div>
                      {r.descripcion && <div className="text-[11px] text-muted-foreground truncate">{r.descripcion}</div>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${r.estado === 'Saldado' ? 'bg-emerald-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
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

                  {abierto && (
                    <div className="border-t border-border px-4 py-3 space-y-3">
                      {editando === r.id ? (
                        <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase">Editar venta</p>
                          <Input value={editCliente} onChange={e => setEditCliente(e.target.value)} placeholder="Cliente" className="h-7 text-xs" />
                          <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Descripción" className="h-7 text-xs" />
                          <Input type="number" value={editTotal} onChange={e => setEditTotal(e.target.value)} placeholder="Total ($)" className="h-7 text-xs" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => guardarEdicion(r.id!)} className="h-7 text-xs">Guardar</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditando(null)} className="h-7 text-xs">Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setEditando(r.id!); setEditCliente(r.cliente); setEditDesc(r.descripcion); setEditTotal(String(r.total)) }}
                          className="text-[10px] text-blue-500 hover:text-blue-700">✏️ Editar datos de la venta</button>
                      )}

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Historial de pagos</p>
                        {r.pagos.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground italic">Sin pagos</div>
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
                                <button onClick={() => generarComprobante(r, pago)} className="text-blue-400 hover:text-blue-600 transition-colors" title="Generar comprobante PDF">
                                  <FileText className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => eliminarPago(r, pago.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Agregar pago — siempre visible */}
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                            {r.cuotas > 1 ? `Cuota ${r.pagos.length + 1} de ${r.cuotas}` : 'Registrar pago'}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Input type="number"
                              placeholder={r.cuotas > 1 ? fmt(Math.round(r.total / r.cuotas)) : `Monto (falta ${fmt(faltante)})`}
                              value={nuevoPago[r.id] || ""} onChange={e => setNuevoPago(prev => ({ ...prev, [r.id]: e.target.value }))}
                              className="h-8 text-xs flex-1 min-w-[120px]" />
                            <Input placeholder={r.cuotas > 1 ? `Cuota ${r.pagos.length + 1} de ${r.cuotas}` : "Nota (opcional)"}
                              value={nuevaNota[r.id] || ""} onChange={e => setNuevaNota(prev => ({ ...prev, [r.id]: e.target.value }))}
                              className="h-8 text-xs flex-1 min-w-[120px]" />
                            <Button size="sm" onClick={() => agregarPago(r)} className="h-8 text-xs">
                              <Plus className="h-3 w-3 mr-1" />Agregar
                            </Button>
                          </div>
                          {r.estado !== "Saldado" && (
                            <Button size="sm" variant="outline" onClick={() => marcarSaldado(r)} className="h-7 text-xs mt-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                              <CheckCircle className="h-3 w-3 mr-1" />Marcar como saldado
                            </Button>
                          )}
                        </div>

                      <button onClick={() => eliminarRegistro(r.id!)}
                        className={`text-[10px] transition-colors ${confirmDelete === r.id ? 'text-red-600 font-medium' : 'text-red-400 hover:text-red-600'}`}>
                        {confirmDelete === r.id ? '¿Confirmar? Clic de nuevo para eliminar' : 'Eliminar esta venta'}
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
