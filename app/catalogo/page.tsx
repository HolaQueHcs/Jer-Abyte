"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Cpu, Package, Zap, ShieldCheck, MessageCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Producto {
  id: string
  nombre: string
  categoria: string
  cantidad: number
  precio: number
  precio_venta: number
  nota: string
  foto_url: string
  tipo: 'HARDWARE' | 'SERVICIO'
}

export default function CatalogoPublico() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("stock")
      .select("*")
      .order("precio_venta", { ascending: false })

    if (!error && data) {
      setProductos(data.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        cantidad: p.cantidad,
        precio: parseFloat(p.precio),
        precio_venta: parseFloat(p.precio_venta),
        nota: p.nota || "",
        foto_url: p.foto_url || "",
        tipo: p.tipo || 'HARDWARE'
      })))
    }
    setLoading(false)
  }

  const hardware = productos.filter(p => p.tipo === 'HARDWARE' && p.cantidad > 0)
  const servicios = productos.filter(p => p.tipo === 'SERVICIO')

  const formatoPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio)
  }

  const consultarWhatsApp = (producto: Producto) => {
    const mensaje = producto.tipo === 'SERVICIO' 
      ? `Hola! Me interesa el servicio: ${producto.nombre}`
      : `Hola! Me interesa esta PC: ${producto.nombre}`
    const url = `https://wa.me/5493513054502?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-orange-400 text-white shadow-lg font-bold text-sm">
                JA
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                  Jer Abyte
                </h1>
                <p className="text-xs text-muted-foreground">La PC que cumple con tus exigencias diarias</p>
              </div>
            </div>
            <Button 
              onClick={() => window.open('https://wa.me/5493513054502', '_blank')}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contactar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 bg-gradient-to-r from-blue-600 via-blue-700 to-orange-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            La PC que cumple con tus exigencias diarias
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
            Armadas con precisión y dedicación
          </p>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-medium">Cada PC pasa por pruebas de estrés antes de la entrega. Tu equipo llega listo para usar.</span>
          </div>
        </div>
      </section>

      {/* Garantía destacada */}
      <section className="py-8 bg-gradient-to-r from-orange-400 to-orange-500 border-y border-orange-600">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-white">
            <Zap className="h-6 w-6" />
            <h3 className="text-lg md:text-xl font-bold">Consejo del día</h3>
          </div>
          <p className="text-center text-white/90 mt-2 text-base md:text-lg font-medium">
            6 meses de garantía de mano de obra
          </p>
          <p className="text-center text-white/80 text-sm max-w-3xl mx-auto mt-2">
            Cada PC que armamos viene con 6 meses de garantía de mano de obra. Si algo falla por el armado, lo solucionamos sin costo. Tu tranquilidad es parte del precio.
          </p>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="hardware" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12">
            <TabsTrigger value="hardware" className="text-base font-semibold">
              <Cpu className="h-4 w-4 mr-2" />
              Equipos Gamer
            </TabsTrigger>
            <TabsTrigger value="servicios" className="text-base font-semibold">
              <Package className="h-4 w-4 mr-2" />
              Servicios Técnicos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Equipos Gamer (HARDWARE) */}
          <TabsContent value="hardware">
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">PCs disponibles</h3>
              <p className="text-muted-foreground">Equipos Ryzen armados, testeados y listos para entregar</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : hardware.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No hay equipos disponibles en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hardware.map(producto => (
                  <Card key={producto.id} className="overflow-hidden hover:shadow-xl transition-all border-2 hover:border-blue-200">
                    {producto.foto_url && (
                      <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200">
                        <img 
                          src={producto.foto_url} 
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-3 right-3 bg-blue-600">
                          {producto.categoria}
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle className="text-xl">{producto.nombre}</CardTitle>
                      <CardDescription className="text-base line-clamp-2">
                        {producto.nota}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-blue-600">
                          {formatoPrecio(producto.precio_venta)}
                        </span>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-green-800 leading-relaxed">
                            <p className="font-semibold mb-1">Garantía JerAbyte: 6 meses</p>
                            <p className="text-green-700">La apertura o modificación del equipo fuera de nuestra mano de obra anula la garantía automáticamente.</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>Envíos a todo el país</span>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button 
                        onClick={() => consultarWhatsApp(producto)}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        size="lg"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Consultar por WhatsApp
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Servicios Técnicos (SERVICIO) */}
          <TabsContent value="servicios">
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Servicios disponibles</h3>
              <p className="text-muted-foreground">Soluciones técnicas profesionales</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : servicios.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No hay servicios disponibles en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {servicios.map(producto => (
                  <Card key={producto.id} className="overflow-hidden hover:shadow-xl transition-all border-2 hover:border-orange-200">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl flex-1">{producto.nombre}</CardTitle>
                        <Badge variant="outline" className="bg-white">Servicio</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-6">
                      <div className="text-sm text-slate-700 leading-relaxed">
                        {producto.nota}
                      </div>

                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-3xl font-bold text-orange-600">
                          {formatoPrecio(producto.precio_venta)}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button 
                        onClick={() => consultarWhatsApp(producto)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                        size="lg"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Consultar disponibilidad
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-orange-400 font-bold text-sm">
              JA
            </div>
            <p className="text-lg font-bold">Jer Abyte</p>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            La PC que cumple con tus exigencias diarias, vas a tener nuestra confianza y lealtad ante cualquier dificultad.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
            <span>Garantía de mano de obra: 6 meses</span>
            <span>·</span>
            <span>100% AMD Ryzen</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
