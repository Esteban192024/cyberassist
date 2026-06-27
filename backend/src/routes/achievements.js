import express from 'express';
import { 
  initializeAchievements, 
  getAchievements, 
  unlockAchievement, 
  getUserAchievements,
  resetUserAchievements
} from '../controllers/achievementController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize achievements (admin only - no auth for simplicity in this phase)
router.post('/initialize', initializeAchievements);

// Get all achievements (public)
router.get('/', getAchievements);

// Unlock achievement (authenticated)
router.post('/unlock', authenticateToken, unlockAchievement);

// Get user achievements (authenticated)
router.get('/user', authenticateToken, getUserAchievements);

// Reset user achievements (authenticated)
router.delete('/user', authenticateToken, resetUserAchievements);

export default router;
