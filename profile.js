(() => {
  "use strict";

  console.log("SyncSpace profile script loaded");

  const GET_RESERVATIONS_RPC =
    "get_my_reservations";

  const REQUEST_CANCELLATION_RPC =
    "request_booking_cancellation";

  const profileContent =
    document.querySelector("#profileContent");

  const profilePageMessage =
    document.querySelector("#profilePageMessage");

  const profileDisplayName =
    document.querySelector("#profileDisplayName");

  const profileDisplayEmail =
    document.querySelector("#profileDisplayEmail");

  const avatarInitials =
    document.querySelector("#avatarInitials");

  const profileRoleBadge =
    document.querySelector("#profileRoleBadge");

  const pendingPaymentCount =
    document.querySelector("#pendingPaymentCount");

  const upcomingCount =
    document.querySelector("#upcomingCount");

  const refundCount =
    document.querySelector("#refundCount");

  const pastCount =
    document.querySelector("#pastCount");

  const pendingPaymentList =
    document.querySelector("#pendingPaymentList");

  const upcomingList =
    document.querySelector("#upcomingList");

  const cancellationRefundList =
    document.querySelector("#cancellationRefundList");

  const pastList =
    document.querySelector("#pastList");

  let currentUser = null;
  let currentProfile = null;
  let reservations = [];

  function assertRequiredElements() {
    const requiredElements = {
      profileContent,
      profilePageMessage,
      profileDisplayName,
      profileDisplayEmail,
      avatarInitials,
      profileRoleBadge,
      pendingPaymentCount,
      upcomingCount,
      refundCount,
      pastCount,
      pendingPaymentList,
      upcomingList,
      cancellationRefundList,
      pastList
    };

    const missing = Object
      .entries(requiredElements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Profile page elements were not found: " +
        missing.join(", ")
      );
    }
  }

  function createInitials(name) {
    const initials = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return initials || "SS";
  }

  function escapeHtml(value) {
    const div = document.createElement("div");

    div.textContent =
      String(value ?? "");

    return div.innerHTML;
  }

  function formatPrice(value) {
    return new Intl.NumberFormat(
      "en-MY",
      {
        style: "currency",
        currency: "MYR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(Number(value || 0));
  }

  function formatDate(isoDate) {
    if (!isoDate) {
      return "-";
    }

    const date = new Date(
      `${isoDate}T00:00:00`
    );

    return new Intl.DateTimeFormat(
      "en-MY",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    ).format(date);
  }

  function formatDateRange(
    startDate,
    endDate
  ) {
    if (!startDate || !endDate) {
      return "-";
    }

    if (startDate === endDate) {
      return formatDate(startDate);
    }

    return (
      `${formatDate(startDate)} to ` +
      `${formatDate(endDate)}`
    );
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat(
      "en-MY",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    ).format(date);
  }

  function createReference(id) {
    if (!id) {
      return "-";
    }

    return String(id)
      .split("-")[0]
      .toUpperCase();
  }

  function bookingStatusLabel(status) {
    const labels = {
      pending_payment: "Pending payment",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      expired: "Expired"
    };
  
    return labels[status] || "Unknown";
  }

  function paymentStatusLabel(status) {
    const labels = {
      pending: "Pending",
      paid: "Paid",
      failed: "Failed",
      refunded: "Refunded"
    };
  
    return labels[status] || "Not available";
  }

  function refundStatusLabel(status) {
    const labels = {
      requested:
        "Requested",

      approved:
        "Approved",

      rejected:
        "Rejected",

      processing:
        "Processing",

      refunded:
        "Refunded"
    };

    return labels[status] || "Not requested";
  }

  function statusClass(status) {
    return String(status || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
  }

  function setPageMessage(
    message,
    status = ""
  ) {
    profilePageMessage.textContent =
      message;

    profilePageMessage.dataset.status =
      status;
  }

  function setLoadingState() {
    profileContent.setAttribute(
      "aria-busy",
      "true"
    );

    pendingPaymentList.innerHTML = `
      <div class="empty-state">
        Loading pending payments...
      </div>
    `;

    upcomingList.innerHTML = `
      <div class="empty-state">
        Loading upcoming reservations...
      </div>
    `;

    cancellationRefundList.innerHTML = `
      <div class="empty-state">
        Loading cancellation and refund requests...
      </div>
    `;

    pastList.innerHTML = `
      <div class="empty-state">
        Loading reservation history...
      </div>
    `;
  }

  function setLoadedState() {
    profileContent.setAttribute(
      "aria-busy",
      "false"
    );
  }

  function renderProfileIdentity() {
    const displayName =
      getDisplayName(
        currentUser,
        currentProfile
      );

    profileDisplayName.textContent =
      displayName;

    profileDisplayEmail.textContent =
      currentUser.email || "";

    avatarInitials.textContent =
      createInitials(displayName);

    const role =
      currentProfile?.role === "admin"
        ? "Administrator"
        : "Customer";

    profileRoleBadge.textContent =
      role;

    profileRoleBadge.className =
      currentProfile?.role === "admin"
        ? "pill profile-role-badge status-admin"
        : "pill profile-role-badge";
  }

  async function getReservations() {
    const { data, error } =
      await getSupabaseClient().rpc(
        GET_RESERVATIONS_RPC
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  function getSingleRpcResult(data) {
    if (Array.isArray(data)) {
      return data[0] ?? null;
    }

    return data ?? null;
  }

  async function verifyRefundRequest(
    refundId,
    bookingId
  ) {
    const { data, error } =
      await getSupabaseClient()
        .from("refunds")
        .select(`
          id,
          booking_id,
          status,
          reason,
          requested_at
        `)
        .eq("id", refundId)
        .eq("booking_id", bookingId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "The refund request was returned by the service " +
        "but could not be verified in the database."
      );
    }

    return data;
  }
  
  function classifyReservations() {
    const now = Date.now();
  
    const pendingPayments =
      reservations
        .filter((reservation) => {
          return (
            reservation.booking_status ===
              "pending_payment" &&
            reservation.payment_status ===
              "pending"
          );
        })
        .sort((a, b) =>
          new Date(a.starts_at) -
          new Date(b.starts_at)
        );
  
    const upcoming =
      reservations
        .filter((reservation) => {
          return (
            reservation.booking_status ===
              "confirmed" &&
            new Date(
              reservation.ends_at
            ).getTime() >= now
          );
        })
        .sort((a, b) =>
          new Date(a.starts_at) -
          new Date(b.starts_at)
        );
  
    const cancellationAndRefund =
      reservations
        .filter((reservation) => {
          return Boolean(
            reservation.refund_status
          );
        })
        .sort((a, b) =>
          new Date(b.starts_at) -
          new Date(a.starts_at)
        );
  
    const past =
      reservations
        .filter((reservation) => {
          return [
            "completed",
            "cancelled",
            "expired"
          ].includes(
            reservation.booking_status
          );
        })
        .sort((a, b) =>
          new Date(b.starts_at) -
          new Date(a.starts_at)
        );
  
    return {
      pendingPayments,
      upcoming,
      cancellationAndRefund,
      past
    };
  }

  function renderReservationStats(
    groups
  ) {
    pendingPaymentCount.textContent =
      String(
        groups.pendingPayments.length
      );

    upcomingCount.textContent =
      String(
        groups.upcoming.length
      );

    refundCount.textContent =
      String(
        groups.cancellationAndRefund.length
      );

    pastCount.textContent =
      String(
        groups.past.length
      );
  }

  function createReservationDetails(
    reservation,
    options = {}
  ) {
    const {
      includePayment = true,
      includeRefund = false
    } = options;

    return `
      <dl class="reservation-details">
        <div>
          <dt>Date</dt>

          <dd>
            ${escapeHtml(
              formatDateRange(
                reservation.start_date,
                reservation.end_date
              )
            )}
          </dd>
        </div>

        <div>
          <dt>Time</dt>

          <dd>
            ${escapeHtml(
              reservation.time_slot
            )}
          </dd>
        </div>

        <div>
          <dt>Pax</dt>

          <dd>
            ${escapeHtml(
              reservation.party_size
            )}
          </dd>
        </div>

        <div>
          <dt>Total</dt>

          <dd>
            ${escapeHtml(
              formatPrice(
                reservation.total
              )
            )}
          </dd>
        </div>

        <div>
          <dt>Booking reference</dt>

          <dd>
            ${escapeHtml(
              createReference(
                reservation.id
              )
            )}
          </dd>
        </div>

        ${
          includePayment
            ? `
              <div>
                <dt>Payment</dt>

                <dd>
                  ${escapeHtml(
                    paymentStatusLabel(
                      reservation.payment_status
                    )
                  )}
                </dd>
              </div>
            `
            : ""
        }

        ${
          includeRefund
            ? `
              <div>
                <dt>Refund</dt>

                <dd>
                  ${escapeHtml(
                    refundStatusLabel(
                      reservation.refund_status
                    )
                  )}
                </dd>
              </div>
            `
            : ""
        }
      </dl>
    `;
  }

  function createReservationHeading(
    reservation
  ) {
    return `
      <div>
        <span class="pill">
          ${escapeHtml(
            reservation.workspace_type
          )}
        </span>

        <h3>
          ${escapeHtml(
            reservation.workspace_name
          )}
        </h3>

        <p class="reservation-unit-code">
          Unit
          ${escapeHtml(
            reservation.unit_code
          )}
        </p>
      </div>
    `;
  }

  function pendingPaymentCard(
    reservation
  ) {
    const paymentUrl =
      `payment.html?booking=` +
      encodeURIComponent(
        reservation.id
      );

    return `
      <article
        class="reservation-card"
        data-booking-id="${escapeHtml(
          reservation.id
        )}"
      >
        <div class="reservation-card-top">
          ${createReservationHeading(
            reservation
          )}

          <span
            class="pill status-pending-payment"
          >
            Pending payment
          </span>
        </div>

        ${createReservationDetails(
          reservation
        )}

        <div class="reservation-card-actions">
          <a
            class="button primary"
            href="${escapeHtml(paymentUrl)}"
          >
            Continue payment
          </a>
        </div>
      </article>
    `;
  }

  function upcomingReservationCard(
    reservation
  ) {
    const openRefundStatuses = [
      "requested",
      "approved",
      "processing"
    ];
  
    const hasOpenRequest =
      openRefundStatuses.includes(
        reservation.refund_status
      );
  
    const startsAt =
      new Date(
        reservation.starts_at
      ).getTime();
  
    const hasStarted =
      Number.isFinite(startsAt) &&
      startsAt <= Date.now();
  
    let action;
  
    if (hasOpenRequest) {
      action = `
        <button
          type="button"
          class="button secondary"
          disabled
        >
          Cancellation request submitted
        </button>
      `;
    } else if (hasStarted) {
      action = `
        <button
          type="button"
          class="button secondary"
          disabled
        >
          Cancellation unavailable after start
        </button>
      `;
    } else {
      action = `
        <button
          type="button"
          class="button secondary cancel-booking-button"
          data-cancel-booking-id="${escapeHtml(
            reservation.id
          )}"
        >
          Request cancellation
        </button>
      `;
    }
  
    return `
      <article
        class="reservation-card"
        data-booking-id="${escapeHtml(
          reservation.id
        )}"
      >
        <div class="reservation-card-top">
          ${createReservationHeading(
            reservation
          )}
  
          <span class="pill status-confirmed">
            Confirmed
          </span>
        </div>
  
        ${createReservationDetails(
          reservation
        )}
  
        <div class="reservation-card-actions">
          ${action}
        </div>
      </article>
    `;
  }

  function cancellationRefundCard(
    reservation
  ) {
    const bookingStatus =
      bookingStatusLabel(
        reservation.booking_status
      );

    const refundStatus =
      refundStatusLabel(
        reservation.refund_status
      );

    return `
      <article
        class="reservation-card"
        data-booking-id="${escapeHtml(
          reservation.id
        )}"
      >
        <div class="reservation-card-top">
          ${createReservationHeading(
            reservation
          )}

          <span
            class="pill status-${escapeHtml(
              statusClass(
                reservation.refund_status ||
                reservation.booking_status
              )
            )}"
          >
            ${escapeHtml(
              reservation.refund_status
                ? refundStatus
                : bookingStatus
            )}
          </span>
        </div>

        ${createReservationDetails(
          reservation,
          {
            includePayment: true,
            includeRefund: true
          }
        )}

        <div class="reservation-status-note">
          <strong>Current status:</strong>

          ${escapeHtml(bookingStatus)}

          ${
            reservation.refund_status
              ? ` — Refund ${escapeHtml(
                  refundStatus.toLowerCase()
                )}`
              : ""
          }
        </div>
      </article>
    `;
  }

  function pastReservationCard(
    reservation
  ) {
    const displayedStatus =
      bookingStatusLabel(
        reservation.booking_status
      );

    return `
      <article
        class="reservation-card"
        data-booking-id="${escapeHtml(
          reservation.id
        )}"
      >
        <div class="reservation-card-top">
          ${createReservationHeading(
            reservation
          )}

          <span
            class="pill status-${escapeHtml(
              statusClass(
                reservation.booking_status
              )
            )}"
          >
            ${escapeHtml(
              displayedStatus
            )}
          </span>
        </div>

        ${createReservationDetails(
          reservation,
          {
            includePayment: true,
            includeRefund:
              Boolean(
                reservation.refund_status
              )
          }
        )}

        <p class="reservation-completed-at">
          Reservation ended:
          ${escapeHtml(
            formatDateTime(
              reservation.ends_at
            )
          )}
        </p>
      </article>
    `;
  }

  function renderPendingPayments(
    pendingPayments
  ) {
    pendingPaymentList.innerHTML =
      pendingPayments.length
        ? pendingPayments
            .map(pendingPaymentCard)
            .join("")
        : `
          <div class="empty-state">
            You have no pending payments.
          </div>
        `;
  }

  function renderUpcomingReservations(
    upcoming
  ) {
    upcomingList.innerHTML =
      upcoming.length
        ? upcoming
            .map(
              upcomingReservationCard
            )
            .join("")
        : `
          <div class="empty-state">
            No upcoming reservations.
            <a href="booking.html">
              Book a workspace
            </a>
            to get started.
          </div>
        `;
  }

  function renderCancellationRefunds(
    cancellationAndRefund
  ) {
    cancellationRefundList.innerHTML =
      cancellationAndRefund.length
        ? cancellationAndRefund
            .map(
              cancellationRefundCard
            )
            .join("")
        : `
          <div class="empty-state">
            No cancellation or refund requests.
          </div>
        `;
  }

  function renderPastReservations(
    past
  ) {
    pastList.innerHTML =
      past.length
        ? past
            .map(pastReservationCard)
            .join("")
        : `
          <div class="empty-state">
            No past reservations yet.
          </div>
        `;
  }

  function renderReservations() {
    const groups =
      classifyReservations();

    renderReservationStats(groups);

    renderPendingPayments(
      groups.pendingPayments
    );

    renderUpcomingReservations(
      groups.upcoming
    );

    renderCancellationRefunds(
      groups.cancellationAndRefund
    );

    renderPastReservations(
      groups.past
    );
  }

  async function refreshReservations() {
    reservations =
      await getReservations();

    renderReservations();

    return reservations;
  }

  async function loadReservations() {
    setLoadingState();
    setPageMessage("");

    try {
      await refreshReservations();
    } catch (error) {
      console.error(
        "Unable to load reservations:",
        error
      );

      setPageMessage(
        error.message ||
        "Reservations could not be loaded.",
        "error"
      );

      pendingPaymentList.innerHTML = `
        <div class="empty-state">
          Pending payments could not be loaded.
        </div>
      `;

      upcomingList.innerHTML = `
        <div class="empty-state">
          Upcoming reservations could not be loaded.
        </div>
      `;

      cancellationRefundList.innerHTML = `
        <div class="empty-state">
          Cancellation and refund information
          could not be loaded.
        </div>
      `;

      pastList.innerHTML = `
        <div class="empty-state">
          Reservation history could not be loaded.
        </div>
      `;
    } finally {
      setLoadedState();
    }
  }

  function showCancellationDialog(
    reservation
  ) {
    return new Promise((resolve) => {
      if (
        document.querySelector(
          ".cancellation-overlay"
        )
      ) {
        resolve(null);
        return;
      }

      const overlay =
        document.createElement("div");

      overlay.className =
        "auth-overlay cancellation-overlay";

      overlay.innerHTML = `
        <div
          class="auth-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancellationTitle"
        >
          <button
            type="button"
            class="auth-close"
            aria-label="Close cancellation request"
          >
            &times;
          </button>

          <p class="eyebrow">
            Cancellation request
          </p>

          <h2 id="cancellationTitle">
            Cancel
            ${escapeHtml(
              reservation.workspace_name
            )}?
          </h2>

          <p>
            The reservation will remain active until
            SyncSpace reviews the cancellation and refund request.
          </p>

          <form
            class="auth-form"
            id="cancellationForm"
          >
            <label>
              <span>Reason for cancellation</span>

              <textarea
                id="cancellationReason"
                rows="5"
                maxlength="500"
                placeholder="Explain why you need to cancel this reservation."
                required
              ></textarea>
            </label>

            <div class="reservation-card-actions">
              <button
                type="button"
                class="button secondary"
                id="keepReservationButton"
              >
                Keep reservation
              </button>

              <button
                type="submit"
                class="button primary"
              >
                Submit request
              </button>
            </div>

            <p
              class="auth-message"
              id="cancellationMessage"
              role="status"
              aria-live="polite"
            ></p>
          </form>
        </div>
      `;

      document.body.appendChild(
        overlay
      );

      const form =
        overlay.querySelector(
          "#cancellationForm"
        );

      const reasonInput =
        overlay.querySelector(
          "#cancellationReason"
        );

      const closeButton =
        overlay.querySelector(
          ".auth-close"
        );

      const keepButton =
        overlay.querySelector(
          "#keepReservationButton"
        );

      const previousOverflow =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      function closeDialog(result) {
        document.removeEventListener(
          "keydown",
          handleEscape
        );

        document.body.style.overflow =
          previousOverflow;

        overlay.remove();
        resolve(result);
      }

      function handleEscape(event) {
        if (event.key === "Escape") {
          closeDialog(null);
        }
      }

      document.addEventListener(
        "keydown",
        handleEscape
      );

      closeButton.addEventListener(
        "click",
        () => closeDialog(null)
      );

      keepButton.addEventListener(
        "click",
        () => closeDialog(null)
      );

      overlay.addEventListener(
        "click",
        (event) => {
          if (event.target === overlay) {
            closeDialog(null);
          }
        }
      );

      form.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();

          const reason =
            reasonInput.value.trim();

          if (!reason) {
            reasonInput.focus();
            return;
          }

          closeDialog(reason);
        }
      );

      window.setTimeout(() => {
        reasonInput.focus();
      }, 0);
    });
  }

  async function requestCancellation(
    bookingId,
    button
  ) {
    const reservation =
      reservations.find(
        (item) =>
          item.id === bookingId
      );

    if (!reservation) {
      setPageMessage(
        "The selected reservation could not be found.",
        "error"
      );

      return;
    }

    const reason =
      await showCancellationDialog(
        reservation
      );

    if (!reason) {
      return;
    }

    button.disabled = true;

    setPageMessage(
      "Submitting your cancellation and refund request...",
      "loading"
    );

    try {
      const client =
        getSupabaseClient();

      const { data, error } =
        await client.rpc(
          REQUEST_CANCELLATION_RPC,
          {
            p_booking_id:
              bookingId,

            p_reason:
              reason
          }
        );

      if (error) {
        throw error;
      }

      const result =
        getSingleRpcResult(data);

      /*
       * The database RPC must return the created
       * refund ID and requested refund status.
       */
      if (
        !result?.refund_id ||
        String(result.booking_id) !==
          String(bookingId) ||
        result.refund_status !==
          "requested"
      ) {
        console.error(
          "Unexpected cancellation RPC result:",
          data
        );

        throw new Error(
          "The cancellation service did not create " +
          "a valid refund request."
        );
      }

      /*
       * Verify that the refund record can actually
       * be retrieved from the refunds table.
       */
      const savedRefund =
        await verifyRefundRequest(
          result.refund_id,
          bookingId
        );

      if (
        savedRefund.status !==
        "requested"
      ) {
        throw new Error(
          "The refund request was created with an " +
          "unexpected status."
        );
      }

      /*
       * Reload the reservation RPC without swallowing
       * refresh errors.
       */
      await refreshReservations();

      const refreshedReservation =
        reservations.find(
          (item) =>
            item.id === bookingId
        );

      /*
       * Confirm that get_my_reservations() now returns
       * the refund request for the selected booking.
       */
      if (
        !refreshedReservation ||
        refreshedReservation.refund_status !==
          "requested"
      ) {
        throw new Error(
          "The refund request was saved, but the " +
          "updated reservation status could not be loaded."
        );
      }

      setPageMessage(
        "Your cancellation and refund request was submitted successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Cancellation request failed:",
        error
      );

      setPageMessage(
        error.message ||
        "The cancellation request could not be submitted.",
        "error"
      );

      /*
       * The original button may have been replaced if
       * the reservation cards were rerendered.
       */
      if (button.isConnected) {
        button.disabled = false;
      }
    }
  }

  function handleUpcomingListClick(
    event
  ) {
    const button =
      event.target.closest(
        "[data-cancel-booking-id]"
      );

    if (!button) {
      return;
    }

    void requestCancellation(
      button.dataset.cancelBookingId,
      button
    );
  }

  async function initializeProfilePage() {
    assertRequiredElements();

    currentUser =
      await requireAuthenticatedUser(
        "index.html"
      );

    if (!currentUser) {
      return;
    }

    currentProfile =
      await getUserProfile(
        currentUser
      );

    renderProfileIdentity();

    upcomingList.addEventListener(
      "click",
      handleUpcomingListClick
    );

    await loadReservations();
  }

  async function start() {
    try {
      await initializeProfilePage();
    } catch (error) {
      console.error(
        "Profile page initialization failed:",
        error
      );

      setPageMessage(
        error.message ||
        "The profile page could not be loaded.",
        "error"
      );

      setLoadedState();
    }
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );
  } else {
    void start();
  }
})();
