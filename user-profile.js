(() => {
  "use strict";

  console.log(
    "SyncSpace public profile script loaded"
  );

  const publicProfilePage =
    document.querySelector(
      "#publicProfilePage"
    );

  const publicProfileMessage =
    document.querySelector(
      "#publicProfileMessage"
    );

  const publicProfileCard =
    document.querySelector(
      "#publicProfileCard"
    );

  const publicProfileAvatar =
    document.querySelector(
      "#publicProfileAvatar"
    );

  const publicProfileName =
    document.querySelector(
      "#publicProfileName"
    );

  const publicProfileUsername =
    document.querySelector(
      "#publicProfileUsername"
    );

  const publicProfileHeadline =
    document.querySelector(
      "#publicProfileHeadline"
    );

  const publicProfileLocation =
    document.querySelector(
      "#publicProfileLocation"
    );

  const followUserButton =
    document.querySelector(
      "#followUserButton"
    );

  const publicFollowerCount =
    document.querySelector(
      "#publicFollowerCount"
    );

  const publicFollowingCount =
    document.querySelector(
      "#publicFollowingCount"
    );

  const publicPostCount =
    document.querySelector(
      "#publicPostCount"
    );

  const publicProfileBio =
    document.querySelector(
      "#publicProfileBio"
    );

  const publicIndustrySection =
    document.querySelector(
      "#publicIndustrySection"
    );

  const publicProfileIndustry =
    document.querySelector(
      "#publicProfileIndustry"
    );

  const publicSkillsSection =
    document.querySelector(
      "#publicSkillsSection"
    );

  const publicProfileSkills =
    document.querySelector(
      "#publicProfileSkills"
    );

  const publicInterestsSection =
    document.querySelector(
      "#publicInterestsSection"
    );

  const publicProfileInterests =
    document.querySelector(
      "#publicProfileInterests"
    );

  const publicLinksSection =
    document.querySelector(
      "#publicLinksSection"
    );

  const publicWebsiteLink =
    document.querySelector(
      "#publicWebsiteLink"
    );

  const publicLinkedinLink =
    document.querySelector(
      "#publicLinkedinLink"
    );

  const publicProfilePostsSection =
    document.querySelector(
      "#publicProfilePostsSection"
    );

  const publicProfilePostList =
    document.querySelector(
      "#publicProfilePostList"
    );

  let currentUser = null;
  let viewedUserId = null;
  let viewedProfile = null;
  let workspacesById = new Map();

  function assertRequiredElements() {
    const requiredElements = {
      publicProfilePage,
      publicProfileMessage,
      publicProfileCard,
      publicProfileAvatar,
      publicProfileName,
      publicProfileUsername,
      publicProfileHeadline,
      publicProfileLocation,
      followUserButton,
      publicFollowerCount,
      publicFollowingCount,
      publicPostCount,
      publicProfileBio,
      publicIndustrySection,
      publicProfileIndustry,
      publicSkillsSection,
      publicProfileSkills,
      publicInterestsSection,
      publicProfileInterests,
      publicLinksSection,
      publicWebsiteLink,
      publicLinkedinLink,
      publicProfilePostsSection,
      publicProfilePostList
    };

    const missing =
      Object
        .entries(requiredElements)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Public profile elements were not found: " +
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

  function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(String(value || ""));
  }

  function getViewedUserId() {
    const parameters =
      new URLSearchParams(
        window.location.search
      );

    const userId =
      parameters.get("id");

    return isValidUuid(userId)
      ? userId
      : null;
  }

  function setMessage(
    message,
    status = ""
  ) {
    publicProfileMessage.textContent =
      message;

    publicProfileMessage.dataset.status =
      status;
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

  function safeUrl(value) {
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

  function safeImageUrl(value) {
    return safeUrl(value);
  }

  function normaliseList(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          String(item).trim()
        )
        .filter(Boolean);
    }

    if (
      typeof value === "string"
    ) {
      const trimmed =
        value.trim();

      if (!trimmed) {
        return [];
      }

      try {
        const parsed =
          JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed
            .map((item) =>
              String(item).trim()
            )
            .filter(Boolean);
        }
      } catch {
        return trimmed
          .split(",")
          .map((item) =>
            item.trim()
          )
          .filter(Boolean);
      }
    }

    return [];
  }

  function postTypeLabel(value) {
    const labels = {
      general: "General discussion",
      workspace_experience:
        "Workspace experience",
      productivity_tip:
        "Productivity tip",
      collaboration:
        "Collaboration request",
      event: "Event announcement",
      question: "Question"
    };

    return labels[value] ||
      "Community post";
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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
        timeZone:
          "Asia/Kuala_Lumpur"
      }
    ).format(date);
  }

  function renderAvatar(profile) {
    const displayName =
      profile.full_name ||
      profile.username ||
      "SyncSpace member";

    const imageUrl =
      safeImageUrl(
        profile.avatar_url
      );

    if (imageUrl) {
      publicProfileAvatar.innerHTML = `
        <img
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(displayName)}"
        >
      `;

      publicProfileAvatar.classList.add(
        "has-image"
      );
    } else {
      publicProfileAvatar.textContent =
        createInitials(displayName);

      publicProfileAvatar.classList.remove(
        "has-image"
      );
    }
  }

  function renderTagList(
    container,
    section,
    values
  ) {
    const items =
      normaliseList(values);

    if (items.length === 0) {
      section.hidden = true;
      container.innerHTML = "";
      return;
    }

    container.innerHTML =
      items
        .map((item) => `
          <span>
            ${escapeHtml(item)}
          </span>
        `)
        .join("");

    section.hidden = false;
  }

  function renderLinks(profile) {
    const website =
      safeUrl(
        profile.website_url
      );

    const linkedin =
      safeUrl(
        profile.linkedin_url
      );

    publicWebsiteLink.hidden =
      !website;

    publicLinkedinLink.hidden =
      !linkedin;

    if (website) {
      publicWebsiteLink.href =
        website;
    } else {
      publicWebsiteLink.removeAttribute(
        "href"
      );
    }

    if (linkedin) {
      publicLinkedinLink.href =
        linkedin;
    } else {
      publicLinkedinLink.removeAttribute(
        "href"
      );
    }

    publicLinksSection.hidden =
      !website && !linkedin;
  }

  function updateFollowButton() {
    if (
      !viewedProfile ||
      viewedProfile.is_own_profile
    ) {
      followUserButton.hidden =
        true;

      return;
    }

    followUserButton.hidden =
      false;

    followUserButton.textContent =
      viewedProfile.is_following
        ? "Following"
        : "Follow";

    followUserButton.classList.toggle(
      "secondary",
      viewedProfile.is_following
    );

    followUserButton.classList.toggle(
      "primary",
      !viewedProfile.is_following
    );

    followUserButton.setAttribute(
      "aria-pressed",
      viewedProfile.is_following
        ? "true"
        : "false"
    );
  }

  function renderProfile(profile) {
    const displayName =
      profile.full_name ||
      profile.username ||
      "SyncSpace member";

    renderAvatar(profile);

    publicProfileName.textContent =
      displayName;

    publicProfileUsername.textContent =
      profile.username
        ? `@${profile.username}`
        : "";

    const headlineParts =
      [
        profile.job_title,
        profile.company
      ].filter(Boolean);

    publicProfileHeadline.textContent =
      headlineParts.join(" at ");

    publicProfileLocation.textContent =
      profile.location || "";

    publicFollowerCount.textContent =
      String(
        profile.follower_count || 0
      );

    publicFollowingCount.textContent =
      String(
        profile.following_count || 0
      );

    publicPostCount.textContent =
      String(
        profile.post_count || 0
      );

    publicProfileBio.textContent =
      profile.bio ||
      "This member has not added a biography.";

    if (profile.industry) {
      publicProfileIndustry.textContent =
        profile.industry;

      publicIndustrySection.hidden =
        false;
    } else {
      publicIndustrySection.hidden =
        true;
    }

    renderTagList(
      publicProfileSkills,
      publicSkillsSection,
      profile.skills
    );

    renderTagList(
      publicProfileInterests,
      publicInterestsSection,
      profile.interests
    );

    renderLinks(profile);
    updateFollowButton();

    publicProfileCard.hidden = false;
  }

  function renderPosts(posts) {
    if (!posts.length) {
      publicProfilePostList.innerHTML = `
        <div class="empty-state">
          This member has not published any community posts.
        </div>
      `;

      publicProfilePostsSection.hidden =
        false;

      return;
    }

    publicProfilePostList.innerHTML =
      posts
        .map((post) => {
          const workspace =
            workspacesById.get(
              post.workspace_id
            );

          const imageUrl =
            safeImageUrl(
              post.image_url
            );

          return `
            <article class="public-profile-post">
              <div class="community-post-badges">
                <span class="pill">
                  ${escapeHtml(
                    postTypeLabel(
                      post.post_type
                    )
                  )}
                </span>

                ${
                  workspace
                    ? `
                      <span class="pill community-workspace-pill">
                        ${escapeHtml(
                          `${workspace.name} (${workspace.unit_code})`
                        )}
                      </span>
                    `
                    : ""
                }
              </div>

              <p>${escapeHtml(
                String(
                  post.content || ""
                ).trim()
              )}</p>

              ${
                imageUrl
                  ? `
                    <img
                      src="${escapeHtml(imageUrl)}"
                      alt="Community post image"
                    >
                  `
                  : ""
              }

              <footer>
                <span>
                  ${escapeHtml(
                    formatDateTime(
                      post.created_at
                    )
                  )}
                </span>

                <span>
                  👍
                  ${escapeHtml(
                    post.like_count || 0
                  )}
                  ·
                  ${escapeHtml(
                    post.comment_count || 0
                  )}
                  comments
                </span>
              </footer>
            </article>
          `;
        })
        .join("");

    publicProfilePostsSection.hidden =
      false;
  }

  async function loadProfileData() {
    const client =
      getSupabaseClient();

    const [
      profileResult,
      postResult,
      workspaceResult
    ] = await Promise.all([
      client.rpc(
        "get_public_user_profile",
        {
          p_user_id:
            viewedUserId
        }
      ),

      client.rpc(
        "get_public_user_posts",
        {
          p_user_id:
            viewedUserId,
          p_limit: 10
        }
      ),

      client
        .from("workspaces")
        .select(`
          id,
          name,
          unit_code
        `)
        .eq("active", true)
    ]);

    if (profileResult.error) {
      throw profileResult.error;
    }

    if (postResult.error) {
      throw postResult.error;
    }

    if (workspaceResult.error) {
      throw workspaceResult.error;
    }

    const profile =
      profileResult.data?.[0];

    if (!profile) {
      throw new Error(
        "This member profile is private or unavailable."
      );
    }

    viewedProfile = profile;

    workspacesById =
      new Map(
        (
          workspaceResult.data || []
        ).map((workspace) => [
          workspace.id,
          workspace
        ])
      );

    renderProfile(profile);

    renderPosts(
      postResult.data || []
    );
  }

  async function toggleFollow() {
    if (
      !viewedProfile ||
      viewedProfile.is_own_profile
    ) {
      return;
    }

    followUserButton.disabled = true;

    setMessage(
      viewedProfile.is_following
        ? "Unfollowing member..."
        : "Following member...",
      "loading"
    );

    try {
      const { data, error } =
        await getSupabaseClient().rpc(
          "toggle_user_follow",
          {
            p_target_user_id:
              viewedUserId
          }
        );

      if (error) {
        throw error;
      }

      const result =
        data?.[0];

      if (!result) {
        throw new Error(
          "The follow status could not be updated."
        );
      }

      viewedProfile.is_following =
        result.is_following;

      viewedProfile.follower_count =
        result.follower_count;

      viewedProfile.following_count =
        result.following_count;

      publicFollowerCount.textContent =
        String(
          result.follower_count || 0
        );

      publicFollowingCount.textContent =
        String(
          result.following_count || 0
        );

      updateFollowButton();

      setMessage(
        result.is_following
          ? "You are now following this member."
          : "You are no longer following this member.",
        "success"
      );
    } catch (error) {
      console.error(
        "Follow update failed:",
        error
      );

      setMessage(
        error.message ||
        "The follow status could not be updated.",
        "error"
      );
    } finally {
      followUserButton.disabled =
        false;
    }
  }

  function registerEventListeners() {
    followUserButton.addEventListener(
      "click",
      toggleFollow
    );
  }

  async function initialisePublicProfile() {
    assertRequiredElements();

    currentUser =
      await requireAuthenticatedUser(
        "community.html"
      );

    if (!currentUser) {
      return;
    }

    viewedUserId =
      getViewedUserId();

    if (!viewedUserId) {
      throw new Error(
        "The selected member profile is invalid."
      );
    }

    registerEventListeners();

    await loadProfileData();

    publicProfilePage.setAttribute(
      "aria-busy",
      "false"
    );
  }

  async function start() {
    try {
      await initialisePublicProfile();
    } catch (error) {
      console.error(
        "Public profile initialization failed:",
        error
      );

      setMessage(
        error.message ||
        "The member profile could not be loaded.",
        "error"
      );

      publicProfileCard.hidden =
        true;

      publicProfilePostsSection.hidden =
        true;

      publicProfilePage?.setAttribute(
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
      {
        once: true
      }
    );
  } else {
    void start();
  }
})();
