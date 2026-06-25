import { describe, it, expect } from 'vitest'

function createAnswerState() {
  let locked = false
  let selectedAnswer = null

  return {
    select(answer) {
      if (locked) return false
      selectedAnswer = answer
      locked = true
      return true
    },
    isLocked() {
      return locked
    },
    getSelected() {
      return selectedAnswer
    },
  }
}

describe('bloqueo de respuestas', () => {
  it('bloquea respuestas después de la primera selección', () => {
    const state = createAnswerState()

    expect(state.select('opcion-a')).toBe(true)
    expect(state.isLocked()).toBe(true)
    expect(state.getSelected()).toBe('opcion-a')

    expect(state.select('opcion-b')).toBe(false)
    expect(state.getSelected()).toBe('opcion-a')
  })
})
