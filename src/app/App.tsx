import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Blocks, Check, CheckCheck, Code2, Copy, CodeXml as Github, Layers3, ContactRound as Linkedin, Mail, Menu, Moon, Pickaxe, Send, Sparkles, Sun, X, Home, UserRound, Compass } from 'lucide-react'
import { categories, profile, projects, type Category, type Project } from '../portfolio'
import { CharacterStudio } from '../components/character/CharacterStudio'
import { AboutSection, SkillsInventory, InventoryBlock, PlayerAvatar, PixelProjectArt as ProjectArt } from '../components/portfolio/PortfolioBlocks'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { useSectionNavigation } from '../hooks/useSectionNavigation'
import '../styles/App.css'
import '../styles/Adventure.css'

const navigation = [{ id: 'home', label: 'Home', icon: Home }, { id: 'about', label: 'About', icon: UserRound }, { id: 'skills', label: 'Skills', icon: Pickaxe }, { id: 'projects', label: 'Projects', icon: Blocks }, { id: 'contact', label: 'Contact', icon: Mail }]
type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('portfolio-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Storage is optional. */ }
  return 'dark'
}

function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!project || !dialog) return
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [project])

  return (
    <dialog ref={ref} className="project-dialog" aria-labelledby="project-title" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      {project && <div className="dialog-content">
        <button className="icon-button dialog-close" aria-label="Close project" onClick={onClose} autoFocus><X size={20} /></button>
        <span className="eyebrow">PROJECT EXPLORER / {project.id}</span>
        <h2 id="project-title">{project.name}<span>.</span></h2>
        <div className="sample-notice">Sample project concept — replace with your own work.</div>
        <p>{project.idea}</p><h3>Proposed build plan</h3>
        <ul className="approach-list">{project.approach.map((item) => <li key={item}><Check size={18} /><span>{item}</span></li>)}</ul>
        <div className="tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>}
    </dialog>
  )
}

function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const { navRef, activeSection, indicator } = useSectionNavigation(menuOpen)
  const [filter, setFilter] = useState<Category>('All builds')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const menuButton = useRef<HTMLButtonElement>(null)
  const filteredProjects = projects.filter((project) => filter === 'All builds' || project.category === filter)

  useSmoothScroll(selectedProject !== null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#e6ebe0' : '#0c141e')
    try { localStorage.setItem('portfolio-theme', theme) } catch { /* Storage is optional. */ }
  }, [theme])

  useEffect(() => {
    if (copyState === 'idle') return
    const timeout = window.setTimeout(() => setCopyState('idle'), 3500)
    return () => window.clearTimeout(timeout)
  }, [copyState])

  async function copyEmail() {
    if (!profile.email) return
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopyState('copied')
    } catch { setCopyState('error') }
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <a href="#home" className="brand" aria-label={`${profile.firstName} home`}><PlayerAvatar small /><span>{profile.name}<small>{profile.role}</small></span></a>
          <nav ref={navRef} id="main-navigation" aria-label="Main navigation" className={menuOpen ? 'navigation is-open' : 'navigation'} onKeyDown={(event) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() } }}>
            {navigation.map((item) => <a key={item.id} href={`#${item.id}`} aria-current={activeSection === item.id ? 'location' : undefined} onClick={() => setMenuOpen(false)}><item.icon size={13} aria-hidden="true" />{item.label}</a>)}
            <span className="navigation-indicator" aria-hidden="true" style={{ width: indicator.width, transform: `translate3d(${indicator.x}px, ${indicator.y}px, 0)`, opacity: indicator.width ? 1 : 0 }} />
          </nav>
          <div className="header-actions">
            <button className="theme-switch" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'night' : 'day'} mode`}><Sun size={16} /><span className={`switch-track ${theme === 'dark' ? 'is-night' : ''}`}><span /></span><Moon size={15} /></button>
            <a className="header-contact" href="#contact">Let’s build <ArrowRight size={15} /></a>
            <button ref={menuButton} className="icon-button menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero container" id="home" aria-labelledby="hero-title">
          <div className="hero-sky" aria-hidden="true"><span className="pixel-cloud cloud-one" /><span className="pixel-cloud cloud-two" /><div className="pixel-mountains" /></div>
          <div className="hero-copy">
            <span className="mode-badge"><span className="status-dot" /> PLAYER_01 / CREATIVE MODE</span>
            <p className="hero-intro">Hi, I’m</p>
            <h1 id="hero-title">{profile.firstName}<br /><span className="accent-text">{profile.name.startsWith(profile.firstName) ? profile.name.slice(profile.firstName.length).trim() : profile.name}<span className="heading-dot">_</span></span></h1>
            <p className="hero-role">{profile.role}</p>
            <p className="hero-description">{profile.headline}<br /><span>{profile.tagline}</span></p>
            <div className="hero-actions"><a className="button button-primary" href="#projects"><Pickaxe size={18} /> View my work <ArrowRight size={17} /></a><a className="button button-secondary" href="#about"><UserRound size={16} /> Meet the builder</a></div>
            <div className="hero-hotbar" aria-label="Explore portfolio sections">{navigation.slice(1).map((item, index) => <a key={item.id} href={`#${item.id}`} aria-label={`Go to ${item.label}`}><InventoryBlock kind={index * 2} /><span>{item.label}</span><kbd aria-hidden="true">0{index + 1}</kbd></a>)}</div>
            <div className="hero-footnote"><span className="pixel-heart" aria-hidden="true">♥ ♥ ♥ ♥ ♥</span><span>Curiosity: fully equipped</span></div>
          </div>
          <div className="hero-world"><CharacterStudio night={theme === 'dark'} /></div>
          <div className="hero-bottom"><a href="#about"><span className="scroll-icon"><ArrowDown size={14} /></span> SCROLL TO EXPLORE</a><span><Compass size={13} /> YOUR NEXT ADVENTURE STARTS HERE</span></div>
        </section>

        <div className="craft-strip"><div className="container"><span><Code2 size={17} /> CLEAN CODE</span><i aria-hidden="true">✦</i><span><Layers3 size={17} /> THOUGHTFUL DESIGN</span><i aria-hidden="true">✦</i><span><Blocks size={17} /> SOLID FOUNDATIONS</span><i aria-hidden="true">✦</i><span><Sparkles size={17} /> A LITTLE CREATIVITY</span></div></div>

        <AboutSection />
        <SkillsInventory />

        <section id="projects" className="section container" aria-labelledby="projects-title">
          <div className="section-heading"><div><span className="eyebrow">03 / THE BUILD LOG</span><h2 id="projects-title"><Blocks aria-hidden="true" /> Featured projects<span>.</span></h2></div><p>Different worlds. Same curiosity.<br />Select a build to look inside.</p></div>
          <div className="project-toolbar"><div className="filters" role="group" aria-label="Filter projects">{categories.map((category) => <button key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}{category === 'All builds' && <span>{projects.length.toString().padStart(2, '0')}</span>}</button>)}</div><span className="sample-label">SAMPLE BUILDS · REPLACE WITH YOUR WORK</span></div>
          <p className="sr-only" aria-live="polite">{filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} shown</p>
          <div className="project-grid">{filteredProjects.map((project) => <article className="project-card" key={project.id}>
            <ProjectArt project={project} />
            <div className="project-content"><div className="project-category"><span className={`category-dot dot-${project.color}`} />{project.category}<span>/{project.id}</span></div><div className="project-title"><h3>{project.name}</h3><button className="project-open" onClick={() => setSelectedProject(project)} aria-label={`Explore ${project.name}`}><ArrowUpRight size={19} /></button></div><p>{project.description}</p><div className="tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
          </article>)}</div>
          <div className="section-footnote"><span className="tiny-square" /> ALWAYS LEARNING. ALWAYS BUILDING. ALWAYS ITERATING.</div>
        </section>

        <section id="contact" className="contact-section container" aria-labelledby="contact-title"><div className="contact-card"><div className="contact-decoration" aria-hidden="true"><Blocks /></div><div><span className="eyebrow"><span>04</span> THE NEXT CHAPTER</span><h2 id="contact-title">Got an idea?<br />Let’s build <span className="accent-text">something great.</span></h2><p>Every great project starts with a conversation.<br />Let’s see what we can create together.</p>
          <div className="contact-actions">{profile.email ? <><a className="button button-primary" href={`mailto:${profile.email}`}><Mail size={17} /> Say hello <ArrowUpRight size={17} /></a><button className="button button-secondary" onClick={copyEmail}>{copyState === 'copied' ? <CheckCheck size={17} /> : <Copy size={17} />}{copyState === 'copied' ? 'Email copied' : 'Copy email'}</button></> : <div className="contact-placeholder"><Mail size={19} /><span>Contact details coming soon.<small>Add your email in <code>src/portfolio.ts</code> to connect.</small></span></div>}<span className="sr-only" role="status">{copyState === 'copied' ? 'Email copied to clipboard.' : copyState === 'error' ? `Could not copy. Email ${profile.email}` : ''}</span></div>
          {copyState === 'error' && <p className="copy-error">Copy unavailable. Select your email manually: {profile.email}</p>}
          </div><div className="contact-stamp" aria-hidden="true"><Send size={35} /><span>FROM IDEA<br />TO REALITY</span><i>✦</i></div></div></section>
      </main>

      <footer className="site-footer container"><div><a className="brand footer-brand" href="#home"><Blocks size={19} />{profile.firstName.toUpperCase()}<span className="brand-suffix">.DEV</span></a><p>Thoughtfully crafted, one block at a time.</p></div><div className="footer-right"><div className="social-links">{profile.github && <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile"><Github size={18} /></a>}{profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile"><Linkedin size={18} /></a>}<a href="#home" className="back-top">Back to top <ArrowUpRight size={14} /></a></div><p>© {new Date().getFullYear()} {profile.firstName}. Built in creative mode.</p></div></footer>
      <div className="bottom-note">ORIGINAL VOXEL ART. NOT AFFILIATED WITH MOJANG OR MICROSOFT.</div>
      <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} />
    </>
  )
}

export default App
