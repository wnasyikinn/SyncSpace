(() => {
  "use strict";

  const notificationLinks =
    document.querySelectorAll(
      "[data-notification-link]"
    );

  const notificationCounts =
    document.querySelectorAll(
      "[data-notification-count]"
    );

  let refreshTimer = null;

  async function refreshCount() {
    try {
      const user =
        await getUser();

      notificationLinks.forEach(
        (link) => {
          link.style.display =
            user ? "" : "none";
        }
      );

      if (!user) {
        notificationCounts.forEach(
          (count) => {
            count.hidden = true;
            count.textContent = "0";
          }
        );

        return;
      }

      const { data, error } =
        await getSupabaseClient().rpc(
          "get_unread_notification_count"
        );

      if (error) {
        throw error;
      }

      const unreadCount =
        Number(data || 0);

      notificationCounts.forEach(
        (count) => {
          count.textContent =
            unreadCount > 99
              ? "99+"
              : String(unreadCount);

          count.hidden =
            unreadCount === 0;
        }
      );
    } catch (error) {
      console.warn(
        "Notification count could not be loaded:",
        error.message
      );
    }
  }

  function startPolling() {
    window.clearInterval(
      refreshTimer
    );

    refreshTimer =
      window.setInterval(
        () => {
          void refreshCount();
        },
        60000
      );
  }

  window.addEventListener(
    "syncspace:auth-changed",
    () => {
      void refreshCount();
    }
  );

  window.addEventListener(
    "syncspace:notifications-changed",
    () => {
      void refreshCount();
    }
  );

  window.addEventListener(
    "focus",
    () => {
      void refreshCount();
    }
  );

  void refreshCount();
  startPolling();
})();
