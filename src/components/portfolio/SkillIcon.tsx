import type { ReactNode } from 'react'

// Hand-drawn, grid-aligned interpretations, not downloaded game textures/logos.
const glyphs: Record<string, string[]> = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  S: ['01111', '11000', '11000', '01110', '00011', '00011', '11110'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
}

function Letters({ text }: { text: string }) {
  return <g fill="currentColor">{[...text].flatMap((letter, index) =>
    (glyphs[letter] ?? []).flatMap((row, y) => [...row].map((pixel, x) => pixel === '1'
      ? <rect key={`${index}-${x}-${y}`} x={5 + index * 12 + x * 2} y={12 + y * 2} width="2" height="2" /> : null)),
  )}</g>
}

const icons: Record<string, { color: string; art: ReactNode }> = {
  React: { color: '#75ddef', art: <><path d="M4 12h6V6h4V2h4v4h4v6h6v8h-6v6h-4v4h-4v-4h-4v-6H4z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M6 8h6l14 14v4h-6L6 12zm20 0h-6L6 22v4h6L26 12z" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="13" y="13" width="6" height="6" /></> },
  TypeScript: { color: '#70b7f5', art: <><path d="M2 2h28v28H2z" fill="#245a91" /><Letters text="TS" /></> },
  'HTML & CSS': { color: '#f5a06b', art: <><path d="M4 3h24v16h-3v6h-5v4h-8v-4H7v-6H4z" fill="#91482d" /><path d="M9 9h14v4H13v3h10v7h-4v3h-6v-4h6v-3H9z" /></> },
  'Responsive design': { color: '#a5c7f9', art: <><path d="M2 5h22v16H2zm9 16h4v4h5v3H6v-3h5z" /><path d="M5 8h16v10H5z" fill="#294559" /><path d="M21 13h9v17h-9z" fill="#e8c783" /><path d="M23 16h5v10h-5z" fill="#294559" /></> },
  'Node.js': { color: '#8ad076', art: <><path d="M12 1h8v3h6v4h4v16h-4v4h-6v3h-8v-3H6v-4H2V8h4V4h6z" fill="#285538" /><Letters text="JS" /></> },
  'REST APIs': { color: '#efbb70', art: <><path d="M2 9h17V5h4v4h4v4h-4v4h-4v-4H2zm28 14H13v4H9v-4H5v-4h4v-4h4v4h17z" /><rect x="1" y="17" width="3" height="3" /><rect x="28" y="8" width="3" height="3" /></> },
  PostgreSQL: { color: '#87b9e6', art: <><path d="M6 3h18v3h5v17h-5v-9h-3v13h-3v3h-6v-4h5V15h-3v9H8v-5H3V7h3z" /><path d="M7 7h5v9H7zm13 0h5v5h-5z" fill="#41617b" /><path d="M13 8h3v3h-3zm6 0h3v3h-3z" fill="#142534" /></> },
  Redis: { color: '#f28282', art: <><path d="M3 20h5v-3h16v3h5v5h-5v3H8v-3H3z" fill="#9a424e" /><path d="M3 13h5v-3h16v3h5v5h-5v3H8v-3H3z" fill="#c65d65" /><path d="M3 6h5V3h16v3h5v5h-5v3H8v-3H3z" /><path d="M10 6h4v4h-4zm8 1h7v2h-7z" fill="#fce7c9" /></> },
  Git: { color: '#f49d81', art: <><path d="M13 1h6v4h4v4h4v4h4v6h-4v4h-4v4h-4v4h-6v-4H9v-4H5v-4H1v-6h4V9h4V5h4z" fill="#b95843" /><path d="M11 7h4v7h9v4h-9v7h-4z" /><path d="M9 5h8v6H9zm0 18h8v6H9zm12-11h7v8h-7z" /></> },
  Vite: { color: '#ddb2ff', art: <><path d="M1 5h9v4h12V5h9v5h-4v7h-4v6h-4v7h-6v-7H9v-6H5v-7H1z" fill="#8d70cd" /><path d="M16 1h10v5h-4v6h4v4h-7v6h-5v6h-3V14h5V9h-5V5h5z" fill="#f9d56d" /></> },
  Docker: { color: '#81d7ed', art: <><path d="M3 16h23v-4h4v9h-4v5h-6v3H9v-3H5v-5H3z" /><path d="M5 10h5v5H5zm6 0h5v5h-5zm6 0h5v5h-5zm-6-6h5v5h-5zm6 0h5v5h-5z" /><rect x="7" y="19" width="3" height="3" fill="#235b7c" /></> },
  Testing: { color: '#a3dd90', art: <><path d="M7 2h18v28H3V6h4z" fill="#375e4c" /><path d="M10 1h12v6H10zM7 13h4v4h4v-4h4V9h4v8h-4v4h-8v-4H7zM8 25h14v2H8z" /></> },
  Accessibility: { color: '#c9b3ff', art: <><path d="M13 2h6v6h-6zM3 11h26v4H19v5h3v5h3v5h-6v-5h-3v-5h-1v5h-3v5H6v-5h3v-5h3v-5H3z" /></> },
  'Clean code': { color: '#8fdfb5', art: <><path d="M7 8h5v4H8v8h4v4H7v-4H3v-8h4zm13 0h5v4h4v8h-4v4h-5v-4h4v-8h-4zM16 5h4v6h-2v10h-2v6h-4v-6h2V11h2z" /></> },
  Performance: { color: '#f3ca72', art: <><path d="M3 17h4v-6h5V7h8v4h5v6h4v11H3z" fill="#796142" /><path d="M13 12h6v4h-6zM7 19h4v5H7zm14 0h4v5h-4z" /><path d="M22 7h5v5h-4v5h-4v5h-6v-6h5v-5h4z" /></> },
  Collaboration: { color: '#e9a9cb', art: <><path d="M3 5h8v8H3zm18 0h8v8h-8zM1 16h12v11H1zm18 0h12v11H19z" /><path d="M13 9h6v3h-6zm0 11h6v3h-6z" fill="#f6d990" /></> },
}

export function SkillIcon({ name }: { name: string }) {
  const icon = icons[name]
  return <svg className="skill-pixel-icon" data-skill-icon={name} viewBox="0 0 32 32"
    shapeRendering="crispEdges" aria-hidden="true" focusable="false"
    style={{ color: icon?.color ?? '#94d9ad' }} fill="currentColor">
    {icon?.art ?? <path d="M7 7h18v18H7zM3 3h5v5H3zm21 21h5v5h-5z" />}
  </svg>
}