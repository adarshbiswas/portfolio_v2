import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Color, Object3D } from 'three'
import type { Group, InstancedMesh, OrthographicCamera } from 'three'

export type WorldSceneProps = {
  night: boolean
  active: boolean
  /** False freezes ambient animation and makes camera controls instantaneous. */
  motion: boolean
  rotation: number
  dragging: boolean
  lights: boolean
  crystal: number
  onReady: () => void
  onFailure: () => void
}

type Vec3 = [number, number, number]
type Block = { position: Vec3; scale: Vec3; color: string }
const crystalColors = ['#63f5c5', '#ffbf64', '#bba0ff']
const noise = (x: number, z: number) => {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return n - Math.floor(n)
}
const isPond = (x: number, z: number) => ((x - 3.3) / 3.1) ** 2 + ((z - 2.4) / 2.5) ** 2 < 1
const ground = (x: number, z: number) => {
  if (x >= -5 && x <= 0 && z >= -5 && z <= 0) return 1.1
  return z < -3 ? 1.6 : x < -4 ? 0.9 : 0.45
}

/** Deterministic original geometry. All solid scenery shares one instanced draw. */
function buildLandscape() {
  const solid: Block[] = [], water: Block[] = [], windows: Block[] = [], stars: Block[] = []
  const box = (position: Vec3, scale: Vec3, color: string) => solid.push({ position, scale, color })
  for (let x = -8; x <= 8; x++) {
    for (let z = -6; z <= 6; z++) {
      if ((x / 8.8) ** 2 + (z / 7.5) ** 2 > 1 + noise(x, z) * 0.08) continue
      const pond = isPond(x, z)
      const height = pond ? -0.12 : ground(x, z)
      const variation = noise(x, z)
      box([x, (height - 1.7) / 2, z], [1, height + 1.7, 1], variation > 0.5 ? '#665643' : '#735d46')
      box([x, -2.1, z], [1, 0.8 + variation * 0.55, 1], variation > 0.5 ? '#444e50' : '#53615f')
      box([x, height, z], [1.005, 0.2, 1.005], pond ? '#738577' : variation > 0.65 ? '#6d9b4d' : variation > 0.3 ? '#557f3e' : '#608e45')
      if (pond) {
        water.push({ position: [x, 0.15, z], scale: [1.005, 0.12, 1.005], color: variation > 0.5 ? '#328f99' : '#3aa2a4' })
        if (variation > 0.68) box([x + 0.1, 0.218, z], [0.65, 0.012, 0.05], '#85c9b9')
      }
      // Grass tufts and small golden flowers, kept clear of the workshop footprint.
      if (!pond && variation > 0.86 && !(x > -6 && x < 1 && z < 1)) {
        box([x + 0.25, height + 0.32, z - 0.1], [0.12, 0.45, 0.12], '#81a751')
        if (variation > 0.94) box([x + 0.25, height + 0.56, z - 0.1], [0.23, 0.15, 0.23], '#e9bb67')
      }
    }
  }

  // Stepped stone underside and a few exposed mineral seams.
  for (const [x, z, width] of [[-4, 0, 5], [1, -2, 6], [4, 2, 4], [-1, 3, 4]]) {
    box([x, -2.8, z], [width, 1.1, width - 1], '#374749')
    box([x, -3.45, z], [width - 1, 0.5, width - 2], '#2d3b40')
  }
  for (let i = 0; i < 5; i++) box([2 + i * 0.7, -1.85, 6.51 - i * 0.1], [0.28, 0.23, 0.08], '#5dbaac')

  // Workshop: horizontal timber courses, structural posts, deep stepped slate roof.
  box([-2.5, 1.25, -2.3], [4.8, 0.3, 3.8], '#9b8a6a')
  for (let course = 0; course < 6; course++) {
    box([-2.5, 1.6 + course * 0.4, -2.3], [4.2, 0.38, 3.2], course % 2 ? '#aa7f50' : '#91683f')
  }
  for (const x of [-4.6, -0.4]) for (const z of [-3.9, -0.7]) {
    box([x, 2.65, z], [0.28, 2.9, 0.28], '#523e2f')
  }
  for (let tier = 0; tier < 4; tier++) {
    box([-2.5, 4.05 + tier * 0.38, -2.3], [5.2, 0.38, 4.2 - tier * 1.05], tier % 2 ? '#314950' : '#3e5a5d')
    box([-5.13, 4.05 + tier * 0.38, -2.3], [0.14, 0.4, 4.25 - tier * 1.05], '#719184')
  }
  box([-1, 5.1, -3], [0.65, 2.5, 0.7], '#7b7e74')
  box([-1, 6.4, -3], [0.86, 0.25, 0.9], '#b3ad91')
  box([-2.5, 2.15, -0.64], [0.8, 1.8, 0.13], '#493b30')
  box([-2.24, 2.1, -0.55], [0.09, 0.09, 0.09], '#e5c27a')
  for (const x of [-3.8, -1.2]) {
    box([x, 2.8, -0.62], [1.05, 1.15, 0.15], '#4d3c2e')
    windows.push({ position: [x, 2.8, -0.53], scale: [0.82, 0.88, 0.06], color: '#ffe0a0' })
    box([x, 2.8, -0.47], [0.065, 0.9, 0.06], '#725135')
    box([x, 2.8, -0.47], [0.86, 0.065, 0.06], '#725135')
    box([x, 2.2, -0.5], [1.22, 0.13, 0.4], '#c39c65')
  }
  windows.push({ position: [-0.33, 2.8, -2.3], scale: [0.06, 0.9, 1.1], color: '#ffe0a0' })
  box([-0.27, 2.8, -2.3], [0.08, 1, 0.08], '#725135')
  for (let step = 0; step < 4; step++) {
    box([-2.5, 1.04 - step * 0.14, 0.05 + step * 0.5], [1.55, 0.25, 0.5], '#a79775')
  }
  for (let step = 0; step < 5; step++) {
    box([-2.5 + step * 0.32, 0.57, 2.25 + step * 0.65], [0.8, 0.08, 0.5], step % 2 ? '#b1aa87' : '#918a6e')
  }

  // Layered pines: each foliage tier is one chunky cuboid, not individual leaves.
  const trees = [[-6, -3, 4.5], [-6, 1, 3.6], [-5, 4, 3.1], [2, -5, 4.7], [5, -3, 4], [7, 0, 3.3], [-1, -6, 3.8]]
  for (const [x, z, height] of trees) {
    const y = ground(x, z)
    box([x, y + height / 2, z], [0.42, height, 0.42], '#65513c')
    for (let tier = 0; tier < 4; tier++) {
      const width = (2.65 - tier * 0.59) * height / 4.5
      box([x, y + height * 0.43 + tier * 0.73, z], [width, 0.95, width], ['#294e40', '#345f46', '#3e7351', '#568b59'][tier])
    }
  }
  // Dock, reeds, fence, and a rune pedestal at the near edge.
  for (let i = 0; i < 5; i++) box([0.8 + i * 0.44, 0.47, 2.1], [0.4, 0.18, 1.25], '#ad895b')
  for (const x of [0.7, 2.65]) for (const z of [1.65, 2.55]) box([x, 0.1, z], [0.16, 1.1, 0.16], '#6f5136')
  for (let i = 0; i < 5; i++) {
    const x = 4 + i * 0.28, z = 4.5 + noise(i, 2) * 0.2
    box([x, 0.65, z], [0.09, 0.9, 0.09], '#839553')
    box([x, 1.15, z], [0.14, 0.3, 0.14], '#a98c4e')
  }
  for (const x of [-6, -4.5, -3]) box([x, 1.18, 5.3], [0.17, 1.2, 0.17], '#ab956d')
  box([-4.5, 1.45, 5.3], [3.2, 0.16, 0.14], '#bea77a')
  box([-4.5, 1.04, 5.3], [3.2, 0.14, 0.14], '#917b59')
  box([1, 0.76, 5], [1.65, 0.45, 1.65], '#7e9186')
  box([1, 1.1, 5], [1.12, 0.25, 1.12], '#b6c5a4')

  // Distant terraced silhouettes are detached from the floating foreground island.
  for (const [x, z, height, width] of [[-12, -15, 8, 7], [-5, -18, 11, 8], [4, -19, 9, 7], [11, -15, 7, 6], [-15, -7, 6, 5]]) {
    for (let tier = 0; tier < 5; tier++) {
      const scale = 1 - tier * 0.17
      box([x, -4 + tier * height / 5, z], [width * scale, height / 5, width * scale], tier === 4 ? '#91aaa6' : tier > 2 ? '#496369' : '#354c58')
    }
  }
  for (let i = 0; i < 48; i++) {
    const angle = noise(i, 31) * Math.PI * 2
    stars.push({ position: [Math.cos(angle) * 29, 8 + noise(i, 10) * 14, Math.sin(angle) * 29],
      scale: [0.055 + noise(i, 4) * 0.065, 0.055 + noise(i, 4) * 0.065, 0.055], color: '#c9e7df' })
  }
  return { solid, water, windows, stars }
}

type BlocksProps = { blocks: Block[]; kind?: 'solid' | 'water' | 'windows' | 'stars'; lit?: boolean }
const Blocks = memo(function Blocks({ blocks, kind = 'solid', lit = true }: BlocksProps) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new Object3D(), color = new Color()
    blocks.forEach((block, index) => {
      dummy.position.set(...block.position)
      dummy.scale.set(...block.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
      mesh.setColorAt(index, color.set(block.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [blocks])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, blocks.length]}
      castShadow={kind === 'solid'} receiveShadow={kind === 'solid' || kind === 'water'}>
      <boxGeometry />
      {kind === 'stars' ? <meshBasicMaterial toneMapped={false} />
        : <meshStandardMaterial roughness={kind === 'water' ? 0.24 : 0.92}
          metalness={kind === 'water' ? 0.28 : 0}
          color={kind === 'windows' && !lit ? '#253038' : '#ffffff'}
          emissive={kind === 'windows' && lit ? '#ffc477' : '#000000'}
          emissiveIntensity={kind === 'windows' && lit ? 2.2 : 0} />}
    </instancedMesh>
  )
})

function Landscape(props: WorldSceneProps) {
  const { night, active, motion, rotation, dragging, lights, crystal, onReady, onFailure } = props
  const landscape = useMemo(() => buildLandscape(), [])
  const gem = useRef<Group>(null)
  const motes = useRef<Group>(null)
  const elapsed = useRef(0)
  const orbit = useRef(rotation)
  const { get, size, gl, invalidate } = useThree()
  const color = crystalColors[crystal % crystalColors.length]

  useLayoutEffect(() => {
    // Three's camera is intentionally imperative, not an immutable React value.
    const ortho = get().camera as OrthographicCamera
    ortho.zoom = Math.min(size.width / 27, size.height / 22)
    ortho.updateProjectionMatrix()
    invalidate()
  }, [get, size.width, size.height, invalidate])

  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onFailure() }
    canvas.addEventListener('webglcontextlost', lost)
    onReady()
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [gl, onReady, onFailure])

  // Only R3F owns a frame loop. A single invalidation wakes it after any control,
  // preference or visibility change; frames stop unless ambient motion is enabled.
  useEffect(() => {
    if (active) invalidate()
  }, [active, motion, rotation, dragging, night, lights, crystal, invalidate])

  useFrame(({ camera }, delta) => {
    if (!active) return
    const dt = Math.min(delta, 0.05)
    orbit.current = motion && !dragging
      ? orbit.current + (rotation - orbit.current) * (1 - Math.exp(-dt * 9))
      : rotation
    const angle = Math.PI / 5 + orbit.current
    camera.position.set(Math.sin(angle) * 25, 17, Math.cos(angle) * 25)
    camera.lookAt(0, 1, 0)
    if (motion) {
      elapsed.current += dt
      if (gem.current) {
        gem.current.position.y = 2.05 + Math.sin(elapsed.current * 1.4) * 0.16
        gem.current.rotation.y = elapsed.current * 0.45
      }
      if (motes.current) motes.current.rotation.y = elapsed.current * 0.12
      invalidate()
    }
  })

  return (
    <>
      <color attach="background" args={[night ? '#0b1928' : '#aec8c4']} />
      <fog attach="fog" args={[night ? '#0b1928' : '#aec8c4', 33, 72]} />
      <hemisphereLight args={[night ? '#8cbbdf' : '#e2f0db', '#4a5347', night ? 1.15 : 2.1]} />
      <directionalLight position={[-7, 15, 7]} color={night ? '#b4d7ff' : '#fff0ca'}
        intensity={night ? 1.7 : 2.6} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12}
        shadow-camera-bottom={-12} shadow-camera-far={50} shadow-normalBias={0.08} />
      <directionalLight position={[7, 6, -8]} color="#79c7b2" intensity={night ? 0.9 : 0.5} />
      <Blocks blocks={landscape.solid} />
      <Blocks blocks={landscape.water} kind="water" />
      <Blocks blocks={landscape.windows} kind="windows" lit={lights} />
      {night && <Blocks blocks={landscape.stars} kind="stars" />}
      <pointLight position={[-2.4, 3, 0.2]} color="#ffc070" intensity={lights ? (night ? 26 : 9) : 0} distance={8} decay={2} />
      <pointLight position={[1, 2.5, 5]} color={color} intensity={night ? 12 : 3} distance={5} decay={2} />
      <group ref={gem} position={[1, 2.05, 5]}>
        <mesh scale={[0.46, 0.86, 0.46]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} roughness={0.25} metalness={0.25} flatShading />
        </mesh>
        <mesh rotation={[0, Math.PI / 4, 0]} scale={[0.79, 0.05, 0.79]} position={[0, -0.45, 0]}>
          <boxGeometry />
          <meshBasicMaterial color={color} wireframe toneMapped={false} />
        </mesh>
      </group>
      <group ref={motes} position={[1, 1.6, 3]}>
        {[0, 1, 2, 3, 4, 5].map(i => <mesh key={i}
          position={[Math.sin(i * 2.4) * 2.7, 0.2 + noise(i, 7) * 1.4, Math.cos(i * 2.4) * 2.7]}>
          <boxGeometry args={[0.055, 0.055, 0.055]} />
          <meshBasicMaterial color={night ? '#ddf6b4' : '#fff0bd'} toneMapped={false} />
        </mesh>)}
      </group>
      <mesh position={[-9, 7, -2]} rotation={[0.1, 0.15, 0.1]}>
        <boxGeometry args={[2.3, 2.3, 0.8]} />
        <meshBasicMaterial color={night ? '#d6efe6' : '#fff0b5'} toneMapped={false} fog={false} />
      </mesh>
    </>
  )
}

function CanvasUnavailable({ onFailure }: { onFailure: () => void }) {
  useEffect(() => { onFailure() }, [onFailure])
  return null
}

/** Loaded by WorldExplorer only; prefer the wrapper for capability/error handling. */
export default function WorldScene(props: WorldSceneProps) {
  return (
    <div className="world-explorer__canvas" role="img"
      aria-label={`Interactive ${props.night ? 'moonlit' : 'sunlit'} voxel landscape with grass terraces, a pond, pine trees, stepped mountains, a cabin with lights ${props.lights ? 'on' : 'off'}, and a ${['jade', 'amber', 'violet'][props.crystal % 3]} floating crystal. Use the world controls below to explore.`}>
      <Canvas orthographic shadows dpr={[1, 1.5]} frameloop={props.active ? 'demand' : 'never'}
        camera={{ position: [15, 17, 20], zoom: 22, near: 0.1, far: 110 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
        fallback={<CanvasUnavailable onFailure={props.onFailure} />}>
        <Landscape {...props} />
      </Canvas>
    </div>
  )
}