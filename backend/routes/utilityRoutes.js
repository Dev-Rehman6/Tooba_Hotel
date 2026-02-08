import express from "express";
import User from "../models/User.js";
import Room from "../models/Room.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Test email endpoint
router.post('/test-email', async (req, res) => {
    try {
        console.log('=== EMAIL TEST START ===');
        const { email } = req.body;
        const testEmail = email || 'test@example.com';
        
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

        await transporter.verify();
        console.log('✅ Transporter verified');

        const mailOptions = {
            from: `"Grand Hotel Test" <${process.env.EMAIL_USER}>`,
            to: testEmail,
            subject: 'Test Email from Grand Hotel',
            html: `
                <h2>Email Test Successful!</h2>
                <p>This is a test email from Grand Hotel management system.</p>
                <p>Sent at: ${new Date().toISOString()}</p>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Test email sent successfully');
        console.log('=== EMAIL TEST END ===');
        
        res.json({ 
            message: "Test email sent successfully!",
            messageId: info.messageId,
            to: testEmail
        });
    } catch (error) {
        console.error("❌ EMAIL TEST ERROR:", error);
        res.status(500).json({ 
            message: "Email test failed",
            error: error.message
        });
    }
});

// Create test user
router.post('/create-test-user', async (req, res) => {
    try {
        console.log('=== CREATING TEST USER ===');
        
        const existingAdmin = await User.findOne({ email: 'admin@hotel.com' });
        if (existingAdmin) {
            return res.json({ message: 'Test admin user already exists', user: { email: existingAdmin.email, role: existingAdmin.role } });
        }

        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@hotel.com',
            password: 'admin123',
            role: 'admin'
        });

        console.log('Admin user created:', { id: adminUser._id, email: adminUser.email, role: adminUser.role });

        const existingUser = await User.findOne({ email: 'user@hotel.com' });
        if (!existingUser) {
            const regularUser = await User.create({
                name: 'Test User',
                email: 'user@hotel.com',
                password: 'user123',
                role: 'user'
            });
            console.log('Regular user created:', { id: regularUser._id, email: regularUser.email, role: regularUser.role });
        }

        res.json({ 
            message: 'Test users created successfully',
            users: [
                { email: 'admin@hotel.com', password: 'admin123', role: 'admin' },
                { email: 'user@hotel.com', password: 'user123', role: 'user' }
            ]
        });
    } catch (error) {
        console.error('Error creating test user:', error);
        res.status(500).json({ message: error.message });
    }
});

// Debug routes
router.get('/debug/users', async (req, res) => {
    try {
        const users = await User.find().select('name email role createdAt');
        res.json({
            count: users.length,
            users: users
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/debug/rooms-images', async (req, res) => {
    try {
        const rooms = await Room.find().select('roomNumber images').lean();
        
        const imageInfo = rooms.map(room => ({
            roomNumber: room.roomNumber,
            imageCount: room.images ? room.images.length : 0,
            hasImages: !!(room.images && room.images.length > 0),
            imageTypes: room.images ? room.images.map(img => {
                if (typeof img === 'string') {
                    if (img.startsWith('data:image/')) {
                        const sizeInBytes = (img.length * 3) / 4;
                        return {
                            type: 'base64',
                            format: img.substring(11, img.indexOf(';')),
                            sizeKB: Math.round(sizeInBytes / 1024)
                        };
                    } else if (img.startsWith('http')) {
                        return { type: 'url', url: img };
                    } else {
                        return { type: 'unknown', preview: img.substring(0, 50) + '...' };
                    }
                }
                return { type: 'not_string', value: img };
            }) : []
        }));
        
        res.json({
            totalRooms: rooms.length,
            roomsWithImages: imageInfo.filter(r => r.hasImages).length,
            roomsWithoutImages: imageInfo.filter(r => !r.hasImages).length,
            details: imageInfo
        });
    } catch (error) {
        console.error('Error in debug route:', error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;
