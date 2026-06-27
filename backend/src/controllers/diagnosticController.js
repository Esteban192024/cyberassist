import prisma from '../prisma/client.js';

export const createDiagnostic = async (req, res) => {
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
      personalizedRecommendations,
      generalRecommendations,
      diagnosticMasteredIds,
      masteredQuestionIds,
      topicLearning,
    } = req.body;

    console.log('[DIAGNOSTIC SAVE] Origen: Frontend, Endpoint: POST /diagnostics, userId:', userId, 'topicLearning recibido:', topicLearning);

    const diagnosticMasteredIdsToSave = Array.isArray(diagnosticMasteredIds)
      ? diagnosticMasteredIds
      : Array.isArray(masteredQuestionIds)
      ? masteredQuestionIds
      : null;

    // Crear registro de diagnóstico
    const diagnostic = await prisma.diagnostic.create({
      data: {
        userId,
        score,
        total,
        masteredTotal,
        masteredGoal,
        riskLevel,
        strengths: strengths || [],
        weaknesses: weaknesses || [],
        personalizedRecommendations: personalizedRecommendations || null,
        generalRecommendations: generalRecommendations || [],
      },
    });

    console.log('[DIAGNOSTIC SAVE] Diagnóstico guardado en PostgreSQL, id:', diagnostic.id);

    // Actualizar UserProgress
    const userProgress = await prisma.userProgress.findUnique({
      where: { userId },
    });

    if (userProgress) {
      console.log('[USER PROGRESS UPDATE] Actualizando UserProgress para userId:', userId);
      
      const updatedUserProgress = await prisma.userProgress.update({
        where: { userId },
        data: {
          diagnosticMastered: Math.max(userProgress.diagnosticMastered, masteredTotal),
          diagnosticTotal: masteredGoal,
          diagnosticMasteredIds: diagnosticMasteredIdsToSave
            ? Array.from(new Set([...userProgress.diagnosticMasteredIds, ...diagnosticMasteredIdsToSave]))
            : userProgress.diagnosticMasteredIds,
          topicLearning: topicLearning || userProgress.topicLearning,
          programComplete:
            Math.max(userProgress.diagnosticMastered, masteredTotal) >= masteredGoal &&
            userProgress.simulationMastered >= userProgress.simulationTotal,
        },
      });

      console.log('[TOPIC LEARNING UPDATE] topicLearning actualizado en UserProgress:', updatedUserProgress.topicLearning);
      console.log('[USER PROGRESS UPDATE] UserProgress actualizado exitosamente para userId:', userId);
    }

    res.status(201).json({
      message: 'Diagnostic saved successfully',
      diagnostic,
    });
  } catch (error) {
    console.error('Create diagnostic error:', error);
    res.status(500).json({ error: 'Failed to save diagnostic' });
  }
};

export const getDiagnostics = async (req, res) => {
  try {
    const userId = req.user.userId;

    const diagnostics = await prisma.diagnostic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Formatear fechas a formato YYYY-MM-DD
    const formattedDiagnostics = diagnostics.map((d) => ({
      ...d,
      date: d.createdAt.toISOString().split('T')[0],
    }));

    res.json(formattedDiagnostics);
  } catch (error) {
    console.error('Get diagnostics error:', error);
    res.status(500).json({ error: 'Failed to fetch diagnostics' });
  }
};

export const getLatestDiagnostic = async (req, res) => {
  try {
    const userId = req.user.userId;

    const diagnostic = await prisma.diagnostic.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!diagnostic) {
      return res.status(404).json({ error: 'No diagnostic found' });
    }

    // Formatear fecha
    const formattedDiagnostic = {
      ...diagnostic,
      date: diagnostic.createdAt.toISOString().split('T')[0],
    };

    res.json(formattedDiagnostic);
  } catch (error) {
    console.error('Get latest diagnostic error:', error);
    res.status(500).json({ error: 'Failed to fetch latest diagnostic' });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { masteredQuestions, topicLearning } = req.body;

    const userProgress = await prisma.userProgress.findUnique({
      where: { userId },
    });

    if (userProgress) {
      await prisma.userProgress.update({
        where: { userId },
        data: {
          topicLearning: topicLearning || userProgress.topicLearning,
        },
      });
    }

    res.json({ message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};
