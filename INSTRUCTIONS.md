# Prompt para Claude Code — App de agendamiento de turnos

---

## ROL Y CONTEXTO

Eres un desarrollador senior full-stack experto en Next.js 15, TypeScript, shadcn/ui y Supabase. Tu tarea es construir una aplicación web completa de agendamiento de turnos desde cero. La app es para negocios que necesitan gestionar citas: puede ser una clínica, barbería, consultorio, spa, o cualquier servicio con horarios.

**Stack obligatorio:**
- Framework: Next.js 15 (App Router) + TypeScript estricto
- UI: shadcn/ui + Tailwind CSS v4
- Base de datos: Supabase (usa el MCP de Supabase disponible para crear tablas, RLS policies y funciones)
- Componentes: usa el MCP de shadcn para instalar todos los componentes necesarios con `npx shadcn@latest add`
- Calendario: `@schedule-x/react` + `@schedule-x/theme-shadcn`
- Fechas: `date-fns` v4 + `@date-fns/tz`
- Forms: `react-hook-form` + `zod`
- AI: OpenAI API vía `ai` (Vercel AI SDK) — la API key ya está disponible en `OPENAI_API_KEY`
- Emails: `react-email` + `resend`

**Idioma:** toda la UI, mensajes de error, labels y comentarios en código en **español**.

---

## HERRAMIENTAS DISPONIBLES (MCPs)

### MCP de shadcn
- Úsalo para instalar componentes con el comando correcto según la versión actual
- Instala todos los componentes que necesites: Button, Calendar, Card, Dialog, Form, Input, Label, Select, Sheet, Tabs, Badge, Avatar, Separator, Popover, Command, Combobox, Toast, Skeleton, Table, DropdownMenu, NavigationMenu, ScrollArea, Textarea

### MCP de Supabase
- Úsalo para crear todas las tablas directamente en el proyecto Supabase
- Crear tablas, columnas, constraints, foreign keys
- Configurar RLS (Row Level Security) policies
- Crear funciones PostgreSQL y triggers
- Crear índices para performance
- **Siempre activa RLS en todas las tablas**

### OpenAI API
- Key disponible en variable de entorno `OPENAI_API_KEY`
- Modelo a usar: `gpt-4o-mini` para la sección de chat con la base de datos (balance costo/rendimiento)
- Usar `gpt-4o` solo si se necesita razonamiento complejo
- Implementar con Vercel AI SDK (`ai` package) usando `streamText` con tool calling

---

## SCHEMA DE BASE DE DATOS

Usa el MCP de Supabase para crear las siguientes tablas:

### Tabla `professionals`
```sql
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  specialty TEXT,
  avatar_url TEXT,
  bio TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla `services`
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2),
  color TEXT DEFAULT '#6366f1',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla `professional_services` (relación many-to-many)
```sql
CREATE TABLE professional_services (
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, service_id)
);
```

### Tabla `schedules` (horarios de atención por día)
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo, 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN DEFAULT true
);
```

### Tabla `appointments`
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla `blocked_times` (feriados, vacaciones, bloqueos manuales)
```sql
CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Después de crear las tablas, crea los siguientes índices:**
```sql
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_schedules_professional_id ON schedules(professional_id);
```

**Activa RLS en todas las tablas y crea policies permisivas para comenzar:**
```sql
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- Policy permisiva inicial (ajustar para producción con auth)
CREATE POLICY "Enable all for now" ON professionals FOR ALL USING (true);
CREATE POLICY "Enable all for now" ON services FOR ALL USING (true);
CREATE POLICY "Enable all for now" ON appointments FOR ALL USING (true);
CREATE POLICY "Enable all for now" ON schedules FOR ALL USING (true);
CREATE POLICY "Enable all for now" ON blocked_times FOR ALL USING (true);
```

**Crea también una función para obtener slots disponibles:**
```sql
CREATE OR REPLACE FUNCTION get_available_slots(
  p_professional_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER
)
RETURNS TABLE (slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ) AS $$
DECLARE
  day_schedule RECORD;
  slot_start TIMESTAMPTZ;
  slot_end TIMESTAMPTZ;
  current_slot TIMESTAMPTZ;
BEGIN
  FOR day_schedule IN
    SELECT start_time, end_time FROM schedules
    WHERE professional_id = p_professional_id
    AND day_of_week = EXTRACT(DOW FROM p_date)
    AND active = true
  LOOP
    current_slot := (p_date || ' ' || day_schedule.start_time)::TIMESTAMPTZ;
    WHILE current_slot + (p_duration_minutes || ' minutes')::INTERVAL <= (p_date || ' ' || day_schedule.end_time)::TIMESTAMPTZ LOOP
      slot_start := current_slot;
      slot_end := current_slot + (p_duration_minutes || ' minutes')::INTERVAL;
      
      -- Verificar que no haya turnos ni bloqueos que se superpongan
      IF NOT EXISTS (
        SELECT 1 FROM appointments
        WHERE professional_id = p_professional_id
        AND status NOT IN ('cancelled')
        AND start_time < slot_end
        AND end_time > slot_start
      ) AND NOT EXISTS (
        SELECT 1 FROM blocked_times
        WHERE professional_id = p_professional_id
        AND start_time < slot_end
        AND end_time > slot_start
      ) THEN
        RETURN NEXT;
      END IF;
      
      current_slot := current_slot + (p_duration_minutes || ' minutes')::INTERVAL;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## ARQUITECTURA DE RUTAS (Next.js App Router)

```
app/
├── layout.tsx                    # Layout raíz con providers
├── page.tsx                      # Redirect a /dashboard
├── (dashboard)/
│   ├── layout.tsx                # Sidebar + navbar principal
│   ├── dashboard/
│   │   └── page.tsx              # Vista general con métricas
│   ├── calendario/
│   │   └── page.tsx              # Calendario principal con Schedule-X
│   ├── turnos/
│   │   ├── page.tsx              # Lista de todos los turnos
│   │   ├── nuevo/
│   │   │   └── page.tsx          # Formulario de nuevo turno
│   │   └── [id]/
│   │       └── page.tsx          # Detalle/edición de turno
│   ├── profesionales/
│   │   └── page.tsx              # CRUD de profesionales
│   ├── servicios/
│   │   └── page.tsx              # CRUD de servicios
│   └── ai-asistente/
│       └── page.tsx              # Chat con IA sobre los turnos
├── api/
│   ├── appointments/
│   │   └── route.ts
│   ├── available-slots/
│   │   └── route.ts
│   ├── ai-chat/
│   │   └── route.ts              # Streaming endpoint para el chat IA
│   └── send-email/
│       └── route.ts
components/
├── ui/                           # Componentes shadcn (auto-generados)
├── calendar/
│   ├── AppCalendar.tsx           # Wrapper Schedule-X con theme shadcn
│   ├── CalendarToolbar.tsx
│   └── AppointmentEventCard.tsx  # Custom event card en el calendario
├── appointments/
│   ├── AppointmentForm.tsx       # Form principal con RHF + Zod
│   ├── AppointmentCard.tsx
│   ├── AppointmentStatusBadge.tsx
│   └── SlotPicker.tsx            # Selector de horarios disponibles
├── ai/
│   ├── AiChat.tsx                # Componente de chat principal
│   ├── AiMessage.tsx             # Burbuja de mensaje
│   └── AppointmentResultCard.tsx # Card para mostrar turnos desde la IA
├── dashboard/
│   ├── MetricCard.tsx
│   ├── UpcomingAppointments.tsx
│   └── TodaySchedule.tsx
├── layout/
│   ├── Sidebar.tsx
│   ├── Navbar.tsx
│   └── MobileNav.tsx
emails/
├── AppointmentConfirmation.tsx   # Template React Email de confirmación
└── AppointmentReminder.tsx       # Template React Email de recordatorio
lib/
├── supabase/
│   ├── client.ts                 # Supabase browser client
│   ├── server.ts                 # Supabase server client
│   └── types.ts                  # Tipos generados del schema
├── ai/
│   └── tools.ts                  # Tool calling definitions para OpenAI
├── validations/
│   └── appointment.ts            # Schemas Zod
└── utils.ts
```

---

## MÓDULO CALENDARIO — Instrucciones detalladas

### Instalación
```bash
npm install @schedule-x/react @schedule-x/theme-shadcn @schedule-x/calendar @schedule-x/events-service @schedule-x/drag-and-drop @schedule-x/resize @schedule-x/event-modal
```

### Implementación del componente `AppCalendar.tsx`
- Usar `useNextCalendarApp` para compatibilidad SSR con Next.js
- Aplicar `@schedule-x/theme-shadcn` para que use las CSS variables de shadcn automáticamente (light/dark mode nativo)
- Configurar vistas: mensual, semanal, diaria y agenda
- Los eventos del calendario son los turnos de `appointments` mapeados al formato `{ id, title, start, end, calendarId }`
- El `title` de cada evento debe mostrar: `"[Cliente] - [Servicio]"`
- El color del evento debe ser el `color` del servicio asociado
- Al hacer click en un evento, abrir un `<Sheet>` de shadcn con el detalle del turno y opciones de editar/cancelar
- Al hacer click en un slot vacío, abrir el formulario de nuevo turno pre-rellenado con la fecha/hora clickeada
- Implementar drag & drop para mover turnos (actualizar en Supabase al soltar)
- Mostrar vista responsiva: mensual en desktop, agenda en mobile

---

## MÓDULO BOOKING — Formulario de nuevo turno

### Schema Zod para validación
```typescript
const appointmentSchema = z.object({
  professional_id: z.string().uuid({ message: "Seleccioná un profesional" }),
  service_id: z.string().uuid({ message: "Seleccioná un servicio" }),
  client_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  client_email: z.string().email("Email inválido"),
  client_phone: z.string().optional(),
  start_time: z.string().datetime({ message: "Seleccioná un horario" }),
  notes: z.string().optional(),
})
```

### Flujo del formulario (wizard de 3 pasos)
1. **Paso 1 — Servicio y profesional**: `<Select>` para servicio, luego `<Select>` para profesional (filtrado por los que ofrecen ese servicio)
2. **Paso 2 — Fecha y horario**: `<Calendar>` de shadcn para seleccionar fecha, luego mostrar grilla de slots disponibles consultando `get_available_slots()` en Supabase
3. **Paso 3 — Datos del cliente**: campos de nombre, email, teléfono y notas opcionales

### SlotPicker
- Mostrar los slots disponibles como botones de tiempo en una grilla
- Agrupar por mañana (06:00-12:00), tarde (12:00-18:00) y noche (18:00-00:00)
- Deshabilitar slots pasados
- Mostrar skeleton loader mientras se cargan

---

## MÓDULO AI — Chat con la base de datos de turnos

### Propósito
Sección dedicada donde el usuario puede hacer preguntas en lenguaje natural sobre los turnos y la IA responde con información y componentes visuales embebidos en la respuesta.

### Ejemplos de queries que debe responder
- "¿Cuántos turnos tengo confirmados para mañana?"
- "Mostrame los turnos de María García"
- "¿Qué profesional tiene más turnos esta semana?"
- "¿Hay algún turno de corte de cabello para el viernes?"
- "Cancelá el turno de Juan Pérez del martes a las 15hs"
- "¿Cuál es el servicio más solicitado este mes?"

### Implementación del API route `/api/ai-chat/route.ts`
```typescript
import { streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const supabase = createClient()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `Sos un asistente de gestión de turnos. Tenés acceso a la base de datos de citas del negocio.
    Cuando el usuario pregunta sobre turnos, usá las herramientas disponibles para consultar la base de datos.
    Respondé siempre en español, de forma concisa y útil.
    Cuando traigas turnos, SIEMPRE usá la herramienta searchAppointments y presentá los resultados.
    Fecha y hora actual: ${new Date().toISOString()}`,
    messages,
    tools: {
      searchAppointments: tool({
        description: 'Busca turnos en la base de datos por diferentes criterios',
        parameters: z.object({
          client_name: z.string().optional().describe('Nombre del cliente a buscar'),
          professional_name: z.string().optional().describe('Nombre del profesional'),
          service_name: z.string().optional().describe('Nombre del servicio'),
          date_from: z.string().optional().describe('Fecha de inicio en formato ISO (YYYY-MM-DD)'),
          date_to: z.string().optional().describe('Fecha de fin en formato ISO (YYYY-MM-DD)'),
          status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']).optional(),
          limit: z.number().optional().default(10),
        }),
        execute: async ({ client_name, professional_name, date_from, date_to, status, limit }) => {
          let query = supabase
            .from('appointments')
            .select(`*, professionals(name, specialty), services(name, duration_minutes, color)`)
            .order('start_time', { ascending: true })
            .limit(limit ?? 10)

          if (client_name) query = query.ilike('client_name', `%${client_name}%`)
          if (date_from) query = query.gte('start_time', date_from)
          if (date_to) query = query.lte('start_time', date_to + 'T23:59:59')
          if (status) query = query.eq('status', status)

          const { data, error } = await query
          if (error) return { error: error.message }
          return { appointments: data, total: data?.length ?? 0 }
        }
      }),
      getStats: tool({
        description: 'Obtiene estadísticas y métricas de los turnos',
        parameters: z.object({
          period: z.enum(['today', 'week', 'month']).describe('Período a analizar'),
        }),
        execute: async ({ period }) => {
          const now = new Date()
          let dateFrom: string

          if (period === 'today') dateFrom = now.toISOString().split('T')[0]
          else if (period === 'week') {
            const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
            dateFrom = weekAgo.toISOString().split('T')[0]
          } else {
            const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1)
            dateFrom = monthAgo.toISOString().split('T')[0]
          }

          const { data } = await supabase
            .from('appointments')
            .select('status, services(name)')
            .gte('start_time', dateFrom)

          const stats = {
            total: data?.length ?? 0,
            confirmed: data?.filter(a => a.status === 'confirmed').length ?? 0,
            cancelled: data?.filter(a => a.status === 'cancelled').length ?? 0,
            completed: data?.filter(a => a.status === 'completed').length ?? 0,
          }
          return stats
        }
      }),
      updateAppointmentStatus: tool({
        description: 'Actualiza el estado de un turno (confirmar, cancelar, marcar como completado)',
        parameters: z.object({
          appointment_id: z.string().uuid(),
          new_status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']),
        }),
        execute: async ({ appointment_id, new_status }) => {
          const { data, error } = await supabase
            .from('appointments')
            .update({ status: new_status, updated_at: new Date().toISOString() })
            .eq('id', appointment_id)
            .select()
            .single()

          if (error) return { success: false, error: error.message }
          return { success: true, appointment: data }
        }
      })
    },
  })

  return result.toDataStreamResponse()
}
```

### Componente `AiChat.tsx`
- Usar `useChat` hook de Vercel AI SDK
- UI inspirada en un chat moderno: burbujas de mensajes, input con botón enviar
- Mostrar `<Skeleton>` mientras el AI está respondiendo (streaming)
- Cuando la IA devuelve turnos via tool call, renderizar `<AppointmentResultCard>` para cada turno
- El `AppointmentResultCard` debe mostrar: nombre del cliente, servicio, profesional, fecha/hora, estado con badge de color
- Input con placeholder: "Preguntame sobre tus turnos..."
- Sugerencias rápidas de preguntas como botones: "Turnos de hoy", "Esta semana", "Turnos pendientes"
- Diseño con shadcn `<ScrollArea>` para el historial de mensajes

---

## DASHBOARD — Vista principal

### Métricas del día
Usar 4 `<MetricCard>` con:
- Total de turnos de hoy
- Próximo turno (nombre + hora)
- Turnos completados hoy
- Turnos pendientes

### Componentes
- `<TodaySchedule>`: lista ordenada por hora de los turnos del día actual con badge de estado
- `<UpcomingAppointments>`: próximos 5 turnos de los siguientes días
- Mini versión del calendario semanal con Schedule-X

---

## NOTIFICACIONES POR EMAIL

### Setup
```bash
npm install resend react-email @react-email/components
```

### Templates en `emails/`
Crear dos templates con React Email:

**`AppointmentConfirmation.tsx`**: email de confirmación con:
- Logo/nombre del negocio
- Datos del turno: servicio, profesional, fecha, hora, duración
- Datos del cliente
- Botón para cancelar o reagendar (link al sistema)

**`AppointmentReminder.tsx`**: recordatorio 24 horas antes con:
- Mismo diseño que confirmación pero con copy diferente
- Botón de confirmación de asistencia

### Envío
En el API route de creación de turno, después de guardar en Supabase:
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'turnos@tuapp.com',
  to: appointment.client_email,
  subject: `Confirmación de turno — ${serviceName} el ${formattedDate}`,
  react: AppointmentConfirmation({ appointment, professional, service }),
})
```

---

## REGLAS DE CALIDAD Y ESTILO

### TypeScript
- TypeScript estricto en todo el proyecto (`"strict": true` en tsconfig)
- Nunca usar `any`, siempre tipar correctamente
- Usar los tipos generados por Supabase (`lib/supabase/types.ts`)
- Tipar todos los props de componentes con interfaces explícitas

### Error handling
- Envolver todas las operaciones de Supabase en try/catch
- Mostrar errores con `toast` de shadcn (component `useToast`)
- Manejar estados de loading con Suspense y Skeleton
- Agregar estados vacíos ("No hay turnos para mostrar") con ilustración simple SVG

### Componentes
- Todos los componentes son Server Components por default en App Router
- Agregar `'use client'` solo donde haya interactividad (forms, hooks)
- Usar `loading.tsx` en cada ruta para Suspense automático
- Usar `error.tsx` para error boundaries

### Accesibilidad
- Todos los botones con `aria-label` descriptivo
- Formularios con `htmlFor` en todos los labels
- Focus visible en todos los elementos interactivos
- Colores con contraste WCAG AA mínimo

### Convenciones de nombrado
- Componentes: PascalCase
- Funciones/variables: camelCase
- Archivos de componentes: PascalCase.tsx
- Archivos de utilidades: kebab-case.ts
- Constantes: UPPER_SNAKE_CASE

### Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
```

---

## ORDEN DE IMPLEMENTACIÓN

Seguí este orden para construir el proyecto:

1. **Setup inicial**: crear proyecto Next.js, instalar dependencias, configurar Supabase client
2. **Base de datos**: usar MCP de Supabase para crear todas las tablas, índices, RLS y función `get_available_slots`
3. **Instalar shadcn components**: usar MCP de shadcn para instalar todos los componentes necesarios
4. **Layout**: Sidebar, Navbar, estructura de rutas
5. **Dashboard**: métricas básicas y lista de turnos del día
6. **Módulo calendario**: AppCalendar con Schedule-X + theme shadcn
7. **Módulo booking**: formulario de nuevo turno (wizard 3 pasos)
8. **Lista de turnos**: tabla con filtros, paginación, acciones
9. **CRUD profesionales y servicios**
10. **Módulo AI**: api route + AiChat component + AppointmentResultCard
11. **Emails**: templates React Email + integración con Resend
12. **Polish**: estados vacíos, skeletons, toasts, dark mode, responsive

---

## DATOS DE PRUEBA

Al finalizar la implementación, insertar datos de prueba en Supabase:
- 3 profesionales (ej: médica, nutricionista, psicólogo)
- 5 servicios con diferentes duraciones y colores
- Horarios de atención para cada profesional (lunes a viernes)
- 15 turnos distribuidos en la semana actual y siguiente con diferentes estados

---

**IMPORTANTE**: Antes de comenzar, revisá que tenés acceso al MCP de Supabase y al MCP de shadcn. Empezá siempre creando el proyecto Next.js y configurando las variables de entorno. Si algún paso requiere una API key que no está disponible, indicalo claramente.
