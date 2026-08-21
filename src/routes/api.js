import { Router } from 'express';
import { getStats } from '../controllers/statsController.js';
import { createRegistration, getRegistrations } from '../controllers/registrationController.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'touches-backend-api',
  });
});

// App Stats Endpoint
router.get('/stats', getStats);

// Player Registration Endpoints
router.post('/registrations', createRegistration);
router.get('/registrations', getRegistrations);

export default router;
