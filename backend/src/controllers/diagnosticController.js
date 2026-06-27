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

    console.log('[DIAGNOSTIC SAVE] 1. INICIO - userId:', userId);
    console.log('[DIAGNOSTIC SAVE] 2. Datos recibidos de frontend:', {
      masteredTotal,
      diagnosticMasteredIds: JSON.stringify(diagnosticMasteredIds, null, 2),
      diagnosticMasteredIdsLength: diagnosticMasteredIds?.length,
      masteredQuestionIdsLength: masteredQuestionIds?.length,
    });

    const diagnosticMasteredIdsToSave = Array.isArray(diagnosticMasteredIds)
      ? diagnosticMasteredIds
      : Array.isArray(masteredQuestionIds)
      ? masteredQuestionIds
      : null;

    console.log('[DIAGNOSTIC SAVE] 3. diagnosticMasteredIdsToSave:', JSON.stringify(diagnosticMasteredIdsToSave, null, 2));

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

    console.log('[DIAGNOSTIC SAVE] 4. Diagnóstico creado en PostgreSQL, id:', diagnostic.id);

    // Actualizar UserProgress
    const userProgress = await prisma.userProgress.findUnique({
      where: { userId },
    });

    if (userProgress) {
      console.log('[USER PROGRESS UPDATE] 5. UserProgress actual ANTES de guardar:', {
        userId,
        diagnosticMastered: userProgress.diagnosticMastered,
        diagnosticMasteredIds: JSON.stringify(userProgress.diagnosticMasteredIds, null, 2),
        diagnosticMasteredIdsLength: userProgress.diagnosticMasteredIds?.length,
        topicLearning: userProgress.topicLearning,
      });
      
      const newDiagnosticMasteredIds = diagnosticMasteredIdsToSave
        ? Array.from(new Set([...userProgress.diagnosticMasteredIds, ...diagnosticMasteredIdsToSave]))
        : userProgress.diagnosticMasteredIds;

      const newDiagnosticMasteredCount = Math.max(userProgress.diagnosticMastered, masteredTotal);

      console.log('[USER PROGRESS UPDATE] 6. Datos a guardar en UserProgress:', {
        newDiagnosticMasteredCount,
        newDiagnosticMasteredIds: JSON.stringify(newDiagnosticMasteredIds, null, 2),
        newDiagnosticMasteredIdsLength: newDiagnosticMasteredIds?.length,
      });

      const updatedUserProgress = await prisma.userProgress.update({
        where: { userId },
        data: {
          diagnosticMastered: newDiagnosticMasteredCount,
          diagnosticTotal: masteredGoal,
          diagnosticMasteredIds: newDiagnosticMasteredIds,
          topicLearning: topicLearning || userProgress.topicLearning,
          programComplete:
            newDiagnosticMasteredCount >= masteredGoal &&
            userProgress.simulationMastered >= userProgress.simulationTotal,
        },
      });

      console.log('[USER PROGRESS UPDATE] 7. UserProgress DESPUÉS de guardar:', {
        userId,
        diagnosticMastered: updatedUserProgress.diagnosticMastered,
        diagnosticMasteredIds: JSON.stringify(updatedUserProgress.diagnosticMasteredIds, null, 2),
        diagnosticMasteredIdsLength: updatedUserProgress.diagnosticMasteredIds?.length,
        topicLearning: updatedUserProgress.topicLearning,
        programComplete: updatedUserProgress.programComplete,
      });
    }

    res.status(201).json({
      message: 'Diagnostic saved successfully',
      diagnostic,
    });
  } catch (error) {
    console.error('[DIAGNOSTIC SAVE] ERROR:', error);
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
