document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  if (!user) {
    window.location.href = "booking.html";
    return;
  }

  document.querySelector("#profileName").textContent = user.name;
  document.querySelector("#profileEmail").textContent = user.email;
  document.querySelector("#profileAvatar").textContent = user.name.charAt(0).toUpperCase();

  renderReservations();
});

function renderReservations() {
  const bookings = getUserBookings();
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = bookings.filter((b) => b.endDate >= today);
  const past = bookings.filter((b) => b.endDate < today);

  upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
  past.sort((a, b) => b.startDate.localeCompare(a.startDate));

  const upcomingList = document.querySelector("#upcomingList");
  const pastList = document.querySelector("#pastList");

  if (upcoming.length) {
    upcomingList.innerHTML = upcoming.map(reservationCard).join("");
  }

  if (past.length) {
    pastList.innerHTML = past.map(reservationCard).join("");
  }
}

function reservationCard(booking) {
  const dateText = booking.startDate === booking.endDate
    ? booking.startDate
    : `${booking.startDate} to ${booking.endDate}`;

  return `
    <div class="reservation-card">
      <div class="reservation-card-top">
        <div>
          <span class="pill">${escapeHtml(booking.roomType || "Room")}</span>
          <h3>${escapeHtml(booking.room)}</h3>
        </div>
      </div>
      <dl class="reservation-details">
        <div><dt>Date</dt><dd>${escapeHtml(dateText)}</dd></div>
        <div><dt>Time</dt><dd>${escapeHtml(booking.time)}</dd></div>
        <div><dt>Total</dt><dd>${escapeHtml(booking.total)}</dd></div>
      </dl>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
