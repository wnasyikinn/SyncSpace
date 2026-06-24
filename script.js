const rooms = [
  {
    id: "focus-desk",
    name: "Focus Desk",
    type: "Hot Desk",
    capacity: 1,
    price: 35,
    layout: "Open desk near natural light",
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
    unavailableDates: ["2026-05-15", "2026-05-20", "2026-05-26"]
  },
  {
    id: "studio-four",
    name: "Studio Four",
    type: "Meeting Room",
    capacity: 4,
    price: 90,
    layout: "Round table, display screen, whiteboard",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
    unavailableDates: ["2026-05-15", "2026-05-18", "2026-05-22"]
  },
  {
    id: "launch-room",
    name: "Launch Room",
    type: "Meeting Room",
    capacity: 8,
    price: 160,
    layout: "Boardroom layout with presentation wall",
    image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80",
    unavailableDates: ["2026-05-16", "2026-05-19", "2026-05-25"]
  },
  {
    id: "team-suite",
    name: "Team Suite",
    type: "Private Suite",
    capacity: 12,
    price: 240,
    layout: "Private room, team desks, lockable storage",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
    unavailableDates: ["2026-05-17", "2026-05-18", "2026-05-23"]
  },
  {
    id: "creator-corner",
    name: "Creator Corner",
    type: "Event Space",
    capacity: 30,
    price: 420,
    layout: "Flexible seating for workshops and talks",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    unavailableDates: ["2026-05-15", "2026-05-21", "2026-05-29"]
  }
];

const roomStrip = document.querySelector("#roomStrip");
const roomCount = document.querySelector("#roomCount");
const startDate = document.querySelector("#startDate");
const endDate = document.querySelector("#endDate");
const timeSlot = document.querySelector("#timeSlot");
const roomType = document.querySelector("#roomType");
const peopleCount = document.querySelector("#peopleCount");
const availableOnly = document.querySelector("#availableOnly");
const selectedRoomName = document.querySelector("#selectedRoomName");
const summaryDate = document.querySelector("#summaryDate");
const summaryTime = document.querySelector("#summaryTime");
const summaryTotal = document.querySelector("#summaryTotal");
const bookingForm = document.querySelector("#bookingForm");
const formMessage = document.querySelector("#formMessage");

let selectedRoom = null;

function todayIso() {
  const today = new Date();
  const offsetDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getSelectedDateRange() {
  const from = startDate.value;
  const to = endDate.value || from;
  if (!from) return [];

  const range = [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const finalDate = end < start ? start : end;

  for (const date = new Date(start); date <= finalDate; date.setDate(date.getDate() + 1)) {
    range.push(date.toISOString().slice(0, 10));
  }

  return range;
}

function getBookingDays() {
  return Math.max(getSelectedDateRange().length, 1);
}

function isAvailable(room) {
  return !getSelectedDateRange().some((date) => room.unavailableDates.includes(date));
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0
  }).format(price);
}

function formatDateRange() {
  if (!startDate.value) return "-";
  return startDate.value === endDate.value ? startDate.value : `${startDate.value} to ${endDate.value}`;
}

function getFilteredRooms() {
  const type = roomType.value;
  const people = Number(peopleCount.value || 1);

  return rooms.filter((room) => {
    const matchesType = type === "all" || room.type === type;
    const matchesPeople = room.capacity >= people;
    const matchesAvailability = !availableOnly.checked || isAvailable(room);
    return matchesType && matchesPeople && matchesAvailability;
  });
}

function renderRooms() {
  const filteredRooms = getFilteredRooms();
  roomStrip.innerHTML = "";
  roomCount.textContent = `${filteredRooms.length} room${filteredRooms.length === 1 ? "" : "s"} match your search`;

  if (!filteredRooms.length) {
    roomStrip.innerHTML = '<div class="empty-state">No rooms match these details. Try a different date, room type, or pax count.</div>';
    return;
  }

  filteredRooms.forEach((room) => {
    const available = isAvailable(room);
    const card = document.createElement("article");
    card.className = `room-card ${available ? "" : "is-unavailable"}`;
    card.innerHTML = `
      <img src="${room.image}" alt="${room.name} ${room.type} layout">
      <div class="room-card-body">
        <div class="room-card-top">
          <div>
            <span class="pill">${room.type}</span>
            <h3>${room.name}</h3>
          </div>
          <span class="pill ${available ? "" : "unavailable"}">${available ? "Available" : "Booked"}</span>
        </div>
        <p>${room.layout}</p>
        <div class="room-meta">
          <span>Up to ${room.capacity} people</span>
          <span class="room-price">${formatPrice(room.price)} / booking</span>
        </div>
        <button class="button ${available ? "primary" : "disabled"}" type="button" ${available ? "" : "disabled"} data-room-id="${room.id}">
          ${available ? "Select room" : "Unavailable"}
        </button>
      </div>
    `;
    roomStrip.appendChild(card);
  });
}

function selectRoom(roomId) {
  selectedRoom = rooms.find((room) => room.id === roomId);
  if (!selectedRoom) return;

  selectedRoomName.textContent = selectedRoom.name;
  updateSummary();
  formMessage.textContent = "";
  document.querySelector("#bookingPanel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function updateSummary() {
  summaryDate.textContent = selectedRoom ? formatDateRange() : "-";
  summaryTime.textContent = selectedRoom ? timeSlot.value : "-";
  summaryTotal.textContent = selectedRoom ? `${formatPrice(selectedRoom.price * getBookingDays())} (${getBookingDays()} day${getBookingDays() === 1 ? "" : "s"})` : "-";
}

startDate.min = todayIso();
endDate.min = todayIso();
startDate.value = todayIso();
endDate.value = addDays(todayIso(), 1);
renderRooms();

document.querySelector("#filters").addEventListener("input", (event) => {
  if (event.target === timeSlot && selectedRoom) {
    updateSummary();
    formMessage.textContent = "";
    return;
  }

  if (endDate.value < startDate.value) {
    endDate.value = startDate.value;
  }
  endDate.min = startDate.value;
  selectedRoom = null;
  selectedRoomName.textContent = "Choose a room to continue";
  updateSummary();
  formMessage.textContent = "";
  renderRooms();
});

roomStrip.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-room-id]");
  if (button) selectRoom(button.dataset.roomId);
});

document.querySelector("#scrollLeft").addEventListener("click", () => {
  roomStrip.scrollBy({ left: -380, behavior: "smooth" });
});

document.querySelector("#scrollRight").addEventListener("click", () => {
  roomStrip.scrollBy({ left: 380, behavior: "smooth" });
});

function prefillFromUser() {
  const user = getUser();
  if (user) {
    document.querySelector("#customerName").value = user.name;
    document.querySelector("#customerEmail").value = user.email;
  }
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!selectedRoom) {
    formMessage.textContent = "Select a room before submitting your request.";
    return;
  }

  const user = getUser();
  if (!user) {
    showAuthModal(() => {
      prefillFromUser();
      formMessage.textContent = "You are now logged in. Click Confirm booking again.";
    });
    return;
  }

  const booking = {
    room: selectedRoom.name,
    roomType: selectedRoom.type,
    startDate: startDate.value,
    endDate: endDate.value,
    date: formatDateRange(),
    time: timeSlot.value,
    total: formatPrice(selectedRoom.price * getBookingDays()),
    name: user.name,
    email: user.email
  };

  saveBooking(booking);
  formMessage.textContent = `Booking confirmed for ${booking.room}. Total: ${booking.total}.`;
  bookingForm.reset();
});

document.querySelector("#shareStories").addEventListener("click", () => {
  const url = `${window.location.origin}${window.location.pathname}#stories`;
  const btn = document.querySelector("#shareStories");
  navigator.clipboard.writeText(url).then(() => {
    btn.textContent = "Link copied!";
    setTimeout(() => { btn.innerHTML = '<span class="share-icon">&#x1f517;</span> Share'; }, 2000);
  });
});
