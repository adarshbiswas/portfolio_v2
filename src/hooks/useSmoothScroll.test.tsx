// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import Lenis from 'lenis'
import { useSmoothScroll } from './useSmoothScroll'

vi.mock('lenis', () => ({
  default: vi.fn(class {
    scrollTo = vi.fn()
    start = vi.fn()
    stop = vi.fn()
    destroy = vi.fn()
  }),
}))

let motion: MediaQueryList
let preferenceChanged: EventListener
const scrollIntoView = vi.fn()

function Page({ blocked = false }: { blocked?: boolean }) {
  useSmoothScroll(blocked)
  return <>
    <a href="#destination">Explore section</a>
    <a href="#missing">Missing section</a>
    <a href="#destination" target="_blank">New tab</a>
    <a href="#destination" onClick={(event) => event.preventDefault()}>Already handled</a>
    <section id="destination">Destination</section>
  </>
}

beforeEach(() => {
  vi.clearAllMocks()
  history.replaceState(null, '', '/')
  motion = {
    matches: false,
    addEventListener: vi.fn((_type, listener: EventListener) => { preferenceChanged = listener }),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList
  vi.stubGlobal('matchMedia', vi.fn(() => motion))
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('smooth navigation', () => {
  it('smoothly navigates, preserves deep links, and transfers focus', () => {
    render(<Page />)
    const instance = vi.mocked(Lenis).mock.results[0].value
    const target = screen.getByText('Destination')
    fireEvent.click(screen.getByText('Explore section'))
    expect(instance.scrollTo).toHaveBeenCalledWith(target, expect.objectContaining({ duration: 1.25, lerp: 0, onComplete: expect.any(Function) }))
    expect(location.hash).toBe('#destination')
    expect(target).not.toHaveFocus()
    const options = instance.scrollTo.mock.calls[0][1]
    expect(options.easing(0)).toBe(0)
    expect(options.easing(0.25)).toBeCloseTo(0.0625)
    expect(options.easing(0.5)).toBe(0.5)
    expect(options.easing(1)).toBe(1)
    act(() => options.onComplete())
    expect(target).toHaveFocus()
    expect(target).toHaveAttribute('tabindex', '-1')
    screen.getByText('Explore section').focus()
    expect(target).not.toHaveAttribute('tabindex')
  })

  it('does not add duplicate history entries on repeated navigation', () => {
    render(<Page />)
    const push = vi.spyOn(history, 'pushState')
    fireEvent.click(screen.getByText('Explore section'))
    fireEvent.click(screen.getByText('Explore section'))
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('does not focus an obsolete request after a new click or modal interruption', () => {
    const page = render(<Page />)
    const instance = vi.mocked(Lenis).mock.results[0].value
    const target = screen.getByText('Destination')
    fireEvent.click(screen.getByText('Explore section'))
    const first = instance.scrollTo.mock.calls[0][1].onComplete
    fireEvent.click(screen.getByText('Explore section'))
    act(() => first())
    expect(target).not.toHaveFocus()
    page.rerender(<Page blocked />)
    act(() => instance.scrollTo.mock.calls[1][1].onComplete())
    expect(target).not.toHaveFocus()
  })

  it('leaves modified clicks, new tabs, and handled events to the browser', () => {
    render(<Page />)
    const instance = vi.mocked(Lenis).mock.results[0].value
    for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
      fireEvent.click(screen.getByText('Explore section'), { [modifier]: true })
    }
    fireEvent.click(screen.getByText('New tab'))
    fireEvent.click(screen.getByText('Already handled'))
    fireEvent.click(screen.getByText('Missing section'))
    expect(instance.scrollTo).not.toHaveBeenCalled()
  })

  it('uses instant native navigation for reduced motion', () => {
    Object.assign(motion, { matches: true })
    render(<Page />)
    fireEvent.click(screen.getByText('Explore section'))
    expect(Lenis).not.toHaveBeenCalled()
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })
    expect(screen.getByText('Destination')).toHaveFocus()
  })

  it('responds to motion preference changes and cleans up on unmount', () => {
    const page = render(<Page />)
    const first = vi.mocked(Lenis).mock.results[0].value
    Object.assign(motion, { matches: true })
    act(() => preferenceChanged(new Event('change')))
    expect(first.destroy).toHaveBeenCalledOnce()
    Object.assign(motion, { matches: false })
    act(() => preferenceChanged(new Event('change')))
    expect(Lenis).toHaveBeenCalledTimes(2)
    const second = vi.mocked(Lenis).mock.results[1].value
    page.unmount()
    expect(second.destroy).toHaveBeenCalledOnce()
    expect(motion.removeEventListener).toHaveBeenCalledWith('change', preferenceChanged)
  })

  it('stops background scrolling for dialogs and resumes after closing', () => {
    const page = render(<Page />)
    const instance = vi.mocked(Lenis).mock.results[0].value
    page.rerender(<Page blocked />)
    expect(instance.stop).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByText('Explore section'))
    expect(instance.scrollTo).not.toHaveBeenCalled()
    page.rerender(<Page />)
    expect(instance.start).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByText('Explore section'))
    expect(instance.scrollTo).toHaveBeenCalledOnce()
  })

  it('keeps native touch and dialog content scrolling enabled', () => {
    render(<Page />)
    const options = vi.mocked(Lenis).mock.calls[0][0]!
    expect(options).toEqual(expect.objectContaining({ autoRaf: true, smoothWheel: true, syncTouch: false }))
    expect(options.prevent?.(document.createElement('dialog'))).toBe(true)
    expect(options.prevent?.(document.createElement('section'))).toBe(false)
  })
})