"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Download, Check, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import type { StockItem, ArmadoItem } from "@/app/page"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

const MARCA = "Jer Abyte"
const LEMA = "La PC que cumple con tus exigencias diarias — vas a tener nuestra confianza y lealtad ante cualquier dificultad."
const GARANTIA = 6
const REND_DESC: Record<string, string> = {
  "Basico": "Ideal para navegacion web, redes sociales, documentos y uso cotidiano sin exigencia grafica.",
  "Intermedio": "Permite multitarea fluida, juegos en 1080p a framerate estable y edicion de fotos sin problemas.",
  "Alto": "Preparada para juegos en 1440p, edicion de video, diseno grafico y streaming simultaneo.",
  "Extremo": "Rendimiento maximo: gaming en 4K, renders 3D pesados, streaming y produccion profesional."
}

// Orden lógico de armado con metadatos
const SLOTS: {
  id: string
  label: string
  cat: string[]
  multiple: boolean
  opcional: boolean
  hint: string
}[] = [
  { id: "motherboard", label: "Motherboard", cat: ["Motherboard"], multiple: false, opcional: false, hint: "La base de todo el sistema" },
  { id: "cpu", label: "Procesador (CPU)", cat: ["CPU"], multiple: false, opcional: false, hint: "Va en el socket de la motherboard" },
  { id: "ram", label: "Memoria RAM", cat: ["RAM"], multiple: true, opcional: false, hint: "Podés agregar más de un módulo" },
  { id: "disco", label: "Almacenamiento", cat: ["Almacenamiento"], multiple: true, opcional: false, hint: "SSD, NVMe o HDD — podés combinar" },
  { id: "fuente", label: "Fuente de alimentación", cat: ["Fuente"], multiple: false, opcional: false, hint: "Calculá al menos 20% de margen sobre el consumo" },
  { id: "cooler", label: "Refrigeración (Cooler CPU)", cat: ["Cooler"], multiple: false, opcional: false, hint: "Cooler de torre, líquido o stock" },
  { id: "gabinete", label: "Gabinete", cat: ["Gabinete"], multiple: false, opcional: false, hint: "Verificá compatibilidad con la motherboard y el cooler" },
  { id: "gpu", label: "Placa de video (GPU)", cat: ["GPU"], multiple: false, opcional: true, hint: "Opcional si el procesador tiene gráficos integrados" },
  { id: "so", label: "Sistema operativo", cat: ["Otro"], multiple: false, opcional: true, hint: "Windows, Linux, etc." },
  { id: "adaptadores", label: "Adaptadores", cat: ["Otro"], multiple: true, opcional: true, hint: "Wi-Fi, Bluetooth, capturadoras, etc." },
]

interface ArmadoTabProps {
  stock: StockItem[]
  setStock: (updater: StockItem[] | ((prev: StockItem[]) => StockItem[])) => Promise<void>
  armado: ArmadoItem[]
  setArmado: React.Dispatch<React.SetStateAction<ArmadoItem[]>>
  margenGlobal: number
  setMargenGlobal: React.Dispatch<React.SetStateAction<number>>
  setPcArmadas: React.Dispatch<React.SetStateAction<number>>
  onPcArmada?: (precioFinal: number, cliente: string, nombrePc: string, componentes: any[], costoTotal: number) => Promise<void>
  onRegistrarVenta?: (monto: number, costo: number, cliente: string, descripcion: string) => Promise<void>
}

export function ArmadoTab({ stock, setStock, armado, setArmado, margenGlobal, setMargenGlobal, setPcArmadas, onPcArmada, onRegistrarVenta }: ArmadoTabProps) {
  const [pcNombre, setPcNombre] = useState("")
  const [pcFecha, setPcFecha] = useState("")
  const [pcCliente, setPcCliente] = useState("")
  const [pcTelefono, setPcTelefono] = useState("")
  const [pcUso, setPcUso] = useState("Gaming")
  const [pcRendimiento, setPcRendimiento] = useState("Intermedio")
  const [pcObservaciones, setPcObservaciones] = useState("")
  const [extNombre, setExtNombre] = useState("")
  const [extPrecio, setExtPrecio] = useState("")
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  // Estado de selección por slot
  const [slotSelected, setSlotSelected] = useState<Record<string, string>>({})
  const [slotQty, setSlotQty] = useState<Record<string, string>>({})
  const [slotAviso, setSlotAviso] = useState<Record<string, string>>({})
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({})
  const [precioFinalManual, setPrecioFinalManual] = useState<string>("")

  useEffect(() => {
    setPcFecha(new Date().toLocaleDateString('es-AR'))
  }, [])

  const precioVenta = (costo: number) => Math.round(costo * (1 + margenGlobal / 100))

  const totalCosto = armado.reduce((sum, a) => sum + (a.pcosto * a.qty), 0)
  const totalVentaBase = armado.reduce((sum, a) => sum + (a.pventa * a.qty), 0)

  // Precio final: usa el manual si fue editado, sino el calculado con margen
  const precioFinalNum = precioFinalManual !== "" ? (parseFloat(precioFinalManual) || 0) : totalVentaBase
  const totalVenta = precioFinalNum
  const ganancia = totalVenta - totalCosto
  const margenReal = totalCosto > 0 ? Math.round((ganancia / totalCosto) * 100) : 0
  const enRojo = ganancia < 0

  // Precio recomendado con margen actual
  const precioRecomendado = Math.round(totalCosto * (1 + margenGlobal / 100))

  // Distribuir precio final proporcionalmente entre componentes
  const armadoConPrecioDistribuido = () => {
    if (precioFinalManual === "" || totalCosto === 0) return armado
    const factor = precioFinalNum / totalCosto
    return armado.map(a => ({ ...a, pventa: Math.round(a.pcosto * factor) }))
  }

  const aplicarMargen = () => {
    setArmado(armado.map(a => ({ ...a, pventa: Math.round(a.pcosto * (1 + margenGlobal / 100)) })))
  }

  // Stock disponible filtrado por categorías del slot
  const stockParaSlot = (slot: typeof SLOTS[0]) =>
    stock.filter(s => slot.cat.includes(s.cat) && s.qty > 0)

  const agregarDesdeSlot = (slot: typeof SLOTS[0]) => {
    const idx = parseInt(slotSelected[slot.id] || "")
    const qty = parseInt(slotQty[slot.id] || "1") || 1
    if (isNaN(idx)) {
      setSlotAviso({ ...slotAviso, [slot.id]: "Seleccioná un componente." })
      return
    }
    const s = stock[idx]
    const yaUsado = armado.filter(a => a.sidx === idx).reduce((sum, a) => sum + a.qty, 0)
    if (yaUsado + qty > s.qty) {
      setSlotAviso({ ...slotAviso, [slot.id]: `Stock insuficiente. Disponible: ${s.qty - yaUsado}` })
      return
    }
    setSlotAviso({ ...slotAviso, [slot.id]: "" })
    setArmado([...armado, {
      nombre: s.nombre,
      cat: s.cat,
      pcosto: s.precio,
      pventa: precioVenta(s.precio),
      qty,
      sidx: idx,
      ext: false,
      slotId: slot.id,
    }])
    setSlotSelected({ ...slotSelected, [slot.id]: "" })
    setSlotQty({ ...slotQty, [slot.id]: "1" })
  }

  const agregarExterno = () => {
    if (!extNombre.trim()) return
    const p = parseFloat(extPrecio) || 0
    setArmado([...armado, {
      nombre: extNombre,
      cat: "Externo",
      pcosto: p,
      pventa: precioVenta(p),
      qty: 1,
      sidx: null,
      ext: true,
      slotId: "adaptadores",
    }])
    setExtNombre("")
    setExtPrecio("")
  }

  const quitarDeArmado = (index: number) => {
    setArmado(armado.filter((_, i) => i !== index))
  }

  const limpiarArmado = () => {
    setArmado([])
    setMensaje(null)
    setSlotAviso({})
  }

  const confirmarArmado = async () => {
    if (armado.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega componentes primero.' })
      return
    }
    const newStock = stock.map((s, idx) => {
      const usado = armado.filter(a => a.sidx === idx).reduce((t, a) => t + a.qty, 0)
      return usado > 0 ? { ...s, qty: s.qty - usado } : s
    })
    await setStock(newStock)
    setPcArmadas(p => p + 1)
    if (onPcArmada) await onPcArmada(precioFinalNum, pcCliente.trim(), pcNombre.trim(), armado, totalCosto)
    setMensaje({ tipo: 'success', texto: 'Stock descontado. PC registrada y traspasada a Pagos.' })
  }

  const updatePrecio = (index: number, field: 'pcosto' | 'pventa', value: number) => {
    const newArmado = [...armado]
    newArmado[index][field] = value
    setArmado(newArmado)
  }

  const toggleSlot = (slotId: string) => {
    setExpandedSlots(prev => ({ ...prev, [slotId]: !prev[slotId] }))
  }

  // Items del armado agrupados por slot
  const itemsEnSlot = (slotId: string) => armado.filter(a => (a as any).slotId === slotId)
  const itemsSinSlot = armado.filter(a => !(a as any).slotId)

  // PDF Cliente
  const genPDFCliente = async (precioFinal?: number, armadoDist?: typeof armado) => {
    if (armado.length === 0) { setMensaje({ tipo: 'error', texto: 'Agrega componentes.' }); return }
    const armadoUsar = armadoDist || armado
    const jspdfModule = await import('jspdf'); const jsPDF = jspdfModule.jsPDF || jspdfModule.default
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210, mg = 18, cw = W - mg * 2
    const nom = pcNombre.trim() || 'PC sin nombre'
    const fecha = pcFecha.trim() || new Date().toLocaleDateString('es-AR')
    const cli = pcCliente.trim() || '—'
    const tel = pcTelefono.trim() || '—'
    const uso = pcUso
    const rend = pcRendimiento
    const obs = pcObservaciones.trim()

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
    doc.text('PRESUPUESTO / FICHA TECNICA', W / 2, 46, { align: 'center' })

    let y = 60
    doc.setFillColor(235, 241, 251); doc.rect(mg, y, cw, 7, 'F')
    doc.setTextColor(15, 40, 80); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('Informacion del equipo', mg + 3, y + 5); y += 11
    const info = [['Equipo', nom], ['Cliente', cli], ['Telefono', tel], ['Uso', uso], ['Rendimiento', rend]]
    info.forEach(([l, v], i) => {
      if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(mg, y - 3.5, cw, 8, 'F') }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80); doc.setFontSize(9)
      doc.text(l + ':', mg + 2, y + 1)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20)
      doc.text(String(v), mg + 50, y + 1); y += 8
    }); y += 4

    doc.setFillColor(235, 241, 251); doc.rect(mg, y, cw, 7, 'F')
    doc.setTextColor(15, 40, 80); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('Descripcion de rendimiento', mg + 3, y + 5); y += 11
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40, 40, 40)
    const rd = REND_DESC[rend] || rend
    doc.splitTextToSize(rd, cw - 4).forEach((l: string) => { doc.text(l, mg + 2, y); y += 5.5 }); y += 5

    // Componentes ordenados por slot
    doc.setFillColor(235, 241, 251); doc.rect(mg, y, cw, 7, 'F')
    doc.setTextColor(15, 40, 80); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('Componentes del equipo', mg + 3, y + 5); y += 9
    doc.setFillColor(24, 95, 165); doc.rect(mg, y, cw, 7, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold')
    doc.text('Componente', mg + 2, y + 4.8)
    doc.text('Categoria', mg + 100, y + 4.8)
    doc.text('Cant.', mg + 140, y + 4.8)
    doc.text('Precio', W - mg - 2, y + 4.8, { align: 'right' }); y += 9

    // Ordenar armado según orden de slots
    const armadoOrdenado = [...SLOTS.flatMap(slot =>
      armadoUsar.filter(a => (a as any).slotId === slot.id)
    ), ...armadoUsar.filter(a => !(a as any).slotId)]

    let total = 0
    doc.setFont('helvetica', 'normal')
    armadoOrdenado.forEach((a, i) => {
      const sub = a.pventa * a.qty; total += sub
      if (i % 2 === 0) { doc.setFillColor(248, 249, 252); doc.rect(mg, y - 3.5, cw, 8, 'F') }
      doc.setTextColor(20, 20, 20); doc.setFontSize(8.5)
      doc.text(a.nombre.length > 50 ? a.nombre.slice(0, 48) + '...' : a.nombre, mg + 2, y + 1)
      doc.setTextColor(100, 100, 100); doc.setFontSize(8); doc.text(a.cat, mg + 100, y + 1)
      doc.setTextColor(20, 20, 20); doc.setFontSize(8.5); doc.text(String(a.qty), mg + 143, y + 1)
      doc.setFont('helvetica', 'bold'); doc.text(fmt(sub), W - mg - 2, y + 1, { align: 'right' })
      doc.setFont('helvetica', 'normal'); y += 8
      if (y > 255) { doc.addPage(); y = 20 }
    }); y += 2

    // Usar precio final manual si fue definido
    const totalFinal = precioFinal !== undefined ? precioFinal : total

    doc.setFillColor(15, 40, 80); doc.rect(mg, y, cw, 9, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('Total', mg + 3, y + 6); doc.text(fmt(totalFinal), W - mg - 2, y + 6, { align: 'right' }); y += 14

    if (obs) {
      doc.setFillColor(235, 241, 251); doc.rect(mg, y, cw, 7, 'F')
      doc.setTextColor(15, 40, 80); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
      doc.text('Observaciones', mg + 3, y + 5); y += 11
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40, 40, 40)
      doc.splitTextToSize(obs, cw - 4).forEach((l: string) => { doc.text(l, mg + 2, y); y += 5.5 }); y += 5
    }

    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFillColor(234, 243, 222); doc.rect(mg, y, cw, 26, 'F')
    doc.setDrawColor(59, 109, 17); doc.setLineWidth(0.4); doc.rect(mg, y, cw, 26)
    doc.setTextColor(39, 80, 10); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('Garantia de mano de obra — ' + GARANTIA + ' meses', mg + 4, y + 7)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    const gt = `${MARCA} garantiza la mano de obra de este equipo por ${GARANTIA} meses desde la fecha de entrega. La garantia cubre unicamente defectos derivados del proceso de armado. Queda excluida ante manipulacion por terceros, danos fisicos, liquidos, caidas, modificaciones no autorizadas o mal uso del equipo. Ante cualquier inconveniente dentro de los terminos, nos comprometemos a resolverlo sin costo adicional.`
    let gy = y + 13
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
      doc.setFont('helvetica', 'normal'); doc.text('Pag ' + p + ' de ' + np, W - mg, 292, { align: 'right' })
    }
    doc.save(`JerAbyte_Cliente_${nom.replace(/[^a-z0-9]/gi, '_')}.pdf`)
    setMensaje({ tipo: 'success', texto: 'PDF para el cliente generado.' })
  }

  // PDF Interno
  const genPDFInterno = async (precioFinal?: number, armadoDist?: typeof armado) => {
    if (armado.length === 0) { setMensaje({ tipo: 'error', texto: 'Agrega componentes.' }); return }
    const armadoUsar = armadoDist || armado
    const jspdfModule = await import('jspdf'); const jsPDF = jspdfModule.jsPDF || jspdfModule.default
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210, mg = 18, cw = W - mg * 2
    const nom = pcNombre.trim() || 'PC sin nombre'
    const fecha = pcFecha.trim() || new Date().toLocaleDateString('es-AR')
    const cli = pcCliente.trim() || '—'
    const uso = pcUso
    const rend = pcRendimiento

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
    const info = [['Equipo', nom], ['Cliente', cli], ['Uso', uso], ['Rendimiento', rend]]
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

    const armadoOrdenado = [...SLOTS.flatMap(slot =>
      armadoUsar.filter(a => (a as any).slotId === slot.id)
    ), ...armadoUsar.filter(a => !(a as any).slotId)]

    let tc = 0, tv = 0
    doc.setFont('helvetica', 'normal')
    armadoOrdenado.forEach((a, i) => {
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

    const tvFinal = precioFinal !== undefined ? precioFinal : tv
    const gananciaFinal = tvFinal - tc
    const margenRealFinal = tc > 0 ? Math.round((gananciaFinal / tc) * 100) : 0

    doc.setFillColor(80, 20, 20); doc.rect(mg, y, cw, 14, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('Totales', mg + 3, y + 5)
    doc.setTextColor(255, 180, 180); doc.text('Costo: ' + fmt(tc), mg + 35, y + 5)
    doc.setTextColor(180, 255, 180); doc.text('Venta: ' + fmt(tvFinal), mg + 90, y + 5)
    doc.setTextColor(180, 210, 255); doc.text('Ganancia: ' + fmt(gananciaFinal), mg + 145, y + 5)
    doc.setTextColor(255, 255, 180); doc.setFontSize(8)
    doc.text('Margen real: ' + margenRealFinal + '%', W - mg - 2, y + 11, { align: 'right' })

    const np = doc.internal.getNumberOfPages()
    for (let p = 1; p <= np; p++) {
      doc.setPage(p)
      doc.setFillColor(80, 20, 20); doc.rect(0, 285, W, 12, 'F')
      doc.setTextColor(255, 180, 180); doc.setFontSize(7.5); doc.setFont('helvetica', 'italic')
      doc.text('DOCUMENTO INTERNO JER ABYTE — CONFIDENCIAL', W / 2, 292, { align: 'center' })
      doc.setFont('helvetica', 'normal'); doc.text('Pag ' + p + ' de ' + np, W - mg, 292, { align: 'right' })
    }
    doc.save(`JerAbyte_INTERNO_${nom.replace(/[^a-z0-9]/gi, '_')}_${cli.replace(/[^a-z0-9]/gi, '_')}.pdf`)
    setMensaje({ tipo: 'success', texto: 'PDF interno generado.' })
  }

  return (
    <div className="space-y-4">
      {/* Datos PC y cliente */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Datos de la PC y cliente</p>
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nombre de la PC</label>
                <Input value={pcNombre} onChange={e => setPcNombre(e.target.value)} placeholder="ej: PC Gaming Ryzen 5" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Fecha</label>
                <Input value={pcFecha} onChange={e => setPcFecha(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nombre del cliente</label>
                <Input value={pcCliente} onChange={e => setPcCliente(e.target.value)} placeholder="ej: Juan Perez" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Telefono del cliente</label>
                <Input value={pcTelefono} onChange={e => setPcTelefono(e.target.value)} placeholder="ej: 351-555-1234" className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Uso principal</label>
                <Select value={pcUso} onValueChange={setPcUso}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gaming">Gaming</SelectItem>
                    <SelectItem value="Trabajo y ofimatica">Trabajo y ofimatica</SelectItem>
                    <SelectItem value="Diseno grafico y edicion">Diseno grafico y edicion</SelectItem>
                    <SelectItem value="Streaming y contenido">Streaming y contenido</SelectItem>
                    <SelectItem value="Programacion / desarrollo">Programacion / desarrollo</SelectItem>
                    <SelectItem value="Uso general">Uso general</SelectItem>
                    <SelectItem value="Servidor / NAS">Servidor / NAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Nivel de rendimiento</label>
                <Select value={pcRendimiento} onValueChange={setPcRendimiento}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basico">Basico</SelectItem>
                    <SelectItem value="Intermedio">Intermedio</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="Extremo">Extremo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Observaciones para el cliente</label>
              <Textarea value={pcObservaciones} onChange={e => setPcObservaciones(e.target.value)} placeholder="ej: Se recomienda ampliar RAM en el futuro." className="min-h-[60px] text-sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Margen global */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Margen global</p>
        <Input type="number" value={margenGlobal} onChange={e => setMargenGlobal(parseFloat(e.target.value) || 0)} className="w-16 h-7 text-sm" />
        <span className="text-xs">%</span>
        <Button size="sm" onClick={aplicarMargen} className="h-7 text-xs">Aplicar a todos</Button>
      </div>

      {/* SLOTS DE ARMADO EN ORDEN */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Armado por componente</p>
        <div className="space-y-2">
          {SLOTS.map((slot, slotIndex) => {
            const enSlot = itemsEnSlot(slot.id)
            const disponibles = stockParaSlot(slot)
            const isExpanded = expandedSlots[slot.id] ?? false
            const tieneItems = enSlot.length > 0

            return (
              <Card key={slot.id} className={`border-0 overflow-hidden transition-all ${tieneItems ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-card/80'}`}>
                <CardContent className="p-0">
                  {/* Header del slot */}
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-black/5 transition-colors"
                    onClick={() => toggleSlot(slot.id)}
                  >
                    {/* Número de paso */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${tieneItems ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                      {tieneItems ? <Check className="h-3 w-3" /> : slotIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">{slot.label}</span>
                        {slot.opcional && <Badge variant="outline" className="text-[8px] px-1 py-0">Opcional</Badge>}
                        {slot.multiple && <Badge variant="secondary" className="text-[8px] px-1 py-0">Múltiples</Badge>}
                        {tieneItems && (
                          <Badge className="text-[8px] px-1 py-0 bg-emerald-100 text-emerald-700 border-emerald-300">
                            {enSlot.length} agregado{enSlot.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{slot.hint}</p>
                    </div>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                  </button>

                  {/* Items ya agregados en este slot */}
                  {tieneItems && (
                    <div className="px-3 pb-2 space-y-1">
                      {enSlot.map((item) => {
                        const globalIdx = armado.indexOf(item)
                        return (
                          <div key={globalIdx} className="flex items-center gap-2 bg-white/60 dark:bg-black/20 rounded-md px-2 py-1.5">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium truncate block">{item.nombre}</span>
                              <span className="text-[9px] text-muted-foreground">x{item.qty} · Cliente: {fmt(item.pventa * item.qty)}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-red-400 hover:text-red-600 flex-shrink-0" onClick={() => quitarDeArmado(globalIdx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Panel expandido para agregar */}
                  {isExpanded && (
                    <div className="border-t px-3 py-3 space-y-2 bg-muted/30">
                      {disponibles.length > 0 ? (
                        <div className="flex gap-2 flex-wrap items-end">
                          <div className="flex-1 min-w-[160px] space-y-1">
                            <label className="text-[9px] text-muted-foreground">Del inventario</label>
                            <Select
                              value={slotSelected[slot.id] || ""}
                              onValueChange={v => setSlotSelected({ ...slotSelected, [slot.id]: v })}
                            >
                              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="— Seleccionar —" /></SelectTrigger>
                              <SelectContent>
                                {disponibles.map(s => {
                                  const idx = stock.indexOf(s)
                                  return <SelectItem key={idx} value={String(idx)}>{s.nombre} ({s.qty}) — {fmt(s.precio)}</SelectItem>
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          {slot.multiple && (
                            <div className="w-16 space-y-1">
                              <label className="text-[9px] text-muted-foreground">Cant.</label>
                              <Input
                                type="number" min="1"
                                value={slotQty[slot.id] || "1"}
                                onChange={e => setSlotQty({ ...slotQty, [slot.id]: e.target.value })}
                                className="h-7 text-xs"
                              />
                            </div>
                          )}
                          <Button size="sm" className="h-7 text-xs" onClick={() => agregarDesdeSlot(slot)}>
                            <Plus className="h-3 w-3 mr-1" />Agregar
                          </Button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-600">No hay {slot.label.toLowerCase()} en tu inventario. Agregá uno en la pestaña Inventario.</p>
                      )}
                      {slotAviso[slot.id] && <p className="text-[10px] text-red-500">{slotAviso[slot.id]}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Componente externo */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Componente externo (no está en inventario)</p>
        <Card className="border-0 bg-card/80">
          <CardContent className="p-3">
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex-1 min-w-[140px] space-y-1">
                <label className="text-[9px] text-muted-foreground">Nombre</label>
                <Input placeholder="ej: Licencia Windows" value={extNombre} onChange={e => setExtNombre(e.target.value)} className="h-7 text-xs" />
              </div>
              <div className="w-28 space-y-1">
                <label className="text-[9px] text-muted-foreground">Costo ($)</label>
                <Input type="number" placeholder="0" value={extPrecio} onChange={e => setExtPrecio(e.target.value)} className="h-7 text-xs" />
              </div>
              <Button variant="outline" size="sm" onClick={agregarExterno} className="h-7 text-xs">Agregar</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de precios editable */}
      {armado.length > 0 && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Editar precios</p>
          <Card className="border-0 bg-card/80 overflow-x-auto">
            <CardContent className="p-3">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-[1fr_55px_90px_90px_40px] gap-2 text-[10px] font-medium text-muted-foreground border-b pb-2 mb-2">
                  <span>Componente</span>
                  <span className="text-center">Cant.</span>
                  <span className="text-right"><Badge variant="destructive" className="text-[8px] px-1">Costo</Badge></span>
                  <span className="text-right"><Badge className="text-[8px] px-1 bg-emerald-600">Cliente</Badge></span>
                  <span></span>
                </div>
                {armado.map((a, i) => (
                  <div key={i} className="grid grid-cols-[1fr_55px_90px_90px_40px] gap-2 items-center py-1.5 border-b border-dashed last:border-0">
                    <div>
                      <span className="text-xs font-medium">{a.nombre}</span>
                      <Badge variant="secondary" className="ml-1 text-[8px]">{a.cat}</Badge>
                    </div>
                    <div className="text-center text-xs">{a.qty}</div>
                    <Input
                      type="number"
                      value={a.pcosto}
                      onChange={e => updatePrecio(i, 'pcosto', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-right bg-red-50 border-red-200"
                    />
                    <Input
                      type="number"
                      value={a.pventa}
                      onChange={e => updatePrecio(i, 'pventa', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-right bg-emerald-50 border-emerald-200"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => quitarDeArmado(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calculadora de precio final */}
      <Card className="border-0 bg-card/80">
        <CardContent className="p-4 space-y-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Calculadora de precio</p>

          {/* Fila de métricas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 border border-red-100">
              <div className="text-[10px] text-muted-foreground mb-1">Costo real <Badge variant="destructive" className="text-[8px] ml-1">Solo vos</Badge></div>
              <div className="text-lg font-semibold text-red-600">{fmt(totalCosto)}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-100">
              <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                Recomendado
                <span className="text-[9px] text-blue-500">({margenGlobal}% margen)</span>
              </div>
              <div className="text-lg font-semibold text-blue-600">{fmt(precioRecomendado)}</div>
            </div>
            <div className={`rounded-xl p-3 border ${enRojo ? 'bg-red-50 border-red-200' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100'}`}>
              <div className="text-[10px] text-muted-foreground mb-1">Ganancia</div>
              <div className={`text-lg font-semibold ${enRojo ? 'text-red-600' : 'text-emerald-600'}`}>
                {enRojo ? '' : '+'}{fmt(ganancia)}
              </div>
              <div className={`text-[10px] font-medium ${enRojo ? 'text-red-500' : 'text-emerald-500'}`}>
                {margenReal}% margen real
              </div>
            </div>
          </div>

          {/* Precio final editable */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground">
              Precio final al cliente — editalo vos <Badge className="text-[8px] ml-1 bg-emerald-600">PDF cliente</Badge>
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">$</span>
                <input
                  type="number"
                  value={precioFinalManual !== "" ? precioFinalManual : precioRecomendado}
                  onChange={e => setPrecioFinalManual(e.target.value)}
                  className={`w-full h-10 pl-7 pr-3 text-base font-semibold border-2 rounded-xl bg-background transition-colors ${enRojo ? 'border-red-400 text-red-600' : 'border-emerald-400 text-emerald-600'}`}
                  placeholder={String(precioRecomendado)}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-10 text-xs"
                onClick={() => setPrecioFinalManual(String(precioRecomendado))}
              >
                Usar recomendado
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-10 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  const dist = armadoConPrecioDistribuido()
                  setArmado(dist)
                  setPrecioFinalManual("")
                }}
                title="Distribuye el precio final proporcionalmente entre todos los componentes"
              >
                Distribuir entre componentes
              </Button>
            </div>
            {enRojo && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                <span>⚠️</span>
                <span>El precio es menor al costo — estás perdiendo {fmt(Math.abs(ganancia))}</span>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 flex-wrap pt-1">
            <Button size="sm" onClick={() => genPDFCliente(precioFinalNum, armadoConPrecioDistribuido())} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
              <Download className="h-3 w-3 mr-1" />PDF Cliente
            </Button>
            <Button size="sm" onClick={() => genPDFInterno(precioFinalNum, armadoConPrecioDistribuido())} className="h-8 text-xs">
              <Download className="h-3 w-3 mr-1" />PDF Interno
            </Button>
            <Button size="sm" onClick={confirmarArmado} variant="outline" className="h-8 text-xs">
              <Check className="h-3 w-3 mr-1" />Confirmar stock
            </Button>
            {onRegistrarVenta && (
              <Button
                size="sm"
                onClick={async () => {
                  await confirmarArmado()
                  await onRegistrarVenta(
                    precioFinalNum,
                    totalCosto,
                    pcCliente,
                    pcNombre || "PC armada"
                  )
                  setMensaje({ tipo: 'success', texto: 'Stock descontado y venta registrada.' })
                }}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-3 w-3 mr-1" />Confirmar + Registrar venta
              </Button>
            )}
            <Button size="sm" onClick={limpiarArmado} variant="outline" className="h-8 text-xs text-red-600 border-red-300 hover:bg-red-50">
              <Trash2 className="h-3 w-3 mr-1" />Limpiar
            </Button>
          </div>

          {mensaje && (
            <p className={`text-xs ${mensaje.tipo === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{mensaje.texto}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
