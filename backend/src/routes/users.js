import express from 'express';
import { getProfile, updateProfile, updatePassword, updateXpAndLevel } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, updatePassword);
router.put('/xp-level', authenticateToken, updateXpAndLevel);

export default router;
