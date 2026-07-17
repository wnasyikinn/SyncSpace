(() => {
  "use strict";

  console.log("SyncSpace admin script loaded");

  const PROCESS_REFUND_RPC =
    "admin_process_refund";

  const adminContent =
    document.querySelector("#adminContent");

  const adminDisplayName =
    document.querySelector("#adminDisplayName");

  const adminPageMessage =
    document.querySelector("#adminPageMessage");

  const refreshAdminButton =
    document.querySelector("#refreshAdminButton");

  const activeWorkspaceCount =
    document.querySelector("#activeWorkspaceCount");

  const confirmedBookingCount =
    document.querySelector("#confirmedBookingCount");

  const pendingPaymentAdminCount =
    document.querySelector("#pendingPaymentAdminCount");

  const openRefundCount =
    document.querySelector("#openRefundCount");

  const inventorySearch =
    document.querySelector("#inventorySearch");

  const inventoryStatusFilter =
    document.querySelector("#inventoryStatusFilter");

  const inventoryList =
    document.querySelector("#inventoryList");

  const addWorkspaceButton =
    document.querySelector("#addWorkspaceButton");

  const bookingSearch =
    document.querySelector("#bookingSearch");

  const bookingStatusFilter =
    document.querySelector("#bookingStatusFilter");

  const adminBookingList =
    document.querySelector("#adminBookingList");

  const paymentSearch =
    document.querySelector("#paymentSearch");

  const paymentStatusFilter =
    document.querySelector("#paymentStatusFilter");

  const adminPaymentList =
    document.querySelector("#adminPaymentList");

  const refundSearch =
    document.querySelector("#refundSearch");

  const refundStatusFilter =
    document.querySelector("#refundStatusFilter");

  const adminRefundList =
    document.querySelector("#adminRefundList");

  const workspaceModal =
    document.querySelector("#workspaceModal");

  const workspaceForm =
    document.querySelector("#workspaceForm");

  const workspaceFormTitle =
    document.querySelector("#workspaceFormTitle");

  const workspaceExistingId =
    document.querySelector("#workspaceExistingId");

  const workspaceTypeId =
    document.querySelector("#workspaceTypeId");

  const workspaceUnitCode =
    document.querySelector("#workspaceUnitCode");

  const workspaceName =
    document.querySelector("#workspaceName");

  const workspaceDescription =
    document.querySelector("#workspaceDescription");

  const workspaceLayout =
    document.querySelector("#workspaceLayout");

  const workspaceCapacity =
    document.querySelector("#workspaceCapacity");

  const workspaceMorningPrice =
    document.querySelector("#workspaceMorningPrice");
  
  const workspaceAfternoonPrice =
    document.querySelector("#workspaceAfternoonPrice");
  
  const workspaceEveningPrice =
    document.querySelector("#workspaceEveningPrice");
  
  const workspaceFullDayPrice =
    document.querySelector("#workspaceFullDayPrice");

  const workspaceImageUrl =
    document.querySelector("#workspaceImageUrl");

  const workspaceDisplayOrder =
    document.querySelector("#workspaceDisplayOrder");

  const workspaceActive =
    document.querySelector("#workspaceActive");

  const saveWorkspaceButton =
    document.querySelector("#saveWorkspaceButton");

  const workspaceFormMessage =
    document.querySelector("#workspaceFormMessage");

  const workspaceBranchId =
    document.querySelector("#workspaceBranchId");

  const closeWorkspaceModalButton =
    document.querySelector("#closeWorkspaceModal");

  const cancelWorkspaceFormButton =
    document.querySelector("#cancelWorkspaceForm");

  const refundActionModal =
    document.querySelector("#refundActionModal");

  const refundActionForm =
    document.querySelector("#refundActionForm");

  const refundActionTitle =
    document.querySelector("#refundActionTitle");

  const refundActionDescription =
    document.querySelector("#refundActionDescription");

  const refundActionId =
    document.querySelector("#refundActionId");

  const refundActionType =
    document.querySelector("#refundActionType");

  const refundAdminNote =
    document.querySelector("#refundAdminNote");

  const confirmRefundAction =
    document.querySelector("#confirmRefundAction");

  const refundActionMessage =
    document.querySelector("#refundActionMessage");

  const closeRefundModalButton =
    document.querySelector("#closeRefundModal");

  const cancelRefundActionButton =
    document.querySelector("#cancelRefundAction");

  let currentUser = null;
  let currentProfile = null;

  let adminRealtimeChannel = null;
  let adminRealtimeRefreshTimer = null;

  let profiles = [];
  let workspaceTypes = [];
  let workspaces = [];
  let bookings = [];
  let payments = [];
  let refunds = [];

  let profilesById = new Map();
  let workspaceTypesById = new Map();
  let workspacesById = new Map();
  let bookingsById = new Map();
  let paymentsByBookingId = new Map();
  let refundsByBookingId = new Map();
  let workspaceBranches = [];
  let workspaceBranchesById = new Map();

  function assertRequiredElements() {
    const requiredElements = {
      adminContent,
      adminDisplayName,
      adminPageMessage,
      refreshAdminButton,
      activeWorkspaceCount,
      confirmedBookingCount,
      pendingPaymentAdminCount,
      openRefundCount,
      inventorySearch,
      inventoryStatusFilter,
      inventoryList,
      addWorkspaceButton,
      bookingSearch,
      bookingStatusFilter,
      adminBookingList,
      paymentSearch,
      paymentStatusFilter,
      adminPaymentList,
      refundSearch,
      refundStatusFilter,
      adminRefundList,
      workspaceModal,
      workspaceForm,
      workspaceFormTitle,
      workspaceExistingId,
      workspaceTypeId,
      workspaceBranchId,
      workspaceUnitCode,
      workspaceName,
      workspaceDescription,
      workspaceLayout,
      workspaceCapacity,
      workspaceMorningPrice,
      workspaceAfternoonPrice,
      workspaceEveningPrice,
      workspaceFullDayPrice,
      workspaceImageUrl,
      workspaceDisplayOrder,
      workspaceActive,
      saveWorkspaceButton,
      workspaceFormMessage,
      closeWorkspaceModalButton,
      cancelWorkspaceFormButton,
      refundActionModal,
      refundActionForm,
      refundActionTitle,
      refundActionDescription,
      refundActionId,
      refundActionType,
      refundAdminNote,
      confirmRefundAction,
      refundActionMessage,
      closeRefundModalButton,
      cancelRefundActionButton
    };

    const missing = Object
      .entries(requiredElements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Admin page elements were not found: " +
        missing.join(", ")
      );
    }
  }

  function escapeHtml(value) {
    const element =
      document.createElement("div");

    element.textContent =
      String(value ?? "");

    return element.innerHTML;
  }

  function normaliseSearch(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase();
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

    const date =
      new Date(`${isoDate}T00:00:00`);

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

    const date =
      new Date(value);

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
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur"
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

  function shortUserId(id) {
    if (!id) {
      return "-";
    }

    return String(id)
      .slice(0, 8)
      .toUpperCase();
  }

  function statusClass(status) {
    return String(status || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
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
  
    return labels[status] || "Unknown";
  }

  function refundStatusLabel(status) {
    const labels = {
      requested: "Requested",
      approved: "Approved",
      rejected: "Rejected",
      processing: "Processing",
      refunded: "Refunded"
    };

    return labels[status] || "Unknown";
  }

  function safeImageUrl(value) {
    try {
      const url =
        new URL(
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
      // Use fallback image.
    }

    return "assets/syncspace-logo-mark.png";
  }

  function setPageMessage(
    message,
    status = ""
  ) {
    adminPageMessage.textContent =
      message;

    adminPageMessage.dataset.status =
      status;
  }

  function setWorkspaceFormMessage(
    message,
    status = ""
  ) {
    workspaceFormMessage.textContent =
      message;

    workspaceFormMessage.dataset.status =
      status;
  }

  function setRefundActionMessage(
    message,
    status = ""
  ) {
    refundActionMessage.textContent =
      message;

    refundActionMessage.dataset.status =
      status;
  }

  function setLoadingState() {
    adminContent.setAttribute(
      "aria-busy",
      "true"
    );

    refreshAdminButton.disabled = true;

    inventoryList.innerHTML = `
      <div class="empty-state">
        Loading workspace inventory...
      </div>
    `;

    adminBookingList.innerHTML = `
      <div class="empty-state">
        Loading bookings...
      </div>
    `;

    adminPaymentList.innerHTML = `
      <div class="empty-state">
        Loading payments...
      </div>
    `;

    adminRefundList.innerHTML = `
      <div class="empty-state">
        Loading refund requests...
      </div>
    `;
  }

  function setLoadedState() {
    adminContent.setAttribute(
      "aria-busy",
      "false"
    );

    refreshAdminButton.disabled = false;
  }

  function rebuildMaps() {
    profilesById =
      new Map(
        profiles.map(
          (profile) => [
            profile.id,
            profile
          ]
        )
      );
  
    workspaceTypesById =
      new Map(
        workspaceTypes.map(
          (type) => [
            type.id,
            type
          ]
        )
      );
  
    workspaceBranchesById =
      new Map(
        workspaceBranches.map(
          (branch) => [
            branch.id,
            branch
          ]
        )
      );
  
    workspacesById =
      new Map(
        workspaces.map(
          (workspace) => [
            workspace.id,
            workspace
          ]
        )
      );
  
    bookingsById =
      new Map(
        bookings.map(
          (booking) => [
            booking.id,
            booking
          ]
        )
      );
  
    paymentsByBookingId =
      new Map(
        payments.map(
          (payment) => [
            payment.booking_id,
            payment
          ]
        )
      );
  
    refundsByBookingId =
      new Map(
        refunds.map(
          (refund) => [
            refund.booking_id,
            refund
          ]
        )
      );
  }

  function getCustomerName(userId) {
    return (
      profilesById.get(userId)?.full_name ||
      `User ${shortUserId(userId)}`
    );
  }

  function getWorkspaceTypeName(
    workspace
  ) {
    return (
      workspaceTypesById.get(
        workspace?.workspace_type_id
      )?.name ||
      "Workspace"
    );
  }

  async function synchroniseBookingStatuses() {
    const client =
      getSupabaseClient();

    const now =
      new Date().toISOString();

    const {
      data: expiredBookings,
      error: expiredError
    } = await client
      .from("bookings")
      .update({
        status: "expired"
      })
      .eq("status", "pending_payment")
      .lte("expires_at", now)
      .select("id");

    if (expiredError) {
      throw expiredError;
    }

    const expiredIds =
      (expiredBookings || [])
        .map((booking) => booking.id);

    if (expiredIds.length > 0) {
      const { error: paymentError } =
        await client
          .from("payments")
          .update({
            status: "failed"
          })
          .in(
            "booking_id",
            expiredIds
          )
          .eq("status", "pending");

      if (paymentError) {
        throw paymentError;
      }
    }

    const { error: completedError } =
      await client
        .from("bookings")
        .update({
          status: "completed"
        })
        .eq("status", "confirmed")
        .lt("ends_at", now);

    if (completedError) {
      throw completedError;
    }
  }

  async function fetchAdminData() {
    const client =
      getSupabaseClient();
  
    const [
      profileResult,
      typeResult,
      branchResult,
      workspaceResult,
      bookingResult,
      paymentResult,
      refundResult
    ] = await Promise.all([
      client
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          role,
          created_at
        `)
        .order("full_name"),
  
      client
        .from("workspace_types")
        .select(`
          id,
          name,
          description,
          active,
          created_at,
          updated_at
        `)
        .order("name"),
  
      client
        .from("workspace_branches")
        .select(`
          id,
          name,
          address,
          city,
          state,
          active,
          display_order
        `)
        .order(
          "display_order",
          {
            ascending: true
          }
        ),
  
      client
        .from("workspaces")
        .select(`
          id,
          workspace_type_id,
          branch_id,
          unit_code,
          name,
          description,
          layout,
          capacity,
          price,
          morning_price,
          afternoon_price,
          evening_price,
          full_day_price,
          image_url,
          active,
          display_order,
          created_at,
          updated_at
        `)
        .order(
          "display_order",
          {
            ascending: true
          }
        ),
  
      client
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
          cancellation_requested_at,
          cancelled_at,
          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        ),
  
      client
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
          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        ),
  
      client
        .from("refunds")
        .select(`
          id,
          booking_id,
          payment_id,
          requested_by,
          reason,
          amount,
          status,
          admin_note,
          processed_by,
          requested_at,
          processed_at,
          updated_at
        `)
        .order(
          "requested_at",
          {
            ascending: false
          }
        )
    ]);
  
    const results = [
      profileResult,
      typeResult,
      branchResult,
      workspaceResult,
      bookingResult,
      paymentResult,
      refundResult
    ];
  
    const failedResult =
      results.find(
        (result) => result.error
      );
  
    if (failedResult) {
      throw failedResult.error;
    }
  
    profiles =
      profileResult.data || [];
  
    workspaceTypes =
      typeResult.data || [];
  
    workspaceBranches =
      branchResult.data || [];
  
    workspaces =
      workspaceResult.data || [];
  
    bookings =
      bookingResult.data || [];
  
    payments =
      paymentResult.data || [];
  
    refunds =
      refundResult.data || [];
  
    rebuildMaps();
  }

  function renderStatistics() {
    const now =
      Date.now();

    const activeWorkspaces =
      workspaces.filter(
        (workspace) =>
          workspace.active
      );

    const confirmedUpcoming =
      bookings.filter(
        (booking) =>
          booking.status === "confirmed" &&
          new Date(
            booking.ends_at
          ).getTime() >= now
      );

    const pendingPayments =
      payments.filter(
        (payment) =>
          payment.status === "pending"
      );

    const openRefunds =
      refunds.filter(
        (refund) =>
          [
            "requested",
            "approved",
            "processing"
          ].includes(refund.status)
      );

    activeWorkspaceCount.textContent =
      String(activeWorkspaces.length);

    confirmedBookingCount.textContent =
      String(confirmedUpcoming.length);

    pendingPaymentAdminCount.textContent =
      String(pendingPayments.length);

    openRefundCount.textContent =
      String(openRefunds.length);
  }

  function populateWorkspaceTypeOptions() {
    workspaceTypeId.innerHTML =
      workspaceTypes
        .map((type) => {
          const inactiveText =
            type.active
              ? ""
              : " (inactive type)";

          return `
            <option value="${escapeHtml(type.id)}">
              ${escapeHtml(type.name + inactiveText)}
            </option>
          `;
        })
        .join("");
  }
  
  function populateWorkspaceBranchOptions() {
    workspaceBranchId.innerHTML = `
      <option value="">
        Select branch
      </option>
  
      ${workspaceBranches
        .map((branch) => {
          const inactiveText =
            branch.active
              ? ""
              : " (inactive)";
  
          return `
            <option
              value="${escapeHtml(
                branch.id
              )}"
            >
              ${escapeHtml(
                branch.name +
                inactiveText
              )}
            </option>
          `;
        })
        .join("")}
    `;
  }
  
  function getWorkspaceBranchName(
    workspace
  ) {
    return (
      workspaceBranchesById.get(
        workspace?.branch_id
      )?.name ||
      "Branch not assigned"
    );
  }
  
  function renderInventory() {
    const search =
      normaliseSearch(
        inventorySearch.value
      );

    const statusFilter =
      inventoryStatusFilter.value;

    const filtered =
      workspaces.filter((workspace) => {
        const typeName =
          getWorkspaceTypeName(
            workspace
          );

        const branchName =
          getWorkspaceBranchName(workspace);

        const searchableText =
          normaliseSearch(
            [
              workspace.name,
              workspace.unit_code,
              typeName,
              branchName,
              workspace.description,
              workspace.layout
            ].join(" ")
          );

        const matchesSearch =
          !search ||
          searchableText.includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          (
            statusFilter === "active" &&
            workspace.active
          ) ||
          (
            statusFilter === "inactive" &&
            !workspace.active
          );

        return (
          matchesSearch &&
          matchesStatus
        );
      });

    inventoryList.innerHTML =
      filtered.length
        ? filtered
            .map((workspace) => {
              const typeName =
                getWorkspaceTypeName(
                  workspace
                );

              const branchName =
                getWorkspaceBranchName(
                  workspace
                );

              return `
                <article
                  class="admin-record-card inventory-record"
                  data-workspace-record="${escapeHtml(
                    workspace.id
                  )}"
                >
                  <img
                    class="admin-record-image"
                    src="${escapeHtml(
                      safeImageUrl(
                        workspace.image_url
                      )
                    )}"
                    alt="${escapeHtml(
                      workspace.name
                    )}"
                  >

                  <div class="admin-record-main">
                    <div class="reservation-card-top">
                      <div>
                        <span class="pill">
                          ${escapeHtml(typeName)}
                        </span>

                        <h3>
                          ${escapeHtml(
                            workspace.name
                          )}
                        </h3>

                        <p>
                          Unit
                          ${escapeHtml(
                            workspace.unit_code
                          )}
                        </p>

                        <p>
                          <strong>
                            Branch:
                          </strong>
                        
                          ${escapeHtml(
                            branchName
                          )}
                        </p>
                      </div>

                      <span
                        class="pill status-${
                          workspace.active
                            ? "confirmed"
                            : "expired"
                        }"
                      >
                        ${
                          workspace.active
                            ? "Active"
                            : "Inactive"
                        }
                      </span>
                    </div>

                    <p>
                      ${escapeHtml(
                        workspace.description
                      )}
                    </p>

                    <dl class="reservation-details">
                      <div>
                        <dt>Capacity</dt>

                        <dd>
                          ${escapeHtml(
                            workspace.capacity
                          )}
                          pax
                        </dd>
                      </div>

                      <div>
                        <dt>09:00–12:00</dt>
                      
                        <dd>
                          ${escapeHtml(
                            formatPrice(
                              workspace.morning_price
                            )
                          )}
                        </dd>
                      </div>
                      
                      <div>
                        <dt>13:00–17:00</dt>
                      
                        <dd>
                          ${escapeHtml(
                            formatPrice(
                              workspace.afternoon_price
                            )
                          )}
                        </dd>
                      </div>
                      
                      <div>
                        <dt>18:00–21:00</dt>
                      
                        <dd>
                          ${escapeHtml(
                            formatPrice(
                              workspace.evening_price
                            )
                          )}
                        </dd>
                      </div>
                      
                      <div>
                        <dt>Full day</dt>
                      
                        <dd>
                          ${escapeHtml(
                            formatPrice(
                              workspace.full_day_price
                            )
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Layout</dt>

                        <dd>
                          ${escapeHtml(
                            workspace.layout
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>Display order</dt>

                        <dd>
                          ${escapeHtml(
                            workspace.display_order
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div class="reservation-card-actions">
                      <button
                        type="button"
                        class="button secondary"
                        data-edit-workspace="${escapeHtml(
                          workspace.id
                        )}"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        class="button secondary"
                        data-toggle-workspace="${escapeHtml(
                          workspace.id
                        )}"
                      >
                        ${
                          workspace.active
                            ? "Deactivate"
                            : "Activate"
                        }
                      </button>
                    </div>
                  </div>
                </article>
              `;
            })
            .join("")
        : `
          <div class="empty-state">
            No workspace units match the selected filters.
          </div>
        `;
  }

  function renderBookings() {
    const search =
      normaliseSearch(
        bookingSearch.value
      );

    const statusFilter =
      bookingStatusFilter.value;

    const filtered =
      bookings.filter((booking) => {
        const workspace =
          workspacesById.get(
            booking.workspace_id
          );

        const customerName =
          getCustomerName(
            booking.user_id
          );

        const searchableText =
          normaliseSearch(
            [
              booking.id,
              createReference(booking.id),
              customerName,
              workspace?.name,
              workspace?.unit_code,
              booking.status
            ].join(" ")
          );

        const matchesSearch =
          !search ||
          searchableText.includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          booking.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      });

    adminBookingList.innerHTML =
      filtered.length
        ? filtered
            .map((booking) => {
              const workspace =
                workspacesById.get(
                  booking.workspace_id
                );

              const payment =
                paymentsByBookingId.get(
                  booking.id
                );

              const refund =
                refundsByBookingId.get(
                  booking.id
                );

              return `
                <article class="admin-record-card">
                  <div class="reservation-card-top">
                    <div>
                      <span class="pill">
                        ${escapeHtml(
                          getWorkspaceTypeName(
                            workspace
                          )
                        )}
                      </span>

                      <h3>
                        ${escapeHtml(
                          workspace?.name ||
                          "Unknown workspace"
                        )}
                      </h3>

                      <p>
                        Unit
                        ${escapeHtml(
                          workspace?.unit_code ||
                          booking.workspace_id
                        )}
                      </p>
                    </div>

                    <span
                      class="pill status-${escapeHtml(
                        statusClass(
                          booking.status
                        )
                      )}"
                    >
                      ${escapeHtml(
                        bookingStatusLabel(
                          booking.status
                        )
                      )}
                    </span>
                  </div>

                  <dl class="reservation-details">
                    <div>
                      <dt>Customer</dt>

                      <dd>
                        ${escapeHtml(
                          getCustomerName(
                            booking.user_id
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Booking reference</dt>

                      <dd>
                        ${escapeHtml(
                          createReference(
                            booking.id
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Date</dt>

                      <dd>
                        ${escapeHtml(
                          formatDateRange(
                            booking.start_date,
                            booking.end_date
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Time</dt>

                      <dd>
                        ${escapeHtml(
                          booking.time_slot
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Pax</dt>

                      <dd>
                        ${escapeHtml(
                          booking.party_size
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Total</dt>

                      <dd>
                        ${escapeHtml(
                          formatPrice(
                            booking.total
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Payment</dt>

                      <dd>
                        ${escapeHtml(
                          paymentStatusLabel(
                            payment?.status
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Refund</dt>

                      <dd>
                        ${
                          refund
                            ? escapeHtml(
                              refundStatusLabel(
                                refund.status
                              )
                            )
                            : "Not requested"
                        }
                      </dd>
                    </div>
                  </dl>
                </article>
              `;
            })
            .join("")
        : `
          <div class="empty-state">
            No bookings match the selected filters.
          </div>
        `;
  }

  function renderPayments() {
    const search =
      normaliseSearch(
        paymentSearch.value
      );

    const statusFilter =
      paymentStatusFilter.value;

    const filtered =
      payments.filter((payment) => {
        const booking =
          bookingsById.get(
            payment.booking_id
          );

        const workspace =
          workspacesById.get(
            booking?.workspace_id
          );

        const customerName =
          getCustomerName(
            payment.user_id
          );

        const searchableText =
          normaliseSearch(
            [
              payment.id,
              payment.payment_reference,
              payment.booking_id,
              createReference(
                payment.booking_id
              ),
              customerName,
              workspace?.name,
              workspace?.unit_code
            ].join(" ")
          );

        const matchesSearch =
          !search ||
          searchableText.includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          payment.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      });

    adminPaymentList.innerHTML =
      filtered.length
        ? filtered
            .map((payment) => {
              const booking =
                bookingsById.get(
                  payment.booking_id
                );

              const workspace =
                workspacesById.get(
                  booking?.workspace_id
                );

              return `
                <article class="admin-record-card">
                  <div class="reservation-card-top">
                    <div>
                      <span class="pill">
                        Payment
                      </span>

                      <h3>
                        ${escapeHtml(
                          payment.payment_reference ||
                          "Pending reference"
                        )}
                      </h3>

                      <p>
                        Booking
                        ${escapeHtml(
                          createReference(
                            payment.booking_id
                          )
                        )}
                      </p>
                    </div>

                    <span
                      class="pill status-${escapeHtml(
                        statusClass(
                          payment.status
                        )
                      )}"
                    >
                      ${escapeHtml(
                        paymentStatusLabel(
                          payment.status
                        )
                      )}
                    </span>
                  </div>

                  <dl class="reservation-details">
                    <div>
                      <dt>Customer</dt>

                      <dd>
                        ${escapeHtml(
                          getCustomerName(
                            payment.user_id
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Workspace</dt>

                      <dd>
                        ${escapeHtml(
                          workspace
                            ? `${workspace.name} (${workspace.unit_code})`
                            : "Unknown workspace"
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Amount</dt>

                      <dd>
                        ${escapeHtml(
                          formatPrice(
                            payment.amount
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Method</dt>

                      <dd>
                        ${escapeHtml(
                          payment.payment_method ||
                          "Not completed"
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Created</dt>

                      <dd>
                        ${escapeHtml(
                          formatDateTime(
                            payment.created_at
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Paid</dt>

                      <dd>
                        ${escapeHtml(
                          formatDateTime(
                            payment.paid_at
                          )
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              `;
            })
            .join("")
        : `
          <div class="empty-state">
            No payments match the selected filters.
          </div>
        `;
  }

  function createRefundActions(
    refund
  ) {
    if (
      refund.status === "requested"
    ) {
      return `
        <button
          type="button"
          class="button primary"
          data-refund-id="${escapeHtml(refund.id)}"
          data-refund-action="approve"
        >
          Approve
        </button>

        <button
          type="button"
          class="button secondary"
          data-refund-id="${escapeHtml(refund.id)}"
          data-refund-action="reject"
        >
          Reject
        </button>
      `;
    }

    if (
      refund.status === "approved"
    ) {
      return `
        <button
          type="button"
          class="button primary"
          data-refund-id="${escapeHtml(refund.id)}"
          data-refund-action="processing"
        >
          Mark processing
        </button>

        <button
          type="button"
          class="button secondary"
          data-refund-id="${escapeHtml(refund.id)}"
          data-refund-action="refunded"
        >
          Mark refunded
        </button>

        <button
          type="button"
          class="button secondary"
          data-refund-id="${escapeHtml(refund.id)}"
          data-refund-action="reject"
        >
          Reject
        </button>
      `;
    }

    if (
      refund.status === "processing"
    ) {
      return `
        <button
          type="button"
          class="button primary"
          data-refund-id="${escapeHtml(refund.id)}"
          data-refund-action="refunded"
        >
          Mark refunded
        </button>
      `;
    }

    return "";
  }

  function renderRefunds() {
    const search =
      normaliseSearch(
        refundSearch.value
      );

    const statusFilter =
      refundStatusFilter.value;

    const filtered =
      refunds.filter((refund) => {
        const booking =
          bookingsById.get(
            refund.booking_id
          );

        const workspace =
          workspacesById.get(
            booking?.workspace_id
          );

        const customerName =
          getCustomerName(
            refund.requested_by
          );

        const searchableText =
          normaliseSearch(
            [
              refund.id,
              refund.booking_id,
              createReference(
                refund.booking_id
              ),
              customerName,
              workspace?.name,
              workspace?.unit_code,
              refund.reason,
              refund.status
            ].join(" ")
          );

        const matchesSearch =
          !search ||
          searchableText.includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          refund.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      });

    adminRefundList.innerHTML =
      filtered.length
        ? filtered
            .map((refund) => {
              const booking =
                bookingsById.get(
                  refund.booking_id
                );

              const workspace =
                workspacesById.get(
                  booking?.workspace_id
                );

              const actions =
                createRefundActions(
                  refund
                );

              return `
                <article
                  class="admin-record-card"
                  data-refund-record="${escapeHtml(
                    refund.id
                  )}"
                >
                  <div class="reservation-card-top">
                    <div>
                      <span class="pill">
                        Refund request
                      </span>

                      <h3>
                        ${escapeHtml(
                          workspace
                            ? `${workspace.name} (${workspace.unit_code})`
                            : "Unknown workspace"
                        )}
                      </h3>

                      <p>
                        Booking
                        ${escapeHtml(
                          createReference(
                            refund.booking_id
                          )
                        )}
                      </p>
                    </div>

                    <span
                      class="pill status-${escapeHtml(
                        statusClass(
                          refund.status
                        )
                      )}"
                    >
                      ${escapeHtml(
                        refundStatusLabel(
                          refund.status
                        )
                      )}
                    </span>
                  </div>

                  <dl class="reservation-details">
                    <div>
                      <dt>Customer</dt>

                      <dd>
                        ${escapeHtml(
                          getCustomerName(
                            refund.requested_by
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Amount</dt>

                      <dd>
                        ${escapeHtml(
                          formatPrice(
                            refund.amount
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Requested</dt>

                      <dd>
                        ${escapeHtml(
                          formatDateTime(
                            refund.requested_at
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Processed</dt>

                      <dd>
                        ${escapeHtml(
                          formatDateTime(
                            refund.processed_at
                          )
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div class="reservation-status-note">
                    <strong>
                      Customer reason:
                    </strong>

                    ${escapeHtml(
                      refund.reason
                    )}
                  </div>

                  ${
                    refund.admin_note
                      ? `
                        <div class="reservation-status-note">
                          <strong>
                            Administrative note:
                          </strong>

                          ${escapeHtml(
                            refund.admin_note
                          )}
                        </div>
                      `
                      : ""
                  }

                  ${
                    actions
                      ? `
                        <div class="reservation-card-actions">
                          ${actions}
                        </div>
                      `
                      : ""
                  }
                </article>
              `;
            })
            .join("")
        : `
          <div class="empty-state">
            No refund requests match the selected filters.
          </div>
        `;
  }

  function renderAllSections() {
    renderStatistics();
    populateWorkspaceTypeOptions();
    renderInventory();
    renderBookings();
    renderPayments();
    renderRefunds();
  }

  async function loadAdminData() {
    setLoadingState();
    setPageMessage("");

    try {
      await synchroniseBookingStatuses();
      await fetchAdminData();
      renderAllSections();
    } catch (error) {
      console.error(
        "Unable to load administrator data:",
        error
      );

      setPageMessage(
        error.message ||
        "Administrative data could not be loaded.",
        "error"
      );

      inventoryList.innerHTML = `
        <div class="empty-state">
          Workspace inventory could not be loaded.
        </div>
      `;

      adminBookingList.innerHTML = `
        <div class="empty-state">
          Bookings could not be loaded.
        </div>
      `;

      adminPaymentList.innerHTML = `
        <div class="empty-state">
          Payments could not be loaded.
        </div>
      `;

      adminRefundList.innerHTML = `
        <div class="empty-state">
          Refund requests could not be loaded.
        </div>
      `;
    } finally {
      setLoadedState();
    }
  }

  function openWorkspaceModal(
    workspace = null
  ) {
    workspaceForm.reset();
    setWorkspaceFormMessage("");

    populateWorkspaceTypeOptions();

    populateWorkspaceBranchOptions();

    if (workspace) {
      workspaceFormTitle.textContent =
        "Edit workspace unit";

      workspaceExistingId.value =
        workspace.id;

      workspaceTypeId.value =
        workspace.workspace_type_id;
      
      workspaceBranchId.value =
        workspace.branch_id || "";
      
      workspaceUnitCode.value =
        workspace.unit_code;

      workspaceName.value =
        workspace.name;

      workspaceDescription.value =
        workspace.description;

      workspaceLayout.value =
        workspace.layout;

      workspaceCapacity.value =
        workspace.capacity;

      workspaceMorningPrice.value =
        workspace.morning_price;
      
      workspaceAfternoonPrice.value =
        workspace.afternoon_price;
      
      workspaceEveningPrice.value =
        workspace.evening_price;
      
      workspaceFullDayPrice.value =
        workspace.full_day_price;

      workspaceImageUrl.value =
        workspace.image_url || "";

      workspaceDisplayOrder.value =
        workspace.display_order;

      workspaceActive.checked =
        workspace.active;
    } else {
      workspaceFormTitle.textContent =
        "Add workspace unit";

      workspaceExistingId.value = "";

      workspaceBranchId.value =
        workspaceBranches.find(
          (branch) => branch.active
        )?.id || "";
      
      workspaceCapacity.value = "1";
      workspaceMorningPrice.value = "0";
      workspaceAfternoonPrice.value = "0";
      workspaceEveningPrice.value = "0";
      workspaceFullDayPrice.value = "0";
      workspaceDisplayOrder.value = "0";
      workspaceActive.checked = true;
    }

    workspaceModal.hidden = false;
    document.body.style.overflow =
      "hidden";

    window.setTimeout(() => {
      workspaceUnitCode.focus();
    }, 0);
  }

  function closeWorkspaceModal() {
    workspaceModal.hidden = true;
    document.body.style.overflow = "";
    workspaceForm.reset();
    setWorkspaceFormMessage("");
  }

  function generateWorkspaceId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        "function"
    ) {
      return (
        "workspace-" +
        window.crypto.randomUUID()
      );
    }

    return (
      "workspace-" +
      Date.now().toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  }

  function readWorkspacePrice(
    input,
    label
  ) {
    const value = Number(input.value);
  
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new Error(
        `${label} must be zero or higher.`
      );
    }
  
    return value;
  }

  function getWorkspacePayload() {
    const capacity =
      Number(workspaceCapacity.value);
  
    const displayOrder =
      Number(workspaceDisplayOrder.value);
  
    if (
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      throw new Error(
        "Workspace capacity must be at least 1."
      );
    }
  
    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 0
    ) {
      throw new Error(
        "Display order must be zero or higher."
      );
    }

    if (!workspaceBranchId.value) {
      throw new Error(
        "Select a branch for this workspace."
      );
    }
  
    const morningPrice =
      readWorkspacePrice(
        workspaceMorningPrice,
        "Morning price"
      );
  
    const afternoonPrice =
      readWorkspacePrice(
        workspaceAfternoonPrice,
        "Afternoon price"
      );
  
    const eveningPrice =
      readWorkspacePrice(
        workspaceEveningPrice,
        "Evening price"
      );
  
    const fullDayPrice =
      readWorkspacePrice(
        workspaceFullDayPrice,
        "Full-day price"
      );
  
    return {
      workspace_type_id:
        workspaceTypeId.value,

      branch_id:
        workspaceBranchId.value,
  
      unit_code:
        workspaceUnitCode.value
          .trim()
          .toUpperCase(),
  
      name:
        workspaceName.value.trim(),
  
      description:
        workspaceDescription.value.trim(),
  
      layout:
        workspaceLayout.value.trim(),
  
      capacity,
  
      /*
       * The legacy price column stores the full-day
       * rate for backward compatibility.
       */
      price:
        fullDayPrice,
  
      morning_price:
        morningPrice,
  
      afternoon_price:
        afternoonPrice,
  
      evening_price:
        eveningPrice,
  
      full_day_price:
        fullDayPrice,
  
      image_url:
        workspaceImageUrl.value.trim() ||
        null,
  
      active:
        workspaceActive.checked,
  
      display_order:
        displayOrder
    };
  }

  async function saveWorkspace(
    event
  ) {
    event.preventDefault();

    saveWorkspaceButton.disabled = true;

    setWorkspaceFormMessage(
      "Saving workspace unit...",
      "loading"
    );

    try {
      const client =
        getSupabaseClient();

      const payload =
        getWorkspacePayload();

      const existingId =
        workspaceExistingId.value;

      let result;

      if (existingId) {
        result =
          await client
            .from("workspaces")
            .update(payload)
            .eq("id", existingId)
            .select("id")
            .single();
      } else {
        result =
          await client
            .from("workspaces")
            .insert({
              id: generateWorkspaceId(),
              ...payload
            })
            .select("id")
            .single();
      }

      if (result.error) {
        throw result.error;
      }

      closeWorkspaceModal();
      await loadAdminData();

      setPageMessage(
        existingId
          ? "Workspace unit updated successfully."
          : "Workspace unit added successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Workspace could not be saved:",
        error
      );

      const duplicateUnitCode =
        error.code === "23505";

      setWorkspaceFormMessage(
        duplicateUnitCode
          ? "The unit code is already in use."
          : (
            error.message ||
            "The workspace could not be saved."
          ),
        "error"
      );
    } finally {
      saveWorkspaceButton.disabled =
        false;
    }
  }

  async function toggleWorkspace(
    workspaceId
  ) {
    const workspace =
      workspacesById.get(
        workspaceId
      );

    if (!workspace) {
      setPageMessage(
        "The selected workspace could not be found.",
        "error"
      );

      return;
    }

    const newActiveState =
      !workspace.active;

    const confirmed =
      window.confirm(
        newActiveState
          ? `Activate ${workspace.name} (${workspace.unit_code})?`
          : `Deactivate ${workspace.name} (${workspace.unit_code})?`
      );

    if (!confirmed) {
      return;
    }

    setPageMessage(
      newActiveState
        ? "Activating workspace..."
        : "Deactivating workspace...",
      "loading"
    );

    try {
      const { error } =
        await getSupabaseClient()
          .from("workspaces")
          .update({
            active: newActiveState
          })
          .eq("id", workspace.id);

      if (error) {
        throw error;
      }

      await loadAdminData();

      setPageMessage(
        newActiveState
          ? "Workspace activated successfully."
          : "Workspace deactivated successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Workspace status update failed:",
        error
      );

      setPageMessage(
        error.message ||
        "The workspace status could not be updated.",
        "error"
      );
    }
  }

  function openRefundActionModal(
    refundId,
    action
  ) {
    const refund =
      refunds.find(
        (item) =>
          item.id === refundId
      );

    if (!refund) {
      setPageMessage(
        "The selected refund request could not be found.",
        "error"
      );

      return;
    }

    const actionDetails = {
      approve: {
        title:
          "Approve refund request",

        description:
          "Approve this request. The booking remains confirmed and the payment remains paid until the refund is completed.",

        button:
          "Approve request"
      },

      processing: {
        title:
          "Mark refund as processing",

        description:
          "Record that the approved refund is currently being processed.",

        button:
          "Mark processing"
      },

      refunded: {
        title:
          "Complete refund",

        description:
          "This marks the payment as refunded and the booking as cancelled.",

        button:
          "Mark refunded"
      },

      reject: {
        title:
          "Reject refund request",

        description:
          "Reject this request. The booking remains confirmed, the payment remains paid, and the cancellation request is closed.",

        button:
          "Reject request"
      }
    };

    const details =
      actionDetails[action];

    if (!details) {
      setPageMessage(
        "Unsupported refund action.",
        "error"
      );

      return;
    }

    refundActionForm.reset();

    refundActionId.value =
      refundId;

    refundActionType.value =
      action;

    refundActionTitle.textContent =
      details.title;

    refundActionDescription.textContent =
      details.description;

    confirmRefundAction.textContent =
      details.button;

    refundAdminNote.required =
      action === "reject";

    refundAdminNote.placeholder =
      action === "reject"
        ? "Explain why the refund request is being rejected."
        : "Record optional processing information.";

    setRefundActionMessage("");

    refundActionModal.hidden = false;
    document.body.style.overflow =
      "hidden";

    window.setTimeout(() => {
      refundAdminNote.focus();
    }, 0);
  }

  function closeRefundActionModal() {
    refundActionModal.hidden = true;
    document.body.style.overflow = "";
    refundActionForm.reset();
    setRefundActionMessage("");
  }

  async function processRefundAction(
    event
  ) {
    event.preventDefault();

    const refundId =
      refundActionId.value;

    const action =
      refundActionType.value;

    const adminNote =
      refundAdminNote.value.trim();

    if (
      action === "reject" &&
      !adminNote
    ) {
      setRefundActionMessage(
        "Enter an administrative reason before rejecting the request.",
        "error"
      );

      refundAdminNote.focus();
      return;
    }

    confirmRefundAction.disabled =
      true;

    setRefundActionMessage(
      "Updating refund request...",
      "loading"
    );

    try {
      const { error } =
        await getSupabaseClient().rpc(
          PROCESS_REFUND_RPC,
          {
            p_refund_id:
              refundId,

            p_action:
              action,

            p_admin_note:
              adminNote || null
          }
        );

      if (error) {
        throw error;
      }

      closeRefundActionModal();
      await loadAdminData();

      setPageMessage(
        "Refund request updated successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Refund action failed:",
        error
      );

      setRefundActionMessage(
        error.message ||
        "The refund request could not be updated.",
        "error"
      );
    } finally {
      confirmRefundAction.disabled =
        false;
    }
  }

  function handleInventoryClick(
    event
  ) {
    const editButton =
      event.target.closest(
        "[data-edit-workspace]"
      );

    if (editButton) {
      const workspace =
        workspacesById.get(
          editButton.dataset.editWorkspace
        );

      if (workspace) {
        openWorkspaceModal(
          workspace
        );
      }

      return;
    }

    const toggleButton =
      event.target.closest(
        "[data-toggle-workspace]"
      );

    if (toggleButton) {
      void toggleWorkspace(
        toggleButton.dataset
          .toggleWorkspace
      );
    }
  }

  function handleRefundListClick(
    event
  ) {
    const button =
      event.target.closest(
        "[data-refund-id][data-refund-action]"
      );

    if (!button) {
      return;
    }

    openRefundActionModal(
      button.dataset.refundId,
      button.dataset.refundAction
    );
  }

  function closeModalOnOverlay(
    event
  ) {
    if (
      event.target ===
      workspaceModal
    ) {
      closeWorkspaceModal();
    }

    if (
      event.target ===
      refundActionModal
    ) {
      closeRefundActionModal();
    }
  }

  function handleEscapeKey(
    event
  ) {
    if (event.key !== "Escape") {
      return;
    }

    if (!workspaceModal.hidden) {
      closeWorkspaceModal();
    }

    if (!refundActionModal.hidden) {
      closeRefundActionModal();
    }
  }

   function scheduleAdminRealtimeRefresh(
    delay = 500
  ) {
    window.clearTimeout(
      adminRealtimeRefreshTimer
    );
  
    adminRealtimeRefreshTimer =
      window.setTimeout(
        () => {
          /*
           * Avoid replacing form contents while an
           * administrator is editing a workspace or
           * processing a refund request.
           */
          if (
            !workspaceModal.hidden ||
            !refundActionModal.hidden
          ) {
            scheduleAdminRealtimeRefresh(
              1000
            );
  
            return;
          }
  
          /*
           * Avoid starting another request while the
           * administrator data is already loading.
           */
          if (
            adminContent.getAttribute(
              "aria-busy"
            ) === "true"
          ) {
            scheduleAdminRealtimeRefresh(
              700
            );
  
            return;
          }
  
          void loadAdminData();
        },
        delay
      );
  }
  
  function stopAdminRealtimeSubscription() {
    window.clearTimeout(
      adminRealtimeRefreshTimer
    );
  
    adminRealtimeRefreshTimer = null;
  
    if (!adminRealtimeChannel) {
      return;
    }
  
    void getSupabaseClient()
      .removeChannel(
        adminRealtimeChannel
      );
  
    adminRealtimeChannel = null;
  }
  
  function startAdminRealtimeSubscription() {
    if (!currentUser?.id) {
      return;
    }
  
    stopAdminRealtimeSubscription();
  
    const handleOperationalChange =
      () => {
        scheduleAdminRealtimeRefresh();
      };
  
    adminRealtimeChannel =
      getSupabaseClient()
        .channel(
          `syncspace-admin-operations-${currentUser.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles"
          },
          handleOperationalChange
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings"
          },
          handleOperationalChange
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "payments"
          },
          handleOperationalChange
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "refunds"
          },
          handleOperationalChange
        )
        .subscribe(
          (status) => {
            if (
              status === "SUBSCRIBED"
            ) {
              console.log(
                "Administrator operational " +
                "Realtime subscription active."
              );
  
              return;
            }
  
            if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT"
            ) {
              console.warn(
                "Administrator Realtime updates " +
                "are unavailable. Manual and " +
                "focus-based refresh remain active."
              );
            }
          }
        );
  }
  
  function registerEventListeners() {
    refreshAdminButton.addEventListener(
      "click",
      () => {
        void loadAdminData();
      }
    );

    inventorySearch.addEventListener(
      "input",
      renderInventory
    );

    inventoryStatusFilter.addEventListener(
      "change",
      renderInventory
    );

    bookingSearch.addEventListener(
      "input",
      renderBookings
    );

    bookingStatusFilter.addEventListener(
      "change",
      renderBookings
    );

    paymentSearch.addEventListener(
      "input",
      renderPayments
    );

    paymentStatusFilter.addEventListener(
      "change",
      renderPayments
    );

    refundSearch.addEventListener(
      "input",
      renderRefunds
    );

    refundStatusFilter.addEventListener(
      "change",
      renderRefunds
    );

    addWorkspaceButton.addEventListener(
      "click",
      () => {
        openWorkspaceModal();
      }
    );

    inventoryList.addEventListener(
      "click",
      handleInventoryClick
    );

    adminRefundList.addEventListener(
      "click",
      handleRefundListClick
    );

    workspaceForm.addEventListener(
      "submit",
      saveWorkspace
    );

    refundActionForm.addEventListener(
      "submit",
      processRefundAction
    );

    closeWorkspaceModalButton
      .addEventListener(
        "click",
        closeWorkspaceModal
      );

    cancelWorkspaceFormButton
      .addEventListener(
        "click",
        closeWorkspaceModal
      );

    closeRefundModalButton
      .addEventListener(
        "click",
        closeRefundActionModal
      );

    cancelRefundActionButton
      .addEventListener(
        "click",
        closeRefundActionModal
      );

    workspaceModal.addEventListener(
      "click",
      closeModalOnOverlay
    );

    refundActionModal.addEventListener(
      "click",
      closeModalOnOverlay
    );

    document.addEventListener(
      "keydown",
      handleEscapeKey
    );
    
    window.addEventListener(
      "focus",
      () => {
        if (
          workspaceModal.hidden &&
          refundActionModal.hidden
        ) {
          void loadAdminData();
        }
      }
    );

    window.addEventListener(
      "beforeunload",
      stopAdminRealtimeSubscription
    );    
  }

  async function initialiseAdminPage() {
    assertRequiredElements();

    const authorised =
      await requireAdmin(
        "index.html"
      );

    if (!authorised) {
      return;
    }

    currentUser =
      await getUser();

    if (!currentUser) {
      return;
    }

    currentProfile =
      await getUserProfile(
        currentUser
      );

    adminDisplayName.textContent =
      getDisplayName(
        currentUser,
        currentProfile
      );

    registerEventListeners();
    startAdminRealtimeSubscription();
    await loadAdminData();
  }

  async function start() {
    try {
      await initialiseAdminPage();
    } catch (error) {
      console.error(
        "Administrator page initialization failed:",
        error
      );

      if (adminPageMessage) {
        setPageMessage(
          error.message ||
          "The administration page could not be loaded.",
          "error"
        );
      }

      if (adminContent) {
        setLoadedState();
      }
    }
  }

  if (
    document.readyState === "loading"
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
