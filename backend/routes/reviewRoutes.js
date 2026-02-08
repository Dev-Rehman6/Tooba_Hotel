import express from 'express';
const router = express.Router();
import {
  submitReview,
  getApprovedReviews,
  getMyReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
  getReviewStats
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/roles.js';

// Public routes
router.get('/approved', getApprovedReviews);

// Authenticated user routes
router.post('/submit', protect, submitReview);
router.get('/my-reviews', protect, getMyReviews);

// Admin routes
router.get('/all', protect, admin, getAllReviews);
router.get('/stats', protect, admin, getReviewStats);
router.patch('/:id/approve', protect, admin, approveReview);
router.patch('/:id/reject', protect, admin, rejectReview);
router.delete('/:id', protect, admin, deleteReview);

export default router;
