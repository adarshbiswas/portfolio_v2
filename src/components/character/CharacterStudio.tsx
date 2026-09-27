import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import './CharacterStudio.css'

const joints = {
  head: { label: 'Head', min: -35, max: 35 },
  torso: { label: 'Torso', min: -20, max: 20 },
  leftArm: { label: 'Left arm', min: -140, max: 140 },
  rightArm: { label: 'Right arm', min: -140, max: 140 },
  leftLeg: { label: 'Left leg', min: -40, max: 40 },
  rightLeg: { label: 'Right leg', min: -40, max: 40 },
} as const
type Joint = keyof typeof joints
type Pose = Record<Joint, number>
const neutral: Pose = { head: 0, torso: 0, leftArm: 8, rightArm: -8, leftLeg: 0, rightLeg: 0 }
const wave: Pose = { head: -12, torso: 5, leftArm: 125, rightArm: -12, leftLeg: 5, rightLeg: -8 }
const stride: Pose = { head: 8, torso: -6, leftArm: -35, rightArm: 40, leftLeg: 28, rightLeg: -28 }
const clamp = (part: Joint, value: number) => Math.max(joints[part].min, Math.min(joints[part].max, Math.round(value)))

/** Shaded cuboids with original pixel detailing; no GPU, game skins or textures. */
function Cuboid({ x, y, w, h, front, side, top }: {
  x: number; y: number; w: number; h: number; front: string; side: string; top: string
}) {
  return <g>
    <path d={`M${x} ${y}l8 -6h${w}l-8 6z`} fill={top} />
    <path d={`M${x + w} ${y}l8 -6v${h}l-8 6z`} fill={side} />
    <rect x={x} y={y} width={w} height={h} fill={front} />
  </g>
}

export function CharacterStudio({ night }: { night: boolean }) {
  const [pose, setPose] = useState<Pose>({ ...neutral })
  const [selected, setSelected] = useState<Joint>('leftArm')
  const [dragging, setDragging] = useState(false)
  const helpId = useId()
  const sliderId = useId()
  const drag = useRef<{
    id: number; part: Joint; cx: number; cy: number; last: number; value: number
  } | null>(null)

  function change(part: Joint, value: number) {
    setPose(current => ({ ...current, [part]: clamp(part, value) }))
  }

  function begin(event: PointerEvent<SVGGElement>, part: Joint) {
    if (!event.isPrimary || event.button !== 0 || drag.current) return
    setSelected(part)
    event.stopPropagation()
    event.currentTarget.focus({ preventScroll: true })
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return
    // The group's local origin is its joint, including any parent torso rotation.
    const center = new DOMPoint(0, 0).matrixTransform(matrix)
    const angle = Math.atan2(event.clientY - center.y, event.clientX - center.x)
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { id: event.pointerId, part, cx: center.x, cy: center.y, last: angle, value: pose[part] }
    setDragging(true)
  }

  function move(event: PointerEvent<SVGGElement>) {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    event.stopPropagation()
    const angle = Math.atan2(event.clientY - current.cy, event.clientX - current.cx)
    const delta = Math.atan2(Math.sin(angle - current.last), Math.cos(angle - current.last)) * 180 / Math.PI
    current.value = Math.max(joints[current.part].min, Math.min(joints[current.part].max, current.value + delta))
    current.last = angle
    change(current.part, current.value)
  }

  function end(event: PointerEvent<SVGGElement>) {
    if (drag.current?.id !== event.pointerId) return
    event.stopPropagation()
    drag.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function keyboard(event: KeyboardEvent<SVGGElement>, part: Joint) {
    const step = event.shiftKey ? 15 : 5
    const next = event.key === 'Home' ? joints[part].min : event.key === 'End' ? joints[part].max
      : ['ArrowRight', 'ArrowUp'].includes(event.key) ? pose[part] + step
        : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? pose[part] - step : undefined
    if (next === undefined) return
    event.preventDefault()
    event.stopPropagation()
    change(part, next)
  }

  function joint(part: Joint, x: number, y: number, bounds: [number, number, number, number], art: ReactNode) {
    const [bx, by, w, h] = bounds
    return <g className="character-joint" role="slider" tabIndex={0} aria-label={`${joints[part].label} angle`}
      aria-valuemin={joints[part].min} aria-valuemax={joints[part].max} aria-valuenow={pose[part]}
      aria-valuetext={`${pose[part]} degrees`} aria-describedby={helpId} aria-orientation="horizontal"
      data-selected={selected === part} transform={`translate(${x} ${y}) rotate(${part === 'torso' ? 0 : pose[part]})`}
      onFocus={() => setSelected(part)} onKeyDown={event => keyboard(event, part)}
      onPointerDown={event => begin(event, part)} onPointerMove={move} onPointerUp={end}
      onPointerCancel={end} onLostPointerCapture={end}>
      {art}
      <rect className="joint-outline" x={bx - 3} y={by - 3} width={w + 14} height={h + 6} fill="none" />
      <rect className="joint-target" x={bx} y={by} width={w + 8} height={h} fill="transparent" />
      <rect className="joint-pivot" x="-3" y="-3" width="6" height="6" pointerEvents="none" />
    </g>
  }

  function arm(part: 'leftArm' | 'rightArm', x: number) {
    return joint(part, x, -39, [-14, -5, 28, 87], <>
      <Cuboid x={-14} y={-5} w={28} h={87} front="#c69269" side="#8b5c43" top="#e4b286" />
      <path d="M-14-5h28v34h-28z" fill="#438c76" /><path d="M-14 23h28v8h-28z" fill="#b2d5a0" />
      <path d="M-8 37h6v18h-6zm8 33h9v6H0z" fill="#d9a67a" />
      <path d="M14-5l8-6v34l-8 6z" fill="#285c54" />
    </>)
  }

  function leg(part: 'leftLeg' | 'rightLeg', x: number) {
    return joint(part, x, 40, [-14, 0, 28, 88], <>
      <Cuboid x={-14} y={0} w={28} h={88} front="#476886" side="#2d435e" top="#6d8ea6" />
      <path d="M-10 10h8v30h-8zM-14 48h28v7h-28z" fill="#587c99" />
      <path d="M-14 70h28v18h-28z" fill="#b89465" /><path d="M-14 83h28v5h-28z" fill="#3b3c3f" />
      <path d="M14 70l8-6v18l-8 6z" fill="#74604c" />
    </>)
  }

  return <section className="character-studio" data-night={night} data-dragging={dragging} aria-label="Character pose studio">
    <div className="character-studio__header"><span><i /> PLAYER STUDIO</span><span>{night ? 'NIGHTFALL' : 'DAYBREAK'}</span></div>
    <div className="character-stage">
      <span className="character-stage__tag" aria-hidden="true">PLAYER_01<br /><b>THE BUILDER</b></span>
      <svg viewBox="0 0 400 365" className="character-rig" role="group" aria-label="Poseable voxel character">
        <g aria-hidden="true" shapeRendering="crispEdges">
          <path d="M72 320l126-33 132 33-132 33z" fill="#1e3d42" stroke="#54736c" />
          <path d="M72 320v9l126 33v-9zm126 33 132-33v9l-132 33z" fill="#132d36" />
          <path d="M103 320h190M135 309l123 32m-61-43v55m63-44-124 32" fill="none" stroke="#355753" />
        </g>
        <g transform={`translate(196 185) rotate(${pose.torso})`}>
          {leg('leftLeg', -17)}{leg('rightLeg', 17)}
          {/* The torso handle rotates the entire rig; other joints rotate locally. */}
          {joint('torso', 0, 0, [-32, -48, 64, 88], <>
            <Cuboid x={-32} y={-48} w={64} h={88} front="#3b806e" side="#24554f" top="#71a88b" />
            <path d="M-24-43h48v13h-48z" fill="#2c6158" /><path d="M-7-43h14v9H-7z" fill="#c69269" />
            <path d="M-18-27h4v31h-4zm32 0h4V4h-4z" fill="#c2d4ad" />
            <path d="M-20 12h40v17h-40z" fill="#2e695e" /><path d="M-20 12h40v4h-40z" fill="#53917a" />
            <path d="M-32 33h64v7h-64z" fill="#263f48" /><path d="M-5 33H5v7H-5z" fill="#d7b778" />
          </>)}
          {arm('leftArm', -50)}{arm('rightArm', 50)}
          {joint('head', 0, -54, [-32, -64, 64, 64], <>
            <Cuboid x={-32} y={-64} w={64} h={64} front="#cc9b73" side="#98684c" top="#594333" />
            <path d="M-32-64h64v19H17v-7H3v10h-19v-7h-16zM-32-45h8v18h-8z" fill="#43332c" />
            <path d="M-25-60h19v5h-19zM5-60h19v5H5z" fill="#68503b" />
            <path d="M-22-32h15v9h-15zm29 0h15v9H7z" fill="#edf1d8" />
            <path d="M-14-32h7v9h-7zm21 0h7v9H7z" fill="#315458" />
            <path d="M-5-24h10v10H-5z" fill="#b5835d" /><path d="M-12-10h24v5h-24z" fill="#77533f" />
            <path d="M32-64l8-6v30l-8 6z" fill="#372e29" />
          </>)}
        </g>
      </svg>
      <span className="character-stage__mode" aria-hidden="true">POSE MODE / {dragging ? 'DRAGGING' : 'READY'}</span>
    </div>
    <div className="character-controls">
      <p id={helpId}>Drag a body part to pose it. Tab + arrow keys work too.</p>
      <div className="character-controls__adjust">
        <label htmlFor={sliderId}>{joints[selected].label} <output>{pose[selected]}°</output></label>
        <button type="button" aria-label={`Decrease ${joints[selected].label.toLowerCase()} angle`}
          onClick={() => change(selected, pose[selected] - 5)} disabled={pose[selected] <= joints[selected].min}>−</button>
        <input id={sliderId} aria-label={`Adjust ${joints[selected].label.toLowerCase()}`} type="range" min={joints[selected].min} max={joints[selected].max} value={pose[selected]}
          onChange={event => change(selected, Number(event.target.value))} />
        <button type="button" aria-label={`Increase ${joints[selected].label.toLowerCase()} angle`}
          onClick={() => change(selected, pose[selected] + 5)} disabled={pose[selected] >= joints[selected].max}>+</button>
      </div>
      <div className="character-controls__presets" role="group" aria-label="Character poses">
        <button type="button" onClick={() => setPose({ ...wave })}>Wave hello</button>
        <button type="button" onClick={() => setPose({ ...stride })}>Adventure pose</button>
        <button type="button" onClick={() => setPose({ ...neutral })}>Reset pose</button>
      </div>
    </div>
  </section>
}