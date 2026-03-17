import { supabase as connectedSupabase } from "@/integrations/supabase/client";

const envUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  (import.meta.env.VITE_SUPABASE_PROJECT_ID ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co` : undefined);
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(envUrl && envKey);

export const supabase = connectedSupabase;
