// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { SkillsInventory } from './PortfolioBlocks'
import { toolkit } from '../../portfolio'
import { SkillIcon } from './SkillIcon'

afterEach(cleanup)

describe('compact skills inventory', () => {
  it('keeps all desktop skills and assigns unique pixel art to each', () => {
    render(<SkillsInventory />)
    const slots = within(screen.getByRole('group', { name: 'Skills inventory' })).getAllByRole('button')
    const skills = toolkit.flatMap(group => group.skills)
    expect(slots).toHaveLength(skills.length)
    const artwork = slots.map((slot, index) => {
      const icon = slot.querySelector('svg')!
      expect(icon).toHaveAttribute('data-skill-icon', skills[index])
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      return icon.innerHTML
    })
    expect(new Set(artwork).size).toBe(skills.length)
  })

  it('selects each compact category and marks only its four items for small screens', async () => {
    const user = userEvent.setup()
    render(<SkillsInventory />)
    const categories = screen.getByRole('group', { name: 'Skill categories' })
    for (const group of toolkit) {
      const button = within(categories).getByRole('button', { name: group.label })
      button.focus()
      await user.keyboard('{Enter}')
      expect(button).toHaveAttribute('aria-pressed', 'true')
      const current = document.querySelectorAll('.inventory-slot-button[data-current-category="true"]')
      expect([...current].map(slot => slot.textContent?.replace(/^\d+/, ''))).toEqual(group.skills)
      expect(screen.getByRole('status')).toHaveTextContent(group.skills[0])
    }
  })

  it('provides fallback pixel art for newly configured skills', () => {
    const { container } = render(<SkillIcon name="A new skill" />)
    expect(container.querySelector('svg path')).not.toBeNull()
  })
})