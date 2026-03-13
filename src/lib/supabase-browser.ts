import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const missingSupabaseBrowserEnvMessage =
  "Missing Supabase browser env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the Next.js dev server.";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!url || !anonKey) {
    throw new Error(missingSupabaseBrowserEnvMessage);
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}
