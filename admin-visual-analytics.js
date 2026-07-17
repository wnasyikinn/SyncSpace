(() => {
  "use strict";

  console.log(
    "SyncSpace visual analytics script loaded"
  );

  const activityMixCanvas =
    document.querySelector(
      "#socialActivityMixChart"
    );

  const totalsCanvas =
    document.querySelector(
      "#socialTotalsChart"
    );

  const workspaceCanvas =
    document.querySelector(
      "#workspaceEngagementChart"
    );

  const refreshButton =
    document.querySelector(
      "#refreshSocialAdminButton"
    );

  let activityMixChart = null;
  let totalsChart = null;
  let workspaceChart = null;

  function toNumber(value) {
    const number =
      Number(value || 0);

    return Number.isFinite(number)
      ? number
      : 0;
  }

  function destroyExistingCharts() {
    activityMixChart?.destroy();
    totalsChart?.destroy();
    workspaceChart?.destroy();

    activityMixChart = null;
    totalsChart = null;
    workspaceChart = null;
  }

  function getSharedOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 450
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 18,
            font: {
              size: 12,
              weight: "600"
            }
          }
        },
        tooltip: {
          displayColors: true,
          callbacks: {
            label(context) {
              const label =
                context.dataset.label ||
                context.label ||
                "Activity";

              const value =
                context.parsed?.y ??
                context.parsed ??
                0;

              return `${label}: ${value}`;
            }
          }
        }
      }
    };
  }

  function renderActivityMix(data) {
    const activity =
      data.activity_30d || {};

    activityMixChart =
      new Chart(
        activityMixCanvas,
        {
          type: "doughnut",

          data: {
            labels: [
              "Posts",
              "Comments",
              "Reviews",
              "Follows"
            ],

            datasets: [
              {
                label:
                  "30-day interactions",

                data: [
                  toNumber(
                    activity.posts
                  ),
                  toNumber(
                    activity.comments
                  ),
                  toNumber(
                    activity.reviews
                  ),
                  toNumber(
                    activity.follows
                  )
                ],

                backgroundColor: [
                  "#14736e",
                  "#4c8c87",
                  "#86bcb6",
                  "#d5a84b"
                ],

                borderColor:
                  "#ffffff",

                borderWidth: 3,

                hoverOffset: 7
              }
            ]
          },

          options: {
            ...getSharedOptions(),

            cutout: "58%",

            plugins: {
              ...getSharedOptions()
                .plugins,

              legend: {
                ...getSharedOptions()
                  .plugins.legend,
                position: "bottom"
              }
            }
          }
        }
      );
  }

  function renderCommunityTotals(data) {
    totalsChart =
      new Chart(
        totalsCanvas,
        {
          type: "bar",

          data: {
            labels: [
              "Posts",
              "Comments",
              "Reviews",
              "Follows",
              "Saved workspaces"
            ],

            datasets: [
              {
                label:
                  "Recorded activities",

                data: [
                  toNumber(data.posts),
                  toNumber(data.comments),
                  toNumber(data.reviews),
                  toNumber(data.follows),
                  toNumber(
                    data.saved_workspaces
                  )
                ],

                backgroundColor:
                  "#14736e",

                borderRadius: 7,

                maxBarThickness: 54
              }
            ]
          },

          options: {
            ...getSharedOptions(),

            scales: {
              x: {
                grid: {
                  display: false
                },

                ticks: {
                  font: {
                    weight: "600"
                  }
                }
              },

              y: {
                beginAtZero: true,

                ticks: {
                  precision: 0
                },

                grid: {
                  color:
                    "rgba(20, 76, 72, 0.1)"
                }
              }
            }
          }
        }
      );
  }

  function renderWorkspaceEngagement(
    data
  ) {
    const topWorkspaces =
      (data.top_workspaces || [])
        .slice(0, 8);

    const labels =
      topWorkspaces.length > 0
        ? topWorkspaces.map(
            (workspace) =>
              workspace.unit_code
                ? `${workspace.name} ` +
                  `(${workspace.unit_code})`
                : workspace.name
          )
        : ["No engagement data"];

    workspaceChart =
      new Chart(
        workspaceCanvas,
        {
          type: "bar",

          data: {
            labels,

            datasets: [
              {
                label:
                  "Saved workspaces",

                data:
                  topWorkspaces.length > 0
                    ? topWorkspaces.map(
                        (workspace) =>
                          toNumber(
                            workspace
                              .saved_count
                          )
                      )
                    : [0],

                backgroundColor:
                  "#14736e",

                borderRadius: 5
              },

              {
                label:
                  "Reviews",

                data:
                  topWorkspaces.length > 0
                    ? topWorkspaces.map(
                        (workspace) =>
                          toNumber(
                            workspace
                              .review_count
                          )
                      )
                    : [0],

                backgroundColor:
                  "#75aaa5",

                borderRadius: 5
              },

              {
                label:
                  "Related posts",

                data:
                  topWorkspaces.length > 0
                    ? topWorkspaces.map(
                        (workspace) =>
                          toNumber(
                            workspace
                              .post_count
                          )
                      )
                    : [0],

                backgroundColor:
                  "#d5a84b",

                borderRadius: 5
              }
            ]
          },

          options: {
            ...getSharedOptions(),

            interaction: {
              mode: "index",
              intersect: false
            },

            scales: {
              x: {
                grid: {
                  display: false
                },

                ticks: {
                  autoSkip: false,
                  maxRotation: 30,
                  minRotation: 0
                }
              },

              y: {
                beginAtZero: true,

                ticks: {
                  precision: 0
                },

                grid: {
                  color:
                    "rgba(20, 76, 72, 0.1)"
                }
              }
            }
          }
        }
      );
  }

  function renderCharts(data) {
    destroyExistingCharts();

    renderActivityMix(data);
    renderCommunityTotals(data);
    renderWorkspaceEngagement(data);
  }

  async function loadVisualAnalytics() {
    const {
      data,
      error
    } = await getSupabaseClient()
      .rpc(
        "get_admin_social_analytics"
      );

    if (error) {
      throw error;
    }

    renderCharts(data || {});
  }

  async function initialise() {
    if (
      !activityMixCanvas ||
      !totalsCanvas ||
      !workspaceCanvas
    ) {
      throw new Error(
        "The visual analytics canvas " +
        "elements were not found."
      );
    }

    if (!window.Chart) {
      throw new Error(
        "Chart.js could not be loaded."
      );
    }

    const authorised =
      await requireAdmin(
        "index.html"
      );

    if (!authorised) {
      return;
    }

    refreshButton?.addEventListener(
      "click",
      () => {
        window.setTimeout(
          () => {
            void loadVisualAnalytics();
          },
          100
        );
      }
    );

    await loadVisualAnalytics();
  }

  async function start() {
    try {
      await initialise();
    } catch (error) {
      console.error(
        "Visual analytics failed:",
        error
      );

      const pageMessage =
        document.querySelector(
          "#adminPageMessage"
        );

      if (
        pageMessage &&
        !pageMessage.textContent
      ) {
        pageMessage.textContent =
          error.message ||
          "Visual analytics could " +
          "not be loaded.";

        pageMessage.dataset.status =
          "error";
      }
    }
  }

  if (
    document.readyState ===
    "loading"
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
