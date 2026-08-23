import { Router } from 'express';
import { getStats } from '../controllers/statsController.js';
import { createRegistration, getRegistrations } from '../controllers/registrationController.js';
import adminRoutes from './adminRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import authRoutes from './authRoutes.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'touches-backend-api',
  });
});

// User Auth Endpoints (/api/auth/*)
router.use('/auth', authRoutes);

// App Stats Endpoint
router.get('/stats', getStats);

// Player Registration Endpoints
router.post('/registrations', createRegistration);
router.get('/registrations', getRegistrations);

// Admin Dashboard Routes (/api/admin/*)
router.use('/admin', adminRoutes);

// Stripe Payment Endpoints (/api/payment/*)
router.use('/payment', paymentRoutes);

export default router;
