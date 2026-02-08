import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Discount from "../models/Discount.js";

export const createBooking = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, totalAmount, roomQuantity = 1, paymentMethod = "Online", appliedDiscounts = [] } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    
    // Don't check room status here - check for date conflicts instead
    // This allows booking occupied rooms for future dates
    
    // Check for booking conflicts
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const conflictingBookings = await Booking.find({
      room: roomId,
      status: { $in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      $or: [
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      const conflictDetails = conflictingBookings.map(b => ({
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status
      }));
      
      return res.status(400).json({ 
        message: `This room is already booked from ${new Date(conflictingBookings[0].checkIn).toLocaleDateString()} to ${new Date(conflictingBookings[0].checkOut).toLocaleDateString()}. Please choose different dates.`,
        conflictingDates: conflictDetails,
        isConflict: true
      });
    }

    // Calculate discount information
    let discountTotal = 0;
    const discountDetails = [];
    
    if (appliedDiscounts && appliedDiscounts.length > 0) {
      for (const discountId of appliedDiscounts) {
        const discount = await Discount.findById(discountId);
        if (discount && discount.isActive) {
          const discountAmount = (totalAmount * discount.percentage) / 100;
          discountTotal += discountAmount;
          discountDetails.push({
            discount: discount._id,
            name: discount.name,
            percentage: discount.percentage,
            amount: discountAmount
          });
        }
      }
    }

    const finalAmount = totalAmount - discountTotal;

    const booking = await Booking.create({
      user: req.user._id,
      room: roomId,
      checkIn,
      checkOut,
      originalAmount: totalAmount,
      discountTotal,
      appliedDiscounts: discountDetails,
      totalAmount: finalAmount,
      roomQuantity,
      paymentMethod,
      paymentStatus: paymentMethod === "Cash" ? "PARTIAL" : "PAID"
    });

    // Don't change room status immediately, let admin confirm first
    const populatedBooking = await Booking.findById(booking._id)
      .populate("room")
      .populate("user", "name email")
      .populate("appliedDiscounts.discount");

    res.status(201).json({ booking: populatedBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("room")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkIn = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("room");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "CHECKED_IN";
    await booking.save();

    booking.room.status = "OCCUPIED";
    await booking.room.save();

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkOut = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("room");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "CHECKED_OUT";
    booking.paymentStatus = "PAID"; // simplify for now
    await booking.save();

    // Set room to NEEDS_CLEANING instead of AVAILABLE
    booking.room.status = "NEEDS_CLEANING";
    await booking.room.save();

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("room")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Confirm booking (admin action)
export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("room");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "CONFIRMED";
    await booking.save();

    // Only set room as occupied if the booking is for today or already started
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    const checkOutDate = new Date(booking.checkOut);
    checkOutDate.setHours(23, 59, 59, 999);

    // If booking is active today (check-in is today or before, and check-out is today or after)
    if (checkInDate <= today && checkOutDate >= today) {
      booking.room.status = "OCCUPIED";
      await booking.room.save();
    }

    res.json({ message: "Booking confirmed", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
