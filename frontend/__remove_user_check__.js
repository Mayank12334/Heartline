
    const API = "http://localhost:3000";
    const ADMIN_EMAIL = "mayanksharma7012@gmail.com";
    let token = localStorage.getItem("token");
    let currentUser = null;
    let allCreators = [];
    let authDismissed = sessionStorage.getItem("authDismissed") === "true" || !token;

    const appShell = document.getElementById("appShell");
    const authOverlay = document.getElementById("authOverlay");
    const authMessage = document.getElementById("authMessage");
    const editorBox = document.getElementById("editorBox");
    const logoutButton = document.getElementById("logoutButton");
    const headerLoginButton = document.getElementById("headerLoginButton");
    const headerSignupButton = document.getElementById("headerSignupButton");
    const adminCrown = document.getElementById("adminCrown");
    const headerUserChip = document.getElementById("headerUserChip");
    const headerUserAvatar = document.getElementById("headerUserAvatar");
    const headerUserName = document.getElementById("headerUserName");
    const headerUserType = document.getElementById("headerUserType");
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
    const profileTitle = document.getElementById("profileTitle");
    const profileDescription = document.getElementById("profileDescription");
    const profileAccountType = document.getElementById("profileAccountType");
    const profileFollowersCount = document.getElementById("profileFollowersCount");
    const profileFollowingCount = document.getElementById("profileFollowingCount");
    const creatorsList = document.getElementById("creatorsList");
    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = document.getElementById("toastIcon");
    const toastTitle = document.getElementById("toastTitle");
    const toastBody = document.getElementById("toastBody");
    const identityOverlay = document.getElementById("identityOverlay");
    const identityAvatar = document.getElementById("identityAvatar");
    const identityName = document.getElementById("identityName");
    const identitySummary = document.getElementById("identitySummary");
    const identityType = document.getElementById("identityType");
    const identityRole = document.getElementById("identityRole");
    const identityFollowers = document.getElementById("identityFollowers");
    const identityFollowing = document.getElementById("identityFollowing");
    const identityAccess = document.getElementById("identityAccess");
    const removeUserButton = document.getElementById("removeUserButton");
    let pendingDeleteId = null;
    let pendingEditId = null;
    let selectedIdentityUserId = null;
    let toastTimer = null;

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

    function isAdminAccount(user) {
      return Boolean(user && user.email && String(user.email).toLowerCase() === ADMIN_EMAIL);
    }

    function normalizeUser(user) {
      if (!user) return null;

      return {
        ...user,
        isAdmin: Boolean(user.isAdmin) || isAdminAccount(user)
      };
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

    function closeIdentityModal() {
      selectedIdentityUserId = null;
      removeUserButton.classList.remove("active");
      identityOverlay.classList.remove("active");
    }

    function openIdentityModal(userId) {
      const identityUser = allCreators.find(user => String(user._id) === String(userId))
        || (currentUser && String(currentUser._id) === String(userId) ? currentUser : null);

      if (!identityUser) {
        showToast("We could not open this writer identity right now.", "error");
        return;
      }

      selectedIdentityUserId = identityUser._id;
      identityAvatar.textContent = getUserInitials(identityUser.name);
      identityName.textContent = identityUser.isAdmin
        ? `${identityUser.name} • Creator of Hearthline`
        : `${identityUser.name}'s identity`;
      identitySummary.textContent = identityUser.isAdmin
        ? `${identityUser.email || "No email available"} • Founder, creator, and full-access administrator of the Hearthline experience.`
        : identityUser.accountType === "private"
          ? `${identityUser.email || "No email available"} • This writer publishes inside a private circle. Their writing opens to followers.`
          : `${identityUser.email || "No email available"} • This writer publishes openly so anyone on Hearthline can discover their work.`;
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

      profileCard.classList.add("active");
      creatorBanner.classList.toggle("active", Boolean(currentUser.isAdmin));
      headerUserChip.classList.add("active");
      adminCrown.classList.toggle("active", Boolean(currentUser.isAdmin));
      document.body.classList.toggle("admin-mode", Boolean(currentUser.isAdmin));
      headerUserAvatar.textContent = getUserInitials(currentUser.name);
      headerUserName.textContent = currentUser.name || "Hearthline user";
      headerUserType.textContent = currentUser.email || "No email available";
      profileTitle.textContent = currentUser.isAdmin
        ? `${currentUser.name}'s admin command center`
        : `${currentUser.name}'s profile`;
      profileDescription.textContent = currentUser.isAdmin
        ? "You are signed in as the platform administrator with access to manage every post across the network."
        : currentUser.accountType === "private"
          ? "Your profile is private. Only followers can read your posts."
          : "Your profile is public. Everyone can discover and read your posts.";
      creatorBannerText.textContent = currentUser.isAdmin
        ? "Mayank, this is your creation space. As the creator of Hearthline, you hold complete control over every account, every post, and the full community experience."
        : "You are signed in as the creator of Hearthline with complete authority over the platform experience.";
      profileAccountType.textContent = currentUser.isAdmin
        ? "Admin"
        : currentUser.accountType === "private" ? "Private" : "Public";
      profileFollowersCount.textContent = String(currentUser.followersCount || 0);
      profileFollowingCount.textContent = String(currentUser.followingCount || 0);
    }

    async function loadCreators() {
      try {
        const res = await fetch(`${API}/users`, {
          headers: getAuthHeaders()
        });
        const users = await res.json();

        if (!Array.isArray(users)) {
          creatorsList.innerHTML = "";
          return;
        }

        allCreators = users.map(normalizeUser);
        const visibleUsers = allCreators.filter(user => !user.viewerContext?.isOwner).slice(0, 8);

        if (visibleUsers.length === 0) {
          creatorsList.innerHTML = '<div class="empty-state">No other writers are available yet.</div>';
          return;
        }

        creatorsList.innerHTML = visibleUsers.map(user => `
          <div class="creator-card">
            <div>
              <button class="author-link" type="button" onclick="openIdentityModal('${user._id}')">
                <span class="author-icon">${getUserInitials(user.name)}</span>
                <strong>${user.name}</strong>
              </button>
              <span>${user.email || "No email available"} • ${user.accountType} account • ${user.followersCount} follower${user.followersCount === 1 ? "" : "s"}</span>
            </div>
            ${token ? `
              <button
                class="follow-btn ${user.viewerContext?.isFollowingAuthor ? "following" : ""}"
                onclick="toggleFollowAuthor('${user._id}', ${Boolean(user.viewerContext?.isFollowingAuthor)})"
              >
                ${user.viewerContext?.isFollowingAuthor ? "Following" : "Follow"}
              </button>
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
        return;
      }

      try {
        const res = await fetch(`${API}/me`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();

        if (data.user) {
          currentUser = normalizeUser(data.user);
          renderProfileCard();
          return;
        }
      } catch (error) {
      }

      currentUser = null;
      renderProfileCard();
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

    function openAuthModal(mode) {
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
      const toastMeta = type === "success"
        ? { title: "Published Beautifully", icon: "OK" }
        : { title: "Almost There", icon: "!" };

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

      appShell.classList.toggle("locked", showAuthOverlay);
      authOverlay.classList.toggle("active", showAuthOverlay);
      editorBox.style.display = isLoggedIn ? "block" : "none";
      profileCard.classList.toggle("active", isLoggedIn && Boolean(currentUser));
      headerUserChip.classList.toggle("active", isLoggedIn && Boolean(currentUser));
      logoutButton.style.display = isLoggedIn ? "inline-block" : "none";
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

    async function loadPosts() {
      if (!token && !authDismissed) {
        updateAuthUI();
        return;
      }

      try {
        const res = await fetch(`${API}/posts`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          document.getElementById("posts").innerHTML = '<div class="empty-state">No articles published yet. Create your first post to begin building your presence.</div>';
          return;
        }

        let output = '<div class="posts-shell">';

        data.forEach(post => {
          const safeTitle = escapeForTemplate(post.title);
          const safeContent = escapeForTemplate(post.content);
          const contentPreview = post.content || "No content available.";
          const wordCount = contentPreview.trim().split(/\s+/).filter(Boolean).length;
          const authorId = post.userId?._id || post.userId;
          const isAdmin = Boolean(currentUser?.isAdmin) || Boolean(post.viewerContext?.isAdmin) || isAdminAccount(currentUser);
          const isOwner = Boolean(post.viewerContext?.isOwner) || (
            currentUser && String(authorId) === String(currentUser._id)
          );
          const isFollowingAuthor = Boolean(post.viewerContext?.isFollowingAuthor);
          const accountType = post.userId?.accountType || "public";
          const canManagePost = isOwner || isAdmin;
          const followButton = token && !isOwner && !isAdmin ? `
            <button
              class="follow-btn ${isFollowingAuthor ? "following" : ""}"
              onclick="toggleFollowAuthor('${post.userId._id}', ${isFollowingAuthor})"
            >
              ${isFollowingAuthor ? "Following" : "Follow"}
            </button>
          ` : "";

          output += `
            <div class="post">
              <div class="post-body">
                <div class="post-topline">
                  <div class="author-actions">
                    <span class="post-label">Published Story</span>
                    <span class="privacy-badge ${accountType}">${accountType} account</span>
                    ${isAdmin ? '<span class="privacy-badge admin">admin control</span>' : ""}
                    ${isOwner ? '<span class="privacy-badge owner">your post</span>' : ""}
                  </div>
                  <div class="author-actions">
                    <button class="author-link" type="button" onclick="openIdentityModal('${post.userId?._id}')">
                      <span class="author-icon">${getUserInitials(post.userId?.name || "Unknown Author")}</span>
                      <span class="post-author">By ${post.userId?.name || "Unknown Author"} • ${post.userId?.email || "No email available"}</span>
                    </button>
                    ${followButton}
                  </div>
                </div>
                <h2>${post.title || "Untitled Article"}</h2>
                <p>${contentPreview}</p>
                <div class="post-footer">
                  <span class="post-meta">${wordCount} word${wordCount === 1 ? "" : "s"} in this article</span>
                  ${canManagePost ? `
                  <div class="post-actions">
                    <button class="primary" onclick="editPost('${post._id}', \`${safeTitle}\`, \`${safeContent}\`)">Edit</button>
                    <button class="danger" onclick="deletePost('${post._id}')">Delete</button>
                  </div>
                  ` : ""}
                </div>
              </div>
            </div>
          `;
        });

        output += "</div>";
        document.getElementById("posts").innerHTML = output;
      } catch (err) {
        document.getElementById("posts").innerHTML = '<div class="empty-state">We could not load your articles right now. Please try again in a moment.</div>';
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
      createPost();
    }

    async function login() {
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      setFieldValidation(modalLoginValidation, "");

      if (!isValidEmail(email)) {
        setFieldValidation(modalLoginValidation, "Enter a valid email address in the format name@example.com.");
        return;
      }

      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.token) {
        token = data.token;
        localStorage.setItem("token", token);
        currentUser = normalizeUser(data.user || null);
        authDismissed = false;
        sessionStorage.removeItem("authDismissed");
        setAuthMessage("Signed in successfully.", true);
        renderProfileCard();
        updateAuthUI();
        await fetchCurrentUser();
        loadCreators();
        loadPosts();
        return;
      }

      setAuthMessage(data.message || "Unable to sign in. Please check your details and try again.");
    }

    async function signup() {
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      const accountType = getSelectedAccountType();

      setFieldValidation(modalSignupValidation, "");

      if (!isValidEmail(email)) {
        setFieldValidation(modalSignupValidation, "Enter a valid email address.");
        return;
      }

      if (!updateModalPasswordGuide(password)) {
        setAuthMessage("Please create a stronger password using uppercase, lowercase, numeric, and special characters.");
        return;
      }

      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, accountType })
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

    async function createPost() {
      const title = document.getElementById("title").value.trim();
      const content = document.getElementById("content").value.trim();

      if (!title || !content) {
        showToast("Please complete both the title and content before publishing.", "error");
        return;
      }

      const res = await fetch(`${API}/create-post`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ title, content })
      });

      const data = await res.json();
      showToast(data.message || "Your article has been published.", "success");

      document.getElementById("title").value = "";
      document.getElementById("content").value = "";
      loadPosts();
    }

    async function deletePost(id) {
      pendingDeleteId = id;
      deleteOverlay.classList.add("active");
    }

    async function confirmDelete() {
      if (!pendingDeleteId) return;

      const res = await fetch(`${API}/delete-post/${pendingDeleteId}`, {
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

      const res = await fetch(`${API}/update-post/${pendingEditId}`, {
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
      const res = await fetch(`${API}/${endpoint}/${userId}`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();

      showToast(
        data.message || (isFollowing ? "Writer unfollowed." : "Writer followed."),
        "success"
      );
      await fetchCurrentUser();
      loadCreators();
      loadPosts();
    }

    async function removeSelectedUser() {
      if (!selectedIdentityUserId || !currentUser?.isAdmin) return;

      const res = await fetch(`${API}/admin/remove-user/${selectedIdentityUserId}`, {
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

    function logout() {
      localStorage.removeItem("token");
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
      renderProfileCard();
      closeIdentityModal();
      setAuthOverlayMode("");
      updateAuthUI();
      switchAuth("login");
      setAuthMessage("You have been signed out.", true);
      window.location.href = "index.html";
    }

    async function initializeApp() {
      switchAuth("login");
      await fetchCurrentUser();
      updateAuthUI();
      loadCreators();
      loadPosts();
    }

    initializeApp();
  
