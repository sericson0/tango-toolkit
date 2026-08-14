/**
 * The dancer content kit.
 *
 * Every .mdx page under src/content/dancer/ pulls what it needs from here in
 * one line:
 *
 *   import { Callout, Accordion, Exercise, StepDiagram } from '@/components/dancer';
 *
 * Add a component to this folder, export it here, and it is available to
 * every page.
 */
export { default as Accordion } from './Accordion.astro';
export { default as ActivityGrid } from './ActivityGrid.astro';
export { default as Callout } from './Callout.astro';
export { default as CrossQuestionHint } from './CrossQuestionHint.astro';
export { default as Exercise } from './Exercise.astro';
export { default as Figure } from './Figure.astro';
export { default as KeyPoints } from './KeyPoints.astro';
export { default as LinkCard } from './LinkCard.astro';
export { default as StepDiagram } from './StepDiagram.astro';
export { default as Term } from './Term.astro';
export { default as ToolIcon } from './ToolIcon.astro';
export { default as Video } from '../VideoEmbed.astro';
export { default as WalkToCrossPreview } from './WalkToCrossPreview.astro';
