(() => {
  "use strict";

  const queueList =
    document.querySelector(
      "#moderationQueueList"
    );

  const reviewList =
    document.querySelector(
      "#adminReviewModerationList"
    );

  const statusFilter =
    document.querySelector(
      "#moderationStatusFilter"
    );

  const refreshButton =
    document.querySelector(
      "#refreshSocialAdminButton"
    );

  const topWorkspaceList =
    document.querySelector(
      "#topWorkspaceSocialList"
    );

  const statisticIds = {
    users: "socialUserCount",
    posts: "socialPostCount",
    comments: "socialCommentCount",
    reviews: "socialReviewCount",
    follows: "socialFollowCount",
    saved_workspaces: "socialSaveCount",
    open_reports:
      "openReportSocialCount"
  };

  let reports = [];
  let reviews = [];
  let workspaces = new Map();

  function escapeHtml(value) {
    const element =
      document.createElement("div");

    element.textContent =
      String(value ?? "");

    return element.innerHTML;
  }

  function formatDateTime(value) {
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
    ).format(new Date(value));
  }

  function moderationButtons(
    targetType,
    targetId,
    targetStatus,
    reportId = ""
  ) {
    const common =
      `data-target-type="${escapeHtml(targetType)}" ` +
      `data-target-id="${escapeHtml(targetId)}" ` +
      `data-report-id="${escapeHtml(reportId)}"`;

    if (targetStatus === "published") {
      return `
        <button
          class="button secondary"
          ${common}
          data-moderation-action="hide"
        >
          Hide
        </button>

        <button
          class="button secondary"
          ${common}
          data-moderation-action="remove"
        >
          Remove
        </button>
      `;
    }

    return `
      <button
        class="button primary"
        ${common}
        data-moderation-action="restore"
      >
        Restore
      </button>
    `;
  }

  function renderReports() {
    const filter =
      statusFilter.value;

    const visible =
      reports.filter((report) =>
        filter === "all" ||
        (
          filter === "open" &&
          [
            "open",
            "reviewing"
          ].includes(
            report.report_status
          )
        ) ||
        report.report_status === filter
      );

    if (!visible.length) {
      queueList.innerHTML = `
        <div class="empty-state">
          No reports match this status.
        </div>
      `;

      return;
    }

    queueList.innerHTML =
      visible.map((report) => `
        <article class="admin-record-card">
          <div class="admin-record-main">
            <div class="reservation-card-top">
              <div>
                <span class="pill">
                  ${escapeHtml(
                    report.target_type
                  )}
                </span>

                <h3>
                  ${escapeHtml(
                    report.reason
                      .replace(/_/g, " ")
                  )}
                </h3>

                <p>
                  Reported by
                  ${escapeHtml(
                    report.reporter_name
                  )}
                </p>
              </div>

              <span class="pill">
                ${escapeHtml(
                  report.report_status
                )}
              </span>
            </div>

            <p>
              ${escapeHtml(
                report.target_preview
              )}
            </p>

            ${
              report.details
                ? `
                  <p>
                    <strong>Details:</strong>
                    ${escapeHtml(
                      report.details
                    )}
                  </p>
                `
                : ""
            }

            <p>
              ${escapeHtml(
                formatDateTime(
                  report.created_at
                )
              )}
            </p>

            <div class="reservation-card-actions">
              ${moderationButtons(
                report.target_type,
                report.target_id,
                report.target_status,
                report.report_id
              )}

              ${
                [
                  "open",
                  "reviewing"
                ].includes(
                  report.report_status
                )
                  ? `
                    <button
                      class="button secondary"
                      data-target-type="${escapeHtml(
                        report.target_type
                      )}"
                      data-target-id="${escapeHtml(
                        report.target_id
                      )}"
                      data-report-id="${escapeHtml(
                        report.report_id
                      )}"
                      data-moderation-action="dismiss"
                    >
                      Dismiss report
                    </button>
                  `
                  : ""
              }
            </div>
          </div>
        </article>
      `).join("");
  }

  function renderReviews() {
    if (!reviews.length) {
      reviewList.innerHTML = `
        <div class="empty-state">
          No workspace reviews are available.
        </div>
      `;

      return;
    }

    reviewList.innerHTML =
      reviews.map((review) => {
        const workspace =
          workspaces.get(
            review.workspace_id
          );

        return `
          <article class="admin-record-card">
            <div class="admin-record-main">
              <div class="reservation-card-top">
                <div>
                  <span class="pill">
                    ${escapeHtml(
                      `${review.rating}/5`
                    )}
                  </span>

                  <h3>
                    ${escapeHtml(
                      workspace?.name ||
                      "Workspace"
                    )}
                  </h3>

                  <p>
                    ${escapeHtml(
                      workspace?.unit_code ||
                      ""
                    )}
                  </p>
                </div>

                <span class="pill">
                  ${escapeHtml(
                    review.status
                  )}
                </span>
              </div>

              <p>
                ${escapeHtml(
                  review.review_text
                )}
              </p>

              <div class="reservation-card-actions">
                ${moderationButtons(
                  "review",
                  review.id,
                  review.status
                )}
              </div>
            </div>
          </article>
        `;
      }).join("");
  }

  function renderAnalytics(data) {
    Object.entries(
      statisticIds
    ).forEach(([key, id]) => {
      const element =
        document.getElementById(id);

      element.textContent =
        String(data[key] || 0);
    });

    const activity =
      data.activity_30d || {};

    document.querySelector(
      "#socialActivity30d"
    ).textContent =
      String(
        Number(activity.posts || 0) +
        Number(activity.comments || 0) +
        Number(activity.reviews || 0) +
        Number(activity.follows || 0)
      );

    const top =
      data.top_workspaces || [];

    topWorkspaceList.innerHTML =
      top.length
        ? top.map((workspace) => `
            <article class="admin-record-card">
              <div class="admin-record-main">
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

                <dl class="reservation-details">
                  <div>
                    <dt>Saved</dt>
                    <dd>
                      ${escapeHtml(
                        workspace.saved_count
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Reviews</dt>
                    <dd>
                      ${escapeHtml(
                        workspace.review_count
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Average rating</dt>
                    <dd>
                      ${workspace.average_rating
                        ? escapeHtml(
                          Number(
                            workspace.average_rating
                          ).toFixed(1)
                        )
                        : "-"
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>Posts</dt>
                    <dd>
                      ${escapeHtml(
                        workspace.post_count
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          `).join("")
        : `
          <div class="empty-state">
            No workspace engagement data is available.
          </div>
        `;
  }

  async function loadSocialAdminData() {
    refreshButton.disabled = true;

    const client =
      getSupabaseClient();

    const [
      queueResult,
      reviewResult,
      workspaceResult,
      analyticsResult
    ] = await Promise.all([
      client.rpc(
        "admin_get_moderation_queue"
      ),

      client
        .from("workspace_reviews")
        .select(`
          id,
          workspace_id,
          user_id,
          rating,
          review_text,
          status,
          moderation_reason,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(100),

      client
        .from("workspaces")
        .select(`
          id,
          name,
          unit_code
        `),

      client.rpc(
        "get_admin_social_analytics"
      )
    ]);

    const failed =
      [
        queueResult,
        reviewResult,
        workspaceResult,
        analyticsResult
      ].find(
        (result) =>
          result.error
      );

    refreshButton.disabled = false;

    if (failed) {
      throw failed.error;
    }

    reports =
      queueResult.data || [];

    reviews =
      reviewResult.data || [];

    workspaces =
      new Map(
        (
          workspaceResult.data || []
        ).map((workspace) => [
          workspace.id,
          workspace
        ])
      );

    renderReports();
    renderReviews();
    renderAnalytics(
      analyticsResult.data
    );
  }

  async function moderate(button) {
    const action =
      button.dataset
        .moderationAction;

    const reason =
      action === "dismiss"
        ? window.prompt(
          "Optional reason for dismissing the report:",
          ""
        )
        : window.prompt(
          "Enter the moderation reason:",
          ""
        );

    if (
      reason === null
    ) {
      return;
    }

    button.disabled = true;

    try {
      const { error } =
        await getSupabaseClient().rpc(
          "admin_moderate_content",
          {
            p_report_id:
              button.dataset.reportId ||
              null,

            p_target_type:
              button.dataset.targetType,

            p_target_id:
              button.dataset.targetId,

            p_action:
              action,

            p_reason:
              reason.trim() ||
              null
          }
        );

      if (error) {
        throw error;
      }

      await loadSocialAdminData();
    } catch (error) {
      const pageMessage =
        document.querySelector(
          "#adminPageMessage"
        );

      pageMessage.textContent =
        error.message;

      pageMessage.dataset.status =
        "error";

      button.disabled = false;
    }
  }

  async function start() {
    try {
      const admin =
        await requireAdmin(
          "index.html"
        );

      if (!admin) {
        return;
      }

      statusFilter.addEventListener(
        "change",
        renderReports
      );

      refreshButton.addEventListener(
        "click",
        () => {
          void loadSocialAdminData();
        }
      );

      document
        .querySelector(
          "#socialModeration"
        )
        .addEventListener(
          "click",
          (event) => {
            const button =
              event.target.closest(
                "[data-moderation-action]"
              );

            if (button) {
              void moderate(button);
            }
          }
        );

      await loadSocialAdminData();
    } catch (error) {
      console.error(
        "Social administration failed:",
        error
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
