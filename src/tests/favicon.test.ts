// @vitest-environment jsdom
import { expect, it } from 'vitest'
import page from '../../index.html?raw'
import icon from '../../public/pixel-builder.svg?raw'

it('links the page to a self-contained pixel SVG favicon', () => {
  const html = new DOMParser().parseFromString(page, 'text/html')
  const link = html.querySelector('link[rel="icon"]')
  expect(link?.getAttribute('href')).toBe('/pixel-builder.svg')
  expect(link?.getAttribute('type')).toBe('image/svg+xml')
  const svg = new DOMParser().parseFromString(icon, 'image/svg+xml')
  expect(svg.querySelector('parsererror')).toBeNull()
  expect(svg.documentElement.getAttribute('viewBox')).toBe('0 0 32 32')
  expect(svg.documentElement.getAttribute('shape-rendering')).toBe('crispEdges')
  expect(svg.querySelectorAll('image, script, foreignObject')).toHaveLength(0)
})