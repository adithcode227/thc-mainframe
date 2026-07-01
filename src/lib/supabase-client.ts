import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase Client (singleton browser client)
export const createSupabaseBrowserClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
