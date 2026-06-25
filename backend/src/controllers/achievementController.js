import prisma from '../prisma/client.js';

const INITIAL_ACHIEVEMENTS = [
  {
    code: 'first_diagnostic',
    name: 'Primer Paso',
    description: 'Aprobaste tu primera pregunta de diagnóstico',
    icon: '🎯',
    xpReward: 40,
    category: 'diagnostic',
  },
  {
    code: 'diagnostic_master',
    name: 'Maestro del Diagnóstico',
    description: 'Aprobaste las 15 preguntas del diagnóstico',
    icon: '🏆',
    xpReward: 200,
    category: 'diagnostic',
  },
  {
    code: 'perfect_score',
    name: 'Perfección Digital',
    description: 'Obtuviste un puntaje perfecto en una sesión de diagnóstico',
    icon: '⭐',
    xpReward: 150,
    category: 'diagnostic',
  },
  {
    code: 'first_simulation',
    name: 'Simulador Iniciado',
    description: 'Aprobaste tu primer escenario de simulación',
    icon: '🎮',
    xpReward: 50,
    category: 'simulation',
  },
  {
    code: 'simulation_master',
    name: 'Experto en Simulaciones',
    description: 'Aprobaste los 15 escenarios de simulación',
    icon: '🎖️',
    xpReward: 250,
    category: 'simulation',
  },
  {
    code: 'perfect_simulation',
    name: 'Sin Errores',
    description: 'Completaste una sesión de simulación con 100% de aciertos',
    icon: '💯',
    xpReward: 180,
    category: 'simulation',
  },
  {
    code: 'level_2',
    name: 'Aprendiz Digital',
    description: 'Alcanzaste el nivel 2',
    icon: '📚',
    xpReward: 100,
    category: 'level',
  },
  {
    code: 'level_3',
    name: 'Usuario Seguro',
    description: 'Alcanzaste el nivel 3',
    icon: '🛡️',
    xpReward: 150,
    category: 'level',
  },
  {
    code: 'level_4',
    name: 'Protector Digital',
    description: 'Alcanzaste el nivel 4',
    icon: '⚔️',
    xpReward: 200,
    category: 'level',
  },
  {
    code: 'level_5',
    name: 'Experto en Ciberseguridad',
    description: 'Alcanzaste el nivel máximo',
    icon: '👑',
    xpReward: 300,
    category: 'level',
  },
  {
    code: 'security_expert',
    name: 'Experto en Seguridad',
    description: 'Aprobaste las 15 preguntas con dominio demostrado',
    icon: '🔐',
    xpReward: 300,
    category: 'special',
  },
  {
    code: 'phishing_expert',
    name: 'Experto en Phishing',
    description: 'Completaste una sesión de simulación con 100% de aciertos',
    icon: '🎣',
    xpReward: 180,
    category: 'special',
  },
  {
    code: 'program_complete',
    name: 'Programa Completado',
    description: 'Aprobaste los 15 diagnósticos y 15 simulaciones del programa',
    icon: '🎓',
    xpReward: 500,
    category: 'special',
  },
];

export const initializeAchievements = async (req, res) => {
  try {
    const existingCount = await prisma.achievement.count();
    
    if (existingCount > 0) {
      return res.json({ 
        message: 'Achievements already initialized',
        count: existingCount 
      });
    }

    const achievements = await prisma.achievement.createMany({
      data: INITIAL_ACHIEVEMENTS,
    });

    console.log(`✅ Achievement catalog initialized: ${achievements.count} achievements created`);

    res.json({
      message: 'Achievements initialized successfully',
      count: achievements.count,
    });
  } catch (error) {
    console.error('Initialize achievements error:', error);
    res.status(500).json({ error: 'Failed to initialize achievements' });
  }
};

// Función para asegurar que el catálogo de logros exista (llamada al arrancar el servidor)
export const ensureAchievementsInitialized = async () => {
  try {
    const existingCount = await prisma.achievement.count();
    
    if (existingCount > 0) {
      console.log(`✅ Achievement catalog loaded: ${existingCount} achievements`);
      return;
    }

    const achievements = await prisma.achievement.createMany({
      data: INITIAL_ACHIEVEMENTS,
    });

    console.log(`✅ Achievement catalog initialized: ${achievements.count} achievements created`);
  } catch (error) {
    console.error('❌ Error ensuring achievements initialized:', error);
  }
};

export const getAchievements = async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { category: 'asc' },
    });

    res.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

export const unlockAchievement = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    if (!code) {
      return res.status(400).json({ error: 'Achievement code is required' });
    }

    const achievement = await prisma.achievement.findUnique({
      where: { code },
    });

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Achievement already unlocked' });
    }

    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
      include: {
        achievement: true,
      },
    });

    res.json({
      message: 'Achievement unlocked successfully',
      userAchievement,
    });
  } catch (error) {
    console.error('Unlock achievement error:', error);
    res.status(500).json({ error: 'Failed to unlock achievement' });
  }
};

export const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    });

    res.json(userAchievements);
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
};
