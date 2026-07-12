document.addEventListener("DOMContentLoaded", async () => {
  const user = await getUser();

  if (!user) {
    showAuthModal(() => {
      window.location.reload();
    });

    return;
  }

  const displayName = getDisplayName(user);

  document.querySelector(
    "#profileDisplayName"
  ).textContent = displayName;

  document.querySelector(
    "#profileDisplayEmail"
  ).textContent = user.email ?? "";

  document.querySelector(
    "#avatarInitials"
  ).textContent = createInitials(displayName);

  await renderReservations();
});

function createInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function todayIso() {
  const now = new Date();

  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 10);
}

async function renderReservations() {
  const upcomingList =
    document.querySelector("#upcomingList");

  const pastList =
    document.querySelector("#pastList");

  upcomingList.innerHTML =
    '<div class="empty-state">Loading reservations...</div>';

  pastList.innerHTML =
    '<div class="empty-state">Loading reservations...</div>';

  try {
    const bookings = await getUserBookings();
    const today = todayIso();

    const upcoming = bookings
      .filter((booking) => {
        return (
          booking.end_date >= today &&
          booking.status !== "cancelled"
        );
      })
      .sort((a, b) =>
        a.start_date.localeCompare(b.start_date)
      );

    const past = bookings
      .filter((booking) => {
        return (
          booking.end_date < today ||
          booking.status === "cancelled"
        );
      })
      .sort((a, b) =>
        b.start_date.localeCompare(a.start_date)
      );

    upcomingList.innerHTML = upcoming.length
      ? upcoming.map(reservationCard).join("")
      : `
        <div class="empty-state">
          No upcoming reservations.
          <a href="booking.html">Book a room</a>
          to get started.
        </div>
      `;

    pastList.innerHTML = past.length
      ? past.map(reservationCard).join("")
      : `
        <div class="empty-state">
          No past reservations yet.
        </div>
      `;
  } catch (error) {
    console.error("Unable to load bookings:", error);

    upcomingList.innerHTML = `
      <div class="empty-state">
        Reservations could not be loaded.
      </div>
    `;

    pastList.innerHTML = `
      <div class="empty-state">
        Reservations could not be loaded.
      </div>
    `;
  }
}

function reservationCard(booking) {
  const dateText =
    booking.start_date === booking.end_date
      ? formatDate(booking.start_date)
      : `${formatDate(booking.start_date)} to ` +
        `${formatDate(booking.end_date)}`;

  const status =
    booking.status || "confirmed";

  return `
    <article class="reservation-card">
      <div class="reservation-card-top">
        <div>
          <span class="pill">
            ${escapeHtml(booking.room_type)}
          </span>

          <h3>
            ${escapeHtml(booking.room_name)}
          </h3>
        </div>

        <span class="pill">
          ${escapeHtml(capitalize(status))}
        </span>
      </div>

      <dl class="reservation-details">
        <div>
          <dt>Date</dt>
          <dd>${escapeHtml(dateText)}</dd>
        </div>

        <div>
          <dt>Time</dt>
          <dd>${escapeHtml(booking.time_slot)}</dd>
        </div>

        <div>
          <dt>Total</dt>
          <dd>${escapeHtml(formatPrice(booking.total))}</dd>
        </div>

        <div>
          <dt>Reference</dt>
          <dd>
            ${escapeHtml(
              booking.id.split("-")[0].toUpperCase()
            )}
          </dd>
        </div>
      </dl>
    </article>
  `;
}

function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function capitalize(value) {
  const text = String(value ?? "");

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}
