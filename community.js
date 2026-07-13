(() => {
  "use strict";

  console.log(
    "SyncSpace community script loaded"
  );

  const COMMUNITY_FEED_RPC =
    "get_community_feed";

  const COMMUNITY_IMAGE_BUCKET =
    "community-images";

  const communityPage =
    document.querySelector("#communityPage");

  const communityPageMessage =
    document.querySelector(
      "#communityPageMessage"
    );

  const createPostButton =
    document.querySelector("#createPostButton");

  const communityFeedFilter =
    document.querySelector(
      "#communityFeedFilter"
    );

  const communityWorkspaceFilter =
    document.querySelector(
      "#communityWorkspaceFilter"
    );

  const communitySortOrder =
    document.querySelector(
      "#communitySortOrder"
    );

  const refreshCommunityButton =
    document.querySelector(
      "#refreshCommunityButton"
    );

  const communityFeed =
    document.querySelector("#communityFeed");

  const postModal =
    document.querySelector("#postModal");

  const postModalTitle =
    document.querySelector("#postModalTitle");

  const closePostModalButton =
    document.querySelector("#closePostModal");

  const cancelPostButton =
    document.querySelector("#cancelPostButton");

  const postForm =
    document.querySelector("#postForm");

  const postIdInput =
    document.querySelector("#postIdInput");

  const postTypeInput =
    document.querySelector("#postTypeInput");

  const postWorkspaceInput =
    document.querySelector(
      "#postWorkspaceInput"
    );

  const postContentInput =
    document.querySelector(
      "#postContentInput"
    );

  const postCharacterCount =
    document.querySelector(
      "#postCharacterCount"
    );

  const postImageInput =
    document.querySelector("#postImageInput");

  const postImagePreview =
    document.querySelector(
      "#postImagePreview"
    );

  const removePostImageButton =
    document.querySelector(
      "#removePostImageButton"
    );

  const savePostButton =
    document.querySelector("#savePostButton");

  const postFormMessage =
    document.querySelector("#postFormMessage");

  const reportModal =
    document.querySelector("#reportModal");

  const reportTargetDescription =
    document.querySelector(
      "#reportTargetDescription"
    );

  const closeReportModalButton =
    document.querySelector(
      "#closeReportModal"
    );

  const cancelReportButton =
    document.querySelector(
      "#cancelReportButton"
    );

  const reportForm =
    document.querySelector("#reportForm");

  const reportTargetType =
    document.querySelector("#reportTargetType");

  const reportTargetId =
    document.querySelector("#reportTargetId");

  const reportReasonInput =
    document.querySelector(
      "#reportReasonInput"
    );

  const reportDetailsInput =
    document.querySelector(
      "#reportDetailsInput"
    );

  const submitReportButton =
    document.querySelector(
      "#submitReportButton"
    );

  const reportFormMessage =
    document.querySelector(
      "#reportFormMessage"
    );

  let currentUser = null;
  let currentProfile = null;

  let posts = [];
  let comments = [];
  let workspaces = [];

  let workspacesById = new Map();
  let profilesById = new Map();
  let commentsByPostId = new Map();

  let selectedPostImageFile = null;
  let removeExistingPostImage = false;
  let postImagePreviewUrl = null;

  function assertRequiredElements() {
    const requiredElements = {
      communityPage,
      communityPageMessage,
      createPostButton,
      communityFeedFilter,
      communityWorkspaceFilter,
      communitySortOrder,
      refreshCommunityButton,
      communityFeed,
      postModal,
      postModalTitle,
      closePostModalButton,
      cancelPostButton,
      postForm,
      postIdInput,
      postTypeInput,
      postWorkspaceInput,
      postContentInput,
      postCharacterCount,
      postImageInput,
      postImagePreview,
      removePostImageButton,
      savePostButton,
      postFormMessage,
      reportModal,
      reportTargetDescription,
      closeReportModalButton,
      cancelReportButton,
      reportForm,
      reportTargetType,
      reportTargetId,
      reportReasonInput,
      reportDetailsInput,
      submitReportButton,
      reportFormMessage
    };

    const missing =
      Object
        .entries(requiredElements)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Community elements were not found: " +
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

    return labels[value] || "Community post";
  }

  function setPageMessage(
    message,
    status = ""
  ) {
    communityPageMessage.textContent =
      message;

    communityPageMessage.dataset.status =
      status;
  }

  function setPostMessage(
    message,
    status = ""
  ) {
    postFormMessage.textContent =
      message;

    postFormMessage.dataset.status =
      status;
  }

  function setReportMessage(
    message,
    status = ""
  ) {
    reportFormMessage.textContent =
      message;

    reportFormMessage.dataset.status =
      status;
  }

  function avatarMarkup(
    imageUrl,
    displayName,
    className = "community-avatar"
  ) {
    const safeUrl =
      safeImageUrl(imageUrl);

    if (safeUrl) {
      return `
        <img
          class="${className}"
          src="${escapeHtml(safeUrl)}"
          alt="${escapeHtml(displayName)}"
        >
      `;
    }

    return `
      <span
        class="${className} community-avatar-initials"
        aria-hidden="true"
      >
        ${escapeHtml(
          createInitials(displayName)
        )}
      </span>
    `;
  }

  async function loadWorkspaces() {
    const { data, error } =
      await getSupabaseClient()
        .from("workspaces")
        .select(`
          id,
          name,
          unit_code,
          workspace_type_id,
          active,
          display_order
        `)
        .eq("active", true)
        .order("display_order");

    if (error) {
      throw error;
    }

    workspaces = data || [];

    workspacesById =
      new Map(
        workspaces.map(
          (workspace) => [
            workspace.id,
            workspace
          ]
        )
      );

    const options =
      workspaces
        .map((workspace) => `
          <option value="${escapeHtml(
            workspace.id
          )}">
            ${escapeHtml(
              `${workspace.name} (${workspace.unit_code})`
            )}
          </option>
        `)
        .join("");

    communityWorkspaceFilter.innerHTML = `
      <option value="all">
        All workspaces
      </option>

      ${options}
    `;

    postWorkspaceInput.innerHTML = `
      <option value="">
        No specific workspace
      </option>

      ${options}
    `;
  }

  async function loadComments(postIds) {
    comments = [];
    profilesById = new Map();
    commentsByPostId = new Map();

    if (postIds.length === 0) {
      return;
    }

    const { data, error } =
      await getSupabaseClient()
        .from("post_comments")
        .select(`
          id,
          post_id,
          user_id,
          content,
          status,
          created_at,
          updated_at
        `)
        .in("post_id", postIds)
        .eq("status", "published")
        .order(
          "created_at",
          {
            ascending: true
          }
        );

    if (error) {
      throw error;
    }

    comments = data || [];

    comments.forEach((comment) => {
      if (
        !commentsByPostId.has(
          comment.post_id
        )
      ) {
        commentsByPostId.set(
          comment.post_id,
          []
        );
      }

      commentsByPostId
        .get(comment.post_id)
        .push(comment);
    });

    const userIds =
      [
        ...new Set(
          comments.map(
            (comment) => comment.user_id
          )
        )
      ];

    if (userIds.length === 0) {
      return;
    }

    const {
      data: profileData,
      error: profileError
    } = await getSupabaseClient()
      .from("profiles")
      .select(`
        id,
        username,
        full_name,
        avatar_url
      `)
      .in("id", userIds);

    if (profileError) {
      throw profileError;
    }

    profilesById =
      new Map(
        (profileData || []).map(
          (profile) => [
            profile.id,
            profile
          ]
        )
      );

    if (currentProfile) {
      profilesById.set(
        currentUser.id,
        currentProfile
      );
    }
  }

  async function loadCommunityFeed() {
    const selectedFilter =
      communityFeedFilter.value;

    const allowedFilters =
      new Set([
        "all",
        "mine",
        "following"
      ]);

    const { data, error } =
      await getSupabaseClient().rpc(
        COMMUNITY_FEED_RPC,
        {
          p_filter:
            allowedFilters.has(selectedFilter)
              ? selectedFilter
              : "all",

          p_limit: 100,
          p_offset: 0
        }
      );

    if (error) {
      throw error;
    }

    posts = data || [];

    await loadComments(
      posts.map(
        (post) => post.post_id
      )
    );
  }

  function getFilteredAndSortedPosts() {
    const workspaceFilter =
      communityWorkspaceFilter.value;

    const sortOrder =
      communitySortOrder.value;

    const filtered =
      posts.filter((post) => {
        return (
          workspaceFilter === "all" ||
          post.workspace_id ===
            workspaceFilter
        );
      });

    return [...filtered].sort(
      (postA, postB) => {
        if (sortOrder === "oldest") {
          return (
            new Date(postA.created_at) -
            new Date(postB.created_at)
          );
        }

        if (
          sortOrder === "most_liked"
        ) {
          const likeDifference =
            Number(postB.like_count || 0) -
            Number(postA.like_count || 0);

          if (likeDifference !== 0) {
            return likeDifference;
          }
        }

        if (
          sortOrder ===
          "most_discussed"
        ) {
          const commentDifference =
            Number(
              postB.comment_count || 0
            ) -
            Number(
              postA.comment_count || 0
            );

          if (
            commentDifference !== 0
          ) {
            return commentDifference;
          }
        }

        return (
          new Date(postB.created_at) -
          new Date(postA.created_at)
        );
      }
    );
  }

  function renderComment(comment) {
    const author =
      profilesById.get(
        comment.user_id
      );

    const displayName =
      author?.full_name ||
      author?.username ||
      "SyncSpace member";

    const ownComment =
      comment.user_id ===
      currentUser.id;

    return `
      <article class="community-comment">
        <div class="community-comment-avatar">
          ${avatarMarkup(
            author?.avatar_url,
            displayName,
            "community-small-avatar"
          )}
        </div>

        <div class="community-comment-body">
          <div class="community-comment-heading">
            <div>
              <strong>
                ${escapeHtml(displayName)}
              </strong>

              <span>
                ${escapeHtml(
                  formatDateTime(
                    comment.created_at
                  )
                )}
              </span>
            </div>

            <div class="community-inline-actions">
              ${
                ownComment
                  ? `
                    <button
                      type="button"
                      class="community-text-button danger"
                      data-delete-comment="${escapeHtml(
                        comment.id
                      )}"
                    >
                      Delete
                    </button>
                  `
                  : `
                    <button
                      type="button"
                      class="community-text-button"
                      data-report-comment="${escapeHtml(
                        comment.id
                      )}"
                    >
                      Report
                    </button>
                  `
              }
            </div>
          </div>

          <p>${escapeHtml(
            String(
              comment.content || ""
            ).trim()
          )}</p>
        </div>
      </article>
    `;
  }

  function renderPost(post) {
    const ownPost =
      post.user_id === currentUser.id;

    const workspace =
      workspacesById.get(
        post.workspace_id
      );

    const postImage =
      safeImageUrl(post.image_url);

    const postComments =
      commentsByPostId.get(
        post.post_id
      ) || [];

    const displayName =
      post.full_name ||
      post.username ||
      "SyncSpace member";

    return `
      <article
        class="community-post-card"
        data-post-card="${escapeHtml(
          post.post_id
        )}"
      >
        <header class="community-post-header">
          <div class="community-author">
            <a
              class="community-author-link"
              href="user-profile.html?id=${encodeURIComponent(
                post.user_id
              )}"
              aria-label="View ${escapeHtml(
                displayName
              )}'s profile"
            >
              ${avatarMarkup(
                post.avatar_url,
                displayName
              )}
          
              <span class="community-author-copy">
                <strong>
                  ${escapeHtml(displayName)}
                </strong>
          
                <span>
                  ${
                    post.username
                      ? `@${escapeHtml(
                        post.username
                      )} · `
                      : ""
                  }
          
                  ${escapeHtml(
                    formatDateTime(
                      post.created_at
                    )
                  )}
                </span>
              </span>
            </a>
          </div>

          <div class="community-post-menu">
            ${
              ownPost
                ? `
                  <button
                    type="button"
                    class="community-text-button"
                    data-edit-post="${escapeHtml(
                      post.post_id
                    )}"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    class="community-text-button danger"
                    data-delete-post="${escapeHtml(
                      post.post_id
                    )}"
                  >
                    Delete
                  </button>
                `
                : `
                  <button
                    type="button"
                    class="community-text-button"
                    data-report-post="${escapeHtml(
                      post.post_id
                    )}"
                  >
                    Report
                  </button>
                `
            }
          </div>
        </header>

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

        <p class="community-post-text">${escapeHtml(
          String(post.content || "").trim()
        )}</p>

        ${
          postImage
            ? `
              <img
                class="community-post-image"
                src="${escapeHtml(postImage)}"
                alt="Image attached to community post"
              >
            `
            : ""
        }

        <div class="community-post-engagement">
          <button
            type="button"
            class="community-engagement-button ${
              post.liked_by_me
                ? "is-active"
                : ""
            }"
            data-like-post="${escapeHtml(
              post.post_id
            )}"
            aria-pressed="${
              post.liked_by_me
                ? "true"
                : "false"
            }"
            aria-label="${
              post.liked_by_me
                ? "Remove like from this post"
                : "Like this post"
            }"
            title="${
              post.liked_by_me
                ? "Remove like"
                : "Like this post"
            }"
          >
            <span
              class="community-like-icon"
              aria-hidden="true"
            >
              👍
            </span>
          
            <span class="community-like-label">
              ${
                post.liked_by_me
                  ? "Liked"
                  : "Like"
              }
            </span>
          
            <span class="community-like-count">
              ${escapeHtml(
                Number(
                  post.like_count || 0
                )
              )}
            </span>
          </button>

          <span class="community-comment-count">
            ${escapeHtml(
              Number(
                post.comment_count || 0
              )
            )}
            ${
              Number(
                post.comment_count || 0
              ) === 1
                ? "comment"
                : "comments"
            }
          </span>
        </div>

        <section class="community-comments">
          <div class="community-comment-list">
            ${
              postComments.length
                ? postComments
                    .map(renderComment)
                    .join("")
                : `
                  <p class="community-no-comments">
                    No comments yet.
                  </p>
                `
            }
          </div>

          <form
            class="community-comment-form"
            data-comment-form="${escapeHtml(
              post.post_id
            )}"
          >
            <label>
              <span class="sr-only">
                Add a comment
              </span>

              <textarea
                name="comment"
                rows="2"
                maxlength="1000"
                placeholder="Write a comment..."
                required
              ></textarea>
            </label>

            <button
              type="submit"
              class="button secondary"
            >
              Comment
            </button>
          </form>
        </section>
      </article>
    `;
  }

  function renderCommunityFeed() {
    const visiblePosts =
      getFilteredAndSortedPosts();

    if (visiblePosts.length === 0) {
      communityFeed.innerHTML = `
        <div class="empty-state">
          No community posts match the selected filters.
        </div>
      `;

      return;
    }

    communityFeed.innerHTML =
      visiblePosts
        .map(renderPost)
        .join("");
  }

  async function refreshCommunityFeed() {
    communityPage.setAttribute(
      "aria-busy",
      "true"
    );

    refreshCommunityButton.disabled =
      true;

    communityFeed.innerHTML = `
      <div class="empty-state">
        Loading community posts...
      </div>
    `;

    setPageMessage("");

    try {
      await loadCommunityFeed();
      renderCommunityFeed();
    } catch (error) {
      console.error(
        "Community feed could not be loaded:",
        error
      );

      communityFeed.innerHTML = `
        <div class="empty-state">
          Community posts could not be loaded.
        </div>
      `;

      setPageMessage(
        error.message ||
        "The community feed could not be loaded.",
        "error"
      );
    } finally {
      communityPage.setAttribute(
        "aria-busy",
        "false"
      );

      refreshCommunityButton.disabled =
        false;
    }
  }

  function updatePostCharacterCount() {
    postCharacterCount.textContent =
      String(
        postContentInput.value.length
      );
  }

  function revokePostPreviewUrl() {
    if (postImagePreviewUrl) {
      URL.revokeObjectURL(
        postImagePreviewUrl
      );

      postImagePreviewUrl = null;
    }
  }

  function setPostImagePreview(
    imageUrl = null
  ) {
    if (imageUrl) {
      postImagePreview.style.backgroundImage =
        `url("${String(imageUrl)
          .replace(/"/g, "%22")}")`;

      postImagePreview.classList.add(
        "has-image"
      );

      postImagePreview.innerHTML = "";

      removePostImageButton.hidden =
        false;
    } else {
      postImagePreview.style.backgroundImage =
        "";

      postImagePreview.classList.remove(
        "has-image"
      );

      postImagePreview.innerHTML =
        "<span>No image</span>";

      removePostImageButton.hidden =
        true;
    }
  }

  function resetPostImageState() {
    selectedPostImageFile = null;
    removeExistingPostImage = false;

    postImageInput.value = "";

    revokePostPreviewUrl();
  }

  function validatePostImage(file) {
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
        "The post image must be 5 MB or smaller."
      );
    }
  }

  function getImageExtension(file) {
    const extensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };

    return extensions[file.type] || "jpg";
  }

  async function uploadPostImage(file) {
    validatePostImage(file);

    const filePath =
      `${currentUser.id}/` +
      `post-${Date.now()}.` +
      `${getImageExtension(file)}`;

    const client =
      getSupabaseClient();

    const { error } =
      await client.storage
        .from(COMMUNITY_IMAGE_BUCKET)
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
        .from(COMMUNITY_IMAGE_BUCKET)
        .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(
        "The post image URL could not be generated."
      );
    }

    return data.publicUrl;
  }

  function extractPostImagePath(publicUrl) {
    if (!publicUrl) {
      return null;
    }

    try {
      const url =
        new URL(publicUrl);

      const marker =
        "/storage/v1/object/public/" +
        `${COMMUNITY_IMAGE_BUCKET}/`;

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

  async function deleteStoredPostImage(
    publicUrl
  ) {
    const path =
      extractPostImagePath(publicUrl);

    if (!path) {
      return;
    }

    const { error } =
      await getSupabaseClient()
        .storage
        .from(COMMUNITY_IMAGE_BUCKET)
        .remove([path]);

    if (error) {
      console.warn(
        "Community image could not be removed:",
        error.message
      );
    }
  }

  function openCreatePostModal() {
    postForm.reset();
    resetPostImageState();

    postIdInput.value = "";
    postTypeInput.value = "general";
    postWorkspaceInput.value = "";

    postModalTitle.textContent =
      "Create Community Post";

    savePostButton.textContent =
      "Publish post";

    updatePostCharacterCount();
    setPostImagePreview(null);
    setPostMessage("");

    postModal.hidden = false;
    document.body.style.overflow =
      "hidden";

    window.setTimeout(() => {
      postContentInput.focus();
    }, 0);
  }

  function openEditPostModal(postId) {
    const post =
      posts.find(
        (item) =>
          item.post_id === postId
      );

    if (
      !post ||
      post.user_id !== currentUser.id
    ) {
      return;
    }

    postForm.reset();
    resetPostImageState();

    postIdInput.value =
      post.post_id;

    postTypeInput.value =
      post.post_type;

    postWorkspaceInput.value =
      post.workspace_id || "";

    postContentInput.value =
      post.content || "";

    postModalTitle.textContent =
      "Edit Community Post";

    savePostButton.textContent =
      "Save changes";

    setPostImagePreview(
      safeImageUrl(post.image_url)
    );

    updatePostCharacterCount();
    setPostMessage("");

    postModal.hidden = false;
    document.body.style.overflow =
      "hidden";

    window.setTimeout(() => {
      postContentInput.focus();
    }, 0);
  }

  function closePostModal() {
    postModal.hidden = true;
    document.body.style.overflow = "";

    postForm.reset();
    resetPostImageState();

    setPostImagePreview(null);
    setPostMessage("");
  }

  async function savePost(event) {
    event.preventDefault();

    if (!postForm.checkValidity()) {
      postForm.reportValidity();
      return;
    }

    const content =
      postContentInput.value.trim();

    if (!content) {
      setPostMessage(
        "Enter content before publishing the post.",
        "error"
      );

      return;
    }

    const postId =
      postIdInput.value;

    const existingPost =
      postId
        ? posts.find(
          (post) =>
            post.post_id === postId
        )
        : null;

    const previousImageUrl =
      existingPost?.image_url || null;

    let uploadedImageUrl = null;

    savePostButton.disabled = true;

    setPostMessage(
      "Saving community post...",
      "loading"
    );

    try {
      let imageUrl =
        previousImageUrl;

      if (selectedPostImageFile) {
        setPostMessage(
          "Uploading post image...",
          "loading"
        );

        uploadedImageUrl =
          await uploadPostImage(
            selectedPostImageFile
          );

        imageUrl =
          uploadedImageUrl;
      } else if (
        removeExistingPostImage
      ) {
        imageUrl = null;
      }

      const payload = {
        workspace_id:
          postWorkspaceInput.value ||
          null,

        content,

        image_url:
          imageUrl,

        post_type:
          postTypeInput.value,

        visibility: "public"
      };

      let result;

      if (postId) {
        result =
          await getSupabaseClient()
            .from("community_posts")
            .update(payload)
            .eq("id", postId)
            .eq(
              "user_id",
              currentUser.id
            )
            .select("id, image_url")
            .single();
      } else {
        result =
          await getSupabaseClient()
            .from("community_posts")
            .insert({
              ...payload,
              user_id:
                currentUser.id
            })
            .select("id, image_url")
            .single();
      }

      if (result.error) {
        throw result.error;
      }

      if (
        previousImageUrl &&
        previousImageUrl !==
          result.data.image_url
      ) {
        await deleteStoredPostImage(
          previousImageUrl
        );
      }

      closePostModal();

      await refreshCommunityFeed();

      setPageMessage(
        postId
          ? "Your community post was updated successfully."
          : "Your community post was published successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Community post could not be saved:",
        error
      );

      if (
        uploadedImageUrl &&
        uploadedImageUrl !==
          previousImageUrl
      ) {
        await deleteStoredPostImage(
          uploadedImageUrl
        );
      }

      setPostMessage(
        error.message ||
        "The community post could not be saved.",
        "error"
      );
    } finally {
      savePostButton.disabled = false;
    }
  }

  async function deletePost(postId) {
    const post =
      posts.find(
        (item) =>
          item.post_id === postId
      );

    if (
      !post ||
      post.user_id !== currentUser.id
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this community post? " +
        "Its likes and comments will also be removed."
      );

    if (!confirmed) {
      return;
    }

    try {
      const { error } =
        await getSupabaseClient()
          .from("community_posts")
          .delete()
          .eq("id", postId)
          .eq(
            "user_id",
            currentUser.id
          );

      if (error) {
        throw error;
      }

      if (post.image_url) {
        await deleteStoredPostImage(
          post.image_url
        );
      }

      await refreshCommunityFeed();

      setPageMessage(
        "Your community post was deleted.",
        "success"
      );
    } catch (error) {
      console.error(
        "Post deletion failed:",
        error
      );

      setPageMessage(
        error.message ||
        "The community post could not be deleted.",
        "error"
      );
    }
  }

  async function togglePostLike(postId) {
    const post =
      posts.find(
        (item) =>
          item.post_id === postId
      );

    if (!post) {
      return;
    }

    try {
      let result;

      if (post.liked_by_me) {
        result =
          await getSupabaseClient()
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq(
              "user_id",
              currentUser.id
            );
      } else {
        result =
          await getSupabaseClient()
            .from("post_likes")
            .insert({
              post_id: postId,
              user_id: currentUser.id
            });
      }

      if (result.error) {
        throw result.error;
      }

      await refreshCommunityFeed();
    } catch (error) {
      console.error(
        "Post like update failed:",
        error
      );

      setPageMessage(
        error.message ||
        "The post reaction could not be updated.",
        "error"
      );
    }
  }

  async function addComment(
    postId,
    content,
    submitButton
  ) {
    submitButton.disabled = true;

    try {
      const { error } =
        await getSupabaseClient()
          .from("post_comments")
          .insert({
            post_id: postId,
            user_id: currentUser.id,
            content
          });

      if (error) {
        throw error;
      }

      await refreshCommunityFeed();

      setPageMessage(
        "Your comment was added.",
        "success"
      );
    } catch (error) {
      console.error(
        "Comment creation failed:",
        error
      );

      setPageMessage(
        error.message ||
        "The comment could not be added.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
    }
  }

  async function deleteComment(commentId) {
    const comment =
      comments.find(
        (item) => item.id === commentId
      );

    if (
      !comment ||
      comment.user_id !== currentUser.id
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this comment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const { error } =
        await getSupabaseClient()
          .from("post_comments")
          .delete()
          .eq("id", commentId)
          .eq(
            "user_id",
            currentUser.id
          );

      if (error) {
        throw error;
      }

      await refreshCommunityFeed();

      setPageMessage(
        "Your comment was deleted.",
        "success"
      );
    } catch (error) {
      console.error(
        "Comment deletion failed:",
        error
      );

      setPageMessage(
        error.message ||
        "The comment could not be deleted.",
        "error"
      );
    }
  }

  function openReportModal(
    targetType,
    targetId
  ) {
    reportForm.reset();

    reportTargetType.value =
      targetType;

    reportTargetId.value =
      targetId;

    reportTargetDescription.textContent =
      targetType === "post"
        ? "Report this community post for administrator review."
        : "Report this comment for administrator review.";

    setReportMessage("");

    reportModal.hidden = false;
    document.body.style.overflow =
      "hidden";

    window.setTimeout(() => {
      reportReasonInput.focus();
    }, 0);
  }

  function closeReportModal() {
    reportModal.hidden = true;
    document.body.style.overflow = "";

    reportForm.reset();
    setReportMessage("");
  }

  async function submitContentReport(
    event
  ) {
    event.preventDefault();

    if (!reportForm.checkValidity()) {
      reportForm.reportValidity();
      return;
    }

    const targetType =
      reportTargetType.value;

    const targetId =
      reportTargetId.value;

    const payload = {
      reporter_id: currentUser.id,
      reason: reportReasonInput.value,
      details:
        reportDetailsInput.value.trim() ||
        null
    };

    if (targetType === "post") {
      payload.post_id = targetId;
    } else if (
      targetType === "comment"
    ) {
      payload.comment_id = targetId;
    } else {
      setReportMessage(
        "The report target is invalid.",
        "error"
      );

      return;
    }

    submitReportButton.disabled = true;

    setReportMessage(
      "Submitting report...",
      "loading"
    );

    try {
      const { error } =
        await getSupabaseClient()
          .from("content_reports")
          .insert(payload);

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "You have already submitted an open report for this content."
          );
        }

        throw error;
      }

      closeReportModal();

      setPageMessage(
        "The content was reported for administrator review.",
        "success"
      );
    } catch (error) {
      console.error(
        "Content report failed:",
        error
      );

      setReportMessage(
        error.message ||
        "The report could not be submitted.",
        "error"
      );
    } finally {
      submitReportButton.disabled =
        false;
    }
  }

  function handleCommunityClick(event) {
    const likeButton =
      event.target.closest(
        "[data-like-post]"
      );

    if (likeButton) {
      void togglePostLike(
        likeButton.dataset.likePost
      );

      return;
    }

    const editButton =
      event.target.closest(
        "[data-edit-post]"
      );

    if (editButton) {
      openEditPostModal(
        editButton.dataset.editPost
      );

      return;
    }

    const deletePostButton =
      event.target.closest(
        "[data-delete-post]"
      );

    if (deletePostButton) {
      void deletePost(
        deletePostButton.dataset
          .deletePost
      );

      return;
    }

    const reportPostButton =
      event.target.closest(
        "[data-report-post]"
      );

    if (reportPostButton) {
      openReportModal(
        "post",
        reportPostButton.dataset
          .reportPost
      );

      return;
    }

    const deleteCommentButton =
      event.target.closest(
        "[data-delete-comment]"
      );

    if (deleteCommentButton) {
      void deleteComment(
        deleteCommentButton.dataset
          .deleteComment
      );

      return;
    }

    const reportCommentButton =
      event.target.closest(
        "[data-report-comment]"
      );

    if (reportCommentButton) {
      openReportModal(
        "comment",
        reportCommentButton.dataset
          .reportComment
      );
    }
  }

  function handleCommentSubmit(event) {
    const form =
      event.target.closest(
        "[data-comment-form]"
      );

    if (!form) {
      return;
    }

    event.preventDefault();

    const textarea =
      form.querySelector(
        'textarea[name="comment"]'
      );

    const submitButton =
      form.querySelector(
        'button[type="submit"]'
      );

    const content =
      textarea.value.trim();

    if (!content) {
      textarea.focus();
      return;
    }

    void addComment(
      form.dataset.commentForm,
      content,
      submitButton
    );
  }

  function registerEventListeners() {
    createPostButton.addEventListener(
      "click",
      openCreatePostModal
    );

    refreshCommunityButton
      .addEventListener(
        "click",
        () => {
          void refreshCommunityFeed();
        }
      );

    communityFeedFilter
      .addEventListener(
        "change",
        () => {
          void refreshCommunityFeed();
        }
      );

    communityWorkspaceFilter
      .addEventListener(
        "change",
        renderCommunityFeed
      );

    communitySortOrder
      .addEventListener(
        "change",
        renderCommunityFeed
      );

    communityFeed.addEventListener(
      "click",
      handleCommunityClick
    );

    communityFeed.addEventListener(
      "submit",
      handleCommentSubmit
    );

    postContentInput.addEventListener(
      "input",
      updatePostCharacterCount
    );

    postImageInput.addEventListener(
      "change",
      () => {
        const file =
          postImageInput.files?.[0];

        if (!file) {
          return;
        }

        try {
          validatePostImage(file);

          selectedPostImageFile = file;
          removeExistingPostImage = false;

          revokePostPreviewUrl();

          postImagePreviewUrl =
            URL.createObjectURL(file);

          setPostImagePreview(
            postImagePreviewUrl
          );

          setPostMessage("");
        } catch (error) {
          postImageInput.value = "";
          selectedPostImageFile = null;

          setPostMessage(
            error.message,
            "error"
          );
        }
      }
    );

    removePostImageButton
      .addEventListener(
        "click",
        () => {
          selectedPostImageFile = null;
          removeExistingPostImage = true;

          postImageInput.value = "";

          revokePostPreviewUrl();
          setPostImagePreview(null);
        }
      );

    postForm.addEventListener(
      "submit",
      savePost
    );

    closePostModalButton
      .addEventListener(
        "click",
        closePostModal
      );

    cancelPostButton.addEventListener(
      "click",
      closePostModal
    );

    postModal.addEventListener(
      "click",
      (event) => {
        if (event.target === postModal) {
          closePostModal();
        }
      }
    );

    reportForm.addEventListener(
      "submit",
      submitContentReport
    );

    closeReportModalButton
      .addEventListener(
        "click",
        closeReportModal
      );

    cancelReportButton.addEventListener(
      "click",
      closeReportModal
    );

    reportModal.addEventListener(
      "click",
      (event) => {
        if (
          event.target === reportModal
        ) {
          closeReportModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") {
          return;
        }

        if (!postModal.hidden) {
          closePostModal();
        }

        if (!reportModal.hidden) {
          closeReportModal();
        }
      }
    );
  }

  async function initialiseCommunityPage() {
    assertRequiredElements();

    currentUser =
      await requireAuthenticatedUser(
        "index.html"
      );

    if (!currentUser) {
      return;
    }

    currentProfile =
      await getUserProfile(currentUser);

    await loadWorkspaces();

    registerEventListeners();
    await refreshCommunityFeed();
  }

  async function start() {
    try {
      await initialiseCommunityPage();
    } catch (error) {
      console.error(
        "Community initialization failed:",
        error
      );

      setPageMessage(
        error.message ||
        "The community page could not be initialized.",
        "error"
      );

      communityPage?.setAttribute(
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
