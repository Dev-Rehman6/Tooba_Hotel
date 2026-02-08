import express from "express";
import { 
  createDiscount, 
  getAllDiscounts, 
  getActiveDiscounts,
  updateDiscount, 
  deleteDiscount,
  calculateApplicableDiscounts
} from "../controllers/discountController.js";
import { protect } from "../middleware/auth.js";
import { admin } from "../middleware/roles.js";

const router = express.Router();

// Public routes
router.get("/active", getActiveDiscounts);
router.post("/calculate", calculateApplicableDiscounts);

// Admin routes
router.post("/", protect, admin, createDiscount);
router.get("/", protect, admin, getAllDiscounts);
router.put("/:id", protect, admin, updateDiscount);
router.delete("/:id", protect, admin, deleteDiscount);

export default router;
