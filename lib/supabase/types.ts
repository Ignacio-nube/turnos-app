export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          professional_id: string | null
          service_id: string | null
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          service_id?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          service_id?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_times: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          professional_id: string | null
          reason: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_times_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          professional_id: string
          service_id: string
        }
        Insert: {
          professional_id: string
          service_id: string
        }
        Update: {
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          active: boolean | null
          day_of_week: number
          end_time: string
          id: string
          professional_id: string | null
          start_time: string
        }
        Insert: {
          active?: boolean | null
          day_of_week: number
          end_time: string
          id?: string
          professional_id?: string | null
          start_time: string
        }
        Update: {
          active?: boolean | null
          day_of_week?: number
          end_time?: string
          id?: string
          professional_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          name: string
          price: number | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          price?: number | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          price?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_slots: {
        Args: {
          p_date: string
          p_duration_minutes: number
          p_professional_id: string
        }
        Returns: {
          slot_end: string
          slot_start: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// Tipos de conveniencia
export type Appointment = Tables<"appointments">
export type Professional = Tables<"professionals">
export type Service = Tables<"services">
export type Schedule = Tables<"schedules">
export type BlockedTime = Tables<"blocked_times">
export type ProfessionalService = Tables<"professional_services">

export type AppointmentStatus = "confirmed" | "cancelled" | "completed" | "no_show"

export type AppointmentWithRelations = Appointment & {
  professionals: Pick<Professional, "id" | "name" | "specialty"> | null
  services: Pick<Service, "id" | "name" | "color" | "duration_minutes"> | null
}
