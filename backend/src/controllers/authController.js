import prisma from '../prisma/client.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const register = async (req, res) => {
  try {
    const { email, password, nombre } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        role: 'student'
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        xp: true,
        level: true,
        createdAt: true
      }
    });

    // Create user progress
    await prisma.userProgress.create({
      data: {
        userId: user.id,
        diagnosticTotal: 15,
        simulationTotal: 15,
        topicLearning: {}
      }
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
        xp: user.xp,
        level: user.level,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};
