import { filterValidQuestions, filterValidScenarios } from './validationHelper'

export const QUESTIONS_PER_SESSION = 5
export const SCENARIOS_PER_SESSION = 5

/**
 * Mezcla un array usando el algoritmo Fisher-Yates.
 */
export function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Genera un identificador único.
 */
export function generateUniqueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Pesos de complejidad según número de intentos previos.
 */
function getComplexityDistribution(attemptCount) {
  if (attemptCount < 3) {
    return { basico: 3, intermedio: 1, 'intermedio-avanzado': 1 }
  }
  if (attemptCount < 6) {
    return { basico: 1, intermedio: 3, 'intermedio-avanzado': 1 }
  }
  return { basico: 1, intermedio: 2, 'intermedio-avanzado': 2 }
}

/**
 * Selecciona preguntas aleatorias sin repetición, con progresión de complejidad.
 */
export function selectQuestionsForAttempt(allQuestions, attemptCount = 0, count = QUESTIONS_PER_SESSION) {
  const valid = filterValidQuestions(allQuestions)
  if (valid.length === 0) return []

  const distribution = getComplexityDistribution(attemptCount)
  const selected = []
  const usedIds = new Set()

  for (const [complexity, needed] of Object.entries(distribution)) {
    const pool = shuffleArray(
      valid.filter((q) => q.complexity === complexity && !usedIds.has(q.id))
    )
    for (const q of pool) {
      if (selected.length >= count) break
      if (selected.filter((s) => s.complexity === complexity).length >= needed) break
      selected.push(q)
      usedIds.add(q.id)
    }
  }

  if (selected.length < count) {
    const remaining = shuffleArray(valid.filter((q) => !usedIds.has(q.id)))
    for (const q of remaining) {
      if (selected.length >= count) break
      selected.push(q)
      usedIds.add(q.id)
    }
  }

  return shuffleArray(selected).slice(0, count)
}

/**
 * Selecciona escenarios aleatorios sin repetición, con progresión de complejidad.
 */
export function selectScenariosForAttempt(allScenarios, attemptCount = 0, count = SCENARIOS_PER_SESSION) {
  const valid = filterValidScenarios(allScenarios)
  if (valid.length === 0) return []

  const distribution = getComplexityDistribution(attemptCount)
  const selected = []
  const usedIds = new Set()

  for (const [complexity, needed] of Object.entries(distribution)) {
    const pool = shuffleArray(
      valid.filter((s) => s.complexity === complexity && !usedIds.has(s.id))
    )
    for (const s of pool) {
      if (selected.length >= count) break
      if (selected.filter((x) => x.complexity === complexity).length >= needed) break
      selected.push(s)
      usedIds.add(s.id)
    }
  }

  if (selected.length < count) {
    const remaining = shuffleArray(valid.filter((s) => !usedIds.has(s.id)))
    for (const s of remaining) {
      if (selected.length >= count) break
      selected.push(s)
      usedIds.add(s.id)
    }
  }

  return shuffleArray(selected).slice(0, count)
}

/**
 * Calcula nivel de riesgo según errores cometidos.
 * Bajo = Verde, Medio = Amarillo, Alto = Rojo
 */
export function calculateRiskLevel(correctCount, totalCount) {
  if (totalCount === 0) return 'Sin datos'

  const errorCount = totalCount - correctCount
  const errorRate = errorCount / totalCount

  if (errorRate <= 0.2) return 'Bajo'
  if (errorRate <= 0.5) return 'Medio'
  return 'Alto'
}

/**
 * Colores para nivel de riesgo.
 */
export function getRiskLevelColors(level) {
  switch (level) {
    case 'Bajo':
      return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', hex: '#22c55e' }
    case 'Medio':
      return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50', hex: '#f59e0b' }
    case 'Alto':
      return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', hex: '#ef4444' }
    default:
      return { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-50', hex: '#6b7280' }
  }
}

/**
 * Analiza fortalezas y debilidades por tema.
 */
export function analyzeStrengthsWeaknesses(answers) {
  const topicStats = {}

  answers.forEach(({ topic, correct }) => {
    if (!topic) return
    if (!topicStats[topic]) {
      topicStats[topic] = { correct: 0, total: 0 }
    }
    topicStats[topic].total++
    if (correct) topicStats[topic].correct++
  })

  const strengths = []
  const weaknesses = []

  Object.entries(topicStats).forEach(([topic, stats]) => {
    const rate = stats.correct / stats.total
    if (rate >= 0.8) {
      strengths.push(topic)
    } else if (rate < 0.5) {
      weaknesses.push(topic)
    }
  })

  return {
    strengths: [...new Set(strengths.filter(Boolean))],
    weaknesses: [...new Set(weaknesses.filter(Boolean))],
    topicStats,
  }
}

/**
 * Mezcla opciones de una pregunta y devuelve copia con opciones reordenadas.
 */
export function shuffleQuestionOptions(question) {
  return {
    ...question,
    shuffledOptions: shuffleArray(question.options),
  }
}

/**
 * Obtiene la opción correcta de un escenario de simulación.
 */
export function getCorrectScenarioOption(scenario) {
  if (!scenario?.options?.length) return null
  return scenario.options.find(
    (opt) => opt?.id === scenario.correctAnswer || opt?.text === scenario.correctAnswer
  ) ?? null
}
