'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <svg className="h-16 w-16 text-destructive/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
        Ocurrió un error inesperado. Por favor intentá de nuevo.
      </p>
      <Button onClick={reset} aria-label="Intentar de nuevo">
        Intentar de nuevo
      </Button>
    </div>
  )
}
