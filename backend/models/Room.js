import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    type: { type: String, required: true }, // single, double, suite
    price: { type: Number, required: function() { return this.status !== 'COMING_SOON'; } }, // Price not required for coming soon rooms
    capacity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "NEEDS_CLEANING", "COMING_SOON", "WORKING_IN_PROGRESS"],
      default: "AVAILABLE"
    },
    images: [{ type: String }], // base64 or URLs
    features: [{ type: String }],
    description: { type: String }, // Description for coming soon rooms
    expectedAvailability: { type: Date } // When the room is expected to be available
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
