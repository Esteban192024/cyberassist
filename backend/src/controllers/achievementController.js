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

    console.log(`[ACHIEVEMENT CHECK] Request to unlock: ${code} for user: ${userId}`);

    if (!code) {
      console.log(`[ACHIEVEMENT CHECK] Missing achievement code`);
      return res.status(400).json({ error: 'Achievement code is required' });
    }

    const achievement = await prisma.achievement.findUnique({
      where: { code },
    });

    if (!achievement) {
      console.log(`[ACHIEVEMENT CHECK] Achievement ${code} not found`);
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
      console.log(`[ACHIEVEMENT CHECK] Achievement ${code} already unlocked for user ${userId}`);
      return res.status(400).json({ error: 'Achievement already unlocked' });
    }

    // Get user's actual progress and data from PostgreSQL to validate
    const [user, userProgress] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userProgress.findUnique({ where: { userId } })
    ]);

    console.log(`[ACHIEVEMENT CHECK] User data from DB:`, {
      userId,
      xp: user?.xp,
      level: user?.level,
      diagnosticMastered: userProgress?.diagnosticMastered,
      diagnosticMasteredIds: userProgress?.diagnosticMasteredIds,
      simulationMastered: userProgress?.simulationMastered,
      simulationMasteredIds: userProgress?.simulationMasteredIds
    });

    if (!user || !userProgress) {
      return res.status(404).json({ error: 'User or user progress not found' });
    }

    // Validate achievement criteria against actual database data
    let isEligible = false;
    const TOTAL_DIAGNOSTIC_ITEMS = 15;
    const TOTAL_SIMULATION_ITEMS = 15;
    const LEVELS = {
      2: { xpRequired: 300 },
      3: { xpRequired: 700 },
      4: { xpRequired: 1200 },
      5: { xpRequired: 2000 }
    };

    switch (code) {
      case 'first_diagnostic':
        isEligible = userProgress.diagnosticMasteredIds.length >= 1;
        break;
      case 'diagnostic_master':
        isEligible = userProgress.diagnosticMasteredIds.length >= TOTAL_DIAGNOSTIC_ITEMS;
        break;
      case 'first_simulation':
        isEligible = userProgress.simulationMasteredIds.length >= 1;
        break;
      case 'simulation_master':
        isEligible = userProgress.simulationMasteredIds.length >= TOTAL_SIMULATION_ITEMS;
        break;
      case 'level_2':
        isEligible = user.level >= 2 || user.xp >= LEVELS[2].xpRequired;
        break;
      case 'level_3':
        isEligible = user.level >= 3 || user.xp >= LEVELS[3].xpRequired;
        break;
      case 'level_4':
        isEligible = user.level >= 4 || user.xp >= LEVELS[4].xpRequired;
        break;
      case 'level_5':
        isEligible = user.level >= 5 || user.xp >= LEVELS[5].xpRequired;
        break;
      case 'security_expert':
        isEligible = userProgress.diagnosticMasteredIds.length >= TOTAL_DIAGNOSTIC_ITEMS;
        break;
      case 'program_complete':
        isEligible = userProgress.diagnosticMasteredIds.length >= TOTAL_DIAGNOSTIC_ITEMS &&
                     userProgress.simulationMasteredIds.length >= TOTAL_SIMULATION_ITEMS;
        break;
      case 'perfect_score':
      case 'perfect_simulation':
      case 'phishing_expert':
        // These require session data, we'll trust frontend for now (or add validation later)
        isEligible = true;
        break;
      default:
        isEligible = false;
    }

    console.log(`[ACHIEVEMENT CHECK] Eligible: ${isEligible} for ${code} (user ${userId})`);

    if (!isEligible) {
      console.log(`[ACHIEVEMENT UNLOCK] FAILED - user ${userId} not eligible for ${code}`);
      return res.status(403).json({ error: 'User does not meet the criteria for this achievement' });
    }

    console.log(`[ACHIEVEMENT UNLOCK] Starting for user ${userId}, achievement ${code}`);
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
      include: {
        achievement: true,
      },
    });
    console.log(`[ACHIEVEMENT DB INSERT] Success! UserAchievement id: ${userAchievement.id}`);

    res.json({
      message: 'Achievement unlocked successfully',
      userAchievement,
    });
  } catch (error) {
    console.error('[ACHIEVEMENT UNLOCK] Error:', error);
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

export const resetUserAchievements = async (req, res) => {
  try {
    const userId = req.user.userId;

    const deleted = await prisma.userAchievement.deleteMany({
      where: { userId }
    });

    console.log(`[ACHIEVEMENT RESET] Deleted ${deleted.count} user achievements for userId: ${userId}`);

    res.json({
      message: 'User achievements reset successfully',
      deletedCount: deleted.count
    });
  } catch (error) {
    console.error('Reset user achievements error:', error);
    res.status(500).json({ error: 'Failed to reset user achievements' });
  }
};
