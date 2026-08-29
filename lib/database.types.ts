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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      athlete: {
        Row: {
          actif: boolean
          auth_user_id: string | null
          created_at: string
          date_naissance: string | null
          email: string | null
          fc_max: number | null
          fc_repos: number | null
          id: string
          identifiant: string
          nom: string
          prenom: string
        }
        Insert: {
          actif?: boolean
          auth_user_id?: string | null
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          fc_max?: number | null
          fc_repos?: number | null
          id?: string
          identifiant: string
          nom: string
          prenom: string
        }
        Update: {
          actif?: boolean
          auth_user_id?: string | null
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          fc_max?: number | null
          fc_repos?: number | null
          id?: string
          identifiant?: string
          nom?: string
          prenom?: string
        }
        Relationships: []
      }
      athlete_note: {
        Row: {
          athlete_id: string
          contenu: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          contenu?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          contenu?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_note_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athlete"
            referencedColumns: ["id"]
          },
        ]
      }
      bloc_seance: {
        Row: {
          cible_allure_secondes_par_km: number | null
          cible_rpe: number | null
          cible_type: Database["public"]["Enums"]["cible_type"]
          cible_zone: Database["public"]["Enums"]["cible_zone"] | null
          commentaire: string | null
          distance_metres: number | null
          duree_secondes: number | null
          id: string
          mode_duree: Database["public"]["Enums"]["mode_duree"]
          ordre: number
          parent_bloc_id: string | null
          repetitions: number
          role: Database["public"]["Enums"]["bloc_role"]
          seance_id: string
        }
        Insert: {
          cible_allure_secondes_par_km?: number | null
          cible_rpe?: number | null
          cible_type: Database["public"]["Enums"]["cible_type"]
          cible_zone?: Database["public"]["Enums"]["cible_zone"] | null
          commentaire?: string | null
          distance_metres?: number | null
          duree_secondes?: number | null
          id?: string
          mode_duree: Database["public"]["Enums"]["mode_duree"]
          ordre: number
          parent_bloc_id?: string | null
          repetitions?: number
          role: Database["public"]["Enums"]["bloc_role"]
          seance_id: string
        }
        Update: {
          cible_allure_secondes_par_km?: number | null
          cible_rpe?: number | null
          cible_type?: Database["public"]["Enums"]["cible_type"]
          cible_zone?: Database["public"]["Enums"]["cible_zone"] | null
          commentaire?: string | null
          distance_metres?: number | null
          duree_secondes?: number | null
          id?: string
          mode_duree?: Database["public"]["Enums"]["mode_duree"]
          ordre?: number
          parent_bloc_id?: string | null
          repetitions?: number
          role?: Database["public"]["Enums"]["bloc_role"]
          seance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloc_seance_parent_bloc_id_fkey"
            columns: ["parent_bloc_id"]
            isOneToOne: false
            referencedRelation: "bloc_seance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloc_seance_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: false
            referencedRelation: "seance"
            referencedColumns: ["id"]
          },
        ]
      }
      competition: {
        Row: {
          athlete_id: string
          created_at: string
          date: string
          distance: Database["public"]["Enums"]["distance_ref"] | null
          distance_metres_custom: number | null
          id: string
          lieu: string | null
          nom: string
          objectif_temps_secondes: number | null
          objectif_texte: string | null
          priorite: Database["public"]["Enums"]["priorite_competition"]
          resultat_commentaire: string | null
          resultat_temps_secondes: number | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          date: string
          distance?: Database["public"]["Enums"]["distance_ref"] | null
          distance_metres_custom?: number | null
          id?: string
          lieu?: string | null
          nom: string
          objectif_temps_secondes?: number | null
          objectif_texte?: string | null
          priorite?: Database["public"]["Enums"]["priorite_competition"]
          resultat_commentaire?: string | null
          resultat_temps_secondes?: number | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          date?: string
          distance?: Database["public"]["Enums"]["distance_ref"] | null
          distance_metres_custom?: number | null
          id?: string
          lieu?: string | null
          nom?: string
          objectif_temps_secondes?: number | null
          objectif_texte?: string | null
          priorite?: Database["public"]["Enums"]["priorite_competition"]
          resultat_commentaire?: string | null
          resultat_temps_secondes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reference: {
        Row: {
          athlete_id: string
          created_at: string
          date_perf: string
          distance: Database["public"]["Enums"]["distance_ref"]
          id: string
          temps_secondes: number
          type: Database["public"]["Enums"]["performance_type"]
        }
        Insert: {
          athlete_id: string
          created_at?: string
          date_perf: string
          distance: Database["public"]["Enums"]["distance_ref"]
          id?: string
          temps_secondes: number
          type: Database["public"]["Enums"]["performance_type"]
        }
        Update: {
          athlete_id?: string
          created_at?: string
          date_perf?: string
          distance?: Database["public"]["Enums"]["distance_ref"]
          id?: string
          temps_secondes?: number
          type?: Database["public"]["Enums"]["performance_type"]
        }
        Relationships: [
          {
            foreignKeyName: "performance_reference_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      retour_seance: {
        Row: {
          athlete_id: string
          commentaire: string | null
          created_at: string
          distance_reelle_metres: number | null
          duree_reelle_secondes: number | null
          id: string
          rpe: number | null
          seance_id: string
          statut: Database["public"]["Enums"]["retour_statut"]
          updated_at: string
        }
        Insert: {
          athlete_id: string
          commentaire?: string | null
          created_at?: string
          distance_reelle_metres?: number | null
          duree_reelle_secondes?: number | null
          id?: string
          rpe?: number | null
          seance_id: string
          statut: Database["public"]["Enums"]["retour_statut"]
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          commentaire?: string | null
          created_at?: string
          distance_reelle_metres?: number | null
          duree_reelle_secondes?: number | null
          id?: string
          rpe?: number | null
          seance_id?: string
          statut?: Database["public"]["Enums"]["retour_statut"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retour_seance_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retour_seance_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: false
            referencedRelation: "seance"
            referencedColumns: ["id"]
          },
        ]
      }
      seance: {
        Row: {
          athlete_id: string | null
          consignes: string | null
          created_at: string
          date_prevue: string | null
          est_modele: boolean
          id: string
          objectif: string | null
          ordre_dans_journee: number
          titre: string
          type: Database["public"]["Enums"]["seance_type"]
        }
        Insert: {
          athlete_id?: string | null
          consignes?: string | null
          created_at?: string
          date_prevue?: string | null
          est_modele?: boolean
          id?: string
          objectif?: string | null
          ordre_dans_journee?: number
          titre: string
          type: Database["public"]["Enums"]["seance_type"]
        }
        Update: {
          athlete_id?: string | null
          consignes?: string | null
          created_at?: string
          date_prevue?: string | null
          est_modele?: boolean
          id?: string
          objectif?: string | null
          ordre_dans_journee?: number
          titre?: string
          type?: Database["public"]["Enums"]["seance_type"]
        }
        Relationships: [
          {
            foreignKeyName: "seance_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_manuelle: {
        Row: {
          allure_max_secondes_par_km: number | null
          allure_min_secondes_par_km: number | null
          athlete_id: string
          created_at: string
          fc_max_bpm: number | null
          fc_min_bpm: number | null
          id: string
          updated_at: string
          zone: Database["public"]["Enums"]["cible_zone"]
        }
        Insert: {
          allure_max_secondes_par_km?: number | null
          allure_min_secondes_par_km?: number | null
          athlete_id: string
          created_at?: string
          fc_max_bpm?: number | null
          fc_min_bpm?: number | null
          id?: string
          updated_at?: string
          zone: Database["public"]["Enums"]["cible_zone"]
        }
        Update: {
          allure_max_secondes_par_km?: number | null
          allure_min_secondes_par_km?: number | null
          athlete_id?: string
          created_at?: string
          fc_max_bpm?: number | null
          fc_min_bpm?: number | null
          id?: string
          updated_at?: string
          zone?: Database["public"]["Enums"]["cible_zone"]
        }
        Relationships: [
          {
            foreignKeyName: "zone_manuelle_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_athlete_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      bloc_role:
        | "echauffement"
        | "corps"
        | "recuperation"
        | "retour_au_calme"
        | "gammes"
      cible_type: "zone_allure" | "allure_absolue" | "zone_fc" | "rpe" | "libre"
      cible_zone:
        | "z1_recup"
        | "z2_endurance"
        | "z3_marathon"
        | "z4_seuil"
        | "z5_vma"
        | "z6_anaerobie"
      distance_ref: "5k" | "10k" | "semi" | "marathon"
      mode_duree: "distance" | "temps" | "libre"
      performance_type: "reel" | "estime" | "objectif"
      priorite_competition: "A" | "B" | "C"
      retour_statut: "fait" | "partiel" | "non_fait"
      seance_type:
        | "endurance"
        | "seuil"
        | "vma"
        | "fractionne_court"
        | "fractionne_long"
        | "cote"
        | "sortie_longue"
        | "allure_specifique"
        | "recuperation"
        | "renforcement"
        | "repos"
        | "competition"
        | "test"
        | "cross_training"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bloc_role: [
        "echauffement",
        "corps",
        "recuperation",
        "retour_au_calme",
        "gammes",
      ],
      cible_type: ["zone_allure", "allure_absolue", "zone_fc", "rpe", "libre"],
      cible_zone: [
        "z1_recup",
        "z2_endurance",
        "z3_marathon",
        "z4_seuil",
        "z5_vma",
        "z6_anaerobie",
      ],
      distance_ref: ["5k", "10k", "semi", "marathon"],
      mode_duree: ["distance", "temps", "libre"],
      performance_type: ["reel", "estime", "objectif"],
      priorite_competition: ["A", "B", "C"],
      retour_statut: ["fait", "partiel", "non_fait"],
      seance_type: [
        "endurance",
        "seuil",
        "vma",
        "fractionne_court",
        "fractionne_long",
        "cote",
        "sortie_longue",
        "allure_specifique",
        "recuperation",
        "renforcement",
        "repos",
        "competition",
        "test",
        "cross_training",
      ],
    },
  },
} as const
