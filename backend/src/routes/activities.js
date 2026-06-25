import express from 'express';
import { createActivity, getUserActivities } from '../controllers/activityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create activity (authenticated)
router.post('/', authenticateToken, createActivity);

// Get user activities (authenticated)
router.get('/', authenticateToken, getUserActivities);

export default router;
