import { DIAGNOSTIC_QUESTIONS } from '../data/diagnosticQuestions'
import { SIMULATION_SCENARIOS } from '../data/simulationScenarios'
import { filterValidQuestions, filterValidScenarios } from './validationHelper'
import { shuffleArray } from './quizHelper'
import { diagnosticAPI, simulationAPI, userAPI } from '../services/api'

export const TOTAL_DIAGNOSTIC_ITEMS = 15
export const TOTAL_SIMULATION_ITEMS = 15
export const ITEMS_PER_SESSION = 5

/** Elimina temas duplicados preservando el orden. */
export function dedupeTopics(topics) {
  if (!Array.isArray(topics)) return []
  return [...new Set(topics.filter(Boolean))]
}

const INVALID_TOPICS = new Set(['Máster en Bellas Artes'])

const TOPIC_ALIASES = {
  'Gestión de': 'Gestión de credenciales',
}

function getOfficialTopicSet() {
  const topics = new Set()
  getDiagnosticBank().forEach((q) => topics.add(q.topic))
  getSimulationBank().forEach((s) => topics.add(s.topic))
  return topics
}

function normalizeTopicName(topic) {
  if (!topic || typeof topic !== 'string') return null
  const trimmed = topic.trim().replace(/\s+/g, ' ')
  if (!trimmed || INVALID_TOPICS.has(trimmed)) return null

  if (TOPIC_ALIASES[trimmed]) return TOPIC_ALIASES[trimmed]
  if (trimmed === 'Gestión de' || trimmed === 'Gestión de cred') {
    return 'Gestión de credenciales'
  }

  return trimmed
}

/** Filtra temas inválidos, corrige alias y elimina duplicados. */
export function sanitizeTopicList(topics) {
  const official = getOfficialTopicSet()
  const result = []
  const seen = new Set()

  dedupeTopics(topics).forEach((raw) => {
    const normalized = normalizeTopicName(raw)
    if (!normalized || !official.has(normalized) || seen.has(normalized)) return
    seen.add(normalized)
    result.push(normalized)
  })

  return result
}

const keys = {
  masteredQuestions: (userId) => `masteredQuestions_${userId}`,
  masteredScenarios: (userId) => `masteredScenarios_${userId}`,
  topicLearning: (userId) => `topicLearning_${userId}`,
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// Cache para datos de la API
let apiProgressCache = null
let apiDiagnosticsCache = null
let apiSimulationsCache = null

export const invalidateApiProgressCache = () => {
  apiProgressCache = null
}

export async function fetchUserProgress() {
  console.log('[DEBUG] fetchUserProgress - BEFORE apiProgressCache:', apiProgressCache ? 'EXISTS' : 'NULL')
  try {
    const response = await userAPI.getProfile()
    if (response.data?.userProgress) {
      apiProgressCache = response.data.userProgress
      console.log('[DEBUG] fetchUserProgress - AFTER apiProgressCache:', { diagnosticMastered: apiProgressCache.diagnosticMastered, source: 'API' })
      return response.data.userProgress
    }
  } catch (error) {
    console.error('Error fetching user progress:', error)
  }
  console.log('[DEBUG] fetchUserProgress - FAILED, apiProgressCache remains:', apiProgressCache ? 'UNCHANGED' : 'NULL')
  return null
}

export async function fetchDiagnostics() {
  try {
    const response = await diagnosticAPI.getAll()
    apiDiagnosticsCache = response.data || []
    return response.data || []
  } catch (error) {
    console.error('Error fetching diagnostics:', error)
    return []
  }
}

export async function fetchSimulations() {
  try {
    const response = await simulationAPI.getAll()
    apiSimulationsCache = response.data || []
    return response.data || []
  } catch (error) {
    console.error('Error fetching simulations:', error)
    return []
  }
}

export function getCachedProgress() {
  return apiProgressCache
}

export function getCachedDiagnostics() {
  return apiDiagnosticsCache || []
}

export function getCachedSimulations() {
  return apiSimulationsCache || []
}

/** Banco oficial de 15 preguntas de diagnóstico */
export function getDiagnosticBank() {
  return filterValidQuestions(DIAGNOSTIC_QUESTIONS).slice(0, TOTAL_DIAGNOSTIC_ITEMS)
}

/** Banco oficial de 15 escenarios de simulación */
export function getSimulationBank() {
  return filterValidScenarios(SIMULATION_SCENARIOS).slice(0, TOTAL_SIMULATION_ITEMS)
}

export function getMasteredQuestions(userId) {
  if (!userId) return []
  return readJson(keys.masteredQuestions(userId), [])
}

export function getMasteredScenarios(userId) {
  if (!userId) return []
  return readJson(keys.masteredScenarios(userId), [])
}

export function isQuestionMastered(userId, questionId) {
  return getMasteredQuestions(userId).includes(questionId)
}

export function isScenarioMastered(userId, scenarioId) {
  return getMasteredScenarios(userId).includes(scenarioId)
}

/**
 * Marca pregunta como dominada. Retorna true si es la primera vez.
 */
export function markQuestionMastered(userId, questionId) {
  if (!userId || !questionId) return false
  const mastered = getMasteredQuestions(userId)
  console.log('[DEBUG] markQuestionMastered - BEFORE:', { masteredCount: mastered.length, source: 'localStorage' })
  if (mastered.includes(questionId)) return false
  mastered.push(questionId)
  writeJson(keys.masteredQuestions(userId), mastered)
  invalidateApiProgressCache()
  console.log('[DEBUG] markQuestionMastered - AFTER:', { masteredCount: mastered.length, source: 'localStorage' })
  return true
}

/**
 * Marca escenario como dominado. Retorna true si es la primera vez.
 */
export function markScenarioMastered(userId, scenarioId) {
  if (!userId || !scenarioId) return false
  const mastered = getMasteredScenarios(userId)
  if (mastered.includes(scenarioId)) return false
  mastered.push(scenarioId)
  writeJson(keys.masteredScenarios(userId), mastered)
  invalidateApiProgressCache()
  return true
}

export function getTopicLearningStats(userId) {
  // Primero intentar usar el cache de la API
  if (apiProgressCache?.topicLearning) {
    return apiProgressCache.topicLearning
  }

  // Fallback a localStorage
  if (!userId) return {}
  return readJson(keys.topicLearning(userId), {})
}

export function recordTopicAttempt(userId, topic, correct) {
  if (!userId || !topic) return
  const stats = getTopicLearningStats(userId)
  if (!stats[topic]) {
    stats[topic] = { correct: 0, incorrect: 0 }
  }
  if (correct) {
    stats[topic].correct++
  } else {
    stats[topic].incorrect++
  }
  writeJson(keys.topicLearning(userId), stats)
}

export function getPendingQuestions(userId) {
  const bank = getDiagnosticBank()
  const mastered = new Set(getMasteredQuestions(userId))
  return bank.filter((q) => !mastered.has(q.id))
}

export function getPendingScenarios(userId) {
  const bank = getSimulationBank()
  const mastered = new Set(getMasteredScenarios(userId))
  return bank.filter((s) => !mastered.has(s.id))
}

/**
 * Selecciona hasta N ítems pendientes aleatorios para la sesión actual.
 */
export function selectPendingForSession(pendingItems, maxCount = ITEMS_PER_SESSION) {
  if (pendingItems.length === 0) return []
  return shuffleArray(pendingItems).slice(0, Math.min(maxCount, pendingItems.length))
}

export function getDiagnosticProgress(userId) {
  console.log('[DEBUG] getDiagnosticProgress - apiProgressCache:', apiProgressCache ? 'EXISTS' : 'NULL')
  // Primero intentar usar el cache de la API
  if (apiProgressCache) {
    const mastered = apiProgressCache.diagnosticMastered || 0
    const total = apiProgressCache.diagnosticTotal || TOTAL_DIAGNOSTIC_ITEMS
    console.log('[DEBUG] getDiagnosticProgress - USING apiProgressCache:', { mastered, total, source: 'apiProgressCache' })
    return {
      mastered,
      total,
      pending: total - mastered,
      percentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
      complete: mastered >= total,
    }
  }

  // Fallback a localStorage
  const mastered = getMasteredQuestions(userId).length
  const total = TOTAL_DIAGNOSTIC_ITEMS
  console.log('[DEBUG] getDiagnosticProgress - USING localStorage:', { mastered, total, source: 'localStorage' })
  return {
    mastered,
    total,
    pending: total - mastered,
    percentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
    complete: mastered >= total,
  }
}

export function getSimulationProgress(userId) {
  console.log('[DEBUG] getSimulationProgress - apiProgressCache:', apiProgressCache ? 'EXISTS' : 'NULL')
  // Primero intentar usar el cache de la API
  if (apiProgressCache) {
    const mastered = apiProgressCache.simulationMastered || 0
    const total = apiProgressCache.simulationTotal || TOTAL_SIMULATION_ITEMS
    console.log('[DEBUG] getSimulationProgress - USING apiProgressCache:', { mastered, total, source: 'apiProgressCache' })
    return {
      mastered,
      total,
      pending: total - mastered,
      percentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
      complete: mastered >= total,
    }
  }

  // Fallback a localStorage
  const mastered = getMasteredScenarios(userId).length
  const total = TOTAL_SIMULATION_ITEMS
  console.log('[DEBUG] getSimulationProgress - USING localStorage:', { mastered, total, source: 'localStorage' })
  return {
    mastered,
    total,
    pending: total - mastered,
    percentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
    complete: mastered >= total,
  }
}

/**
 * Análisis acumulativo de fortalezas y debilidades por tema.
 */
export function getCumulativeTopicAnalysis(userId) {
  const topicStats = getTopicLearningStats(userId)
  const masteredQ = new Set(getMasteredQuestions(userId))
  const masteredS = new Set(getMasteredScenarios(userId))

  const masteredTopics = new Set()
  getDiagnosticBank().forEach((q) => {
    if (masteredQ.has(q.id)) masteredTopics.add(q.topic)
  })
  getSimulationBank().forEach((s) => {
    if (masteredS.has(s.id)) masteredTopics.add(s.topic)
  })

  const strengths = []
  const weaknesses = []

  masteredTopics.forEach((topic) => {
    const stats = topicStats[topic]
    if (!stats || stats.incorrect === 0) {
      strengths.push(topic)
    }
  })

  Object.entries(topicStats).forEach(([topic, stats]) => {
    if (stats.incorrect > 0 && !masteredTopics.has(topic)) {
      weaknesses.push(topic)
    } else if (stats.incorrect > stats.correct) {
      if (!weaknesses.includes(topic)) weaknesses.push(topic)
    }
  })

  getPendingQuestions(userId).forEach((q) => {
    if (topicStats[q.topic]?.incorrect > 0 && !weaknesses.includes(q.topic)) {
      weaknesses.push(q.topic)
    }
  })

  getPendingScenarios(userId).forEach((s) => {
    if (topicStats[s.topic]?.incorrect > 0 && !weaknesses.includes(s.topic)) {
      weaknesses.push(s.topic)
    }
  })

  return {
    strengths: sanitizeTopicList(strengths),
    weaknesses: sanitizeTopicList(weaknesses),
    topicStats,
  }
}

/**
 * Progreso global del programa (fuente única de verdad).
 */
export function getLearningProgress(userId) {
  console.log('[DEBUG] getLearningProgress - apiProgressCache:', apiProgressCache ? 'EXISTS' : 'NULL')
  if (!userId) {
    return {
      diagnostic: {
        mastered: 0,
        total: TOTAL_DIAGNOSTIC_ITEMS,
        pending: TOTAL_DIAGNOSTIC_ITEMS,
        percentage: 0,
        complete: false,
      },
      simulation: {
        mastered: 0,
        total: TOTAL_SIMULATION_ITEMS,
        pending: TOTAL_SIMULATION_ITEMS,
        percentage: 0,
        complete: false,
      },
      programComplete: false,
      strengths: [],
      weaknesses: [],
    }
  }

  const diagnostic = getDiagnosticProgress(userId)
  const simulation = getSimulationProgress(userId)
  const { strengths, weaknesses } = getCumulativeTopicAnalysis(userId)

  console.log('[DEBUG] getLearningProgress - RETURNING:', {
    diagnosticMastered: diagnostic.mastered,
    diagnosticSource: apiProgressCache ? 'apiProgressCache' : 'localStorage',
    simulationMastered: simulation.mastered,
    simulationSource: apiProgressCache ? 'apiProgressCache' : 'localStorage',
    programComplete: diagnostic.complete && simulation.complete
  })

  return {
    diagnostic,
    simulation,
    programComplete: diagnostic.complete && simulation.complete,
    strengths: sanitizeTopicList(strengths),
    weaknesses: sanitizeTopicList(weaknesses),
  }
}

/**
 * Limpia datos corruptos históricos en localStorage.
 * Aplica sanitizeTopicList a todos los resultados guardados.
 */
export function sanitizeHistoricalData(userId) {
  if (!userId) return false

  try {
    // Limpiar resultados de diagnósticos
    const resultsKey = `results_${userId}`
    const results = readJson(resultsKey, [])
    const cleanedResults = results.map((result) => ({
      ...result,
      strengths: sanitizeTopicList(result.strengths || []),
      weaknesses: sanitizeTopicList(result.weaknesses || []),
    }))
    writeJson(resultsKey, cleanedResults)

    // Limpiar resultados de simulaciones
    const simulationsKey = `simulationsResults_${userId}`
    const simulations = readJson(simulationsKey, [])
    const cleanedSimulations = simulations.map((result) => ({
      ...result,
      strengths: sanitizeTopicList(result.strengths || []),
      weaknesses: sanitizeTopicList(result.weaknesses || []),
    }))
    writeJson(simulationsKey, cleanedSimulations)

    return true
  } catch (error) {
    console.error('Error sanitizing historical data:', error)
    return false
  }
}
