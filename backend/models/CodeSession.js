
import mongoose from "mongoose";

const codeSessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // Binary-safe storage for the complete Yjs document state.
    documentState: {
      type: Buffer,
      required: true,
    },

    participants: {
      type: [String],
      default: [],
    },

    lastSavedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CodeSession = mongoose.model("CodeSession", codeSessionSchema);

export default CodeSession;
