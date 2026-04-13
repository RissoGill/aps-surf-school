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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_resolved: boolean
          message: string
          resolved_at: string | null
          resolved_by: string | null
          subject: string | null
          target_ids: string[] | null
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_resolved?: boolean
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          subject?: string | null
          target_ids?: string[] | null
          target_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_resolved?: boolean
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          subject?: string | null
          target_ids?: string[] | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      atletas: {
        Row: {
          address: string | null
          athlete_id: string
          daily_rate: number | null
          date_of_birth: string | null
          dropoff_address: string | null
          email: string | null
          father_email: string | null
          father_name: string | null
          father_phone: string | null
          first_name: string | null
          guardian_id: string | null
          is_active: boolean | null
          last_name: string | null
          mother_email: string | null
          mother_name: string | null
          mother_phone: number | null
          phone: string | null
          pickup_address: string | null
          plan_type: string | null
          prior_balance: number | null
          pro_prior_balance: number | null
          pro_prior_balance_date: string | null
          sql_line: string | null
          surf_level: string | null
          training_days: string | null
          trainings_per_week: number | null
          transport: boolean | null
        }
        Insert: {
          address?: string | null
          athlete_id: string
          daily_rate?: number | null
          date_of_birth?: string | null
          dropoff_address?: string | null
          email?: string | null
          father_email?: string | null
          father_name?: string | null
          father_phone?: string | null
          first_name?: string | null
          guardian_id?: string | null
          is_active?: boolean | null
          last_name?: string | null
          mother_email?: string | null
          mother_name?: string | null
          mother_phone?: number | null
          phone?: string | null
          pickup_address?: string | null
          plan_type?: string | null
          prior_balance?: number | null
          pro_prior_balance?: number | null
          pro_prior_balance_date?: string | null
          sql_line?: string | null
          surf_level?: string | null
          training_days?: string | null
          trainings_per_week?: number | null
          transport?: boolean | null
        }
        Update: {
          address?: string | null
          athlete_id?: string
          daily_rate?: number | null
          date_of_birth?: string | null
          dropoff_address?: string | null
          email?: string | null
          father_email?: string | null
          father_name?: string | null
          father_phone?: string | null
          first_name?: string | null
          guardian_id?: string | null
          is_active?: boolean | null
          last_name?: string | null
          mother_email?: string | null
          mother_name?: string | null
          mother_phone?: number | null
          phone?: string | null
          pickup_address?: string | null
          plan_type?: string | null
          prior_balance?: number | null
          pro_prior_balance?: number | null
          pro_prior_balance_date?: string | null
          sql_line?: string | null
          surf_level?: string | null
          training_days?: string | null
          trainings_per_week?: number | null
          transport?: boolean | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          athlete_id: string | null
          beach_location: string | null
          coach_id: string
          date: string | null
          id: string
          notes: string | null
          photos: string | null
          shift: string
          status: string
          videos: string | null
        }
        Insert: {
          athlete_id?: string | null
          beach_location?: string | null
          coach_id: string
          date?: string | null
          id: string
          notes?: string | null
          photos?: string | null
          shift?: string
          status?: string
          videos?: string | null
        }
        Update: {
          athlete_id?: string | null
          beach_location?: string | null
          coach_id?: string
          date?: string | null
          id?: string
          notes?: string | null
          photos?: string | null
          shift?: string
          status?: string
          videos?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "attendance_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      campeonatos: {
        Row: {
          categoria: string | null
          data_fim: string | null
          data_inicio: string | null
          gender: string | null
          id: number
          local: string | null
          nome_campeonato: string | null
        }
        Insert: {
          categoria?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          gender?: string | null
          id: number
          local?: string | null
          nome_campeonato?: string | null
        }
        Update: {
          categoria?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          gender?: string | null
          id?: number
          local?: string | null
          nome_campeonato?: string | null
        }
        Relationships: []
      }
      campeonatos_atletas: {
        Row: {
          athlete_id: string | null
          campeonato_id: number | null
          id: string
        }
        Insert: {
          athlete_id?: string | null
          campeonato_id?: number | null
          id: string
        }
        Update: {
          athlete_id?: string | null
          campeonato_id?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campeonatos_atletas_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "campeonatos_atletas_campeonato_id_fkey"
            columns: ["campeonato_id"]
            isOneToOne: false
            referencedRelation: "campeonatos"
            referencedColumns: ["id"]
          },
        ]
      }
      coach: {
        Row: {
          auth_uid: string | null
          coach_id: string
          coach_password: string | null
          coach_user_id: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          phone: number | null
          status: boolean | null
        }
        Insert: {
          auth_uid?: string | null
          coach_id: string
          coach_password?: string | null
          coach_user_id?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: number | null
          status?: boolean | null
        }
        Update: {
          auth_uid?: string | null
          coach_id?: string
          coach_password?: string | null
          coach_user_id?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: number | null
          status?: boolean | null
        }
        Relationships: []
      }
      coach_message_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          message_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_message_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "coach_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          is_resolved: boolean
          message: string
          read_by_coach: boolean
          resolved_at: string | null
          resolved_by: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          message: string
          read_by_coach?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          message?: string
          read_by_coach?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_payments: {
        Row: {
          amount: number
          coach_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_month: string
          payment_year: number
          updated_at: string | null
        }
        Insert: {
          amount: number
          coach_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_month: string
          payment_year: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          coach_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_month?: string
          payment_year?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_payments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      estagio: {
        Row: {
          data_fim: string | null
          data_inicio: string | null
          id: number
          local: string | null
          nome_estagio: string | null
        }
        Insert: {
          data_fim?: string | null
          data_inicio?: string | null
          id: number
          local?: string | null
          nome_estagio?: string | null
        }
        Update: {
          data_fim?: string | null
          data_inicio?: string | null
          id?: number
          local?: string | null
          nome_estagio?: string | null
        }
        Relationships: []
      }
      estagio_atletas: {
        Row: {
          athlete_id: string | null
          estagios_id: number | null
          id: string
        }
        Insert: {
          athlete_id?: string | null
          estagios_id?: number | null
          id: string
        }
        Update: {
          athlete_id?: string | null
          estagios_id?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estagio_atletas_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "estagio_atletas_estagios_id_fkey"
            columns: ["estagios_id"]
            isOneToOne: false
            referencedRelation: "estagio"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          invoice_url: string | null
          name: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          expense_date: string
          id?: string
          invoice_url?: string | null
          name: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          invoice_url?: string | null
          name?: string
        }
        Relationships: []
      }
      guardians: {
        Row: {
          auth_uid: string
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
        }
        Insert: {
          auth_uid: string
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
        }
        Update: {
          auth_uid?: string
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      packs: {
        Row: {
          active: boolean | null
          athlete_id: string
          id: string
          payment_id: string | null
          purchase_date: string | null
          total_tokens: string | null
          used_tokens: string | null
        }
        Insert: {
          active?: boolean | null
          athlete_id: string
          id: string
          payment_id?: string | null
          purchase_date?: string | null
          total_tokens?: string | null
          used_tokens?: string | null
        }
        Update: {
          active?: boolean | null
          athlete_id?: string
          id?: string
          payment_id?: string | null
          purchase_date?: string | null
          total_tokens?: string | null
          used_tokens?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "packs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["payment_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          athlete_id: string | null
          entity: string | null
          invoice_number: string | null
          month: string | null
          notes: string | null
          payment_date: string | null
          payment_id: string
          plan_type: string | null
          status: string | null
          year: number | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          athlete_id?: string | null
          entity?: string | null
          invoice_number?: string | null
          month?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_id: string
          plan_type?: string | null
          status?: string | null
          year?: number | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          athlete_id?: string | null
          entity?: string | null
          invoice_number?: string | null
          month?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_id?: string
          plan_type?: string | null
          status?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Payments_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      prior_balance_payments: {
        Row: {
          amount: number
          athlete_id: string
          created_at: string | null
          created_by: string | null
          entity: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_date: string
        }
        Insert: {
          amount: number
          athlete_id: string
          created_at?: string | null
          created_by?: string | null
          entity?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_date: string
        }
        Update: {
          amount?: number
          athlete_id?: string
          created_at?: string | null
          created_by?: string | null
          entity?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_date?: string
        }
        Relationships: []
      }
      pro_account_entries: {
        Row: {
          amount: number
          athlete_id: string
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_date: string
          id: string
          invoice_number: string | null
          type: string
        }
        Insert: {
          amount: number
          athlete_id: string
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date: string
          id?: string
          invoice_number?: string | null
          type: string
        }
        Update: {
          amount?: number
          athlete_id?: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          invoice_number?: string | null
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          admin_id: string | null
          admin_password: string | null
          admin_role: string | null
          athlete_id: string | null
          athlete_password: string | null
          athlete_role: string | null
          athlete_user_id: string | null
          guardian_id: string | null
          guardian_password: string | null
          guardian_role: string | null
          id: number
        }
        Insert: {
          admin_id?: string | null
          admin_password?: string | null
          admin_role?: string | null
          athlete_id?: string | null
          athlete_password?: string | null
          athlete_role?: string | null
          athlete_user_id?: string | null
          guardian_id?: string | null
          guardian_password?: string | null
          guardian_role?: string | null
          id: number
        }
        Update: {
          admin_id?: string | null
          admin_password?: string | null
          admin_role?: string | null
          athlete_id?: string | null
          athlete_password?: string | null
          athlete_role?: string | null
          athlete_user_id?: string | null
          guardian_id?: string | null
          guardian_password?: string | null
          guardian_role?: string | null
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_guardian_of_athlete: {
        Args: { athlete_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "coach"
        | "guardian"
        | "athlete"
        | "super_admin"
        | "reports_viewer"
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
    Enums: {
      app_role: [
        "admin",
        "coach",
        "guardian",
        "athlete",
        "super_admin",
        "reports_viewer",
      ],
    },
  },
} as const
