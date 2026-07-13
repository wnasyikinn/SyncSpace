(() => {
  "use strict";

  console.log(
    "SyncSpace profile network script loaded"
  );

  const myFollowerCount =
    document.querySelector(
      "#myFollowerCount"
    );

  const myFollowingCount =
    document.querySelector(
      "#myFollowingCount"
    );

  const myFollowersList =
    document.querySelector(
      "#myFollowersList"
    );

  const myFollowingList =
    document.querySelector(
      "#myFollowingList"
    );

  function assertRequiredElements() {
    const requiredElements = {
      myFollowerCount,
      myFollowingCount,
      myFollowersList,
      myFollowingList
    };

    const missing =
      Object
        .entries(requiredElements)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Profile network elements were not found: " +
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

  function createInitials(name) {
    return (
      String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase() ||
      "SS"
    );
  }

  function safeImageUrl(value) {
    if (!value) {
      return null;
    }

    try {
      const url =
        new URL(
          String(value),
          window.location.href
        );

      if (
        url.protocol === "http:" ||
        url.protocol === "https:"
      ) {
        return url.href;
      }
    } catch {
      return null;
    }

    return null;
  }

  function avatarMarkup(member) {
    const displayName =
      member.full_name ||
      member.username ||
      "SyncSpace member";

    const imageUrl =
      safeImageUrl(
        member.avatar_url
      );

    if (imageUrl) {
      return `
        <img
          class="profile-network-avatar"
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(displayName)}"
        >
      `;
    }

    return `
      <span
        class="profile-network-avatar
          profile-network-avatar-initials"
        aria-hidden="true"
      >
        ${escapeHtml(
          createInitials(displayName)
        )}
      </span>
    `;
  }

  function renderMember(member) {
    const displayName =
      member.full_name ||
      member.username ||
      "SyncSpace member";

    return `
      <article class="profile-network-member">
        <a
          class="profile-network-member-link"
          href="user-profile.html?id=${encodeURIComponent(
            member.related_user_id
          )}"
        >
          ${avatarMarkup(member)}

          <span>
            <strong>
              ${escapeHtml(displayName)}
            </strong>

            ${
              member.username
                ? `
                  <small>
                    @${escapeHtml(
                      member.username
                    )}
                  </small>
                `
                : ""
            }
          </span>
        </a>
      </article>
    `;
  }

  function renderNetwork(
    followers,
    following
  ) {
    myFollowerCount.textContent =
      String(followers.length);

    myFollowingCount.textContent =
      String(following.length);

    myFollowersList.innerHTML =
      followers.length > 0
        ? followers
            .map(renderMember)
            .join("")
        : `
          <div class="empty-state">
            You do not have any followers yet.
          </div>
        `;

    myFollowingList.innerHTML =
      following.length > 0
        ? following
            .map(renderMember)
            .join("")
        : `
          <div class="empty-state">
            You are not following any members yet.
          </div>
        `;
  }

  async function loadNetwork() {
    const { data, error } =
      await getSupabaseClient().rpc(
        "get_my_follow_network"
      );

    if (error) {
      throw error;
    }

    const relationships =
      data || [];

    const followers =
      relationships.filter(
        (relationship) =>
          relationship
            .relationship_type ===
          "follower"
      );

    const following =
      relationships.filter(
        (relationship) =>
          relationship
            .relationship_type ===
          "following"
      );

    renderNetwork(
      followers,
      following
    );
  }

  async function initialiseProfileNetwork() {
    assertRequiredElements();

    const currentUser =
      await requireAuthenticatedUser(
        "index.html"
      );

    if (!currentUser) {
      return;
    }

    await loadNetwork();
  }

  async function start() {
    try {
      await initialiseProfileNetwork();
    } catch (error) {
      console.error(
        "Profile network initialization failed:",
        error
      );

      myFollowersList.innerHTML = `
        <div class="empty-state">
          Followers could not be loaded.
        </div>
      `;

      myFollowingList.innerHTML = `
        <div class="empty-state">
          Followed members could not be loaded.
        </div>
      `;

      const profilePageMessage =
        document.querySelector(
          "#profilePageMessage"
        );

      if (profilePageMessage) {
        profilePageMessage.textContent =
          error.message ||
          "Your community network could not be loaded.";

        profilePageMessage.dataset.status =
          "error";
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
