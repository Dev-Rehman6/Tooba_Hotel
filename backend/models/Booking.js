import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    roomQuantity: { type: Number, default: 1 },
    paymentMethod: { type: String, enum: ["Online", "Cash"], default: "Online" },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"],
      default: "PENDING"
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "PARTIAL"],
      default: "UNPAID"
    },
    // Discount information
    appliedDiscounts: [{
      discount: { type: mongoose.Schema.Types.ObjectId, ref: "Discount" },
      name: { type: String },
      percentage: { type: Number },
      amount: { type: Number }
    }],
    discountTotal: { type: Number, default: 0 },
    originalAmount: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
