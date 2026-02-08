import express from "express";
import { protect } from "../middleware/auth.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import Stripe from "stripe";

const router = express.Router();

// Create payment intent for Stripe
router.post('/create-payment-intent', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        // Initialize Stripe with the secret key
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency: 'pkr', // Pakistani Rupee
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create booking
router.post('/book', protect, async (req, res) => {
    try {
        console.log('=== BOOKING REQUEST START ===');
        console.log('Request body:', req.body);
        console.log('User from token:', req.user);
        
        const { roomId, checkIn, checkOut, paymentMethod, roomQuantity = 1, totalAmount } = req.body;
        
        if (!roomId || !checkIn || !checkOut) {
            console.log('Missing required fields');
            return res.status(400).json({ message: "Missing required fields: roomId, checkIn, checkOut" });
        }
        
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.log('Invalid date format');
            return res.status(400).json({ message: "Invalid date format" });
        }
        
        if (end <= start) {
            console.log('Invalid date range');
            return res.status(400).json({ message: "Check-out date must be after check-in date" });
        }

        console.log('Looking for room:', roomId);
        const room = await Room.findById(roomId);
        if (!room) {
            console.log('Room not found');
            return res.status(404).json({ message: "Room not found" });
        }
        
        console.log('Room found:', { id: room._id, number: room.roomNumber, status: room.status, price: room.price });
        
        console.log('Checking for conflicts between:', start, 'and', end);
        const overlap = await Booking.findOne({
            room: roomId, 
            status: { $in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            $and: [{ checkIn: { $lt: end } }, { checkOut: { $gt: start } }]
        });
        
        if (overlap) {
            console.log('Booking conflict found:', overlap);
            return res.status(400).json({ 
                message: `This room is already booked from ${new Date(overlap.checkIn).toLocaleDateString()} to ${new Date(overlap.checkOut).toLocaleDateString()}. Please choose different dates.`,
                conflictingDates: {
                    checkIn: overlap.checkIn,
                    checkOut: overlap.checkOut
                },
                isConflict: true
            });
        }

        const nights = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
        const calculatedTotal = (nights * room.price * roomQuantity) * 1.12;
        const finalTotal = totalAmount || calculatedTotal;
        const amountPaid = paymentMethod === 'Cash' ? (finalTotal * 0.05) : finalTotal;
        
        console.log('Booking calculations:', {
            nights,
            roomPrice: room.price,
            roomQuantity,
            calculatedTotal,
            finalTotal,
            amountPaid,
            paymentMethod
        });

        const bookingData = {
            user: req.user.id, 
            room: roomId, 
            checkIn: start, 
            checkOut: end,
            totalAmount: finalTotal,
            roomQuantity,
            paymentMethod: paymentMethod || 'Online',
            paymentStatus: paymentMethod === 'Cash' ? 'PARTIAL' : 'PAID',
            status: 'PENDING',
            amountPaid: amountPaid
        };
        
        console.log('Creating booking with data:', bookingData);
        const booking = await Booking.create(bookingData);

        const populatedBooking = await Booking.findById(booking._id)
            .populate('room')
            .populate('user', 'name email');

        console.log('Booking created successfully:', populatedBooking._id);
        console.log('=== BOOKING REQUEST END ===');
        
        res.json({ message: "Booking requested", booking: populatedBooking });
    } catch (error) { 
        console.error('=== BOOKING ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: error.message });
    }
});

// Get user's bookings
router.get('/my-bookings', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('room');
        res.json(bookings);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

export default router;
