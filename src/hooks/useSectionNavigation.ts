import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/** One scroll listener, no animation loop: CSS animates a single measured marker. */
export function useSectionNavigation(menuOpen: boolean) {
  const navRef = useRef<HTMLElement>(null)
  const [activeSection, setActiveSection] = useState('home')
  const [indicator, setIndicator] = useState({ x: 0, y: 0, width: 0 })

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'))
    function update() {
      if (!sections.length) return
      const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 80
      // A single reading line avoids competing IntersectionObserver entries,
      // particularly when several compact sections fit inside the viewport.
      const line = headerBottom + 28
      let current = sections[0].id
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = section.id
      }
      const root = document.documentElement
      // Contact may be too short to reach the reading line before the page ends.
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= root.scrollHeight - 2) {
        current = sections[sections.length - 1].id
      }
      setActiveSection(previous => previous === current ? previous : current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : undefined
    sections.forEach(section => observer?.observe(section))
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer?.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    let disposed = false
    function measure() {
      if (disposed || !nav) return
      const link = nav.querySelector<HTMLElement>('[aria-current="location"]')
      if (!link) return
      const next = { x: link.offsetLeft, y: link.offsetTop + link.offsetHeight - 12, width: link.offsetWidth }
      setIndicator(previous => previous.x === next.x && previous.y === next.y && previous.width === next.width ? previous : next)
    }
    measure()
    window.addEventListener('resize', measure)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : undefined
    observer?.observe(nav)
    nav.querySelectorAll('a').forEach(link => observer?.observe(link))
    void document.fonts?.ready.then(measure)
    return () => {
      disposed = true
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [activeSection, menuOpen])

  return { navRef, activeSection, indicator }
}