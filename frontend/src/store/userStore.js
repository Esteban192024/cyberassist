// Store Global Centralizado - Fuente Única de Verdad

import { useState, useEffect } from 'react'
import {
  getUserLevelData,
  getLevelInfo,
  getNextLevelXP,
  getCurrentLevelXP,
  getProgressPercentage,
} from '../utils/levelHelper'
import { calculateRiskLevel } from '../utils/quizHelper'
import {
  getUnlockedAchievements,
  getAllAchievements,
} from '../utils/achievementsHelper'
import { getLearningProgress, sanitizeTopicList, fetchDiagnostics, fetchSimulations, fetchUserProgress } from '../utils/progressHelper'
import { getUserActivities } from '../utils/activityHelper'
import { diagnosticAPI, simulationAPI, certificateAPI } from '../services/api'

// Cache para evitar llamadas duplicadas
let userDataCache = null
let cacheTimestamp = 0
const CACHE_DURATION = 30000 // 30 segundos

export const invalidateUserCache = () => {
  userDataCache = null
  cacheTimestamp = 0
}

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function safePercentage(part, total) {
  if (!total || total <= 0) return 0
  const value = Math.round((part / total) * 100)
  return Number.isFinite(value) ? value : 0
}

export { safePercentage }

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('currentUser'))
}

export const getUserData = async () => {
  const currentUser = getCurrentUser()
  if (!currentUser) return null

  const userId = currentUser.id

  // Verificar cache
  const now = Date.now()
  if (userDataCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return userDataCache
  }

  // Obtener datos de la API
  let results = []
  let simulationsResults = []

  try {
    const [diagnosticsData, simulationsData] = await Promise.all([
      diagnosticAPI.getAll(),
      simulationAPI.getAll(),
    ])
    results = diagnosticsData.data || []
    simulationsResults = simulationsData.data || []
  } catch (error) {
    return null
  }

  const levelData = getUserLevelData()
  const unlockedAchievements = await getUnlockedAchievements()
  
  let certificateUnlocked = false
  try {
    const certificatesResponse = await certificateAPI.getUserCertificates()
    certificateUnlocked = certificatesResponse.data && certificatesResponse.data.length > 0
  } catch (error) {
    console.error('Error fetching certificates:', error)
    certificateUnlocked = false
  }

  const learning = getLearningProgress(userId)

  const diagnosticsCount = learning.diagnostic.mastered
  const simulationsCount = learning.simulation.mastered
  const diagnosticsTotal = learning.diagnostic.total
  const simulationsTotal = learning.simulation.total
  const diagnosticsComplete = learning.diagnostic.complete
  const simulationsComplete = learning.simulation.complete
  const programComplete = learning.programComplete

  const avgScore = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
    : 0
  const avgSimulationScore = simulationsResults.length > 0
    ? Math.round(simulationsResults.reduce((acc, r) => acc + r.score, 0) / simulationsResults.length)
    : 0

  const latestResult = results.length > 0 ? results[results.length - 1] : null
  const latestSimulationResult = simulationsResults.length > 0 ? simulationsResults[simulationsResults.length - 1] : null

  const latestRiskLevel =
    latestResult?.riskLevel ||
    latestResult?.level ||
    (latestResult ? calculateRiskLevel(latestResult.score, latestResult.total || 5) : 'Sin datos')

  const securityLevel = latestRiskLevel
  const badgesEarned = Math.min(unlockedAchievements.length, 5)
  const bestScore = results.length > 0 ? Math.max(...results.map((r) => r.score)) : 0
  const lastScore = latestResult?.score || 0

  const allAchievements = await getAllAchievements()
  const achievementProgress = {
    unlocked: unlockedAchievements.length,
    total: allAchievements.length,
    percentage: safePercentage(unlockedAchievements.length, allAchievements.length),
  }

  const userData = {
    user: currentUser,
    xp: levelData?.xp || 0,
    level: levelData?.level || 1,
    levelName: getLevelInfo(levelData?.level || 1)?.name || 'Novato Digital',
    levelIcon: getLevelInfo(levelData?.level || 1)?.icon || '🌱',
    nextLevelXP: getNextLevelXP(levelData?.level || 1),
    currentLevelXP: getCurrentLevelXP(levelData?.level || 1),
    progressPercentage: getProgressPercentage(levelData?.xp || 0, levelData?.level || 1),

    diagnosticsCount,
    diagnosticsTotal,
    diagnosticsComplete,
    diagnosticProgress: learning.diagnostic,
    results,
    latestResult,
    avgScore,
    bestScore,
    lastScore,
    securityLevel,

    simulationsCount,
    simulationsTotal,
    simulationsComplete,
    simulationProgress: learning.simulation,
    simulationsResults,
    latestSimulationResult,
    avgSimulationScore,

    strengths: sanitizeTopicList(learning.strengths),
    weaknesses: sanitizeTopicList(learning.weaknesses),
    learningProgress: learning,

    unlockedAchievements,
    allAchievements,
    achievementProgress,
    badgesEarned,

    certificateUnlocked,
    canUnlockCertificate: programComplete && !certificateUnlocked,
    programComplete,

    totalActivities: diagnosticsCount + simulationsCount,
  }

  userDataCache = userData
  cacheTimestamp = Date.now()

  return userData
}

export const getDashboardStats = async () => {
  const userData = await getUserData()
  if (!userData) return null

  return {
    diagnosticsCount: userData.diagnosticsCount,
    diagnosticsTotal: userData.diagnosticsTotal,
    diagnosticProgress: userData.diagnosticProgress,
    simulationsCount: userData.simulationsCount,
    simulationsTotal: userData.simulationsTotal,
    simulationProgress: userData.simulationProgress,
    badgesEarned: userData.badgesEarned,
    securityLevel: userData.securityLevel,
    strengths: userData.strengths,
    weaknesses: userData.weaknesses,
    programComplete: userData.programComplete,
    certificateUnlocked: userData.certificateUnlocked,
    xp: userData.xp,
    level: userData.level,
    levelName: userData.levelName,
    progressPercentage: userData.progressPercentage,
    unlockedAchievements: userData.unlockedAchievements,
    allAchievements: userData.allAchievements,
    achievementProgress: userData.achievementProgress,
    results: userData.results,
  }
}

export const getProfileStats = async () => await getDashboardStats()

function getResultsDataFromUser(userData) {
  return {
    results: userData.results,
    simulationsResults: userData.simulationsResults,
    latestResult: userData.latestResult,
    diagnosticsCount: userData.diagnosticsCount,
    diagnosticsTotal: userData.diagnosticsTotal,
    simulationsCount: userData.simulationsCount,
    simulationsTotal: userData.simulationsTotal,
    diagnosticProgress: userData.diagnosticProgress,
    simulationProgress: userData.simulationProgress,
    diagnosticsComplete: userData.diagnosticsComplete,
    simulationsComplete: userData.simulationsComplete,
    programComplete: userData.programComplete,
    strengths: userData.strengths,
    weaknesses: userData.weaknesses,
    certificateUnlocked: userData.certificateUnlocked,
    canUnlockCertificate: userData.canUnlockCertificate,
    xp: userData.xp,
    level: userData.level,
    levelName: userData.levelName,
    securityLevel: userData.securityLevel,
    avgScore: userData.avgScore,
    bestScore: userData.bestScore,
    lastScore: userData.lastScore,
  }
}

export const getResultsData = async () => {
  const userData = await getUserData()
  if (!userData) return null
  return getResultsDataFromUser(userData)
}

export const getSimulationsData = async () => {
  const userData = await getUserData()
  if (!userData) return null

  return {
    simulationsResults: userData.simulationsResults,
    simulationsCount: userData.simulationsCount,
    simulationsTotal: userData.simulationsTotal,
    simulationProgress: userData.simulationProgress,
    diagnosticsCount: userData.diagnosticsCount,
    diagnosticsTotal: userData.diagnosticsTotal,
    diagnosticProgress: userData.diagnosticProgress,
    diagnosticsComplete: userData.diagnosticsComplete,
    simulationsComplete: userData.simulationsComplete,
    programComplete: userData.programComplete,
    certificateUnlocked: userData.certificateUnlocked,
    canUnlockCertificate: userData.canUnlockCertificate,
    xp: userData.xp,
    level: userData.level,
  }
}

export const checkAchievementUnlocked = async (achievementId) => {
  const userData = await getUserData()
  if (!userData) return false
  return userData.unlockedAchievements.includes(achievementId)
}

function parseHistoryDate(dateStr) {
  if (!dateStr) return 0
  return new Date(`${dateStr}T12:00:00`).getTime()
}

export const buildCombinedHistory = (userData) => {
  if (!userData) return []

  const combined = [
    ...userData.results.filter(Boolean).map((r, index) => ({
      ...r,
      type: 'diagnostic',
      displayType: 'Diagnóstico',
      _order: index,
    })),
    ...userData.simulationsResults.filter(Boolean).map((r, index) => ({
      ...r,
      type: 'simulation',
      displayType: 'Simulación',
      score: r.score,
      total: r.total,
      _order: userData.results.length + index,
    })),
  ]

  const seenIds = new Set()
  const unique = combined.filter((item) => {
    if (!item.id) return true
    if (seenIds.has(item.id)) return false
    seenIds.add(item.id)
    return true
  })

  return unique
    .sort((a, b) => {
      const dateDiff = parseHistoryDate(b.date) - parseHistoryDate(a.date)
      if (dateDiff !== 0) return dateDiff
      return (b._order ?? 0) - (a._order ?? 0)
    })
    .map(({ _order, ...item }) => item)
}

export const getCombinedHistory = async () => {
  const userData = await getUserData()
  return buildCombinedHistory(userData)
}

export const buildEvolutionData = (userData) => {
  if (!userData || !Array.isArray(userData.results)) return []

  return userData.results.map((result, index) => ({
    name: `S${index + 1}`,
    score: result?.masteredTotal ?? result?.score ?? 0,
    date: result?.date ?? '',
    level: result?.level ?? result?.riskLevel ?? 'Sin datos',
  }))
}

export const getEvolutionData = async (userData = null) => {
  const data = userData || await getUserData()
  return buildEvolutionData(data)
}

export const loadResultsPageData = async () => {
  const userData = await getUserData()
  if (!userData) return null

  return {
    ...getResultsDataFromUser(userData),
    allHistory: buildCombinedHistory(userData),
    chartData: buildEvolutionData(userData),
  }
}

export const loadDashboardPageData = async () => {
  const [userData, activities] = await Promise.all([
    getUserData(),
    getUserActivities(),
  ])

  if (!userData) return null

  return {
    dashboardStats: {
      diagnosticsCount: userData.diagnosticsCount,
      diagnosticsTotal: userData.diagnosticsTotal,
      diagnosticProgress: userData.diagnosticProgress,
      simulationsCount: userData.simulationsCount,
      simulationsTotal: userData.simulationsTotal,
      simulationProgress: userData.simulationProgress,
      badgesEarned: userData.badgesEarned,
      securityLevel: userData.securityLevel,
      strengths: userData.strengths,
      weaknesses: userData.weaknesses,
      programComplete: userData.programComplete,
      certificateUnlocked: userData.certificateUnlocked,
      xp: userData.xp,
      level: userData.level,
      levelName: userData.levelName,
      progressPercentage: userData.progressPercentage,
      unlockedAchievements: userData.unlockedAchievements,
      allAchievements: userData.allAchievements,
      achievementProgress: userData.achievementProgress,
      results: userData.results,
      avgScore: userData.avgScore,
    },
    chartData: buildEvolutionData(userData),
    activities,
  }
}

export const useUserData = () => {
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    setUserData(getUserData())
  }, [])

  return userData
}
