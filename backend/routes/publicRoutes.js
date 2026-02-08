import express from "express";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// Get all rooms with booking information (no authentication required)
router.get('/rooms', async (req, res) => {
    try {
        console.log('=== PUBLIC ROOMS REQUEST START ===');
        console.log('Request received at:', new Date().toISOString());
        
        if (!Room) {
            console.error('Room model is not available');
            return res.status(500).json({ message: 'Room model not found' });
        }
        
        console.log('Fetching rooms from database...');
        
        const rooms = await Room.find({ 
            status: { $nin: [] }
        })
        .select('roomNumber type price capacity status features images description expectedAvailability')
        .lean()
        .limit(20);

        console.log(`Found ${rooms.length} rooms`);

        const roomsWithBookingInfo = await Promise.all(
            rooms.map(async (room) => {
                const currentBookings = await Booking.find({
                    room: room._id,
                    status: { $in: ["CONFIRMED", "CHECKED_IN"] },
                    checkOut: { $gte: new Date() }
                }).sort({ checkIn: 1 });

                let optimizedImages = [];
                
                if (room.images && room.images.length > 0) {
                    const firstImage = room.images[0];
                    
                    if (typeof firstImage === 'string') {
                        if (firstImage.startsWith('data:image/') || firstImage.startsWith('http')) {
                            optimizedImages = [firstImage];
                        } else {
                            optimizedImages = ['https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'];
                        }
                    } else {
                        optimizedImages = ['https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'];
                    }
                } else {
                    console.log(`No images found for room ${room.roomNumber}, using fallback`);
                    optimizedImages = ['https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'];
                }

                return {
                    ...room,
                    images: optimizedImages,
                    currentBookings: currentBookings.map(booking => ({
                        checkIn: booking.checkIn,
                        checkOut: booking.checkOut,
                        status: booking.status
                    })),
                    isBookable: room.status === "AVAILABLE" || room.status === "NEEDS_CLEANING",
                    isComingSoon: room.status === 'COMING_SOON',
                    isWorking: room.status === 'MAINTENANCE' || room.status === 'WORKING_IN_PROGRESS',
                    displayPrice: room.status === 'COMING_SOON' ? 'Coming Soon' : 
                                  room.status === 'MAINTENANCE' ? 'Under Maintenance' :
                                  room.status === 'WORKING_IN_PROGRESS' ? 'Work in Progress' : room.price,
                    displayStatus: room.status === 'COMING_SOON' ? 'Coming Soon' : 
                                  room.status === 'OCCUPIED' ? 'Occupied' :
                                  room.status === 'MAINTENANCE' ? 'Under Maintenance' :
                                  room.status === 'WORKING_IN_PROGRESS' ? 'Work in Progress' :
                                  room.status === 'NEEDS_CLEANING' ? 'Available' : 'Available'
                };
            })
        );
        
        console.log('Sending response with booking information...');
        res.json(roomsWithBookingInfo);
        console.log('=== PUBLIC ROOMS REQUEST END ===');
    } catch (error) {
        console.error('=== PUBLIC ROOMS ERROR ===');
        console.error('Error fetching public rooms:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ message: error.message });
    }
});

// Get single room with all images
router.get('/rooms/:id/full', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).lean();
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        
        res.json(room);
    } catch (error) {
        console.error('Error fetching single room:', error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;
