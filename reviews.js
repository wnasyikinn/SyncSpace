(() => {
  "use strict";

  console.log(
    "SyncSpace verified reviews script loaded"
  );

  const REVIEWABLE_BOOKINGS_RPC =
    "get_my_reviewable_bookings";

  const reviewableBookingsList =
    document.querySelector(
      "#reviewableBookingsList"
    );

  const myReviewsList =
    document.querySelector("#myReviewsList");

  const workspaceRatingSummaryList =
    document.querySelector(
      "#workspaceRatingSummaryList"
    );

  const recentReviewsList =
    document.querySelector(
      "#recentReviewsList"
    );

  const reviewModal =
    document.querySelector("#reviewModal");

  const closeReviewModalButton =
    document.querySelector("#closeReviewModal");

  const cancelReviewButton =
    document.querySelector("#cancelReviewButton");

  const reviewModalTitle =
    document.querySelector("#reviewModalTitle");

  const reviewModalWorkspace =
    document.querySelector(
      "#reviewModalWorkspace"
    );

  const reviewForm =
    document.querySelector("#reviewForm");

  const reviewIdInput =
    document.querySelector("#reviewIdInput");

  const reviewBookingIdInput =
    document.querySelector(
      "#reviewBookingIdInput"
    );

  const reviewWorkspaceIdInput =
    document.querySelector(
      "#reviewWorkspaceIdInput"
    );

  const reviewTextInput =
    document.querySelector("#reviewTextInput");

  const reviewCharacterCount =
    document.querySelector(
      "#reviewCharacterCount"
    );

  const reviewRatingDescription =
    document.querySelector(
      "#reviewRatingDescription"
    );

  const reviewImageInput =
    document.querySelector("#reviewImageInput");

  const reviewImagePreview =
    document.querySelector(
      "#reviewImagePreview"
    );

  const removeReviewImageButton =
    document.querySelector(
      "#removeReviewImageButton"
    );

  const saveReviewButton =
    document.querySelector("#saveReviewButton");

  const reviewFormMessage =
    document.querySelector(
      "#reviewFormMessage"
    );

  let currentUser = null;

  let reviewableBookings = [];
  let myReviews = [];
  let publishedReviews = [];
  let workspaces = [];
  let profiles = [];

  let selectedReviewImageFile = null;
  let removeExistingReviewImage = false;
  let reviewImagePreviewUrl = null;

  function assertRequiredElements() {
    const requiredElements = {
      reviewableBookingsList,
      myReviewsList,
      workspaceRatingSummaryList,
      recentReviewsList,
      reviewModal,
      closeReviewModalButton,
      cancelReviewButton,
      reviewModalTitle,
      reviewModalWorkspace,
      reviewForm,
      reviewIdInput,
      reviewBookingIdInput,
      reviewWorkspaceIdInput,
      reviewTextInput,
      reviewCharacterCount,
      reviewRatingDescription,
      reviewImageInput,
      reviewImagePreview,
      removeReviewImageButton,
      saveReviewButton,
      reviewFormMessage
    };

    const missing =
      Object
        .entries(requiredElements)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Review page elements were not found: " +
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

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(`${value}T00:00:00`);

    return new Intl.DateTimeFormat(
      "en-MY",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    ).format(date);
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    return new Intl.DateTimeFormat(
      "en-MY",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kuala_Lumpur"
      }
    ).format(date);
  }

  function ratingStars(rating) {
    const safeRating =
      Math.max(
        0,
        Math.min(
          5,
          Number(rating || 0)
        )
      );

    return (
      "★".repeat(safeRating) +
      "☆".repeat(5 - safeRating)
    );
  }

  function ratingLabel(rating) {
    const labels = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very good",
      5: "Excellent"
    };

    return labels[Number(rating)] ||
      "Select a rating";
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

  function setReviewMessage(
    message,
    status = ""
  ) {
    reviewFormMessage.textContent =
      message;

    reviewFormMessage.dataset.status =
      status;
  }

  function getSelectedRating() {
    const checked =
      reviewForm.querySelector(
        'input[name="reviewRating"]:checked'
      );

    return checked
      ? Number(checked.value)
      : null;
  }

  function setSelectedRating(rating) {
    const numericRating =
      rating === null ||
      rating === undefined ||
      rating === ""
        ? null
        : Number(rating);
  
    reviewForm
      .querySelectorAll(
        'input[name="reviewRating"]'
      )
      .forEach((input) => {
        input.checked =
          numericRating !== null &&
          Number(input.value) === numericRating;
      });
  
    if (numericRating) {
      const starWord =
        numericRating === 1
          ? "star"
          : "stars";
  
      reviewRatingDescription.textContent =
        `${numericRating} ${starWord} selected — ` +
        `${ratingLabel(numericRating)}.`;
    } else {
      reviewRatingDescription.textContent =
        "Select the rating that best represents " +
        "your workspace experience.";
    }
  }

  function revokeReviewPreviewUrl() {
    if (reviewImagePreviewUrl) {
      URL.revokeObjectURL(
        reviewImagePreviewUrl
      );

      reviewImagePreviewUrl = null;
    }
  }

  function setReviewImagePreview(
    imageUrl = null
  ) {
    if (imageUrl) {
      reviewImagePreview.style.backgroundImage =
        `url("${String(imageUrl)
          .replace(/"/g, "%22")}")`;

      reviewImagePreview.classList.add(
        "has-image"
      );

      reviewImagePreview.innerHTML = "";

      removeReviewImageButton.hidden =
        false;
    } else {
      reviewImagePreview.style.backgroundImage =
        "";

      reviewImagePreview.classList.remove(
        "has-image"
      );

      reviewImagePreview.innerHTML =
        "<span>No image</span>";

      removeReviewImageButton.hidden =
        true;
    }
  }

  function validateReviewImage(file) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    const maximumSize =
      5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Select a JPG, PNG, or WebP image."
      );
    }

    if (file.size > maximumSize) {
      throw new Error(
        "The review image must be 5 MB or smaller."
      );
    }
  }

  function getReviewImageExtension(file) {
    const extensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };

    return extensions[file.type] || "jpg";
  }

  async function uploadReviewImage(file) {
    validateReviewImage(file);

    const extension =
      getReviewImageExtension(file);

    const filePath =
      `${currentUser.id}/` +
      `review-${Date.now()}.${extension}`;

    const client =
      getSupabaseClient();

    const { error } =
      await client.storage
        .from("review-images")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          }
        );

    if (error) {
      throw error;
    }

    const { data } =
      client.storage
        .from("review-images")
        .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(
        "The review image URL could not be generated."
      );
    }

    return data.publicUrl;
  }

  function extractReviewImagePath(publicUrl) {
    if (!publicUrl) {
      return null;
    }

    try {
      const url =
        new URL(publicUrl);

      const marker =
        "/storage/v1/object/public/review-images/";

      const markerIndex =
        url.pathname.indexOf(marker);

      if (markerIndex === -1) {
        return null;
      }

      return decodeURIComponent(
        url.pathname.slice(
          markerIndex + marker.length
        )
      );
    } catch {
      return null;
    }
  }

  async function deleteStoredReviewImage(
    publicUrl
  ) {
    const filePath =
      extractReviewImagePath(publicUrl);

    if (!filePath) {
      return;
    }

    const { error } =
      await getSupabaseClient()
        .storage
        .from("review-images")
        .remove([filePath]);

    if (error) {
      console.warn(
        "Review image could not be removed:",
        error.message
      );
    }
  }

  function getWorkspace(workspaceId) {
    return workspaces.find(
      (workspace) =>
        workspace.id === workspaceId
    );
  }

  function getProfile(userId) {
    return profiles.find(
      (profile) =>
        profile.id === userId
    );
  }

  async function loadReviewData() {
    const client =
      getSupabaseClient();

    const [
      reviewableResult,
      myReviewsResult,
      publishedReviewsResult,
      workspaceResult,
      profileResult
    ] = await Promise.all([
      client.rpc(
        REVIEWABLE_BOOKINGS_RPC
      ),

      client
        .from("workspace_reviews")
        .select(`
          id,
          booking_id,
          workspace_id,
          user_id,
          rating,
          review_text,
          image_url,
          status,
          moderation_reason,
          created_at,
          updated_at
        `)
        .eq("user_id", currentUser.id)
        .order(
          "created_at",
          {
            ascending: false
          }
        ),

      client
        .from("workspace_reviews")
        .select(`
          id,
          booking_id,
          workspace_id,
          user_id,
          rating,
          review_text,
          image_url,
          status,
          created_at,
          updated_at
        `)
        .eq("status", "published")
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(50),

      client
        .from("workspaces")
        .select(`
          id,
          name,
          unit_code,
          workspace_type_id,
          image_url,
          active
        `)
        .order("display_order"),

      client
        .from("profiles")
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          profile_visibility
        `)
    ]);

    const results = [
      reviewableResult,
      myReviewsResult,
      publishedReviewsResult,
      workspaceResult,
      profileResult
    ];

    const failed =
      results.find(
        (result) => result.error
      );

    if (failed) {
      throw failed.error;
    }

    reviewableBookings =
      reviewableResult.data || [];

    myReviews =
      myReviewsResult.data || [];

    publishedReviews =
      publishedReviewsResult.data || [];

    workspaces =
      workspaceResult.data || [];

    profiles =
      profileResult.data || [];
  }

  function renderReviewableBookings() {
    const eligible =
      reviewableBookings.filter(
        (booking) => !booking.reviewed
      );

    if (eligible.length === 0) {
      reviewableBookingsList.innerHTML = `
        <div class="empty-state">
          You currently have no completed reservations
          awaiting a review.
        </div>
      `;

      return;
    }

    reviewableBookingsList.innerHTML =
      eligible
        .map((booking) => `
          <article class="reservation-card reviewable-card">
            <div class="reservation-card-top">
              <div>
                <span class="pill">
                  ${escapeHtml(
                    booking.workspace_type
                  )}
                </span>

                <h3>
                  ${escapeHtml(
                    booking.workspace_name
                  )}
                </h3>

                <p class="reservation-unit-code">
                  Unit
                  ${escapeHtml(
                    booking.unit_code
                  )}
                </p>
              </div>

              <span class="pill status-completed">
                Verified visit
              </span>
            </div>

            <dl class="reservation-details">
              <div>
                <dt>Visit completed</dt>

                <dd>
                  ${escapeHtml(
                    formatDate(
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
                <dt>Review status</dt>

                <dd>
                  Not reviewed
                </dd>
              </div>
            </dl>

            <div class="reservation-card-actions">
              <button
                type="button"
                class="button primary"
                data-create-review="${escapeHtml(
                  booking.booking_id
                )}"
              >
                Write review
              </button>
            </div>
          </article>
        `)
        .join("");
  }

  function renderMyReviews() {
    if (myReviews.length === 0) {
      myReviewsList.innerHTML = `
        <div class="empty-state">
          You have not submitted any workspace reviews.
        </div>
      `;

      return;
    }

    myReviewsList.innerHTML =
      myReviews
        .map((review) => {
          const workspace =
            getWorkspace(
              review.workspace_id
            );

          const imageUrl =
            safeImageUrl(
              review.image_url
            );

          return `
            <article class="reservation-card review-card">
              <div class="reservation-card-top">
                <div>
                  <span class="pill">
                    Verified review
                  </span>

                  <h3>
                    ${escapeHtml(
                      workspace?.name ||
                      "Workspace"
                    )}
                  </h3>

                  <p>
                    ${
                      workspace?.unit_code
                        ? `Unit ${escapeHtml(
                          workspace.unit_code
                        )}`
                        : ""
                    }
                  </p>
                </div>

                <span
                  class="pill status-${escapeHtml(
                    review.status
                  )}"
                >
                  ${escapeHtml(
                    review.status
                  )}
                </span>
              </div>

              <div class="review-stars">
                ${escapeHtml(
                  ratingStars(
                    review.rating
                  )
                )}

                <strong>
                  ${escapeHtml(
                    `${review.rating}/5`
                  )}
                </strong>
              </div>

              <p class="review-text">
                ${escapeHtml(
                  review.review_text
                )}
              </p>

              ${
                imageUrl
                  ? `
                    <img
                      class="review-card-image"
                      src="${escapeHtml(imageUrl)}"
                      alt="Image attached to workspace review"
                    >
                  `
                  : ""
              }

              ${
                review.moderation_reason
                  ? `
                    <div class="reservation-status-note">
                      <strong>
                        Moderation note:
                      </strong>

                      ${escapeHtml(
                        review.moderation_reason
                      )}
                    </div>
                  `
                  : ""
              }

              <p class="review-date">
                Submitted
                ${escapeHtml(
                  formatDateTime(
                    review.created_at
                  )
                )}
              </p>

              <div class="reservation-card-actions">
                <button
                  type="button"
                  class="button secondary"
                  data-edit-review="${escapeHtml(
                    review.id
                  )}"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="button secondary review-delete-button"
                  data-delete-review="${escapeHtml(
                    review.id
                  )}"
                >
                  Delete
                </button>
              </div>
            </article>
          `;
        })
        .join("");
  }

  function calculateRatingSummaries() {
    const summaryMap =
      new Map();

    publishedReviews.forEach(
      (review) => {
        if (
          !summaryMap.has(
            review.workspace_id
          )
        ) {
          summaryMap.set(
            review.workspace_id,
            {
              count: 0,
              total: 0,
              ratings: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
              }
            }
          );
        }

        const summary =
          summaryMap.get(
            review.workspace_id
          );

        summary.count += 1;
        summary.total +=
          Number(review.rating);

        summary.ratings[
          Number(review.rating)
        ] += 1;
      }
    );

    return summaryMap;
  }

  function renderWorkspaceRatingSummaries() {
    const summaries =
      calculateRatingSummaries();

    const ratedWorkspaces =
      workspaces
        .filter(
          (workspace) =>
            summaries.has(workspace.id)
        )
        .map((workspace) => ({
          workspace,
          summary:
            summaries.get(workspace.id)
        }))
        .sort(
          (a, b) => {
            const averageA =
              a.summary.total /
              a.summary.count;

            const averageB =
              b.summary.total /
              b.summary.count;

            return averageB - averageA;
          }
        );

    if (ratedWorkspaces.length === 0) {
      workspaceRatingSummaryList.innerHTML = `
        <div class="empty-state">
          No published workspace ratings are available yet.
        </div>
      `;

      return;
    }

    workspaceRatingSummaryList.innerHTML =
      ratedWorkspaces
        .map(({ workspace, summary }) => {
          const average =
            summary.total /
            summary.count;

          return `
            <article class="workspace-rating-card">
              <div class="workspace-rating-heading">
                <div>
                  <h3>
                    ${escapeHtml(
                      workspace.name
                    )}
                  </h3>

                  <p>
                    ${escapeHtml(
                      workspace.unit_code
                    )}
                  </p>
                </div>

                <strong class="workspace-rating-score">
                  ${escapeHtml(
                    average.toFixed(1)
                  )}
                </strong>
              </div>

              <div class="review-stars">
                ${escapeHtml(
                  ratingStars(
                    Math.round(average)
                  )
                )}
              </div>

              <p>
                Based on
                ${escapeHtml(
                  summary.count
                )}
                verified
                ${
                  summary.count === 1
                    ? "review"
                    : "reviews"
                }.
              </p>

              <div class="rating-distribution">
                ${[5, 4, 3, 2, 1]
                  .map((rating) => {
                    const count =
                      summary.ratings[
                        rating
                      ];

                    const percentage =
                      summary.count > 0
                        ? (
                          count /
                          summary.count
                        ) * 100
                        : 0;

                    return `
                      <div>
                        <span>
                          ${rating}★
                        </span>

                        <div class="rating-bar">
                          <span
                            style="width: ${percentage}%"
                          ></span>
                        </div>

                        <span>
                          ${count}
                        </span>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            </article>
          `;
        })
        .join("");
  }

  function renderRecentReviews() {
    if (publishedReviews.length === 0) {
      recentReviewsList.innerHTML = `
        <div class="empty-state">
          No published workspace reviews are available yet.
        </div>
      `;

      return;
    }

    recentReviewsList.innerHTML =
      publishedReviews
        .slice(0, 10)
        .map((review) => {
          const workspace =
            getWorkspace(
              review.workspace_id
            );

          const author =
            getProfile(
              review.user_id
            );

          const imageUrl =
            safeImageUrl(
              review.image_url
            );

          const displayName =
            author?.full_name ||
            author?.username ||
            "SyncSpace member";

          return `
            <article class="reservation-card public-review-card">
              <div class="reservation-card-top">
                <div>
                  <span class="pill">
                    Verified customer
                  </span>

                  <h3>
                    ${escapeHtml(
                      workspace?.name ||
                      "Workspace"
                    )}
                  </h3>

                  <p>
                    Reviewed by
                    ${escapeHtml(
                      displayName
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

              <p class="review-text">
                ${escapeHtml(
                  review.review_text
                )}
              </p>

              ${
                imageUrl
                  ? `
                    <img
                      class="review-card-image"
                      src="${escapeHtml(imageUrl)}"
                      alt="Workspace review image"
                    >
                  `
                  : ""
              }

              <p class="review-date">
                ${escapeHtml(
                  formatDateTime(
                    review.created_at
                  )
                )}
              </p>
            </article>
          `;
        })
        .join("");
  }

  function renderAllReviewSections() {
    renderReviewableBookings();
    renderMyReviews();
    renderWorkspaceRatingSummaries();
    renderRecentReviews();
  }

  async function refreshReviewData() {
    reviewableBookingsList.innerHTML = `
      <div class="empty-state">
        Loading reviewable reservations...
      </div>
    `;

    myReviewsList.innerHTML = `
      <div class="empty-state">
        Loading your reviews...
      </div>
    `;

    try {
      await loadReviewData();
      renderAllReviewSections();
    } catch (error) {
      console.error(
        "Review data could not be loaded:",
        error
      );

      reviewableBookingsList.innerHTML = `
        <div class="empty-state">
          Reviewable reservations could not be loaded.
        </div>
      `;

      myReviewsList.innerHTML = `
        <div class="empty-state">
          Your reviews could not be loaded.
        </div>
      `;

      workspaceRatingSummaryList.innerHTML = `
        <div class="empty-state">
          Workspace rating summaries could not be loaded.
        </div>
      `;

      recentReviewsList.innerHTML = `
        <div class="empty-state">
          Published reviews could not be loaded.
        </div>
      `;
    }
  }

  function resetReviewImageState() {
    selectedReviewImageFile = null;
    removeExistingReviewImage = false;

    reviewImageInput.value = "";

    revokeReviewPreviewUrl();
  }

  function openCreateReviewModal(
    bookingId
  ) {
    const booking =
      reviewableBookings.find(
        (item) =>
          item.booking_id === bookingId
      );

    if (!booking) {
      return;
    }

    reviewForm.reset();
    resetReviewImageState();

    reviewIdInput.value = "";
    reviewBookingIdInput.value =
      booking.booking_id;

    reviewWorkspaceIdInput.value =
      booking.workspace_id;

    reviewModalTitle.textContent =
      "Review Your Workspace";

    reviewModalWorkspace.textContent =
      `${booking.workspace_name} ` +
      `(${booking.unit_code})`;

    saveReviewButton.textContent =
      "Publish review";

    setSelectedRating(null);
    setReviewImagePreview(null);
    updateReviewCharacterCount();
    setReviewMessage("");

    reviewModal.hidden = false;
    document.body.style.overflow =
      "hidden";

    window.setTimeout(() => {
      reviewTextInput.focus();
    }, 0);
  }

  function openEditReviewModal(reviewId) {
    const review =
      myReviews.find(
        (item) => item.id === reviewId
      );

    if (!review) {
      return;
    }

    const workspace =
      getWorkspace(
        review.workspace_id
      );

    reviewForm.reset();
    resetReviewImageState();

    reviewIdInput.value =
      review.id;

    reviewBookingIdInput.value =
      review.booking_id;

    reviewWorkspaceIdInput.value =
      review.workspace_id;

    reviewModalTitle.textContent =
      "Edit Workspace Review";

    reviewModalWorkspace.textContent =
      workspace
        ? `${workspace.name} (${workspace.unit_code})`
        : "Workspace";

    reviewTextInput.value =
      review.review_text;

    saveReviewButton.textContent =
      "Save changes";

    setSelectedRating(
      review.rating
    );

    setReviewImagePreview(
      safeImageUrl(
        review.image_url
      )
    );

    updateReviewCharacterCount();
    setReviewMessage("");

    reviewModal.hidden = false;
    document.body.style.overflow =
      "hidden";

    window.setTimeout(() => {
      reviewTextInput.focus();
    }, 0);
  }

  function closeReviewModal() {
    reviewModal.hidden = true;
    document.body.style.overflow = "";

    reviewForm.reset();
    resetReviewImageState();

    setReviewImagePreview(null);
    setReviewMessage("");
  }

  function updateReviewCharacterCount() {
    reviewCharacterCount.textContent =
      String(reviewTextInput.value.length);
  }

  async function saveReview(event) {
    event.preventDefault();

    if (!reviewForm.checkValidity()) {
      reviewForm.reportValidity();
      return;
    }

    const rating =
      getSelectedRating();

    const reviewText =
      reviewTextInput.value.trim();

    if (!rating) {
      setReviewMessage(
        "Select a rating before publishing the review.",
        "error"
      );

      return;
    }

    if (reviewText.length < 10) {
      setReviewMessage(
        "The review must contain at least 10 characters.",
        "error"
      );

      return;
    }

    saveReviewButton.disabled = true;

    const reviewId =
      reviewIdInput.value;

    const existingReview =
      reviewId
        ? myReviews.find(
          (review) =>
            review.id === reviewId
        )
        : null;

    const previousImageUrl =
      existingReview?.image_url || null;

    let uploadedImageUrl = null;

    setReviewMessage(
      "Saving your review...",
      "loading"
    );

    try {
      let imageUrl =
        previousImageUrl;

      if (selectedReviewImageFile) {
        setReviewMessage(
          "Uploading review image...",
          "loading"
        );

        uploadedImageUrl =
          await uploadReviewImage(
            selectedReviewImageFile
          );

        imageUrl =
          uploadedImageUrl;
      } else if (
        removeExistingReviewImage
      ) {
        imageUrl = null;
      }

      const payload = {
        booking_id:
          reviewBookingIdInput.value,

        workspace_id:
          reviewWorkspaceIdInput.value,

        user_id:
          currentUser.id,

        rating,

        review_text:
          reviewText,

        image_url:
          imageUrl
      };

      let result;

      if (reviewId) {
        result =
          await getSupabaseClient()
            .from("workspace_reviews")
            .update({
              rating:
                payload.rating,

              review_text:
                payload.review_text,

              image_url:
                payload.image_url
            })
            .eq("id", reviewId)
            .eq(
              "user_id",
              currentUser.id
            )
            .select("*")
            .single();
      } else {
        result =
          await getSupabaseClient()
            .from("workspace_reviews")
            .insert(payload)
            .select("*")
            .single();
      }

      if (result.error) {
        if (result.error.code === "23505") {
          throw new Error(
            "This reservation has already been reviewed."
          );
        }

        throw result.error;
      }

      if (
        previousImageUrl &&
        previousImageUrl !==
          result.data.image_url
      ) {
        await deleteStoredReviewImage(
          previousImageUrl
        );
      }

      closeReviewModal();

      await refreshReviewData();

      const profilePageMessage =
        document.querySelector(
          "#profilePageMessage"
        );

      if (profilePageMessage) {
        profilePageMessage.textContent =
          reviewId
            ? "Your workspace review was updated successfully."
            : "Your verified workspace review was published successfully.";

        profilePageMessage.dataset.status =
          "success";
      }
    } catch (error) {
      console.error(
        "Review could not be saved:",
        error
      );

      if (
        uploadedImageUrl &&
        uploadedImageUrl !==
          previousImageUrl
      ) {
        await deleteStoredReviewImage(
          uploadedImageUrl
        );
      }

      setReviewMessage(
        error.message ||
        "The review could not be saved.",
        "error"
      );
    } finally {
      saveReviewButton.disabled = false;
    }
  }

  async function deleteReview(reviewId) {
    const review =
      myReviews.find(
        (item) => item.id === reviewId
      );

    if (!review) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this workspace review? " +
        "This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      const { error } =
        await getSupabaseClient()
          .from("workspace_reviews")
          .delete()
          .eq("id", review.id)
          .eq(
            "user_id",
            currentUser.id
          );

      if (error) {
        throw error;
      }

      if (review.image_url) {
        await deleteStoredReviewImage(
          review.image_url
        );
      }

      await refreshReviewData();

      const profilePageMessage =
        document.querySelector(
          "#profilePageMessage"
        );

      if (profilePageMessage) {
        profilePageMessage.textContent =
          "Your workspace review was deleted.";

        profilePageMessage.dataset.status =
          "success";
      }
    } catch (error) {
      console.error(
        "Review deletion failed:",
        error
      );

      const profilePageMessage =
        document.querySelector(
          "#profilePageMessage"
        );

      if (profilePageMessage) {
        profilePageMessage.textContent =
          error.message ||
          "The review could not be deleted.";

        profilePageMessage.dataset.status =
          "error";
      }
    }
  }

  function handleReviewableBookingClick(
    event
  ) {
    const button =
      event.target.closest(
        "[data-create-review]"
      );

    if (!button) {
      return;
    }

    openCreateReviewModal(
      button.dataset.createReview
    );
  }

  function handleMyReviewClick(event) {
    const editButton =
      event.target.closest(
        "[data-edit-review]"
      );

    if (editButton) {
      openEditReviewModal(
        editButton.dataset.editReview
      );

      return;
    }

    const deleteButton =
      event.target.closest(
        "[data-delete-review]"
      );

    if (deleteButton) {
      void deleteReview(
        deleteButton.dataset.deleteReview
      );
    }
  }

  function registerEventListeners() {
    reviewableBookingsList
      .addEventListener(
        "click",
        handleReviewableBookingClick
      );

    myReviewsList.addEventListener(
      "click",
      handleMyReviewClick
    );

    closeReviewModalButton
      .addEventListener(
        "click",
        closeReviewModal
      );

    cancelReviewButton.addEventListener(
      "click",
      closeReviewModal
    );

    reviewModal.addEventListener(
      "click",
      (event) => {
        if (event.target === reviewModal) {
          closeReviewModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape" &&
          !reviewModal.hidden
        ) {
          closeReviewModal();
        }
      }
    );

    reviewTextInput.addEventListener(
      "input",
      updateReviewCharacterCount
    );

    reviewForm
      .querySelectorAll(
        'input[name="reviewRating"]'
      )
      .forEach((input) => {
        input.addEventListener(
          "change",
          () => {
            setSelectedRating(
              Number(input.value)
            );
          }
        );
      });

    reviewImageInput.addEventListener(
      "change",
      () => {
        const file =
          reviewImageInput.files?.[0];

        if (!file) {
          return;
        }

        try {
          validateReviewImage(file);

          selectedReviewImageFile =
            file;

          removeExistingReviewImage =
            false;

          revokeReviewPreviewUrl();

          reviewImagePreviewUrl =
            URL.createObjectURL(file);

          setReviewImagePreview(
            reviewImagePreviewUrl
          );

          setReviewMessage("");
        } catch (error) {
          reviewImageInput.value = "";

          selectedReviewImageFile =
            null;

          setReviewMessage(
            error.message,
            "error"
          );
        }
      }
    );

    removeReviewImageButton
      .addEventListener(
        "click",
        () => {
          selectedReviewImageFile =
            null;

          removeExistingReviewImage =
            true;

          reviewImageInput.value = "";

          revokeReviewPreviewUrl();

          setReviewImagePreview(null);
        }
      );

    reviewForm.addEventListener(
      "submit",
      saveReview
    );
  }

  async function initialiseReviews() {
    assertRequiredElements();

    currentUser =
      await requireAuthenticatedUser(
        "index.html"
      );

    if (!currentUser) {
      return;
    }

    registerEventListeners();
    await refreshReviewData();
  }

  async function start() {
    try {
      await initialiseReviews();
    } catch (error) {
      console.error(
        "Review initialization failed:",
        error
      );

      const profilePageMessage =
        document.querySelector(
          "#profilePageMessage"
        );

      if (profilePageMessage) {
        profilePageMessage.textContent =
          error.message ||
          "The review feature could not be loaded.";

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
