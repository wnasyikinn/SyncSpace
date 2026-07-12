const SUPABASE_URL = "https://tcbuujftofaipfkcejrn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_csftJFOPGpME0m-sT2H9fw_XMpRZhyi";

if (!window.supabase) {
  throw new Error(
    "The Supabase JavaScript library did not load."
  );
}

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
