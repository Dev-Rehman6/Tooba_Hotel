import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import passwordResetRoutes from './routes/passwordResetRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import userRoutes from './routes/userRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import utilityRoutes from './routes/utilityRoutes.js';

// Import utilities
import { updateRoomStatusesBasedOnBookings } from './utils/roomStatusUpdater.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
connectDB();

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Hotel Management API is running!',
        version: '2.0',
        timestamp: new Date().toISOString()
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Test endpoint working!', 
        timestamp: new Date().toISOString() 
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/user', userRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', utilityRoutes);

// Global error handler
app.use((error, req, res, next) => {
    console.error('=== GLOBAL ERROR HANDLER ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Request URL:', req.url);
    console.error('Request Method:', req.method);
    
    res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('=== UNHANDLED PROMISE REJECTION ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('=== UNCAUGHT EXCEPTION ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
});

// Run room status update every 5 minutes
setInterval(updateRoomStatusesBasedOnBookings, 5 * 60 * 1000);

// Run initial update when server starts
updateRoomStatusesBasedOnBookings();

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;
