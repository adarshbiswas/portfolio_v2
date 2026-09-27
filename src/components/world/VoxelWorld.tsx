import { memo, useState } from 'react'
import { RotateCw } from 'lucide-react'

type Material = 'grass' | 'dirt' | 'stone' | 'water' | 'wood' | 'leaves' | 'leafLight' | 'plank' | 'roof' | 'window' | 'sand' | 'flower'
type Block = { x: number; y: number; z: number; material: Material }
const palette: Record<Material, [string, string, string]> = {
  grass: ['#91b94c', '#628c38', '#4f7531'], dirt: ['#a38258', '#886543', '#684e39'],
  stone: ['#b2b4a2', '#858f7d', '#697764'], water: ['#72c6d0', '#469eac', '#367f99'],
  wood: ['#a17a49', '#805b37', '#61472d'], leaves: ['#648b3b', '#487031', '#345829'],
  leafLight: ['#83a747', '#608937', '#47732c'], plank: ['#d4b77c', '#b99a62', '#99784b'],
  roof: ['#bc7351', '#935439', '#743f31'], window: ['#ffe7a0', '#dbbd70', '#c99d51'],
  sand: ['#dacda1', '#bcad86', '#a29673'], flower: ['#f3c266', '#dda24d', '#bf813b'],
}

function makeWorld() {
  const blocks: Block[] = []
  const add = (x: number, y: number, z: number, material: Material) => blocks.push({ x, y, z, material })
  for (let x = 0; x < 11; x++) {
    for (let z = 0; z < 11; z++) {
      if ((x === 0 && (z < 2 || z > 8)) || (x === 10 && (z < 2 || z > 7)) || (z === 0 && (x < 2 || x > 8)) || (z === 10 && (x < 2 || x > 7))) continue
      const pond = x >= 6 && x <= 9 && z >= 6 && z <= 8 && !(x === 6 && z === 6)
      for (let y = -2; y <= 0; y++) {
        add(x, y, z, y === 0 ? (pond ? 'water' : (x === 5 && z > 4) || (z === 5 && x > 4) ? 'sand' : 'grass') : (x + z + y) % 5 === 0 ? 'stone' : 'dirt')
      }
      if ((x * 7 + z * 3) % 17 === 0) add(x, -3, z, 'stone')
    }
  }
  // Original trees, workshop, and crafting bench. No game assets are used.
  for (const [tx, tz, tall] of [[1, 4, 4], [8, 1, 3]]) {
    for (let y = 1; y <= tall; y++) add(tx, y, tz, 'wood')
    for (let y = tall; y <= tall + 2; y++) {
      const radius = y === tall + 2 ? 0 : 1
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx || dz || y !== tall) add(tx + dx, y, tz + dz, (dx + dz + y) % 3 === 0 ? 'leafLight' : 'leaves')
        }
      }
    }
  }
  for (let x = 3; x <= 6; x++) {
    for (let z = 1; z <= 3; z++) {
      for (let y = 1; y <= 3; y++) {
        const window = y === 2 && ((z === 3 && x === 4) || (x === 6 && z === 2))
        add(x, y, z, window ? 'window' : x === 5 && z === 3 && y < 3 ? 'wood' : 'plank')
      }
    }
  }
  for (let x = 2; x <= 7; x++) {
    for (let z = 0; z <= 4; z++) {
      add(x, 4, z, 'roof')
      if (z >= 1 && z <= 3) add(x, 5, z, 'roof')
      if (z === 2) add(x, 6, z, 'roof')
    }
  }
  add(6, 6, 1, 'stone'); add(6, 7, 1, 'stone')
  add(2, 1, 7, 'wood'); add(3, 1, 7, 'wood')
  add(2, 2, 7, 'plank'); add(3, 2, 7, 'plank'); add(3, 3, 7, 'stone')
  add(6, 1, 9, 'stone')
  for (const [x, z] of [[1, 8], [3, 9], [9, 4]]) add(x, 1, z, 'flower')
  return blocks
}
const world = makeWorld()

export const VoxelWorld = memo(function VoxelWorld() {
  const [rotation, setRotation] = useState(0)
  const blocks = world.map((block) => {
    let { x, z } = block
    for (let i = 0; i < rotation; i++) [x, z] = [10 - z, x]
    return { ...block, x, z }
  }).sort((a, b) => (a.x + a.z) - (b.x + b.z) || a.y - b.y)

  return (
    <div className="world-wrap">
      <div className="world-label"><span className="status-dot" /> A LITTLE WORLD OF POSSIBILITIES</div>
      <div className="world-scene">
        <div className="world-orbit orbit-one" /><div className="world-orbit orbit-two" />
        <span className="world-spark spark-one" aria-hidden="true">+</span><span className="world-spark spark-two" aria-hidden="true">+</span>
        <svg className="voxel-world" viewBox="0 0 650 500" role="img" aria-label={`Floating voxel island with a workshop, trees, and a pond. View ${rotation + 1} of 4.`}>
          <ellipse cx="325" cy="442" rx="167" ry="22" fill="currentColor" opacity=".07" />
          <g className="floating-island" strokeLinejoin="round" strokeWidth=".45">
            {blocks.map(({ x, y, z, material }, index) => {
              const px = 325 + (x - z) * 23
              const py = 160 + (x + z) * 11.5 - y * 23
              const [top, left, right] = palette[material]
              return (
                <g key={index}>
                  <path d={`M${px - 23},${py} l23,11.5 v23 l-23,-11.5Z`} fill={left} stroke={left} />
                  <path d={`M${px},${py + 11.5} l23,-11.5 v23 l-23,11.5Z`} fill={right} stroke={right} />
                  <path d={`M${px},${py - 11.5} l23,11.5 -23,11.5 -23,-11.5Z`} fill={top} stroke={top} />
                  {material === 'grass' && (x + z) % 3 === 0 && <path d={`M${px - 8},${py} l7,-3.5 6,3 -7,3.5Z`} fill="#acd068" opacity=".45" />}
                  {material === 'water' && <path d={`M${px - 8},${py - 2} l12,6 7,-3.5`} fill="none" stroke="#baeeee" strokeWidth="1.3" opacity=".6" />}
                </g>
              )
            })}
          </g>
        </svg>
        <span className="scene-badge badge-build"><span>⌘</span> Crafted with curiosity</span>
        <span className="scene-badge badge-code"><span>&lt;/&gt;</span> Code. Create. Repeat.</span>
      </div>
      <div className="world-controls">
        <span aria-live="polite"><span className="tiny-square" /> OVERWORLD <span className="coordinates">/ {rotation * 90}°</span></span>
        <button onClick={() => setRotation((value) => (value + 1) % 4)} aria-label="Rotate world"><RotateCw size={14} /> Rotate world</button>
      </div>
    </div>
  )
})