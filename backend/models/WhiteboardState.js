
import mongoose from "mongoose";

const whiteboardStateSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const WhiteboardState = mongoose.model(
  "WhiteboardState",
  whiteboardStateSchema
);

export default WhiteboardState;
