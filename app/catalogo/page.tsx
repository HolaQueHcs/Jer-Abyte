"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { ImageIcon } from "lucide-react"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

interface CatalogoItem {
  id: string
  nombre: string
  descripcion: string
  precio_venta: number
  estado: string
  foto_url: string
}

export default function CatalogoPublico() {
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from("catalogo")
        .select("id, nombre, descripcion, precio_venta, estado, foto_url")
        .eq("estado", "Disponible")
        .order("created_at", { ascending: false })

      if (data) setCatalogo(data)
      setLoading(false)
    }
    cargar()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f2850] to-[#185FA5] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              JA
            </div>
            <div>
              <h1 className="text-2xl font-bold">Jer Abyte</h1>
              <p className="text-blue-200 text-sm">La PC que cumple con tus exigencias diarias</p>
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold">PCs disponibles</h2>
            <p className="text-blue-200 text-sm mt-1">Equipos armados y listos para entrega con garantía de mano de obra</p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando catálogo...</div>
        ) : catalogo.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">No hay PCs disponibles en este momento</div>
            <p className="text-gray-400 text-sm">Volvé pronto o contactanos para consultas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogo.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                {/* Foto */}
                {item.foto_url ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={item.foto_url}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.nombre}</h3>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] shrink-0">
                      Disponible
                    </Badge>
                  </div>
                  {item.descripcion && (
                    <p className="text-gray-500 text-xs mb-3 leading-relaxed">{item.descripcion}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <div className="text-[10px] text-gray-400 mb-0.5">Precio</div>
                      <div className="text-xl font-bold text-emerald-600">{fmt(item.precio_venta)}</div>
                    </div>
                    <a
                      href="https://wa.me/+549TUNUMERO?text=Hola!%20Vi%20el%20catálogo%20de%20Jer%20Abyte%20y%20me%20interesa%20la%20PC:%20"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      Consultar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#0f2850] text-center py-6 mt-12">
        <p className="text-blue-200 text-xs px-4">
          {`Jer Abyte — La PC que cumple con tus exigencias diarias, vas a tener nuestra confianza y lealtad ante cualquier dificultad.`}
        </p>
        <p className="text-blue-300 text-xs mt-1">Garantía de mano de obra: 6 meses</p>
      </div>
    </div>
  )
}
