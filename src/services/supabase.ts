import { supabase as connectedSupabase } from "@/integrations/supabase/client";

const envUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  (import.meta.env.VITE_SUPABASE_PROJECT_ID ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co` : "https://jnqhbeadqrvfcewlznlj.supabase.co");
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWhiZWFkcXJ2ZmNld2x6bmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjg5MjYsImV4cCI6MjA4ODMwNDkyNn0.xHlhq8_8LRmYqf9dnbcI3aFsU3bq53qQh7FgzSatRO4";

export const isSupabaseConfigured = true;

export const supabase = connectedSupabase;
