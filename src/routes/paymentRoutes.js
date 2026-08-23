import { Router } from 'express';
import { createCheckoutSession, verifyCheckoutSession } from '../controllers/paymentController.js';
import { verifyUserToken } from '../middleware/verifyUserToken.js';

const router = Router();

// POST /api/payment/create-checkout-session (Protected)
router.post('/create-checkout-session', verifyUserToken, createCheckoutSession);

// GET /api/payment/verify-session
router.get('/verify-session', verifyCheckoutSession);

export default router;
