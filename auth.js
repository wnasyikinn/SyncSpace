(() => {
  "use strict";

  const DEFAULT_ROLE = "customer";
  const ADMIN_ROLE = "admin";

  /**
   * Returns the initialized Supabase browser client.
   */
  function getSupabaseClient() {
    if (!window.supabaseClient) {
      throw new Error(
        "Supabase client has not been initialized. " +
        "Load supabase-client.js before auth.js."
      );
    }

    return window.supabaseClient;
  }

  /**
   * Retrieves and validates the currently authenticated user.
   */
  async function getUser() {
    const {
      data: { user },
      error
    } = await getSupabaseClient().auth.getUser();

    if (error) {
      console.error(
        "Unable to retrieve authenticated user:",
        error.message
      );

      return null;
    }

    return user ?? null;
  }

  /**
   * Creates a fallback profile from Supabase Auth metadata.
   *
   * This is used until the public.profiles table is created,
   * or when a matching profile record does not yet exist.
   */
  function createFallbackProfile(user) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      full_name:
        user.user_metadata?.full_name?.trim() ||
        user.email?.split("@")[0] ||
        "User",
      phone:
        user.phone ||
        user.user_metadata?.phone ||
        "",
      role: DEFAULT_ROLE,
      created_at: user.created_at ?? null,
      updated_at: null
    };
  }

  /**
   * Retrieves the user's SyncSpace profile.
   *
   * Expected future table:
   * public.profiles
   *
   * Expected minimum fields:
   * id, full_name, phone, role, created_at, updated_at
   */
  async function getUserProfile(providedUser) {
    const user =
      providedUser === undefined
        ? await getUser()
        : providedUser;

    if (!user) {
      return null;
    }

    const fallbackProfile = createFallbackProfile(user);

    const { data, error } = await getSupabaseClient()
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn(
        "Profile record could not be retrieved. " +
        "Using authentication metadata temporarily:",
        error.message
      );

      return fallbackProfile;
    }

    if (!data) {
      return fallbackProfile;
    }

    return {
      ...fallbackProfile,
      ...data,
      role:
        data.role === ADMIN_ROLE
          ? ADMIN_ROLE
          : DEFAULT_ROLE
    };
  }

  /**
   * Returns the user's preferred display name.
   */
  function getDisplayName(user, profile = null) {
    return (
      profile?.full_name?.trim() ||
      user?.user_metadata?.full_name?.trim() ||
      user?.email?.split("@")[0] ||
      "User"
    );
  }

  /**
   * Returns either "admin" or "customer".
   */
  async function getUserRole(providedUser) {
    const user =
      providedUser === undefined
        ? await getUser()
        : providedUser;

    if (!user) {
      return null;
    }

    const profile = await getUserProfile(user);

    return profile?.role === ADMIN_ROLE
      ? ADMIN_ROLE
      : DEFAULT_ROLE;
  }

  /**
   * Checks whether the currently authenticated user is an admin.
   *
   * This controls the interface only. Supabase RLS must still
   * protect administrative database operations.
   */
  async function isAdmin(providedUser) {
    const role = await getUserRole(providedUser);
    return role === ADMIN_ROLE;
  }

  /**
   * Use on pages that require an authenticated customer.
   */
  async function requireAuthenticatedUser(
    redirectTo = "index.html"
  ) {
    const user = await getUser();

    if (!user) {
      window.location.href = redirectTo;
      return null;
    }

    return user;
  }

  /**
   * Use on the future admin page.
   */
  async function requireAdmin(
    redirectTo = "index.html"
  ) {
    const user = await getUser();

    if (!user) {
      window.location.href = redirectTo;
      return null;
    }

    const profile = await getUserProfile(user);

    if (profile?.role !== ADMIN_ROLE) {
      window.location.href = redirectTo;
      return null;
    }

    return {
      user,
      profile
    };
  }

  /**
   * Logs the current user out.
   */
  async function logoutUser() {
    const { error } =
      await getSupabaseClient().auth.signOut();

    if (error) {
      throw error;
    }
  }

  /**
   * Returns the page used after confirming a signup email.
   */
  function getEmailConfirmationRedirect() {
    return new URL(
      "index.html",
      window.location.href
    ).href;
  }

  /**
   * Displays the shared login and signup modal.
   */
  function showAuthModal(
    onSuccess = null,
    initialTab = "login"
  ) {
    if (document.querySelector(".auth-overlay")) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "auth-overlay";

    overlay.innerHTML = `
      <div
        class="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="authModalTitle"
      >
        <button
          type="button"
          class="auth-close"
          aria-label="Close authentication window"
        >
          &times;
        </button>

        <h2
          id="authModalTitle"
          class="sr-only"
        >
          SyncSpace authentication
        </h2>

        <div class="auth-tabs">
          <button
            type="button"
            class="auth-tab"
            data-tab="login"
          >
            Log in
          </button>

          <button
            type="button"
            class="auth-tab"
            data-tab="signup"
          >
            Sign up
          </button>
        </div>

        <form
          class="auth-form"
          id="loginForm"
          novalidate
        >
          <label>
            <span>Email</span>

            <input
              type="email"
              id="authEmail"
              placeholder="you@example.com"
              autocomplete="email"
              required
            >
          </label>

          <label>
            <span>Password</span>

            <input
              type="password"
              id="authPassword"
              placeholder="Your password"
              autocomplete="current-password"
              minlength="6"
              required
            >
          </label>

          <button
            class="button primary"
            type="submit"
          >
            Log in
          </button>

          <p
            class="auth-message"
            id="authMessage"
            role="status"
            aria-live="polite"
          ></p>
        </form>

        <form
          class="auth-form"
          id="signupForm"
          novalidate
        >
          <label>
            <span>Full name</span>

            <input
              type="text"
              id="signupName"
              placeholder="Your full name"
              autocomplete="name"
              minlength="2"
              required
            >
          </label>

          <label>
            <span>Email</span>

            <input
              type="email"
              id="signupEmail"
              placeholder="you@example.com"
              autocomplete="email"
              required
            >
          </label>

          <label>
            <span>Password</span>

            <input
              type="password"
              id="signupPassword"
              placeholder="Minimum 6 characters"
              autocomplete="new-password"
              minlength="6"
              required
            >
          </label>

          <button
            class="button primary"
            type="submit"
          >
            Create account
          </button>

          <p
            class="auth-message"
            id="signupMessage"
            role="status"
            aria-live="polite"
          ></p>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const loginForm =
      overlay.querySelector("#loginForm");

    const signupForm =
      overlay.querySelector("#signupForm");

    const loginMessage =
      overlay.querySelector("#authMessage");

    const signupMessage =
      overlay.querySelector("#signupMessage");

    const previousBodyOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function setActiveTab(tabName) {
      const showingLogin = tabName === "login";

      loginForm.style.display =
        showingLogin ? "" : "none";

      signupForm.style.display =
        showingLogin ? "none" : "";

      overlay
        .querySelectorAll(".auth-tab")
        .forEach((tab) => {
          tab.classList.toggle(
            "active",
            tab.dataset.tab === tabName
          );
        });

      loginMessage.textContent = "";
      signupMessage.textContent = "";

      const fieldToFocus = showingLogin
        ? overlay.querySelector("#authEmail")
        : overlay.querySelector("#signupName");

      window.setTimeout(() => {
        fieldToFocus?.focus();
      }, 0);
    }

    function closeModal() {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        previousBodyOverflow;

      overlay.remove();
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    overlay
      .querySelector(".auth-close")
      .addEventListener("click", closeModal);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    });

    overlay
      .querySelectorAll(".auth-tab")
      .forEach((tab) => {
        tab.addEventListener("click", () => {
          setActiveTab(tab.dataset.tab);
        });
      });

    signupForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        const fullName = overlay
          .querySelector("#signupName")
          .value
          .trim();

        const email = overlay
          .querySelector("#signupEmail")
          .value
          .trim()
          .toLowerCase();

        const password = overlay
          .querySelector("#signupPassword")
          .value;

        const submitButton =
          signupForm.querySelector(
            'button[type="submit"]'
          );

        if (fullName.length < 2) {
          signupMessage.textContent =
            "Enter your full name.";

          return;
        }

        if (!signupForm.checkValidity()) {
          signupForm.reportValidity();
          return;
        }

        submitButton.disabled = true;
        signupMessage.textContent =
          "Creating your account...";

        try {
          const { data, error } =
            await getSupabaseClient().auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName
                },
                emailRedirectTo:
                  getEmailConfirmationRedirect()
              }
            });

          if (error) {
            throw error;
          }

          /*
           * With email confirmation enabled,
           * data.session is normally null until the
           * confirmation link has been opened.
           */
          if (!data.session) {
            signupMessage.textContent =
              "Account created. Check your email and " +
              "confirm your account before logging in.";

            signupForm.reset();
            return;
          }

          await updateAuthUI(data.user);
          closeModal();

          if (typeof onSuccess === "function") {
            try {
              await onSuccess(data.user);
            } catch (callbackError) {
              console.error(
                "Post-login action failed:",
                callbackError
              );
            }
          }
        } catch (error) {
          signupMessage.textContent =
            error.message ||
            "The account could not be created.";
        } finally {
          submitButton.disabled = false;
        }
      }
    );

    loginForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (!loginForm.checkValidity()) {
          loginForm.reportValidity();
          return;
        }

        const email = overlay
          .querySelector("#authEmail")
          .value
          .trim()
          .toLowerCase();

        const password = overlay
          .querySelector("#authPassword")
          .value;

        const submitButton =
          loginForm.querySelector(
            'button[type="submit"]'
          );

        submitButton.disabled = true;
        loginMessage.textContent =
          "Logging in...";

        try {
          const { data, error } =
            await getSupabaseClient()
              .auth
              .signInWithPassword({
                email,
                password
              });

          if (error) {
            throw error;
          }

          await updateAuthUI(data.user);
          closeModal();

          if (typeof onSuccess === "function") {
            try {
              await onSuccess(data.user);
            } catch (callbackError) {
              console.error(
                "Post-login action failed:",
                callbackError
              );
            }
          }
        } catch (error) {
          loginMessage.textContent =
            error.message ||
            "Invalid email or password.";
        } finally {
          submitButton.disabled = false;
        }
      }
    );

    setActiveTab(
      initialTab === "signup"
        ? "signup"
        : "login"
    );
  }

  /**
   * Updates authentication-related navigation controls.
   *
   * Future pages may include:
   * <a id="navAdmin" href="admin.html">Admin</a>
   */
  async function updateAuthUI(providedUser) {
    const user =
      providedUser === undefined
        ? await getUser()
        : providedUser;

    const profile = user
      ? await getUserProfile(user)
      : null;

    const profileLink =
      document.querySelector("#navProfile");

    const adminLink =
      document.querySelector("#navAdmin");

    const logoutButton =
      document.querySelector("#navLogout");

    const loginButton =
      document.querySelector("#navLogin");

    if (profileLink) {
      profileLink.style.display =
        user ? "" : "none";

      if (user) {
        profileLink.textContent =
          getDisplayName(user, profile)
            .split(/\s+/)[0];
      }
    }

    if (adminLink) {
      adminLink.style.display =
        user && profile?.role === ADMIN_ROLE
          ? ""
          : "none";
    }

    if (logoutButton) {
      logoutButton.style.display =
        user ? "" : "none";
    }

    if (loginButton) {
      loginButton.style.display =
        user ? "none" : "";
    }

    document.documentElement.dataset.authenticated =
      user ? "true" : "false";

    document.documentElement.dataset.userRole =
      profile?.role ?? "guest";

    /*
     * Other scripts can listen for this event:
     *
     * window.addEventListener(
     *   "syncspace:auth-changed",
     *   event => console.log(event.detail)
     * );
     */
    window.dispatchEvent(
      new CustomEvent(
        "syncspace:auth-changed",
        {
          detail: {
            user,
            profile
          }
        }
      )
    );

    return {
      user,
      profile
    };
  }

  /**
   * Sets up shared navigation authentication controls.
   */
  async function initializeAuthentication() {
    await updateAuthUI();

    const logoutButton =
      document.querySelector("#navLogout");

    const loginButton =
      document.querySelector("#navLogin");

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        async () => {
          logoutButton.disabled = true;

          try {
            await logoutUser();
            await updateAuthUI(null);

            const protectedPages = [
              "profile.html",
              "payment.html",
              "admin.html",
              "community.html",
              "user-profile.html",
              "notifications.html",
              "workspace.html"
            ];

            const currentPage =
              window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

            if (protectedPages.includes(currentPage)) {
              window.location.href = "index.html";
            }
          } catch (error) {
            console.error(
              "Logout failed:",
              error.message
            );

            logoutButton.disabled = false;
          }
        }
      );
    }

    if (loginButton) {
      loginButton.addEventListener(
        "click",
        () => {
          showAuthModal();
        }
      );
    }

    getSupabaseClient()
      .auth
      .onAuthStateChange(
        (_event, session) => {
          /*
           * Run outside the auth callback so that
           * profile queries do not block the callback.
           */
          window.setTimeout(() => {
            void updateAuthUI(
              session?.user ?? null
            );
          }, 0);
        }
      );
  }

  /*
   * Make the shared functions available to
   * booking.js, profile.js, payment.js, and admin.js.
   */
  window.getSupabaseClient =
    getSupabaseClient;

  window.getUser =
    getUser;

  window.getUserProfile =
    getUserProfile;

  window.getDisplayName =
    getDisplayName;

  window.getUserRole =
    getUserRole;

  window.isAdmin =
    isAdmin;

  window.requireAuthenticatedUser =
    requireAuthenticatedUser;

  window.requireAdmin =
    requireAdmin;

  window.logoutUser =
    logoutUser;

  window.showAuthModal =
    showAuthModal;

  window.updateAuthUI =
    updateAuthUI;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeAuthentication,
      { once: true }
    );
  } else {
    void initializeAuthentication();
  }
})();
