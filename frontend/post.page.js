const API = "http://3.138.42.18:5000";
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");
const storyTitle = document.getElementById("storyTitle");
const storyMeta = document.getElementById("storyMeta");
const storyContent = document.getElementById("storyContent");
const storyChips = document.getElementById("storyChips");
const storyUtilities = document.getElementById("storyUtilities");
const storyMetrics = document.getElementById("storyMetrics");
const manageActions = document.getElementById("manageActions");
const commentCount = document.getElementById("commentCount");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");
const storyMessage = document.getElementById("storyMessage");
let currentPost = null;
let cachedPost = null;
let notificationTimer = null;
let notificationsInFlight = false;

try {
  const savedPost = sessionStorage.getItem("activePost");
  cachedPost = savedPost ? JSON.parse(savedPost) : null;
} catch (error) {
  cachedPost = null;
}

function setMessage(text, isSuccess) {
  storyMessage.textContent = text || "";
  storyMessage.classList.toggle("success", Boolean(isSuccess));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCount(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function getToken() {
  return sessionStorage.getItem("token") || "";
}

function getHeaders(includeJson = false) {
  const headers = {};
  const token = getToken();

  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = "Bearer " + token;

  return headers;
}

function formatDate(value) {
  if (!value) return "Recently";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getReplyInputId(commentId) {
  return `reply-input-${commentId}`;
}

function createToastRoot() {
  let root = document.getElementById("pageToastRoot");

  if (!root) {
    root = document.createElement("div");
    root.id = "pageToastRoot";
    root.className = "page-toast-root";
    document.body.appendChild(root);
  }

  return root;
}

function showToast(message, type = "success") {
  if (!message) return;

  const root = createToastRoot();
  const toast = document.createElement("div");
  toast.className = `page-toast ${type}`;
  toast.innerHTML = `
    <div class="page-toast-title">${type === "success" ? "New Activity" : "Notice"}</div>
    <div class="page-toast-body">${escapeHtml(message)}</div>
  `;

  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("visible");
    window.setTimeout(() => toast.remove(), 260);
  }, 4200);
}

function storePostState(post) {
  if (!post) return;
  currentPost = post;
  cachedPost = post;
  sessionStorage.setItem("activePost", JSON.stringify(post));
}

function getCommentActionLabel(comment) {
  return comment?.viewerContext?.hasLiked ? "Unlike" : "Like";
}

function getReplyActionLabel(reply) {
  return reply?.viewerContext?.hasLiked ? "Unlike" : "Like";
}

function renderReply(reply, comment) {
  const canDeleteReply = Boolean(
    reply?.viewerContext?.canDelete
    || comment?.viewerContext?.canDelete
    || currentPost?.viewerContext?.canManagePost
  );

  return `
    <div class="reply-card">
      <div class="comment-card-top">
        <div class="chip-row">
          <span class="chip">${escapeHtml(reply.userId?.name || "Unknown")}</span>
          <span class="chip">${formatDate(reply.createdAt)}</span>
        </div>
        ${canDeleteReply ? `<button class="danger subtle-danger" type="button" onclick="deleteReply('${comment._id}', '${reply._id}')">Delete</button>` : ""}
      </div>
      <p>${escapeHtml(reply.content)}</p>
      <div class="comment-actions">
        <button class="comment-action-btn" type="button" onclick="toggleReplyLike('${comment._id}', '${reply._id}')">
          ${getReplyActionLabel(reply)} � ${getCount(reply.likesCount)}
        </button>
      </div>
    </div>
  `;
}

function renderComment(comment) {
  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  const canDeleteComment = Boolean(
    comment?.viewerContext?.canDelete || currentPost?.viewerContext?.canManagePost
  );
  const replyInputId = getReplyInputId(comment._id);

  return `
    <div class="comment-card thread-card">
      <div class="comment-card-top">
        <div class="chip-row">
          <span class="chip">${escapeHtml(comment.userId?.name || "Unknown")}</span>
          <span class="chip">${formatDate(comment.createdAt)}</span>
        </div>
        ${canDeleteComment ? `<button class="danger subtle-danger" type="button" onclick="deleteComment('${comment._id}')">Delete</button>` : ""}
      </div>
      <p>${escapeHtml(comment.content)}</p>
      <div class="comment-actions">
        <button class="comment-action-btn" type="button" onclick="toggleCommentLike('${comment._id}')">
          ${getCommentActionLabel(comment)} � ${getCount(comment.likesCount)}
        </button>
        ${comment.viewerContext?.canReply ? `<button class="comment-action-btn" type="button" onclick="toggleReplyComposer('${comment._id}')">Reply${replies.length ? ` � ${replies.length}` : ""}</button>` : ""}
      </div>
      ${comment.viewerContext?.canReply ? `
        <div class="reply-form" id="reply-form-${comment._id}" hidden>
          <textarea id="${replyInputId}" class="reply-textarea" placeholder="Write a thoughtful reply..."></textarea>
          <div class="reply-form-actions">
            <span class="reply-note">Make your reply feel warm, clear, and personal.</span>
            <button type="button" onclick="submitReply('${comment._id}')">Post Reply</button>
          </div>
        </div>
      ` : ""}
      ${replies.length ? `
        <div class="reply-list">
          ${replies.map(reply => renderReply(reply, comment)).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function renderUnavailable(message) {
  storyTitle.textContent = "Story unavailable";
  storyMeta.textContent = "";
  storyContent.textContent = message || "We could not load this story.";
  storyChips.innerHTML = "";
  storyUtilities.innerHTML = "";
  storyMetrics.innerHTML = "";
  manageActions.innerHTML = "";
  commentCount.textContent = "0 replies";
  commentList.innerHTML = '<p class="empty-note">Comments are unavailable for this story right now.</p>';
}

function getPostFromPayload(data) {
  if (data?.post && typeof data.post === "object") {
    return data.post;
  }

  if (data && typeof data === "object" && data._id) {
    return data;
  }

  return null;
}

function renderPost(post) {
  currentPost = post;
  const likesCount = getCount(post.likesCount);
  const bookmarksCount = getCount(post.bookmarksCount);
  const commentsCount = getCount(post.commentsCount);
  storyTitle.textContent = post.title || "Untitled Article";
  storyMeta.textContent = `By ${post.userId?.name || "Unknown author"} � ${post.userId?.email || "No email available"} � Updated ${formatDate(post.updatedAt || post.createdAt)}`;
  storyContent.textContent = post.content || "No story content available.";
  storyChips.innerHTML = `
    <span class="chip">${escapeHtml(post.status || "published")}</span>
    <span class="chip">${escapeHtml(post.userId?.accountType || "public")} account</span>
    ${post.viewerContext?.isAdmin ? '<span class="chip">admin access</span>' : ""}
  `;
  storyUtilities.innerHTML = `
    <button type="button" onclick="toggleLike()">${post.viewerContext?.hasLiked ? "Unlike" : "Like"}</button>
    <button type="button" class="secondary" onclick="toggleBookmark()">${post.viewerContext?.hasBookmarked ? "Remove Bookmark" : "Save Bookmark"}</button>
  `;
  storyMetrics.innerHTML = `
    <span class="metric">${likesCount} likes</span>
    <span class="metric">${bookmarksCount} bookmarks</span>
    <span class="metric">${commentsCount} comments</span>
  `;
  manageActions.innerHTML = post.viewerContext?.canManagePost ? `
    <button type="button" class="secondary" onclick="window.location.href='create-article.html?id=${post._id}'">Edit Story</button>
    <button type="button" class="danger" onclick="deletePost()">Delete Story</button>
  ` : "";
  commentCount.textContent = `${commentsCount} repl${commentsCount === 1 ? "y" : "ies"}`;
  commentList.innerHTML = Array.isArray(post.comments) && post.comments.length
    ? post.comments.map(renderComment).join("")
    : '<p class="empty-note">No comments yet. Start the conversation here.</p>';
}

async function applyPostResponse(res, data, successFallback, errorFallback) {
  setMessage(data?.message || (res.ok ? successFallback : errorFallback), res.ok);

  if (data?.post) {
    storePostState(data.post);
    renderPost(data.post);
    return true;
  }

  return false;
}

async function refreshNotifications() {
  if (!getToken() || document.hidden || notificationsInFlight) return;

  notificationsInFlight = true;

  try {
    const res = await fetch(`${API}/api/me`, {
      headers: getHeaders()
    });
    const data = await res.json();
    const unread = Array.isArray(data?.user?.notifications)
      ? data.user.notifications.filter(notification => !notification.read)
      : [];

    unread.forEach(notification => {
      showToast(notification.message, "success");
    });

    if (unread.length) {
      await fetch(`${API}/api/notifications/mark-read`, {
        method: "POST",
        headers: getHeaders()
      });
    }
  } catch (error) {
    // Keep the page quiet if notification polling fails.
  } finally {
    notificationsInFlight = false;
  }
}

function startNotificationPolling() {
  if (!getToken() || notificationTimer) return;
  refreshNotifications();
  notificationTimer = window.setInterval(refreshNotifications, 30000);
}

window.addEventListener("beforeunload", () => {
  if (notificationTimer) {
    window.clearInterval(notificationTimer);
    notificationTimer = null;
  }
});

async function loadPost() {
  if (!postId) {
    setMessage("No post was selected.", false);
    renderUnavailable("Open a story from the home feed to view it here.");
    return;
  }

  if (cachedPost && String(cachedPost._id) === String(postId)) {
    renderPost(cachedPost);
    setMessage("", false);
  }

  try {
    const res = await fetch(`${API}/api/posts/${postId}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    const post = getPostFromPayload(data);

    if (!res.ok || !post) {
      if (cachedPost && String(cachedPost._id) === String(postId)) {
        setMessage(data?.message || "Showing the last loaded copy of this story.", false);
        return;
      }
      setMessage(data?.message || "We could not load this post.", false);
      renderUnavailable(data?.message || "We could not load this story.");
      return;
    }

    storePostState(post);
    setMessage("", false);
    renderPost(post);
  } catch (error) {
    if (cachedPost && String(cachedPost._id) === String(postId)) {
      setMessage("Showing the last loaded copy of this story.", false);
      return;
    }
    setMessage("We could not load this story right now.", false);
    renderUnavailable("The story service did not respond. Please try again in a moment.");
  }
}

async function toggleLike() {
  if (!getToken()) {
    setMessage("Sign in to like stories.", false);
    return;
  }
  try {
    const res = await fetch(`${API}/api/posts/${postId}/toggle-like`, {
      method: "POST",
      headers: getHeaders()
    });
    const data = await res.json();
    await applyPostResponse(res, data, "Action finished.", "We could not update likes right now.");
  } catch (error) {
    setMessage("We could not update likes right now.", false);
  }
}

async function toggleBookmark() {
  if (!getToken()) {
    setMessage("Sign in to save stories.", false);
    return;
  }
  try {
    const res = await fetch(`${API}/api/posts/${postId}/toggle-bookmark`, {
      method: "POST",
      headers: getHeaders()
    });
    const data = await res.json();
    await applyPostResponse(res, data, "Action finished.", "We could not update bookmarks right now.");
  } catch (error) {
    setMessage("We could not update bookmarks right now.", false);
  }
}

async function addComment() {
  if (!getToken()) {
    setMessage("Sign in to comment.", false);
    return;
  }

  const content = commentInput.value.trim();
  if (!content) {
    setMessage("Write a comment before posting it.", false);
    return;
  }

  try {
    const res = await fetch(`${API}/api/posts/${postId}/comments`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    const applied = await applyPostResponse(res, data, "Comment added.", "We could not post your comment right now.");

    if (applied && res.ok) {
      commentInput.value = "";
    }
  } catch (error) {
    setMessage("We could not post your comment right now.", false);
  }
}

async function toggleCommentLike(commentId) {
  if (!getToken()) {
    setMessage("Sign in to like comments.", false);
    return;
  }

  try {
    const res = await fetch(`${API}/api/posts/${postId}/comments/${commentId}/toggle-like`, {
      method: "POST",
      headers: getHeaders()
    });
    const data = await res.json();
    await applyPostResponse(res, data, "Comment updated.", "We could not update this comment right now.");
  } catch (error) {
    setMessage("We could not update this comment right now.", false);
  }
}

function toggleReplyComposer(commentId) {
  const form = document.getElementById(`reply-form-${commentId}`);
  const input = document.getElementById(getReplyInputId(commentId));

  if (!form) return;

  const willOpen = form.hidden;
  form.hidden = !form.hidden;

  if (willOpen && input) {
    input.focus();
  }
}

async function submitReply(commentId) {
  if (!getToken()) {
    setMessage("Sign in to reply.", false);
    return;
  }

  const input = document.getElementById(getReplyInputId(commentId));
  const content = input?.value.trim() || "";

  if (!content) {
    setMessage("Write a reply before posting it.", false);
    return;
  }

  try {
    const res = await fetch(`${API}/api/posts/${postId}/comments/${commentId}/replies`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    const applied = await applyPostResponse(res, data, "Reply added.", "We could not post this reply right now.");

    if (applied && res.ok && input) {
      input.value = "";
    }
  } catch (error) {
    setMessage("We could not post this reply right now.", false);
  }
}

async function toggleReplyLike(commentId, replyId) {
  if (!getToken()) {
    setMessage("Sign in to like replies.", false);
    return;
  }

  try {
    const res = await fetch(`${API}/api/posts/${postId}/comments/${commentId}/replies/${replyId}/toggle-like`, {
      method: "POST",
      headers: getHeaders()
    });
    const data = await res.json();
    await applyPostResponse(res, data, "Reply updated.", "We could not update this reply right now.");
  } catch (error) {
    setMessage("We could not update this reply right now.", false);
  }
}

async function deleteComment(commentId) {
  try {
    const res = await fetch(`${API}/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    const data = await res.json();
    await applyPostResponse(res, data, "Comment removed.", "We could not remove this comment right now.");
  } catch (error) {
    setMessage("We could not remove this comment right now.", false);
  }
}

async function deleteReply(commentId, replyId) {
  try {
    const res = await fetch(`${API}/api/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    const data = await res.json();
    await applyPostResponse(res, data, "Reply removed.", "We could not remove this reply right now.");
  } catch (error) {
    setMessage("We could not remove this reply right now.", false);
  }
}

async function deletePost() {
  try {
    const res = await fetch(`${API}/api/delete-post/${postId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    const data = await res.json();
    setMessage(data.message || "Post deleted.", res.ok);
    if (data.message && data.message.toLowerCase().includes("success")) {
      window.location.replace(sessionStorage.getItem("dashboardPath") || "user.html");
    }
  } catch (error) {
    setMessage("We could not delete this story right now.", false);
  }
}

window.toggleLike = toggleLike;
window.toggleBookmark = toggleBookmark;
window.addComment = addComment;
window.toggleCommentLike = toggleCommentLike;
window.toggleReplyComposer = toggleReplyComposer;
window.submitReply = submitReply;
window.toggleReplyLike = toggleReplyLike;
window.deleteComment = deleteComment;
window.deleteReply = deleteReply;
window.deletePost = deletePost;

loadPost();
startNotificationPolling();



