"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, MessageCircle, Users, ShoppingCart } from "lucide-react"

interface Tarea {
  id: string
  texto: string
  done: boolean
}

interface Contacto {
  id: string
  nombre: string
  telefono: string
  tipo: string
  notas: string
  tareas: Tarea[]
}

export function AgendaSidebar() {
  const supabase = createClient()
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [expandido, setExpandido] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtro, setFiltro] = useState<"Todos" | "Comprador" | "Proveedor">("Todos")
  const [nuevaTarea, setNuevaTarea] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  // Form
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [tipo, setTipo] = useState("Comprador")
  const [notas, setNotas] = useState("")

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const { data } = await supabase.from("contactos").select("*").order("created_at", { ascending: false })
    if (data) setContactos(data.map((c: any) => ({ ...c, tareas: c.tareas || [] })))
  }

  const agregar = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    await supabase.from("contactos").insert({ nombre, telefono, tipo, notas, tareas: [] })
    setNombre(""); setTelefono(""); setNotas(""); setTipo("Comprador")
    setMostrarForm(false)
    await cargar()
    setGuardando(false)
  }

  const eliminar = async (id: string) => {
    await supabase.from("contactos").delete().eq("id", id)
    await cargar()
  }

  const agregarTarea = async (contacto: Contacto) => {
    const texto = nuevaTarea[contacto.id]?.trim()
    if (!texto) return
    const nuevasTareas = [...contacto.tareas, { id: Date.now().toString(), texto, done: false }]
    await supabase.from("contactos").update({ tareas: nuevasTareas, updated_at: new Date().toISOString() }).eq("id", contacto.id)
    setNuevaTarea(prev => ({ ...prev, [contacto.id]: "" }))
    await cargar()
  }

  const toggleTarea = async (contacto: Contacto, tareaId: string) => {
    const nuevasTareas = contacto.tareas.map(t => t.id === tareaId ? { ...t, done: !t.done } : t)
    await supabase.from("contactos").update({ tareas: nuevasTareas, updated_at: new Date().toISOString() }).eq("id", contacto.id)
    await cargar()
  }

  const eliminarTarea = async (contacto: Contacto, tareaId: string) => {
    const nuevasTareas = contacto.tareas.filter(t => t.id !== tareaId)
    await supabase.from("contactos").update({ tareas: nuevasTareas, updated_at: new Date().toISOString() }).eq("id", contacto.id)
    await cargar()
  }

  const filtrados = contactos.filter(c => filtro === "Todos" || c.tipo === filtro)
  const pendientes = contactos.reduce((s, c) => s + c.tareas.filter(t => !t.done).length, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold">Agenda</span>
          {pendientes > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px] px-1.5">{pendientes}</Badge>
          )}
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setMostrarForm(!mostrarForm)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 mb-3">
        {(["Todos", "Comprador", "Proveedor"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${filtro === f ? 'bg-blue-600 text-white border-blue-600' : 'border-muted-foreground/30 text-muted-foreground hover:border-blue-400'}`}
          >
            {f === "Todos" ? "Todos" : f === "Comprador" ? "🛒 Compradores" : "📦 Proveedores"}
          </button>
        ))}
      </div>

      {/* Formulario nuevo contacto */}
      {mostrarForm && (
        <div className="bg-muted/40 rounded-xl p-3 mb-3 space-y-2 border border-border">
          <Input placeholder="Nombre *" value={nombre} onChange={e => setNombre(e.target.value)} className="h-8 text-xs" />
          <Input placeholder="WhatsApp (ej: 3512345678)" value={telefono} onChange={e => setTelefono(e.target.value)} className="h-8 text-xs" />
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full h-8 text-xs border border-border rounded-md px-2 bg-background">
            <option value="Comprador">Comprador</option>
            <option value="Proveedor">Proveedor</option>
          </select>
          <Input placeholder="Notas (opcional)" value={notas} onChange={e => setNotas(e.target.value)} className="h-8 text-xs" />
          <div className="flex gap-2">
            <Button size="sm" onClick={agregar} disabled={guardando || !nombre.trim()} className="h-7 text-xs flex-1">
              {guardando ? "Guardando..." : "Agregar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMostrarForm(false)} className="h-7 text-xs">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de contactos */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtrados.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            {contactos.length === 0 ? "Sin contactos todavía" : "Sin contactos de este tipo"}
          </div>
        ) : (
          filtrados.map(contacto => {
            const abierto = expandido === contacto.id
            const pendientesContacto = contacto.tareas.filter(t => !t.done).length
            return (
              <div key={contacto.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Cabecera contacto */}
                <div
                  className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandido(abierto ? null : contacto.id)}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${contacto.tipo === 'Proveedor' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                    {contacto.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{contacto.nombre}</span>
                      {pendientesContacto > 0 && (
                        <Badge className="bg-orange-100 text-orange-700 border-0 text-[9px] px-1 py-0">{pendientesContacto}</Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{contacto.tipo}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {contacto.telefono && (
                      <a
                        href={`https://wa.me/54${contacto.telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(contacto.nombre)}!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-1 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {abierto ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </div>

                {/* Detalle expandido */}
                {abierto && (
                  <div className="border-t border-border px-3 py-2 space-y-2">
                    {contacto.telefono && (
                      <div className="text-[11px] text-muted-foreground">📱 {contacto.telefono}</div>
                    )}
                    {contacto.notas && (
                      <div className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-2 py-1.5">{contacto.notas}</div>
                    )}

                    {/* Tareas */}
                    <div>
                      <div className="text-[11px] font-medium text-muted-foreground mb-1.5">Pendientes</div>
                      <div className="space-y-1">
                        {contacto.tareas.length === 0 && (
                          <div className="text-[11px] text-muted-foreground italic">Sin tareas</div>
                        )}
                        {contacto.tareas.map(tarea => (
                          <div key={tarea.id} className="flex items-center gap-1.5 group">
                            <button onClick={() => toggleTarea(contacto, tarea.id)} className="flex-shrink-0">
                              {tarea.done
                                ? <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                                : <Square className="h-3.5 w-3.5 text-muted-foreground" />
                              }
                            </button>
                            <span className={`text-[11px] flex-1 ${tarea.done ? 'line-through text-muted-foreground' : ''}`}>
                              {tarea.texto}
                            </span>
                            <button
                              onClick={() => eliminarTarea(contacto, tarea.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Nueva tarea */}
                      <div className="flex gap-1.5 mt-2">
                        <Input
                          placeholder="Nueva tarea..."
                          value={nuevaTarea[contacto.id] || ""}
                          onChange={e => setNuevaTarea(prev => ({ ...prev, [contacto.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') agregarTarea(contacto) }}
                          className="h-7 text-[11px] flex-1"
                        />
                        <Button size="icon" variant="outline" className="h-7 w-7 flex-shrink-0" onClick={() => agregarTarea(contacto)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Eliminar contacto */}
                    <button
                      onClick={() => eliminar(contacto.id)}
                      className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                    >
                      Eliminar contacto
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
