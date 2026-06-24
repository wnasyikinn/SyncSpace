const AUTH_KEY = "syncspace_user";
const BOOKINGS_KEY = "syncspace_bookings";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
}

function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBooking(booking) {
  const bookings = getBookings();
  booking.id = Date.now().toString(36);
  booking.createdAt = new Date().toISOString();
  bookings.push(booking);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  return booking;
}

function getUserBookings() {
  const user = getUser();
  if (!user) return [];
  return getBookings().filter((b) => b.email === user.email);
}

function showAuthModal(onSuccess) {
  if (document.querySelector(".auth-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "auth-overlay";
  overlay.innerHTML = `
    <div class="auth-modal">
      <button type="button" class="auth-close" aria-label="Close">&times;</button>
      <div class="auth-tabs">
        <button type="button" class="auth-tab active" data-tab="login">Log in</button>
        <button type="button" class="auth-tab" data-tab="signup">Sign up</button>
      </div>
      <form class="auth-form" id="loginForm">
        <label>
          <span>Email</span>
          <input type="email" id="authEmail" placeholder="you@example.com" required>
        </label>
        <label>
          <span>Password</span>
          <input type="password" id="authPassword" placeholder="Your password" required minlength="6">
        </label>
        <button class="button primary" type="submit">Log in</button>
        <p class="auth-message" id="authMessage" role="status"></p>
      </form>
      <form class="auth-form" id="signupForm" style="display:none">
        <label>
          <span>Full name</span>
          <input type="text" id="signupName" placeholder="Your name" required>
        </label>
        <label>
          <span>Email</span>
          <input type="email" id="signupEmail" placeholder="you@example.com" required>
        </label>
        <label>
          <span>Password</span>
          <input type="password" id="signupPassword" placeholder="Min 6 characters" required minlength="6">
        </label>
        <button class="button primary" type="submit">Create account</button>
        <p class="auth-message" id="signupMessage" role="status"></p>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector(".auth-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      overlay.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const isLogin = tab.dataset.tab === "login";
      overlay.querySelector("#loginForm").style.display = isLogin ? "" : "none";
      overlay.querySelector("#signupForm").style.display = isLogin ? "none" : "";
    });
  });

  const USERS_KEY = "syncspace_users";
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }

  overlay.querySelector("#signupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = overlay.querySelector("#signupName").value.trim();
    const email = overlay.querySelector("#signupEmail").value.trim().toLowerCase();
    const password = overlay.querySelector("#signupPassword").value;
    const msg = overlay.querySelector("#signupMessage");

    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      msg.textContent = "An account with this email already exists.";
      return;
    }

    users.push({ name, email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    setUser({ name, email });
    overlay.remove();
    updateAuthUI();
    if (onSuccess) onSuccess();
  });

  overlay.querySelector("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = overlay.querySelector("#authEmail").value.trim().toLowerCase();
    const password = overlay.querySelector("#authPassword").value;
    const msg = overlay.querySelector("#authMessage");

    const users = getUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) {
      msg.textContent = "Invalid email or password.";
      return;
    }

    setUser({ name: found.name, email: found.email });
    overlay.remove();
    updateAuthUI();
    if (onSuccess) onSuccess();
  });
}

function updateAuthUI() {
  const user = getUser();
  const profileLink = document.querySelector("#navProfile");
  const logoutBtn = document.querySelector("#navLogout");
  const loginBtn = document.querySelector("#navLogin");

  if (profileLink) {
    profileLink.style.display = user ? "" : "none";
    if (user) profileLink.textContent = user.name.split(" ")[0];
  }
  if (logoutBtn) {
    logoutBtn.style.display = user ? "" : "none";
  }
  if (loginBtn) {
    loginBtn.style.display = user ? "none" : "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();

  const logoutBtn = document.querySelector("#navLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutUser();
      updateAuthUI();
      if (window.location.pathname.includes("profile")) {
        window.location.href = "index.html";
      }
    });
  }

  const loginBtn = document.querySelector("#navLogin");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => showAuthModal());
  }
});
