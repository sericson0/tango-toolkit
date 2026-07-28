/**
 * Shared vocabulary for the dancer section.
 *
 * Terms defined here can be dropped inline in any .mdx page:
 *
 *   The follower arrives in the <Term id="cruzada" />.
 *   ...or with your own wording: <Term id="cruzada">crossed position</Term>
 *
 * Give a term an `href` and the tooltip also links through to the page that
 * teaches it, which keeps the sections stitched together as they grow.
 */
export interface GlossaryTerm {
  id: string;
  /** How the term renders by default. */
  term: string;
  definition: string;
  /** Where to read more, if there is a page for it. */
  href?: string;
}

export const dancerGlossary: GlossaryTerm[] = [
  {
    id: 'cruzada',
    term: 'cruzada',
    definition:
      'The cross — the follower\'s free foot crosses in front of (or behind) the standing leg and takes the weight.',
    href: '/dancer/steps/crosses/',
  },
  {
    id: 'parallel-system',
    term: 'parallel system',
    definition:
      'Leader and follower are on opposite feet: when the leader steps with the left, the follower steps with the right.',
    href: '/dancer/steps/walk/',
  },
  {
    id: 'cross-system',
    term: 'cross system',
    definition:
      'Leader and follower are on the same foot. Usually entered by the leader changing weight without moving the follower.',
    href: '/dancer/steps/walk/',
  },
  {
    id: 'ocho',
    term: 'ocho',
    definition:
      'A figure-eight: a step followed by a pivot, forwards or backwards, tracing an eight on the floor.',
    href: '/dancer/steps/ochos/',
  },
  {
    id: 'line-of-dance',
    term: 'line of dance',
    definition:
      'The counter-clockwise flow of traffic around the floor. Everyone travels in it; nobody overtakes through the middle.',
  },
  {
    id: 'cabeceo',
    term: 'cabeceo',
    definition:
      'Inviting someone to dance with eye contact and a nod, from across the room, before either of you stands up.',
    href: '/dancer/starter-kit/at-the-milonga/',
  },
  {
    id: 'tanda',
    term: 'tanda',
    definition:
      'A set of three or four songs by the same orchestra that you dance with the same partner.',
    href: '/dancer/starter-kit/at-the-milonga/',
  },
  {
    id: 'cortina',
    term: 'cortina',
    definition:
      'The "curtain" — a short piece of non-tango music between tandas. It means: thank your partner and clear the floor.',
    href: '/dancer/starter-kit/at-the-milonga/',
  },
  {
    id: 'axis',
    term: 'axis',
    definition:
      'The vertical line you balance on. On your own axis you could stand there all day without your partner.',
  },
  {
    id: 'disassociation',
    term: 'disassociation',
    definition:
      'Turning the chest away from the hips while keeping both level — the twist that makes ochos and turns possible.',
    href: '/dancer/steps/pivots/',
  },
];

export function getTerm(id: string): GlossaryTerm | undefined {
  return dancerGlossary.find((t) => t.id === id);
}
