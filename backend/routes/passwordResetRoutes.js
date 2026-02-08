import express from 'express';
const router = express.Router();
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword
} from '../controllers/passwordResetController.js';

// Public routes - no authentication required
router.post('/request', requestPasswordReset);
router.post('/verify-code', verifyResetCode);
router.post('/reset', resetPassword);

export default router;
