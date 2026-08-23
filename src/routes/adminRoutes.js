import { Router } from 'express';
import { getAdminUsers, adminLogin } from '../controllers/adminController.js';

const router = Router();

// GET /api/admin/users
router.get('/users', getAdminUsers);

// POST /api/admin/login
router.post('/login', adminLogin);

export default router;
