import { AiChat } from '@/components/ai/AiChat'

export default function AiAsistentePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Asistente IA</h2>
        <p className="text-muted-foreground">
          Consultá información sobre tus turnos en lenguaje natural
        </p>
      </div>
      <AiChat />
    </div>
  )
}
