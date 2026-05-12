const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("./models/User");
const Announcement = require("./models/Announcement");
const Post = require("./models/Post");
const Conversation = require("./models/Conversation");
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "mayank";
const MEMBERSHIP_PLANS = {
  free: { tier: "free", label: "Free", price: 0, boostCredits: 0, durationDays: 0 },
  starter: { tier: "starter", label: "Starter", price: 9, boostCredits: 3, durationDays: 30 },
  pro: { tier: "pro", label: "Pro", price: 19, boostCredits: 8, durationDays: 30 },
  business: { tier: "business", label: "Business", price: 49, boostCredits: 20, durationDays: 30 }
};

const app = express();

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  if (req.url === "/api" || req.url.startsWith("/api/")) {
    req.url = req.url.slice(4) || "/";
  }
  next();
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mayanksharma7012@gmail.com",
    pass: "ihjm gqoy kqxb fguo"
  }
});

async function sendWelcomeEmail(name, email) {
  await transporter.sendMail({
    to: email,
    subject: "You have successfully registered on Hearthline",
    html: `
      <div style="font-family:Segoe UI,sans-serif;line-height:1.6;color:#1f2937;">
        <h2>Registration Successful</h2>
        <p>Hello ${name || "there"},</p>
        <p>You have successfully registered on Hearthline.</p>
        <p>Your account is now verified and ready to use. You can sign in and start publishing your blog posts.</p>
      </div>
    `
  });
}

async function sendLoginAlertEmail(name, email) {
  await transporter.sendMail({
    to: email,
    subject: "You just signed in to Hearthline",
    html: `
      <div style="font-family:Segoe UI,sans-serif;line-height:1.6;color:#1f2937;">
        <h2>New Sign-In</h2>
        <p>Hello ${name || "there"},</p>
        <p>You just signed in to Hearthline.</p>
        <p>If this was you, no action is needed and you can continue using your account.</p>
        <p>If this was not you, please reset your password right away.</p>
      </div>
    `
  });
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("DB Connected");
    const adminUser = await ensureAdminAccount();
    await ensureStarterPost(adminUser);
  })
  .catch(err => console.log(err));

async function ensureAdminAccount() {
  try {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (adminUser) {
      adminUser.name = adminUser.name || "Hearthline Admin";
      adminUser.password = hashedPassword;
      adminUser.accountType = "public";
      adminUser.avatarId = adminUser.avatarId || "avatar-10";
      adminUser.isVerified = true;
      adminUser.isRemoved = false;
      adminUser.removedAt = undefined;
      adminUser.removedReason = undefined;
      await adminUser.save();
      return adminUser;
    }

    return User.create({
      name: "Hearthline Admin",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      avatarId: "avatar-10",
      accountType: "public",
      isVerified: true
    });
  } catch (error) {
    console.log("Unable to prepare admin account", error);
    return null;
  }
}

async function ensureStarterPost(adminUser) {
  try {
    if (!adminUser) return;

    const visiblePost = await Post.findOne({
      userId: { $exists: true },
      kind: "post",
      status: "published"
    }).populate("userId", "_id isRemoved");

    if (visiblePost?.userId && !visiblePost.userId.isRemoved) return;

    await Post.create({
      title: "Welcome to Hearthline",
      content: "Your blog workspace is ready. Create your first story, follow other writers, and keep the conversation moving from one place.",
      excerpt: "Your blog workspace is ready. Create your first story, follow other writers, and keep the conversation moving from one place.",
      status: "published",
      kind: "post",
      userId: adminUser._id,
      boost: {
        isActive: false,
        tierSnapshot: "free"
      }
    });
  } catch (error) {
    console.log("Unable to prepare starter post", error);
  }
}

function sanitizePostPayload(payload = {}) {
  const title = String(payload.title || "").trim();
  const content = String(payload.content || "").trim();
  const excerpt = content
    ? content.replace(/\s+/g, " ").trim().slice(0, 220)
    : "";
  const status = payload.status === "draft" ? "draft" : "published";
  const kind = payload.kind === "announcement" ? "announcement" : "post";

  return { title, content, excerpt, status, kind };
}

function getMembershipSnapshot(user) {
  const membership = user?.membership || {};
  const tier = MEMBERSHIP_PLANS[membership.tier]?.tier || "free";

  return {
    tier,
    label: MEMBERSHIP_PLANS[tier].label,
    boostCredits: Number(membership.boostCredits || 0),
    startedAt: membership.startedAt || null,
    expiresAt: membership.expiresAt || null
  };
}

function isBoostActive(post) {
  return Boolean(post?.boost?.isActive && post?.boost?.expiresAt && new Date(post.boost.expiresAt) > new Date());
}

function canUsersMessageEachOther(currentUser, targetUser, viewerIsAdmin = false) {
  if (!currentUser || !targetUser) return false;
  if (viewerIsAdmin) return true;
  if (String(currentUser._id) === String(targetUser._id)) return false;

  const currentFollowing = Array.isArray(currentUser.following) && currentUser.following.some(id => String(id) === String(targetUser._id));
  const targetFollowing = Array.isArray(targetUser.following) && targetUser.following.some(id => String(id) === String(currentUser._id));

  return currentFollowing || targetFollowing;
}

function formatConversation(conversation, currentUserId) {
  const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
  const otherUser = participants.find(participant => String(participant._id || participant) !== String(currentUserId));
  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  const lastMessage = messages[messages.length - 1] || null;

  return {
    _id: conversation._id,
    otherUser: otherUser ? {
      _id: otherUser._id,
      name: otherUser.name,
      email: otherUser.email,
      avatarId: otherUser.avatarId
    } : null,
    messages: messages.map(message => ({
      _id: message._id,
      text: message.text,
      createdAt: message.createdAt,
      sender: message.sender ? {
        _id: message.sender._id,
        name: message.sender.name,
        email: message.sender.email,
        avatarId: message.sender.avatarId
      } : { _id: message.sender }
    })),
    lastMessage: lastMessage ? {
      text: lastMessage.text,
      createdAt: lastMessage.createdAt,
      senderId: String(lastMessage.sender?._id || lastMessage.sender)
    } : null
  };
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ message: "No token." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.json({ message: "Invalid token." });
  }
}

async function attachUserIfPresent(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, "secretkey");
      req.userId = decoded.id;
    } catch (error) {
      req.userId = null;
    }
  }

  next();
}

function getAuthorVisibility(author, viewerId, viewerIsAdmin = false) {
  const authorId = String(author._id);
  const currentViewerId = viewerId ? String(viewerId) : null;
  const isOwner = currentViewerId === authorId;
  const followerIds = Array.isArray(author.followers)
    ? author.followers.map(id => String(id))
    : [];
  const pendingRequesterIds = Array.isArray(author.pendingFollowRequests)
    ? author.pendingFollowRequests.map(request => String(request.requester))
    : [];
  const isFollowingAuthor = currentViewerId ? followerIds.includes(currentViewerId) : false;
  const hasPendingRequest = currentViewerId ? pendingRequesterIds.includes(currentViewerId) : false;
  const canViewPrivatePosts = viewerIsAdmin || author.accountType !== "private" || isOwner || isFollowingAuthor;

  return {
    isOwner,
    isFollowingAuthor,
    hasPendingRequest,
    canViewPrivatePosts,
    isAdmin: viewerIsAdmin
  };
}

function isAdminUser(user) {
  return Boolean(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL);
}

function isOwnResource(resourceOwnerId, viewerId) {
  return Boolean(resourceOwnerId && viewerId && String(resourceOwnerId) === String(viewerId));
}

function canViewPost(post, viewerId, viewerIsAdmin) {
  if (!post || !post.userId) return false;

  const isOwner = isOwnResource(post.userId._id || post.userId, viewerId);
  const isDraft = post.status === "draft";

  if (viewerIsAdmin || isOwner) {
    return true;
  }

  if (isDraft) {
    return false;
  }

  return getAuthorVisibility(post.userId, viewerId, viewerIsAdmin).canViewPrivatePosts;
}

function buildViewerPostContext(post, viewerId, viewerIsAdmin) {
  const authorVisibility = getAuthorVisibility(post.userId, viewerId, viewerIsAdmin);
  const isOwner = isOwnResource(post.userId?._id || post.userId, viewerId);
  const likeIds = Array.isArray(post.likes) ? post.likes.map(id => String(id)) : [];
  const bookmarkIds = Array.isArray(post.bookmarks) ? post.bookmarks.map(id => String(id)) : [];

  return {
    ...authorVisibility,
    isAdmin: viewerIsAdmin,
    isOwner,
    canManagePost: viewerIsAdmin || isOwner,
    hasLiked: viewerId ? likeIds.includes(String(viewerId)) : false,
    hasBookmarked: viewerId ? bookmarkIds.includes(String(viewerId)) : false,
    canBoost: isOwner
  };
}

function formatReply(reply, viewerId, viewerIsAdmin) {
  const replyOwnerId = reply.userId?._id || reply.userId;
  const likeIds = Array.isArray(reply.likes) ? reply.likes.map(id => String(id)) : [];

  return {
    _id: reply._id,
    content: reply.content,
    createdAt: reply.createdAt,
    likesCount: likeIds.length,
    userId: reply.userId ? {
      _id: reply.userId._id,
      name: reply.userId.name,
      email: reply.userId.email,
      avatarId: reply.userId.avatarId
    } : null,
    viewerContext: {
      canDelete: viewerIsAdmin || isOwnResource(replyOwnerId, viewerId),
      hasLiked: viewerId ? likeIds.includes(String(viewerId)) : false
    }
  };
}

function formatComment(comment, viewerId, viewerIsAdmin) {
  const commentOwnerId = comment.userId?._id || comment.userId;
  const likeIds = Array.isArray(comment.likes) ? comment.likes.map(id => String(id)) : [];
  const replies = Array.isArray(comment.replies) ? comment.replies : [];

  return {
    _id: comment._id,
    content: comment.content,
    createdAt: comment.createdAt,
    likesCount: likeIds.length,
    repliesCount: replies.length,
    replyToUserId: comment.replyToUserId ? String(comment.replyToUserId) : null,
    userId: comment.userId ? {
      _id: comment.userId._id,
      name: comment.userId.name,
      email: comment.userId.email,
      avatarId: comment.userId.avatarId
    } : null,
    replies: replies.map(reply => formatReply(reply, viewerId, viewerIsAdmin)),
    viewerContext: {
      canDelete: viewerIsAdmin || isOwnResource(commentOwnerId, viewerId),
      canReply: Boolean(viewerId),
      hasLiked: viewerId ? likeIds.includes(String(viewerId)) : false
    }
  };
}

function formatPost(post, viewerId, viewerIsAdmin, options = {}) {
  const content = String(post.content || "");
  const excerpt = post.excerpt || content.replace(/\s+/g, " ").trim().slice(0, 220);
  const viewerContext = buildViewerPostContext(post, viewerId, viewerIsAdmin);
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const includeComments = Boolean(options.includeComments);
  const commentsCount = comments.reduce((total, comment) => {
    const repliesCount = Array.isArray(comment.replies) ? comment.replies.length : 0;
    return total + 1 + repliesCount;
  }, 0);

  return {
    _id: post._id,
    title: post.title || "Untitled Article",
    content,
    excerpt,
    kind: post.kind || "post",
    status: post.status || "published",
    boost: {
      isActive: isBoostActive(post),
      boostedAt: post.boost?.boostedAt || null,
      expiresAt: post.boost?.expiresAt || null,
      tierSnapshot: post.boost?.tierSnapshot || "free"
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt || post.createdAt,
    likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
    bookmarksCount: Array.isArray(post.bookmarks) ? post.bookmarks.length : 0,
    commentsCount,
    comments: includeComments ? comments.map(comment => formatComment(comment, viewerId, viewerIsAdmin)) : undefined,
    userId: post.userId ? {
      _id: post.userId._id,
      name: post.userId.name,
      email: post.userId.email,
      avatarId: post.userId.avatarId,
      accountType: post.userId.accountType
    } : null,
    viewerContext
  };
}

function ensurePostCollections(post) {
  if (!post) return post;
  post.likes = Array.isArray(post.likes) ? post.likes : [];
  post.bookmarks = Array.isArray(post.bookmarks) ? post.bookmarks : [];
  post.comments = Array.isArray(post.comments) ? post.comments : [];
  post.comments.forEach(comment => {
    comment.likes = Array.isArray(comment.likes) ? comment.likes : [];
    comment.replies = Array.isArray(comment.replies) ? comment.replies : [];
    comment.replies.forEach(reply => {
      reply.likes = Array.isArray(reply.likes) ? reply.likes : [];
    });
  });
  return post;
}

function addNotification(user, type, message) {
  user.notifications = user.notifications || [];
  user.notifications.push({
    type,
    message,
    read: false,
    createdAt: new Date()
  });
}

async function findAdminUser() {
  return User.findOne({
    email: ADMIN_EMAIL,
    isRemoved: { $ne: true }
  }).select("_id name email");
}

function populatePostRelations(query) {
  return query
    .populate("userId", "name email avatarId accountType followers following pendingFollowRequests")
    .populate("comments.userId", "name email avatarId")
    .populate("comments.replyToUserId", "name email avatarId")
    .populate("comments.replies.userId", "name email avatarId");
}

async function requireAdmin(req, res, next) {
  const actingUser = await User.findById(req.userId).select("name email");

  if (!isAdminUser(actingUser)) {
    return res.json({ message: "Admin access required." });
  }

  req.actingUser = actingUser;
  next();
}

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, accountType, avatarId } = req.body;

    if (!name || !email || !password) {
      return res.json({ message: "Name, email, and password are required." });
    }

    if (accountType && !["public", "private"].includes(accountType)) {
      return res.json({ message: "Choose either a public or private account." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isRemoved) {
        existingUser.isRemoved = false;
        existingUser.removedAt = undefined;
        existingUser.removedReason = undefined;
      }
      existingUser.isVerified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeExpire = undefined;
      await existingUser.save();
      return res.json({ message: "An account with this email already exists. Please sign in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      avatarId: avatarId || "avatar-01",
      accountType: accountType || "public",
      isVerified: true
    });

    await user.save();
    await sendWelcomeEmail(user.name, user.email);

    res.json({ message: "Account created successfully. You can now sign in." });
  } catch (error) {
    console.log(error);
    res.json({ message: "Something went wrong while creating your account." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "User not found." });
    }

    if (user.isRemoved) {
      return res.json({
        message: user.removedReason || "Your account has been removed by the admin. Please contact support or the platform creator."
      });
    }

    if (!user.isVerified) {
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpire = undefined;
      await user.save();
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ message: "Wrong password." });
    }

    const token = jwt.sign(
      { id: user._id },
      "secretkey",
      { expiresIn: "1d" }
    );

    if (!isAdminUser(user)) {
      sendLoginAlertEmail(user.name, user.email).catch(error => {
        console.log("Unable to send login alert", error);
      });
    }

    res.json({
      message: "Login successful.",
      token,
      userId: user._id,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarId: user.avatarId,
        isAdmin: isAdminUser(user),
        accountType: user.accountType,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0
      }
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
app.get("/api/admin-announcement", async (req, res) => {
  try {
    const announcement = await Announcement.findOne().sort({ createdAt: -1 });
    res.json({ announcement });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcement" });
  }
});
app.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("name email avatarId accountType followers following pendingFollowRequests notifications membership isRemoved")
      .populate("pendingFollowRequests.requester", "name email avatarId");

    if (!user || user.isRemoved) {
      return res.json({ message: "User not found." });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarId: user.avatarId,
        isAdmin: isAdminUser(user),
        accountType: user.accountType,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        following: user.following.map(id => String(id)),
        membership: getMembershipSnapshot(user),
        notifications: (user.notifications || []).map(notification => ({
          type: notification.type,
          message: notification.message,
          read: notification.read,
          createdAt: notification.createdAt
        })),
        pendingFollowRequests: (user.pendingFollowRequests || [])
          .filter(request => request.requester)
          .map(request => ({
            requester: {
              _id: request.requester._id,
              name: request.requester.name,
              email: request.requester.email,
              avatarId: request.requester.avatarId
            },
            createdAt: request.createdAt
          }))
      }
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/notifications/mark-read", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.json({ message: "User not found." });
    }

    (user.notifications || []).forEach(notification => {
      notification.read = true;
    });

    await user.save();
    res.json({ message: "Notifications updated." });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.get("/users", attachUserIfPresent, async (req, res) => {
  try {
    const viewer = req.userId ? await User.findById(req.userId).select("email") : null;
    const viewerIsAdmin = isAdminUser(viewer);
    const users = await User.find({ isRemoved: { $ne: true } }).select("name email avatarId accountType followers following pendingFollowRequests");

    const results = users.map(user => {
      const visibility = getAuthorVisibility(user, req.userId, viewerIsAdmin);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarId: user.avatarId,
        isAdmin: isAdminUser(user),
        accountType: user.accountType,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        followers: user.followers.map(id => String(id)),
        following: user.following.map(id => String(id)),
        viewerContext: visibility
      };
    });

    res.json(results);
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json({ posts });
  } catch (err) {
    console.error("🔥 POST ERROR:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});
 
app.get("/admin/overview", verifyToken, requireAdmin, async (req, res) => {
  try {
    const [users, posts, conversations] = await Promise.all([
      User.find({ isRemoved: { $ne: true } })
        .select("name email avatarId accountType followers following pendingFollowRequests notifications membership isVerified isRemoved removedAt removedReason resetToken resetTokenExpire")
        .lean(),
      Post.find()
        .populate("userId", "name email avatarId accountType followers following pendingFollowRequests")
        .sort({ updatedAt: -1, createdAt: -1 }),
      Conversation.find().select("participants messages").lean()
    ]);

    const postsByUser = new Map();
    posts.forEach(post => {
      const userId = String(post.userId?._id || post.userId || "");
      if (!userId) return;
      const current = postsByUser.get(userId) || { total: 0, drafts: 0, announcements: 0, likes: 0, comments: 0 };
      current.total += 1;
      current.drafts += post.status === "draft" ? 1 : 0;
      current.announcements += post.kind === "announcement" ? 1 : 0;
      current.likes += Array.isArray(post.likes) ? post.likes.length : 0;
      current.comments += Array.isArray(post.comments)
        ? post.comments.reduce((total, comment) => total + 1 + (Array.isArray(comment.replies) ? comment.replies.length : 0), 0)
        : 0;
      postsByUser.set(userId, current);
    });

    const conversationCountByUser = new Map();
    conversations.forEach(conversation => {
      (conversation.participants || []).forEach(participantId => {
        const key = String(participantId);
        conversationCountByUser.set(key, (conversationCountByUser.get(key) || 0) + 1);
      });
    });

    const formattedUsers = users.map(user => {
      const userId = String(user._id);
      const postStats = postsByUser.get(userId) || { total: 0, drafts: 0, announcements: 0, likes: 0, comments: 0 };
      const membership = getMembershipSnapshot(user);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarId: user.avatarId,
        isAdmin: isAdminUser(user),
        accountType: user.accountType,
        isVerified: Boolean(user.isVerified),
        followersCount: Array.isArray(user.followers) ? user.followers.length : 0,
        followingCount: Array.isArray(user.following) ? user.following.length : 0,
        pendingFollowRequestsCount: Array.isArray(user.pendingFollowRequests) ? user.pendingFollowRequests.length : 0,
        unreadNotificationsCount: Array.isArray(user.notifications)
          ? user.notifications.filter(notification => !notification.read).length
          : 0,
        membership,
        posts: postStats,
        conversationsCount: conversationCountByUser.get(userId) || 0,
        resetRequested: Boolean(user.resetToken && user.resetTokenExpire),
        removedAt: user.removedAt || null,
        removedReason: user.removedReason || ""
      };
    });

    const activePosts = posts.filter(post => post.userId);
    const privateUsers = formattedUsers.filter(user => user.accountType === "private").length;
    const totalLikes = formattedUsers.reduce((total, user) => total + user.posts.likes, 0);
    const totalComments = formattedUsers.reduce((total, user) => total + user.posts.comments, 0);

    res.json({
      admin: {
        email: ADMIN_EMAIL,
        name: req.actingUser.name || "Hearthline Admin"
      },
      stats: {
        users: formattedUsers.length,
        privateUsers,
        posts: activePosts.filter(post => post.kind !== "announcement").length,
        drafts: activePosts.filter(post => post.status === "draft").length,
        announcements: activePosts.filter(post => post.kind === "announcement").length,
        conversations: conversations.length,
        likes: totalLikes,
        comments: totalComments
      },
      users: formattedUsers,
      posts: activePosts
        .filter(post => post.kind !== "announcement")
        .slice(0, 12)
        .map(post => formatPost(ensurePostCollections(post), req.userId, true))
    });
  } catch (error) {
    console.log(error);
    res.json({ message: "Something went wrong." });
  }
});

app.get("/membership/plans", (req, res) => {
  res.json(Object.values(MEMBERSHIP_PLANS));
});

app.post("/membership/subscribe", verifyToken, async (req, res) => {
  try {
    const requestedTier = String(req.body.tier || "").toLowerCase();
    const plan = MEMBERSHIP_PLANS[requestedTier];

    if (!plan || requestedTier === "free") {
      return res.json({ message: "Choose a paid membership plan to continue." });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.json({ message: "User not found." });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    user.membership = {
      tier: plan.tier,
      boostCredits: plan.boostCredits,
      startedAt: now,
      expiresAt
    };

    addNotification(user, "membership", `Your ${plan.label} membership is active with ${plan.boostCredits} boost credits.`);
    await user.save();

    res.json({
      message: `${plan.label} membership activated.`,
      membership: getMembershipSnapshot(user)
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isRemoved: { $ne: true } });

    if (!user) {
      return res.json({ message: "User not found." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetLink = `http://localhost:5500/reset.html?token=${token}`;

    await transporter.sendMail({
      to: email,
      subject: "Reset your Hearthline password",
      html: `
        <div style="font-family:Segoe UI,sans-serif;line-height:1.6;color:#1f2937;">
          <h2>Password Reset</h2>
          <p>We received a request to reset your password.</p>
          <p>Use the link below to choose a new password:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 10 minutes.</p>
        </div>
      `
    });

    res.json({ message: "Reset link sent to your email." });
  } catch (error) {
    console.log(error);
    res.json({ message: "Something went wrong." });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
      isRemoved: { $ne: true }
    });

    if (!user) {
      return res.json({ message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/create-post", verifyToken, async (req, res) => {
  try {
    const payload = sanitizePostPayload(req.body);

    if (payload.status === "published" && (!payload.title || !payload.content)) {
      return res.json({ message: "Add both a title and content before publishing." });
    }

    if (payload.status === "draft" && !payload.title && !payload.content) {
      return res.json({ message: "Write at least a title or some content before saving a draft." });
    }

    const post = new Post({
      ...payload,
      boost: {
        isActive: false,
        tierSnapshot: "free"
      },
      userId: req.userId
    });

    await post.save();

    res.json({
      message: payload.status === "draft" ? "Draft saved successfully." : "Post created successfully.",
      postId: post._id
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.get("/posts", attachUserIfPresent, async (req, res) => {
  try {
    const viewer = req.userId ? await User.findById(req.userId).select("email") : null;
    const viewerIsAdmin = isAdminUser(viewer);
    const workspaceMode = String(req.query.workspace || "").toLowerCase() === "true";
    const queryText = String(req.query.q || "").trim().toLowerCase();
    const sortMode = String(req.query.sort || "recent");
    const posts = await Post.find()
      .populate("userId", "name email avatarId accountType followers following pendingFollowRequests")
      .sort({ updatedAt: -1, createdAt: -1 });

    let visiblePosts = posts
      .map(ensurePostCollections)
      .filter(post => post.userId)
      .filter(post => canViewPost(post, req.userId, viewerIsAdmin));

    if (!workspaceMode) {
      visiblePosts = visiblePosts.filter(post => (post.status || "published") === "published");
    }

    if (queryText) {
      visiblePosts = visiblePosts.filter(post => {
        const authorName = String(post.userId?.name || "").toLowerCase();
        const title = String(post.title || "").toLowerCase();
        const content = String(post.content || "").toLowerCase();
        return title.includes(queryText) || content.includes(queryText) || authorName.includes(queryText);
      });
    }

    visiblePosts.sort((left, right) => {
      const leftBoost = isBoostActive(left);
      const rightBoost = isBoostActive(right);

      if (leftBoost !== rightBoost) {
        return rightBoost ? 1 : -1;
      }

      if (sortMode === "liked") {
        return (right.likes?.length || 0) - (left.likes?.length || 0) || new Date(right.createdAt) - new Date(left.createdAt);
      }
      if (sortMode === "commented") {
        return (right.comments?.length || 0) - (left.comments?.length || 0) || new Date(right.createdAt) - new Date(left.createdAt);
      }
      return new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt);
    });

    res.json(visiblePosts.map(post => formatPost(post, req.userId, viewerIsAdmin)));
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.get("/posts/:id", attachUserIfPresent, async (req, res) => {
  try {
    const viewer = req.userId ? await User.findById(req.userId).select("email") : null;
    const viewerIsAdmin = isAdminUser(viewer);
    const post = await populatePostRelations(Post.findById(req.params.id));

    ensurePostCollections(post);

    if (!post || !post.userId) {
      return res.json({ message: "Post not found." });
    }

    if (!canViewPost(post, req.userId, viewerIsAdmin)) {
      return res.json({ message: "You do not have access to this post." });
    }

    res.json({ post: formatPost(post, req.userId, viewerIsAdmin, { includeComments: true }) });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.get("/admin-announcement", async (req, res) => {
  try {
    const adminUser = await findAdminUser();

    if (!adminUser) {
      return res.json({ announcement: null });
    }

    const latestAdminPost = await Post.findOne({
      userId: adminUser._id,
      kind: "announcement",
      status: "published"
    }).sort({ createdAt: -1 });

    if (!latestAdminPost) {
      return res.json({ announcement: null });
    }

    res.json({
      announcement: {
        _id: latestAdminPost._id,
        title: latestAdminPost.title,
        content: latestAdminPost.content,
        createdAt: latestAdminPost.createdAt,
        author: {
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email
        }
      }
    });
  } catch (error) {
    res.json({ announcement: null });
  }
});

app.post("/posts/:id/boost", verifyToken, async (req, res) => {
  try {
    const [user, post] = await Promise.all([
      User.findById(req.userId),
      Post.findById(req.params.id)
    ]);

    if (!user || !post) {
      return res.json({ message: "Post not found." });
    }

    if (String(post.userId) !== String(req.userId)) {
      return res.json({ message: "You can only boost your own post." });
    }

    const membership = getMembershipSnapshot(user);

    if (membership.tier === "free") {
      return res.json({ message: "Upgrade to a membership before boosting posts." });
    }

    if (membership.boostCredits <= 0) {
      return res.json({ message: "You have used all available boost credits." });
    }

    if (isBoostActive(post)) {
      return res.json({ message: "This post is already boosted right now." });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    post.boost = {
      isActive: true,
      boostedAt: now,
      expiresAt,
      tierSnapshot: membership.tier
    };
    user.membership.boostCredits = Math.max(0, membership.boostCredits - 1);

    await Promise.all([post.save(), user.save()]);

    const actingUser = await User.findById(req.userId).select("email");
    const populatedPost = await populatePostRelations(Post.findById(post._id));

    res.json({
      message: "Post boost activated for 7 days.",
      membership: getMembershipSnapshot(user),
      post: formatPost(populatedPost, req.userId, isAdminUser(actingUser))
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.delete("/delete-post/:id", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("email");
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.json({ message: "Post not found." });
    }

    if (String(post.userId) !== String(req.userId) && !isAdminUser(actingUser)) {
      return res.json({ message: "You can only delete your own posts." });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully." });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.put("/update-post/:id", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("email");
    const post = await Post.findById(req.params.id);
    const payload = sanitizePostPayload(req.body);

    if (!post) {
      return res.json({ message: "Post not found." });
    }

    if (String(post.userId) !== String(req.userId) && !isAdminUser(actingUser)) {
      return res.json({ message: "You can only edit your own posts." });
    }

    if (payload.status === "published" && (!payload.title || !payload.content)) {
      return res.json({ message: "Add both a title and content before publishing." });
    }

    if (payload.status === "draft" && !payload.title && !payload.content) {
      return res.json({ message: "Write at least a title or some content before saving a draft." });
    }

    await Post.findByIdAndUpdate(req.params.id, payload);

    res.json({
      message: payload.status === "draft" ? "Draft updated successfully." : "Post updated successfully."
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/posts/:id/toggle-like", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("email");
    const viewerIsAdmin = isAdminUser(actingUser);
    const post = await populatePostRelations(Post.findById(req.params.id));

    ensurePostCollections(post);

    if (!post || !post.userId) {
      return res.json({ message: "Post not found." });
    }

    if (!canViewPost(post, req.userId, viewerIsAdmin)) {
      return res.json({ message: "You do not have access to this post." });
    }

    const alreadyLiked = post.likes.some(id => String(id) === String(req.userId));
    post.likes = alreadyLiked
      ? post.likes.filter(id => String(id) !== String(req.userId))
      : [...post.likes, req.userId];

    await post.save();

    res.json({
      message: alreadyLiked ? "Like removed." : "Post liked.",
      post: formatPost(post, req.userId, viewerIsAdmin)
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/posts/:id/toggle-bookmark", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("email");
    const viewerIsAdmin = isAdminUser(actingUser);
    const post = await populatePostRelations(Post.findById(req.params.id));

    ensurePostCollections(post);

    if (!post || !post.userId) {
      return res.json({ message: "Post not found." });
    }

    if (!canViewPost(post, req.userId, viewerIsAdmin)) {
      return res.json({ message: "You do not have access to this post." });
    }

    const alreadyBookmarked = post.bookmarks.some(id => String(id) === String(req.userId));
    post.bookmarks = alreadyBookmarked
      ? post.bookmarks.filter(id => String(id) !== String(req.userId))
      : [...post.bookmarks, req.userId];

    await post.save();

    res.json({
      message: alreadyBookmarked ? "Bookmark removed." : "Post saved to bookmarks.",
      post: formatPost(post, req.userId, viewerIsAdmin)
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/posts/:id/comments", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("name email avatarId");
    const viewerIsAdmin = isAdminUser(actingUser);
    const post = await populatePostRelations(Post.findById(req.params.id));
    const content = String(req.body.content || "").trim();

    ensurePostCollections(post);

    if (!post || !post.userId) {
      return res.json({ message: "Post not found." });
    }

    if (!content) {
      return res.json({ message: "Write a comment before posting it." });
    }

    if (!canViewPost(post, req.userId, viewerIsAdmin)) {
      return res.json({ message: "You do not have access to this post." });
    }

    post.comments.push({
      userId: req.userId,
      content,
      createdAt: new Date()
    });

    await post.save();

    if (!isOwnResource(post.userId?._id || post.userId, req.userId)) {
      const postOwner = await User.findById(post.userId._id || post.userId);
      if (postOwner) {
        addNotification(
          postOwner,
          "comment",
          `${actingUser?.name || "Someone"} commented on your post "${post.title || "Untitled Article"}".`
        );
        await postOwner.save();
      }
    }

    const populatedPost = await populatePostRelations(Post.findById(post._id));

    res.json({
      message: "Comment added.",
      post: formatPost(populatedPost, req.userId, viewerIsAdmin, { includeComments: true })
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/posts/:postId/comments/:commentId/toggle-like", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("email");
    const viewerIsAdmin = isAdminUser(actingUser);
    const post = await populatePostRelations(Post.findById(req.params.postId));

    ensurePostCollections(post);

    if (!post || !post.userId) {
      return res.json({ message: "Post not found." });
    }

    if (!canViewPost(post, req.userId, viewerIsAdmin)) {
      return res.json({ message: "You do not have access to this post." });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.json({ message: "Comment not found." });
    }

    comment.likes = Array.isArray(comment.likes) ? comment.likes : [];
    const alreadyLiked = comment.likes.some(id => String(id) === String(req.userId));
    comment.likes = alreadyLiked
      ? comment.likes.filter(id => String(id) !== String(req.userId))
      : [...comment.likes, req.userId];

    await post.save();

    const populatedPost = await populatePostRelations(Post.findById(post._id));
    res.json({
      message: alreadyLiked ? "Comment like removed." : "Comment liked.",
      post: formatPost(populatedPost, req.userId, viewerIsAdmin, { includeComments: true })
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/posts/:postId/comments/:commentId/replies", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("name email avatarId");
    const viewerIsAdmin = isAdminUser(actingUser);
    const post = await populatePostRelations(Post.findById(req.params.postId));
    const content = String(req.body.content || "").trim();

    ensurePostCollections(post);

    if (!post || !post.userId) {
      return res.json({ message: "Post not found." });
    }

    if (!content) {
      return res.json({ message: "Write a reply before posting it." });
    }

    if (!canViewPost(post, req.userId, viewerIsAdmin)) {
      return res.json({ message: "You do not have access to this post." });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.json({ message: "Comment not found." });
    }

    comment.replies = Array.isArray(comment.replies) ? comment.replies : [];
    comment.replies.push({
      userId: req.userId,
      content,
      createdAt: new Date()
    });

    await post.save();

    const commentOwnerId = comment.userId?._id || comment.userId;
    if (!isOwnResource(commentOwnerId, req.userId)) {
      const commentOwner = await User.findById(commentOwnerId);
      if (commentOwner) {
        addNotification(
          commentOwner,
          "reply",
          `${actingUser?.name || "Someone"} replied to your comment on "${post.title || "Untitled Article"}".`
        );
        await commentOwner.save();
      }
    }

    const populatedPost = await populatePostRelations(Post.findById(post._id));
    res.json({
      message: "Reply added.",
      post: formatPost(populatedPost, req.userId, viewerIsAdmin, { includeComments: true })
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/posts/:postId/comments/:commentId/replies/:replyId/toggle-like", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("email");
    const viewerIsAdmin = isAdminUser(actingUser);
    const post = await populatePostRelations(Post.findById(req.params.postId));

    ensurePostCollections(post);

    if (!post || !post.userId) {
      return res.json({ message: "Post not found." });
    }

    if (!canViewPost(post, req.userId, viewerIsAdmin)) {
      return res.json({ message: "You do not have access to this post." });
    }

    const comment = post.comments.id(req.params.commentId);
    const reply = comment?.replies?.id(req.params.replyId);

    if (!comment || !reply) {
      return res.json({ message: "Reply not found." });
    }

    reply.likes = Array.isArray(reply.likes) ? reply.likes : [];
    const alreadyLiked = reply.likes.some(id => String(id) === String(req.userId));
    reply.likes = alreadyLiked
      ? reply.likes.filter(id => String(id) !== String(req.userId))
      : [...reply.likes, req.userId];

    await post.save();

    const populatedPost = await populatePostRelations(Post.findById(post._id));
    res.json({
      message: alreadyLiked ? "Reply like removed." : "Reply liked.",
      post: formatPost(populatedPost, req.userId, viewerIsAdmin, { includeComments: true })
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.delete("/posts/:postId/comments/:commentId", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("email");
    const viewerIsAdmin = isAdminUser(actingUser);
    const post = await populatePostRelations(Post.findById(req.params.postId));

    ensurePostCollections(post);

    if (!post || !post.userId) {
      return res.json({ message: "Post not found." });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.json({ message: "Comment not found." });
    }

    const commentOwnerId = comment.userId?._id || comment.userId;
    const canDelete = viewerIsAdmin || isOwnResource(commentOwnerId, req.userId) || isOwnResource(post.userId._id, req.userId);

    if (!canDelete) {
      return res.json({ message: "You cannot remove this comment." });
    }

    comment.deleteOne();
    await post.save();

    const populatedPost = await populatePostRelations(Post.findById(post._id));

    res.json({
      message: "Comment removed.",
      post: formatPost(populatedPost, req.userId, viewerIsAdmin, { includeComments: true })
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.delete("/posts/:postId/comments/:commentId/replies/:replyId", verifyToken, async (req, res) => {
  try {
    const actingUser = await User.findById(req.userId).select("email");
    const viewerIsAdmin = isAdminUser(actingUser);
    const post = await populatePostRelations(Post.findById(req.params.postId));

    ensurePostCollections(post);

    if (!post || !post.userId) {
      return res.json({ message: "Post not found." });
    }

    const comment = post.comments.id(req.params.commentId);
    const reply = comment?.replies?.id(req.params.replyId);

    if (!comment || !reply) {
      return res.json({ message: "Reply not found." });
    }

    const replyOwnerId = reply.userId?._id || reply.userId;
    const canDelete = viewerIsAdmin
      || isOwnResource(replyOwnerId, req.userId)
      || isOwnResource(comment.userId?._id || comment.userId, req.userId)
      || isOwnResource(post.userId._id, req.userId);

    if (!canDelete) {
      return res.json({ message: "You cannot remove this reply." });
    }

    reply.deleteOne();
    await post.save();

    const populatedPost = await populatePostRelations(Post.findById(post._id));
    res.json({
      message: "Reply removed.",
      post: formatPost(populatedPost, req.userId, viewerIsAdmin, { includeComments: true })
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/follow/:userId", verifyToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (String(targetUserId) === String(req.userId)) {
      return res.json({ message: "You cannot follow yourself." });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
      return res.json({ message: "User not found." });
    }

    const isAlreadyFollowing = currentUser.following.some(id => String(id) === String(targetUserId));
    const hasPendingRequest = targetUser.pendingFollowRequests?.some(request => String(request.requester) === String(req.userId));
    const isApprovedFollower = targetUser.followers.some(id => String(id) === String(req.userId));

    if (targetUser.accountType === "private" && isAlreadyFollowing && !isApprovedFollower) {
      currentUser.following = currentUser.following.filter(id => String(id) !== String(targetUserId));
      await currentUser.save();
    }

    if (isAlreadyFollowing && (targetUser.accountType !== "private" || isApprovedFollower)) {
      return res.json({
        message: `You are already following ${targetUser.name}.`,
        following: true
      });
    }

    if (targetUser.accountType === "private") {
      if (hasPendingRequest) {
        return res.json({
          message: `Your follow request is still pending for ${targetUser.name}.`,
          requested: true
        });
      }

      targetUser.pendingFollowRequests.push({
        requester: currentUser._id,
        createdAt: new Date()
      });
      addNotification(
        targetUser,
        "follow_request",
        `${currentUser.name} sent you a new follow request.`
      );
      await targetUser.save();

      return res.json({
        message: `Follow request sent to ${targetUser.name}.`,
        requested: true,
        following: false
      });
    }

    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);
    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      message: `You are now following ${targetUser.name}.`,
      following: true
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/unfollow/:userId", verifyToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
      return res.json({ message: "User not found." });
    }

    currentUser.following = currentUser.following.filter(id => String(id) !== String(targetUserId));
    targetUser.followers = targetUser.followers.filter(id => String(id) !== String(req.userId));

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      message: `You unfollowed ${targetUser.name}.`,
      following: false
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/follow-request/:requesterId/approve", verifyToken, async (req, res) => {
  try {
    const requesterId = req.params.requesterId;

    const [currentUser, requesterUser] = await Promise.all([
      User.findById(req.userId),
      User.findById(requesterId)
    ]);

    if (!currentUser || !requesterUser) {
      return res.json({ message: "User not found." });
    }

    const requestExists = currentUser.pendingFollowRequests?.some(
      request => String(request.requester) === String(requesterId)
    );

    if (!requestExists) {
      return res.json({ message: "Follow request not found." });
    }

    currentUser.pendingFollowRequests = currentUser.pendingFollowRequests.filter(
      request => String(request.requester) !== String(requesterId)
    );

    const isAlreadyFollower = currentUser.followers.some(id => String(id) === String(requesterId));
    const isAlreadyFollowing = requesterUser.following.some(id => String(id) === String(req.userId));

    if (!isAlreadyFollower) {
      currentUser.followers.push(requesterUser._id);
    }

    if (!isAlreadyFollowing) {
      requesterUser.following.push(currentUser._id);
    }

    addNotification(
      requesterUser,
      "follow_request_accepted",
      `${currentUser.name} accepted your follow request.`
    );

    await Promise.all([currentUser.save(), requesterUser.save()]);

    res.json({
      message: `${requesterUser.name} can now view your private posts.`,
      approved: true
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/follow-request/:requesterId/reject", verifyToken, async (req, res) => {
  try {
    const requesterId = req.params.requesterId;
    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      return res.json({ message: "User not found." });
    }

    const requestExists = currentUser.pendingFollowRequests?.some(
      request => String(request.requester) === String(requesterId)
    );

    if (!requestExists) {
      return res.json({ message: "Follow request not found." });
    }

    currentUser.pendingFollowRequests = currentUser.pendingFollowRequests.filter(
      request => String(request.requester) !== String(requesterId)
    );

    await currentUser.save();

    res.json({
      message: "Follow request ignored.",
      rejected: true
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.get("/conversations", verifyToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    })
      .populate("participants", "name email avatarId")
      .populate("messages.sender", "name email avatarId")
      .sort({ updatedAt: -1 });

    res.json(conversations.map(conversation => formatConversation(conversation, req.userId)));
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.get("/conversations/:userId", verifyToken, async (req, res) => {
  try {
    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId).select("following email"),
      User.findById(req.params.userId).select("name email avatarId following isRemoved")
    ]);

    if (!currentUser || !targetUser || targetUser.isRemoved) {
      return res.json({ message: "User not found." });
    }

    if (!canUsersMessageEachOther(currentUser, targetUser, isAdminUser(currentUser))) {
      return res.json({ message: "Follow each other first to start chatting." });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, req.params.userId] }
    })
      .populate("participants", "name email avatarId")
      .populate("messages.sender", "name email avatarId");

    if (!conversation) {
      return res.json({
        conversation: {
          _id: null,
          otherUser: {
            _id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
            avatarId: targetUser.avatarId
          },
          messages: [],
          lastMessage: null
        }
      });
    }

    res.json({ conversation: formatConversation(conversation, req.userId) });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.post("/conversations/:userId/messages", verifyToken, async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();

    if (!text) {
      return res.json({ message: "Write a message before sending it." });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId).select("name following email"),
      User.findById(req.params.userId).select("name email avatarId following isRemoved notifications")
    ]);

    if (!currentUser || !targetUser || targetUser.isRemoved) {
      return res.json({ message: "User not found." });
    }

    if (!canUsersMessageEachOther(currentUser, targetUser, isAdminUser(currentUser))) {
      return res.json({ message: "Follow each other first to start chatting." });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, req.params.userId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.userId, req.params.userId],
        messages: []
      });
    }

    conversation.messages.push({
      sender: req.userId,
      text,
      createdAt: new Date()
    });

    await conversation.save();

    addNotification(targetUser, "message", `${currentUser.name} sent you a new message.`);
    await targetUser.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name email avatarId")
      .populate("messages.sender", "name email avatarId");

    res.json({
      message: "Message sent.",
      conversation: formatConversation(populatedConversation, req.userId)
    });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.delete("/conversations/:userId", verifyToken, async (req, res) => {
  try {
    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId).select("email"),
      User.findById(req.params.userId).select("name email isRemoved")
    ]);

    if (!currentUser || !targetUser || targetUser.isRemoved) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [req.userId, req.params.userId] }
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    await Conversation.deleteOne({ _id: conversation._id });

    res.json({
      message: `Conversation with ${targetUser.name || "this user"} deleted.`
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong." });
  }
});

app.delete("/admin/remove-user/:userId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.json({ message: "User not found." });
    }

    if (isAdminUser(targetUser)) {
      return res.json({ message: "The creator account cannot be removed." });
    }

    await Promise.all([
      Post.deleteMany({ userId: targetUser._id }),
      Post.updateMany(
        {},
        {
          $pull: {
            comments: { userId: targetUser._id },
            "comments.$[].replies": { userId: targetUser._id }
          }
        }
      ),
      Conversation.deleteMany({ participants: targetUser._id }),
      User.updateMany(
        { _id: { $ne: targetUser._id } },
        {
          $pull: {
            followers: targetUser._id,
            following: targetUser._id,
            pendingFollowRequests: { requester: targetUser._id }
          }
        }
      )
    ]);

    targetUser.followers = [];
    targetUser.following = [];
    targetUser.isRemoved = true;
    targetUser.removedAt = new Date();
    targetUser.removedReason = "Your account has been removed by the admin. Please contact the creator if you believe this was a mistake.";
    targetUser.resetToken = undefined;
    targetUser.resetTokenExpire = undefined;

    await targetUser.save();

    res.json({ message: `${targetUser.name} has been removed by admin.` });
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Server started on port 5000");
});
