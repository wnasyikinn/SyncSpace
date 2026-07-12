console.log("SyncSpace authentication script loaded");

function getSupabaseClient() {
  if (!window.supabaseClient) {
    throw new Error("Supabase client has not been initialized.");
  }

  return window.supabaseClient;
}

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

async function getUser() {
  const {
    data: { session },
    error
  } = await getSupabaseClient().auth.getSession();

  if (error) {
    console.error("Unable to retrieve session:", error.message);
    return null;
  }

  return session?.user ?? null;
}

async function logoutUser() {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) {
    throw error;
  }
}

async function saveBooking(booking) {
  const user = await getUser();

  if (!user) {
    throw new Error("You must be logged in to make a booking.");
  }

  const payload = {
    user_id: user.id,
    room_id: booking.roomId,
    room_name: booking.roomName,
    room_type: booking.roomType,
    start_date: booking.startDate,
    end_date: booking.endDate,
    time_slot: booking.timeSlot,
    total: booking.total,
    status: "confirmed"
  };

  const { data, error } = await getSupabaseClient()
    .from("bookings")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getUserBookings() {
  const user = await getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await getSupabaseClient()
    .from("bookings")
    .select(`
      id,
      user_id,
      room_id,
      room_name,
      room_type,
      start_date,
      end_date,
      time_slot,
      total,
      status,
      created_at
    `)
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

function showAuthModal(onSuccess) {
  if (document.querySelector(".auth-overlay")) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "auth-overlay";

  overlay.innerHTML = `
    <div class="auth-modal"
         role="dialog"
         aria-modal="true"
         aria-labelledby="authModalTitle">

      <button
        type="button"
        class="auth-close"
        aria-label="Close">
        &times;
      </button>

      <h2 id="authModalTitle" class="sr-only">
        SyncSpace authentication
      </h2>

      <div class="auth-tabs">
        <button
          type="button"
          class="auth-tab active"
          data-tab="login">
          Log in
        </button>

        <button
          type="button"
          class="auth-tab"
          data-tab="signup">
          Sign up
        </button>
      </div>

      <form class="auth-form" id="loginForm">
        <label>
          <span>Email</span>
          <input
            type="email"
            id="authEmail"
            placeholder="you@example.com"
            autocomplete="email"
            required>
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            id="authPassword"
            placeholder="Your password"
            autocomplete="current-password"
            minlength="6"
            required>
        </label>

        <button class="button primary" type="submit">
          Log in
        </button>

        <p
          class="auth-message"
          id="authMessage"
          role="status">
        </p>
      </form>

      <form
        class="auth-form"
        id="signupForm"
        style="display:none">

        <label>
          <span>Full name</span>
          <input
            type="text"
            id="signupName"
            placeholder="Your name"
            autocomplete="name"
            required>
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            id="signupEmail"
            placeholder="you@example.com"
            autocomplete="email"
            required>
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            id="signupPassword"
            placeholder="Minimum 6 characters"
            autocomplete="new-password"
            minlength="6"
            required>
        </label>

        <button class="button primary" type="submit">
          Create account
        </button>

        <p
          class="auth-message"
          id="signupMessage"
          role="status">
        </p>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.remove();
    document.body.style.overflow = "";
  };

  document.body.style.overflow = "hidden";

  overlay
    .querySelector(".auth-close")
    .addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener(
    "keydown",
    function escapeHandler(event) {
      if (event.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escapeHandler);
      }
    }
  );

  const loginForm = overlay.querySelector("#loginForm");
  const signupForm = overlay.querySelector("#signupForm");

  overlay.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      overlay
        .querySelectorAll(".auth-tab")
        .forEach((item) => item.classList.remove("active"));

      tab.classList.add("active");

      const showingLogin = tab.dataset.tab === "login";

      loginForm.style.display = showingLogin ? "" : "none";
      signupForm.style.display = showingLogin ? "none" : "";
    });
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = overlay
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

    const message = overlay.querySelector("#signupMessage");
    const submitButton = signupForm.querySelector(
      'button[type="submit"]'
    );

    if (!name) {
      message.textContent = "Enter your full name.";
      return;
    }

    submitButton.disabled = true;
    message.textContent = "Creating account...";

    try {
      const redirectUrl = new URL(
        "index.html",
        window.location.href
      ).href;

      const { data, error } =
        await getSupabaseClient().auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            },
            emailRedirectTo: redirectUrl
          }
        });

      if (error) {
        throw error;
      }

      if (!data.session) {
        message.textContent =
          "Account created. Check your email to confirm your account, then log in.";
        return;
      }

      closeModal();
      await updateAuthUI(data.user);

      if (typeof onSuccess === "function") {
        await onSuccess();
      }
    } catch (error) {
      message.textContent =
        error.message || "The account could not be created.";
    } finally {
      submitButton.disabled = false;
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = overlay
      .querySelector("#authEmail")
      .value
      .trim()
      .toLowerCase();

    const password = overlay
      .querySelector("#authPassword")
      .value;

    const message = overlay.querySelector("#authMessage");
    const submitButton = loginForm.querySelector(
      'button[type="submit"]'
    );

    submitButton.disabled = true;
    message.textContent = "Logging in...";

    try {
      const { data, error } =
        await getSupabaseClient().auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        throw error;
      }

      closeModal();
      await updateAuthUI(data.user);

      if (typeof onSuccess === "function") {
        await onSuccess();
      }
    } catch (error) {
      message.textContent =
        error.message || "Invalid email or password.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

async function updateAuthUI(providedUser) {
  const user =
    providedUser === undefined
      ? await getUser()
      : providedUser;

  const profileLink = document.querySelector("#navProfile");
  const logoutButton = document.querySelector("#navLogout");
  const loginButton = document.querySelector("#navLogin");

  if (profileLink) {
    profileLink.style.display = user ? "" : "none";

    if (user) {
      profileLink.textContent =
        getDisplayName(user).split(/\s+/)[0];
    }
  }

  if (logoutButton) {
    logoutButton.style.display = user ? "" : "none";
  }

  if (loginButton) {
    loginButton.style.display = user ? "none" : "";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await updateAuthUI();

  const logoutButton = document.querySelector("#navLogout");

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await logoutUser();
        await updateAuthUI(null);

        if (
          window.location.pathname
            .toLowerCase()
            .includes("profile")
        ) {
          window.location.href = "index.html";
        }
      } catch (error) {
        console.error("Logout failed:", error.message);
      }
    });
  }

  const loginButton = document.querySelector("#navLogin");

  if (loginButton) {
    loginButton.addEventListener("click", () => {
      showAuthModal();
    });
  }

  getSupabaseClient().auth.onAuthStateChange(
    (_event, session) => {
      updateAuthUI(session?.user ?? null);
    }
  );
});
