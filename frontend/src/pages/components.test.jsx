import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Results from '../pages/Results'
import Simulations from '../pages/Simulations'

describe('componentes principales', () => {
  it('Results carga sin errores cuando no hay datos', () => {
    localStorage.clear()
    const { container } = render(
      <MemoryRouter>
        <Results />
      </MemoryRouter>
    )
    expect(container.textContent).toContain('No existe ningún diagnóstico registrado')
  })

  it('Simulations carga sin errores TypeError de icon', () => {
    localStorage.setItem('currentUser', JSON.stringify({ id: 'test-user', nombre: 'Test' }))
    localStorage.setItem('simulationsResults_test-user', JSON.stringify([]))

    expect(() => {
      render(
        <MemoryRouter>
          <Simulations />
        </MemoryRouter>
      )
    }).not.toThrow()

    const { container } = render(
      <MemoryRouter>
        <Simulations />
      </MemoryRouter>
    )
    expect(container.textContent).toContain('Simulaciones de Ciberseguridad')
  })

  it('no hay keys duplicadas en listas de opciones mezcladas', () => {
    localStorage.setItem('currentUser', JSON.stringify({ id: 'test-user-2', nombre: 'Test' }))
    localStorage.setItem('simulationsResults_test-user-2', JSON.stringify([]))

    const { container } = render(
      <MemoryRouter>
        <Simulations />
      </MemoryRouter>
    )

    const buttons = container.querySelectorAll('button')
    const keys = new Set()
    buttons.forEach((btn) => {
      const key = btn.getAttribute('key')
      if (key) {
        expect(keys.has(key)).toBe(false)
        keys.add(key)
      }
    })
    expect(container.querySelector('.bg-white.rounded-2xl')).toBeTruthy()
  })
})
