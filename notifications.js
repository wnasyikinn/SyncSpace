(() => {
  "use strict";

  console.log(
    "SyncSpace notifications script loaded"
  );

  const notificationPage =
    document.querySelector(
      "#notificationPage"
    );

  const notificationPageMessage =
    document.querySelector(
      "#notificationPageMessage"
    );

  const notificationFilter =
    document.querySelector(
      "#notificationFilter"
    );

  const markAllButton =
    document.querySelector(
      "#markAllNotificationsRead"
    );

  const refreshButton =
    document.querySelector(
      "#refreshNotifications"
    );

  const notificationList =
    document.querySelector(
      "#notificationList"
    );

  let currentUser = null;
  let notifications = [];

  function escapeHtml(value) {
    const element =
      document.createElement("div");

    element.textContent =
      String(value ?? "");

    return element.innerHTML;
  }

  function formatDateTime(value) {
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
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur"
      }
    ).format(date);
  }

  function notificationIcon(type) {
    const icons = {
      /*
       * Member and community notifications
       */
      new_follower: "👤",
      post_like: "👍",
      post_comment: "💬",
      review_moderation: "⭐",
      cancellation_request: "📅",
      refund_approved: "✅",
      refund_rejected: "❌",
      refund_processing: "⏳",
      refund_completed: "💳",
      content_moderation: "🛡️",
  
      /*
       * Administrator operational notifications
       */
      admin_new_profile: "👤",
      admin_new_booking: "📅",
      admin_payment_completed: "💳",
      admin_payment_failed: "⚠️",
      admin_cancellation_request: "↩️",
  
      /*
       * Administrator social and moderation
       * notification types reserved for later steps.
       */
      admin_content_report: "🚩",
      admin_review_submitted: "⭐",
      admin_post_reported: "🚩",
      admin_comment_reported: "💬",
      admin_workspace_created: "🏢",
      admin_workspace_updated: "🏢"
    };
  
    return icons[type] || "🔔";
  }

  function safeInternalLink(value) {
    if (!value) {
      return null;
    }

    try {
      const url =
        new URL(
          value,
          window.location.href
        );

      if (
        url.origin ===
        window.location.origin
      ) {
        return url.href;
      }
    } catch {
      return null;
    }

    return null;
  }

  function setMessage(
    message,
    status = ""
  ) {
    notificationPageMessage.textContent =
      message;

    notificationPageMessage.dataset.status =
      status;
  }

  function renderNotifications() {
    const filter =
      notificationFilter.value;

    const visible =
      notifications.filter(
        (notification) =>
          filter === "all" ||
          !notification.is_read
      );

    if (visible.length === 0) {
      notificationList.innerHTML = `
        <div class="empty-state">
          ${
            filter === "unread"
              ? "You have no unread notifications."
              : "You have no notifications yet."
          }
        </div>
      `;

      return;
    }

    notificationList.innerHTML =
      visible
        .map((notification) => {
          const link =
            safeInternalLink(
              notification.link_url
            );

          return `
            <article
              class="notification-card ${
                notification.is_read
                  ? "is-read"
                  : "is-unread"
              }"
            >
              <div class="notification-icon">
                ${escapeHtml(
                  notificationIcon(
                    notification.type
                  )
                )}
              </div>

              <div class="notification-content">
                <div class="notification-heading">
                  <strong>
                    ${escapeHtml(
                      notification.title
                    )}
                  </strong>

                  ${
                    notification.is_read
                      ? ""
                      : `
                        <span class="notification-unread-dot">
                          Unread
                        </span>
                      `
                  }
                </div>

                <p>
                  ${escapeHtml(
                    notification.message
                  )}
                </p>

                <span class="notification-date">
                  ${escapeHtml(
                    formatDateTime(
                      notification.created_at
                    )
                  )}
                </span>
              </div>

              <div class="notification-actions">
                ${
                  !notification.is_read
                    ? `
                      <button
                        type="button"
                        class="button secondary"
                        data-mark-notification="${escapeHtml(
                          notification.id
                        )}"
                      >
                        Mark read
                      </button>
                    `
                    : ""
                }

                ${
                  link
                    ? `
                      <button
                        type="button"
                        class="button primary"
                        data-open-notification="${escapeHtml(
                          notification.id
                        )}"
                        data-notification-link="${escapeHtml(
                          link
                        )}"
                      >
                        View
                      </button>
                    `
                    : ""
                }
              </div>
            </article>
          `;
        })
        .join("");
  }

  async function loadNotifications() {
    notificationPage.setAttribute(
      "aria-busy",
      "true"
    );

    refreshButton.disabled = true;

    const { data, error } =
      await getSupabaseClient()
        .from("notifications")
        .select(`
          id,
          type,
          title,
          message,
          link_url,
          entity_type,
          entity_id,
          is_read,
          read_at,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(100);

    notificationPage.setAttribute(
      "aria-busy",
      "false"
    );

    refreshButton.disabled = false;

    if (error) {
      throw error;
    }

    notifications = data || [];

    renderNotifications();

    window.dispatchEvent(
      new CustomEvent(
        "syncspace:notifications-changed"
      )
    );
  }

  async function markNotificationRead(
    notificationId
  ) {
    const { error } =
      await getSupabaseClient().rpc(
        "mark_notification_read",
        {
          p_notification_id:
            notificationId
        }
      );

    if (error) {
      throw error;
    }

    const notification =
      notifications.find(
        (item) =>
          item.id === notificationId
      );

    if (notification) {
      notification.is_read = true;
    }

    renderNotifications();

    window.dispatchEvent(
      new CustomEvent(
        "syncspace:notifications-changed"
      )
    );
  }

  async function markAllRead() {
    markAllButton.disabled = true;

    try {
      const { error } =
        await getSupabaseClient().rpc(
          "mark_all_notifications_read"
        );

      if (error) {
        throw error;
      }

      notifications.forEach(
        (notification) => {
          notification.is_read = true;
        }
      );

      renderNotifications();

      setMessage(
        "All notifications were marked as read.",
        "success"
      );

      window.dispatchEvent(
        new CustomEvent(
          "syncspace:notifications-changed"
        )
      );
    } catch (error) {
      setMessage(
        error.message ||
        "Notifications could not be updated.",
        "error"
      );
    } finally {
      markAllButton.disabled = false;
    }
  }

  async function handleNotificationClick(
    event
  ) {
    const markButton =
      event.target.closest(
        "[data-mark-notification]"
      );

    if (markButton) {
      try {
        await markNotificationRead(
          markButton.dataset
            .markNotification
        );
      } catch (error) {
        setMessage(
          error.message,
          "error"
        );
      }

      return;
    }

    const openButton =
      event.target.closest(
        "[data-open-notification]"
      );

    if (!openButton) {
      return;
    }

    try {
      await markNotificationRead(
        openButton.dataset
          .openNotification
      );
    } catch (error) {
      console.warn(
        "Notification could not be marked as read:",
        error.message
      );
    }

    window.location.href =
      openButton.dataset
        .notificationLink;
  }

  async function initialise() {
    currentUser =
      await requireAuthenticatedUser(
        "index.html"
      );

    if (!currentUser) {
      return;
    }

    notificationFilter.addEventListener(
      "change",
      renderNotifications
    );

    refreshButton.addEventListener(
      "click",
      () => {
        void loadNotifications();
      }
    );

    markAllButton.addEventListener(
      "click",
      () => {
        void markAllRead();
      }
    );

    notificationList.addEventListener(
      "click",
      (event) => {
        void handleNotificationClick(
          event
        );
      }
    );

    await loadNotifications();
  }

  async function start() {
    try {
      await initialise();
    } catch (error) {
      console.error(
        "Notification initialization failed:",
        error
      );

      setMessage(
        error.message ||
        "Notifications could not be loaded.",
        "error"
      );
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
