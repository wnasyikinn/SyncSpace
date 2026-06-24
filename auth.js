const AUTH_KEY = "syncspace_auth";
const USERS_KEY = "syncspace_users";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
}

function setCurrentUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  updateAuthUI();
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  updateAuthUI();
  if (window.location.pathname.includes("profile.html")) {
    window.location.href = "index.html";
  }
}

function signup(name, email, password) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return { ok: false, message: "An account with this email already exists." };
  }
  const user = { id: Date.now().toString(), name, email, password };
  users.push(user);
  saveUsers(users);
  setCurrentUser({ id: user.id, name: user.name, email: user.email });
  return { ok: true };
}

function login(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return { ok: false, message: "Invalid email or password." };
  }
  setCurrentUser({ id: user.id, name: user.name, email: user.email });
  return { ok: true };
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function requireAuth() {
  if (!isLoggedIn()) {
    openAuthModal("login");
    return false;
  }
  return true;
}

function openAuthModal(mode) {
  const modal = document.querySelector("#authModal");
  if (!modal) return;
  modal.classList.add("is-open");
  switchAuthMode(mode || "login");
}

function closeAuthModal() {
  const modal = document.querySelector("#authModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  const msg = document.querySelector("#authMessage");
  if (msg) msg.textContent = "";
}

function switchAuthMode(mode) {
  const title = document.querySelector("#authTitle");
  const submitBtn = document.querySelector("#authSubmit");
  const toggle = document.querySelector("#authToggle");
  const nameField = document.querySelector("#authNameGroup");
  const form = document.querySelector("#authForm");

  if (!title) return;

  if (mode === "signup") {
    title.textContent = "Create your account";
    submitBtn.textContent = "Sign up";
    toggle.innerHTML = 'Already have an account? <a href="#" data-auth-mode="login">Log in</a>';
    nameField.style.display = "";
    form.dataset.mode = "signup";
  } else {
    title.textContent = "Log in to SyncSpace";
    submitBtn.textContent = "Log in";
    toggle.innerHTML = 'Don\'t have an account? <a href="#" data-auth-mode="signup">Sign up</a>';
    nameField.style.display = "none";
    form.dataset.mode = "login";
  }
  const msg = document.querySelector("#authMessage");
  if (msg) msg.textContent = "";
}

function updateAuthUI() {
  const user = getCurrentUser();
  document.querySelectorAll("[data-auth-logged-in]").forEach(el => {
    el.style.display = user ? "" : "none";
  });
  document.querySelectorAll("[data-auth-logged-out]").forEach(el => {
    el.style.display = user ? "none" : "";
  });
  document.querySelectorAll("[data-auth-user-name]").forEach(el => {
    el.textContent = user ? user.name : "";
  });
}

function initAuth() {
  updateAuthUI();

  const form = document.querySelector("#authForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const mode = form.dataset.mode;
      const email = document.querySelector("#authEmail").value.trim();
      const password = document.querySelector("#authPassword").value;
      const msg = document.querySelector("#authMessage");

      if (mode === "signup") {
        const name = document.querySelector("#authName").value.trim();
        if (!name) { msg.textContent = "Please enter your name."; return; }
        const result = signup(name, email, password);
        if (!result.ok) { msg.textContent = result.message; return; }
      } else {
        const result = login(email, password);
        if (!result.ok) { msg.textContent = result.message; return; }
      }
      closeAuthModal();
      if (typeof onAuthSuccess === "function") onAuthSuccess();
    });
  }

  const modal = document.querySelector("#authModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeAuthModal();
      const modeLink = e.target.closest("[data-auth-mode]");
      if (modeLink) {
        e.preventDefault();
        switchAuthMode(modeLink.dataset.authMode);
      }
    });
  }

  document.querySelectorAll("[data-auth-login]").forEach(el => {
    el.addEventListener("click", (e) => { e.preventDefault(); openAuthModal("login"); });
  });
  document.querySelectorAll("[data-auth-signup]").forEach(el => {
    el.addEventListener("click", (e) => { e.preventDefault(); openAuthModal("signup"); });
  });
  document.querySelectorAll("[data-auth-logout]").forEach(el => {
    el.addEventListener("click", (e) => { e.preventDefault(); logout(); });
  });
  document.querySelectorAll("[data-auth-close]").forEach(el => {
    el.addEventListener("click", (e) => { e.preventDefault(); closeAuthModal(); });
  });
}

document.addEventListener("DOMContentLoaded", initAuth);
