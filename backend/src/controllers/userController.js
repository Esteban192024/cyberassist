import prisma from '../prisma/client.js';
import { comparePassword, hashPassword } from '../utils/password.js';

export const getProfile = async (req, res) => {
  try {
    console.log('[PROFILE READ] Origen: PostgreSQL, Endpoint: GET /users/profile, userId:', req.user.userId);
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        xp: true,
        level: true,
        createdAt: true,
        userProgress: true,
        userAchievements: {
          include: {
            achievement: true
          }
        },
        certificates: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[PROFILE READ] Resultado guardado en PostgreSQL:', { xp: user.xp, level: user.level });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateXpAndLevel = async (req, res) => {
  try {
    const { xp, level } = req.body;
    const userId = req.user.userId;

    console.log('[XP WRITE] Origen: Frontend, Endpoint: PUT /users/xp-level, Valor recibido:', { xp, level });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { xp, level },
      select: { id: true, xp: true, level: true }
    });

    console.log('[DATABASE UPDATE SUCCESS] User.xp y User.level actualizados en PostgreSQL:', { userId, xp: updatedUser.xp, level: updatedUser.level });
    console.log('[XP WRITE] Resultado guardado en PostgreSQL:', { xp: updatedUser.xp, level: updatedUser.level });
    console.log('[LEVEL WRITE] Resultado guardado en PostgreSQL:', { level: updatedUser.level });

    res.json({
      message: 'XP and level updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.log('[DATABASE UPDATE ERROR] Error al actualizar User.xp y User.level en PostgreSQL:', error.message);
    console.error('Update XP/Level error:', error);
    res.status(500).json({ error: 'Failed to update XP and level' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nombre } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { nombre },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        xp: true,
        level: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await comparePassword(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};
