(() => {
  "use strict";

  const page =
    document.querySelector(
      "#workspacePage"
    );

  const message =
    document.querySelector(
      "#workspacePageMessage"
    );

  const detailCard =
    document.querySelector(
      "#workspaceDetailCard"
    );

  const image =
    document.querySelector(
      "#workspaceDetailImage"
    );

  const type =
    document.querySelector(
      "#workspaceDetailType"
    );

  const name =
    document.querySelector(
      "#workspaceDetailName"
    );

  const unit =
    document.querySelector(
      "#workspaceDetailUnit"
    );

  const description =
    document.querySelector(
      "#workspaceDetailDescription"
    );

  const layout =
    document.querySelector(
      "#workspaceDetailLayout"
    );

  const capacity =
    document.querySelector(
      "#workspaceDetailCapacity"
    );

  const rating =
    document.querySelector(
      "#workspaceDetailRating"
    );

  const savedCount =
    document.querySelector(
      "#workspaceDetailSavedCount"
    );

  const saveButton =
    document.querySelector(
      "#saveWorkspaceButton"
    );

  const reviewList =
    document.querySelector(
      "#workspaceReviewList"
    );

  const postList =
    document.querySelector(
      "#workspacePostList"
    );

  let workspaceId = null;
  let workspaceData = null;

  function escapeHtml(value) {
    const element =
      document.createElement("div");

    element.textContent =
      String(value ?? "");

    return element.innerHTML;
  }

  function ratingStars(value) {
    const number =
      Math.round(
        Number(value || 0)
      );

    return (
      "★".repeat(number) +
      "☆".repeat(5 - number)
    );
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat(
      "en-MY",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kuala_Lumpur"
      }
    ).format(new Date(value));
  }

  function getWorkspaceId() {
    const value =
      new URLSearchParams(
        window.location.search
      ).get("id");

    return /^[a-z0-9-]+$/i.test(
      String(value || "")
    )
      ? value
      : null;
  }

  function renderReviews(reviews) {
    if (!reviews.length) {
      reviewList.innerHTML = `
        <div class="empty-state">
          This workspace has no published reviews yet.
        </div>
      `;

      return;
    }

    reviewList.innerHTML =
      reviews.map((review) => {
        const displayName =
          review.full_name ||
          review.username ||
          "SyncSpace member";

        return `
          <article class="reservation-card">
            <div class="reservation-card-top">
              <div>
                <a
                  class="community-comment-name-link"
                  href="user-profile.html?id=${encodeURIComponent(
                    review.user_id
                  )}"
                >
                  <strong>
                    ${escapeHtml(displayName)}
                  </strong>
                </a>

                <p>
                  ${escapeHtml(
                    formatDateTime(
                      review.created_at
                    )
                  )}
                </p>
              </div>

              <span class="review-score-pill">
                ${escapeHtml(
                  `${review.rating}/5`
                )}
              </span>
            </div>

            <div class="review-stars">
              ${escapeHtml(
                ratingStars(
                  review.rating
                )
              )}
            </div>

            <p class="review-text">${escapeHtml(
              String(
                review.review_text || ""
              ).trim()
            )}</p>

            ${
              review.image_url
                ? `
                  <img
                    class="review-card-image"
                    src="${escapeHtml(
                      review.image_url
                    )}"
                    alt="Workspace review image"
                  >
                `
                : ""
            }
          </article>
        `;
      }).join("");
  }

  function renderPosts(posts) {
    if (!posts.length) {
      postList.innerHTML = `
        <div class="empty-state">
          No community posts are attached to this workspace.
        </div>
      `;

      return;
    }

    postList.innerHTML =
      posts.map((post) => {
        const displayName =
          post.full_name ||
          post.username ||
          "SyncSpace member";

        return `
          <article class="reservation-card">
            <div class="reservation-card-top">
              <div>
                <a
                  class="community-comment-name-link"
                  href="user-profile.html?id=${encodeURIComponent(
                    post.user_id
                  )}"
                >
                  <strong>
                    ${escapeHtml(displayName)}
                  </strong>
                </a>

                <p>
                  ${escapeHtml(
                    formatDateTime(
                      post.created_at
                    )
                  )}
                </p>
              </div>

              <span class="pill">
                ${escapeHtml(
                  post.post_type
                    .replace(/_/g, " ")
                )}
              </span>
            </div>

            <p class="community-post-text">${escapeHtml(
              String(
                post.content || ""
              ).trim()
            )}</p>

            ${
              post.image_url
                ? `
                  <img
                    class="community-post-image"
                    src="${escapeHtml(
                      post.image_url
                    )}"
                    alt="Community post image"
                  >
                `
                : ""
            }

            <p>
              👍 ${escapeHtml(post.like_count)}
              ·
              ${escapeHtml(post.comment_count)}
              comments
            </p>

            <a
              class="button secondary"
              href="community.html#post-${escapeHtml(
                post.id
              )}"
            >
              View discussion
            </a>
          </article>
        `;
      }).join("");
  }

  function renderWorkspace(data) {
    const workspace =
      data.workspace;

    const summary =
      data.summary;

    workspaceData = data;

    image.src =
      workspace.image_url ||
      "assets/syncspace-logo-mark.png";

    image.alt =
      `${workspace.name} ${workspace.unit_code}`;

    type.textContent =
      workspace.workspace_type;

    name.textContent =
      workspace.name;

    unit.textContent =
      `Unit ${workspace.unit_code}`;

    description.textContent =
      workspace.description;

    layout.textContent =
      workspace.layout;

    capacity.textContent =
      `${workspace.capacity} pax`;

    rating.textContent =
      summary.review_count
        ? `${Number(
          summary.average_rating
        ).toFixed(1)}/5 from ` +
          `${summary.review_count} reviews`
        : "No ratings yet";

    savedCount.textContent =
      String(summary.saved_count || 0);

    saveButton.textContent =
      summary.is_saved
        ? "Saved"
        : "Save workspace";

    saveButton.classList.toggle(
      "primary",
      summary.is_saved
    );

    saveButton.classList.toggle(
      "secondary",
      !summary.is_saved
    );

    renderReviews(
      data.reviews || []
    );

    renderPosts(
      data.posts || []
    );

    detailCard.hidden = false;
  }

  async function loadWorkspace() {
    const { data, error } =
      await getSupabaseClient().rpc(
        "get_workspace_page",
        {
          p_workspace_id:
            workspaceId
        }
      );

    if (error) {
      throw error;
    }

    renderWorkspace(data);

    page.setAttribute(
      "aria-busy",
      "false"
    );
  }

  async function toggleSaved() {
    saveButton.disabled = true;

    try {
      const { data, error } =
        await getSupabaseClient().rpc(
          "toggle_saved_workspace",
          {
            p_workspace_id:
              workspaceId
          }
        );

      if (error) {
        throw error;
      }

      const result =
        data?.[0];

      workspaceData.summary.is_saved =
        result.is_saved;

      workspaceData.summary.saved_count =
        result.saved_count;

      renderWorkspace(
        workspaceData
      );
    } catch (error) {
      message.textContent =
        error.message;

      message.dataset.status =
        "error";
    } finally {
      saveButton.disabled = false;
    }
  }

  async function start() {
    try {
      const user =
        await requireAuthenticatedUser(
          "index.html"
        );

      if (!user) {
        return;
      }

      workspaceId =
        getWorkspaceId();

      if (!workspaceId) {
        throw new Error(
          "The selected workspace is invalid."
        );
      }

      saveButton.addEventListener(
        "click",
        toggleSaved
      );

      await loadWorkspace();
    } catch (error) {
      message.textContent =
        error.message;

      message.dataset.status =
        "error";

      page.setAttribute(
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
