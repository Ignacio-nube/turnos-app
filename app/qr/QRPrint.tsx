'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface QRPrintProps {
  url: string
}

export function QRPrint({ url }: QRPrintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(() => setReady(true))
  }, [url])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      {/* Printable area */}
      <div
        id="print-area"
        className="flex flex-col items-center gap-6 border-2 border-dashed border-gray-300 rounded-2xl p-10 max-w-sm w-full"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Sacá tu turno</h1>
          <p className="text-gray-500 text-sm">Escaneá el código QR con tu celular</p>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <canvas ref={canvasRef} />
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-gray-400 break-all">{url}</p>
        </div>

        <div className="w-full border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400">
            Reservá de forma rápida y sencilla
          </p>
        </div>
      </div>

      {/* Print button — hidden when printing */}
      <div className="mt-6 print:hidden">
        <Button
          onClick={() => window.print()}
          className="gap-2"
          disabled={!ready}
        >
          <Printer className="h-4 w-4" />
          Imprimir / Guardar PDF
        </Button>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 2px dashed #ccc !important;
          }
        }
      `}</style>
    </div>
  )
}
