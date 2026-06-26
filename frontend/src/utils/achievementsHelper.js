// Sistema de logros y achievements - Migrado a Neon/Prisma
import { registerActivity } from './activityHelper'
import { addXP, getUserLevelData } from './levelHelper'
import { LEVELS } from './levelHelper'
import {
  getMasteredQuestions,
  getMasteredScenarios,
  TOTAL_DIAGNOSTIC_ITEMS,
  TOTAL_SIMULATION_ITEMS,
  getLearningProgress,
} from './progressHelper'
import { achievementAPI } from '../services/api'

// Cache local para logros (se llena desde API)
let allAchievementsCache = null
let userAchievementsCache = null

// Función para inicializar el catálogo de logros (llamar al inicio de la app)
export const initializeAchievements = async () => {
  try {
    await achievementAPI.initialize()
    const response = await achievementAPI.getAll()
    allAchievementsCache = response.data || []
  } catch (error) {
    console.error('Error initializing achievements:', error)
  }
}

function hasPerfectDiagnosticSession(results) {
  return results.some((r) => r.total > 0 && r.score === r.total)
}

function hasPerfectSimulationSession(simulationsResults) {
  return simulationsResults.some((r) => r.total > 0 && r.score === r.total)
}

async function evaluateAchievements(context = {}, { silent = false } = {}) {
  console.log('[ACHIEVEMENTS] Evaluation started', { context, silent })
  console.log('[DEBUG] checkAchievements() called with context:', context)
  const newlyUnlocked = []
  
  // Obtener logros desbloqueados del usuario desde API
  try {
    const response = await achievementAPI.getUserAchievements()
    userAchievementsCache = response.data || []
    console.log('[DEBUG] evaluateAchievements - userAchievementsCache:', userAchievementsCache.map(ua => ua.achievement.code))
  } catch (error) {
    console.error('Error fetching user achievements:', error)
    return newlyUnlocked
  }

  const unlockedCodes = userAchievementsCache.map(ua => ua.achievement.code)
  console.log('[DEBUG] evaluateAchievements - unlockedCodes before loop:', unlockedCodes)
  const userId = JSON.parse(localStorage.getItem('currentUser'))?.id
  if (!userId) return newlyUnlocked

  const results = [] // Se obtendrán desde API en el futuro
  const simulationsResults = [] // Se obtendrán desde API en el futuro
  const userProgress = JSON.parse(localStorage.getItem(`userProgress_${userId}`)) || { level: 1 }
  const masteredQuestions = getMasteredQuestions(userId)
  const masteredScenarios = getMasteredScenarios(userId)
  const learning = getLearningProgress(userId)

  const perfectDiagnosticSession =
    (context.type === 'diagnostic' && context.score === context.total && context.total > 0) ||
    hasPerfectDiagnosticSession(results)

  const perfectSimulationSession =
    (context.type === 'simulation' && context.score === context.total && context.total > 0) ||
    hasPerfectSimulationSession(simulationsResults)

  const achievementsToCheck = [
    { code: 'first_diagnostic', condition: masteredQuestions.length >= 1 },
    { code: 'diagnostic_master', condition: masteredQuestions.length >= TOTAL_DIAGNOSTIC_ITEMS },
    { code: 'perfect_score', condition: perfectDiagnosticSession },
    { code: 'first_simulation', condition: masteredScenarios.length >= 1 },
    { code: 'simulation_master', condition: masteredScenarios.length >= TOTAL_SIMULATION_ITEMS },
    { code: 'perfect_simulation', condition: perfectSimulationSession },
    { code: 'level_2', condition: userProgress.level >= 2 },
    { code: 'level_3', condition: userProgress.level >= 3 },
    { code: 'level_4', condition: userProgress.level >= 4 },
    { code: 'level_5', condition: userProgress.level >= 5 },
    { code: 'security_expert', condition: learning.diagnostic.complete },
    { code: 'phishing_expert', condition: perfectSimulationSession },
    { code: 'program_complete', condition: learning.programComplete },
  ]

  // Obtener logros ya notificados en esta sesión para evitar duplicados
  const sessionNotified = JSON.parse(sessionStorage.getItem('sessionNotifiedAchievements') || '[]')
  
  // Guardar nivel antes de desbloquear logros
  const oldLevel = userProgress.level

  for (const { code, condition } of achievementsToCheck) {
    console.log('[ACHIEVEMENTS] Evaluating achievement:', {
      code,
      conditionMet: condition,
      alreadyUnlocked: unlockedCodes.includes(code),
      sessionNotified: sessionNotified.includes(code),
      willAttemptUnlock: condition && !unlockedCodes.includes(code) && !sessionNotified.includes(code)
    })
    console.log('[DEBUG] evaluateAchievements - checking achievement:', code, 'condition:', condition, 'already unlocked:', unlockedCodes.includes(code), 'session notified:', sessionNotified.includes(code))
    if (condition && !unlockedCodes.includes(code) && !sessionNotified.includes(code)) {
      if (silent) {
        try {
          await achievementAPI.unlock({ code })
          newlyUnlocked.push(code)
          // Actualizar cache
          userAchievementsCache.push({ achievement: { code } })
          // Marcar como notificado en esta sesión
          sessionNotified.push(code)
          sessionStorage.setItem('sessionNotifiedAchievements', JSON.stringify(sessionNotified))
        } catch (error) {
          console.error(`Error unlocking achievement ${code}:`, error)
        }
      } else {
        console.log('[DEBUG] evaluateAchievements - calling unlockAchievement for:', code)
        const achievement = await unlockAchievement(code)
        console.log('[DEBUG] evaluateAchievements - unlockAchievement returned:', achievement)
        if (achievement) {
          newlyUnlocked.push(achievement)
          // Marcar como notificado en esta sesión
          sessionNotified.push(code)
          sessionStorage.setItem('sessionNotifiedAchievements', JSON.stringify(sessionNotified))
        }
      }
    }
  }

  // Consolidar notificación de nivel al final si cambió
  const newLevel = getUserLevelData()?.level || oldLevel
  if (newLevel > oldLevel && !silent) {
    // Mostrar solo un toast del nivel final alcanzado
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('level', `🎊 ¡Nivel ${newLevel}: ${LEVELS[newLevel]?.name || 'Desconocido'}!`)
    }
  }

  return newlyUnlocked
}

export const syncAchievements = () => evaluateAchievements({ type: 'sync' }, { silent: true })

export const getUnlockedAchievements = async () => {
  try {
    console.log('[DEBUG] getUnlockedAchievements - calling achievementAPI.getUserAchievements')
    const response = await achievementAPI.getUserAchievements()
    userAchievementsCache = response.data || []
    const codes = userAchievementsCache.map(ua => ua.achievement.code)
    console.log('[DEBUG] getUnlockedAchievements - returned codes:', codes)
    return codes
  } catch (error) {
    console.error('Error fetching unlocked achievements:', error)
    return []
  }
}

export const isAchievementUnlocked = (achievementCode) => {
  if (!userAchievementsCache) return false
  return userAchievementsCache.some(ua => ua.achievement.code === achievementCode)
}

export const unlockAchievement = async (achievementCode) => {
  const alreadyUnlocked = isAchievementUnlocked(achievementCode)
  console.log('[ACHIEVEMENTS] Unlock request', {
    code: achievementCode,
    alreadyUnlocked: alreadyUnlocked ? 'YES' : 'NO',
    apiCall: 'achievementAPI.unlock',
    apiResponse: 'pending'
  })
  console.log('[DEBUG] unlockAchievement() called with code:', achievementCode)
  try {
    console.log('[DEBUG] unlockAchievement - calling achievementAPI.unlock for:', achievementCode)
    const response = await achievementAPI.unlock({ code: achievementCode })
    console.log('[DEBUG] unlockAchievement - achievementAPI.unlock response:', response.status, response.data)
    const achievement = response.data.userAchievement.achievement
    
    // Actualizar cache
    if (!userAchievementsCache) {
      userAchievementsCache = []
    }
    userAchievementsCache.push(response.data.userAchievement)

    registerActivity('achievement', `Logro desbloqueado: ${achievement.name}`, achievement.description)

    console.log('[DEBUG] unlockAchievement - showing toast for:', achievement.name)
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('achievement', `🎉 ${achievement.name} desbloqueado!`)
    }

    // No mostrar toast de nivel individualmente, se consolidará al final
    addXP('achievement', null, false)

    return achievement
  } catch (error) {
    console.error('[DEBUG] unlockAchievement - error:', error.response?.status, error.message)
    if (error.response?.status === 400) {
      // Ya desbloqueado, no es error
      console.log('[DEBUG] unlockAchievement - achievement already unlocked (400)')
      return null
    }
    return null
  }
}

export const checkAchievements = (context) => evaluateAchievements(context)

export const getAchievementById = async (code) => {
  if (!allAchievementsCache) {
    try {
      const response = await achievementAPI.getAll()
      allAchievementsCache = response.data || []
    } catch (error) {
      console.error('Error fetching achievements:', error)
      return null
    }
  }
  return allAchievementsCache.find(a => a.code === code) || null
}

export const getAllAchievements = async () => {
  if (!allAchievementsCache) {
    try {
      const response = await achievementAPI.getAll()
      allAchievementsCache = response.data || []
    } catch (error) {
      console.error('Error fetching achievements:', error)
      return []
    }
  }
  return allAchievementsCache
}
