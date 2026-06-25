import { describe, it, expect } from 'vitest'
import {
  shuffleArray,
  selectQuestionsForAttempt,
  selectScenariosForAttempt,
  calculateRiskLevel,
  analyzeStrengthsWeaknesses,
  generateUniqueId,
  getCorrectScenarioOption,
} from './quizHelper'
import { DIAGNOSTIC_QUESTIONS } from '../data/diagnosticQuestions'
import { SIMULATION_SCENARIOS } from '../data/simulationScenarios'

describe('quizHelper', () => {
  it('mezcla opciones de forma no trivial', () => {
    const original = ['A', 'B', 'C', 'D']
    const results = new Set()
    for (let i = 0; i < 20; i++) {
      results.add(shuffleArray(original).join(','))
    }
    expect(results.size).toBeGreaterThan(1)
  })

  it('selecciona preguntas sin repetición en el mismo intento', () => {
    const selected = selectQuestionsForAttempt(DIAGNOSTIC_QUESTIONS, 0, 5)
    const ids = selected.map((q) => q.id)
    expect(selected).toHaveLength(5)
    expect(new Set(ids).size).toBe(5)
  })

  it('selecciona escenarios sin repetición en el mismo intento', () => {
    const selected = selectScenariosForAttempt(SIMULATION_SCENARIOS, 0, 5)
    const ids = selected.map((s) => s.id)
    expect(selected).toHaveLength(5)
    expect(new Set(ids).size).toBe(5)
  })

  it('progresión: primeros intentos priorizan complejidad básica', () => {
    const selected = selectQuestionsForAttempt(DIAGNOSTIC_QUESTIONS, 0, 5)
    const basicCount = selected.filter((q) => q.complexity === 'basico').length
    expect(basicCount).toBeGreaterThanOrEqual(2)
  })

  it('calcula riesgo según errores: Bajo=verde lógica', () => {
    expect(calculateRiskLevel(5, 5)).toBe('Bajo')
    expect(calculateRiskLevel(3, 5)).toBe('Medio')
    expect(calculateRiskLevel(1, 5)).toBe('Alto')
  })

  it('analiza fortalezas y debilidades por tema', () => {
    const result = analyzeStrengthsWeaknesses([
      { topic: 'Phishing', correct: true },
      { topic: 'Phishing', correct: true },
      { topic: 'MFA', correct: false },
      { topic: 'MFA', correct: false },
    ])
    expect(result.strengths).toContain('Phishing')
    expect(result.weaknesses).toContain('MFA')
  })

  it('genera IDs únicos con crypto.randomUUID', () => {
    const ids = new Set()
    for (let i = 0; i < 10; i++) {
      ids.add(generateUniqueId())
    }
    expect(ids.size).toBe(10)
  })

  it('obtiene opción correcta de escenario', () => {
    const scenario = SIMULATION_SCENARIOS[0]
    const correct = getCorrectScenarioOption(scenario)
    expect(correct).toBeDefined()
    expect(correct.id).toBe(scenario.correctAnswer)
  })

  it('la respuesta correcta no está siempre en la misma posición al mezclar', () => {
    const question = DIAGNOSTIC_QUESTIONS[0]
    const positions = new Set()
    for (let i = 0; i < 30; i++) {
      const shuffled = shuffleArray(question.options)
      positions.add(shuffled.indexOf(question.correctAnswer))
    }
    expect(positions.size).toBeGreaterThan(1)
  })
})
