const SUPABASE_URL = "https://tcbuujftofaipfkcejrn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_csftJFOPGpME0m-sT2H9fw_XMpRZhyi";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
