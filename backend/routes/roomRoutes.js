import express from "express";
import {
  createRoom,
  getRooms,
  getAvailableRooms,
  getAllRoomsWithBookingInfo,
  updateRoom,
  deleteRoom,
  getRoomsNeedingCleaning,
  markRoomCleaned,
  setRoomForCleaning,
  setRoomForMaintenance,
  makeRoomAvailable,
  startMaintenanceWork,
  completeMaintenanceWork,
  createComingSoonRoom,
  getComingSoonRooms,
  updateComingSoonRoom,
  makeComingSoonAvailable,
  updateRoomStatusesManually
} from "../controllers/roomController.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = express.Router();

router.get("/", protect, getRooms);
router.get("/available", getAvailableRooms);
router.get("/all-with-booking-info", getAllRoomsWithBookingInfo);
router.get("/cleaning", protect, allowRoles("staff", "admin"), getRoomsNeedingCleaning);

// Manual room status update
router.patch("/update-statuses", protect, allowRoles("admin"), updateRoomStatusesManually);

// Coming Soon Routes
router.post("/coming-soon", protect, allowRoles("admin"), createComingSoonRoom);
router.get("/coming-soon", protect, allowRoles("admin"), getComingSoonRooms);
router.patch("/coming-soon/:id", protect, allowRoles("admin"), updateComingSoonRoom);
router.patch("/make-available/:id", protect, allowRoles("admin"), makeComingSoonAvailable);

router.post("/", protect, allowRoles("admin"), createRoom);
router.put("/:id", protect, allowRoles("admin", "staff"), updateRoom);
router.put("/:id/clean", protect, allowRoles("staff", "admin"), markRoomCleaned);
router.put("/:id/set-cleaning", protect, allowRoles("admin"), setRoomForCleaning);
router.put("/:id/set-maintenance", protect, allowRoles("admin"), setRoomForMaintenance);
router.put("/:id/make-available", protect, allowRoles("admin"), makeRoomAvailable);
router.put("/:id/start-work", protect, allowRoles("staff"), startMaintenanceWork);
router.put("/:id/complete-work", protect, allowRoles("staff"), completeMaintenanceWork);
router.delete("/:id", protect, allowRoles("admin"), deleteRoom);

export default router;
