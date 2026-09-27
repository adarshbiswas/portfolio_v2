import { useState } from 'react'
import { ArrowUpRight, Code2, Heart, Pickaxe, Sparkles } from 'lucide-react'
import { profile, toolkit, type Project } from '../../portfolio'
import { SkillIcon } from './SkillIcon'

/** Original three-face CSS block, not a game texture. */
export function InventoryBlock({ kind = 0 }: { kind?: number }) {
  return <span className={`inventory-block material-${kind % 8}`} aria-hidden="true">
    <span className="block-top" /><span className="block-left" /><span className="block-right" />
  </span>
}

export function PlayerAvatar({ small = false }: { small?: boolean }) {
  return <span className={`player-avatar${small ? ' player-avatar--small' : ''}`} aria-hidden="true">
    <span className="player-avatar__hair" /><span className="player-avatar__eyes" /><span className="player-avatar__mouth" />
  </span>
}

export function AboutSection() {
  return <section id="about" className="section container about-section" aria-labelledby="about-title">
    <div className="about-panel">
      <div className="about-player"><PlayerAvatar /><span>PLAYER_01</span></div>
      <div className="about-copy">
        <span className="eyebrow">01 / THE PLAYER BEHIND THE BUILDS</span>
        <h2 id="about-title">About me<span>.</span></h2>
        <p className="about-lead">{profile.intro}</p>
        <p>{profile.about}</p>
        <div className="builder-principles"><div><Heart size={16} /><span>Creator at heart</span></div><div><Code2 size={16} /><span>Engineer by mindset</span></div><div><Sparkles size={16} /><span>Always exploring</span></div></div>
      </div>
      <a href="#contact" className="about-quest"><Pickaxe size={25} /><span>THE NEXT QUEST</span><strong>Build something<br />that matters.</strong><span>Let’s connect <ArrowUpRight size={14} /></span></a>
    </div>
  </section>
}

export function SkillsInventory() {
  const [selected, setSelected] = useState(0)
  const items = toolkit.flatMap((group, category) => group.skills.map((name) => ({ name, category, group })))
  const item = items[selected]
  return <section id="skills" className="section container inventory-section" aria-labelledby="skills-title">
    <div className="section-heading"><div><span className="eyebrow">02 / MY INVENTORY</span><h2 id="skills-title"><Pickaxe aria-hidden="true" /> Skills & tools<span>.</span></h2></div><span className="section-hint">SELECT A TOOL TO INSPECT <ArrowUpRight size={14} /></span></div>
    <p className="skills-note">Example toolkit — personalize this with the technologies you use.</p>
    <div className="inventory-categories" role="group" aria-label="Skill categories">
      {toolkit.map((group, category) => <button key={group.title} aria-pressed={item?.category === category}
        aria-controls="skill-slots" onClick={() => setSelected(items.findIndex(entry => entry.category === category))}>
        {group.label}
      </button>)}
    </div>
    <div id="skill-slots" className="inventory-grid" role="group" aria-label="Skills inventory">
      {items.map(({ name, category }, index) => <button className="inventory-slot-button" key={name} data-current-category={item?.category === category} aria-pressed={selected === index} aria-controls="inventory-details" onClick={() => setSelected(index)}>
        <span className="slot-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <SkillIcon name={name} /><span className="slot-name">{name}</span>
      </button>)}
    </div>
    {item && <div className="inventory-details" id="inventory-details" role="status" aria-live="polite" aria-atomic="true">
      <SkillIcon name={item.name} />
      <div><span className="eyebrow">EQUIPPED / {item.group.title.toUpperCase()}</span><h3>{item.name}</h3><p>{item.group.description}</p></div>
      <span className="inventory-rarity">CREATIVE TOOLKIT</span>
    </div>}
  </section>
}

/** Original SVG miniature worlds for sample projects. No external imagery. */
export function PixelProjectArt({ project }: { project: Project }) {
  const green = project.color === 'green'
  const purple = project.color === 'purple'
  const sky = green ? '#80b0cb' : purple ? '#7070a0' : '#193a52'
  return <div className={`project-art art-${project.color}`} aria-hidden="true">
    <svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMid slice" className="project-landscape" shapeRendering="crispEdges">
      <path fill={sky} d="M0 0h360v180H0z" />
      <path fill={green ? '#cde4cf' : '#d6ad92'} opacity=".8" d="M22 32h35v-7h25v15H22zm206-10h38v-6h30v14h-68z" />
      <path fill="#eec981" d="M286 40h23v23h-23z" />
      <path fill="#395c69" d="M0 100h19V78h18V60h24V42h21v21h17v24h28v19h26V81h23V60h18V40h25v25h16v17h32v17h20V70h25V57h25v40h23v83H0z" />
      <path fill="#244d49" d="M0 130h38v-18h34v12h38v-17h33v17h36v-8h39v-22h31v18h37v10h37v-13h37v71H0z" />
      <path fill="#286873" d="M0 142h360v38H0z" />
      <path fill="#74aaaa" opacity=".5" d="M10 153h65v2H10zm225 7h93v2h-93zm-120 12h54v2h-54z" />
      <path fill="#3c372f" d="m52 140 111-31 150 28-118 38z" />
      <path fill="#588446" d="m52 130 111-31 150 28-118 38z" />
      <path fill="#365b34" d="m52 130 143 35v10L52 140z" />
      {green ? <g>
        <path fill="#715030" d="M111 73h101v62H111z" /><path fill="#b7834e" d="M111 73h83v62h-83z" />
        <path fill="#594330" d="M110 93h86v3h-86zm0 20h86v3h-86z" />
        <path fill="#443c38" d="M98 70h17V58h18V47h63v11h17v12h13v9H98z" />
        <path fill="#ac6446" d="M103 66h14v-9h19v-8h57v8h18v9h11v8H103z" />
        <path fill="#ffda84" d="M122 87h15v16h-15zm52 0h15v16h-15z" /><path fill="#513f31" d="M147 108h19v28h-19z" />
        <path fill="#99998c" d="M183 31h12v25h-12z" /><path fill="#d4d1be" opacity=".7" d="M185 18h9v8h-9zm5-11h10v7h-10z" />
      </g> : purple ? <g>
        <path fill="#242b46" d="M132 47h75v88h-75z" /><path fill="#a481de" d="M140 53h58v72h-58z" />
        <path fill="#63519b" d="M146 59h46v60h-46z" /><path fill="#d3b4ef" d="M152 65h34v48h-34z" />
        <path fill="#403958" d="M126 41h88v12h-88zm0 84h88v12h-88z" />
        <path fill="#778d89" d="M115 137h113v9H115z" /><path fill="#e6c5ff" d="M166 73h9v27h-9zm-9 9h27v9h-27z" />
      </g> : <g>
        <path fill="#486c77" d="M123 81h90v48h-90z" /><path fill="#77959b" d="M132 71h72v11h-72z" />
        <path fill="#344955" d="M141 36h54v46h-54z" /><path fill="#608991" d="M148 29h40v8h-40z" />
        <path fill="#77eedb" d="M151 44h9v13h-9zm25 0h9v13h-9zm-40 45h10v8h-10zm28 0h10v8h-10zm26 0h10v8h-10z" />
        <path fill="#172b3e" d="M136 108h63v17h-63z" /><path fill="#f3b577" d="M159 110h16v15h-16z" />
        <path fill="#d4e6d6" d="M165 10h5v19h-5z" />
      </g>}
      {[26, 73, 265, 308].map((x, i) => <g key={x} transform={`translate(${x} ${68 + (i % 2) * 25})`}><path fill="#5b4537" d="M11 25h6v41h-6z" /><path fill="#275444" d="M0 25h28v19H0zm4-13h20v15H4zM9 0h10v14H9z" /><path fill="#3e7650" d="M0 25h24v4H0zm4-13h16v4H4z" /></g>)}
      <path fill="#96744a" d="M245 126h4v24h-4z" /><path fill="#edb55f" d="M241 123h12v12h-12z" /><path fill="#fff0af" d="M244 125h6v7h-6z" />
    </svg>
    <span className="art-coordinate">WORLD_{project.id}</span><span className="project-art-label">{green ? 'THE WORKSHOP' : purple ? 'THE CREATIVE PORTAL' : 'THE SIGNAL TOWER'}</span>
  </div>
}