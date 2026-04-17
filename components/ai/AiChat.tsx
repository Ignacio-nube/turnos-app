'use client'

import { useChat } from 'ai/react'
import { Message } from 'ai'
import { useRef, useEffect } from 'react'
import { AiMessage } from './AiMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Bot } from 'lucide-react'

const QUICK_QUESTIONS = [
  'Turnos de hoy',
  'Esta semana',
  'Turnos pendientes',
  'Turnos cancelados',
]

export function AiChat() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/ai-chat',
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleQuickQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Asistente de Turnos</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm">
              Preguntame sobre tus turnos en lenguaje natural. Puedo buscar, filtrar y actualizar información.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-3 py-1.5 rounded-full border text-sm hover:bg-accent transition-colors"
                  aria-label={`Hacer pregunta: ${q}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((message: Message) => (
              <AiMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="space-y-2 flex-1 max-w-[60%]">
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-4 w-1/2 rounded-full" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="pt-4 border-t">
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                className="px-3 py-1 rounded-full border text-xs hover:bg-accent transition-colors"
                aria-label={`Sugerencia: ${q}`}
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Preguntame sobre tus turnos..."
            disabled={isLoading}
            className="flex-1"
            aria-label="Mensaje para el asistente de IA"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
