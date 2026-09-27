import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/** Smooth wheel/anchor scrolling without replacing native touch or keyboard input. */
export function useSmoothScroll(blocked: boolean) {
  const scroller = useRef<Lenis | null>(null)
  const isBlocked = useRef(blocked)
  const navigationId = useRef(0)

  useEffect(() => {
    // Retain native anchors when browser APIs are unavailable.
    if (!window.matchMedia) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false

    function configure() {
      navigationId.current++
      scroller.current?.destroy()
      scroller.current = null
      if (motion.matches) return
      scroller.current = new Lenis({
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.12,
        // Modal content always keeps its own native scroll behavior.
        prevent: (node) => node.tagName === 'DIALOG',
      })
      if (isBlocked.current) scroller.current.stop()
    }

    function navigate(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || isBlocked.current) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
      const hash = link.getAttribute('href')!
      let target: HTMLElement | null
      try { target = document.getElementById(decodeURIComponent(hash.slice(1))) } catch { return }
      if (!target) return

      event.preventDefault()
      const requestId = ++navigationId.current
      // Keep deep links and browser history without triggering a second native jump.
      if (location.hash !== hash) history.pushState(null, '', hash)
      // Focus only after arrival: focusing a distant section before scrolling can
      // cause browser/assistive-technology focus handling to jump ahead of Lenis.
      function focusDestination() {
        if (disposed || navigationId.current !== requestId || isBlocked.current || !target?.isConnected) return
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1')
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
        }
        target.focus({ preventScroll: true })
      }
      if (scroller.current) {
        scroller.current.scrollTo(target, {
          duration: 1.25,
          lerp: 0,
          // Ease in AND out rather than consuming most of the distance immediately.
          easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
          onComplete: focusDestination,
        })
      } else {
        target.scrollIntoView({ behavior: 'instant', block: 'start' })
        focusDestination()
      }
    }

    configure()
    motion.addEventListener('change', configure)
    document.addEventListener('click', navigate)
    return () => {
      disposed = true
      motion.removeEventListener('change', configure)
      document.removeEventListener('click', navigate)
      scroller.current?.destroy()
      scroller.current = null
    }
  }, [])

  useEffect(() => {
    isBlocked.current = blocked
    if (blocked) {
      navigationId.current++
      scroller.current?.stop()
    }
    else scroller.current?.start()
  }, [blocked])
}