import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { VoxelWorld } from './VoxelWorld'
import './WorldExplorer.css'

const WorldScene = lazy(() => import('./WorldScene'))

export type WorldExplorerProps = { night: boolean }

function hasWebGL() {
  // Do not even request a context in SSR/jsdom. Canvas handles actual GPU failures.
  return typeof window !== 'undefined' && (
    typeof window.WebGLRenderingContext !== 'undefined' ||
    typeof window.WebGL2RenderingContext !== 'undefined'
  )
}

function WorldFallback() {
  // Keep the original SVG's accessible name, four views, and Rotate world button.
  return <div className="world-explorer__fallback"><VoxelWorld /></div>
}

class SceneBoundary extends Component<{
  children: ReactNode
  onFailure: () => void
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? <WorldFallback /> : this.props.children }
}

/** Self-contained hero scene; the Three.js dependency is loaded only with WebGL. */
export function WorldExplorer({ night }: WorldExplorerProps) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; x: number; angle: number } | null>(null)
  const [supported] = useState(hasWebGL)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(true)
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  const [paused, setPaused] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [lights, setLights] = useState(true)
  const [crystal, setCrystal] = useState(0)
  const colors = ['Jade', 'Amber', 'Violet']
  const live = supported && !failed
  const active = visible && tabVisible
  const onReady = useCallback(() => setReady(true), [])
  const onFailure = useCallback(() => { setFailed(true); setReady(false) }, [])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const onMotionChange = () => setReducedMotion(!!media?.matches)
    const onVisibility = () => setTabVisible(!document.hidden)
    media?.addEventListener('change', onMotionChange)
    document.addEventListener('visibilitychange', onVisibility)
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 })
      : undefined
    if (root.current) observer?.observe(root.current)
    return () => {
      media?.removeEventListener('change', onMotionChange)
      document.removeEventListener('visibilitychange', onVisibility)
      observer?.disconnect()
    }
  }, [])

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!ready || !live || !event.isPrimary || event.button !== 0 ||
        (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return
    drag.current = { id: event.pointerId, x: event.clientX, angle: rotation }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (start?.id !== event.pointerId) return
    setRotation(start.angle + (event.clientX - start.x) * 0.008)
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return
    drag.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const bearing = ((Math.round(rotation * 180 / Math.PI) % 360) + 360) % 360
  const status = !live ? 'Illustrated view · 3D unavailable'
    : !ready ? 'Loading landscape…'
      : reducedMotion ? 'Motion off · reduced-motion preference'
        : paused ? 'Motion paused'
          : !active ? 'Motion resting · out of view' : 'Explore at your own pace'

  return (
    <div ref={root} className="world-explorer" data-night={night} data-dragging={dragging}>
      <div className="world-explorer__header">
        <span className="world-explorer__label"><i aria-hidden="true" />
          {!live ? 'VOXEL WORLD' : ready ? 'LIVE 3D WORLD' : 'LOADING WORLD'}
        </span>
        <span>{night ? 'NIGHTFALL' : 'DAYBREAK'}</span>
      </div>
      <div className="world-explorer__viewport"
        onPointerDown={beginDrag} onPointerMove={moveDrag}
        onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
        {live ? (
          <SceneBoundary onFailure={onFailure}>
            <Suspense fallback={<WorldFallback />}>
              <WorldScene night={night} active={active} motion={!paused && !reducedMotion}
                rotation={rotation} dragging={dragging} lights={lights} crystal={crystal}
                onReady={onReady} onFailure={onFailure} />
            </Suspense>
          </SceneBoundary>
        ) : <WorldFallback />}
        {live && ready && <div className="world-explorer__caption" aria-hidden="true">
          <span>THE QUIET FRONTIER</span><span>Grasslands / a place to build</span>
        </div>}
      </div>
      {live && ready && <div className="world-explorer__console">
        <div className="world-explorer__readout">
          <span aria-label={`Camera bearing ${bearing} degrees`}>ORBIT / {String(bearing).padStart(3, '0')}°</span>
          <span className="world-explorer__hint">Mouse / pen: drag to orbit</span>
        </div>
        <div className="world-explorer__controls" role="group" aria-label="World view controls">
          <button type="button" onClick={() => setRotation(value => value + Math.PI / 2)}>Rotate world</button>
          <button type="button" onClick={() => setRotation(0)}>Reset view</button>
          <button type="button" disabled={reducedMotion} onClick={() => setPaused(value => !value)}>
            {reducedMotion ? 'Motion off' : paused ? 'Resume motion' : 'Pause motion'}
          </button>
        </div>
        <div className="world-explorer__controls world-explorer__landmarks" role="group" aria-label="Interactive landmarks">
          <button type="button" aria-pressed={lights} onClick={() => setLights(value => !value)}>
            Cabin lights <span>{lights ? 'ON' : 'OFF'}</span>
          </button>
          <button type="button" aria-label={`Change crystal color, currently ${colors[crystal]}`}
            onClick={() => setCrystal(value => (value + 1) % colors.length)}>
            Crystal <span>{colors[crystal]}</span>
          </button>
        </div>
      </div>}
      <p className="world-explorer__status" aria-live="polite">{status}</p>
    </div>
  )
}

export default WorldExplorer