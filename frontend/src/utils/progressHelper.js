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

let apiProgressCache = null

export const invalidateUserProgressCache = () => {
  apiProgressCache = null
}

export const getCachedProgress = () => apiProgressCache

export async function fetchUserProgress(profileData = null) {
  console.log('[PROGRESS FETCH] 1. INICIO - profileData provided:', !!profileData)
  let loadedProgress

  if (profileData?.userProgress) {
    console.log('[PROGRESS FETCH] 2. Usando userProgress desde profileData:', JSON.stringify(profileData.userProgress, null, 2))
    loadedProgress = profileData.userProgress
  } else {
    try {
      console.log('[PROGRESS FETCH] 2. Llamando a userAPI.getProfile()')
      const response = await userAPI.getProfile()
      console.log('[PROGRESS FETCH] 3. Respuesta de userAPI.getProfile():', JSON.stringify(response.data, null, 2))
      loadedProgress = response.data?.userProgress || null
      console.log('[PROGRESS FETCH] 4. loadedProgress desde API:', JSON.stringify(loadedProgress, null, 2))
    } catch (error) {
      console.error('[PROGRESS FETCH] ERROR:', error)
      return apiProgressCache
    }
  }

  if (!loadedProgress) {
    console.log('[PROGRESS FETCH] 5. NO hay loadedProgress, retornando apiProgressCache:', JSON.stringify(apiProgressCache, null, 2))
    return apiProgressCache
  }

  if (apiProgressCache) {
    console.log('[PROGRESS FETCH] 6. apiProgressCache EXISTE, combinando con loadedProgress')
    console.log('[PROGRESS FETCH] 7. apiProgressCache ANTES de combinar:', JSON.stringify(apiProgressCache, null, 2))
    apiProgressCache = {
      diagnosticMasteredIds: Array.from(
        new Set([
          ...(apiProgressCache.diagnosticMasteredIds || []),
          ...(loadedProgress.diagnosticMasteredIds || []),
        ])
      ),
      simulationMasteredIds: Array.from(
        new Set([
          ...(apiProgressCache.simulationMasteredIds || []),
          ...(loadedProgress.simulationMasteredIds || []),
        ])
      ),
      diagnosticMastered: Math.max(
        apiProgressCache.diagnosticMastered || 0,
        loadedProgress.diagnosticMastered || 0
      ),
      simulationMastered: Math.max(
        apiProgressCache.simulationMastered || 0,
        loadedProgress.simulationMastered || 0
      ),
      diagnosticTotal: loadedProgress.diagnosticTotal || apiProgressCache.diagnosticTotal || TOTAL_DIAGNOSTIC_ITEMS,
      simulationTotal: loadedProgress.simulationTotal || apiProgressCache.simulationTotal || TOTAL_SIMULATION_ITEMS,
      topicLearning: {
        ...(loadedProgress.topicLearning || {}),
        ...(apiProgressCache.topicLearning || {}),
      },
      programComplete: loadedProgress.programComplete || apiProgressCache.programComplete || false,
    }
    console.log('[PROGRESS FETCH] 8. apiProgressCache DESPUÉS de combinar:', JSON.stringify(apiProgressCache, null, 2))
  } else {
    console.log('[PROGRESS FETCH] 9. NO hay apiProgressCache, usando loadedProgress:', JSON.stringify(loadedProgress, null, 2))
    apiProgressCache = loadedProgress
  }

  console.log('[PROGRESS FETCH] 10. apiProgressCache final:', JSON.stringify(apiProgressCache, null, 2))
  return apiProgressCache
}

export async function fetchDiagnostics() {
  try {
    const response = await diagnosticAPI.getAll()
    return response.data || []
  } catch (error) {
    console.error('Error fetching diagnostics:', error)
    return []
  }
}

export async function fetchSimulations() {
  try {
    const response = await simulationAPI.getAll()
    return response.data || []
  } catch (error) {
    console.error('Error fetching simulations:', error)
    return []
  }
}

export function getDiagnosticBank() {
  return filterValidQuestions(DIAGNOSTIC_QUESTIONS).slice(0, TOTAL_DIAGNOSTIC_ITEMS)
}

export function getSimulationBank() {
  return filterValidScenarios(SIMULATION_SCENARIOS).slice(0, TOTAL_SIMULATION_ITEMS)
}

export function getMasteredQuestions() {
  const result = apiProgressCache?.diagnosticMasteredIds || []
  console.log('[PROGRESS GET] getMasteredQuestions() called, returning:', JSON.stringify(result, null, 2))
  return result
}

export function getMasteredScenarios() {
  return apiProgressCache?.simulationMasteredIds || []
}

export function markQuestionMastered(userId, questionId) {
  console.log('[PROGRESS MARK] markQuestionMastered called for questionId:', questionId)
  if (!questionId) return false

  if (!apiProgressCache) {
    console.log('[PROGRESS MARK] apiProgressCache is null, initializing it')
    apiProgressCache = {
      diagnosticMasteredIds: [],
      simulationMasteredIds: [],
      topicLearning: {},
      diagnosticMastered: 0,
      simulationMastered: 0,
    }
  }

  const masteredIds = getMasteredQuestions()
  console.log('[PROGRESS MARK] masteredIds antes de agregar:', JSON.stringify(masteredIds, null, 2))
  if (masteredIds.includes(questionId)) {
    console.log('[PROGRESS MARK] questionId ya está en masteredIds, retornando false')
    return false
  }

  const updatedIds = Array.from(new Set([...masteredIds, questionId]))
  apiProgressCache.diagnosticMasteredIds = updatedIds
  apiProgressCache.diagnosticMastered = updatedIds.length

  console.log('[PROGRESS MARK] apiProgressCache después de actualizar:', JSON.stringify(apiProgressCache, null, 2))

  return true
}

export function markScenarioMastered(userId, scenarioId) {
  if (!scenarioId) return false

  if (!apiProgressCache) {
    apiProgressCache = {
      diagnosticMasteredIds: [],
      simulationMasteredIds: [],
      topicLearning: {},
      diagnosticMastered: 0,
      simulationMastered: 0,
    }
  }

  const masteredIds = getMasteredScenarios()
  if (masteredIds.includes(scenarioId)) return false

  const updatedIds = Array.from(new Set([...masteredIds, scenarioId]))
  apiProgressCache.simulationMasteredIds = updatedIds
  apiProgressCache.simulationMastered = updatedIds.length

  return true
}

export function recordTopicAttempt(userId, topic, isCorrect) {
  if (!topic || typeof isCorrect !== 'boolean') return

  if (!apiProgressCache) {
    apiProgressCache = {
      diagnosticMasteredIds: [],
      simulationMasteredIds: [],
      topicLearning: {},
      diagnosticMastered: 0,
      simulationMastered: 0,
    }
  }

  const topicLearning = apiProgressCache.topicLearning || {}
  const normalizedTopic = String(topic || '').trim()
  if (!normalizedTopic) return

  if (!topicLearning[normalizedTopic]) {
    topicLearning[normalizedTopic] = { correct: 0, incorrect: 0 }
  }

  if (isCorrect) {
    topicLearning[normalizedTopic].correct += 1
  } else {
    topicLearning[normalizedTopic].incorrect += 1
  }

  apiProgressCache.topicLearning = topicLearning
}

export function isQuestionMastered(questionId) {
  return getMasteredQuestions().includes(questionId)
}

export function isScenarioMastered(scenarioId) {
  return getMasteredScenarios().includes(scenarioId)
}

export function getTopicLearningStats() {
  return apiProgressCache?.topicLearning || {}
}

export function getPendingQuestions() {
  const bank = getDiagnosticBank()
  const mastered = new Set(getMasteredQuestions())
  return bank.filter((q) => !mastered.has(q.id))
}

export function getPendingScenarios() {
  const bank = getSimulationBank()
  const mastered = new Set(getMasteredScenarios())
  return bank.filter((s) => !mastered.has(s.id))
}

export function selectPendingForSession(pendingItems, maxCount = ITEMS_PER_SESSION) {
  if (pendingItems.length === 0) return []
  return shuffleArray(pendingItems).slice(0, Math.min(maxCount, pendingItems.length))
}

export function getDiagnosticProgress() {
  if (!apiProgressCache) {
    return {
      mastered: 0,
      total: TOTAL_DIAGNOSTIC_ITEMS,
      pending: TOTAL_DIAGNOSTIC_ITEMS,
      percentage: 0,
      complete: false,
    }
  }

  const mastered = apiProgressCache.diagnosticMastered || 0
  const total = apiProgressCache.diagnosticTotal || TOTAL_DIAGNOSTIC_ITEMS
  return {
    mastered,
    total,
    pending: total - mastered,
    percentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
    complete: mastered >= total,
  }
}

export function getSimulationProgress() {
  if (!apiProgressCache) {
    return {
      mastered: 0,
      total: TOTAL_SIMULATION_ITEMS,
      pending: TOTAL_SIMULATION_ITEMS,
      percentage: 0,
      complete: false,
    }
  }

  const mastered = apiProgressCache.simulationMastered || 0
  const total = apiProgressCache.simulationTotal || TOTAL_SIMULATION_ITEMS
  return {
    mastered,
    total,
    pending: total - mastered,
    percentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
    complete: mastered >= total,
  }
}

export function getCumulativeTopicAnalysis() {
  const topicStats = getTopicLearningStats()
  const masteredQ = new Set(getMasteredQuestions())
  const masteredS = new Set(getMasteredScenarios())

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

  getPendingQuestions().forEach((q) => {
    if (topicStats[q.topic]?.incorrect > 0 && !weaknesses.includes(q.topic)) {
      weaknesses.push(q.topic)
    }
  })

  getPendingScenarios().forEach((s) => {
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

export function getLearningProgress() {
  const diagnostic = getDiagnosticProgress()
  const simulation = getSimulationProgress()
  const { strengths, weaknesses } = getCumulativeTopicAnalysis()

  return {
    diagnostic,
    simulation,
    programComplete: diagnostic.complete && simulation.complete,
    strengths: sanitizeTopicList(strengths),
    weaknesses: sanitizeTopicList(weaknesses),
  }
}

export function sanitizeHistoricalData(userId) {
  if (!userId) return false

  try {
    const resultsKey = `results_${userId}`
    const results = JSON.parse(localStorage.getItem(resultsKey)) || []
    const cleanedResults = results.map((result) => ({
      ...result,
      strengths: sanitizeTopicList(result.strengths || []),
      weaknesses: sanitizeTopicList(result.weaknesses || []),
    }))
    localStorage.setItem(resultsKey, JSON.stringify(cleanedResults))

    const simulationsKey = `simulationsResults_${userId}`
    const simulations = JSON.parse(localStorage.getItem(simulationsKey)) || []
    const cleanedSimulations = simulations.map((result) => ({
      ...result,
      strengths: sanitizeTopicList(result.strengths || []),
      weaknesses: sanitizeTopicList(result.weaknesses || []),
    }))
    localStorage.setItem(simulationsKey, JSON.stringify(cleanedSimulations))

    return true
  } catch (error) {
    console.error('Error sanitizing historical data:', error)
    return false
  }
}
