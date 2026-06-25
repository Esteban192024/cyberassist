/**
 * Valida que una pregunta de diagnóstico tenga todos los campos requeridos.
 */
export function isValidQuestion(question) {
  if (!question || typeof question !== 'object') return false

  const { id, question: text, options, correctAnswer, recommendation } = question

  if (!id || typeof id !== 'string') return false
  if (!text || typeof text !== 'string') return false
  if (!Array.isArray(options) || options.length < 2) return false
  if (!correctAnswer || !options.includes(correctAnswer)) return false
  if (!recommendation || typeof recommendation !== 'object') return false
  if (!recommendation.whyIncorrect || !recommendation.risk || !recommendation.howToAct) {
    return false
  }

  return true
}

/**
 * Valida que un escenario de simulación tenga todos los campos requeridos.
 */
export function isValidScenario(scenario) {
  if (!scenario || typeof scenario !== 'object') return false

  const { id, title, description, options, correctAnswer, recommendation, icon } = scenario

  if (!id) return false
  if (!title || typeof title !== 'string') return false
  if (!description || typeof description !== 'string') return false
  if (!Array.isArray(options) || options.length < 2) return false
  if (!correctAnswer) return false
  if (!icon || typeof icon !== 'string') return false
  if (!recommendation || typeof recommendation !== 'object') return false
  if (!recommendation.whyIncorrect || !recommendation.risk || !recommendation.howToAct) {
    return false
  }

  const hasCorrectOption = options.some(
    (opt) => opt.id === correctAnswer || opt.text === correctAnswer
  )
  if (!hasCorrectOption) return false

  return true
}

/**
 * Filtra y valida preguntas, excluyendo inválidas con warning en consola.
 */
export function filterValidQuestions(questions, label = 'preguntas') {
  return questions.filter((q) => {
    if (isValidQuestion(q)) return true
    console.warn(`[CyberAssist] ${label} inválida excluida:`, q?.id ?? q)
    return false
  })
}

/**
 * Filtra y valida escenarios, excluyendo inválidos con warning en consola.
 */
export function filterValidScenarios(scenarios, label = 'escenarios') {
  return scenarios.filter((s) => {
    if (isValidScenario(s)) return true
    console.warn(`[CyberAssist] ${label} inválido excluido:`, s?.id ?? s)
    return false
  })
}
