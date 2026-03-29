"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, X, BookOpen, Pin, PinOff } from "lucide-react"

interface NotaItem {
  id: string
  texto: string
  done: boolean
}

interface Lista {
  id: string
  titulo: string
  items: NotaItem[]
  orden: number
}

interface NotasSidebarProps {
  flotante?: boolean
  onToggleFlotante?: () => void
  fijo?: boolean
  onToggleFijo?: () => void
}

export function NotasSidebar({ flotante, onToggleFlotante, fijo, onToggleFijo }: NotasSidebarProps) {
  const supabase = createClient()
  const [listas, setListas] = useState<Lista[]>([])
  const [expandida, setExpandida] = useState<string | null>(null)
  const [editandoTitulo, setEditandoTitulo] = useState<string | null>(null)
  const [nuevoItem, setNuevoItem] = useState<Record<string, string>>({})
  const [tituloTemp, setTituloTemp] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { cargar() }, [])
  useEffect(() => {
    if (editandoTitulo && inputRef.current) inputRef.current.focus()
  }, [editandoTitulo])

  const cargar = async () => {
    const { data } = await supabase.from("notas").select("*").order("orden", { ascending: true })
    if (data) setListas(data)
  }

  const agregarLista = async () => {
    const orden = listas.length
    const { data } = await supabase.from("notas").insert({ titulo: "Nueva lista", items: [], orden }).select().single()
    if (data) {
      setListas(prev => [...prev, data])
      setExpandida(data.id)
      setEditandoTitulo(data.id)
      setTituloTemp("Nueva lista")
    }
  }

  const guardarTitulo = async (id: string) => {
    if (!tituloTemp.trim()) return
    await supabase.from("notas").update({ titulo: tituloTemp, updated_at: new Date().toISOString() }).eq("id", id)
    setListas(prev => prev.map(l => l.id === id ? { ...l, titulo: tituloTemp } : l))
    setEditandoTitulo(null)
  }

  const eliminarLista = async (id: string) => {
    await supabase.from("notas").delete().eq("id", id)
    setListas(prev => prev.filter(l => l.id !== id))
    if (expandida === id) setExpandida(null)
  }

  const agregarItem = async (lista: Lista) => {
    const texto = nuevoItem[lista.id]?.trim()
    if (!texto) return
    const newItems = [...lista.items, { id: Date.now().toString(), texto, done: false }]
    await supabase.from("notas").update({ items: newItems, updated_at: new Date().toISOString() }).eq("id", lista.id)
    setListas(prev => prev.map(l => l.id === lista.id ? { ...l, items: newItems } : l))
    setNuevoItem(prev => ({ ...prev, [lista.id]: "" }))
  }

  const toggleItem = async (lista: Lista, itemId: string) => {
    const newItems = lista.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it)
    await supabase.from("notas").update({ items: newItems, updated_at: new Date().toISOString() }).eq("id", lista.id)
    setListas(prev => prev.map(l => l.id === lista.id ? { ...l, items: newItems } : l))
  }

  const eliminarItem = async (lista: Lista, itemId: string) => {
    const newItems = lista.items.filter(it => it.id !== itemId)
    await supabase.from("notas").update({ items: newItems, updated_at: new Date().toISOString() }).eq("id", lista.id)
    setListas(prev => prev.map(l => l.id === lista.id ? { ...l, items: newItems } : l))
  }

  const editarTextoItem = async (lista: Lista, itemId: string, texto: string) => {
    const newItems = lista.items.map(it => it.id === itemId ? { ...it, texto } : it)
    setListas(prev => prev.map(l => l.id === lista.id ? { ...l, items: newItems } : l))
  }

  const guardarTextoItem = async (lista: Lista) => {
    await supabase.from("notas").update({ items: lista.items, updated_at: new Date().toISOString() }).eq("id", lista.id)
  }

  const pendientes = (lista: Lista) => lista.items.filter(i => !i.done).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-foreground">Cuaderno</span>
          {listas.length > 0 && (
            <span className="text-[10px] bg-violet-100 text-violet-600 rounded-full px-1.5 py-0.5 font-medium">
              {listas.reduce((s, l) => s + pendientes(l), 0)} pendientes
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onToggleFijo && (
            <button
              onClick={onToggleFijo}
              title={fijo ? "Soltar (flotante)" : "Fijar en sidebar"}
              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-violet-500 hover:bg-violet-50 transition-all"
            >
              {fijo ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-violet-500 hover:bg-violet-50" onClick={agregarLista}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Listas */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {listas.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>Sin listas todavía.</p>
            <p className="mt-1 text-[10px]">Tocá + para crear una.</p>
          </div>
        )}

        {listas.map(lista => (
          <div key={lista.id} className="rounded-xl border border-border bg-card/60 overflow-hidden">
            {/* Cabecera de la lista */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => setExpandida(expandida === lista.id ? null : lista.id)}
            >
              <div className="flex-1 min-w-0">
                {editandoTitulo === lista.id ? (
                  <input
                    ref={inputRef}
                    value={tituloTemp}
                    onChange={e => setTituloTemp(e.target.value)}
                    onBlur={() => guardarTitulo(lista.id)}
                    onKeyDown={e => { if (e.key === "Enter") guardarTitulo(lista.id); e.stopPropagation() }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs font-semibold w-full bg-transparent border-b border-violet-400 outline-none pb-0.5"
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-semibold truncate"
                      onDoubleClick={e => {
                        e.stopPropagation()
                        setEditandoTitulo(lista.id)
                        setTituloTemp(lista.titulo)
                      }}
                    >
                      {lista.titulo}
                    </span>
                    {pendientes(lista) > 0 && (
                      <span className="text-[9px] bg-violet-100 text-violet-600 rounded-full px-1.5 shrink-0">
                        {pendientes(lista)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); eliminarLista(lista.id) }}
                  className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground/40 hover:text-red-400 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                {expandida === lista.id
                  ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                }
              </div>
            </div>

            {/* Contenido desplegable */}
            {expandida === lista.id && (
              <div className="border-t border-border/60 px-2.5 py-2 space-y-1">
                {/* Items */}
                {lista.items.length === 0 && (
                  <p className="text-[10px] text-muted-foreground py-1">Sin ítems. Agregá uno abajo.</p>
                )}
                {lista.items.map(item => (
                  <div key={item.id} className="flex items-start gap-1.5 group">
                    <button
                      onClick={() => toggleItem(lista, item.id)}
                      className={`mt-0.5 shrink-0 h-3.5 w-3.5 rounded border transition-all ${
                        item.done
                          ? "bg-violet-500 border-violet-500 flex items-center justify-center"
                          : "border-muted-foreground/40 hover:border-violet-400"
                      }`}
                    >
                      {item.done && <span className="text-white text-[8px] font-bold">✓</span>}
                    </button>
                    <input
                      value={item.texto}
                      onChange={e => editarTextoItem(lista, item.id, e.target.value)}
                      onBlur={() => guardarTextoItem(lista)}
                      onKeyDown={e => { if (e.key === "Enter") guardarTextoItem(lista) }}
                      className={`flex-1 text-[11px] bg-transparent outline-none min-w-0 ${
                        item.done ? "line-through text-muted-foreground/50" : "text-foreground"
                      }`}
                    />
                    <button
                      onClick={() => eliminarItem(lista, item.id)}
                      className="shrink-0 h-4 w-4 flex items-center justify-center rounded text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:!text-red-400 transition-all"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}

                {/* Agregar item */}
                <div className="flex gap-1 pt-1">
                  <input
                    value={nuevoItem[lista.id] || ""}
                    onChange={e => setNuevoItem(prev => ({ ...prev, [lista.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") agregarItem(lista) }}
                    placeholder="Agregar ítem..."
                    className="flex-1 text-[11px] bg-muted/40 rounded px-2 py-1 outline-none border border-transparent focus:border-violet-300 placeholder:text-muted-foreground/50"
                  />
                  <button
                    onClick={() => agregarItem(lista)}
                    className="h-6 w-6 flex items-center justify-center rounded bg-violet-100 text-violet-600 hover:bg-violet-200 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
