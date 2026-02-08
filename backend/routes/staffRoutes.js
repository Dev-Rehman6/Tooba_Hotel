import express from "express";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import Room from "../models/Room.js";

const router = express.Router();

// Get staff tasks
router.get('/tasks', protect, allowRoles('staff'), async (req, res) => {
    try {
        const tasks = await Room.find({ 
            status: { $in: ['MAINTENANCE', 'WORKING_IN_PROGRESS', 'NEEDS_CLEANING', 'OCCUPIED'] } 
        });
        res.json(tasks);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

// Start work on a room
router.patch('/start-work/:id', protect, allowRoles('staff'), async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id, 
            { status: 'WORKING_IN_PROGRESS' }, 
            { new: true }
        );
        res.json({ message: "Work in progress", room });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

// Complete work on a room
router.patch('/complete-work/:id', protect, allowRoles('staff'), async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id, 
            { status: 'AVAILABLE' }, 
            { new: true }
        );
        res.json({ message: "Room is now Available", room });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

// Mark room as cleaned
router.patch('/room/cleaned/:id', protect, allowRoles('staff'), async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: "Room not found" });

        room.status = 'AVAILABLE'; 
        await room.save();
        
        res.json({ message: "Housekeeping complete. Room is ready.", room });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
