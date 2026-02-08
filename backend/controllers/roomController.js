import Room from "../models/Room.js";
import Booking from "../models/Booking.js";

// Helper function to update room statuses based on current bookings
const updateRoomStatusesBasedOnBookings = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    // Find all confirmed bookings for today
    const todaysBookings = await Booking.find({
      status: { $in: ["CONFIRMED", "CHECKED_IN"] },
      checkIn: { $lte: tomorrow },
      checkOut: { $gt: today }
    }).populate('room');
    
    // Get all rooms that should be occupied today
    const occupiedRoomIds = todaysBookings.map(booking => booking.room._id);
    
    // Update rooms to OCCUPIED if they have bookings today and are currently AVAILABLE
    await Room.updateMany(
      { 
        _id: { $in: occupiedRoomIds },
        status: { $in: ["AVAILABLE", "NEEDS_CLEANING"] }
      },
      { status: "OCCUPIED" }
    );
    
    // Update rooms to AVAILABLE if they don't have bookings today and are currently OCCUPIED
    // (but only if they're not in maintenance or cleaning)
    const allRooms = await Room.find({ status: "OCCUPIED" });
    for (const room of allRooms) {
      if (!occupiedRoomIds.some(id => id.toString() === room._id.toString())) {
        // This room is marked occupied but has no booking today
        room.status = "AVAILABLE";
        await room.save();
      }
    }
    
  } catch (error) {
    console.error('Error updating room statuses:', error);
  }
};

export const createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRooms = async (req, res) => {
  try {
    // Update room statuses based on current bookings
    await updateRoomStatusesBasedOnBookings();
    
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAvailableRooms = async (req, res) => {
  try {
    // Update room statuses based on current bookings
    await updateRoomStatusesBasedOnBookings();
    
    // Show both AVAILABLE and NEEDS_CLEANING rooms as available to users
    const rooms = await Room.find({ 
      status: { $in: ["AVAILABLE", "NEEDS_CLEANING"] } 
    });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all rooms with booking information for user booking interface
export const getAllRoomsWithBookingInfo = async (req, res) => {
  try {
    // Update room statuses based on current bookings
    await updateRoomStatusesBasedOnBookings();
    
    // Get all rooms except coming soon and maintenance
    const rooms = await Room.find({ 
      status: { $nin: ["COMING_SOON", "MAINTENANCE", "WORKING_IN_PROGRESS"] } 
    });

    // Get current bookings for each room
    const roomsWithBookingInfo = await Promise.all(
      rooms.map(async (room) => {
        const currentBookings = await Booking.find({
          room: room._id,
          status: { $in: ["CONFIRMED", "CHECKED_IN"] },
          checkOut: { $gte: new Date() } // Only future and current bookings
        }).sort({ checkIn: 1 });

        return {
          ...room.toObject(),
          currentBookings: currentBookings.map(booking => ({
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            status: booking.status
          })),
          isBookable: room.status === "AVAILABLE" || room.status === "NEEDS_CLEANING"
        };
      })
    );

    res.json(roomsWithBookingInfo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get rooms that need cleaning for staff dashboard
export const getRoomsNeedingCleaning = async (req, res) => {
  try {
    const rooms = await Room.find({ status: "NEEDS_CLEANING" });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Set room for cleaning (admin action)
export const setRoomForCleaning = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.status = "NEEDS_CLEANING";
    await room.save();

    res.json({ message: "Room sent for cleaning", room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Set room for maintenance (admin action)
export const setRoomForMaintenance = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.status = "MAINTENANCE";
    await room.save();

    res.json({ message: "Room sent for maintenance", room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark room as cleaned (staff action)
export const markRoomCleaned = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    
    if (room.status !== "NEEDS_CLEANING") {
      return res.status(400).json({ message: "Room is not marked for cleaning" });
    }

    room.status = "AVAILABLE";
    await room.save();

    res.json({ message: "Room marked as cleaned and available", room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Start maintenance work (staff action)
export const startMaintenanceWork = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    
    if (room.status !== "MAINTENANCE") {
      return res.status(400).json({ message: "Room is not in maintenance" });
    }

    room.status = "WORKING_IN_PROGRESS";
    await room.save();

    res.json({ message: "Maintenance work started", room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Complete maintenance work (staff action)
export const completeMaintenanceWork = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    
    if (room.status !== "WORKING_IN_PROGRESS") {
      return res.status(400).json({ message: "Room is not in progress" });
    }

    room.status = "AVAILABLE";
    await room.save();

    res.json({ message: "Maintenance work completed, room available", room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Make room available (admin action)
export const makeRoomAvailable = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.status = "AVAILABLE";
    await room.save();

    res.json({ message: "Room is now available", room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    console.log('Updating room with ID:', req.params.id);
    console.log('Update data:', req.body);
    
    // Check if room exists first
    const existingRoom = await Room.findById(req.params.id);
    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    // If roomNumber is being changed, check for duplicates
    if (req.body.roomNumber && req.body.roomNumber !== existingRoom.roomNumber) {
      const duplicateRoom = await Room.findOne({ 
        roomNumber: req.body.roomNumber,
        _id: { $ne: req.params.id }
      });
      if (duplicateRoom) {
        return res.status(400).json({ message: "Room number already exists" });
      }
    }
    
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    console.log('Room updated successfully:', room);
    res.json(room);
  } catch (err) {
    console.error('Update room error:', err);
    if (err.code === 11000) {
      res.status(400).json({ message: "Room number already exists" });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- COMING SOON ROOM FUNCTIONS ---

export const createComingSoonRoom = async (req, res) => {
  try {
    const { roomNumber, type, capacity, description, expectedAvailability, images, features } = req.body;
    
    // Check if room number already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const comingSoonRoom = await Room.create({
      roomNumber,
      type,
      capacity,
      description,
      expectedAvailability,
      images: images || [],
      features: features || [],
      status: 'COMING_SOON',
      price: 0 // Will be set when made available
    });

    res.status(201).json(comingSoonRoom);
  } catch (error) {
    console.error('Error creating coming soon room:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getComingSoonRooms = async (req, res) => {
  try {
    const comingSoonRooms = await Room.find({ status: 'COMING_SOON' }).lean();
    res.json(comingSoonRooms);
  } catch (error) {
    console.error('Error fetching coming soon rooms:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateComingSoonRoom = async (req, res) => {
  try {
    const { description, expectedAvailability, images, features, type, capacity } = req.body;
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'COMING_SOON') {
      return res.status(400).json({ message: 'Room is not in coming soon status' });
    }

    // Update fields
    if (description !== undefined) room.description = description;
    if (expectedAvailability !== undefined) room.expectedAvailability = expectedAvailability;
    if (images !== undefined) room.images = images;
    if (features !== undefined) room.features = features;
    if (type !== undefined) room.type = type;
    if (capacity !== undefined) room.capacity = capacity;

    await room.save();
    res.json(room);
  } catch (error) {
    console.error('Error updating coming soon room:', error);
    res.status(500).json({ message: error.message });
  }
};

export const makeComingSoonAvailable = async (req, res) => {
  try {
    const { price, features, images } = req.body;
    
    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status !== 'COMING_SOON') {
      return res.status(400).json({ message: 'Room is not in coming soon status' });
    }

    // Update room to make it available
    room.status = 'AVAILABLE';
    room.price = price;
    if (features) room.features = features;
    if (images) room.images = images;

    await room.save();
    res.json({ message: `Room ${room.roomNumber} is now available for booking!`, room });
  } catch (error) {
    console.error('Error making room available:', error);
    res.status(500).json({ message: error.message });
  }
};

// Manual room status update endpoint (admin only)
export const updateRoomStatusesManually = async (req, res) => {
  try {
    await updateRoomStatusesBasedOnBookings();
    res.json({ message: "Room statuses updated successfully based on current bookings" });
  } catch (error) {
    res.status(500).json({ message: "Error updating room statuses", error: error.message });
  }
};