(() => {
  "use strict";

  const list =
    document.querySelector(
      "#savedWorkspaceList"
    );

  function escapeHtml(value) {
    const element =
      document.createElement("div");

    element.textContent =
      String(value ?? "");

    return element.innerHTML;
  }

  async function loadSaved() {
    const { data, error } =
      await getSupabaseClient().rpc(
        "get_my_saved_workspaces"
      );

    if (error) {
      throw error;
    }

    const workspaces =
      data || [];

    if (!workspaces.length) {
      list.innerHTML = `
        <div class="empty-state">
          You have not saved any workspaces yet.
        </div>
      `;

      return;
    }

    list.innerHTML =
      workspaces.map((workspace) => `
        <article class="saved-workspace-card">
          <img
            src="${escapeHtml(
              workspace.image_url ||
              "assets/syncspace-logo-mark.png"
            )}"
            alt="${escapeHtml(
              workspace.workspace_name
            )}"
          >

          <div>
            <span class="pill">
              ${escapeHtml(
                workspace.workspace_type
              )}
            </span>

            <h3>
              ${escapeHtml(
                workspace.workspace_name
              )}
            </h3>

            <p>
              Unit
              ${escapeHtml(
                workspace.unit_code
              )}
            </p>

            <p>
              ${
                workspace.review_count
                  ? `${Number(
                    workspace.average_rating
                  ).toFixed(1)}/5 · ` +
                    `${workspace.review_count} reviews`
                  : "No ratings yet"
              }
            </p>

            <div class="reservation-card-actions">
              <a
                class="button primary"
                href="workspace.html?id=${encodeURIComponent(
                  workspace.workspace_id
                )}"
              >
                View workspace
              </a>

              <button
                type="button"
                class="button secondary"
                data-remove-saved="${escapeHtml(
                  workspace.workspace_id
                )}"
              >
                Remove
              </button>
            </div>
          </div>
        </article>
      `).join("");
  }

  list.addEventListener(
    "click",
    async (event) => {
      const button =
        event.target.closest(
          "[data-remove-saved]"
        );

      if (!button) {
        return;
      }

      button.disabled = true;

      try {
        const { error } =
          await getSupabaseClient().rpc(
            "toggle_saved_workspace",
            {
              p_workspace_id:
                button.dataset
                  .removeSaved
            }
          );

        if (error) {
          throw error;
        }

        await loadSaved();
      } catch (error) {
        console.error(
          "Saved workspace removal failed:",
          error
        );

        button.disabled = false;
      }
    }
  );

  async function start() {
    try {
      const user =
        await requireAuthenticatedUser(
          "index.html"
        );

      if (!user) {
        return;
      }

      await loadSaved();
    } catch (error) {
      list.innerHTML = `
        <div class="empty-state">
          Saved workspaces could not be loaded.
        </div>
      `;
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
