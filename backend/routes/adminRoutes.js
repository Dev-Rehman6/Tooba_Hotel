import express from "express";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Revenue routes
router.get('/revenue', protect, allowRoles('admin'), async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            { $match: { status: 'CONFIRMED' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json(stats);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

router.get('/revenue-detailed', protect, allowRoles('admin'), async (req, res) => {
    try {
        const history = await Booking.find({ status: 'CONFIRMED' })
            .populate('user', 'name email')
            .populate('room', 'roomNumber type')
            .sort({ createdAt: -1 });

        const totalCollected = history.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        
        res.json({
            history,
            summary: { totalCollected }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/revenue-report', protect, allowRoles('admin'), async (req, res) => {
    try {
        const report = await Booking.aggregate([
            { $match: { status: 'CONFIRMED' } },
            { $group: { _id: { $year: "$createdAt" }, annualRevenue: { $sum: "$totalAmount" }, totalStays: { $sum: 1 } } }
        ]);
        res.json(report);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

// Booking management
router.get('/bookings/pending', protect, allowRoles('admin'), async (req, res) => {
    try {
        const pending = await Booking.find({ status: 'PENDING' }).populate('user').populate('room');
        res.json(pending);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

router.patch('/bookings/confirm/:id', protect, allowRoles('admin'), async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        
        booking.status = 'CONFIRMED';
        await booking.save();
        
        await Room.findByIdAndUpdate(booking.room, { status: 'OCCUPIED' });
        
        res.json({ message: "Booking confirmed" });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

// Fix existing bookings utility
router.patch('/fix-bookings', protect, allowRoles('admin'), async (req, res) => {
    try {
        console.log('Fixing existing bookings...');
        
        const bookings = await Booking.find({ amountPaid: { $exists: false } }).populate('room');
        let fixed = 0;
        
        for (const booking of bookings) {
            if (booking.room && booking.totalAmount) {
                const amountPaid = booking.paymentMethod === 'Cash' ? 
                    (booking.totalAmount * 0.05) : booking.totalAmount;
                
                await Booking.findByIdAndUpdate(booking._id, { 
                    amountPaid: amountPaid,
                    paymentStatus: booking.paymentMethod === 'Cash' ? 'PARTIAL' : 'PAID'
                });
                fixed++;
            }
        }
        
        console.log(`Fixed ${fixed} bookings`);
        res.json({ message: `Fixed ${fixed} bookings`, fixed });
    } catch (error) {
        console.error('Error fixing bookings:', error);
        res.status(500).json({ message: error.message });
    }
});

// Room management
router.patch('/rooms/checkout/:id', protect, allowRoles('admin'), async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id, 
            { status: 'NEEDS_CLEANING' }, 
            { new: true }
        );
        res.json({ message: "Guest checked out. Room needs cleaning.", room });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/rooms-full', protect, allowRoles('admin'), async (req, res) => {
    try {
        console.log('=== ADMIN ROOMS FULL REQUEST START ===');
        
        const rooms = await Room.find().lean();
        console.log(`Found ${rooms.length} rooms for admin`);
        
        const roomsWithOptimizedImages = rooms.map(room => {
            let optimizedImages = [];
            
            if (room.images && room.images.length > 0) {
                const imagesToProcess = room.images.slice(0, 3);
                
                optimizedImages = imagesToProcess.map(image => {
                    if (typeof image === 'string' && image.startsWith('data:image/')) {
                        const sizeInBytes = (image.length * 3) / 4;
                        if (sizeInBytes > 1000000) {
                            console.log(`Large image found for room ${room.roomNumber}, consider optimizing`);
                            return image;
                        }
                        return image;
                    }
                    return image;
                });
            } else {
                optimizedImages = ['https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'];
            }
            
            return {
                ...room,
                images: optimizedImages
            };
        });
        
        res.json(roomsWithOptimizedImages);
        console.log('=== ADMIN ROOMS FULL REQUEST END ===');
    } catch (error) {
        console.error('=== ADMIN ROOMS FULL ERROR ===');
        console.error('Error fetching admin rooms:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Coming soon room management
router.post('/rooms/coming-soon', protect, allowRoles('admin'), async (req, res) => {
    try {
        const { roomNumber, type, capacity, description, expectedAvailability, images, features } = req.body;
        
        if (!roomNumber || !type) {
            return res.status(400).json({ message: "Room number and type are required" });
        }
        
        const existingRoom = await Room.findOne({ roomNumber });
        if (existingRoom) {
            return res.status(400).json({ message: "Room number already exists" });
        }
        
        const roomData = {
            roomNumber,
            type,
            capacity: capacity || 1,
            status: 'COMING_SOON',
            description: description || `${type} room coming soon`,
            images: images || [],
            features: features || []
        };
        
        if (expectedAvailability) {
            roomData.expectedAvailability = new Date(expectedAvailability);
        }
        
        const room = await Room.create(roomData);
        console.log(`Created coming soon room: ${roomNumber} with ${room.images?.length || 0} images`);
        
        res.json({ 
            message: "Coming soon room created successfully", 
            room 
        });
    } catch (error) {
        console.error('Error creating coming soon room:', error);
        res.status(500).json({ message: error.message });
    }
});

router.patch('/rooms/make-available/:id', protect, allowRoles('admin'), async (req, res) => {
    try {
        const { price, features, images } = req.body;
        
        if (!price || price <= 0) {
            return res.status(400).json({ message: "Valid price is required to make room available" });
        }
        
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        
        if (room.status !== 'COMING_SOON') {
            return res.status(400).json({ message: "Only coming soon rooms can be made available this way" });
        }
        
        room.status = 'AVAILABLE';
        room.price = price;
        
        if (features) room.features = features;
        if (images && images.length > 0) room.images = images;
        
        await room.save();
        
        console.log(`Room ${room.roomNumber} converted from coming soon to available with ${room.images?.length || 0} images`);
        
        res.json({ 
            message: "Room is now available for booking", 
            room 
        });
    } catch (error) {
        console.error('Error making room available:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/rooms/coming-soon', protect, allowRoles('admin'), async (req, res) => {
    try {
        const comingSoonRooms = await Room.find({ status: 'COMING_SOON' }).lean();
        res.json(comingSoonRooms);
    } catch (error) {
        console.error('Error fetching coming soon rooms:', error);
        res.status(500).json({ message: error.message });
    }
});

router.patch('/rooms/coming-soon/:id', protect, allowRoles('admin'), async (req, res) => {
    try {
        const { description, expectedAvailability, images, features, type, capacity } = req.body;
        
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        
        if (room.status !== 'COMING_SOON') {
            return res.status(400).json({ message: "This endpoint is only for coming soon rooms" });
        }
        
        if (description !== undefined) room.description = description;
        if (expectedAvailability) room.expectedAvailability = new Date(expectedAvailability);
        if (images) room.images = images;
        if (features) room.features = features;
        if (type) room.type = type;
        if (capacity) room.capacity = capacity;
        
        await room.save();
        
        res.json({ 
            message: "Coming soon room updated successfully", 
            room 
        });
    } catch (error) {
        console.error('Error updating coming soon room:', error);
        res.status(500).json({ message: error.message });
    }
});

// Email invoice
router.post('/send-invoice', protect, allowRoles('admin'), async (req, res) => {
    try {
        console.log('=== EMAIL SENDING START ===');
        const { email, guestName, pdfBase64 } = req.body;
        
        console.log('Email details:', { to: email, guestName });
        console.log('Email user:', process.env.EMAIL_USER);
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('✅ Transporter verified successfully');

        const mailOptions = {
            from: `"Grand Hotel" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Invoice from Grand Hotel - ${guestName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Grand Hotel Invoice</h2>
                    <p>Dear <strong>${guestName}</strong>,</p>
                    <p>Thank you for choosing Grand Hotel! Please find your booking invoice attached.</p>
                    <p>We hope you enjoyed your stay with us.</p>
                    <br>
                    <p>Best regards,<br>
                    <strong>Grand Hotel Team</strong></p>
                    <hr>
                    <p style="font-size: 12px; color: #666;">
                        This is an automated email. Please do not reply to this message.
                    </p>
                </div>
            `,
            text: `Dear ${guestName},\n\nThank you for choosing Grand Hotel! Please find your booking invoice attached.\n\nWe hope you enjoyed your stay with us.\n\nBest regards,\nGrand Hotel Team`,
            attachments: pdfBase64 ? [
                {
                    filename: `Invoice_${guestName}_${new Date().toISOString().split('T')[0]}.pdf`,
                    content: pdfBase64.includes('base64,') ? pdfBase64.split("base64,")[1] : pdfBase64,
                    encoding: 'base64'
                }
            ] : []
        };

        console.log('Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${email}`);
        console.log('Message ID:', info.messageId);
        console.log('=== EMAIL SENDING END ===');
        
        res.json({ 
            message: "Email sent successfully!",
            messageId: info.messageId,
            to: email
        });
    } catch (error) {
        console.error("❌ NODEMAILER ERROR:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });
        res.status(500).json({ 
            message: "Failed to send email",
            error: error.message,
            code: error.code
        });
    }
});

export default router;
