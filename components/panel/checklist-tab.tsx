"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, RotateCcw, Check } from "lucide-react"
import { useState } from "react"
import type { ChecklistItem } from "@/app/page"

interface ChecklistTabProps {
  checklist: ChecklistItem[]
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  initialChecklist: ChecklistItem[]
}

export function ChecklistTab({ checklist, setChecklist, initialChecklist }: ChecklistTabProps) {
  const [nuevoPaso, setNuevoPaso] = useState("")

  const completed = checklist.filter(i => i.done).length
  const total = checklist.length

  const toggleCheck = (index: number) => {
    const newChecklist = [...checklist]
    newChecklist[index].done = !newChecklist[index].done
    setChecklist(newChecklist)
  }

  const resetChecklist = () => {
    setChecklist(initialChecklist.map(item => ({ ...item, done: false })))
  }

  const agregarPaso = () => {
    if (!nuevoPaso.trim()) return
    setChecklist([...checklist, { t: nuevoPaso, c: "Personalizado", done: false }])
    setNuevoPaso("")
  }

  const categorias = [...new Set(checklist.map(i => i.c))]

  return (
    <div className="space-y-5">
      {/* Checklist de armado */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Checklist de armado</p>
        <Card className="border-0 bg-card/80">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-3">Tilda cada paso al completarlo.</p>
            
            {categorias.map(cat => {
              const items = checklist.filter(i => i.c === cat)
              return (
                <div key={cat} className="mb-4 last:mb-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">{cat}</p>
                  {items.map(item => {
                    const idx = checklist.indexOf(item)
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 py-2 border-b border-dashed last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1"
                        onClick={() => toggleCheck(idx)}
                      >
                        <div 
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            item.done 
                              ? 'bg-emerald-500 border-emerald-500' 
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {item.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-xs ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.t}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={resetChecklist} className="h-7 text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reiniciar
              </Button>
              <span className="text-xs text-muted-foreground">{completed} de {total} completados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agregar paso personalizado */}
      <Card className="border-0 bg-card/80">
        <CardContent className="p-4">
          <p className="text-xs font-medium mb-2">Agregar paso personalizado</p>
          <div className="flex gap-2">
            <Input
              placeholder="ej: Instalar drivers de chipset"
              value={nuevoPaso}
              onChange={(e) => setNuevoPaso(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregarPaso()}
              className="flex-1 h-8 text-sm"
            />
            <Button size="sm" onClick={agregarPaso} className="h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
