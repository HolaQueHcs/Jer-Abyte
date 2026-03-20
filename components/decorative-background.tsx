"use client"

export function DecorativeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {/* Manchas de color suaves - naranja, azul y violeta aguados */}
      <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-orange-200/25 via-amber-100/20 to-transparent blur-3xl" />
      <div className="absolute -top-20 right-0 h-[450px] w-[450px] rounded-full bg-gradient-to-bl from-blue-200/25 via-sky-100/20 to-transparent blur-3xl" />
      <div className="absolute top-1/3 left-1/2 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-violet-200/15 via-purple-100/10 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-orange-100/20 via-amber-50/15 to-transparent blur-3xl" />
      <div className="absolute -bottom-20 right-1/4 h-[450px] w-[450px] rounded-full bg-gradient-to-t from-blue-100/20 via-indigo-50/15 to-transparent blur-3xl" />
      <div className="absolute bottom-1/3 -right-20 h-[350px] w-[350px] rounded-full bg-gradient-to-l from-violet-100/15 via-purple-50/10 to-transparent blur-3xl" />
      
      {/* Patron de fondo tipo tapizado con elementos de hardware */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hardware-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            {/* CPU/Procesador */}
            <g transform="translate(10, 10)">
              <rect x="0" y="0" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" />
              <rect x="8" y="8" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1" rx="1" />
              {/* Pines del CPU */}
              <line x1="-4" y1="10" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
              <line x1="-4" y1="20" x2="0" y2="20" stroke="currentColor" strokeWidth="1" />
              <line x1="-4" y1="30" x2="0" y2="30" stroke="currentColor" strokeWidth="1" />
              <line x1="40" y1="10" x2="44" y2="10" stroke="currentColor" strokeWidth="1" />
              <line x1="40" y1="20" x2="44" y2="20" stroke="currentColor" strokeWidth="1" />
              <line x1="40" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="1" />
              <line x1="10" y1="-4" x2="10" y2="0" stroke="currentColor" strokeWidth="1" />
              <line x1="20" y1="-4" x2="20" y2="0" stroke="currentColor" strokeWidth="1" />
              <line x1="30" y1="-4" x2="30" y2="0" stroke="currentColor" strokeWidth="1" />
              <line x1="10" y1="40" x2="10" y2="44" stroke="currentColor" strokeWidth="1" />
              <line x1="20" y1="40" x2="20" y2="44" stroke="currentColor" strokeWidth="1" />
              <line x1="30" y1="40" x2="30" y2="44" stroke="currentColor" strokeWidth="1" />
            </g>
            
            {/* RAM */}
            <g transform="translate(120, 15)">
              <rect x="0" y="0" width="60" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" rx="1" />
              <rect x="4" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <rect x="14" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <rect x="24" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <rect x="34" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <rect x="44" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
              {/* Contactos dorados */}
              <line x1="5" y1="12" x2="5" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="10" y1="12" x2="10" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="15" y1="12" x2="15" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="20" y1="12" x2="20" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="25" y1="12" x2="25" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="30" y1="12" x2="30" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="35" y1="12" x2="35" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="40" y1="12" x2="40" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="45" y1="12" x2="45" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="50" y1="12" x2="50" y2="16" stroke="currentColor" strokeWidth="0.8" />
              <line x1="55" y1="12" x2="55" y2="16" stroke="currentColor" strokeWidth="0.8" />
            </g>
            
            {/* GPU/Tarjeta grafica */}
            <g transform="translate(70, 70)">
              <rect x="0" y="0" width="80" height="35" fill="none" stroke="currentColor" strokeWidth="1.2" rx="2" />
              {/* Ventiladores */}
              <circle cx="22" cy="17" r="12" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="22" cy="17" r="4" fill="none" stroke="currentColor" strokeWidth="0.6" />
              <circle cx="58" cy="17" r="12" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="58" cy="17" r="4" fill="none" stroke="currentColor" strokeWidth="0.6" />
              {/* Aspas */}
              <line x1="22" y1="5" x2="22" y2="13" stroke="currentColor" strokeWidth="0.8" />
              <line x1="10" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="0.8" />
              <line x1="22" y1="21" x2="22" y2="29" stroke="currentColor" strokeWidth="0.8" />
              <line x1="26" y1="17" x2="34" y2="17" stroke="currentColor" strokeWidth="0.8" />
              <line x1="58" y1="5" x2="58" y2="13" stroke="currentColor" strokeWidth="0.8" />
              <line x1="46" y1="17" x2="54" y2="17" stroke="currentColor" strokeWidth="0.8" />
              <line x1="58" y1="21" x2="58" y2="29" stroke="currentColor" strokeWidth="0.8" />
              <line x1="62" y1="17" x2="70" y2="17" stroke="currentColor" strokeWidth="0.8" />
              {/* Conectores */}
              <rect x="0" y="35" width="70" height="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </g>
            
            {/* SSD */}
            <g transform="translate(10, 80)">
              <rect x="0" y="0" width="45" height="28" fill="none" stroke="currentColor" strokeWidth="1.2" rx="2" />
              <rect x="5" y="5" width="20" height="18" fill="none" stroke="currentColor" strokeWidth="0.8" rx="1" />
              <text x="8" y="17" fontSize="6" fill="currentColor" fontFamily="monospace">SSD</text>
              <rect x="30" y="8" width="10" height="12" fill="none" stroke="currentColor" strokeWidth="0.6" rx="0.5" />
            </g>
            
            {/* Motherboard esquema */}
            <g transform="translate(10, 130)">
              <rect x="0" y="0" width="55" height="50" fill="none" stroke="currentColor" strokeWidth="1" rx="1" />
              {/* Socket CPU */}
              <rect x="5" y="5" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="0.8" />
              {/* Slots RAM */}
              <rect x="28" y="5" width="22" height="3" fill="none" stroke="currentColor" strokeWidth="0.6" />
              <rect x="28" y="10" width="22" height="3" fill="none" stroke="currentColor" strokeWidth="0.6" />
              {/* Chipset */}
              <rect x="5" y="30" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="0.6" />
              {/* PCIe slot */}
              <rect x="22" y="35" width="28" height="5" fill="none" stroke="currentColor" strokeWidth="0.6" />
              {/* SATA */}
              <rect x="22" y="25" width="8" height="6" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <rect x="32" y="25" width="8" height="6" fill="none" stroke="currentColor" strokeWidth="0.5" />
              {/* Circuitos */}
              <line x1="23" y1="5" x2="23" y2="18" stroke="currentColor" strokeWidth="0.4" />
              <line x1="5" y1="25" x2="50" y2="25" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,2" />
            </g>
            
            {/* Ventilador */}
            <g transform="translate(155, 55)">
              <rect x="0" y="0" width="35" height="35" fill="none" stroke="currentColor" strokeWidth="1" rx="2" />
              <circle cx="17.5" cy="17.5" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="17.5" cy="17.5" r="5" fill="none" stroke="currentColor" strokeWidth="0.6" />
              {/* Aspas del ventilador */}
              <path d="M17.5 3.5 Q 22 10, 17.5 12.5 Q 13 10, 17.5 3.5" fill="none" stroke="currentColor" strokeWidth="0.6" />
              <path d="M31.5 17.5 Q 25 22, 22.5 17.5 Q 25 13, 31.5 17.5" fill="none" stroke="currentColor" strokeWidth="0.6" />
              <path d="M17.5 31.5 Q 13 25, 17.5 22.5 Q 22 25, 17.5 31.5" fill="none" stroke="currentColor" strokeWidth="0.6" />
              <path d="M3.5 17.5 Q 10 13, 12.5 17.5 Q 10 22, 3.5 17.5" fill="none" stroke="currentColor" strokeWidth="0.6" />
              {/* Tornillos esquinas */}
              <circle cx="4" cy="4" r="2" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="31" cy="4" r="2" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="4" cy="31" r="2" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="31" cy="31" r="2" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </g>
            
            {/* Cable/Conector */}
            <g transform="translate(80, 130)">
              <rect x="0" y="0" width="25" height="15" fill="none" stroke="currentColor" strokeWidth="1" rx="2" />
              <rect x="3" y="3" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <rect x="10" y="3" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <rect x="17" y="3" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <rect x="3" y="9" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <rect x="10" y="9" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <rect x="17" y="9" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.5" />
              {/* Cables */}
              <path d="M12.5 15 C 12.5 25, 8 30, 8 40" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <path d="M12.5 15 C 12.5 25, 17 30, 17 40" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </g>
            
            {/* Fuente de poder icono */}
            <g transform="translate(120, 130)">
              <rect x="0" y="0" width="40" height="30" fill="none" stroke="currentColor" strokeWidth="1" rx="2" />
              <circle cx="20" cy="15" r="10" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="20" cy="15" r="3" fill="none" stroke="currentColor" strokeWidth="0.5" />
              {/* Rejilla ventilacion */}
              <line x1="10" y1="15" x2="30" y2="15" stroke="currentColor" strokeWidth="0.4" />
              <line x1="20" y1="5" x2="20" y2="25" stroke="currentColor" strokeWidth="0.4" />
              <line x1="13" y1="8" x2="27" y2="22" stroke="currentColor" strokeWidth="0.3" />
              <line x1="27" y1="8" x2="13" y2="22" stroke="currentColor" strokeWidth="0.3" />
              {/* Switch */}
              <rect x="35" y="10" width="3" height="10" fill="none" stroke="currentColor" strokeWidth="0.6" />
            </g>
            
            {/* Disipador/Cooler */}
            <g transform="translate(170, 110)">
              {/* Aletas del disipador */}
              <rect x="0" y="0" width="25" height="40" fill="none" stroke="currentColor" strokeWidth="0.8" rx="1" />
              <line x1="0" y1="5" x2="25" y2="5" stroke="currentColor" strokeWidth="0.5" />
              <line x1="0" y1="10" x2="25" y2="10" stroke="currentColor" strokeWidth="0.5" />
              <line x1="0" y1="15" x2="25" y2="15" stroke="currentColor" strokeWidth="0.5" />
              <line x1="0" y1="20" x2="25" y2="20" stroke="currentColor" strokeWidth="0.5" />
              <line x1="0" y1="25" x2="25" y2="25" stroke="currentColor" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="25" y2="30" stroke="currentColor" strokeWidth="0.5" />
              <line x1="0" y1="35" x2="25" y2="35" stroke="currentColor" strokeWidth="0.5" />
              {/* Tubos de calor */}
              <ellipse cx="7" cy="20" rx="2" ry="18" fill="none" stroke="currentColor" strokeWidth="0.4" />
              <ellipse cx="18" cy="20" rx="2" ry="18" fill="none" stroke="currentColor" strokeWidth="0.4" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hardware-pattern)" />
      </svg>
      
      {/* Elementos decorativos flotantes sutiles */}
      <div className="absolute top-20 right-[15%] opacity-[0.04]">
        <svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="36" height="36" stroke="currentColor" strokeWidth="1.5" rx="3" />
          <rect x="8" y="8" width="24" height="24" stroke="currentColor" strokeWidth="1" rx="2" />
          <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      </div>
      
      <div className="absolute bottom-32 left-[10%] opacity-[0.04] rotate-12">
        <svg width="80" height="30" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="78" height="18" stroke="currentColor" strokeWidth="1.2" rx="2" />
          <rect x="6" y="4" width="12" height="12" stroke="currentColor" strokeWidth="0.8" rx="1" />
          <rect x="22" y="4" width="12" height="12" stroke="currentColor" strokeWidth="0.8" rx="1" />
          <rect x="38" y="4" width="12" height="12" stroke="currentColor" strokeWidth="0.8" rx="1" />
          <rect x="54" y="4" width="12" height="12" stroke="currentColor" strokeWidth="0.8" rx="1" />
        </svg>
      </div>
      
      <div className="absolute top-[40%] left-[5%] opacity-[0.03] -rotate-6">
        <svg width="50" height="50" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="33" height="33" stroke="currentColor" strokeWidth="1" rx="2" />
          <circle cx="17.5" cy="17.5" r="13" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="17.5" cy="17.5" r="4" stroke="currentColor" strokeWidth="0.6" />
        </svg>
      </div>
      
      <div className="absolute bottom-[20%] right-[8%] opacity-[0.04] rotate-6">
        <svg width="70" height="45" viewBox="0 0 70 35" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="68" height="33" stroke="currentColor" strokeWidth="1" rx="2" />
          <circle cx="20" cy="17" r="10" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="50" cy="17" r="10" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  )
}
