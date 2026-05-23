export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          model: string | null;
          analysis_type: string | null;
          date_range: string | null;
          input_summary: Json | null;
          result: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          model?: string | null;
          analysis_type?: string | null;
          date_range?: string | null;
          input_summary?: Json | null;
          result: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ai_analyses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ai_analyses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      filter_presets: {
        Row: {
          id: string;
          user_id: string;
          preset_name: string;
          date_filter: string | null;
          symbol_filter: string | null;
          timeframe_filter: string | null;
          strategy_filter: string | null;
          status_filter: string | null;
          quality_grade_filter: string | null;
          rule_followed_filter: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          preset_name: string;
          date_filter?: string | null;
          symbol_filter?: string | null;
          timeframe_filter?: string | null;
          strategy_filter?: string | null;
          status_filter?: string | null;
          quality_grade_filter?: string | null;
          rule_followed_filter?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["filter_presets"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "filter_presets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          strategy_name: string;
          market_type: string | null;
          timeframe: string | null;
          entry_rules: string | null;
          exit_rules: string | null;
          stop_loss_rules: string | null;
          take_profit_rules: string | null;
          risk_rules: string | null;
          example_screenshot_url: string | null;
          notes: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          strategy_name: string;
          market_type?: string | null;
          timeframe?: string | null;
          entry_rules?: string | null;
          exit_rules?: string | null;
          stop_loss_rules?: string | null;
          take_profit_rules?: string | null;
          risk_rules?: string | null;
          example_screenshot_url?: string | null;
          notes?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["strategies"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "strategies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          trade_number: number;
          date: string;
          time: string;
          timestamp: number;
          symbol: string;
          direction: string;
          timeframe: string;
          entry_price: number | null;
          stop_loss: number | null;
          take_profit: number | null;
          lot_size: number | null;
          risk_amount: number | null;
          reward_amount: number | null;
          gross_profit_loss: number | null;
          commission: number | null;
          swap: number | null;
          net_profit_loss: number | null;
          withdrawal_amount: number | null;
          starting_balance: number | null;
          ending_balance: number | null;
          growth_percent: number | null;
          risk_reward_ratio: number | null;
          r_multiple: number | null;
          status: string;
          strategy_name: string | null;
          strategy_id: string | null;
          setup_type: string | null;
          emotion_before: string | null;
          emotion_after: string | null;
          mistake_made: string | null;
          lesson_learned: string | null;
          notes: string | null;
          before_screenshot_url: string | null;
          after_screenshot_url: string | null;
          checklist_trend_confirmed: boolean | null;
          checklist_key_level_confirmed: boolean | null;
          checklist_entry_reason_confirmed: boolean | null;
          checklist_stop_loss_planned: boolean | null;
          checklist_take_profit_planned: boolean | null;
          checklist_risk_accepted: boolean | null;
          checklist_no_revenge_trade: boolean | null;
          checklist_no_overlot: boolean | null;
          checklist_news_checked: boolean | null;
          checklist_emotion_stable: boolean | null;
          checklist_score: number | null;
          checklist_status: string | null;
          mistake_tags: string[] | null;
          rule_followed: string | null;
          rule_broken_notes: string | null;
          trade_quality_score: number | null;
          trade_quality_grade: string | null;
          review_completed: boolean | null;
          review_date: string | null;
          review_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          trade_number: number;
          date: string;
          time: string;
          timestamp: number;
          symbol: string;
          direction: string;
          timeframe: string;
          entry_price?: number | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          lot_size?: number | null;
          risk_amount?: number | null;
          reward_amount?: number | null;
          gross_profit_loss?: number | null;
          commission?: number | null;
          swap?: number | null;
          net_profit_loss?: number | null;
          withdrawal_amount?: number | null;
          starting_balance?: number | null;
          ending_balance?: number | null;
          growth_percent?: number | null;
          risk_reward_ratio?: number | null;
          r_multiple?: number | null;
          status: string;
          strategy_name?: string | null;
          strategy_id?: string | null;
          setup_type?: string | null;
          emotion_before?: string | null;
          emotion_after?: string | null;
          mistake_made?: string | null;
          lesson_learned?: string | null;
          notes?: string | null;
          before_screenshot_url?: string | null;
          after_screenshot_url?: string | null;
          checklist_trend_confirmed?: boolean | null;
          checklist_key_level_confirmed?: boolean | null;
          checklist_entry_reason_confirmed?: boolean | null;
          checklist_stop_loss_planned?: boolean | null;
          checklist_take_profit_planned?: boolean | null;
          checklist_risk_accepted?: boolean | null;
          checklist_no_revenge_trade?: boolean | null;
          checklist_no_overlot?: boolean | null;
          checklist_news_checked?: boolean | null;
          checklist_emotion_stable?: boolean | null;
          checklist_score?: number | null;
          checklist_status?: string | null;
          mistake_tags?: string[] | null;
          rule_followed?: string | null;
          rule_broken_notes?: string | null;
          trade_quality_score?: number | null;
          trade_quality_grade?: string | null;
          review_completed?: boolean | null;
          review_date?: string | null;
          review_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["trades"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "trades_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          initial_balance: number | null;
          currency: string | null;
          timezone_offset: string | null;
          date_format: string | null;
          time_format: string | null;
          default_timeframe: string | null;
          default_symbol: string | null;
          default_commission: number | null;
          default_swap: number | null;
          theme_mode: string | null;
          accent_color: string | null;
          ai_provider: string | null;
          ai_model: string | null;
          enable_screenshot_analysis: boolean | null;
          save_ai_analysis_history: boolean | null;
          max_risk_per_trade_percent: number | null;
          max_daily_loss_percent: number | null;
          max_weekly_loss_percent: number | null;
          max_trades_per_day: number | null;
          max_losing_streak_warning: number | null;
          minimum_risk_reward_ratio: number | null;
          enable_risk_warning: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          initial_balance?: number | null;
          currency?: string | null;
          timezone_offset?: string | null;
          date_format?: string | null;
          time_format?: string | null;
          default_timeframe?: string | null;
          default_symbol?: string | null;
          default_commission?: number | null;
          default_swap?: number | null;
          theme_mode?: string | null;
          accent_color?: string | null;
          ai_provider?: string | null;
          ai_model?: string | null;
          enable_screenshot_analysis?: boolean | null;
          save_ai_analysis_history?: boolean | null;
          max_risk_per_trade_percent?: number | null;
          max_daily_loss_percent?: number | null;
          max_weekly_loss_percent?: number | null;
          max_trades_per_day?: number | null;
          max_losing_streak_warning?: number | null;
          minimum_risk_reward_ratio?: number | null;
          enable_risk_warning?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
