export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          app_id: string | null
          created_at: string | null
          date: string
          hospital_id: string | null
          id: string
          patient_id: string | null
          reason: string
          specific_service: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string | null
          date: string
          hospital_id?: string | null
          id?: string
          patient_id?: string | null
          reason: string
          specific_service?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string | null
          date?: string
          hospital_id?: string | null
          id?: string
          patient_id?: string | null
          reason?: string
          specific_service?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          app_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          patient_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          app_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          patient_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          app_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          patient_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          app_id: string
          aviso_privacidad: string | null
          cedula_profesional: string | null
          clinic_name: string | null
          direccion_clinica: string | null
          doctor_name: string | null
          especialidad: string | null
          id: string
          institucion_egreso: string | null
          logo_url: string | null
          telefono_clinica: string | null
          updated_at: string | null
        }
        Insert: {
          app_id: string
          aviso_privacidad?: string | null
          cedula_profesional?: string | null
          clinic_name?: string | null
          direccion_clinica?: string | null
          doctor_name?: string | null
          especialidad?: string | null
          id?: string
          institucion_egreso?: string | null
          logo_url?: string | null
          telefono_clinica?: string | null
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          aviso_privacidad?: string | null
          cedula_profesional?: string | null
          clinic_name?: string | null
          direccion_clinica?: string | null
          doctor_name?: string | null
          especialidad?: string | null
          id?: string
          institucion_egreso?: string | null
          logo_url?: string | null
          telefono_clinica?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hospitals: {
        Row: {
          address: string | null
          app_id: string
          end_time: string | null
          id: string
          image: string | null
          is_dental_clinic: boolean | null
          name: string
          slot_interval: number | null
          start_time: string | null
        }
        Insert: {
          address?: string | null
          app_id: string
          end_time?: string | null
          id: string
          image?: string | null
          is_dental_clinic?: boolean | null
          name: string
          slot_interval?: number | null
          start_time?: string | null
        }
        Update: {
          address?: string | null
          app_id?: string
          end_time?: string | null
          id?: string
          image?: string | null
          is_dental_clinic?: boolean | null
          name?: string
          slot_interval?: number | null
          start_time?: string | null
        }
        Relationships: []
      }
      legal_cases: {
        Row: {
          app_id: string | null
          case_type: string | null
          client_id: string | null
          counterpart: string | null
          court_number: string | null
          created_at: string | null
          documents: Json | null
          id: string
          judge_name: string | null
          status: string | null
          timeline: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          app_id?: string | null
          case_type?: string | null
          client_id?: string | null
          counterpart?: string | null
          court_number?: string | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          judge_name?: string | null
          status?: string | null
          timeline?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          app_id?: string | null
          case_type?: string | null
          client_id?: string | null
          counterpart?: string | null
          court_number?: string | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          judge_name?: string | null
          status?: string | null
          timeline?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_uploads: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_type: string
          id: string
          patient_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_type: string
          id?: string
          patient_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_uploads_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          app_id: string | null
          created_at: string | null
          email: string | null
          id: string
          medical_history: Json | null
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          medical_history?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          medical_history?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_id: string
          can_upload_files: boolean
          full_name: string
          id: string
          plan_name: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          can_upload_files?: boolean
          full_name: string
          id: string
          plan_name?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          can_upload_files?: boolean
          full_name?: string
          id?: string
          plan_name?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_app_id: { Args: never; Returns: string }
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
