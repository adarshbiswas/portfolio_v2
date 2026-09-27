// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { useSectionNavigation } from './useSectionNavigation'

const ids = ['home', 'about', 'skills', 'projects', 'contact']
const positions = [0, 600, 900, 1300, 1700]
function Page({ menuOpen = false }: { menuOpen?: boolean }) {
  const { navRef, activeSection, indicator } = useSectionNavigation(menuOpen)
  return <>
    <header className="site-header"><nav ref={navRef}>
      {ids.map(id => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined}>{id}</a>)}
      <span data-testid="marker" data-x={indicator.x} data-y={indicator.y} data-width={indicator.width} />
    </nav></header>
    <main>{ids.map(id => <section key={id} id={id}>{id} section</section>)}</main>
  </>
}

beforeEach(() => {
  vi.stubGlobal('scrollY', 0)
  vi.stubGlobal('innerHeight', 600)
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2100)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const top = this.className === 'site-header' ? 0 : positions[ids.indexOf(this.id)] - window.scrollY
    return { top, bottom: this.className === 'site-header' ? 80 : top + 300 } as DOMRect
  })
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
    return this.tagName === 'A' ? ids.indexOf(this.textContent!) * 90 : 0
  })
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockReturnValue(0)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(70)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(65)
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function scroll(y: number) {
  vi.stubGlobal('scrollY', y)
  fireEvent.scroll(window)
}

describe('section navigation indicator', () => {
  it('tracks both directions using the header reading line and one measured marker', () => {
    render(<Page />)
    expect(screen.getByRole('link', { name: 'home' })).toHaveAttribute('aria-current', 'location')
    expect(screen.getByTestId('marker')).toHaveAttribute('data-x', '0')
    scroll(520)
    expect(screen.getByRole('link', { name: 'about' })).toHaveAttribute('aria-current', 'location')
    expect(screen.getByTestId('marker')).toHaveAttribute('data-x', '90')
    scroll(840)
    expect(screen.getByRole('link', { name: 'skills' })).toHaveAttribute('aria-current', 'location')
    expect(screen.getByTestId('marker')).toHaveAttribute('data-x', '180')
    scroll(300)
    expect(screen.getByRole('link', { name: 'home' })).toHaveAttribute('aria-current', 'location')
    expect(document.querySelectorAll('[aria-current="location"]')).toHaveLength(1)
  })

  it('activates the final short section at the bottom and handles initial deep scroll', () => {
    vi.stubGlobal('scrollY', 1200)
    render(<Page />)
    expect(screen.getByRole('link', { name: 'projects' })).toHaveAttribute('aria-current', 'location')
    scroll(1500)
    expect(screen.getByRole('link', { name: 'contact' })).toHaveAttribute('aria-current', 'location')
  })

  it('remeasures on viewport/menu changes and removes listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const view = render(<Page />)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(120)
    fireEvent.resize(window)
    expect(screen.getByTestId('marker')).toHaveAttribute('data-width', '120')
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockReturnValue(100)
    view.rerender(<Page menuOpen />)
    expect(screen.getByTestId('marker')).toHaveAttribute('data-y', '158')
    view.unmount()
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})