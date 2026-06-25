import express from 'express';
import {
  createSimulation,
  getSimulations,
  getLatestSimulation,
} from '../controllers/simulationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createSimulation);
router.get('/', authenticateToken, getSimulations);
router.get('/latest', authenticateToken, getLatestSimulation);

export default router;
