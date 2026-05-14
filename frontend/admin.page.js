const API = "http://3.138.42.18:5000";
const ADMIN_EMAIL = "admin@gmail.com";

let token = sessionStorage.getItem("token") || localStorage.getItem("adminToken");
let overview = null;
let toastTimer = null;

const adminGate = document.getElementById("adminGate");
const adminConsole = document.getElementById("adminConsole");
const gateMessage = document.getElementById("gateMessage");
const adminIdentity = document.getElementById("adminIdentity");
const metricGrid = document.getElementById("metricGrid");
const usersList = document.getElementById("usersList");
const postsList = document.getElementById("postsList");
const userSearch = document.getElementById("userSearch");
const adminNoticeText = document.getElementById("adminNoticeText");
const toastMessage = document.getElementById("toastMessage");
const adminLoginButton = document.getElementById("adminLoginButton");

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
  { id: "avatar-10", skin: "#7f5539", hair: "#4338ca", shirt: "#2563eb", bg: "#c7d2fe" }
];

function getAuthHeaders(includeJson = false) {
  const headers = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function avatarDataUri(avatarId) {
  const avatar = AVATAR_OPTIONS.find(option => option.id === avatarId) || AVATAR_OPTIONS[0];
  const svg = `
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
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function showToast(message) {
  toastMessage.textContent = message;
  toastMessage.classList.add("active");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastMessage.classList.remove("active"), 3200);
}

function showGate(message = "") {
  adminGate.classList.remove("hidden");
  adminConsole.classList.add("hidden");
  gateMessage.textContent = message;
}

function showConsole() {
  adminGate.classList.add("hidden");
  adminConsole.classList.remove("hidden");
}

function rememberAdminSession(nextToken) {
  token = nextToken;
  sessionStorage.setItem("token", nextToken);
  sessionStorage.setItem("dashboardPath", "admin.html");
  localStorage.setItem("adminToken", nextToken);
}

function clearAdminSession() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("dashboardPath");
  localStorage.removeItem("adminToken");
  token = null;
}

async function adminLogin(event) {
  event.preventDefault();

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  gateMessage.textContent = "";
  adminLoginButton.disabled = true;
  adminLoginButton.textContent = "Opening...";

  try {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!data.token || !data.user?.isAdmin) {
      gateMessage.textContent = data.message || "Admin access required.";
      return;
    }

    rememberAdminSession(data.token);
    await loadOverview();
  } catch (error) {
    gateMessage.textContent = "The server could not be reached.";
  } finally {
    adminLoginButton.disabled = false;
    adminLoginButton.textContent = "Enter Panel";
  }
}

async function verifyAdmin() {
  if (!token) {
    showGate("");
    return;
  }

  sessionStorage.setItem("token", token);
  sessionStorage.setItem("dashboardPath", "admin.html");

  try {
    const res = await fetch(`${API}/api/me`, { headers: getAuthHeaders() });
    const data = await res.json();

    if (!data.user?.isAdmin) {
      clearAdminSession();
      showGate("Please sign in with the admin account.");
      return;
    }

    await loadOverview();
  } catch (error) {
    showGate("Unable to reach the server right now.");
  }
}

async function loadOverview() {
  const res = await fetch(`${API}/api/admin/overview`, { headers: getAuthHeaders() });
  const data = await res.json();

  if (!data.users) {
    showGate(data.message || "Admin access required.");
    return;
  }

  overview = data;
  adminIdentity.textContent = `Signed in as ${data.admin?.email || ADMIN_EMAIL} with full platform access.`;
  showConsole();
  renderMetrics();
  renderUsers();
  renderPosts();
}

function renderMetrics() {
  const stats = overview.stats || {};
  const metrics = [
    ["Users", stats.users],
    ["Private Accounts", stats.privateUsers],
    ["Articles", stats.posts],
    ["Conversations", stats.conversations],
    ["Drafts", stats.drafts],
    ["Announcements", stats.announcements],
    ["Total Likes", stats.likes],
    ["Comments", stats.comments]
  ];

  metricGrid.innerHTML = metrics.map(([label, value]) => `
    <div class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${Number(value || 0)}</strong>
    </div>
  `).join("");
}

function renderUsers() {
  const query = userSearch.value.trim().toLowerCase();
  const users = (overview.users || []).filter(user => {
    const haystack = `${user.name || ""} ${user.email || ""}`.toLowerCase();
    return haystack.includes(query);
  });

  if (!users.length) {
    usersList.innerHTML = '<div class="empty-state">No users match this search.</div>';
    return;
  }

  usersList.innerHTML = users.map(user => {
    const isPrivate = user.accountType === "private";
    const membership = user.membership?.label || "Free";
    return `
      <article class="user-card">
        <div class="user-top">
          <img src="${avatarDataUri(user.avatarId)}" alt="${escapeHtml(user.name)} avatar">
          <div>
            <h3 class="user-name">${escapeHtml(user.name || "Unnamed user")}</h3>
            <div class="user-email">${escapeHtml(user.email || "No email")}</div>
          </div>
          ${user.isAdmin ? '<span class="badge admin">Admin</span>' : `<button type="button" onclick="removeUser('${user._id}')">Remove</button>`}
        </div>
        <div class="badge-row">
          <span class="badge ${isPrivate ? "private" : ""}">${isPrivate ? "Private account" : "Public account"}</span>
          <span class="badge">${escapeHtml(membership)} plan</span>
          <span class="badge">${user.isVerified ? "Verified" : "Unverified"}</span>
          ${user.resetRequested ? '<span class="badge private">Reset requested</span>' : ""}
        </div>
        <div class="private-data">
          Email: ${escapeHtml(user.email)} | Followers: ${user.followersCount} | Following: ${user.followingCount} | Pending follow requests: ${user.pendingFollowRequestsCount} | Unread notifications: ${user.unreadNotificationsCount}
        </div>
        <div class="user-stats">
          <span>${user.posts.total} posts</span>
          <span>${user.posts.drafts} drafts</span>
          <span>${user.posts.likes} likes</span>
          <span>${user.posts.comments} comments</span>
          <span>${user.conversationsCount} chats</span>
          <span>${user.membership?.boostCredits || 0} boost credits</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderPosts() {
  const posts = overview.posts || [];

  if (!posts.length) {
    postsList.innerHTML = '<div class="empty-state">No articles have been published yet.</div>';
    return;
  }

  postsList.innerHTML = posts.map(post => `
    <article class="post-card">
      <div>
        <h3>${escapeHtml(post.title || "Untitled article")}</h3>
        <div class="post-meta">
          ${escapeHtml(post.userId?.name || "Unknown writer")} | ${escapeHtml(post.userId?.email || "No email")} | ${escapeHtml(post.status || "published")} | ${post.likesCount || 0} likes | ${post.commentsCount || 0} comments
        </div>
      </div>
      <p class="private-data">${escapeHtml(post.excerpt || post.content || "No preview available.")}</p>
      <button type="button" onclick="deletePost('${post._id}')">Delete Post</button>
    </article>
  `).join("");
}

async function sendAdminNotification() {
  const content = adminNoticeText.value.trim();

  if (!content) {
    showToast("Write a notification first.");
    return;
  }

  const res = await fetch(`${API}/api/create-post`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ title: "Message from admin", content, status: "published", kind: "announcement" })
  });
  const data = await res.json();

  adminNoticeText.value = "";
  showToast(data.message || "Notification sent.");
  await loadOverview();
}

async function removeUser(userId) {
  const user = (overview.users || []).find(item => String(item._id) === String(userId));
  const userName = user?.name || "this user";

  if (!confirm(`Remove ${userName}? This deletes their posts, chats, follows, comments, and blocks future login.`)) {
    return;
  }

  const res = await fetch(`${API}/api/admin/remove-user/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  const data = await res.json();

  showToast(data.message || "User removed.");
  await loadOverview();
}

async function deletePost(postId) {
  if (!confirm("Delete this post permanently?")) {
    return;
  }

  const res = await fetch(`${API}/api/delete-post/${postId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  const data = await res.json();

  showToast(data.message || "Post deleted.");
  await loadOverview();
}

function adminLogout() {
  clearAdminSession();
  window.location.replace("login.html");
}

userSearch.addEventListener("input", renderUsers);
verifyAdmin();
