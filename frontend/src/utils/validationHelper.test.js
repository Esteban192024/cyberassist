import { describe, it, expect } from 'vitest'
import {
  isValidQuestion,
  isValidScenario,
  filterValidQuestions,
  filterValidScenarios,
} from './validationHelper'
import { DIAGNOSTIC_QUESTIONS } from '../data/diagnosticQuestions'
import { SIMULATION_SCENARIOS } from '../data/simulationScenarios'

describe('validationHelper', () => {
  const validQuestion = {
    id: 'test-1',
    question: '¿Pregunta de prueba?',
    options: ['A', 'B', 'C'],
    correctAnswer: 'B',
    recommendation: {
      whyIncorrect: 'Razón',
      risk: 'Riesgo',
      howToAct: 'Acción',
    },
  }

  const validScenario = {
    id: 'sim-1',
    title: 'Título',
    description: 'Descripción',
    icon: 'mail',
    options: [
      { id: 'a', text: 'Opción A', correct: false },
      { id: 'b', text: 'Opción B', correct: true },
    ],
    correctAnswer: 'b',
    recommendation: {
      whyIncorrect: 'Razón',
      risk: 'Riesgo',
      howToAct: 'Acción',
    },
  }

  it('valida preguntas correctas', () => {
    expect(isValidQuestion(validQuestion)).toBe(true)
  })

  it('rechaza preguntas sin campos requeridos', () => {
    expect(isValidQuestion({ id: 'x' })).toBe(false)
    expect(isValidQuestion(null)).toBe(false)
    expect(
      isValidQuestion({
        ...validQuestion,
        correctAnswer: 'inexistente',
      })
    ).toBe(false)
  })

  it('valida escenarios correctos', () => {
    expect(isValidScenario(validScenario)).toBe(true)
  })

  it('rechaza escenarios sin icon o correctAnswer válido', () => {
    expect(isValidScenario({ ...validScenario, icon: '' })).toBe(false)
    expect(isValidScenario({ ...validScenario, correctAnswer: 'z' })).toBe(false)
    expect(isValidScenario(undefined)).toBe(false)
  })

  it('el banco de diagnósticos tiene al menos 15 preguntas válidas', () => {
    const valid = filterValidQuestions(DIAGNOSTIC_QUESTIONS)
    expect(valid.length).toBeGreaterThanOrEqual(15)
  })

  it('el banco de simulaciones tiene al menos 15 escenarios válidos', () => {
    const valid = filterValidScenarios(SIMULATION_SCENARIOS)
    expect(valid.length).toBeGreaterThanOrEqual(15)
  })

  it('excluye elementos inválidos automáticamente', () => {
    const mixed = [validQuestion, { id: 'bad' }, validQuestion]
    const filtered = filterValidQuestions(mixed)
    expect(filtered).toHaveLength(2)
  })
})
