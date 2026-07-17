(() => {
  "use strict";

  console.log("SyncSpace booking script loaded");

  const AVAILABILITY_RPC = "get_workspace_availability";
  const CREATE_BOOKING_RPC = "create_pending_booking";
  const PAYMENT_PAGE = "payment.html";
  const PENDING_BOOKING_KEY =
    "syncspace_pending_booking_id";

  const roomStrip =
    document.querySelector("#roomStrip");

  const roomCount =
    document.querySelector("#roomCount");

  const filtersForm =
    document.querySelector("#filters");

  const startDate =
    document.querySelector("#startDate");

  const endDate =
    document.querySelector("#endDate");

  const timeSlot =
    document.querySelector("#timeSlot");

  const roomType =
    document.querySelector("#roomType");

  const branchFilter =
  document.querySelector("#branchFilter");

  const peopleCount =
    document.querySelector("#peopleCount");

  const availableOnly =
    document.querySelector("#availableOnly");

  const selectedRoomName =
    document.querySelector("#selectedRoomName");

  const summaryDate =
    document.querySelector("#summaryDate");

  const summaryTime =
    document.querySelector("#summaryTime");

  const summaryTotal =
    document.querySelector("#summaryTotal");

  const bookingPanel =
    document.querySelector("#bookingPanel");

  const bookingForm =
    document.querySelector("#bookingForm");

  const formMessage =
    document.querySelector("#formMessage");

  const customerName =
    document.querySelector("#customerName");

  const customerEmail =
    document.querySelector("#customerEmail");

  const scrollLeftButton =
    document.querySelector("#scrollLeft");

  const scrollRightButton =
    document.querySelector("#scrollRight");

  const shareButton =
    document.querySelector("#shareStories");

  let workspaces = [];
  let selectedWorkspace = null;
  let searchRequestNumber = 0;
  let searchTimer = null;

  function assertRequiredElements() {
    const requiredElements = {
      roomStrip,
      roomCount,
      filtersForm,
      startDate,
      endDate,
      timeSlot,
      roomType,
      peopleCount,
      branchFilter,
      availableOnly,
      selectedRoomName,
      summaryDate,
      summaryTime,
      summaryTotal,
      bookingPanel,
      bookingForm,
      formMessage,
      customerName,
      customerEmail,
      scrollLeftButton,
      scrollRightButton
    };

    const missing = Object
      .entries(requiredElements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Booking page elements were not found: " +
        missing.join(", ")
      );
    }
  }

  function todayIso() {
    const now = new Date();

    const localDate = new Date(
      now.getTime() -
      now.getTimezoneOffset() * 60000
    );

    return localDate
      .toISOString()
      .slice(0, 10);
  }

  function getBookingDays() {
    if (
      !startDate.value ||
      !endDate.value
    ) {
      return 1;
    }

    const start = new Date(
      `${startDate.value}T00:00:00`
    );

    const end = new Date(
      `${endDate.value}T00:00:00`
    );

    const millisecondsPerDay =
      24 * 60 * 60 * 1000;

    return Math.max(
      Math.floor(
        (end - start) /
        millisecondsPerDay
      ) + 1,
      1
    );
  }

  function getSearchValues() {
    return {
      startDate:
        startDate.value,

      endDate:
        endDate.value,

      timeSlot:
        timeSlot.value,

      roomType:
        roomType.value,

      partySize:
        Number(
          peopleCount.value || 1
        )
    };
  }

  function validateSearchValues() {
    const values =
      getSearchValues();

    const today =
      todayIso();

    if (
      !values.startDate ||
      !values.endDate
    ) {
      throw new Error(
        "Select a start date and end date."
      );
    }

    if (
      values.startDate < today
    ) {
      throw new Error(
        "The start date cannot be in the past."
      );
    }

    if (
      values.endDate <
      values.startDate
    ) {
      throw new Error(
        "The end date cannot be before the start date."
      );
    }

    if (!values.timeSlot) {
      throw new Error(
        "Select a booking time."
      );
    }

    if (
      !Number.isInteger(
        values.partySize
      ) ||
      values.partySize < 1
    ) {
      throw new Error(
        "Enter a valid number of people."
      );
    }

    return values;
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
    ).format(
      Number(value || 0)
    );
  }

  function formatDate(isoDate) {
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

  function formatDateRange() {
    if (
      !startDate.value ||
      !endDate.value
    ) {
      return "-";
    }

    if (
      startDate.value ===
      endDate.value
    ) {
      return formatDate(
        startDate.value
      );
    }

    return (
      `${formatDate(
        startDate.value
      )} to ` +
      `${formatDate(
        endDate.value
      )}`
    );
  }

  function escapeHtml(value) {
    const div =
      document.createElement("div");

    div.textContent =
      String(value ?? "");

    return div.innerHTML;
  }

  function safeImageUrl(value) {
    try {
      const url = new URL(
        String(value || ""),
        window.location.href
      );

      if (
        ["http:", "https:"]
          .includes(url.protocol)
      ) {
        return url.href;
      }
    } catch {
      // Use the local fallback below.
    }

    return (
      "assets/" +
      "syncspace-logo-mark.png"
    );
  }

  function toBoolean(value) {
    return (
      value === true ||
      value === 1 ||
      value === "true"
    );
  }

  function normalizeWorkspace(row) {
    return {
      id:
        String(
          row.workspace_id ??
          row.id ??
          ""
        ),

      unitCode:
        String(
          row.unit_code ??
          ""
        ),

      name:
        String(
          row.workspace_name ??
          row.name ??
          "Workspace"
        ),

      type:
        String(
          row.workspace_type ??
          row.room_type ??
          "Workspace"
        ),

      layout:
        String(
          row.layout ??
          row.description ??
          "Workspace details available on request."
        ),

      capacity:
        Number(
          row.capacity ?? 1
        ),

      price:
        Number(
          row.price ??
          row.base_price ??
          0
        ),

      image:
        safeImageUrl(
          row.image_url ??
          row.image
        ),

      available:
        toBoolean(
          row.is_available ??
          row.available
        ),

      unavailableReason:
        String(
          row.unavailable_reason ??
          "Already reserved"
        )
    };
  }

  function setFormMessage(
    message,
    status = ""
  ) {
    formMessage.textContent =
      message;

    formMessage.dataset.status =
      status;
  }

  function resetSelectedWorkspace() {
    selectedWorkspace = null;

    selectedRoomName.textContent =
      "Choose a workspace to continue";

    summaryDate.textContent =
      "-";

    summaryTime.textContent =
      "-";

    summaryTotal.textContent =
      "-";

    setFormMessage("");
  }

  function updateSummary() {
    if (!selectedWorkspace) {
      resetSelectedWorkspace();
      return;
    }

    const estimatedTotal =
      selectedWorkspace.price *
      getBookingDays();

    const displayName =
      selectedWorkspace.unitCode
        ? (
          `${selectedWorkspace.name} ` +
          `(${selectedWorkspace.unitCode})`
        )
        : selectedWorkspace.name;

    selectedRoomName.textContent =
      displayName;

    summaryDate.textContent =
      formatDateRange();

    summaryTime.textContent =
      timeSlot.value;

    summaryTotal.textContent =
      `${formatPrice(
        estimatedTotal
      )} estimated`;
  }

  function renderWorkspaces() {
    const visibleWorkspaces =
      availableOnly.checked
        ? workspaces.filter(
          (workspace) =>
            workspace.available
        )
        : workspaces;

    const availableCount =
      workspaces.filter(
        (workspace) =>
          workspace.available
      ).length;

    roomCount.textContent =
      `${availableCount} available of ` +
      `${workspaces.length} matching ` +
      `workspace${
        workspaces.length === 1
          ? ""
          : "s"
      }`;

    roomStrip.innerHTML = "";

    if (
      visibleWorkspaces.length === 0
    ) {
      roomStrip.innerHTML = `
        <div class="empty-state">
          No workspaces are available for the selected
          date, time, workspace type, and number of people.
        </div>
      `;

      return;
    }

    visibleWorkspaces.forEach(
      (workspace) => {
        const card =
          document.createElement(
            "article"
          );

        card.className =
          `room-card ${
            workspace.available
              ? ""
              : "is-unavailable"
          }`;

        const title =
          workspace.unitCode
            ? (
              `${workspace.name} — ` +
              `${workspace.unitCode}`
            )
            : workspace.name;

        card.innerHTML = `
          <img
            src="${escapeHtml(
              workspace.image
            )}"
            alt="${escapeHtml(
              `${title} ${workspace.type}`
            )}"
          >

          <div class="room-card-body">
            <div class="room-card-top">
              <div>
                <span class="pill">
                  ${escapeHtml(
                    workspace.type
                  )}
                </span>

                <h3>
                  ${escapeHtml(title)}
                </h3>
              </div>

              <span
                class="pill ${
                  workspace.available
                    ? ""
                    : "unavailable"
                }"
              >
                ${
                  workspace.available
                    ? "Available"
                    : "Unavailable"
                }
              </span>
            </div>

            <p>
              ${escapeHtml(
                workspace.layout
              )}
            </p>

            <div class="room-meta">
              <span>
                Maximum
                ${escapeHtml(
                  workspace.capacity
                )}
                pax
              </span>

              <span class="room-price">
                ${escapeHtml(
                  formatPrice(
                    workspace.price
                  )
                )}
                / booked day for selected time
              </span>
            </div>

            ${
              workspace.available
                ? ""
                : `
                  <p class="availability-note">
                    ${escapeHtml(
                      workspace.unavailableReason
                    )}
                  </p>
                `
            }

            <div class="room-card-actions">
              <a
                class="button secondary"
                href="workspace.html?id=${encodeURIComponent(
                  workspace.id
                )}"
              >
                View details
              </a>

              <button
                class="button ${
                  workspace.available
                    ? "primary"
                    : "disabled"
                }"
                type="button"
                data-workspace-id="${escapeHtml(
                  workspace.id
                )}"
                ${
                  workspace.available
                    ? ""
                    : "disabled"
                }
              >
                ${
                  workspace.available
                    ? "Select workspace"
                    : "Not available"
                }
              </button>
            </div>
          </div>
        `;

        roomStrip.appendChild(
          card
        );
      }
    );
  }

  async function loadWorkspaceAvailability() {
    const requestNumber =
      ++searchRequestNumber;

    const search =
      validateSearchValues();

    roomCount.textContent =
      "Checking workspace availability...";

    roomStrip.innerHTML = `
      <div class="empty-state">
        Loading workspaces...
      </div>
    `;

    const { data, error } =
      await getSupabaseClient().rpc(
        AVAILABILITY_RPC,
        {
          p_start_date:
            search.startDate,

          p_end_date:
            search.endDate,

          p_time_slot:
            search.timeSlot,

          p_room_type:
            search.roomType === "all"
              ? null
              : search.roomType,

          p_party_size:
            search.partySize

          p_branch_id:
            branchFilter.value === "all"
              ? null
              : branchFilter.value
        }
      );

    if (
      requestNumber !==
      searchRequestNumber
    ) {
      return;
    }

    if (error) {
      console.error(
        "Availability check failed:",
        error
      );

      if (
        error.message?.includes(
          AVAILABILITY_RPC
        ) ||
        error.code === "PGRST202"
      ) {
        throw new Error(
          "The workspace availability database " +
          "function has not been configured yet."
        );
      }

      throw error;
    }

    workspaces =
      (data ?? []).map(
        normalizeWorkspace
      );

    renderWorkspaces();
  }

  function scheduleAvailabilityRefresh(
    delay = 250
  ) {
    window.clearTimeout(
      searchTimer
    );

    /*
     * The booking criteria changed, so the previous
     * workspace selection is no longer valid.
     */
    resetSelectedWorkspace();

    searchTimer =
      window.setTimeout(
        async () => {
          try {
            await loadWorkspaceAvailability();
          } catch (error) {
            console.error(error);

            roomCount.textContent =
              "Availability could not be checked.";

            roomStrip.innerHTML = `
              <div class="empty-state">
                ${escapeHtml(
                  error.message ||
                  "Unable to load workspace availability."
                )}
              </div>
            `;
          }
        },
        delay
      );
  }

  function selectWorkspace(
    workspaceId
  ) {
    const workspace =
      workspaces.find(
        (item) =>
          item.id === workspaceId
      );

    if (
      !workspace ||
      !workspace.available
    ) {
      setFormMessage(
        "This workspace is no longer available. " +
        "Refresh the search and choose another workspace.",
        "error"
      );

      return;
    }

    selectedWorkspace =
      workspace;

    updateSummary();

    setFormMessage("");

    bookingPanel.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  async function prefillFromUser(
    providedUser = undefined
  ) {
    const user =
      providedUser === undefined
        ? await getUser()
        : providedUser;

    if (!user) {
      customerName.value = "";
      customerEmail.value = "";
      return;
    }

    const profile =
      await getUserProfile(user);

    customerName.value =
      getDisplayName(
        user,
        profile
      );

    customerEmail.value =
      user.email ?? "";
  }

  async function createPendingBookingAndContinue() {
    if (!selectedWorkspace) {
      setFormMessage(
        "Select an available workspace before continuing.",
        "error"
      );

      return;
    }

    const search =
      validateSearchValues();

    const user =
      await getUser();

    if (!user) {
      showAuthModal(
        async (signedInUser) => {
          await prefillFromUser(
            signedInUser
          );

          await createPendingBookingAndContinue();
        }
      );

      return;
    }

    const submitButton =
      bookingForm.querySelector(
        'button[type="submit"]'
      );

    if (!submitButton) {
      throw new Error(
        "The booking submit button was not found."
      );
    }

    submitButton.disabled =
      true;

    setFormMessage(
      "Reserving the workspace and preparing payment...",
      "loading"
    );

    try {
      const { data, error } =
        await getSupabaseClient().rpc(
          CREATE_BOOKING_RPC,
          {
            p_workspace_id:
              selectedWorkspace.id,

            p_start_date:
              search.startDate,

            p_end_date:
              search.endDate,

            p_time_slot:
              search.timeSlot,

            p_party_size:
              search.partySize
          }
        );

      if (error) {
        throw error;
      }

      const booking =
        Array.isArray(data)
          ? data[0]
          : data;

      const bookingId =
        booking?.id ??
        booking?.booking_id;

      if (!bookingId) {
        throw new Error(
          "The booking service did not return " +
          "a booking reference."
        );
      }

      sessionStorage.setItem(
        PENDING_BOOKING_KEY,
        String(bookingId)
      );

      const paymentUrl =
        new URL(
          PAYMENT_PAGE,
          window.location.href
        );

      paymentUrl.searchParams.set(
        "booking",
        String(bookingId)
      );

      window.location.href =
        paymentUrl.href;
    } catch (error) {
      console.error(
        "Pending booking creation failed:",
        error
      );

      const conflictDetected =
        error.code === "23P01" ||
        /already booked|not available|conflict|overlap/i
          .test(
            error.message ?? ""
          );

      if (conflictDetected) {
        resetSelectedWorkspace();

        try {
          await loadWorkspaceAvailability();
        } catch (refreshError) {
          console.error(
            "Availability refresh after conflict failed:",
            refreshError
          );
        }

        setFormMessage(
          "Another customer has just reserved this " +
          "workspace. Choose another available workspace.",
          "error"
        );
      } else if (
        error.message?.includes(
          CREATE_BOOKING_RPC
        ) ||
        error.code === "PGRST202"
      ) {
        setFormMessage(
          "The pending-booking database function " +
          "has not been configured yet.",
          "error"
        );
      } else {
        setFormMessage(
          error.message ||
          "The booking could not be created.",
          "error"
        );
      }
    } finally {
      submitButton.disabled =
        false;
    }
  }

  async function shareWorkspaceStories() {
    if (!shareButton) {
      return;
    }

    const shareData = {
      title:
        "SyncSpace Workspace Stories",

      text:
        "Explore SyncSpace workspace experiences " +
        "and available spaces.",

      url:
        `${window.location.origin}` +
        `${window.location.pathname}` +
        "#stories"
    };

    try {
      if (navigator.share) {
        await navigator.share(
          shareData
        );

        return;
      }

      await navigator.clipboard.writeText(
        shareData.url
      );

      shareButton.textContent =
        "Link copied!";

      window.setTimeout(
        () => {
          shareButton.innerHTML =
            '<span class="share-icon">' +
            "&#x1f517;</span> Share";
        },
        2000
      );
    } catch (error) {
      if (
        error.name !== "AbortError"
      ) {
        console.error(
          "Sharing failed:",
          error
        );
      }
    }
  }

  function handleFilterChange(
    event
  ) {
    /*
     * This checkbox only changes which existing cards
     * are displayed. It does not change availability.
     */
    if (
      event.target ===
      availableOnly
    ) {
      renderWorkspaces();
      return;
    }

    if (
      event.target ===
      startDate
    ) {
      endDate.min =
        startDate.value;

      if (
        !endDate.value ||
        endDate.value <
        startDate.value
      ) {
        endDate.value =
          startDate.value;
      }
    }

    if (
      event.target === endDate &&
      endDate.value <
      startDate.value
    ) {
      endDate.value =
        startDate.value;
    }

    scheduleAvailabilityRefresh();
  }

  async function initializeBookingPage() {
    assertRequiredElements();

    const today =
      todayIso();

    startDate.min =
      today;

    endDate.min =
      today;

    if (
      !startDate.value ||
      startDate.value < today
    ) {
      startDate.value =
        today;
    }

    if (
      !endDate.value ||
      endDate.value <
      startDate.value
    ) {
      endDate.value =
        startDate.value;
    }

    endDate.min =
      startDate.value;

    const submitButton =
      bookingForm.querySelector(
        'button[type="submit"]'
      );

    if (submitButton) {
      submitButton.textContent =
        "Continue to payment";
    }

    availableOnly.checked =
      true;

    filtersForm.addEventListener(
      "change",
      handleFilterChange
    );

    peopleCount.addEventListener(
      "input",
      () => {
        scheduleAvailabilityRefresh(
          350
        );
      }
    );

    roomStrip.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "button[data-workspace-id]"
          );

        if (button) {
          selectWorkspace(
            button.dataset.workspaceId
          );
        }
      }
    );

    scrollLeftButton.addEventListener(
      "click",
      () => {
        roomStrip.scrollBy({
          left: -380,
          behavior: "smooth"
        });
      }
    );

    scrollRightButton.addEventListener(
      "click",
      () => {
        roomStrip.scrollBy({
          left: 380,
          behavior: "smooth"
        });
      }
    );

    bookingForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        await createPendingBookingAndContinue();
      }
    );

    shareButton?.addEventListener(
      "click",
      shareWorkspaceStories
    );

    window.addEventListener(
      "syncspace:auth-changed",
      async (event) => {
        await prefillFromUser(
          event.detail?.user ?? null
        );
      }
    );

    await prefillFromUser();

    await loadWorkspaceAvailability();
  }

  async function start() {
    try {
      await initializeBookingPage();
    } catch (error) {
      console.error(
        "Booking page initialization failed:",
        error
      );

      if (roomCount) {
        roomCount.textContent =
          "The booking interface could not be loaded.";
      }

      if (roomStrip) {
        roomStrip.innerHTML = `
          <div class="empty-state">
            ${escapeHtml(
              error.message ||
              "Unable to initialize the booking page."
            )}
          </div>
        `;
      }
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once: true
      }
    );
  } else {
    void start();
  }
})();
