export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      username: {
        Row: {
          username: string;
          displayname: string;
          created_at: string;
        };
        Insert: {
          username: string;
          displayname: string;
          created_at?: string;
        };
        Update: {
          username?: string;
          displayname?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      audio_files: {
        Row: {
          id: string;
          username: string;
          title: string;
          artist: string | null;
          album: string | null;
          cover_art_url: string | null;
          storage_path: string;
          content_type: string | null;
          file_size: number | null;
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          title: string;
          artist?: string | null;
          album?: string | null;
          cover_art_url?: string | null;
          storage_path: string;
          content_type?: string | null;
          file_size?: number | null;
          duration_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          title?: string;
          artist?: string | null;
          album?: string | null;
          cover_art_url?: string | null;
          storage_path?: string;
          content_type?: string | null;
          file_size?: number | null;
          duration_seconds?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      playlists: {
        Row: {
          id: string;
          username: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      playlist_items: {
        Row: {
          id: string;
          playlist_id: string;
          audio_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          audio_id: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          audio_id?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
