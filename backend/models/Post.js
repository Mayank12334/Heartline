const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    trim: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, { _id: true });

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    trim: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  replies: [replySchema],
  replyToUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { _id: true });

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: ""
  },
  content: {
    type: String,
    trim: true,
    default: ""
  },
  excerpt: {
    type: String,
    trim: true,
    default: ""
  },
  status: {
    type: String,
    enum: ["published", "draft"],
    default: "published"
  },
  kind: {
    type: String,
    enum: ["post", "announcement"],
    default: "post"
  },
  boost: {
    isActive: {
      type: Boolean,
      default: false
    },
    boostedAt: Date,
    expiresAt: Date,
    tierSnapshot: {
      type: String,
      enum: ["free", "starter", "pro", "business"],
      default: "free"
    }
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  comments: [commentSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Post", postSchema);
