# Adarsh's Creative-Mode Portfolio

A Minecraft-inspired software engineer portfolio built with React, TypeScript, and Vite. A dark-first adventure layout pairs pixel typography, an original poseable voxel character, and inventory-style interactions with professional content sections.

## Features

- Original shaded SVG voxel character with independently poseable head, arms, and legs; the torso tilts the whole rig. Works without WebGL, GPU initialization, or downloaded skins.
- Drag joints with mouse, pen, or touch; use keyboard controls, an angle slider, or increment/decrement buttons as alternatives. Includes Wave hello, Adventure pose, and Reset pose presets.
- No idle character animation or render loop. Poses change directly, including under reduced motion. Native scrolling remains available around the character; touch drags beginning on a body part deliberately adjust that joint.
- Persistent day/night themes with short surface/text color transitions; night is the default, but saved preferences are preserved. Works even when local storage is unavailable.
- Hero sky cross-fades to soft daylight colors in light mode, with matching text and pose controls. Above 1100px, the character shares the introduction's backdrop without a separate panel border, fill, shadow, or dividers; smaller screens retain themed framing.
- Lenis smooth wheel scrolling and eased section navigation with responsive sticky-header offsets, URL hashes, and keyboard focus transfer. Touch scrolling stays native, and reduced-motion preferences disable scroll animation, including when changed while the page is open.
- Section links use a 1.25-second ease-in/out and transfer focus after arrival, not before the animation. A single navbar underline slides between measured link positions while scrolling, including the final short section; font loading, menu changes, and resizing update its position. Reduced motion disables both animations. If navigation is instant, check the browser/OS reduced-motion preference (Windows: Accessibility → Visual effects → Animation effects).
- Original pixel sword cursor on fine-pointer devices: turquoise normally, gold over controls, and a pressed pose on click. Uses native CSS cursors rather than a lagging pointer overlay; touch and forced-color environments retain platform behavior.
- Filterable project cards with native, keyboard-accessible detail dialogs.
- Original tool-specific pixel icons for all 16 example skills. Desktop retains the full inventory; at 1100px and below, four category buttons show one compact group at a time. Tablet uses a four-item row and mobile uses a two-by-two grid, with selected-skill details below.
- Responsive navigation and section hotbar, player profile, and contact section.
- Shared footer on desktop, tablet, and mobile, with matching two-column branding/actions, readable compact-screen copy, wrapping social links, and 44px touch targets. Social links remain hidden until configured.
- Original 32px pixel-builder SVG favicon in `public/pixel-builder.svg`, linked from `index.html` without changing the page title or metadata.
- Optional email, clipboard, GitHub, and LinkedIn actions.
- Self-hosted Space Grotesk and VT323 fonts; no remote font or image requests.
- Forty-two tests covering interactions, failure paths, shared footer content, and favicon wiring.

### Character controls

- Drag a body part around its highlighted joint to adjust its angle.
- Tab to a joint and use arrow keys for 5° steps, or Shift + arrows for 15° steps. Home/End select that joint's minimum/maximum angle.
- The selected part's slider and −/+ buttons provide alternatives to dragging.
- The torso tilts the whole character; other joint angles remain relative to the torso. Limits keep poses bounded. Reset pose restores every joint.
- Day/night changes retain the current pose. Reloading starts from the neutral pose.

## Personalize before publishing

Edit `src/portfolio.ts`:

1. Verify your name and replace the starter biography, headline, and tagline. The name was inferred from the workspace, not supplied as confirmed personal information.
2. Replace **DevQuest**, **Block UI**, and **Pulse API** with real projects. Their descriptions and build plans are explicitly labeled sample concepts, not completed work.
3. Replace the example toolkit, compact category labels, and group descriptions with skills you actually use. Add a matching original pixel icon in `src/components/portfolio/SkillIcon.tsx` for new skill names; unknown names get generic fallback art.
4. Add your email. Email and copy buttons remain hidden until it is configured. Clipboard access requires HTTPS or localhost; denied access shows a manual-copy fallback.
5. Optionally add complete HTTPS GitHub and LinkedIn profile URLs. Empty values hide the links.
6. Update the page title and description in `index.html`. Remove sample notices in `src/app/App.tsx` only after replacing all sample content. Adapt the detail dialog's proposed-build language for completed projects.

No employment history, credentials, project metrics, or contact details have been invented. The block avatar is decorative original artwork, not a real portrait. The contact section uses email links; it does not send messages through a backend.

## Develop and validate

Use a current Node.js LTS release (Node 22.13+ or Node 24 recommended). Dependencies are locked in `package-lock.json`.

| Action | Command, from this folder |
| --- | --- |
| Install locked dependencies | `npm ci` |
| Start development server | `npm run dev` |
| Type-check and build | `npm run build` |
| Lint | `npm run lint` |
| Run interaction tests | `npm test` |
| Preview the production build | `npm run preview` |

The production output is in `dist`. Deploy that folder to a static host. For hosting under a subdirectory, configure Vite's `base` before building.

### In VS Code

- Run **Terminal → Run Task → Portfolio: build** for the configured build task.
- To launch, use **Terminal → Run Task → npm: dev**, then open the local address printed by Vite.
- To debug after starting the server, use **Debug: Open Link** from the Command Palette and enter that address. Set breakpoints in the TypeScript source.
- The browser has not been launched automatically; preview/debug launch awaits confirmation.

## Validation scope

Production build and Oxlint pass. All 42 Vitest/Testing Library tests pass. Tests cover filtering, dialog state/cancellation, theme persistence and blocked storage, inventory selection/categories and unique icon art, section links, contact/clipboard behavior, and Lenis navigation/lifecycle. Navigation tests cover completion-time focus, obsolete request cancellation, section tracking in both directions, the final short section, marker geometry, resizing and cleanup. Character tests cover keyboard limits, angle controls, mouse/pen/touch drag math, pointer cancellation/capture loss, secondary pointer rejection, presets/reset, and pose retention across themes. The retained world-wrapper tests still cover the older optional landscape. Footer tests verify the single shared landmark, content and return links; favicon tests verify its HTML link and valid, self-contained SVG.

Check footer wrapping at 320px, tablet widths, and with social links configured in a real browser. Tests do not validate responsive CSS or browser-tab favicon rendering. Browsers cache favicons; a reload or reopening the tab may be needed to see the new icon.

The jsdom environment shims native dialog methods and character SVG matrices/pointer capture, and mocks Lenis and the optional 3D renderer. These tests do **not** verify actual responsive CSS layout, SVG projection/hit testing, native pointer capture, touch scrolling, or browser focus trapping/restoration. Before publishing, check phone/tablet/desktop widths (including 600px and 1100px boundaries), category switching, all character joints, keyboard focus, dragging versus scrolling around the character, rapid theme changes, modal scrolling, sword cursors, and reduced-motion settings in a real browser.

The hero no longer imports `WorldExplorer`, so Three.js and the old landscape are not emitted in the current production bundle. The build no longer reports the earlier large-3D-chunk advisory. The old world components and their tests remain available in source for optional reuse; if restored, retain the lazy scene boundary, SVG fallback, capped pixel density and visibility-aware rendering. Lenis remains the sole scroll animation engine.

## Source organization

```text
src/
	app/                    App.tsx and its interaction tests
	assets/                 Bundled SVG assets, including sword cursors
	components/
		character/            CharacterStudio, local styles and pose tests
		portfolio/            PortfolioBlocks, SkillIcon and inventory tests
		world/                Optional world scene, SVG fallback, styles and tests
	hooks/                  Scroll/navigation hooks and their tests
	styles/                 index.css, App.css and Adventure.css
	tests/                  Cross-cutting checks such as favicon wiring
	main.tsx                React entry point
	portfolio.ts            Single editable source for profile/projects/skills
public/                   Static files served directly, including pixel-builder.svg
```

Keep component-specific styles and tests beside their component, hook tests beside their hook, and page-wide CSS in `src/styles`. Shared asset/page checks belong in `src/tests`. The optional world stays isolated in `src/components/world` and is not imported by the active hero. No barrel exports are needed; direct imports keep that lazy boundary explicit.

`src/main.tsx` loads base styles before the app; `src/app/App.tsx` loads `App.css` before `Adventure.css` to preserve the current cascade. CSS cursor paths resolve to `src/assets`. Vite and TypeScript already discover nested source files, and Vitest discovers colocated `*.test.ts(x)` files without additional configuration.

## Assets and attribution

The character, skill sprites, island, avatar, and project illustrations are original code-generated visuals. No Minecraft textures, logos, sounds, or other game assets are used. This project is not affiliated with Mojang or Microsoft. Skill sprites are stylized technology/symbol interpretations, not official asset downloads. General interface icons are from Lucide; the bundled Space Grotesk and VT323 fonts are licensed under OFL-1.1. Preserve dependency license notices when distributing.
