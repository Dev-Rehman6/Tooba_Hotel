import Room from '../models/Room.js';
import Booking from '../models/Booking.js';

// Periodic room status update based on bookings
export const updateRoomStatusesBasedOnBookings = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todaysBookings = await Booking.find({
            status: { $in: ["CONFIRMED", "CHECKED_IN"] },
            checkIn: { $lte: tomorrow },
            checkOut: { $gt: today }
        }).populate('room');
        
        const occupiedRoomIds = todaysBookings.map(booking => booking.room._id);
        
        await Room.updateMany(
            { 
                _id: { $in: occupiedRoomIds },
                status: { $in: ["AVAILABLE", "NEEDS_CLEANING"] }
            },
            { status: "OCCUPIED" }
        );
        
        const allRooms = await Room.find({ status: "OCCUPIED" });
        for (const room of allRooms) {
            if (!occupiedRoomIds.some(id => id.toString() === room._id.toString())) {
                room.status = "AVAILABLE";
                await room.save();
            }
        }
        
        console.log(`✅ Room statuses updated - ${occupiedRoomIds.length} rooms occupied today`);
    } catch (error) {
        console.error('❌ Error updating room statuses:', error);
    }
};
