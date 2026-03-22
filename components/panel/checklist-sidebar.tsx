"use client"

import { CheckSquare, Square, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ChecklistItem } from "@/app/page"

interface ChecklistSidebarProps {
  checklist: ChecklistItem[]
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  initialChecklist: ChecklistItem[]
}

export function ChecklistSidebar({ checklist, setChecklist, initialChecklist }: ChecklistSidebarProps) {
  const done = checklist.filter(i => i.done).length
  const total = checklist.length
  const pct = Math.round((done / total) * 100)

  const toggle = (idx: number) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item))
  }

  const reset = () => {
    setChecklist(initialChecklist.map(i => ({ ...i, done: false })))
  }

  const cats = [...new Set(checklist.map(i => i.c))]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold">Checklist</span>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={reset} title="Reiniciar">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
          <span>{done} de {total} pasos</span>
          <span className={pct === 100 ? 'text-emerald-600 font-medium' : ''}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {cats.map(cat => (
          <div key={cat}>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">{cat}</div>
            <div className="space-y-1">
              {checklist.filter(i => i.c === cat).map((item, _) => {
                const idx = checklist.indexOf(item)
                return (
                  <button
                    key={idx}
                    onClick={() => toggle(idx)}
                    className="w-full flex items-start gap-2 text-left hover:bg-muted/40 rounded-lg px-2 py-1.5 transition-colors group"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {item.done
                        ? <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                        : <Square className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-400" />
                      }
                    </div>
                    <span className={`text-[11px] leading-tight ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.t}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {pct === 100 && (
        <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl px-3 py-2 text-center">
          <div className="text-emerald-600 text-xs font-medium">✓ PC lista para entregar</div>
        </div>
      )}
    </div>
  )
}
