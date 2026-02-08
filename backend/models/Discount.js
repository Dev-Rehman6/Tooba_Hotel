import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["WEEKEND", "SEASONAL", "MULTI_ROOM", "CUSTOM"],
      required: true 
    },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    
    // For seasonal discounts
    season: { 
      type: String, 
      enum: ["SUMMER", "WINTER", "SPRING", "FALL"],
      required: false
    },
    
    // For multi-room discounts
    minRooms: { type: Number, default: 1 },
    
    // Date range for custom discounts
    startDate: { type: Date },
    endDate: { type: Date },
    
    // Priority (higher number = higher priority when multiple discounts apply)
    priority: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Discount", discountSchema);
