(() => {
  "use strict";

  console.log(
    "SyncSpace expanded profile script loaded"
  );

  const profileAvatar =
    document.querySelector("#profileAvatar");

  const avatarInitials =
    document.querySelector("#avatarInitials");

  const profileDisplayName =
    document.querySelector("#profileDisplayName");

  const profileDisplayEmail =
    document.querySelector("#profileDisplayEmail");

  const profileUsername =
    document.querySelector("#profileUsername");

  const profileBiography =
    document.querySelector("#profileBiography");

  const profileOccupation =
    document.querySelector("#profileOccupation");

  const profileOrganisation =
    document.querySelector("#profileOrganisation");

  const profilePreferredWorkspace =
    document.querySelector(
      "#profilePreferredWorkspace"
    );

  const profileWorkStyle =
    document.querySelector("#profileWorkStyle");

  const profileVisibility =
    document.querySelector("#profileVisibility");

  const profilePhone =
    document.querySelector("#profilePhone");

  const profileSkills =
    document.querySelector("#profileSkills");

  const profileInterests =
    document.querySelector("#profileInterests");

  const profileLinkList =
    document.querySelector("#profileLinkList");

  const profileLinkedInLink =
    document.querySelector("#profileLinkedInLink");

  const profileWebsiteLink =
    document.querySelector("#profileWebsiteLink");

  const editProfileButton =
    document.querySelector("#editProfileButton");

  const profileEditModal =
    document.querySelector("#profileEditModal");

  const closeProfileEditModalButton =
    document.querySelector(
      "#closeProfileEditModal"
    );

  const cancelProfileEditButton =
    document.querySelector(
      "#cancelProfileEditButton"
    );

  const profileEditForm =
    document.querySelector("#profileEditForm");

  const profileFullNameInput =
    document.querySelector(
      "#profileFullNameInput"
    );

  const profileUsernameInput =
    document.querySelector(
      "#profileUsernameInput"
    );

  const profilePhoneInput =
    document.querySelector("#profilePhoneInput");

  const profileOccupationInput =
    document.querySelector(
      "#profileOccupationInput"
    );

  const profileOrganisationInput =
    document.querySelector(
      "#profileOrganisationInput"
    );

  const profilePreferredWorkspaceInput =
    document.querySelector(
      "#profilePreferredWorkspaceInput"
    );

  const profileWorkStyleInput =
    document.querySelector(
      "#profileWorkStyleInput"
    );

  const profileVisibilityInput =
    document.querySelector(
      "#profileVisibilityInput"
    );

  const profileBioInput =
    document.querySelector("#profileBioInput");

  const profileBioCharacterCount =
    document.querySelector(
      "#profileBioCharacterCount"
    );

  const profileSkillsInput =
    document.querySelector("#profileSkillsInput");

  const profileInterestsInput =
    document.querySelector(
      "#profileInterestsInput"
    );

  const profileAvatarUrlInput =
    document.querySelector(
      "#profileAvatarUrlInput"
    );

  const profileLinkedInInput =
    document.querySelector(
      "#profileLinkedInInput"
    );

  const profileWebsiteInput =
    document.querySelector(
      "#profileWebsiteInput"
    );

  const saveProfileButton =
    document.querySelector("#saveProfileButton");

  const profileEditMessage =
    document.querySelector(
      "#profileEditMessage"
    );

  let currentUser = null;
  let currentProfile = null;
  let workspaceTypes = [];

  function assertRequiredElements() {
    const requiredElements = {
      profileAvatar,
      avatarInitials,
      profileDisplayName,
      profileDisplayEmail,
      profileUsername,
      profileBiography,
      profileOccupation,
      profileOrganisation,
      profilePreferredWorkspace,
      profileWorkStyle,
      profileVisibility,
      profilePhone,
      profileSkills,
      profileInterests,
      profileLinkList,
      profileLinkedInLink,
      profileWebsiteLink,
      editProfileButton,
      profileEditModal,
      closeProfileEditModalButton,
      cancelProfileEditButton,
      profileEditForm,
      profileFullNameInput,
      profileUsernameInput,
      profilePhoneInput,
      profileOccupationInput,
      profileOrganisationInput,
      profilePreferredWorkspaceInput,
      profileWorkStyleInput,
      profileVisibilityInput,
      profileBioInput,
      profileBioCharacterCount,
      profileSkillsInput,
      profileInterestsInput,
      profileAvatarUrlInput,
      profileLinkedInInput,
      profileWebsiteInput,
      saveProfileButton,
      profileEditMessage
    };

    const missing =
      Object
        .entries(requiredElements)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        "Expanded profile elements were not found: " +
        missing.join(", ")
      );
    }
  }

  function createInitials(name) {
    const initials =
      String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return initials || "SS";
  }

  function normaliseUsername(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 30);
  }

  function normaliseOptionalText(value) {
    const normalised =
      String(value || "").trim();

    return normalised || null;
  }

  function parseTagList(value) {
    const uniqueTags = new Map();

    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const key = item.toLowerCase();

        if (!uniqueTags.has(key)) {
          uniqueTags.set(
            key,
            item.slice(0, 60)
          );
        }
      });

    return Array
      .from(uniqueTags.values())
      .slice(0, 20);
  }

  function formatTagList(value) {
    if (!Array.isArray(value)) {
      return "";
    }

    return value.join(", ");
  }

  function safeExternalUrl(value) {
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value);

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

  function workStyleLabel(value) {
    const labels = {
      quiet_focus:
        "Quiet and focused work",

      collaboration:
        "Team collaboration",

      meetings:
        "Meetings and presentations",

      networking:
        "Networking and community",

      flexible:
        "Flexible or mixed work style"
    };

    return labels[value] || "Not specified";
  }

  function visibilityLabel(value) {
    const labels = {
      public: "Public",
      connections_only: "Connections only",
      private: "Private"
    };

    return labels[value] || "Public";
  }

  function getWorkspaceTypeName(id) {
    if (!id) {
      return "Not specified";
    }

    return (
      workspaceTypes.find(
        (type) => type.id === id
      )?.name ||
      "Not specified"
    );
  }

  function setEditMessage(
    message,
    status = ""
  ) {
    profileEditMessage.textContent =
      message;

    profileEditMessage.dataset.status =
      status;
  }

  function renderTagList(
    container,
    values,
    emptyText
  ) {
    const tags =
      Array.isArray(values)
        ? values.filter(Boolean)
        : [];

    if (tags.length === 0) {
      container.innerHTML = `
        <span class="profile-empty-value">
          ${emptyText}
        </span>
      `;

      return;
    }

    container.innerHTML =
      tags
        .map((tag) => {
          const span =
            document.createElement("span");

          span.textContent = tag;

          return `
            <span class="profile-tag">
              ${span.innerHTML}
            </span>
          `;
        })
        .join("");
  }

  function renderAvatar() {
    const avatarUrl =
      safeExternalUrl(
        currentProfile?.avatar_url
      );

    const displayName =
      currentProfile?.full_name ||
      currentUser?.email ||
      "SyncSpace User";

    avatarInitials.textContent =
      createInitials(displayName);

    if (avatarUrl) {
      profileAvatar.style.backgroundImage =
        `url("${avatarUrl.replace(/"/g, "%22")}")`;

      profileAvatar.classList.add(
        "has-profile-image"
      );

      avatarInitials.hidden = true;
    } else {
      profileAvatar.style.backgroundImage =
        "";

      profileAvatar.classList.remove(
        "has-profile-image"
      );

      avatarInitials.hidden = false;
    }
  }

  function renderExternalLinks() {
    const linkedInUrl =
      safeExternalUrl(
        currentProfile?.linkedin_url
      );

    const websiteUrl =
      safeExternalUrl(
        currentProfile?.website_url
      );

    profileLinkedInLink.hidden =
      !linkedInUrl;

    profileWebsiteLink.hidden =
      !websiteUrl;

    if (linkedInUrl) {
      profileLinkedInLink.href =
        linkedInUrl;
    }

    if (websiteUrl) {
      profileWebsiteLink.href =
        websiteUrl;
    }

    profileLinkList.hidden =
      !linkedInUrl && !websiteUrl;
  }

  function renderExpandedProfile() {
    const displayName =
      currentProfile?.full_name ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.email?.split("@")[0] ||
      "SyncSpace User";

    profileDisplayName.textContent =
      displayName;

    profileDisplayEmail.textContent =
      currentUser?.email || "";

    profileUsername.textContent =
      currentProfile?.username
        ? `@${currentProfile.username}`
        : "@username";

    profileBiography.textContent =
      currentProfile?.bio ||
      (
        "Add a short biography to introduce " +
        "yourself to the SyncSpace community."
      );

    profileOccupation.textContent =
      currentProfile?.occupation ||
      "Not provided";

    profileOrganisation.textContent =
      currentProfile?.organisation ||
      "Not provided";

    profilePreferredWorkspace.textContent =
      getWorkspaceTypeName(
        currentProfile
          ?.preferred_workspace_type
      );

    profileWorkStyle.textContent =
      workStyleLabel(
        currentProfile?.work_style
      );

    profileVisibility.textContent =
      visibilityLabel(
        currentProfile?.profile_visibility
      );

    profilePhone.textContent =
      currentProfile?.phone ||
      "Not provided";

    renderTagList(
      profileSkills,
      currentProfile?.skills,
      "No skills added"
    );

    renderTagList(
      profileInterests,
      currentProfile?.interests,
      "No interests added"
    );

    renderAvatar();
    renderExternalLinks();
  }

  async function loadWorkspaceTypes() {
    const { data, error } =
      await getSupabaseClient()
        .from("workspace_types")
        .select(`
          id,
          name,
          active
        `)
        .eq("active", true)
        .order("name");

    if (error) {
      throw error;
    }

    workspaceTypes = data || [];

    profilePreferredWorkspaceInput
      .innerHTML = `
        <option value="">
          No preference
        </option>

        ${
          workspaceTypes
            .map((type) => {
              const option =
                document.createElement(
                  "option"
                );

              option.value = type.id;
              option.textContent = type.name;

              return option.outerHTML;
            })
            .join("")
        }
      `;
  }

  function populateProfileForm() {
    profileFullNameInput.value =
      currentProfile?.full_name || "";

    profileUsernameInput.value =
      currentProfile?.username || "";

    profilePhoneInput.value =
      currentProfile?.phone || "";

    profileOccupationInput.value =
      currentProfile?.occupation || "";

    profileOrganisationInput.value =
      currentProfile?.organisation || "";

    profilePreferredWorkspaceInput.value =
      currentProfile
        ?.preferred_workspace_type || "";

    profileWorkStyleInput.value =
      currentProfile?.work_style || "";

    profileVisibilityInput.value =
      currentProfile?.profile_visibility ||
      "public";

    profileBioInput.value =
      currentProfile?.bio || "";

    profileSkillsInput.value =
      formatTagList(
        currentProfile?.skills
      );

    profileInterestsInput.value =
      formatTagList(
        currentProfile?.interests
      );

    profileAvatarUrlInput.value =
      currentProfile?.avatar_url || "";

    profileLinkedInInput.value =
      currentProfile?.linkedin_url || "";

    profileWebsiteInput.value =
      currentProfile?.website_url || "";

    updateBioCharacterCount();
    setEditMessage("");
  }

  function openProfileEditModal() {
    populateProfileForm();

    profileEditModal.hidden = false;
    document.body.style.overflow =
      "hidden";

    window.setTimeout(() => {
      profileFullNameInput.focus();
    }, 0);
  }

  function closeProfileEditModal() {
    profileEditModal.hidden = true;
    document.body.style.overflow = "";
    profileEditForm.reset();
    setEditMessage("");
  }

  function updateBioCharacterCount() {
    profileBioCharacterCount.textContent =
      String(profileBioInput.value.length);
  }

  function validateUsername(username) {
    if (
      !/^[a-z0-9][a-z0-9_]{2,29}$/
        .test(username)
    ) {
      throw new Error(
        "Username must contain 3–30 lowercase " +
        "letters, numbers, or underscores."
      );
    }
  }

  function validateOptionalUrl(
    value,
    label
  ) {
    if (!value) {
      return null;
    }

    const safeUrl =
      safeExternalUrl(value);

    if (!safeUrl) {
      throw new Error(
        `${label} must be a valid HTTP or HTTPS URL.`
      );
    }

    return safeUrl;
  }

  function getProfilePayload() {
    const fullName =
      profileFullNameInput.value.trim();

    const username =
      normaliseUsername(
        profileUsernameInput.value
      );

    if (fullName.length < 2) {
      throw new Error(
        "Full name must contain at least two characters."
      );
    }

    validateUsername(username);

    const avatarUrl =
      validateOptionalUrl(
        profileAvatarUrlInput.value.trim(),
        "Profile image URL"
      );

    const linkedInUrl =
      validateOptionalUrl(
        profileLinkedInInput.value.trim(),
        "LinkedIn URL"
      );

    const websiteUrl =
      validateOptionalUrl(
        profileWebsiteInput.value.trim(),
        "Website URL"
      );

    return {
      full_name: fullName,
      username,
      phone:
        normaliseOptionalText(
          profilePhoneInput.value
        ),
      avatar_url: avatarUrl,
      bio:
        normaliseOptionalText(
          profileBioInput.value
        ),
      occupation:
        normaliseOptionalText(
          profileOccupationInput.value
        ),
      organisation:
        normaliseOptionalText(
          profileOrganisationInput.value
        ),
      skills:
        parseTagList(
          profileSkillsInput.value
        ),
      interests:
        parseTagList(
          profileInterestsInput.value
        ),
      preferred_workspace_type:
        profilePreferredWorkspaceInput
          .value || null,
      work_style:
        profileWorkStyleInput.value ||
        null,
      linkedin_url: linkedInUrl,
      website_url: websiteUrl,
      profile_visibility:
        profileVisibilityInput.value
    };
  }

  async function checkUsernameAvailability(
    username
  ) {
    const { data, error } =
      await getSupabaseClient()
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .neq("id", currentUser.id)
        .limit(1);

    if (error) {
      throw error;
    }

    if ((data || []).length > 0) {
      throw new Error(
        "This username is already in use. " +
        "Choose another username."
      );
    }
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!profileEditForm.checkValidity()) {
      profileEditForm.reportValidity();
      return;
    }

    saveProfileButton.disabled = true;

    setEditMessage(
      "Saving your profile...",
      "loading"
    );

    try {
      const payload =
        getProfilePayload();

      await checkUsernameAvailability(
        payload.username
      );

      const { data, error } =
        await getSupabaseClient()
          .from("profiles")
          .update(payload)
          .eq("id", currentUser.id)
          .select("*")
          .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "This username is already in use. " +
            "Choose another username."
          );
        }

        throw error;
      }

      currentProfile = data;

      renderExpandedProfile();

      /*
       * Refresh shared navigation text and profile data
       * used by auth.js.
       */
      await updateAuthUI(currentUser);

      closeProfileEditModal();

      const profilePageMessage =
        document.querySelector(
          "#profilePageMessage"
        );

      if (profilePageMessage) {
        profilePageMessage.textContent =
          "Your professional profile was updated successfully.";

        profilePageMessage.dataset.status =
          "success";
      }
    } catch (error) {
      console.error(
        "Profile update failed:",
        error
      );

      setEditMessage(
        error.message ||
        "Your profile could not be updated.",
        "error"
      );
    } finally {
      saveProfileButton.disabled =
        false;
    }
  }

  function registerEventListeners() {
    editProfileButton.addEventListener(
      "click",
      openProfileEditModal
    );

    closeProfileEditModalButton
      .addEventListener(
        "click",
        closeProfileEditModal
      );

    cancelProfileEditButton
      .addEventListener(
        "click",
        closeProfileEditModal
      );

    profileEditModal.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          profileEditModal
        ) {
          closeProfileEditModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape" &&
          !profileEditModal.hidden
        ) {
          closeProfileEditModal();
        }
      }
    );

    profileBioInput.addEventListener(
      "input",
      updateBioCharacterCount
    );

    profileUsernameInput.addEventListener(
      "input",
      () => {
        const normalised =
          normaliseUsername(
            profileUsernameInput.value
          );

        if (
          profileUsernameInput.value !==
          normalised
        ) {
          profileUsernameInput.value =
            normalised;
        }
      }
    );

    profileEditForm.addEventListener(
      "submit",
      saveProfile
    );
  }

  async function initialiseExpandedProfile() {
    assertRequiredElements();

    currentUser =
      await requireAuthenticatedUser(
        "index.html"
      );

    if (!currentUser) {
      return;
    }

    const [
      profile
    ] = await Promise.all([
      getUserProfile(currentUser),
      loadWorkspaceTypes()
    ]);

    currentProfile = profile;

    renderExpandedProfile();
    registerEventListeners();
  }

  async function start() {
    try {
      await initialiseExpandedProfile();
    } catch (error) {
      console.error(
        "Expanded profile initialization failed:",
        error
      );

      const profilePageMessage =
        document.querySelector(
          "#profilePageMessage"
        );

      if (profilePageMessage) {
        profilePageMessage.textContent =
          error.message ||
          "The expanded profile could not be loaded.";

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
