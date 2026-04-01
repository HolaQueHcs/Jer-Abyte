"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import {
  ImageIcon, Cpu, HardDrive, Zap, Monitor, Wifi, ThumbsUp, Shield,
  X, ShoppingCart, Wrench, MessageCircle
} from "lucide-react"

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

const OPCIONES_RAM = [
  { label: "8 GB (base)", precio: 0 },
  { label: "16 GB (+$15.000)", precio: 15000 },
  { label: "32 GB (+$35.000)", precio: 35000 },
]

const OPCIONES_DISCO = [
  { label: "SSD 240 GB (base)", precio: 0 },
  { label: "SSD 480 GB (+$10.000)", precio: 10000 },
  { label: "SSD 1 TB (+$22.000)", precio: 22000 },
  { label: "SSD 1 TB + HDD 1 TB (+$38.000)", precio: 38000 },
]

const OPCIONES_GABINETE = [
  { label: "Gabinete estándar (base)", precio: 0 },
  { label: "Gabinete gamer RGB (+$8.000)", precio: 8000 },
  { label: "Gabinete full tower (+$14.000)", precio: 14000 },
]

const CONSEJOS = [
  { icono: Cpu, titulo: "¿Por qué elegir AMD Ryzen?", texto: "Los procesadores Ryzen ofrecen más núcleos por el mismo precio que la competencia. Ideal para gaming, multitarea y streaming simultáneo. En Jer Abyte trabajamos exclusivamente con Ryzen para garantizar el mejor rendimiento por peso." },
  { icono: Monitor, titulo: "Ryzen 3 vs Ryzen 5: ¿Cuál te conviene?", texto: "El Ryzen 3 es perfecto para uso diario, juegos en 1080p y trabajo de oficina. El Ryzen 5 da un salto enorme: gaming fluido, edición de video y streaming sin cuellos de botella. Para gaming serio, siempre recomendamos Ryzen 5." },
  { icono: HardDrive, titulo: "SSD + Ryzen = velocidad real", texto: "Un Ryzen con SSD NVMe arranca en segundos y carga juegos hasta 5 veces más rápido que con disco rígido. Todas las PCs de Jer Abyte incluyen SSD como mínimo para que notes la diferencia desde el primer día." },
  { icono: Zap, titulo: "Ryzen con gráficos integrados", texto: "Los modelos Ryzen con sufijo G (como el 3200G o 5600G) incluyen gráficos integrados Vega. Perfectos para empezar sin GPU dedicada y agregar una placa de video después cuando el presupuesto lo permita." },
  { icono: Wifi, titulo: "Placa madre compatible con Ryzen", texto: "No todas las motherboards son iguales. Cada generación Ryzen tiene su socket. En Jer Abyte elegimos la placa correcta para tu procesador para que no tengas problemas de compatibilidad ni de actualización futura." },
  { icono: Shield, titulo: "6 meses de garantía de mano de obra", texto: "Cada PC que armamos viene con 6 meses de garantía de mano de obra. Si algo falla por el armado, lo solucionamos sin costo. Tu tranquilidad es parte del precio." },
  { icono: ThumbsUp, titulo: "¿Gaming o trabajo con Ryzen?", texto: "Un Ryzen 5 con 16GB de RAM hace las dos cosas sin problemas. Para gaming puro el Ryzen 5 5600G o superior es ideal. Para trabajo pesado como edición de video o diseño 3D, un Ryzen 7 marca la diferencia." },
]

const BANNERS = [
  { titulo: "Armadas con precisión y dedicación", subtitulo: "Cada PC pasa por pruebas de estrés antes de la entrega. Tu equipo llega listo para usar.", color: "from-blue-600 to-blue-800" },
  { titulo: "6 meses de garantía de mano de obra", subtitulo: "Si algo falla por el armado, lo resolvemos sin costo. Esa es nuestra palabra.", color: "from-[#0f2850] to-blue-700" },
  { titulo: "Solo componentes originales", subtitulo: "Trabajamos únicamente con partes de primera calidad. Sin imitaciones ni componentes dudosos.", color: "from-blue-700 to-indigo-800" },
  { titulo: "100% AMD Ryzen", subtitulo: "Elegimos Ryzen porque ofrece el mejor rendimiento por peso. Potencia real a precio justo.", color: "from-indigo-700 to-blue-900" },
  { titulo: "Confianza y lealtad ante todo", subtitulo: "La PC que cumple con tus exigencias diarias. Estamos para vos antes, durante y después de la compra.", color: "from-blue-800 to-[#0f2850]" },
  { titulo: "Entrega rápida en Córdoba", subtitulo: "PC armada, testeada y lista para usar. Coordinamos la entrega a tu comodidad.", color: "from-blue-600 to-indigo-700" },
]

interface CatalogoItem {
  id: string
  nombre: string
  descripcion: string
  precio_venta: number
  estado: string
  foto_url: string
}

function ModalPersonalizar({ item, onClose }: { item: CatalogoItem; onClose: () => void }) {
  const [ram, setRam] = useState(0)
  const [disco, setDisco] = useState(0)
  const [gabinete, setGabinete] = useState(0)
  const [nombre, setNombre] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [paso, setPaso] = useState<"config" | "contacto">("config")

  const extra = OPCIONES_RAM[ram].precio + OPCIONES_DISCO[disco].precio + OPCIONES_GABINETE[gabinete].precio
  const total = item.precio_venta + extra

  const handleWhatsApp = () => {
    const lineas = [
      "🖥️ *Pedido desde el catálogo Jer Abyte*",
      "",
      `PC: *${item.nombre}*`,
      `RAM: ${OPCIONES_RAM[ram].label}`,
      `Disco: ${OPCIONES_DISCO[disco].label}`,
      `Gabinete: ${OPCIONES_GABINETE[gabinete].label}`,
      "",
      `💰 *Total estimado: ${fmt(total)}*`,
      "",
      nombre ? `👤 Nombre: ${nombre}` : "",
      mensaje ? `📝 Nota: ${mensaje}` : "",
    ].filter(Boolean).join("\n")
    window.open(`https://wa.me/54?text=${encodeURIComponent(lineas)}`, "_blank")
  }

  const handleConsultar = () => {
    const texto = `Hola! Vi el catálogo de Jer Abyte y me interesa la PC: *${item.nombre}*. ¿Podrían darme más info?`
    window.open(`https://wa.me/54?text=${encodeURIComponent(texto)}`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-gradient-to-r from-[#0f2850] to-[#185FA5] text-white px-5 py-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-300 mb-0.5 font-medium uppercase tracking-wide">Personalizá tu PC</p>
            <h3 className="font-bold text-base leading-snug">{item.nombre}</h3>
          </div>
          <button onClick={onClose} className="ml-3 mt-0.5 text-white/60 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button onClick={() => setPaso("config")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${paso === "config" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
            <span className="flex items-center justify-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Configurar</span>
          </button>
          <button onClick={() => setPaso("contacto")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${paso === "contacto" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
            <span className="flex items-center justify-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Pedir</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {paso === "config" ? (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Memoria RAM</label>
                <div className="grid grid-cols-1 gap-2">
                  {OPCIONES_RAM.map((op, i) => (
                    <button key={i} onClick={() => setRam(i)}
                      className={`text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${ram === i ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Almacenamiento</label>
                <div className="grid grid-cols-1 gap-2">
                  {OPCIONES_DISCO.map((op, i) => (
                    <button key={i} onClick={() => setDisco(i)}
                      className={`text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${disco === i ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Gabinete</label>
                <div className="grid grid-cols-1 gap-2">
                  {OPCIONES_GABINETE.map((op, i) => (
                    <button key={i} onClick={() => setGabinete(i)}
                      className={`text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${gabinete === i ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                <div className="flex justify-between text-gray-600"><span>PC base</span><span>{fmt(item.precio_venta)}</span></div>
                {OPCIONES_RAM[ram].precio > 0 && <div className="flex justify-between text-gray-500 text-xs"><span>RAM upgrade</span><span>+{fmt(OPCIONES_RAM[ram].precio)}</span></div>}
                {OPCIONES_DISCO[disco].precio > 0 && <div className="flex justify-between text-gray-500 text-xs"><span>Disco upgrade</span><span>+{fmt(OPCIONES_DISCO[disco].precio)}</span></div>}
                {OPCIONES_GABINETE[gabinete].precio > 0 && <div className="flex justify-between text-gray-500 text-xs"><span>Gabinete upgrade</span><span>+{fmt(OPCIONES_GABINETE[gabinete].precio)}</span></div>}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total estimado</span><span className="text-emerald-600">{fmt(total)}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1 bg-blue-50 rounded-xl p-3">
                <p>🧠 {OPCIONES_RAM[ram].label}</p>
                <p>💾 {OPCIONES_DISCO[disco].label}</p>
                <p>🖥 {OPCIONES_GABINETE[gabinete].label}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Tu nombre (opcional)</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Sebastián"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nota o consulta (opcional)</label>
                <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Ej: ¿Incluye monitor? ¿Hacen envío?"
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-gray-400">Total estimado</span>
            <span className="text-xl font-bold text-emerald-600">{fmt(total)}</span>
          </div>
          {paso === "config" ? (
            <button onClick={() => setPaso("contacto")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
              <ShoppingCart className="h-4 w-4" /> Continuar al pedido
            </button>
          ) : (
            <div className="space-y-2">
              <button onClick={handleWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                <MessageCircle className="h-4 w-4" /> Enviar pedido por WhatsApp
              </button>
              <button onClick={handleConsultar}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors">
                Solo consultar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CatalogoPublico() {
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [bannerIdx, setBannerIdx] = useState(0)
  const [modalItem, setModalItem] = useState<CatalogoItem | null>(null)
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
    const interval = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4000)
    return () => clearInterval(interval)
  }, [])

  const banner = BANNERS[bannerIdx]

  return (
    <div className="min-h-screen bg-gray-50">
      {modalItem && <ModalPersonalizar item={modalItem} onClose={() => setModalItem(null)} />}

      <div className="bg-gradient-to-r from-[#0f2850] to-[#185FA5] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/30">JA</div>
            <div>
              <h1 className="text-2xl font-bold">Jer Abyte</h1>
              <p className="text-blue-200 text-sm">La PC que cumple con tus exigencias diarias</p>
            </div>
          </div>
          <div className={`bg-gradient-to-r ${banner.color} rounded-2xl p-5 border border-white/20 transition-all duration-700`}>
            <div className="text-xl font-bold mb-1">{banner.titulo}</div>
            <div className="text-blue-200 text-sm leading-relaxed">{banner.subtitulo}</div>
            <div className="flex gap-1.5 mt-4">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
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

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">PCs disponibles</h2>
            <p className="text-gray-500 text-sm">Equipos Ryzen armados, testeados y listos para entregar</p>
          </div>
          {!loading && <Badge className="bg-emerald-100 text-emerald-700 border-0">{catalogo.length} disponibles</Badge>}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando catálogo...</div>
        ) : catalogo.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-gray-400 text-lg mb-2">No hay PCs disponibles en este momento</div>
            <p className="text-gray-400 text-sm mb-4">Volvé pronto o contactanos para consultas</p>
            <a href="https://wa.me/54?text=Hola!%20Vi%20el%20cat%C3%A1logo%20de%20Jer%20Abyte%20y%20quer%C3%ADa%20consultar"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Consultar por WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogo.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                {item.foto_url ? (
                  <div className="h-52 overflow-hidden">
                    <img src={item.foto_url} alt={item.nombre} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-52 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 leading-tight">{item.nombre}</h3>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] shrink-0">Disponible</Badge>
                  </div>
                  {item.descripcion && <p className="text-gray-500 text-sm mb-3 leading-relaxed">{item.descripcion}</p>}
                  <div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Precio base</div>
                        <div className="text-2xl font-bold text-emerald-600">{fmt(item.precio_venta)}</div>
                      </div>
                      <a href={`https://wa.me/54?text=${encodeURIComponent(`Hola! Vi el catálogo de Jer Abyte y me interesa la PC: ${item.nombre}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                        Consultar
                      </a>
                    </div>
                    <button onClick={() => setModalItem(item)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                      <Wrench className="h-3.5 w-3.5" /> Personalizar y pedir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#0f2850] text-center py-8 mt-12">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm">JA</div>
        </div>
        <p className="text-blue-200 text-sm px-4 max-w-lg mx-auto leading-relaxed">
          Jer Abyte — La PC que cumple con tus exigencias diarias, vas a tener nuestra confianza y lealtad ante cualquier dificultad.
        </p>
        <p className="text-blue-300 text-xs mt-2">Garantía de mano de obra: 6 meses · 100% AMD Ryzen</p>
      </div>
    </div>
  )
}
