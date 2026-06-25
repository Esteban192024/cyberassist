import express from 'express';
import {
  createDiagnostic,
  getDiagnostics,
  getLatestDiagnostic,
  updateProgress,
} from '../controllers/diagnosticController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createDiagnostic);
router.get('/', authenticateToken, getDiagnostics);
router.get('/latest', authenticateToken, getLatestDiagnostic);
router.put('/progress', authenticateToken, updateProgress);

export default router;
