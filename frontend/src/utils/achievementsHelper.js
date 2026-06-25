// Sistema de logros y achievements - Migrado a Neon/Prisma
import { registerActivity } from './activityHelper'
import { addXP } from './levelHelper'
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
  const newlyUnlocked = []
  
  // Obtener logros desbloqueados del usuario desde API
  try {
    const response = await achievementAPI.getUserAchievements()
    userAchievementsCache = response.data || []
  } catch (error) {
    console.error('Error fetching user achievements:', error)
    return newlyUnlocked
  }

  const unlockedCodes = userAchievementsCache.map(ua => ua.achievement.code)
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

  for (const { code, condition } of achievementsToCheck) {
    if (condition && !unlockedCodes.includes(code)) {
      if (silent) {
        try {
          await achievementAPI.unlock({ code })
          newlyUnlocked.push(code)
          // Actualizar cache
          userAchievementsCache.push({ achievement: { code } })
        } catch (error) {
          console.error(`Error unlocking achievement ${code}:`, error)
        }
      } else {
        const achievement = await unlockAchievement(code)
        if (achievement) newlyUnlocked.push(achievement)
      }
    }
  }

  return newlyUnlocked
}

export const syncAchievements = () => evaluateAchievements({ type: 'sync' }, { silent: true })

export const getUnlockedAchievements = async () => {
  try {
    const response = await achievementAPI.getUserAchievements()
    userAchievementsCache = response.data || []
    return userAchievementsCache.map(ua => ua.achievement.code)
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
  try {
    const response = await achievementAPI.unlock({ code: achievementCode })
    const achievement = response.data.userAchievement.achievement
    
    // Actualizar cache
    if (!userAchievementsCache) {
      userAchievementsCache = []
    }
    userAchievementsCache.push(response.data.userAchievement)

    registerActivity('achievement', `Logro desbloqueado: ${achievement.name}`, achievement.description)

    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('achievement', `🎉 ${achievement.name} desbloqueado!`)
    }

    addXP('achievement')

    return achievement
  } catch (error) {
    console.error('Error unlocking achievement:', error)
    if (error.response?.status === 400) {
      // Ya desbloqueado, no es error
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
