import Review from '../models/Review.js';
import Booking from '../models/Booking.js';

// Submit review (authenticated users)
export const submitReview = async (req, res) => {
  try {
    const { rating, title, comment, bookingId } = req.body;
    const userId = req.user.id;

    console.log('Review submission request:', { rating, title, comment, bookingId, userId });

    // Validate required fields
    if (!rating || !title || !comment) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide rating, title, and comment'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      console.log('Validation failed: Invalid rating');
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if user has already reviewed (only if bookingId is provided)
    if (bookingId && bookingId.trim()) {
      const existingReview = await Review.findOne({ 
        user: userId,
        booking: bookingId 
      });

      if (existingReview) {
        console.log('Validation failed: Duplicate review');
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a review for this booking'
        });
      }
    }

    // Create review
    const reviewData = {
      user: userId,
      rating,
      title,
      comment,
      status: 'PENDING'
    };

    if (bookingId && bookingId.trim()) {
      reviewData.booking = bookingId;
    }

    console.log('Creating review with data:', reviewData);
    const review = await Review.create(reviewData);

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name email')
      .populate('booking', 'roomNumber checkIn checkOut');

    console.log('Review created successfully:', review._id);
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! It will be visible after admin approval.',
      review: populatedReview
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit review'
    });
  }
};

// Get approved reviews (public)
export const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'APPROVED' })
      .populate('user', 'name')
      .sort({ approvedAt: -1 })
      .limit(50);

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get approved reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

// Get user's own reviews (authenticated)
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('booking', 'room checkIn checkOut')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reviews'
    });
  }
};

// Get all reviews (admin only)
export const getAllReviews = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('booking', 'room checkIn checkOut')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

// Approve review (admin only)
export const approveReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Review is already approved'
      });
    }

    review.status = 'APPROVED';
    review.approvedBy = req.user.id;
    review.approvedAt = new Date();
    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name email')
      .populate('approvedBy', 'name');

    res.json({
      success: true,
      message: 'Review approved successfully!',
      review: populatedReview
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve review'
    });
  }
};

// Reject review (admin only)
export const rejectReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = 'REJECTED';
    review.rejectionReason = reason || 'Does not meet our guidelines';
    await review.save();

    res.json({
      success: true,
      message: 'Review rejected',
      review
    });
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject review'
    });
  }
};

// Delete review (admin only)
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
};

// Get review statistics (admin only)
export const getReviewStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const totalReviews = await Review.countDocuments();
    const avgRating = await Review.aggregate([
      { $match: { status: 'APPROVED' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalReviews,
        byStatus: stats,
        averageRating: avgRating[0]?.avgRating || 0
      }
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};
