(() => {
  "use strict";

  console.log("SyncSpace payment script loaded");

  const COMPLETE_PAYMENT_RPC =
    "complete_simulated_payment";

  const SYNC_RESERVATIONS_RPC =
    "get_my_reservations";

  const PENDING_BOOKING_KEY =
    "syncspace_pending_booking_id";

  const TEST_CARD_NUMBER =
    "4242424242424242";

  const TEST_CARD_EXPIRY =
    "12/30";

  const TEST_CARD_CVV =
    "123";

  const paymentPage =
    document.querySelector("#paymentPage");

  const paymentLoading =
    document.querySelector("#paymentLoading");

  const paymentContent =
    document.querySelector("#paymentContent");

  const paymentStatusBadge =
    document.querySelector("#paymentStatusBadge");

  const paymentWorkspaceImage =
    document.querySelector("#paymentWorkspaceImage");

  const paymentWorkspaceType =
    document.querySelector("#paymentWorkspaceType");

  const paymentWorkspaceName =
    document.querySelector("#paymentWorkspaceName");

  const paymentUnitCode =
    document.querySelector("#paymentUnitCode");

  const paymentDate =
    document.querySelector("#paymentDate");

  const paymentTime =
    document.querySelector("#paymentTime");

  const paymentPax =
    document.querySelector("#paymentPax");

  const paymentUnitPrice =
    document.querySelector("#paymentUnitPrice");

  const paymentTotal =
    document.querySelector("#paymentTotal");

  const paymentBookingReference =
    document.querySelector("#paymentBookingReference");

  const paymentHoldNotice =
    document.querySelector("#paymentHoldNotice");

  const paymentCountdown =
    document.querySelector("#paymentCountdown");

  const paymentFormContainer =
    document.querySelector("#paymentFormContainer");

  const paymentForm =
    document.querySelector("#paymentForm");

  const paymentCustomerName =
    document.querySelector("#paymentCustomerName");

  const paymentCustomerEmail =
    document.querySelector("#paymentCustomerEmail");

  const cardholderName =
    document.querySelector("#cardholderName");

  const cardNumber =
    document.querySelector("#cardNumber");

  const cardExpiry =
    document.querySelector("#cardExpiry");

  const cardCvv =
    document.querySelector("#cardCvv");

  const payNowButton =
    document.querySelector("#payNowButton");

  const paymentMessage =
    document.querySelector("#paymentMessage");

  const paymentResult =
    document.querySelector("#paymentResult");

  const confirmedPaymentReference =
    document.querySelector(
      "#confirmedPaymentReference"
    );

  const confirmedPaymentAmount =
    document.querySelector(
      "#confirmedPaymentAmount"
    );

  const paymentUnavailable =
    document.querySelector("#paymentUnavailable");

  const paymentUnavailableTitle =
    document.querySelector(
      "#paymentUnavailableTitle"
    );

  const paymentUnavailableMessage =
    document.querySelector(
      "#paymentUnavailableMessage"
    );

  let currentUser = null;
  let currentProfile = null;
  let currentBooking = null;
  let currentPayment = null;
  let currentWorkspace = null;

  let countdownTimer = null;
  let expiryProcessing = false;

  function assertRequiredElements() {
    const requiredElements = {
      paymentPage,
      paymentLoading,
      paymentContent,
      paymentStatusBadge,
      paymentWorkspaceImage,
      paymentWorkspaceType,
      paymentWorkspaceName,
      paymentUnitCode,
      paymentDate,
      paymentTime,
      paymentPax,
      paymentUnitPrice,
      paymentTotal,
      paymentBookingReference,
      paymentHoldNotice,
      paymentCountdown,
      paymentFormContainer,
      paymentForm,
      paymentCustomerName,
      paymentCustomerEmail,
      cardholderName,
      cardNumber,
      cardExpiry,
      cardCvv,
      payNowButton,
      paymentMessage,
      paymentResult,
      confirmedPaymentReference,
      confirmedPaymentAmount,
      paymentUnavailable,
      paymentUnavailableTitle,
      paymentUnavailableMessage
    };

    const missing = Object
      .entries(requiredElements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Payment page elements were not found: " +
        missing.join(", ")
      );
    }
  }

  function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(String(value || ""));
  }

  function getBookingId() {
    const queryParameters =
      new URLSearchParams(
        window.location.search
      );

    const queryBookingId =
      queryParameters.get("booking");

    if (isValidUuid(queryBookingId)) {
      sessionStorage.setItem(
        PENDING_BOOKING_KEY,
        queryBookingId
      );

      return queryBookingId;
    }

    const storedBookingId =
      sessionStorage.getItem(
        PENDING_BOOKING_KEY
      );

    if (isValidUuid(storedBookingId)) {
      return storedBookingId;
    }

    return null;
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

  function createReference(uuid) {
    if (!uuid) {
      return "-";
    }

    return String(uuid)
      .split("-")[0]
      .toUpperCase();
  }

  function bookingStatusLabel(status) {
    const labels = {
      pending_payment: "Pending payment",
      confirmed: "Confirmed",
      completed: "Completed",
      cancel_requested:
        "Cancellation requested",
      cancelled: "Cancelled",
      expired: "Expired"
    };

    return labels[status] || "Unknown";
  }

  function setPaymentMessage(
    message,
    status = ""
  ) {
    paymentMessage.textContent = message;
    paymentMessage.dataset.status = status;
  }

  function clearCountdown() {
    if (countdownTimer) {
      window.clearInterval(
        countdownTimer
      );

      countdownTimer = null;
    }
  }

  function showContent() {
    paymentLoading.hidden = true;
    paymentContent.hidden = false;
    paymentPage.setAttribute(
      "aria-busy",
      "false"
    );
  }

  function showPaymentForm() {
    paymentFormContainer.hidden = false;
    paymentResult.hidden = true;
    paymentUnavailable.hidden = true;
    paymentHoldNotice.hidden = false;
  }

  function showPaymentSuccess(
    paymentReference,
    amount
  ) {
    clearCountdown();

    paymentFormContainer.hidden = true;
    paymentUnavailable.hidden = true;
    paymentResult.hidden = false;
    paymentHoldNotice.hidden = true;

    confirmedPaymentReference.textContent =
      paymentReference || "-";

    confirmedPaymentAmount.textContent =
      formatPrice(amount);

    paymentStatusBadge.textContent =
      "Confirmed";

    paymentStatusBadge.className =
      "pill status-confirmed";
  }

  function showPaymentUnavailable(
    title,
    message
  ) {
    clearCountdown();

    paymentFormContainer.hidden = true;
    paymentResult.hidden = true;
    paymentUnavailable.hidden = false;
    paymentHoldNotice.hidden = true;

    paymentUnavailableTitle.textContent =
      title;

    paymentUnavailableMessage.textContent =
      message;
  }

  async function loadBooking(
    bookingId
  ) {
    const { data, error } =
      await getSupabaseClient()
        .from("bookings")
        .select(`
          id,
          user_id,
          workspace_id,
          start_date,
          end_date,
          time_slot,
          starts_at,
          ends_at,
          party_size,
          unit_price,
          total,
          status,
          expires_at,
          created_at
        `)
        .eq("id", bookingId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async function loadWorkspace(
    workspaceId
  ) {
    const { data, error } =
      await getSupabaseClient()
        .from("workspaces")
        .select(`
          id,
          unit_code,
          name,
          description,
          layout,
          capacity,
          price,
          image_url,
          workspace_type_id,
          workspace_types (
            id,
            name
          )
        `)
        .eq("id", workspaceId)
        .maybeSingle();

    if (error) {
      console.warn(
        "Workspace information could not be loaded:",
        error.message
      );

      return null;
    }

    return data;
  }

  async function loadPaymentRecord(
    bookingId
  ) {
    const { data, error } =
      await getSupabaseClient()
        .from("payments")
        .select(`
          id,
          booking_id,
          user_id,
          amount,
          status,
          payment_method,
          payment_reference,
          paid_at,
          created_at
        `)
        .eq("booking_id", bookingId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async function synchronizeExpiredBookings() {
    const { error } =
      await getSupabaseClient().rpc(
        SYNC_RESERVATIONS_RPC
      );

    if (error) {
      console.warn(
        "Booking expiry could not be synchronized:",
        error.message
      );
    }
  }

  async function reloadBookingState() {
    if (!currentBooking?.id) {
      return;
    }

    currentBooking =
      await loadBooking(
        currentBooking.id
      );

    currentPayment =
      await loadPaymentRecord(
        currentBooking.id
      );

    renderPaymentState();
  }

  function renderWorkspaceImage() {
    const imageUrl =
      currentWorkspace?.image_url;

    if (!imageUrl) {
      paymentWorkspaceImage.style
        .backgroundImage =
        "url('assets/syncspace-logo.png')";

      return;
    }

    paymentWorkspaceImage.style
      .backgroundImage =
      `url("${imageUrl}")`;
  }

  function getWorkspaceTypeName() {
    const typeData =
      currentWorkspace?.workspace_types;

    if (Array.isArray(typeData)) {
      return typeData[0]?.name ||
        "Workspace";
    }

    return typeData?.name ||
      "Workspace";
  }

  function renderBookingSummary() {
    const workspaceName =
      currentWorkspace?.name ||
      currentBooking.workspace_id ||
      "Workspace";

    paymentWorkspaceName.textContent =
      workspaceName;

    paymentWorkspaceType.textContent =
      getWorkspaceTypeName();

    paymentUnitCode.textContent =
      currentWorkspace?.unit_code
        ? `Unit ${currentWorkspace.unit_code}`
        : "Workspace unit";

    paymentDate.textContent =
      formatDateRange(
        currentBooking.start_date,
        currentBooking.end_date
      );

    paymentTime.textContent =
      currentBooking.time_slot;

    paymentPax.textContent =
      `${currentBooking.party_size} ` +
      `${
        currentBooking.party_size === 1
          ? "person"
          : "people"
      }`;

    paymentUnitPrice.textContent =
      `${formatPrice(
        currentBooking.unit_price
      )} per day`;

    paymentTotal.textContent =
      formatPrice(
        currentBooking.total
      );

    paymentBookingReference.textContent =
      createReference(
        currentBooking.id
      );

    paymentStatusBadge.textContent =
      bookingStatusLabel(
        currentBooking.status
      );

    renderWorkspaceImage();
  }

  function startPaymentCountdown() {
    clearCountdown();

    const expiresAt =
      new Date(
        currentBooking.expires_at
      ).getTime();

    async function updateCountdown() {
      const remaining =
        expiresAt - Date.now();

      if (remaining <= 0) {
        paymentCountdown.textContent =
          "00:00";

        payNowButton.disabled = true;
        clearCountdown();

        if (!expiryProcessing) {
          expiryProcessing = true;

          await synchronizeExpiredBookings();

          try {
            await reloadBookingState();
          } finally {
            expiryProcessing = false;
          }
        }

        return;
      }

      const totalSeconds =
        Math.floor(remaining / 1000);

      const minutes =
        Math.floor(totalSeconds / 60);

      const seconds =
        totalSeconds % 60;

      paymentCountdown.textContent =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;
    }

    void updateCountdown();

    countdownTimer =
      window.setInterval(
        () => {
          void updateCountdown();
        },
        1000
      );
  }

  function renderPaymentState() {
    renderBookingSummary();
    showContent();

    const bookingStatus =
      currentBooking.status;

    const paymentStatus =
      currentPayment?.status;

    if (
      bookingStatus === "confirmed" &&
      paymentStatus === "paid"
    ) {
      sessionStorage.removeItem(
        PENDING_BOOKING_KEY
      );

      showPaymentSuccess(
        currentPayment.payment_reference,
        currentPayment.amount
      );

      return;
    }

    if (
      bookingStatus === "pending_payment" &&
      paymentStatus === "pending"
    ) {
      const expiresAt =
        new Date(
          currentBooking.expires_at
        ).getTime();

      if (expiresAt <= Date.now()) {
        showPaymentUnavailable(
          "The payment period has expired",
          "The temporary workspace hold has expired. " +
          "Return to the booking page and select an " +
          "available workspace again."
        );

        return;
      }

      showPaymentForm();
      payNowButton.disabled = false;
      startPaymentCountdown();

      return;
    }

    if (
      bookingStatus === "expired" ||
      paymentStatus === "failed"
    ) {
      showPaymentUnavailable(
        "The reservation hold expired",
        "Payment was not completed within the allowed " +
        "time. The workspace has been released for " +
        "other customers."
      );

      return;
    }

    if (
      bookingStatus === "cancel_requested"
    ) {
      showPaymentUnavailable(
        "Cancellation requested",
        "A cancellation and refund request has already " +
        "been submitted for this reservation."
      );

      return;
    }

    if (
      bookingStatus === "cancelled"
    ) {
      showPaymentUnavailable(
        "Reservation cancelled",
        "This reservation has been cancelled."
      );

      return;
    }

    if (
      bookingStatus === "completed"
    ) {
      showPaymentUnavailable(
        "Reservation completed",
        "This workspace reservation has already been used."
      );

      return;
    }

    showPaymentUnavailable(
      "Payment unavailable",
      "This reservation is not currently eligible for payment."
    );
  }

  function formatCardNumberInput() {
    const digits =
      cardNumber.value
        .replace(/\D/g, "")
        .slice(0, 16);

    cardNumber.value =
      digits.replace(
        /(\d{4})(?=\d)/g,
        "$1 "
      );
  }

  function formatExpiryInput() {
    const digits =
      cardExpiry.value
        .replace(/\D/g, "")
        .slice(0, 4);

    if (digits.length > 2) {
      cardExpiry.value =
        `${digits.slice(0, 2)}/` +
        `${digits.slice(2)}`;
    } else {
      cardExpiry.value = digits;
    }
  }

  function validateTestPaymentDetails() {
    const name =
      cardholderName.value.trim();

    const number =
      cardNumber.value.replace(
        /\D/g,
        ""
      );

    const expiry =
      cardExpiry.value.trim();

    const cvv =
      cardCvv.value.trim();

    if (!name) {
      throw new Error(
        "Enter the name on the test card."
      );
    }

    if (number !== TEST_CARD_NUMBER) {
      throw new Error(
        "Use the test card number " +
        "4242 4242 4242 4242."
      );
    }

    if (expiry !== TEST_CARD_EXPIRY) {
      throw new Error(
        "Use the test expiry date 12/30."
      );
    }

    if (cvv !== TEST_CARD_CVV) {
      throw new Error(
        "Use the test CVV 123."
      );
    }
  }

  async function completeSimulatedPayment() {
    if (!currentBooking?.id) {
      throw new Error(
        "No pending booking was found."
      );
    }

    validateTestPaymentDetails();

    const { data, error } =
      await getSupabaseClient().rpc(
        COMPLETE_PAYMENT_RPC,
        {
          p_booking_id:
            currentBooking.id
        }
      );

    if (error) {
      throw error;
    }

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!result) {
      throw new Error(
        "The payment service did not return a result."
      );
    }

    sessionStorage.removeItem(
      PENDING_BOOKING_KEY
    );

    currentBooking.status =
      result.booking_status;

    currentPayment = {
      ...currentPayment,
      status:
        result.payment_status,
      payment_reference:
        result.payment_reference,
      amount:
        result.total
    };

    showPaymentSuccess(
      result.payment_reference,
      result.total
    );
  }

  async function handlePaymentSubmit(
    event
  ) {
    event.preventDefault();

    payNowButton.disabled = true;

    setPaymentMessage(
      "Completing simulated payment...",
      "loading"
    );

    try {
      await completeSimulatedPayment();

      setPaymentMessage("");
    } catch (error) {
      console.error(
        "Payment failed:",
        error
      );

      const expired =
        /expired/i.test(
          error.message || ""
        );

      if (expired) {
        await synchronizeExpiredBookings();
        await reloadBookingState();
      } else {
        setPaymentMessage(
          error.message ||
          "The simulated payment could not be completed.",
          "error"
        );

        payNowButton.disabled = false;
      }
    }
  }

  async function initializePaymentPage() {
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

    paymentCustomerName.value =
      getDisplayName(
        currentUser,
        currentProfile
      );

    paymentCustomerEmail.value =
      currentUser.email || "";

    cardholderName.value =
      getDisplayName(
        currentUser,
        currentProfile
      );

    const bookingId =
      getBookingId();

    if (!bookingId) {
      paymentLoading.hidden = true;
      paymentContent.hidden = false;

      showPaymentUnavailable(
        "No pending reservation found",
        "Return to the booking page and select a workspace " +
        "before continuing to payment."
      );

      paymentPage.setAttribute(
        "aria-busy",
        "false"
      );

      return;
    }

    currentBooking =
      await loadBooking(
        bookingId
      );

    if (!currentBooking) {
      paymentLoading.hidden = true;
      paymentContent.hidden = false;

      showPaymentUnavailable(
        "Reservation not found",
        "This reservation does not exist or does not " +
        "belong to the signed-in user."
      );

      paymentPage.setAttribute(
        "aria-busy",
        "false"
      );

      return;
    }

    if (
      currentBooking.status ===
        "pending_payment" &&
      new Date(
        currentBooking.expires_at
      ).getTime() <= Date.now()
    ) {
      await synchronizeExpiredBookings();

      currentBooking =
        await loadBooking(
          bookingId
        );
    }

    currentWorkspace =
      await loadWorkspace(
        currentBooking.workspace_id
      );

    currentPayment =
      await loadPaymentRecord(
        currentBooking.id
      );

    renderPaymentState();

    cardNumber.addEventListener(
      "input",
      formatCardNumberInput
    );

    cardExpiry.addEventListener(
      "input",
      formatExpiryInput
    );

    cardCvv.addEventListener(
      "input",
      () => {
        cardCvv.value =
          cardCvv.value
            .replace(/\D/g, "")
            .slice(0, 3);
      }
    );

    paymentForm.addEventListener(
      "submit",
      handlePaymentSubmit
    );

    window.addEventListener(
      "beforeunload",
      clearCountdown
    );
  }

  async function start() {
    try {
      await initializePaymentPage();
    } catch (error) {
      console.error(
        "Payment page initialization failed:",
        error
      );

      paymentLoading.hidden = true;
      paymentContent.hidden = false;

      showPaymentUnavailable(
        "Payment page could not be loaded",
        error.message ||
        "An unexpected error occurred while loading " +
        "the pending reservation."
      );

      paymentPage.setAttribute(
        "aria-busy",
        "false"
      );
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
