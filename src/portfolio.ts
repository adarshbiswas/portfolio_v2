// Starter content: replace with verified personal details before publishing.
// Name inferred from the workspace. Projects and skills are examples, not claims.
export const profile = {
  name: 'Adarsh Biswas', firstName: 'Adarsh', role: 'Software Engineer',
  headline: 'Building digital worlds, one block at a time.',
  tagline: 'Thoughtful interfaces. Solid foundations. A little creative mode.',
  intro: 'I turn complex problems into thoughtful digital experiences. A little curiosity, a lot of code, and an appreciation for the details.',
  about: 'I like thinking of software as a world we build together. Every component has a purpose, every interaction tells a story, and the best solutions start with a little exploration.',
  email: 'adarshbiswas.dev@gmail.com', // Your real email enables the email and copy buttons.
  github: 'https://github.com/adarshbiswas', // Optional full HTTPS profile URL.
  linkedin: 'https://linkedin.com/in/adarshbiswas', // Optional full HTTPS profile URL.
}
export const categories = ['All builds', 'Full stack', 'Frontend', 'Backend'] as const
export type Category = (typeof categories)[number]
export type Project = {
  id: string; name: string; category: Exclude<Category, 'All builds'>
  description: string; tags: string[]; color: 'green' | 'purple' | 'orange'
  idea: string; approach: string[]
}
export const projects: Project[] = [
  {
    id: '01', name: 'Animacho', category: 'Frontend', color: 'green',
    description: 'A modern Anime library consisting of all the movies and TV shows, Used JikanAPI to fetch all the data using React js.',
    tags: ['React', 'Node.js', 'JikanAPI', 'Tailwind'],
    idea: 'An example concept for helping developers organize learning goals and track progress without losing sight of the bigger picture.',
    approach: ['Design a keyboard-friendly task board with accessible alternatives to dragging.', 'Model projects, milestones, and activity with a relational database.', 'Add authentication, input validation, and integration tests.'],
  },
  {
    id: '02', name: 'FeastFleet', category: 'Full stack', color: 'purple',
    description: 'A fully functional Food delivering website to order delicious meals. From surfing over the food menu to placing order via secure stripe payment.',
    tags: ['TypeScript', 'React', 'MongoDB', 'Stripe', 'Tailwind'],
    idea: 'An example concept for an accessible, composable design system that makes it easier to build interfaces with character.',
    approach: ['Define semantic design tokens for light and dark themes.', 'Build components with accessible focus and keyboard behavior.', 'Document component variants and test responsive layouts.'],
  },
  {
    id: '03', name: 'Pulse API', category: 'Backend', color: 'orange',
    description: 'A considered backend for collecting events and making useful data accessible.',
    tags: ['Node.js', 'REST API', 'Redis'],
    idea: 'An example concept for a well-documented event API with clear contracts, predictable errors, and useful observability.',
    approach: ['Create versioned endpoints with validation and rate limits.', 'Process incoming events with idempotent background jobs.', 'Add structured logging, health checks, and failure-path tests.'],
  },
]
export const toolkit = [
  { label: 'Frontend', title: 'Interface crafting', subtitle: 'Experiences that feel right.', description: 'The visible layer: components, type-safe interfaces, and layouts that adapt to the person using them.', skills: ['React', 'TypeScript', 'HTML & CSS', 'Responsive design'] },
  { label: 'Backend', title: 'Behind the blocks', subtitle: 'The logic beneath the surface.', description: 'The foundations: clear API contracts, application logic, and well-structured data.', skills: ['Node.js', 'REST APIs', 'PostgreSQL', 'Redis'] },
  { label: 'Tools', title: 'Tools of the trade', subtitle: 'A reliable development loop.', description: 'The workbench: version control, repeatable builds, containers, and tests that make changes safer.', skills: ['Git', 'Vite', 'Docker', 'Testing'] },
  { label: 'Principles', title: 'Built with intention', subtitle: 'Good software goes deeper.', description: 'The principles: inclusive experiences, readable code, responsive performance, and working well together.', skills: ['Accessibility', 'Clean code', 'Performance', 'Collaboration'] },
]