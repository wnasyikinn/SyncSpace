(() => {
  "use strict";

  console.log(
    "SyncSpace notification navigation loaded"
  );

  const notificationLinks =
    document.querySelectorAll(
      "[data-notification-link]"
    );

  const notificationCounts =
    document.querySelectorAll(
      "[data-notification-count]"
    );

  let refreshTimer = null;
  let notificationChannel = null;
  let subscribedUserId = null;
  let refreshInProgress = false;

  function updateNotificationVisibility(
    user
  ) {
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
    }
  }

  function updateNotificationCount(
    unreadCount
  ) {
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
  }

  function stopRealtimeSubscription() {
    if (notificationChannel) {
      void getSupabaseClient()
        .removeChannel(
          notificationChannel
        );

      notificationChannel = null;
    }

    subscribedUserId = null;
  }

  function startRealtimeSubscription(
    user
  ) {
    if (!user?.id) {
      stopRealtimeSubscription();
      return;
    }

    if (
      notificationChannel &&
      subscribedUserId === user.id
    ) {
      return;
    }

    stopRealtimeSubscription();

    const client =
      getSupabaseClient();

    subscribedUserId =
      user.id;

    notificationChannel =
      client
        .channel(
          `syncspace-notifications-${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter:
              `user_id=eq.${user.id}`
          },
          () => {
            /*
             * A notification was inserted,
             * updated, marked as read, or
             * otherwise changed.
             */
            void refreshCount(
              user
            );
          }
        )
        .subscribe(
          (status) => {
            if (
              status ===
              "CHANNEL_ERROR"
            ) {
              console.warn(
                "Realtime notification " +
                "subscription could not " +
                "be established. Polling " +
                "will remain active."
              );
            }
          }
        );
  }

  async function refreshCount(
    providedUser = undefined
  ) {
    if (refreshInProgress) {
      return;
    }

    refreshInProgress = true;

    try {
      const user =
        providedUser === undefined
          ? await getUser()
          : providedUser;

      updateNotificationVisibility(
        user
      );

      if (!user) {
        stopRealtimeSubscription();
        return;
      }

      startRealtimeSubscription(
        user
      );

      const { data, error } =
        await getSupabaseClient().rpc(
          "get_unread_notification_count"
        );

      if (error) {
        throw error;
      }

      const unreadCount =
        Number(data || 0);

      updateNotificationCount(
        unreadCount
      );
    } catch (error) {
      console.warn(
        "Notification count could not " +
          "be loaded:",
        error.message
      );
    } finally {
      refreshInProgress = false;
    }
  }

  function startPolling() {
    window.clearInterval(
      refreshTimer
    );

    /*
     * Polling remains as a fallback if
     * Supabase Realtime is unavailable.
     */
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
    (event) => {
      void refreshCount(
        event.detail?.user ?? null
      );
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

  window.addEventListener(
    "beforeunload",
    () => {
      window.clearInterval(
        refreshTimer
      );

      stopRealtimeSubscription();
    }
  );

  void refreshCount();
  startPolling();
})();
