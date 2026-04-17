import { z } from 'zod'

export const appointmentSchema = z.object({
  professional_id: z.string().uuid({ message: "Seleccioná un profesional" }),
  service_id: z.string().uuid({ message: "Seleccioná un servicio" }),
  client_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  client_email: z.string().email("Email inválido"),
  client_phone: z.string().optional(),
  start_time: z.string().min(1, "Seleccioná un horario"),
  notes: z.string().optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>
