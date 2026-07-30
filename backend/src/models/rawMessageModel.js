import mongoose from "mongoose";

const rawMessageSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      required: true,
      index: true,
    },
    channelTitle: {
      type: String,
      default: null,
      index: true,
    },
    messageId: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    hasText: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasMedia: {
      type: Boolean,
      default: false,
      index: true,
    },
    mediaType: {
      type: String,
      default: null,
    },
    textLength: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: null,
    },
    fetchedAt: {
      type: Date,
      required: true,
    },
    isTestSignal: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    collection: "rawMessages",
    timestamps: true,
  }
);

rawMessageSchema.index(
  {
    channel: 1,
    messageId: 1,
  },
  {
    unique: true,
  }
);

// Automatic 24-hour TTL Retention Policy for raw messages to protect MongoDB Free Tier storage
rawMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const RawMessage =
  mongoose.models.RawMessage || mongoose.model("RawMessage", rawMessageSchema);
