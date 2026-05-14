const API = "http://3.138.42.18:5000";
    const ADMIN_EMAIL = "admin@gmail.com";
    const currentPage = window.location.pathname.split("/").pop().toLowerCase() || "index.html";
    let token = sessionStorage.getItem("token");
    let currentUser = null;
    let allCreators = [];
    let allWorkspacePosts = [];
    let authDismissed = sessionStorage.getItem("authDismissed") === "true" || !token;
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    let suppressProfileCardOnReload = navigationEntry?.type === "reload";

    const appShell = document.getElementById("appShell");
    const authOverlay = document.getElementById("authOverlay");
    const authMessage = document.getElementById("authMessage");
    const editorBox = document.getElementById("editorBox");
    const adminNoticeText = document.getElementById("adminNoticeText");
    const logoutButton = document.getElementById("logoutButton");
    const headerLoginButton = document.getElementById("headerLoginButton");
    const headerSignupButton = document.getElementById("headerSignupButton");
    const headerCreateButton = document.getElementById("headerCreateButton");
    const adminCrown = document.getElementById("adminCrown");
    const headerUserChip = document.getElementById("headerUserChip");
    const headerUserAvatar = document.getElementById("headerUserAvatar");
    const headerUserName = document.getElementById("headerUserName");
    const headerUserType = document.getElementById("headerUserType");
    const signupAvatarPicker = document.getElementById("signupAvatarPicker");
    const signupSubmitButton = document.getElementById("signupSubmitButton");
    const modalSignupPassword = document.getElementById("signupPassword");
    const modalPasswordGuide = document.getElementById("modalPasswordGuide");
    const modalLoginValidation = document.getElementById("modalLoginValidation");
    const modalSignupValidation = document.getElementById("modalSignupValidation");
    const deleteOverlay = document.getElementById("deleteOverlay");
    const editOverlay = document.getElementById("editOverlay");
    const confirmDeleteButton = document.getElementById("confirmDeleteButton");
    const saveEditButton = document.getElementById("saveEditButton");
    const editTitleInput = document.getElementById("editTitleInput");
    const editContentInput = document.getElementById("editContentInput");
    const profileCard = document.getElementById("profileCard");
    const creatorBanner = document.getElementById("creatorBanner");
    const creatorBannerText = document.getElementById("creatorBannerText");
    const socialHub = document.getElementById("socialHub");
    const socialOverlay = document.getElementById("socialOverlay");
    const adminAnnouncement = document.getElementById("adminAnnouncement");
    const adminAnnouncementTitle = document.getElementById("adminAnnouncementTitle");
    const adminAnnouncementBody = document.getElementById("adminAnnouncementBody");
    const adminAnnouncementMeta = document.getElementById("adminAnnouncementMeta");
    const profileTitle = document.getElementById("profileTitle");
    const profileDescription = document.getElementById("profileDescription");
    const profileAccountType = document.getElementById("profileAccountType");
    const profileFollowersCount = document.getElementById("profileFollowersCount");
    const profileFollowingCount = document.getElementById("profileFollowingCount");
    const postSearchInput = document.getElementById("postSearchInput");
    const feedFilterSelect = document.getElementById("feedFilterSelect");
    const feedSortSelect = document.getElementById("feedSortSelect");
    const feedResultsSummary = document.getElementById("feedResultsSummary");
    const postsContainer = document.getElementById("posts");
    const creatorsList = document.getElementById("creatorsList");
    const membershipBadge = document.getElementById("membershipBadge");
    const membershipSummary = document.getElementById("membershipSummary");
    const membershipTier = document.getElementById("membershipTier");
    const membershipCredits = document.getElementById("membershipCredits");
    const chatFriendsList = document.getElementById("chatFriendsList");
    const chatSearchInput = document.getElementById("chatSearchInput");
    const chatPanelTitle = document.getElementById("chatPanelTitle");
    const chatDeleteOverlay = document.getElementById("chatDeleteOverlay");
    const chatDeleteMessage = document.getElementById("chatDeleteMessage");
    const chatThread = document.getElementById("chatThread");
    const chatMessageInput = document.getElementById("chatMessageInput");
    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = document.getElementById("toastIcon");
    const toastTitle = document.getElementById("toastTitle");
    const toastBody = document.getElementById("toastBody");
    const identityOverlay = document.getElementById("identityOverlay");
    const writersOverlay = document.getElementById("writersOverlay");
    const friendsOverlay = document.getElementById("friendsOverlay");
    const searchOverlay = document.getElementById("searchOverlay");
    const friendsList = document.getElementById("friendsList");
    const friendsSummary = document.getElementById("friendsSummary");
    const followersTabButton = document.getElementById("followersTabButton");
    const followingTabButton = document.getElementById("followingTabButton");
    const userSearchInput = document.getElementById("userSearchInput");
    const searchPanelSummary = document.getElementById("searchPanelSummary");
    const searchResultsList = document.getElementById("searchResultsList");
    const identityAvatar = document.getElementById("identityAvatar");
    const identityName = document.getElementById("identityName");
    const identitySummary = document.getElementById("identitySummary");
    const identityType = document.getElementById("identityType");
    const identityRole = document.getElementById("identityRole");
    const identityFollowers = document.getElementById("identityFollowers");
    const identityFollowing = document.getElementById("identityFollowing");
    const identityAccess = document.getElementById("identityAccess");
    const removeUserButton = document.getElementById("removeUserButton");
    const requestsOverlay = document.getElementById("requestsOverlay");
    const requestsList = document.getElementById("requestsList");
    let pendingDeleteId = null;
    let pendingEditId = null;
    let selectedIdentityUserId = null;
    let selectedSignupAvatarId = "avatar-01";
    let toastTimer = null;
    let activityRefreshTimer = null;
    let searchDebounceTimer = null;
    let loadPostsRequestId = 0;
    let conversations = [];
    let activeConversationUserId = null;
    let pendingChatDeleteUserId = null;
    let activeFriendsTab = "followers";

    const AVATAR_OPTIONS = [
      { id: "avatar-01", skin: "#f2c7a5", hair: "#2f1b12", shirt: "#1c7c7d", bg: "#fde68a" },
      { id: "avatar-02", skin: "#e8b894", hair: "#3b2f2f", shirt: "#2f5d8a", bg: "#bfdbfe" },
      { id: "avatar-03", skin: "#c98b62", hair: "#1f2937", shirt: "#b45309", bg: "#fed7aa" },
      { id: "avatar-04", skin: "#8d5524", hair: "#111827", shirt: "#7c3aed", bg: "#ddd6fe" },
      { id: "avatar-05", skin: "#f1c27d", hair: "#7c2d12", shirt: "#dc2626", bg: "#fecaca" },
      { id: "avatar-06", skin: "#ffdbac", hair: "#0f172a", shirt: "#0891b2", bg: "#bae6fd" },
      { id: "avatar-07", skin: "#d8a47f", hair: "#4c1d95", shirt: "#6d28d9", bg: "#e9d5ff" },
      { id: "avatar-08", skin: "#ad7d52", hair: "#14532d", shirt: "#16a34a", bg: "#bbf7d0" },
      { id: "avatar-09", skin: "#f3c9b1", hair: "#831843", shirt: "#ec4899", bg: "#fbcfe8" },
      { id: "avatar-10", skin: "#7f5539", hair: "#4338ca", shirt: "#2563eb", bg: "#c7d2fe" },
      { id: "avatar-11", skin: "#edc4a3", hair: "#854d0e", shirt: "#ca8a04", bg: "#fef08a" },
      { id: "avatar-12", skin: "#c68642", hair: "#166534", shirt: "#059669", bg: "#a7f3d0" },
      { id: "avatar-13", skin: "#6a422d", hair: "#7f1d1d", shirt: "#ef4444", bg: "#fecdd3" },
      { id: "avatar-14", skin: "#f0c8a0", hair: "#1e293b", shirt: "#334155", bg: "#e2e8f0" },
      { id: "avatar-15", skin: "#b97a56", hair: "#92400e", shirt: "#f97316", bg: "#fdba74" },
      { id: "avatar-16", skin: "#f5d0b5", hair: "#065f46", shirt: "#0f766e", bg: "#99f6e4" },
      { id: "avatar-17", skin: "#a47148", hair: "#312e81", shirt: "#4f46e5", bg: "#c4b5fd" },
      { id: "avatar-18", skin: "#ffdbac", hair: "#374151", shirt: "#111827", bg: "#d1d5db" },
      { id: "avatar-19", skin: "#8b5e3c", hair: "#365314", shirt: "#65a30d", bg: "#d9f99d" },
      { id: "avatar-20", skin: "#deb887", hair: "#be123c", shirt: "#e11d48", bg: "#fda4af" }
    ];

    function setAuthMessage(message, isSuccess) {
      authMessage.textContent = message || "";
      authMessage.classList.toggle("success", Boolean(isSuccess));
    }

    function setFieldValidation(element, text) {
      element.innerHTML = text ? `<strong>Check this field:</strong> ${text}` : "";
      element.classList.toggle("active", Boolean(text));
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }


    function getAuthHeaders(includeJson = false) {
      const headers = {};

      if (includeJson) {
        headers["Content-Type"] = "application/json";
      }

      if (token) {
        headers["Authorization"] = "Bearer " + token;
      }

      return headers;
    }

    function getSelectedAccountType() {
      const selected = document.querySelector('input[name="accountType"]:checked');
      return selected ? selected.value : "public";
    }

    function getAvatarConfig(avatarId) {
      return AVATAR_OPTIONS.find(option => option.id === avatarId) || AVATAR_OPTIONS[0];
    }

    function buildAvatarMarkup(avatarId) {
      const avatar = getAvatarConfig(avatarId);

      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Avatar">
          <rect width="128" height="128" rx="28" fill="${avatar.bg}"/>
          <circle cx="64" cy="48" r="28" fill="${avatar.skin}"/>
          <path d="M32 38c6-18 18-28 32-28s26 8 32 28v12H32V38Z" fill="${avatar.hair}"/>
          <circle cx="53" cy="49" r="3.5" fill="#1f2937"/>
          <circle cx="75" cy="49" r="3.5" fill="#1f2937"/>
          <path d="M56 63c4 4 12 4 16 0" stroke="#7c3f2a" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M24 120c4-26 22-38 40-38s36 12 40 38H24Z" fill="${avatar.shirt}"/>
        </svg>
      `.trim();
    }

    function avatarDataUri(avatarId) {
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildAvatarMarkup(avatarId))}`;
    }

    function setAvatarImage(element, avatarId) {
      if (!element) return;
      element.src = avatarDataUri(avatarId);
      element.alt = "Avatar";
    }

    function renderSignupAvatarPicker() {
      signupAvatarPicker.innerHTML = AVATAR_OPTIONS.map(option => `
        <button
          class="avatar-choice ${option.id === selectedSignupAvatarId ? "active" : ""}"
          type="button"
          onclick="selectSignupAvatar('${option.id}')"
          aria-label="Choose ${option.id}"
        >
          <img src="${avatarDataUri(option.id)}" alt="${option.id}">
        </button>
      `).join("");
    }

    function selectSignupAvatar(avatarId) {
      selectedSignupAvatarId = avatarId;
      renderSignupAvatarPicker();
    }

    function isAdminAccount(user) {
      return Boolean(user && user.email && String(user.email).toLowerCase() === ADMIN_EMAIL);
    }

    function getDashboardPathForUser(user) {
      return isAdminAccount(user) ? "admin.html" : "user.html";
    }

    function rememberDashboardPath(user) {
      sessionStorage.setItem("dashboardPath", getDashboardPathForUser(user));
    }

    function normalizeUser(user) {
      if (!user) return null;

      return {
        ...user,
        isAdmin: Boolean(user.isAdmin) || isAdminAccount(user)
      };
    }


    function canAdminRemoveUser(user) {
      return Boolean(
        currentUser?.isAdmin &&
        user &&
        !user.isAdmin &&
        String(user._id) !== String(currentUser._id)
      );
    }

    function canShowFollowControl(user) {
      return Boolean(
        token &&
        user &&
        !currentUser?.isAdmin &&
        !user.isAdmin &&
        !user.viewerContext?.isOwner &&
        (!currentUser || String(user._id) !== String(currentUser._id))
      );
    }

    function closeRequestsModal() {
      requestsOverlay.classList.remove("active");
    }

    function openWritersModal() {
      writersOverlay.classList.add("active");
    }

    function closeWritersModal() {
      writersOverlay.classList.remove("active");
    }

    function getFollowersList() {
      return allCreators.filter(user => Array.isArray(user.following) && user.following.includes(String(currentUser?._id)));
    }

    function getFollowingList() {
      const followingIds = new Set((currentUser?.following || []).map(id => String(id)));
      return allCreators.filter(user => followingIds.has(String(user._id)));
    }

    function renderFriendsModal() {
      if (!friendsList || !friendsSummary) return;

      const people = activeFriendsTab === "followers" ? getFollowersList() : getFollowingList();
      const totalFollowers = getFollowersList().length;
      const totalFollowing = getFollowingList().length;
      const activeLabel = activeFriendsTab === "followers" ? "followers" : "following";

      followersTabButton?.classList.toggle("active", activeFriendsTab === "followers");
      followingTabButton?.classList.toggle("active", activeFriendsTab === "following");

      friendsSummary.textContent = currentUser?.isAdmin
        ? `${totalFollowers} followers � ${totalFollowing} following � Creator mode keeps the same popup with full access across the platform.`
        : `${totalFollowers} followers � ${totalFollowing} following � Following stays one-way, so people do not need to follow you back.`;

      if (!people.length) {
        friendsList.innerHTML = `<div class="empty-state">No ${activeLabel} found yet.</div>`;
        return;
      }

      friendsList.innerHTML = people.map(user => `
        <div class="friend-card">
          <button class="friend-card-main" type="button" onclick="openIdentityModal('${user._id}')">
            <img class="author-icon" src="${avatarDataUri(user.avatarId)}" alt="${user.name}">
            <div class="friend-card-copy">
              <strong>${escapeHtml(user.name || "Unknown User")}</strong>
              <span>${escapeHtml(user.email || "No email available")}</span>
            </div>
          </button>
          <div class="friend-card-meta">
            <span class="privacy-badge ${user.accountType === "private" ? "private" : "public"}">${user.accountType === "private" ? "private" : "public"}</span>
            ${canShowFollowControl(user) ? `
              <button
                class="follow-btn ${user.viewerContext?.isFollowingAuthor ? "following" : user.viewerContext?.hasPendingRequest ? "requested" : ""}"
                onclick="toggleFollowAuthor('${user._id}', ${Boolean(user.viewerContext?.isFollowingAuthor)})"
              >
                ${user.viewerContext?.isFollowingAuthor ? "Following" : user.viewerContext?.hasPendingRequest ? "Requested" : user.accountType === "private" ? "Request" : "Follow"}
              </button>
            ` : currentUser?.isAdmin ? '<span class="privacy-badge admin">admin access</span>' : ""}
          </div>
        </div>
      `).join("");
    }

    function switchFriendsTab(tab) {
      activeFriendsTab = tab === "following" ? "following" : "followers";
      renderFriendsModal();
    }

    function openFriendsModal() {
      if (!token) {
        openAuthModal("login");
        return;
      }

      activeFriendsTab = "followers";
      renderFriendsModal();
      friendsOverlay?.classList.add("active");
    }

    function closeFriendsModal() {
      friendsOverlay?.classList.remove("active");
    }

    function renderSearchModal() {
      if (!searchResultsList || !searchPanelSummary) return;

      const query = String(userSearchInput?.value || "").trim().toLowerCase();
      const searchableUsers = allCreators.filter(user => !user.viewerContext?.isOwner);

      if (!query) {
        searchPanelSummary.textContent = `Search across ${searchableUsers.length} user${searchableUsers.length === 1 ? "" : "s"}.`;
        searchResultsList.innerHTML = '<div class="empty-state">Type a name or email to find someone.</div>';
        return;
      }

      const results = searchableUsers.filter(user => {
        const name = String(user.name || "").toLowerCase();
        const email = String(user.email || "").toLowerCase();
        return name.includes(query) || email.includes(query);
      });

      searchPanelSummary.textContent = `${results.length} result${results.length === 1 ? "" : "s"} for "${query}".`;

      if (!results.length) {
        searchResultsList.innerHTML = '<div class="empty-state">No users matched that search.</div>';
        return;
      }

      searchResultsList.innerHTML = results.map(user => `
        <div class="search-user-card">
          <button class="search-user-main" type="button" onclick="openIdentityModal('${user._id}')">
            <img class="author-icon" src="${avatarDataUri(user.avatarId)}" alt="${user.name}">
            <div class="search-user-copy">
              <strong>${escapeHtml(user.name || "Unknown User")}</strong>
              <span>${escapeHtml(user.email || "No email available")}</span>
            </div>
          </button>
          <div class="search-user-actions">
            <span class="privacy-badge ${user.accountType === "private" ? "private" : "public"}">${user.accountType === "private" ? "private" : "public"}</span>
            ${canShowFollowControl(user) ? `
              <button
                class="follow-btn ${user.viewerContext?.isFollowingAuthor ? "following" : user.viewerContext?.hasPendingRequest ? "requested" : ""}"
                onclick="toggleFollowAuthor('${user._id}', ${Boolean(user.viewerContext?.isFollowingAuthor)})"
              >
                ${user.viewerContext?.isFollowingAuthor ? "Following" : user.viewerContext?.hasPendingRequest ? "Requested" : user.accountType === "private" ? "Request" : "Follow"}
              </button>
            ` : currentUser?.isAdmin ? '<span class="privacy-badge admin">admin access</span>' : ""}
          </div>
        </div>
      `).join("");
    }

    function openSearchModal() {
      if (!token) {
        openAuthModal("login");
        return;
      }

      if (userSearchInput) {
        userSearchInput.value = "";
      }

      renderSearchModal();
      searchOverlay?.classList.add("active");
      userSearchInput?.focus();
    }

    function closeSearchModal() {
      searchOverlay?.classList.remove("active");
    }

    function openDeleteChatModal() {
      if (!token) {
        openAuthModal("login");
        return;
      }

      if (!activeConversationUserId) {
        showToast("Choose a conversation before deleting it.", "error");
        return;
      }

      const activeConversation = conversations.find(item => String(item.otherUser?._id) === String(activeConversationUserId));
      if (!activeConversation || !activeConversation._id) {
        showToast("There is no saved chat to delete yet.", "error");
        return;
      }

      pendingChatDeleteUserId = activeConversationUserId;
      if (chatDeleteMessage) {
        chatDeleteMessage.textContent = `This will permanently remove your conversation with ${activeConversation.otherUser?.name || "this friend"}.`;
      }
      chatDeleteOverlay?.classList.add("active");
    }

    function closeDeleteChatModal() {
      pendingChatDeleteUserId = null;
      chatDeleteOverlay?.classList.remove("active");
    }

    async function confirmDeleteChat() {
      if (!pendingChatDeleteUserId) {
        return;
      }

      const userIdToDelete = pendingChatDeleteUserId;
      closeDeleteChatModal();
      await deleteActiveConversation(userIdToDelete);
    }

    function openSocialHub() {
      if (!token) {
        openAuthModal("login");
        return;
      }

      socialOverlay?.classList.add("active");
      socialHub?.classList.add("spotlight");

      setTimeout(() => {
        socialHub?.classList.remove("spotlight");
      }, 1800);
    }

    function closeSocialHub() {
      socialOverlay?.classList.remove("active");
    }

    function getUserInitials(name) {
      return String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("") || "HU";
    }

    function formatAnnouncementDate(value) {
      if (!value) return "";
      return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }

    function closeIdentityModal() {
      selectedIdentityUserId = null;
      removeUserButton.classList.remove("active");
      identityOverlay.classList.remove("active");
    }

    function shouldDisplayProfileCard() {
      return Boolean(currentUser) && !suppressProfileCardOnReload;
    }

    async function showUnreadNotifications() {
      if (!currentUser?.notifications?.length) return;

      const unread = currentUser.notifications.filter(notification => !notification.read);

      unread.forEach(notification => {
        showToast(notification.message, "success");
      });

      if (unread.length > 0) {
        await fetch(`${API}/api/notifications/mark-read`, {
          method: "POST",
          headers: getAuthHeaders()
        });
      }
    }

    function renderPendingRequests() {
      const requests = currentUser?.pendingFollowRequests || [];

      if (requests.length === 0) {
        requestsList.innerHTML = '<div class="empty-state">No new follow requests right now.</div>';
        return;
      }

      requestsList.innerHTML = requests.map(request => `
        <div class="request-card">
          <div class="request-card-main">
            <img class="author-icon" src="${avatarDataUri(request.requester?.avatarId)}" alt="${request.requester?.name || "User"}">
            <div class="request-card-copy">
              <strong>${request.requester?.name || "Unknown User"}</strong>
              <span>${request.requester?.email || "No email available"}</span>
            </div>
          </div>
          <div class="request-actions">
            <button class="secondary-btn" type="button" onclick="rejectFollowRequest('${request.requester?._id}')">Ignore</button>
            <button class="primary" type="button" onclick="approveFollowRequest('${request.requester?._id}')">Accept</button>
          </div>
        </div>
      `).join("");
    }

    function showFollowRequestsIfNeeded() {
      const requests = currentUser?.pendingFollowRequests || [];

      if (requests.length === 0) {
        closeRequestsModal();
        return;
      }

      renderPendingRequests();
      requestsOverlay.classList.add("active");
    }

    function openIdentityModal(userId) {
      const identityUser = allCreators.find(user => String(user._id) === String(userId))
        || (currentUser && String(currentUser._id) === String(userId) ? currentUser : null);

      if (!identityUser) {
        showToast("We could not open this writer identity right now.", "error");
        return;
      }

      selectedIdentityUserId = identityUser._id;
      setAvatarImage(identityAvatar, identityUser.avatarId);
      identityAvatar.alt = `${identityUser.name || "Writer"} avatar`;
      identityName.textContent = identityUser.isAdmin
        ? `${identityUser.name} � Creator of Hearthline`
        : `${identityUser.name}'s identity`;
      identitySummary.textContent = identityUser.isAdmin
        ? `${identityUser.email || "No email available"} � Founder, creator, and full-access administrator of the Hearthline experience.`
        : identityUser.accountType === "private"
          ? `${identityUser.email || "No email available"} � This writer publishes inside a private circle. Their writing opens to followers.`
          : `${identityUser.email || "No email available"} � This writer publishes openly so anyone on Hearthline can discover their work.`;
      identityType.textContent = `${identityUser.accountType === "private" ? "Private" : "Public"} account`;
      identityType.className = `privacy-badge ${identityUser.accountType === "private" ? "private" : "public"}`;
      identityRole.textContent = identityUser.isAdmin
        ? "Creator"
        : currentUser && String(currentUser._id) === String(identityUser._id)
          ? "You"
          : "Writer";
      identityRole.className = `privacy-badge ${identityUser.isAdmin ? "admin" : "owner"}`;
      identityFollowers.textContent = String(identityUser.followersCount || 0);
      identityFollowing.textContent = String(identityUser.followingCount || 0);
      identityAccess.textContent = identityUser.isAdmin
        ? "Full"
        : identityUser.accountType === "private" ? "Follower" : "Open";
      removeUserButton.classList.toggle(
        "active",
        Boolean(currentUser?.isAdmin) &&
        !identityUser.isAdmin &&
        (!currentUser || String(currentUser._id) !== String(identityUser._id))
      );
      identityOverlay.classList.add("active");
    }

    function renderProfileCard() {
      if (!currentUser) {
        profileCard.classList.remove("active");
        creatorBanner.classList.remove("active");
        headerUserChip.classList.remove("active");
        adminCrown.classList.remove("active");
        document.body.classList.remove("admin-mode");
        return;
      }

      profileCard.classList.toggle("active", shouldDisplayProfileCard());
      creatorBanner.classList.toggle("active", Boolean(currentUser.isAdmin));
      headerUserChip.classList.add("active");
      adminCrown.classList.toggle("active", Boolean(currentUser.isAdmin));
      document.body.classList.toggle("admin-mode", Boolean(currentUser.isAdmin));
      setAvatarImage(headerUserAvatar, currentUser.avatarId);
      headerUserAvatar.alt = `${currentUser.name || "User"} avatar`;
      headerUserName.textContent = currentUser.name || "Hearthline user";
      headerUserType.textContent = currentUser.email || "No email available";
      profileTitle.textContent = currentUser.isAdmin
        ? `${currentUser.name}'s admin command center`
        : `${currentUser.name}'s profile`;
      profileDescription.textContent = currentUser.isAdmin
        ? "You are signed in as the platform administrator with unrestricted access to every profile, every post, and every private activity across the network."
        : currentUser.accountType === "private"
          ? "Your profile is private. Only followers can read your posts."
          : "Your profile is public. Everyone can discover and read your posts.";
      creatorBannerText.textContent = currentUser.isAdmin
        ? "Mayank, this is your creation space. As the creator of Hearthline, you can open every account, see every writer's activity, and manage every post without sending requests or following anyone."
        : "You are signed in as the creator of Hearthline with complete authority over the platform experience.";
      profileAccountType.textContent = currentUser.isAdmin
        ? "Admin"
        : currentUser.accountType === "private" ? "Private" : "Public";
      profileFollowersCount.textContent = String(currentUser.followersCount || 0);
      profileFollowingCount.textContent = String(currentUser.followingCount || 0);
    }

    function renderMembershipState() {
      const membership = currentUser?.membership || { tier: "free", label: "Free", boostCredits: 0 };
      const tierLabel = membership.label || "Free";
      const credits = Number(membership.boostCredits || 0);

      if (membershipBadge) membershipBadge.textContent = tierLabel;
      if (membershipTier) membershipTier.textContent = tierLabel;
      if (membershipCredits) membershipCredits.textContent = String(credits);
      if (membershipSummary) {
        membershipSummary.textContent = membership.tier === "free"
          ? "Upgrade your plan to unlock boost credits and push your best blog to the top of the community feed."
          : `Your ${tierLabel} plan is active. You currently have ${credits} boost credit${credits === 1 ? "" : "s"} left.`;
      }
    }

    function getChatEligibleCreators() {
      if (!currentUser) return [];

      return allCreators.filter(user =>
        String(user._id) !== String(currentUser._id) &&
        (user.viewerContext?.isFollowingAuthor || currentUser.following?.includes(String(user._id)) || currentUser.isAdmin)
      );
    }

    function getChatSidebarUsers() {
      const creatorMap = new Map();

      getChatEligibleCreators().forEach(user => {
        creatorMap.set(String(user._id), user);
      });

      conversations.forEach(conversation => {
        const otherUser = conversation?.otherUser;

        if (otherUser?._id && !creatorMap.has(String(otherUser._id))) {
          creatorMap.set(String(otherUser._id), otherUser);
        }
      });

      return Array.from(creatorMap.values());
    }

    function renderChatFriends() {
      if (!chatFriendsList) return;

      if (!token) {
        chatFriendsList.innerHTML = '<div class="empty-state">Sign in to open direct chats.</div>';
        return;
      }

      const searchQuery = String(chatSearchInput?.value || "").trim().toLowerCase();
      const eligibleCreators = getChatSidebarUsers().filter(user => {
        if (!searchQuery) return true;

        const name = String(user.name || "").toLowerCase();
        const email = String(user.email || "").toLowerCase();
        return name.includes(searchQuery) || email.includes(searchQuery);
      });

      if (!eligibleCreators.length) {
        chatFriendsList.innerHTML = searchQuery
          ? '<div class="empty-state">No chat match found for that search.</div>'
          : '<div class="empty-state">Follow a creator first, then you can chat here.</div>';
        return;
      }

      chatFriendsList.innerHTML = eligibleCreators.map(user => `
        <button class="chat-friend ${String(activeConversationUserId) === String(user._id) ? "active" : ""}" type="button" onclick="openConversation('${user._id}')">
          <img class="author-icon" src="${avatarDataUri(user.avatarId)}" alt="${user.name}">
          <span>${user.name}</span>
        </button>
      `).join("");
    }

    function renderActiveConversation() {
      if (!chatThread) return;
      if (chatPanelTitle) {
        chatPanelTitle.textContent = "Conversation";
      }

      if (!token) {
        chatThread.innerHTML = "Select a creator to open your conversation.";
        return;
      }

      if (!activeConversationUserId) {
        chatThread.innerHTML = "Select a creator to open your conversation.";
        return;
      }

      const conversation = conversations.find(item => String(item.otherUser?._id) === String(activeConversationUserId));

      if (!conversation) {
        chatThread.innerHTML = '<div class="empty-state">No messages yet. Start the conversation below.</div>';
        return;
      }

      if (chatPanelTitle) {
        chatPanelTitle.textContent = conversation.otherUser?.name
          ? `Chat with ${conversation.otherUser.name}`
          : "Conversation";
      }

      if (!conversation.messages?.length) {
        chatThread.innerHTML = '<div class="empty-state">No messages yet. Start the conversation below.</div>';
        return;
      }

      chatThread.innerHTML = conversation.messages.map(message => `
        <div class="chat-message ${String(message.sender?._id) === String(currentUser?._id) ? "mine" : ""}">
          <strong>${String(message.sender?._id) === String(currentUser?._id) ? "You" : escapeHtml(message.sender?.name || "Friend")}</strong>
          <p>${escapeHtml(message.text)}</p>
          <span>${formatAnnouncementDate(message.createdAt)}</span>
        </div>
      `).join("");

      chatThread.scrollTop = chatThread.scrollHeight;
    }

    async function loadConversations() {
      if (!token) {
        conversations = [];
        activeConversationUserId = null;
        renderChatFriends();
        renderActiveConversation();
        return;
      }

      try {
        const res = await fetch(`${API}/api/conversations`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        conversations = Array.isArray(data) ? data : [];
        if (!activeConversationUserId && conversations.length > 0) {
          activeConversationUserId = conversations[0].otherUser?._id || null;
        }
      } catch (error) {
        conversations = [];
      }

      renderChatFriends();
      renderActiveConversation();
    }

    async function openConversation(userId) {
      activeConversationUserId = userId;
      renderChatFriends();
      chatThread.innerHTML = "Loading conversation...";

      try {
        const res = await fetch(`${API}/api/conversations/${userId}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();

        if (!data.conversation) {
          chatThread.innerHTML = escapeHtml(data.message || "We could not open this chat.");
          return;
        }

        const existingIndex = conversations.findIndex(item => String(item.otherUser?._id) === String(userId));
        if (existingIndex === -1) {
          conversations.unshift(data.conversation);
        } else {
          conversations[existingIndex] = data.conversation;
        }
      } catch (error) {
        chatThread.innerHTML = "We could not open this chat right now.";
      }

      renderChatFriends();
      renderActiveConversation();
    }

    async function sendChatMessage(event) {
      event.preventDefault();

      if (!token) {
        openAuthModal("login");
        return;
      }

      if (!activeConversationUserId) {
        showToast("Choose a creator before sending a message.", "error");
        return;
      }

      const text = chatMessageInput.value.trim();

      if (!text) {
        showToast("Write a message before sending it.", "error");
        return;
      }

      const res = await fetch(`${API}/api/conversations/${activeConversationUserId}/messages`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ text })
      });
      const data = await res.json();

      if (!data.conversation) {
        showToast(data.message || "We could not send your message.", "error");
        return;
      }

      const existingIndex = conversations.findIndex(item => String(item.otherUser?._id) === String(activeConversationUserId));
      if (existingIndex === -1) {
        conversations.unshift(data.conversation);
      } else {
        conversations[existingIndex] = data.conversation;
      }

      chatMessageInput.value = "";
      renderChatFriends();
      renderActiveConversation();
      showToast(data.message || "Message sent.", "success");
    }

    async function deleteActiveConversation(userIdToDelete = activeConversationUserId) {
      if (!token) {
        openAuthModal("login");
        return;
      }

      if (!userIdToDelete) {
        showToast("Choose a conversation before deleting it.", "error");
        return;
      }

      const activeConversation = conversations.find(item => String(item.otherUser?._id) === String(userIdToDelete));
      if (!activeConversation || !activeConversation._id) {
        showToast("There is no saved chat to delete yet.", "error");
        return;
      }

      const res = await fetch(`${API}/api/conversations/${userIdToDelete}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "We could not delete this chat right now.", "error");
        return;
      }

      conversations = conversations.filter(item => String(item.otherUser?._id) !== String(userIdToDelete));
      if (String(activeConversationUserId) === String(userIdToDelete)) {
        activeConversationUserId = null;
      }
      renderChatFriends();
      renderActiveConversation();
      showToast(data.message || "Chat deleted.", "success");
    }

    async function subscribeMembership(tier) {
      if (!token) {
        openAuthModal("login");
        return;
      }

      const res = await fetch(`${API}/api/membership/subscribe`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ tier })
      });
      const data = await res.json();

      if (data.membership) {
        currentUser = {
          ...currentUser,
          membership: data.membership
        };
        renderMembershipState();
      }

      showToast(data.message || "Membership updated.", data.membership ? "success" : "error");
      await fetchCurrentUser();
      renderMembershipState();
    }

    async function loadAdminAnnouncement() {
  try {
    const res = await fetch(`${API}/api/admin-announcement`);
    const data = await res.json();
    const announcement = data.announcement;

    if (!announcement) {
      adminAnnouncement.classList.remove("active");
      return;
    }

    adminAnnouncementTitle.textContent = announcement.title || "";
    adminAnnouncementBody.textContent = announcement.content || "";
    adminAnnouncementMeta.textContent =
      `From ${announcement.author?.name || "Admin"}`;

    adminAnnouncement.classList.add("active");

  } catch (error) {
    console.error("Error loading announcement:", error);
    adminAnnouncement.classList.remove("active");
  }
}

    async function loadCreators() {
      try {
        const res = await fetch(`${API}/api/users`, {
          headers: getAuthHeaders()
        });
        const users = await res.json();

        if (!Array.isArray(users)) {
          creatorsList.innerHTML = "";
          return;
        }

        allCreators = users.map(normalizeUser);
        const visibleUsers = allCreators.filter(user => !user.viewerContext?.isOwner).slice(0, 8);
        renderChatFriends();
        renderFriendsModal();
        renderSearchModal();

        if (visibleUsers.length === 0) {
          creatorsList.innerHTML = '<div class="empty-state">No other writers are available yet.</div>';
          return;
        }

        creatorsList.innerHTML = visibleUsers.map(user => `
          <div class="creator-card">
            <div class="creator-card-main">
              <img class="author-icon" src="${avatarDataUri(user.avatarId)}" alt="${user.name}">
              <div class="creator-copy">
              <button class="author-link" type="button" onclick="openIdentityModal('${user._id}')">
                <strong>${user.name}</strong>
              </button>
              <span class="creator-email">${user.email || "No email available"}</span>
              </div>
            </div>
            ${token ? `
              ${canAdminRemoveUser(user) ? `
              <button
                class="danger inline-remove-btn"
                onclick="adminRemoveUser('${user._id}')"
              >
                Remove User
              </button>
              ` : ""}
              ${canShowFollowControl(user) ? `
              <button
                class="follow-btn ${user.viewerContext?.isFollowingAuthor ? "following" : user.viewerContext?.hasPendingRequest ? "requested" : ""}"
                onclick="toggleFollowAuthor('${user._id}', ${Boolean(user.viewerContext?.isFollowingAuthor)})"
              >
                ${user.viewerContext?.isFollowingAuthor ? "Following" : user.viewerContext?.hasPendingRequest ? "Requested" : user.accountType === "private" ? "Request" : "Follow"}
              </button>
              ` : currentUser?.isAdmin ? `<span class="privacy-badge admin">full access</span>` : ""}
            ` : ""}
          </div>
        `).join("");
      } catch (error) {
        creatorsList.innerHTML = '<div class="empty-state">We could not load writers right now.</div>';
      }
    }

    async function fetchCurrentUser() {
      if (!token) {
        currentUser = null;
        renderProfileCard();
        renderMembershipState();
        renderChatFriends();
        renderActiveConversation();
        if (currentPage !== "index.html") {
          window.location.replace("index.html");
        }
        return;
      }

      try {
        const res = await fetch(`${API}/api/me`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();

        if (data.user) {
          currentUser = normalizeUser(data.user);
          rememberDashboardPath(currentUser);
          const targetPage = getDashboardPathForUser(currentUser);

          if (currentPage === "index.html") {
            window.location.replace(targetPage);
            return;
          }

          if (currentPage !== targetPage) {
            window.location.replace(targetPage);
            return;
          }

          renderProfileCard();
          renderMembershipState();
          return;
        }
      } catch (error) {
      }

      currentUser = null;
      renderProfileCard();
      renderMembershipState();
    }

    async function refreshUserActivity() {
      if (!token) return;
      if (document.hidden) return;

      const previousPendingCount = currentUser?.pendingFollowRequests?.length || 0;
      const previousUnreadCount = currentUser?.notifications?.filter(notification => !notification.read).length || 0;

      await fetchCurrentUser();

      const nextPendingCount = currentUser?.pendingFollowRequests?.length || 0;
      const nextUnreadCount = currentUser?.notifications?.filter(notification => !notification.read).length || 0;

      if (nextUnreadCount > 0) {
        await showUnreadNotifications();
      }

      if (nextPendingCount > 0) {
        showFollowRequestsIfNeeded();
      }

      if (previousPendingCount !== nextPendingCount || previousUnreadCount !== nextUnreadCount) {
        loadCreators();
        loadPosts();
      }
    }

    function startActivityRefresh() {
      if (activityRefreshTimer) {
        clearInterval(activityRefreshTimer);
      }

      if (!token) {
        activityRefreshTimer = null;
        return;
      }

      activityRefreshTimer = setInterval(() => {
        refreshUserActivity();
      }, 20000);
    }

    function switchAuth(mode) {
      document.getElementById("loginForm").classList.toggle("active", mode === "login");
      document.getElementById("signupForm").classList.toggle("active", mode === "signup");
      document.getElementById("loginTab").classList.toggle("active", mode === "login");
      document.getElementById("signupTab").classList.toggle("active", mode === "signup");
      setFieldValidation(modalLoginValidation, "");
      setFieldValidation(modalSignupValidation, "");
      setAuthMessage("");
    }

    function setAuthOverlayMode(mode) {
      authOverlay.classList.remove("login-only", "signup-only");
      if (mode === "login" || mode === "signup") {
        authOverlay.classList.add(`${mode}-only`);
      }
    }

    function goToSignupPage() {
      window.location.href = "signup.html";
    }

    function goToCreateArticlePage() {
      if (!token) {
        openAuthModal("login");
        return;
      }

      window.location.href = "create-article.html";
    }

    function openAuthModal(mode) {
      if (mode === "signup") {
        goToSignupPage();
        return;
      }
      authDismissed = false;
      sessionStorage.removeItem("authDismissed");
      setAuthOverlayMode(mode);
      switchAuth(mode);
      updateAuthUI();
    }

    function updateModalPasswordGuide(value) {
      modalPasswordGuide.classList.toggle("active", value.length > 0);
      const rules = {
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[^A-Za-z0-9]/.test(value)
      };

      document.querySelectorAll("#modalPasswordGuide .password-rule").forEach(rule => {
        rule.classList.toggle("valid", Boolean(rules[rule.dataset.rule]));
      });

      return Object.values(rules).every(Boolean);
    }

    function togglePasswordVisibility(inputId, buttonId) {
      const input = document.getElementById(inputId);
      const button = document.getElementById(buttonId);
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "Hide" : "Show";
    }

    function closeDeleteModal() {
      pendingDeleteId = null;
      deleteOverlay.classList.remove("active");
    }

    function closeEditModal() {
      pendingEditId = null;
      editTitleInput.value = "";
      editContentInput.value = "";
      editOverlay.classList.remove("active");
    }

    function showToast(message, type = "success") {
      const normalizedMessage = String(message || "").toLowerCase();
      let toastMeta;

      if (type === "error") {
        toastMeta = { title: "Check This", icon: "NOTE" };
      } else if (normalizedMessage.includes("follow request")) {
        toastMeta = { title: "Private Circle", icon: "SYNC" };
      } else if (normalizedMessage.includes("following")) {
        toastMeta = { title: "Connection Made", icon: "LINK" };
      } else if (normalizedMessage.includes("unfollow")) {
        toastMeta = { title: "Connection Updated", icon: "MOVE" };
      } else if (normalizedMessage.includes("deleted")) {
        toastMeta = { title: "Removed Cleanly", icon: "DONE" };
      } else if (normalizedMessage.includes("updated")) {
        toastMeta = { title: "Saved Smoothly", icon: "SAVE" };
      } else if (normalizedMessage.includes("published")) {
        toastMeta = { title: "Story Shared", icon: "POST" };
      } else {
        toastMeta = { title: "All Set", icon: "OK" };
      }

      toastTitle.textContent = toastMeta.title;
      toastBody.textContent = message || "";
      toastIcon.textContent = toastMeta.icon;
      toastMessage.classList.remove("success", "error", "active");
      toastMessage.classList.add(type);

      if (toastTimer) {
        clearTimeout(toastTimer);
      }

      requestAnimationFrame(() => {
        toastMessage.classList.add("active");
      });

      toastTimer = setTimeout(() => {
        toastMessage.classList.remove("active");
      }, 2600);
    }

    function updateAuthUI() {
      const isLoggedIn = Boolean(token);
      const showAuthOverlay = !isLoggedIn && !authDismissed;

      document.body.classList.toggle("is-authenticated", isLoggedIn);
      appShell.classList.toggle("locked", showAuthOverlay);
      authOverlay.classList.toggle("active", showAuthOverlay);
      editorBox.style.display = isLoggedIn && Boolean(currentUser?.isAdmin) ? "block" : "none";
      profileCard.classList.toggle("active", isLoggedIn && shouldDisplayProfileCard());
      headerUserChip.classList.toggle("active", isLoggedIn && Boolean(currentUser));
      logoutButton.style.display = isLoggedIn ? "inline-block" : "none";
      headerCreateButton.classList.toggle("active", isLoggedIn);
      headerLoginButton.style.display = isLoggedIn ? "none" : "inline-block";
      headerSignupButton.style.display = isLoggedIn ? "none" : "inline-block";
    }

    function exitToHome() {
      authDismissed = true;
      sessionStorage.setItem("authDismissed", "true");
      setAuthOverlayMode("");
      switchAuth("login");
      setAuthMessage("");
      updateAuthUI();
      loadPosts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function escapeForTemplate(value) {
      return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\${/g, "\\${");
    }

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function formatFeedDate(value) {
      if (!value) return "";
      return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }

    function getFilteredPosts() {
      const query = String(postSearchInput?.value || "").trim().toLowerCase();
      const filterMode = feedFilterSelect?.value || "all";

      return allWorkspacePosts.filter(post => {
        if (post.kind === "announcement") return false;

        const title = String(post.title || "").toLowerCase();
        const excerpt = String(post.excerpt || post.content || "").toLowerCase();
        const authorName = String(post.userId?.name || "").toLowerCase();
        const matchesQuery = !query || title.includes(query) || excerpt.includes(query) || authorName.includes(query);

        if (!matchesQuery) {
          return false;
        }

        if (filterMode === "mine") {
          return Boolean(post.viewerContext?.isOwner);
        }

        if (filterMode === "following") {
          return post.status === "published" && Boolean(post.viewerContext?.isFollowingAuthor);
        }

        if (filterMode === "saved") {
          return Boolean(post.viewerContext?.hasBookmarked);
        }

        if (filterMode === "liked") {
          return Boolean(post.viewerContext?.hasLiked);
        }

        if (filterMode === "draft") {
          return post.status === "draft";
        }

        if (filterMode === "boosted") {
          return Boolean(post.boost?.isActive);
        }

        return true;
      });
    }

    function renderFeedSummary(posts) {
      if (!feedResultsSummary) return;

      const publishedCount = posts.filter(post => post.status !== "draft").length;
      const draftCount = posts.filter(post => post.status === "draft").length;
      const bookmarkedCount = posts.filter(post => post.viewerContext?.hasBookmarked).length;
      const boostedCount = posts.filter(post => post.boost?.isActive).length;

      feedResultsSummary.textContent = `${posts.length} result${posts.length === 1 ? "" : "s"} � ${publishedCount} published � ${draftCount} drafts � ${bookmarkedCount} bookmarked � ${boostedCount} boosted`;
    }

    function updatePostInWorkspace(updatedPost) {
      if (!updatedPost?._id) return false;

      const targetId = String(updatedPost._id);
      const existingIndex = allWorkspacePosts.findIndex(post => String(post._id) === targetId);

      if (existingIndex === -1) {
        return false;
      }

      allWorkspacePosts[existingIndex] = updatedPost;
      return true;
    }

    function renderFeedFromState() {
      const visiblePostsData = getFilteredPosts();
      renderFeedSummary(visiblePostsData);

      if (!postsContainer) return;

      if (visiblePostsData.length === 0) {
        postsContainer.innerHTML = '<div class="empty-state">No stories match this view yet. Try another filter or create a new article.</div>';
        return;
      }

      const ownedPosts = visiblePostsData.filter(post => Boolean(post.viewerContext?.isOwner));
      const communityPosts = visiblePostsData.filter(post => !post.viewerContext?.isOwner);

      let output = "";

      if (ownedPosts.length) {
        output += renderPostSection(
          "My Blogs",
          "Your own blogs stay here so you can manage, review, and reopen them quickly.",
          ownedPosts,
          "feed-section-owned"
        );
      }

      if (communityPosts.length) {
        output += renderPostSection(
          ownedPosts.length ? "Community Stories" : "Story Feed",
          ownedPosts.length
            ? "Everything from other writers stays here in the regular feed."
            : "Stories from across your workspace appear here.",
          communityPosts
        );
      }

      postsContainer.innerHTML = output;
    }

    function renderPostCard(post) {
      const contentPreview = escapeHtml(post.excerpt || post.content || "No content available.");
      const wordCount = String(post.content || "").trim().split(/\s+/).filter(Boolean).length;
      const authorId = post.userId?._id || post.userId;
      const isAdmin = Boolean(currentUser?.isAdmin) || Boolean(post.viewerContext?.isAdmin) || isAdminAccount(currentUser);
      const isOwner = Boolean(post.viewerContext?.isOwner) || (
        currentUser && String(authorId) === String(currentUser._id)
      );
      const isFollowingAuthor = Boolean(post.viewerContext?.isFollowingAuthor);
      const hasPendingRequest = Boolean(post.viewerContext?.hasPendingRequest);
      const accountType = post.userId?.accountType || "public";
      const canManagePost = isOwner || isAdmin;
      const storyStatus = post.status === "draft" ? "draft" : "published";
      const followButton = canShowFollowControl(post.userId) ? `
        <button
          class="follow-btn ${isFollowingAuthor ? "following" : hasPendingRequest ? "requested" : ""}"
          onclick="toggleFollowAuthor('${post.userId._id}', ${isFollowingAuthor})"
        >
          ${isFollowingAuthor ? "Following" : hasPendingRequest ? "Requested" : accountType === "private" ? "Request" : "Follow"}
        </button>
      ` : isAdmin && !isOwner ? '<span class="privacy-badge admin">full access</span>' : "";

      if (isOwner) {
        return `
          <div class="post post-owned">
            <div class="post-body">
              <div class="post-topline">
                <div class="author-actions">
                  <span class="post-label">Your Story</span>
                  <span class="privacy-badge ${storyStatus === "draft" ? "owner" : accountType}">${storyStatus}</span>
                  <span class="privacy-badge owner">signature post</span>
                  ${post.boost?.isActive ? '<span class="privacy-badge admin">boosted</span>' : ""}
                  ${isAdmin ? '<span class="privacy-badge admin">admin control</span>' : ""}
                </div>
                <div class="author-actions">
                  <button class="author-link" type="button" onclick="openIdentityModal('${post.userId?._id}')">
                    <img class="author-icon" src="${avatarDataUri(post.userId?.avatarId)}" alt="${post.userId?.name || "Unknown Author"}">
                    <span class="post-author">By ${post.userId?.name || "Unknown Author"} � ${post.userId?.email || "No email available"}</span>
                  </button>
                </div>
              </div>
              <h2>${post.title || "Untitled Article"}</h2>
              <p>${contentPreview}</p>
              <div class="post-footer">
                <span class="post-meta">${wordCount} word${wordCount === 1 ? "" : "s"} � ${post.likesCount || 0} likes � ${post.commentsCount || 0} comments � ${formatFeedDate(post.updatedAt || post.createdAt)}</span>
                <div class="post-actions">
                  <button class="ghost-btn" type="button" onclick="togglePostLike('${post._id}')">${post.viewerContext?.hasLiked ? "Unlike" : "Like"}</button>
                  <button class="ghost-btn" type="button" onclick="togglePostBookmark('${post._id}')">${post.viewerContext?.hasBookmarked ? "Saved" : "Save"}</button>
                  <button class="primary" type="button" onclick="openPostPage('${post._id}')">${post.status === "draft" ? "Open Draft" : "Read Story"}</button>
                  <button class="ghost-btn boost-btn" type="button" onclick="boostPost('${post._id}')">${post.boost?.isActive ? "Boosted" : "Boost"}</button>
                </div>
                ${canManagePost ? `
                <div class="post-actions">
                  <button class="primary" onclick="goToEditArticlePage('${post._id}')">Edit</button>
                  <button class="danger" onclick="deletePost('${post._id}')">Delete</button>
                  ${canAdminRemoveUser(post.userId) ? `
                  <button class="danger inline-remove-btn" onclick="adminRemoveUser('${post.userId._id}')">Remove User</button>
                  ` : ""}
                </div>
                ` : ""}
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="post">
          <div class="post-body">
            <div class="post-topline">
              <div class="author-actions">
                <span class="post-label">Published Story</span>
                <span class="privacy-badge ${storyStatus === "draft" ? "owner" : accountType}">${storyStatus}</span>
                <span class="privacy-badge ${accountType}">${accountType} account</span>
                ${post.boost?.isActive ? '<span class="privacy-badge admin">boosted</span>' : ""}
                ${isAdmin ? '<span class="privacy-badge admin">admin control</span>' : ""}
              </div>
              <div class="author-actions">
                <button class="author-link" type="button" onclick="openIdentityModal('${post.userId?._id}')">
                  <img class="author-icon" src="${avatarDataUri(post.userId?.avatarId)}" alt="${post.userId?.name || "Unknown Author"}">
                  <span class="post-author">By ${post.userId?.name || "Unknown Author"} � ${post.userId?.email || "No email available"}</span>
                </button>
                ${followButton}
              </div>
            </div>
            <h2>${post.title || "Untitled Article"}</h2>
            <p>${contentPreview}</p>
            <div class="post-footer">
              <span class="post-meta">${wordCount} word${wordCount === 1 ? "" : "s"} � ${post.likesCount || 0} likes � ${post.commentsCount || 0} comments � ${formatFeedDate(post.updatedAt || post.createdAt)}</span>
              <div class="post-actions">
                <button class="ghost-btn" type="button" onclick="togglePostLike('${post._id}')">${post.viewerContext?.hasLiked ? "Unlike" : "Like"}</button>
                <button class="ghost-btn" type="button" onclick="togglePostBookmark('${post._id}')">${post.viewerContext?.hasBookmarked ? "Saved" : "Save"}</button>
                <button class="primary" type="button" onclick="openPostPage('${post._id}')">${post.status === "draft" ? "Open Draft" : "Read Story"}</button>
                ${isOwner ? `<button class="ghost-btn boost-btn" type="button" onclick="boostPost('${post._id}')">${post.boost?.isActive ? "Boosted" : "Boost"}</button>` : ""}
              </div>
              ${canManagePost ? `
              <div class="post-actions">
                <button class="primary" onclick="goToEditArticlePage('${post._id}')">Edit</button>
                <button class="danger" onclick="deletePost('${post._id}')">Delete</button>
                ${canAdminRemoveUser(post.userId) ? `
                <button class="danger inline-remove-btn" onclick="adminRemoveUser('${post.userId._id}')">Remove User</button>
                ` : ""}
              </div>
              ` : ""}
            </div>
          </div>
        </div>
      `;
    }

    function renderPostSection(title, description, posts, sectionClass = "") {
      if (!posts.length) return "";

      return `
        <section class="feed-section ${sectionClass}">
          <div class="feed-section-head">
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
          <div class="posts-shell">
            ${posts.map(renderPostCard).join("")}
          </div>
        </section>
      `;
    }

    async function loadPosts() {
      if (!token && !authDismissed) {
        updateAuthUI();
        return;
      }

      const requestId = ++loadPostsRequestId;

     try {
  const res = await fetch(
    `${API}/api/posts?sort=${encodeURIComponent(feedSortSelect?.value || "recent")}`,
    {
      headers: getAuthHeaders()
    }
  );

  const data = await res.json();

  if (requestId !== loadPostsRequestId) {
    return;
  }

  const receivedPosts = Array.isArray(data) ? data : data.posts;
  allWorkspacePosts = Array.isArray(receivedPosts)
    ? receivedPosts.filter(post => post.kind !== "announcement" || currentUser?.isAdmin)
    : [];

  renderFeedFromState();

} catch (err) {
  if (requestId !== loadPostsRequestId) return;

  if (feedResultsSummary) {
    feedResultsSummary.textContent =
      "We could not load the story workspace right now.";
  }
  if (postsContainer) {
          postsContainer.innerHTML = '<div class="empty-state">We could not load your articles right now. Please try again in a moment.</div>';
        }
      }
    }
    

    function openPostPage(postId) {
      const selectedPost = allWorkspacePosts.find(post => String(post._id) === String(postId));

      if (selectedPost) {
        sessionStorage.setItem("activePost", JSON.stringify(selectedPost));
      } else {
        sessionStorage.removeItem("activePost");
      }

      window.location.href = `post.html?id=${postId}`;
    }

    function goToEditArticlePage(postId) {
      window.location.href = `create-article.html?id=${postId}`;
    }

    async function togglePostLike(postId) {
      if (!token) {
        openAuthModal("login");
        return;
      }

      const res = await fetch(`${API}/api/posts/${postId}/toggle-like`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      showToast(data.message || "Story updated.", "success");
      if (updatePostInWorkspace(data.post)) {
        renderFeedFromState();
        return;
      }
      loadPosts();
    }

    async function togglePostBookmark(postId) {
      if (!token) {
        openAuthModal("login");
        return;
      }

      const res = await fetch(`${API}/api/posts/${postId}/toggle-bookmark`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      showToast(data.message || "Bookmark updated.", "success");
      if (updatePostInWorkspace(data.post)) {
        renderFeedFromState();
        return;
      }
      loadPosts();
    }

    async function boostPost(postId) {
      if (!token) {
        openAuthModal("login");
        return;
      }

      const res = await fetch(`${API}/api/posts/${postId}/boost`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (data.membership) {
        currentUser = {
          ...currentUser,
          membership: data.membership
        };
        renderMembershipState();
      }

      showToast(data.message || "Boost updated.", data.post ? "success" : "error");
      if (updatePostInWorkspace(data.post)) {
        renderFeedFromState();
      } else {
        loadPosts();
      }
    }

    function handleLogin(event) {
      event.preventDefault();
      login();
    }

    function handleSignup(event) {
      event.preventDefault();
      signup();
    }

    function handleCreatePost(event) {
      event.preventDefault();
      sendAdminNotification();
    }

    async function login() {
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      setFieldValidation(modalLoginValidation, "");

      if (!isValidEmail(email)) {
        setFieldValidation(modalLoginValidation, "Enter a valid email address in the format name@example.com.");
        return;
      }

      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.token) {
        token = data.token;
        sessionStorage.setItem("token", token);
        currentUser = normalizeUser(data.user || { email });
        rememberDashboardPath(currentUser);
        suppressProfileCardOnReload = false;
        authDismissed = false;
        sessionStorage.removeItem("authDismissed");
        setAuthMessage("Signed in successfully.", true);
        window.location.replace(getDashboardPathForUser(currentUser));
        return;
      }

      setAuthMessage(data.message || "Unable to sign in. Please check your details and try again.");
    }

    async function signup() {
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      const accountType = getSelectedAccountType();
      const avatarId = selectedSignupAvatarId;

      setFieldValidation(modalSignupValidation, "");

      if (!isValidEmail(email)) {
        setFieldValidation(modalSignupValidation, "Enter a valid email address.");
        return;
      }

      if (!updateModalPasswordGuide(password)) {
        setAuthMessage("Please create a stronger password using uppercase, lowercase, numeric, and special characters.");
        return;
      }

      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, accountType, avatarId })
      });

      const data = await res.json();
      const success = data.message && (
        data.message.toLowerCase().includes("success") ||
        data.message.toLowerCase().includes("created")
      );
      setAuthMessage(data.message || "We could not create your account. Please try again.", success);

      if (success) {
        switchAuth("login");
        document.getElementById("loginEmail").value = email;
        setAuthMessage(data.message, true);
      }
    }

    modalSignupPassword.addEventListener("input", event => {
      updateModalPasswordGuide(event.target.value);
    });

    if (postSearchInput) {
      postSearchInput.addEventListener("input", () => {
        if (searchDebounceTimer) {
          clearTimeout(searchDebounceTimer);
        }
        searchDebounceTimer = setTimeout(() => {
          renderFeedFromState();
        }, 180);
      });
    }

    if (feedFilterSelect) {
      feedFilterSelect.addEventListener("change", () => {
        renderFeedFromState();
      });
    }

    if (feedSortSelect) {
      feedSortSelect.addEventListener("change", () => {
        loadPosts();
      });
    }

    if (chatSearchInput) {
      chatSearchInput.addEventListener("input", () => {
        renderChatFriends();
      });
    }

    if (userSearchInput) {
      userSearchInput.addEventListener("input", () => {
        renderSearchModal();
      });
    }

    async function sendAdminNotification() {
      if (!currentUser?.isAdmin) {
        showToast("Only the admin can send a top notification.", "error");
        return;
      }

      const content = adminNoticeText.value.trim();

      if (!content) {
        showToast("Please write a notification before sending it.", "error");
        return;
      }

      const res = await fetch(`${API}/api/create-post`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ title: "Message from admin", content, status: "published", kind: "announcement" })
      });

      const data = await res.json();
      showToast(data.message || "Admin notification sent.", "success");

      adminNoticeText.value = "";
      await loadAdminAnnouncement();
      loadPosts();
    }

    async function deletePost(id) {
      pendingDeleteId = id;
      deleteOverlay.classList.add("active");
    }

    async function confirmDelete() {
      if (!pendingDeleteId) return;

      const res = await fetch(`${API}/api/delete-post/${pendingDeleteId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      const data = await res.json();
      closeDeleteModal();
      showToast(data.message || "Post deleted.", "success");
      loadPosts();
    }

    async function editPost(id, oldTitle, oldContent) {
      pendingEditId = id;
      editTitleInput.value = oldTitle;
      editContentInput.value = oldContent;
      editOverlay.classList.add("active");
      editTitleInput.focus();
    }

    async function saveEditedPost() {
      const newTitle = editTitleInput.value.trim();
      const newContent = editContentInput.value.trim();

      if (!newTitle || !newContent) return;

      const res = await fetch(`${API}/api/update-post/${pendingEditId}`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ title: newTitle, content: newContent })
      });

      const data = await res.json();
      closeEditModal();
      showToast(data.message || "Post updated.", "success");
      await fetchCurrentUser();
      loadPosts();
    }

    async function toggleFollowAuthor(userId, isFollowing) {
      const endpoint = isFollowing ? "unfollow" : "follow";
      const res = await fetch(`${API}/api/${endpoint}/${userId}`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      showToast(
        data.message || (isFollowing ? "Writer unfollowed." : "Writer followed."),
        "success"
      );
      await fetchCurrentUser();
      showFollowRequestsIfNeeded();
      loadCreators();
      loadPosts();
      loadConversations();
    }

    async function approveFollowRequest(requesterId) {
      const res = await fetch(`${API}/api/follow-request/${requesterId}/approve`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      showToast(data.message || "Follow request approved.", "success");
      await fetchCurrentUser();
      showFollowRequestsIfNeeded();
      loadCreators();
      loadPosts();
      loadConversations();
    }

    async function rejectFollowRequest(requesterId) {
      const res = await fetch(`${API}/api/follow-request/${requesterId}/reject`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      showToast(data.message || "Follow request ignored.", "success");
      await fetchCurrentUser();
      showFollowRequestsIfNeeded();
      loadCreators();
      loadPosts();
      loadConversations();
    }

    async function removeSelectedUser() {
      if (!selectedIdentityUserId || !currentUser?.isAdmin) return;

      const res = await fetch(`${API}/api/admin/remove-user/${selectedIdentityUserId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      closeIdentityModal();
      showToast(data.message || "User removed.", data.message && data.message.toLowerCase().includes("removed") ? "success" : "error");
      await fetchCurrentUser();
      loadCreators();
      loadPosts();
    }

    async function adminRemoveUser(userId) {
      if (!currentUser?.isAdmin || !userId) return;

      const res = await fetch(`${API}/api/admin/remove-user/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      showToast(
        data.message || "User removed.",
        data.message && data.message.toLowerCase().includes("removed") ? "success" : "error"
      );
      closeIdentityModal();
      await fetchCurrentUser();
      loadCreators();
      loadPosts();
    }

    confirmDeleteButton.addEventListener("click", confirmDelete);
    saveEditButton.addEventListener("click", saveEditedPost);
    removeUserButton.addEventListener("click", removeSelectedUser);

    [deleteOverlay, editOverlay].forEach(overlay => {
      overlay.addEventListener("click", event => {
        if (event.target !== overlay) return;
        if (overlay === deleteOverlay) closeDeleteModal();
        if (overlay === editOverlay) closeEditModal();
      });
    });

    identityOverlay.addEventListener("click", event => {
      if (event.target === identityOverlay) {
        closeIdentityModal();
      }
    });

    requestsOverlay.addEventListener("click", event => {
      if (event.target === requestsOverlay) {
        closeRequestsModal();
      }
    });

    writersOverlay.addEventListener("click", event => {
      if (event.target === writersOverlay) {
        closeWritersModal();
      }
    });

    socialOverlay.addEventListener("click", event => {
      if (event.target === socialOverlay) {
        closeSocialHub();
      }
    });

    friendsOverlay.addEventListener("click", event => {
      if (event.target === friendsOverlay) {
        closeFriendsModal();
      }
    });

    searchOverlay.addEventListener("click", event => {
      if (event.target === searchOverlay) {
        closeSearchModal();
      }
    });

    chatDeleteOverlay?.addEventListener("click", event => {
      if (event.target === chatDeleteOverlay) {
        closeDeleteChatModal();
      }
    });


    function logout() {
      if (activityRefreshTimer) {
        clearInterval(activityRefreshTimer);
        activityRefreshTimer = null;
      }
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("dashboardPath");
      token = null;
      currentUser = null;
      authDismissed = true;
      sessionStorage.setItem("authDismissed", "true");
      document.getElementById("loginEmail").value = "";
      document.getElementById("loginPassword").value = "";
      document.getElementById("signupName").value = "";
      document.getElementById("signupEmail").value = "";
      document.getElementById("signupPassword").value = "";
      document.getElementById("accountTypePublic").checked = true;
      selectedSignupAvatarId = "avatar-01";
      renderSignupAvatarPicker();
      renderProfileCard();
      renderMembershipState();
      conversations = [];
      activeConversationUserId = null;
      renderChatFriends();
      renderActiveConversation();
      closeIdentityModal();
      closeFriendsModal();
      closeSearchModal();
      closeSocialHub();
      setAuthOverlayMode("");
      updateAuthUI();
      switchAuth("login");
      setAuthMessage("You have been signed out.", true);
      window.location.replace("index.html");
    }

async function initializeApp() {
  renderSignupAvatarPicker();
  switchAuth("login");
  updateAuthUI();
  await fetchCurrentUser();
  updateAuthUI();
  showUnreadNotifications();
  showFollowRequestsIfNeeded();
  loadAdminAnnouncement();
  loadCreators();
  loadPosts();   // ✅ ONLY ONE CALL HERE
  startActivityRefresh();
  loadConversations();
}

document.addEventListener("DOMContentLoaded", initializeApp);
