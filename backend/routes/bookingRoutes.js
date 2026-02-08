import express from "express";
import {
  createBooking,
  getMyBookings,
  checkIn,
  checkOut,
  getAllBookings,
  confirmBooking
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = express.Router();

// user
router.post("/", protect, allowRoles("user"), createBooking);
router.get("/me", protect, allowRoles("user"), getMyBookings);

// admin/staff
router.get("/", protect, allowRoles("admin", "staff"), getAllBookings);
router.put("/:id/check-in", protect, allowRoles("admin", "staff"), checkIn);
router.put("/:id/check-out", protect, allowRoles("admin", "staff"), checkOut);
router.put("/:id/confirm", protect, allowRoles("admin"), confirmBooking);

export default router;
