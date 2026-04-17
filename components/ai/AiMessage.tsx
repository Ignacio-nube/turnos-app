import { Message } from 'ai'
import { AppointmentResultCard } from './AppointmentResultCard'
import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'

interface AppointmentResult {
  id: string
  client_name: string
  client_email: string
  client_phone?: string | null
  start_time: string
  end_time: string
  status: string | null
  notes?: string | null
  professionals?: { name: string; specialty?: string | null } | null
  services?: { name: string; color?: string | null; duration_minutes?: number } | null
}

interface ToolInvocationResult {
  appointments?: AppointmentResult[]
  total?: number
}

interface ToolInvocation {
  toolName: string
  state: string
  result?: ToolInvocationResult
}

type MessageWithToolInvocations = Message & {
  toolInvocations?: ToolInvocation[]
}

interface AiMessageProps {
  message: Message
}

export function AiMessage({ message }: AiMessageProps) {
  const isUser = message.role === 'user'
  const msgWithTools = message as MessageWithToolInvocations

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn('max-w-[80%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        {message.content && (
          <div className={cn(
            'px-4 py-2.5 rounded-2xl text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-none'
              : 'bg-muted rounded-tl-none'
          )}>
            {message.content}
          </div>
        )}

        {/* Renderizar resultados de tool calls */}
        {msgWithTools.toolInvocations?.map((inv: ToolInvocation, i: number) => {
          if (inv.toolName === 'searchAppointments' && inv.state === 'result' && inv.result?.appointments) {
            return (
              <div key={i} className="w-full space-y-1">
                <p className="text-xs text-muted-foreground px-1">
                  {inv.result.total} turno{inv.result.total !== 1 ? 's' : ''} encontrado{inv.result.total !== 1 ? 's' : ''}
                </p>
                {inv.result.appointments.map((apt: AppointmentResult) => (
                  <AppointmentResultCard key={apt.id} appointment={apt} />
                ))}
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
