import prisma from '../prisma/client.js';

export const createSimulation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      score,
      total,
      masteredTotal,
      masteredGoal,
      riskLevel,
      strengths,
      weaknesses,
      simulationMasteredIds,
      masteredScenarioIds,
      topicLearning,
    } = req.body;

    console.log('[SIMULATION SAVE] Origen: Frontend, Endpoint: POST /simulations, userId:', userId, 'topicLearning recibido:', topicLearning);

    const simulationMasteredIdsToSave = Array.isArray(simulationMasteredIds)
      ? simulationMasteredIds
      : Array.isArray(masteredScenarioIds)
      ? masteredScenarioIds
      : null;

    // Crear registro de simulación
    const simulation = await prisma.simulation.create({
      data: {
        userId,
        score,
        total,
        masteredTotal,
        masteredGoal,
        riskLevel,
        strengths: strengths || [],
        weaknesses: weaknesses || [],
      },
    });

    console.log('[SIMULATION SAVE] Simulación guardada en PostgreSQL, id:', simulation.id);

    // Actualizar UserProgress
    const userProgress = await prisma.userProgress.findUnique({
      where: { userId },
    });

    if (userProgress) {
      console.log('[USER PROGRESS UPDATE] Actualizando UserProgress para userId:', userId);

      const updatedUserProgress = await prisma.userProgress.update({
        where: { userId },
        data: {
          simulationMastered: Math.max(userProgress.simulationMastered, masteredTotal),
          simulationTotal: masteredGoal,
          simulationMasteredIds: simulationMasteredIdsToSave
            ? Array.from(new Set([...userProgress.simulationMasteredIds, ...simulationMasteredIdsToSave]))
            : userProgress.simulationMasteredIds,
          topicLearning: topicLearning || userProgress.topicLearning,
          programComplete:
            userProgress.diagnosticMastered >= userProgress.diagnosticTotal &&
            Math.max(userProgress.simulationMastered, masteredTotal) >= masteredGoal,
        },
      });

      console.log('[TOPIC LEARNING UPDATE] topicLearning actualizado en UserProgress:', updatedUserProgress.topicLearning);
      console.log('[USER PROGRESS UPDATE] UserProgress actualizado exitosamente para userId:', userId);
    }

    res.status(201).json({
      message: 'Simulation saved successfully',
      simulation,
    });
  } catch (error) {
    console.error('Create simulation error:', error);
    res.status(500).json({ error: 'Failed to save simulation' });
  }
};

export const getSimulations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const simulations = await prisma.simulation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Formatear fechas a formato YYYY-MM-DD
    const formattedSimulations = simulations.map((s) => ({
      ...s,
      date: s.createdAt.toISOString().split('T')[0],
    }));

    res.json(formattedSimulations);
  } catch (error) {
    console.error('Get simulations error:', error);
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
};

export const getLatestSimulation = async (req, res) => {
  try {
    const userId = req.user.userId;

    const simulation = await prisma.simulation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!simulation) {
      return res.status(404).json({ error: 'No simulation found' });
    }

    // Formatear fecha
    const formattedSimulation = {
      ...simulation,
      date: simulation.createdAt.toISOString().split('T')[0],
    };

    res.json(formattedSimulation);
  } catch (error) {
    console.error('Get latest simulation error:', error);
    res.status(500).json({ error: 'Failed to fetch latest simulation' });
  }
};
