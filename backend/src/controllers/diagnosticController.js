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
    } = req.body;

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

    // Actualizar UserProgress
    const userProgress = await prisma.userProgress.findUnique({
      where: { userId },
    });

    if (userProgress) {
      await prisma.userProgress.update({
        where: { userId },
        data: {
          diagnosticMastered: Math.max(userProgress.diagnosticMastered, masteredTotal),
          diagnosticTotal: masteredGoal,
          diagnosticMasteredIds: diagnosticMasteredIdsToSave
            ? Array.from(new Set([...userProgress.diagnosticMasteredIds, ...diagnosticMasteredIdsToSave]))
            : userProgress.diagnosticMasteredIds,
          programComplete:
            Math.max(userProgress.diagnosticMastered, masteredTotal) >= masteredGoal &&
            userProgress.simulationMastered >= userProgress.simulationTotal,
        },
      });
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
