import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 via-background to-orange-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-orange-400 text-white shadow-lg font-bold text-lg">
              JA
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Jer Abyte
            </h1>
          </div>

          <Card className="border-blue-100/50 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-xl text-foreground">Revisa tu email</CardTitle>
              <CardDescription>
                Te enviamos un enlace de confirmacion a tu correo electronico
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Hace clic en el enlace del email para activar tu cuenta y poder ingresar.
              </p>
              <Link
                href="/auth/login"
                className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-800"
              >
                Volver al login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
