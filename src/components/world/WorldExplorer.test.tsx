// @vitest-environment jsdom
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { WorldExplorer } from './WorldExplorer'
import type { WorldSceneProps } from './WorldScene'

// Exercise wrapper state/lifecycle without pretending jsdom can render WebGL.
vi.mock('./WorldScene', () => ({
  default: function MockWorldScene(props: WorldSceneProps) {
    const { onReady } = props
    useEffect(() => { onReady() }, [onReady])
    return <div data-testid="scene" data-active={props.active} data-motion={props.motion}
      data-night={props.night} data-rotation={props.rotation} data-lights={props.lights} data-crystal={props.crystal}>
      <button onClick={props.onFailure}>Simulate GPU failure</button>
    </div>
  },
}))

let motionQuery: MediaQueryList
let motionListener: (() => void) | undefined
let visibilityListener: IntersectionObserverCallback | undefined
const disconnect = vi.fn()

beforeEach(() => {
  motionListener = undefined
  visibilityListener = undefined
  disconnect.mockClear()
  vi.stubGlobal('WebGLRenderingContext', class {})
  motionQuery = {
    matches: false,
    addEventListener: vi.fn((_event: string, listener: () => void) => { motionListener = listener }),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList
  vi.stubGlobal('matchMedia', vi.fn(() => motionQuery))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { visibilityListener = callback }
    observe = vi.fn()
    disconnect = disconnect
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('3D world controls', () => {
  it('rotates and resets the view, toggles lights, and cycles crystal colors', async () => {
    const user = userEvent.setup()
    render(<WorldExplorer night />)
    await screen.findByRole('button', { name: 'Pause motion' })
    const rotate = screen.getByRole('button', { name: 'Rotate world' })
    await user.click(rotate)
    expect(screen.getByLabelText('Camera bearing 90 degrees')).toBeInTheDocument()
    expect(screen.getByTestId('scene')).toHaveAttribute('data-rotation', String(Math.PI / 2))
    await user.click(screen.getByRole('button', { name: 'Reset view' }))
    expect(screen.getByLabelText('Camera bearing 0 degrees')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cabin lights ON' }))
    expect(screen.getByRole('button', { name: 'Cabin lights OFF' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('scene')).toHaveAttribute('data-lights', 'false')
    for (const [current, next, index] of [['Jade', 'Amber', 1], ['Amber', 'Violet', 2], ['Violet', 'Jade', 0]]) {
      await user.click(screen.getByRole('button', { name: `Change crystal color, currently ${current}` }))
      expect(screen.getByRole('button', { name: `Change crystal color, currently ${next}` })).toBeInTheDocument()
      expect(screen.getByTestId('scene')).toHaveAttribute('data-crystal', String(index))
    }
  })

  it('pauses motion and responds to changed reduced-motion preferences', async () => {
    const user = userEvent.setup()
    render(<WorldExplorer night />)
    await user.click(await screen.findByRole('button', { name: 'Pause motion' }))
    expect(screen.getByText('Motion paused')).toBeInTheDocument()
    expect(screen.getByTestId('scene')).toHaveAttribute('data-motion', 'false')
    await user.click(screen.getByRole('button', { name: 'Resume motion' }))
    expect(screen.getByTestId('scene')).toHaveAttribute('data-motion', 'true')
    act(() => {
      Object.defineProperty(motionQuery, 'matches', { configurable: true, value: true })
      motionListener?.()
    })
    expect(screen.getByRole('button', { name: 'Motion off' })).toBeDisabled()
    expect(screen.getByTestId('scene')).toHaveAttribute('data-motion', 'false')
    // Reduced motion must not disable keyboard-operable view controls.
    await user.click(screen.getByRole('button', { name: 'Rotate world' }))
    expect(screen.getByLabelText('Camera bearing 90 degrees')).toBeInTheDocument()
  })

  it('suspends offscreen rendering, forwards the theme, and cleans up listeners', async () => {
    const view = render(<WorldExplorer night />)
    await screen.findByRole('button', { name: 'Pause motion' })
    act(() => visibilityListener?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver))
    expect(screen.getByTestId('scene')).toHaveAttribute('data-active', 'false')
    expect(screen.getByText('Motion resting · out of view')).toBeInTheDocument()
    act(() => visibilityListener?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
    view.rerender(<WorldExplorer night={false} />)
    expect(screen.getByTestId('scene')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('scene')).toHaveAttribute('data-night', 'false')
    view.unmount()
    expect(disconnect).toHaveBeenCalledOnce()
    expect(motionQuery.removeEventListener).toHaveBeenCalledWith('change', motionListener)
  })

  it('returns to the rotatable SVG after GPU failure', async () => {
    const user = userEvent.setup()
    render(<WorldExplorer night />)
    // This test-only trigger represents a GPU callback, not a canvas pointer gesture.
    fireEvent.click(await screen.findByRole('button', { name: 'Simulate GPU failure' }))
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument()
    expect(screen.getByText('Illustrated view · 3D unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rotate world' }))
    expect(screen.getByRole('img', { name: /View 2 of 4/ })).toBeInTheDocument()
  })

  it('does not mount the 3D scene when WebGL is unavailable', () => {
    vi.stubGlobal('WebGLRenderingContext', undefined)
    vi.stubGlobal('WebGL2RenderingContext', undefined)
    render(<WorldExplorer night={false} />)
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /View 1 of 4/ })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Interactive landmarks' })).not.toBeInTheDocument()
  })
})