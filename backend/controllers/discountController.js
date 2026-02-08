import Discount from "../models/Discount.js";

// Create a new discount (Admin only)
export const createDiscount = async (req, res) => {
  try {
    console.log('Creating discount with data:', req.body);
    const discount = await Discount.create(req.body);
    console.log('Discount created successfully:', discount);
    res.status(201).json({ message: "Discount created successfully", discount });
  } catch (err) {
    console.error('Error creating discount:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all discounts
export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find().sort({ priority: -1, createdAt: -1 });
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get active discounts only (for public display)
export const getActiveDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({ isActive: true }).sort({ priority: -1 });
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update discount
export const updateDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!discount) return res.status(404).json({ message: "Discount not found" });
    res.json({ message: "Discount updated successfully", discount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete discount
export const deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) return res.status(404).json({ message: "Discount not found" });
    res.json({ message: "Discount deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Calculate applicable discounts for a booking
export const calculateApplicableDiscounts = async (req, res) => {
  try {
    const { checkIn, checkOut, roomQuantity } = req.body;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const currentDate = new Date();
    
    // Get all active discounts
    const allDiscounts = await Discount.find({ isActive: true }).sort({ priority: -1 });
    
    const applicableDiscounts = [];
    
    for (const discount of allDiscounts) {
      let isApplicable = false;
      
      switch (discount.type) {
        case "WEEKEND":
          // Check if any day in the booking range is a weekend
          const daysDiff = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
          for (let i = 0; i < daysDiff; i++) {
            const date = new Date(checkInDate);
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
              isApplicable = true;
              break;
            }
          }
          break;
          
        case "SEASONAL":
          // Check if current date falls in the season
          const month = currentDate.getMonth();
          if (discount.season === "SUMMER" && (month >= 5 && month <= 8)) { // June-September
            isApplicable = true;
          } else if (discount.season === "WINTER" && (month >= 11 || month <= 1)) { // December-February
            isApplicable = true;
          } else if (discount.season === "SPRING" && (month >= 2 && month <= 4)) { // March-May
            isApplicable = true;
          } else if (discount.season === "FALL" && (month >= 9 && month <= 10)) { // October-November
            isApplicable = true;
          }
          break;
          
        case "MULTI_ROOM":
          // Check if booking meets minimum room requirement
          if (roomQuantity >= discount.minRooms) {
            isApplicable = true;
          }
          break;
          
        case "CUSTOM":
          // Check if current date is within the discount date range
          if (discount.startDate && discount.endDate) {
            if (currentDate >= new Date(discount.startDate) && currentDate <= new Date(discount.endDate)) {
              isApplicable = true;
            }
          }
          break;
      }
      
      if (isApplicable) {
        applicableDiscounts.push(discount);
      }
    }
    
    res.json({ discounts: applicableDiscounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
