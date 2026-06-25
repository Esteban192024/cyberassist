import express from 'express';
import {
  createCertificate,
  getUserCertificates,
  getCertificateById,
} from '../controllers/certificateController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createCertificate);
router.get('/user', authenticateToken, getUserCertificates);
router.get('/:id', authenticateToken, getCertificateById);

export default router;
