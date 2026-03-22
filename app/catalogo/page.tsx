"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Cpu, HardDrive, Zap, Monitor, Wifi, ThumbsUp } from "lucide-react"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

const CONSEJOS = [
  { icono: Cpu, titulo: "Elegí bien tu procesador", texto: "Para gaming, priorizá frecuencia de reloj. Para edición y multitarea, priorizá más núcleos. Un Ryzen 5 o i5 es el punto dulce para la mayoría." },
  { icono: HardDrive, titulo: "SSD NVMe vs SATA", texto: "Un SSD NVMe es hasta 5x más rápido que uno SATA. La diferencia se nota al arrancar el sistema y abrir programas pesados. Vale la inversión." },
  { icono: Zap, titulo: "No escatimes en la fuente", texto: "Una PSU de calidad protege todos tus componentes. Calculá el consumo total y sumá un 20% de margen. Las marcas confiables son Corsair, EVGA y Seasonic." },
  { icono: Monitor, titulo: "RAM: velocidad y dual channel", texto: "Instalar 2 módulos de RAM en dual channel puede mejorar el rendimiento hasta un 15% comparado con un solo módulo. Siempre en pares." },
  { icono: Wifi, titulo: "Refrigeración: clave para la vida útil", texto: "Una buena refrigeración no solo mejora el rendimiento, extiende la vida útil del procesador. El cooler stock alcanza para uso básico, pero un aftermarket vale la pena." },
  { icono: ThumbsUp, titulo: "¿Gaming o trabajo?", texto: "Para gaming, la GPU es lo más importante. Para trabajo y diseño, invertí en RAM y CPU. Para uso mixto, equilibrá ambos. Jer Abyte te ayuda a elegir." },
]

const BANNERS = [
  { titulo: "Armadas con precisión", subtitulo: "Cada PC pasa por pruebas de estrés antes de la entrega", color: "from-blue-600 to-blue-800" },
  { titulo: "6 meses de garantía", subtitulo: "Garantía de mano de obra en todos nuestros equipos", color: "from-[#0f2850] to-blue-700" },
  { titulo: "Componentes originales", subtitulo: "Solo trabajamos con partes de primera calidad", color: "from-blue-700 to-indigo-800" },
]

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
  const [bannerIdx, setBannerIdx] = useState(0)
  const supabase = createClient()

  const consejoDia = CONSEJOS[new Date().getDay() % CONSEJOS.length]
  const ConsejoIcono = consejoDia.icono

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

    // Rotar banner cada 4 segundos
    const interval = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4000)
    return () => clearInterval(interval)
  }, [])

  const banner = BANNERS[bannerIdx]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f2850] to-[#185FA5] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/30">JA</div>
            <div>
              <h1 className="text-2xl font-bold">Jer Abyte</h1>
              <p className="text-blue-200 text-sm">La PC que cumple con tus exigencias diarias</p>
            </div>
          </div>

          {/* Banner rotativo */}
          <div className={`bg-gradient-to-r ${banner.color} rounded-2xl p-5 border border-white/20 transition-all duration-700`}>
            <div className="text-xl font-bold mb-1">{banner.titulo}</div>
            <div className="text-blue-200 text-sm">{banner.subtitulo}</div>
            {/* Indicadores */}
            <div className="flex gap-1.5 mt-4">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Consejo del día */}
        <div className="bg-white rounded-2xl border border-blue-100 p-5 mb-8 flex gap-4 items-start shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ConsejoIcono className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Consejo del día</div>
            <div className="font-semibold text-gray-900 text-sm mb-1">{consejoDia.titulo}</div>
            <div className="text-gray-500 text-sm leading-relaxed">{consejoDia.texto}</div>
          </div>
        </div>

        {/* Título sección */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">PCs disponibles</h2>
            <p className="text-gray-500 text-sm">Equipos armados, testeados y listos para entregar</p>
          </div>
          {!loading && <Badge className="bg-emerald-100 text-emerald-700 border-0">{catalogo.length} disponibles</Badge>}
        </div>

        {/* Grid de PCs */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando catálogo...</div>
        ) : catalogo.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-gray-400 text-lg mb-2">No hay PCs disponibles en este momento</div>
            <p className="text-gray-400 text-sm mb-4">Volvé pronto o contactanos para consultas</p>
            <a
              href="https://wa.me/54?text=Hola!%20Vi%20el%20cat%C3%A1logo%20de%20Jer%20Abyte%20y%20quer%C3%ADa%20consultar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Consultar por WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogo.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                {item.foto_url ? (
                  <div className="h-52 overflow-hidden">
                    <img src={item.foto_url} alt={item.nombre} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-52 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 leading-tight">{item.nombre}</h3>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] shrink-0">Disponible</Badge>
                  </div>
                  {item.descripcion && (
                    <p className="text-gray-500 text-sm mb-3 leading-relaxed">{item.descripcion}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-[10px] text-gray-400 mb-0.5">Precio</div>
                      <div className="text-2xl font-bold text-emerald-600">{fmt(item.precio_venta)}</div>
                    </div>
                    <a
                      href={`https://wa.me/54?text=Hola!%20Vi%20el%20cat%C3%A1logo%20de%20Jer%20Abyte%20y%20me%20interesa%20la%20PC:%20${encodeURIComponent(item.nombre)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
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
      <div className="bg-[#0f2850] text-center py-8 mt-12">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm">JA</div>
        </div>
        <p className="text-blue-200 text-sm px-4 max-w-lg mx-auto leading-relaxed">
          Jer Abyte — La PC que cumple con tus exigencias diarias, vas a tener nuestra confianza y lealtad ante cualquier dificultad.
        </p>
        <p className="text-blue-300 text-xs mt-2">Garantía de mano de obra: 6 meses</p>
      </div>
    </div>
  )
}
