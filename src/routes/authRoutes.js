import { Router } from 'express';
import { userLogin, generateLoginToken, verifyLoginToken } from '../controllers/authController.js';
import { verifyUserToken } from '../middleware/verifyUserToken.js';

const router = Router();

// POST /api/auth/login (Public)
router.post('/login', userLogin);

// POST /api/auth/generate-login-token (Protected)
router.post('/generate-login-token', verifyUserToken, generateLoginToken);

// GET /api/auth/verify-login-token (Public)
router.get('/verify-login-token', verifyLoginToken);

export default router;
