import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function ReservaConfirmadaPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">¡Turno confirmado!</h1>
        <p className="text-muted-foreground">
          Tu turno fue reservado exitosamente. Recibirás la confirmación por email.
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" nativeButton={false} render={<Link href="/reservar" />}>
          Reservar otro turno
        </Button>
      </div>
    </div>
  )
}
