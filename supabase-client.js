(() => {
  "use strict";

  const SUPABASE_URL =
    "https://tcbuujftofaipfkcejrn.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_csftJFOPGpME0m-sT2H9fw_XMpRZhyi";

  /**
   * Returns the initialized Supabase client.
   *
   * All SyncSpace scripts use this function rather
   * than accessing window.supabaseClient directly.
   */
  function getSupabaseClient() {
    if (!window.supabaseClient) {
      throw new Error(
        "The Supabase client has not been initialized."
      );
    }

    return window.supabaseClient;
  }

  /**
   * Validates the public configuration before
   * initializing Supabase.
   */
  function validateConfiguration() {
    if (!SUPABASE_URL) {
      throw new Error(
        "The Supabase project URL is missing."
      );
    }

    if (!SUPABASE_PUBLISHABLE_KEY) {
      throw new Error(
        "The Supabase publishable key is missing."
      );
    }

    try {
      const projectUrl =
        new URL(SUPABASE_URL);

      if (
        projectUrl.protocol !== "https:"
      ) {
        throw new Error(
          "The Supabase project URL must use HTTPS."
        );
      }
    } catch {
      throw new Error(
        "The Supabase project URL is invalid."
      );
    }
  }

  /**
   * Creates one shared Supabase client for the
   * complete SyncSpace website.
   */
  function initializeSupabaseClient() {
    /*
     * Avoid creating a second client when this script
     * is accidentally loaded more than once.
     */
    if (window.supabaseClient) {
      console.warn(
        "Supabase client was already initialized."
      );

      return window.supabaseClient;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !==
        "function"
    ) {
      throw new Error(
        "The Supabase JavaScript library did not load."
      );
    }

    validateConfiguration();

    window.supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
          db: {
            schema: "public"
          },

          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );

    console.log(
      "Supabase client initialized."
    );

    return window.supabaseClient;
  }

  /*
   * Expose the getter globally because auth.js,
   * booking.js, payment.js, profile.js, and admin.js
   * use getSupabaseClient().
   */
  window.getSupabaseClient =
    getSupabaseClient;

  initializeSupabaseClient();
})();
