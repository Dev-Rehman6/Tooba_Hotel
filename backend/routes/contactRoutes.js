import express from 'express';
const router = express.Router();
import {
  submitContact,
  getAllContacts,
  replyToContact,
  updateContactStatus,
  deleteContact
} from '../controllers/contactController.js';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/roles.js';

// Public route
router.post('/submit', submitContact);

// Admin routes
router.get('/', protect, admin, getAllContacts);
router.post('/:id/reply', protect, admin, replyToContact);
router.patch('/:id/status', protect, admin, updateContactStatus);
router.delete('/:id', protect, admin, deleteContact);

export default router;
