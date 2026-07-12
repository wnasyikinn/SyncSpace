(() => {
  if (window.supabaseClient) {
    console.warn("Supabase client was already initialized.");
    return;
  }

  const supabaseUrl =
    "https://tcbuujftofaipfkcejrn.supabase.co";

  const supabasePublishableKey =
    "sb_publishable_csftJFOPGpME0m-sT2H9fw_XMpRZhyi";

  if (!window.supabase) {
    throw new Error(
      "The Supabase JavaScript library did not load."
    );
  }

  window.supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabasePublishableKey
  );

  console.log("Supabase client initialized");
})();
