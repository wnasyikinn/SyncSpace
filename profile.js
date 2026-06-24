const BOOKINGS_KEY = "syncspace_bookings";

const upcomingList = document.querySelector("#upcomingList");
const pastList = document.querySelector("#pastList");
const profileDisplayName = document.querySelector("#profileDisplayName");
const profileDisplayEmail = document.querySelector("#profileDisplayEmail");
const avatarInitials = document.querySelector("#avatarInitials");

function todayIso() {
  const today = new Date();
  const offsetDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function loadProfileInfo() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  profileDisplayName.textContent = user.name;
  profileDisplayEmail.textContent = user.email;
  updateAvatar(user.name);
}

function updateAvatar(name) {
  if (!name || !name.trim()) {
    avatarInitials.textContent = "SS";
    return;
  }
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
  avatarInitials.textContent = initials;
}

function getUserBookings() {
  const user = getCurrentUser();
  if (!user) return [];
  const all = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
  return all.filter(b => b.userId === user.id);
}

function renderBookingItem(b) {
  const isPast = isBookingPast(b);
  return `
    <div class="booking-item ${isPast ? "is-past" : ""}">
      <div class="booking-item-header">
        <h3>${b.room}</h3>
        <span class="pill ${isPast ? "unavailable" : ""}">${isPast ? "Completed" : b.status || "Confirmed"}</span>
      </div>
      <div class="booking-item-details">
        <span><strong>Date:</strong> ${b.date}</span>
        <span><strong>Time:</strong> ${b.time}</span>
        <span><strong>Total:</strong> ${b.total}</span>
      </div>
    </div>
  `;
}

function isBookingPast(b) {
  const bookingEnd = b.endDate || b.startDate || "";
  if (!bookingEnd) return false;
  return bookingEnd < todayIso();
}

function renderBookings() {
  const bookings = getUserBookings();
  const upcoming = bookings.filter(b => !isBookingPast(b));
  const past = bookings.filter(b => isBookingPast(b));

  if (upcoming.length) {
    upcomingList.innerHTML = upcoming.reverse().map(renderBookingItem).join("");
  } else {
    upcomingList.innerHTML = '<div class="empty-state">No upcoming reservations. <a href="booking.html">Book a room</a> to get started.</div>';
  }

  if (past.length) {
    pastList.innerHTML = past.reverse().map(renderBookingItem).join("");
  } else {
    pastList.innerHTML = '<div class="empty-state">No past reservations yet.</div>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfileInfo();
  renderBookings();
});
