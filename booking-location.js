(() => {
  "use strict";

  console.log(
    "SyncSpace branch location script loaded"
  );

  const branchFilter =
    document.querySelector("#branchFilter");

  const useMyLocationButton =
    document.querySelector("#useMyLocationButton");

  const locationStatus =
    document.querySelector("#locationStatus");

  const locationSummary =
    document.querySelector("#locationSummary");

  const branchMapElement =
    document.querySelector("#branchMap");

  const roomStrip =
    document.querySelector("#roomStrip");

  let branches = [];

  let branchById =
    new Map();

  let workspaceBranchById =
    new Map();

  let map = null;

  let branchMarkers =
    new Map();

  let userMarker = null;

  let userCoordinates = null;

  let cardUpdateScheduled = false;

  function assertRequiredElements() {
    const required = {
      branchFilter,
      useMyLocationButton,
      locationStatus,
      locationSummary,
      branchMapElement,
      roomStrip
    };

    const missing = Object
      .entries(required)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Location interface elements were not found: " +
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

  function setLocationStatus(
    message,
    status = ""
  ) {
    locationStatus.textContent =
      message;

    locationStatus.dataset.status =
      status;
  }

  function degreesToRadians(value) {
    return value * Math.PI / 180;
  }

  function calculateDistanceKm(
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude
  ) {
    const earthRadiusKm = 6371;

    const latitudeDifference =
      degreesToRadians(
        endLatitude - startLatitude
      );

    const longitudeDifference =
      degreesToRadians(
        endLongitude - startLongitude
      );

    const startLatitudeRadians =
      degreesToRadians(startLatitude);

    const endLatitudeRadians =
      degreesToRadians(endLatitude);

    const calculation =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDifference / 2) ** 2;

    const angularDistance =
      2 * Math.atan2(
        Math.sqrt(calculation),
        Math.sqrt(1 - calculation)
      );

    return earthRadiusKm *
      angularDistance;
  }

  function getDistanceFromUser(branch) {
    if (!userCoordinates) {
      return null;
    }

    return calculateDistanceKm(
      userCoordinates.latitude,
      userCoordinates.longitude,
      branch.latitude,
      branch.longitude
    );
  }

  function formatDistance(distance) {
    if (
      distance === null ||
      !Number.isFinite(distance)
    ) {
      return "";
    }

    if (distance < 1) {
      return `${Math.round(
        distance * 1000
      )} m away`;
    }

    return `${distance.toFixed(1)} km away`;
  }

  function sortBranchesForDisplay() {
    return [...branches].sort(
      (first, second) => {
        if (userCoordinates) {
          return (
            getDistanceFromUser(first) -
            getDistanceFromUser(second)
          );
        }

        return (
          first.displayOrder -
          second.displayOrder
        ) || first.name.localeCompare(
          second.name
        );
      }
    );
  }

  function populateBranchFilter() {
    const previousValue =
      branchFilter.value || "all";

    const options =
      sortBranchesForDisplay()
        .map((branch) => {
          const distance =
            getDistanceFromUser(branch);

          const distanceText =
            distance === null
              ? ""
              : ` — ${formatDistance(distance)}`;

          return `
            <option value="${escapeHtml(
              branch.id
            )}">
              ${escapeHtml(
                branch.name + distanceText
              )}
            </option>
          `;
        })
        .join("");

    branchFilter.innerHTML = `
      <option value="all">
        All branches
      </option>

      ${options}
    `;

    branchFilter.value =
      previousValue === "all" ||
      branchById.has(previousValue)
        ? previousValue
        : "all";
  }

  function getWorkspaceIdFromCard(card) {
    const workspaceControl =
      card.querySelector(
        "[data-workspace-id]"
      );

    if (
      workspaceControl?.dataset
        .workspaceId
    ) {
      return workspaceControl.dataset
        .workspaceId;
    }

    const detailsLink =
      card.querySelector(
        'a[href*="workspace.html"]'
      );

    if (!detailsLink) {
      return null;
    }

    try {
      const url =
        new URL(
          detailsLink.href,
          window.location.href
        );

      return url.searchParams.get("id");
    } catch {
      return null;
    }
  }

  function createBranchMetadataMarkup(
    branch
  ) {
    if (!branch) {
      return `
        <strong>
          Branch not assigned
        </strong>

        <span>
          Contact SyncSpace for location
          information.
        </span>
      `;
    }

    const distance =
      getDistanceFromUser(branch);

    return `
      <strong>
        ${escapeHtml(branch.name)}
      </strong>

      <span>
        ${escapeHtml(branch.address)}
      </span>

      ${
        distance === null
          ? ""
          : `
            <span class="room-distance">
              ${escapeHtml(
                formatDistance(distance)
              )}
            </span>
          `
      }
    `;
  }

  function updateWorkspaceCards() {
    const selectedBranchId =
      branchFilter.value;

    const cards = [
      ...roomStrip.querySelectorAll(
        ".room-card"
      )
    ];

    let visibleCardCount = 0;

    cards.forEach((card) => {
      const workspaceId =
        getWorkspaceIdFromCard(card);

      const branchId =
        workspaceBranchById.get(
          workspaceId
        ) || "";

      const branch =
        branchById.get(branchId);

      card.dataset.branchId =
        branchId;

      let metadata =
        card.querySelector(
          ".room-branch-meta"
        );

      if (!metadata) {
        metadata =
          document.createElement("p");

        metadata.className =
          "room-branch-meta";

        const actionContainer =
          card.querySelector(
            ".room-actions, " +
            ".room-card-actions, " +
            ".button-row"
          );

        if (actionContainer) {
          card.insertBefore(
            metadata,
            actionContainer
          );
        } else {
          card.appendChild(metadata);
        }
      }

      if (
        metadata.dataset.branchId !==
        branchId
      ) {
        metadata.dataset.branchId =
          branchId;

        metadata.innerHTML =
          createBranchMetadataMarkup(
            branch
          );
      }

      const matchesBranch =
        selectedBranchId === "all" ||
        branchId === selectedBranchId;

      card.hidden =
        !matchesBranch;

      if (matchesBranch) {
        visibleCardCount += 1;
      }
    });

    if (selectedBranchId === "all") {
      locationSummary.textContent =
        `Showing ${visibleCardCount} ` +
        `workspace card${
          visibleCardCount === 1
            ? ""
            : "s"
        } across ${branches.length} ` +
        `active branch${
          branches.length === 1
            ? ""
            : "es"
        }.`;
    } else {
      const selectedBranch =
        branchById.get(
          selectedBranchId
        );

      locationSummary.textContent =
        `${visibleCardCount} workspace ` +
        `card${
          visibleCardCount === 1
            ? ""
            : "s"
        } shown for ` +
        `${selectedBranch?.name ||
          "the selected branch"}.`;
    }
  }

  function scheduleWorkspaceCardUpdate() {
    if (cardUpdateScheduled) {
      return;
    }

    cardUpdateScheduled = true;

    window.requestAnimationFrame(
      () => {
        cardUpdateScheduled = false;
        updateWorkspaceCards();
      }
    );
  }

  function getMapBounds() {
    if (
      !window.L ||
      branches.length === 0
    ) {
      return null;
    }

    const bounds =
      window.L.latLngBounds([]);

    branches.forEach((branch) => {
      bounds.extend([
        branch.latitude,
        branch.longitude
      ]);
    });

    return bounds;
  }

  function showAllBranchesOnMap() {
    const bounds =
      getMapBounds();

    if (
      map &&
      bounds &&
      bounds.isValid()
    ) {
      map.fitBounds(
        bounds.pad(0.2)
      );
    }
  }

  function focusOnBranch(branchId) {
    if (!map) {
      return;
    }

    if (branchId === "all") {
      showAllBranchesOnMap();
      return;
    }

    const branch =
      branchById.get(branchId);

    if (!branch) {
      return;
    }

    map.setView(
      [
        branch.latitude,
        branch.longitude
      ],
      14
    );

    branchMarkers
      .get(branchId)
      ?.openPopup();
  }

  function refreshBookingAvailability() {
    /*
     * Trigger an existing booking-filter
     * change so booking.js clears any
     * previously selected workspace.
     */
    const roomType =
      document.querySelector("#roomType");

    roomType?.dispatchEvent(
      new Event(
        "change",
        {
          bubbles: true
        }
      )
    );
  }

  function selectBranch(
    branchId,
    refreshAvailability = true
  ) {
    branchFilter.value =
      branchId === "all" ||
      branchById.has(branchId)
        ? branchId
        : "all";

    updateWorkspaceCards();

    focusOnBranch(
      branchFilter.value
    );

    if (refreshAvailability) {
      refreshBookingAvailability();
    }
  }

  function initialiseMap() {
    if (!window.L) {
      branchMapElement.innerHTML = `
        <div class="empty-state">
          The map library could not be
          loaded.
        </div>
      `;

      return;
    }

    if (branches.length === 0) {
      branchMapElement.innerHTML = `
        <div class="empty-state">
          No active branch locations
          are available.
        </div>
      `;

      return;
    }

    const firstBranch =
      branches[0];

    map = window.L.map(
      branchMapElement,
      {
        scrollWheelZoom: false
      }
    ).setView(
      [
        firstBranch.latitude,
        firstBranch.longitude
      ],
      11
    );

    window.L
      .tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">' +
            "OpenStreetMap contributors</a>"
        }
      )
      .addTo(map);

    branches.forEach((branch) => {
      const marker =
        window.L
          .marker([
            branch.latitude,
            branch.longitude
          ])
          .addTo(map);

      marker.bindPopup(`
        <strong>
          ${escapeHtml(branch.name)}
        </strong>

        <br>

        ${escapeHtml(branch.address)}

        <br>

        ${escapeHtml(
          `${branch.city}, ${branch.state}`
        )}
      `);

      marker.on(
        "click",
        () => {
          selectBranch(
            branch.id
          );
        }
      );

      branchMarkers.set(
        branch.id,
        marker
      );
    });

    showAllBranchesOnMap();

    window.setTimeout(
      () => {
        map.invalidateSize();
      },
      100
    );
  }

  function showUserLocationOnMap(
    latitude,
    longitude,
    nearestBranch
  ) {
    if (!map || !window.L) {
      return;
    }

    if (userMarker) {
      map.removeLayer(userMarker);
    }

    userMarker =
      window.L
        .circleMarker(
          [latitude, longitude],
          {
            radius: 8,
            color: "#0d5d58",
            fillColor: "#18a099",
            fillOpacity: 0.9,
            weight: 3
          }
        )
        .addTo(map)
        .bindPopup(
          "<strong>Your approximate location</strong>"
        );

    const bounds =
      window.L.latLngBounds([
        [latitude, longitude],
        [
          nearestBranch.latitude,
          nearestBranch.longitude
        ]
      ]);

    map.fitBounds(
      bounds.pad(0.35)
    );

    userMarker.openPopup();
  }

  function getNearestBranch() {
    if (
      !userCoordinates ||
      branches.length === 0
    ) {
      return null;
    }

    return branches.reduce(
      (nearest, branch) => {
        const branchDistance =
          getDistanceFromUser(branch);

        if (!nearest) {
          return {
            branch,
            distance: branchDistance
          };
        }

        return branchDistance <
          nearest.distance
          ? {
              branch,
              distance:
                branchDistance
            }
          : nearest;
      },
      null
    );
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus(
        "Location services are not " +
        "supported by this browser.",
        "error"
      );

      return;
    }

    useMyLocationButton.disabled =
      true;

    setLocationStatus(
      "Detecting your location...",
      "loading"
    );

    navigator.geolocation
      .getCurrentPosition(
        (position) => {
          userCoordinates = {
            latitude:
              position.coords.latitude,
            longitude:
              position.coords.longitude
          };

          populateBranchFilter();

          const nearest =
            getNearestBranch();

          if (!nearest) {
            throw new Error(
              "No active branches are " +
              "available."
            );
          }

          selectBranch(
            nearest.branch.id
          );

          showUserLocationOnMap(
            userCoordinates.latitude,
            userCoordinates.longitude,
            nearest.branch
          );

          setLocationStatus(
            `${nearest.branch.name} is ` +
            `the nearest branch ` +
            `(${formatDistance(
              nearest.distance
            )}).`,
            "success"
          );

          useMyLocationButton.disabled =
            false;
        },
        (error) => {
          const messages = {
            1:
              "Location permission was " +
              "not granted. Select a " +
              "branch manually.",
            2:
              "Your current location " +
              "could not be determined.",
            3:
              "The location request " +
              "timed out."
          };

          setLocationStatus(
            messages[error.code] ||
              "Your location could not " +
              "be retrieved.",
            "error"
          );

          useMyLocationButton.disabled =
            false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
  }

  async function loadLocationData() {
    const client =
      getSupabaseClient();

    const [
      branchResult,
      workspaceResult
    ] = await Promise.all([
      client
        .from("workspace_branches")
        .select(`
          id,
          name,
          address,
          city,
          state,
          postcode,
          latitude,
          longitude,
          transport_notes,
          active,
          display_order
        `)
        .eq("active", true)
        .order(
          "display_order",
          {
            ascending: true
          }
        ),

      client
        .from("workspaces")
        .select(`
          id,
          branch_id
        `)
    ]);

    if (branchResult.error) {
      throw branchResult.error;
    }

    if (workspaceResult.error) {
      throw workspaceResult.error;
    }

    branches =
      (branchResult.data || [])
        .map((branch) => ({
          id: String(branch.id),
          name: String(branch.name),
          address:
            String(branch.address),
          city: String(branch.city),
          state: String(branch.state),
          postcode:
            String(
              branch.postcode || ""
            ),
          latitude:
            Number(branch.latitude),
          longitude:
            Number(branch.longitude),
          transportNotes:
            String(
              branch.transport_notes ||
              ""
            ),
          displayOrder:
            Number(
              branch.display_order || 0
            )
        }))
        .filter(
          (branch) =>
            Number.isFinite(
              branch.latitude
            ) &&
            Number.isFinite(
              branch.longitude
            )
        );

    branchById =
      new Map(
        branches.map(
          (branch) => [
            branch.id,
            branch
          ]
        )
      );

    workspaceBranchById =
      new Map(
        (workspaceResult.data || [])
          .filter(
            (workspace) =>
              workspace.branch_id
          )
          .map(
            (workspace) => [
              String(workspace.id),
              String(
                workspace.branch_id
              )
            ]
          )
      );
  }

  async function initialiseLocationDiscovery() {
    assertRequiredElements();

    await loadLocationData();

    populateBranchFilter();
    initialiseMap();

    branchFilter.addEventListener(
      "change",
      () => {
        selectBranch(
          branchFilter.value
        );
      }
    );

    useMyLocationButton
      .addEventListener(
        "click",
        useCurrentLocation
      );

    const roomObserver =
      new MutationObserver(
        scheduleWorkspaceCardUpdate
      );

    roomObserver.observe(
      roomStrip,
      {
        childList: true,
        subtree: true
      }
    );

    updateWorkspaceCards();

    setLocationStatus(
      "Select a branch or use your " +
      "current location."
    );
  }

  async function start() {
    try {
      await initialiseLocationDiscovery();
    } catch (error) {
      console.error(
        "Branch location discovery failed:",
        error
      );

      setLocationStatus(
        error.message ||
          "Branch locations could not " +
          "be loaded.",
        "error"
      );

      locationSummary.textContent =
        "Location-based workspace " +
        "discovery is currently " +
        "unavailable.";

      branchMapElement.innerHTML = `
        <div class="empty-state">
          Branch locations could not
          be displayed.
        </div>
      `;
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
