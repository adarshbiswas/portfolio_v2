// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { CharacterStudio } from './CharacterStudio'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function mockJointGeometry(element: HTMLElement) {
  // jsdom has no SVG coordinate matrices/native capture. Browser checks remain required.
  vi.stubGlobal('DOMPoint', class {
    matrixTransform(matrix: { e: number; f: number }) { return { x: matrix.e, y: matrix.f } }
  })
  const capture = vi.fn()
  const release = vi.fn()
  Object.defineProperties(element, {
    getScreenCTM: { value: () => ({ e: 100, f: 100 }), configurable: true },
    setPointerCapture: { value: capture, configurable: true },
    hasPointerCapture: { value: () => true, configurable: true },
    releasePointerCapture: { value: release, configurable: true },
  })
  return { capture, release }
}

describe('character pose studio', () => {
  it('exposes six joints and works without WebGL or motion APIs', () => {
    vi.stubGlobal('WebGLRenderingContext', undefined)
    vi.stubGlobal('WebGL2RenderingContext', undefined)
    vi.stubGlobal('matchMedia', undefined)
    render(<CharacterStudio night />)
    const rig = screen.getByRole('group', { name: 'Poseable voxel character' })
    expect(within(rig).getAllByRole('slider')).toHaveLength(6)
    expect(rig.querySelector('canvas')).toBeNull()
  })

  it('supports keyboard angles, bounds, selection and non-drag controls', async () => {
    const user = userEvent.setup()
    render(<CharacterStudio night />)
    const head = screen.getByRole('slider', { name: 'Head angle' })
    fireEvent.focus(head)
    fireEvent.keyDown(head, { key: 'ArrowRight' })
    expect(head).toHaveAttribute('aria-valuenow', '5')
    fireEvent.keyDown(head, { key: 'ArrowUp', shiftKey: true })
    expect(head).toHaveAttribute('aria-valuenow', '20')
    fireEvent.keyDown(head, { key: 'End' })
    fireEvent.keyDown(head, { key: 'ArrowRight' })
    expect(head).toHaveAttribute('aria-valuenow', '35')
    expect(screen.getByRole('button', { name: 'Increase head angle' })).toBeDisabled()
    fireEvent.keyDown(head, { key: 'Home' })
    expect(head).toHaveAttribute('aria-valuenow', '-35')
    await user.click(screen.getByRole('button', { name: 'Increase head angle' }))
    expect(head).toHaveAttribute('aria-valuenow', '-30')
    fireEvent.change(screen.getByRole('slider', { name: 'Adjust head' }), { target: { value: '15' } })
    expect(head).toHaveAttribute('aria-valuenow', '15')
  })

  it.each(['mouse', 'pen', 'touch'])('poses a limb by %s drag and releases capture', pointerType => {
    render(<CharacterStudio night />)
    const arm = screen.getByRole('slider', { name: 'Left arm angle' })
    const { capture, release } = mockJointGeometry(arm)
    const pointer = { pointerType, pointerId: 1, isPrimary: true, button: 0 }
    fireEvent.pointerDown(arm, { ...pointer, clientX: 100, clientY: 150 })
    fireEvent.pointerMove(arm, { ...pointer, clientX: 50, clientY: 100 })
    expect(arm).toHaveAttribute('aria-valuenow', '98')
    expect(capture).toHaveBeenCalledWith(1)
    fireEvent.pointerUp(arm, pointer)
    expect(release).toHaveBeenCalledWith(1)
    fireEvent.pointerMove(arm, { ...pointer, clientX: 100, clientY: 50 })
    expect(arm).toHaveAttribute('aria-valuenow', '98')
  })

  it('ignores secondary pointers and stops on cancellation or capture loss', () => {
    render(<CharacterStudio night />)
    const arm = screen.getByRole('slider', { name: 'Right arm angle' })
    const { capture } = mockJointGeometry(arm)
    const pointer = { pointerType: 'touch', pointerId: 1, isPrimary: true, button: 0, clientX: 100, clientY: 150 }
    fireEvent.pointerDown(arm, { ...pointer, isPrimary: false })
    expect(capture).not.toHaveBeenCalled()
    for (const stop of [fireEvent.pointerCancel, fireEvent.lostPointerCapture]) {
      fireEvent.pointerDown(arm, pointer)
      fireEvent.pointerMove(arm, { ...pointer, pointerId: 2, clientX: 50, clientY: 100 })
      expect(arm).toHaveAttribute('aria-valuenow', '-8')
      stop(arm, pointer)
      fireEvent.pointerMove(arm, { ...pointer, clientX: 50, clientY: 100 })
      expect(arm).toHaveAttribute('aria-valuenow', '-8')
    }
  })

  it('applies presets, keeps the pose through theme changes and resets all joints', async () => {
    const user = userEvent.setup()
    const view = render(<CharacterStudio night />)
    await user.click(screen.getByRole('button', { name: 'Adventure pose' }))
    expect(screen.getByRole('slider', { name: 'Left leg angle' })).toHaveAttribute('aria-valuenow', '28')
    await user.click(screen.getByRole('button', { name: 'Wave hello' }))
    view.rerender(<CharacterStudio night={false} />)
    expect(screen.getByText('DAYBREAK')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Left arm angle' })).toHaveAttribute('aria-valuenow', '125')
    await user.click(screen.getByRole('button', { name: 'Reset pose' }))
    for (const label of ['Head', 'Torso', 'Left leg', 'Right leg']) {
      expect(screen.getByRole('slider', { name: `${label} angle` })).toHaveAttribute('aria-valuenow', '0')
    }
    expect(screen.getByRole('slider', { name: 'Left arm angle' })).toHaveAttribute('aria-valuenow', '8')
    expect(screen.getByRole('slider', { name: 'Right arm angle' })).toHaveAttribute('aria-valuenow', '-8')
  })
})