// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import App from './App'
import { profile } from '../portfolio'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('portfolio-theme', 'light')
  // jsdom does not implement native dialog focus/inert behavior.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) { this.setAttribute('open', '') },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) { this.removeAttribute('open') },
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  profile.email = ''
  profile.github = ''
  profile.linkedin = ''
})

describe('portfolio interactions', () => {
  it('starts in night mode when no saved preference exists', () => {
    localStorage.clear()
    render(<App />)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to day mode' })).toBeInTheDocument()
  })

  it('lets visitors inspect skill blocks using the keyboard', async () => {
    const user = userEvent.setup()
    render(<App />)
    const inventory = screen.getByRole('group', { name: 'Skills inventory' })
    expect(within(inventory).getAllByRole('button')).toHaveLength(16)
    const docker = within(inventory).getByRole('button', { name: 'Docker' })
    docker.focus()
    await user.keyboard('{Enter}')
    expect(docker).toHaveAttribute('aria-pressed', 'true')
    expect(within(inventory).getByRole('button', { name: 'React' })).toHaveAttribute('aria-pressed', 'false')
    const details = document.getElementById('inventory-details')!
    expect(within(details).getByRole('heading')).toHaveTextContent('Docker')
    expect(details).toHaveTextContent('version control, repeatable builds')
  })

  it('provides hotbar links and a poseable character without WebGL', () => {
    render(<App />)
    for (const name of ['About', 'Skills', 'Projects', 'Contact']) {
      expect(screen.getByRole('link', { name: `Go to ${name}` })).toHaveAttribute('href', `#${name.toLowerCase()}`)
      expect(document.getElementById(name.toLowerCase())).toBeInTheDocument()
    }
    expect(screen.getByRole('group', { name: 'Poseable voxel character' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Head angle' })).toBeInTheDocument()
    expect(screen.queryByText('Illustrated view · 3D unavailable')).not.toBeInTheDocument()
  })

  it('shows the portfolio and clearly identified sample content', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AdarshBiswas')
    expect(screen.getByText('SAMPLE BUILDS · REPLACE WITH YOUR WORK')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Explore / })).toHaveLength(3)
    expect(screen.queryByText('Get started')).not.toBeInTheDocument()
  })

  it('filters projects and restores all builds', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (const [category, project] of [['Frontend', 'Block UI'], ['Backend', 'Pulse API'], ['Full stack', 'DevQuest']]) {
      await user.click(within(screen.getByRole('group', { name: 'Filter projects' })).getByRole('button', { name: category }))
      expect(screen.getAllByRole('button', { name: /^Explore / })).toHaveLength(1)
      expect(screen.getByRole('button', { name: `Explore ${project}` })).toBeInTheDocument()
      expect(screen.getByText('1 project shown')).toBeInTheDocument()
    }
    await user.click(screen.getByRole('button', { name: /All builds/ }))
    expect(screen.getAllByRole('button', { name: /^Explore / })).toHaveLength(3)
  })

  it('opens project details, locks scrolling, and closes cleanly', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Explore DevQuest' }))
    const dialog = screen.getByRole('dialog', { name: 'DevQuest.' })
    expect(within(dialog).getByText('Proposed build plan')).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
    await user.click(screen.getByRole('button', { name: 'Close project' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('handles native Escape cancellation and backdrop clicks', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Explore Block UI' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false, cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Explore Pulse API' }))
    fireEvent.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('persists and restores the day/night preference', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Switch to night mode' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('portfolio-theme')).toBe('dark')
    first.unmount()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Switch to day mode' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('still switches themes when browser storage is blocked', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Switch to day mode' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('poses the hero and resets it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Wave hello' }))
    expect(screen.getByRole('slider', { name: 'Left arm angle' })).toHaveAttribute('aria-valuenow', '125')
    await user.click(screen.getByRole('button', { name: 'Reset pose' }))
    expect(screen.getByRole('slider', { name: 'Left arm angle' })).toHaveAttribute('aria-valuenow', '8')
  })

  it('closes the mobile navigation after selection and Escape', async () => {
    const user = userEvent.setup()
    render(<App />)
    const menu = screen.getByRole('button', { name: 'Open menu' })
    await user.click(menu)
    expect(menu).toHaveAttribute('aria-expanded', 'true')
    await user.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Projects' }))
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    await user.click(menu)
    fireEvent.keyDown(screen.getByRole('navigation'), { key: 'Escape' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(menu).toHaveFocus()
  })

  it('does not create fake email or social links', () => {
    render(<App />)
    expect(screen.getByText('Contact details coming soon.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy email' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'GitHub profile' })).not.toBeInTheDocument()
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull()
  })

  it('renders one shared footer with branding, copyright and keyboard-accessible return links', () => {
    render(<App />)
    const footer = screen.getByRole('contentinfo')
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
    expect(within(footer).getByText('Thoughtfully crafted, one block at a time.')).toBeInTheDocument()
    expect(footer).toHaveTextContent(`© ${new Date().getFullYear()} ${profile.firstName}. Built in creative mode.`)
    const back = within(footer).getByRole('link', { name: /Back to top/ })
    expect(back).toHaveAttribute('href', '#home')
    back.focus()
    expect(back).toHaveFocus()
    expect(within(footer).getByRole('link', { name: /ADARSH/ })).toHaveAttribute('href', '#home')
    expect(screen.getByText('ORIGINAL VOXEL ART. NOT AFFILIATED WITH MOJANG OR MICROSOFT.')).toBeInTheDocument()
  })

  it('enables contact links and copies a configured email', async () => {
    const user = userEvent.setup()
    profile.email = 'test@example.com'
    profile.github = 'https://github.com/example'
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    render(<App />)
    expect(screen.getByRole('link', { name: /Say hello/ })).toHaveAttribute('href', 'mailto:test@example.com')
    expect(screen.getByRole('link', { name: 'GitHub profile' })).toHaveAttribute('rel', 'noopener noreferrer')
    await user.click(screen.getByRole('button', { name: 'Copy email' }))
    expect(writeText).toHaveBeenCalledWith('test@example.com')
    expect(within(document.getElementById('contact')!).getByRole('status')).toHaveTextContent('Email copied to clipboard.')
  })

  it('shows a useful fallback when the clipboard is denied', async () => {
    const user = userEvent.setup()
    profile.email = 'test@example.com'
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'))
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Copy email' }))
    expect(screen.getByText('Copy unavailable. Select your email manually: test@example.com')).toBeInTheDocument()
  })
})