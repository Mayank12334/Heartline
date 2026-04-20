const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  avatarId: {
    type: String,
    default: "avatar-01"
  },
  accountType: {
    type: String,
    enum: ["public", "private"],
    default: "public"
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  pendingFollowRequests: [{
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  notifications: [{
    type: {
      type: String
    },
    message: String,
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  membership: {
    tier: {
      type: String,
      enum: ["free", "starter", "pro", "business"],
      default: "free"
    },
    boostCredits: {
      type: Number,
      default: 0
    },
    startedAt: Date,
    expiresAt: Date
  },
  isRemoved: {
    type: Boolean,
    default: false
  },
  removedAt: Date,
  removedReason: String,
  isVerified: {
    type: Boolean,
    default: true
  },
  resetToken: String,
  resetTokenExpire: Date
});

module.exports = mongoose.model("User", userSchema);
