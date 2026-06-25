import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDiagnosticBank,
  getSimulationBank,
  markQuestionMastered,
  markScenarioMastered,
  getPendingQuestions,
  getPendingScenarios,
  getDiagnosticProgress,
  getSimulationProgress,
  getLearningProgress,
  dedupeTopics,
  sanitizeTopicList,
  TOTAL_DIAGNOSTIC_ITEMS,
  TOTAL_SIMULATION_ITEMS,
} from './progressHelper'

describe('progressHelper', () => {
  const userId = 'test-progress-user'

  beforeEach(() => {
    localStorage.clear()
  })

  it('bancos oficiales tienen 15 ítems', () => {
    expect(getDiagnosticBank().length).toBe(TOTAL_DIAGNOSTIC_ITEMS)
    expect(getSimulationBank().length).toBe(TOTAL_SIMULATION_ITEMS)
  })

  it('preguntas aprobadas no vuelven a aparecer como pendientes', () => {
    const bank = getDiagnosticBank()
    markQuestionMastered(userId, bank[0].id)
    markQuestionMastered(userId, bank[1].id)

    const pending = getPendingQuestions(userId)
    expect(pending).toHaveLength(TOTAL_DIAGNOSTIC_ITEMS - 2)
    expect(pending.find((q) => q.id === bank[0].id)).toBeUndefined()
  })

  it('escenarios aprobados no vuelven a aparecer como pendientes', () => {
    const bank = getSimulationBank()
    markScenarioMastered(userId, bank[0].id)

    const pending = getPendingScenarios(userId)
    expect(pending).toHaveLength(TOTAL_SIMULATION_ITEMS - 1)
  })

  it('progreso acumulativo calcula porcentaje correctamente', () => {
    const bank = getDiagnosticBank()
    for (let i = 0; i < 5; i++) {
      markQuestionMastered(userId, bank[i].id)
    }

    const progress = getDiagnosticProgress(userId)
    expect(progress.mastered).toBe(5)
    expect(progress.percentage).toBe(33)
    expect(progress.complete).toBe(false)
  })

  it('programa completo requiere 15/15 en ambos módulos', () => {
    const diagBank = getDiagnosticBank()
    const simBank = getSimulationBank()

    diagBank.forEach((q) => markQuestionMastered(userId, q.id))
    expect(getLearningProgress(userId).programComplete).toBe(false)

    simBank.forEach((s) => markScenarioMastered(userId, s.id))
    expect(getLearningProgress(userId).programComplete).toBe(true)
    expect(getDiagnosticProgress(userId).complete).toBe(true)
    expect(getSimulationProgress(userId).complete).toBe(true)
  })

  it('no duplica preguntas ya dominadas', () => {
    const bank = getDiagnosticBank()
    expect(markQuestionMastered(userId, bank[0].id)).toBe(true)
    expect(markQuestionMastered(userId, bank[0].id)).toBe(false)
    expect(getDiagnosticProgress(userId).mastered).toBe(1)
  })

  it('sanitizeTopicList elimina temas inválidos y corrige alias', () => {
    expect(
      sanitizeTopicList([
        'Suplantación de identidad',
        'Suplantación de identidad',
        'Gestión de',
        'Máster en Bellas Artes',
        'Phishing',
      ])
    ).toEqual(['Suplantación de identidad', 'Gestión de credenciales', 'Phishing'])
  })
})
