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
    id: 'giro',
    term: 'giro',
    definition:
      'A turn: the follower travels around the leader in a step-side-step-side pattern while the leader pivots in the middle.',
  },
  {
    id: 'ocho-cortado',
    term: 'ocho cortado',
    definition:
      'The "cut eight" — an ocho interrupted halfway and sent back where it came from, landing in the cross. The workhorse of crowded floors.',
    href: '/dancer/steps/crosses/',
  },
  {
    id: 'boleo',
    term: 'boleo',
    definition:
      'A pivot stopped and reversed, so the free leg whips out and back. Looks decorative; is actually just a change of direction.',
  },
  {
    id: 'gancho',
    term: 'gancho',
    definition:
      'A hook — one dancer\'s leg wraps briefly around the other\'s. Needs space and trust; not a crowded-floor movement.',
  },
  {
    id: 'sacada',
    term: 'sacada',
    definition:
      'A displacement: you step into the space your partner is leaving, and their leg appears to be pushed out of the way.',
  },
  {
    id: 'adorno',
    term: 'adorno',
    definition:
      'A decoration — a tap, a circle, a brush of the free foot. Taken in your own time, never at the cost of the beat.',
  },
  {
    id: 'line-of-dance',
    term: 'line of dance',
    definition:
      'The counter-clockwise flow of traffic around the floor. Everyone travels in it; nobody overtakes through the middle.',
    href: '/dancer/starter-kit/milonga-survival-guide/',
  },
  {
    id: 'ronda',
    term: 'ronda',
    definition:
      'The moving ring of couples travelling round the floor. You are not dancing in a room; you are dancing in the ronda.',
    href: '/dancer/starter-kit/milonga-survival-guide/',
  },
  {
    id: 'cabeceo',
    term: 'cabeceo',
    definition:
      'Inviting someone to dance with eye contact and a nod, from across the room, before either of you stands up.',
    href: '/dancer/starter-kit/milonga-survival-guide/',
  },
  {
    id: 'mirada',
    term: 'mirada',
    definition:
      'The look that makes a cabeceo possible — being visibly available and willing to catch someone\'s eye.',
    href: '/dancer/starter-kit/milonga-survival-guide/',
  },
  {
    id: 'tanda',
    term: 'tanda',
    definition:
      'A set of three or four songs by the same orchestra that you dance with the same partner.',
    href: '/dancer/starter-kit/milonga-survival-guide/',
  },
  {
    id: 'cortina',
    term: 'cortina',
    definition:
      'The "curtain" — a short piece of non-tango music between tandas. It means: thank your partner and clear the floor.',
    href: '/dancer/starter-kit/milonga-survival-guide/',
  },
  {
    id: 'milonga',
    term: 'milonga',
    definition:
      'A social tango dance — the event itself. Confusingly, it is also the name of a faster, bouncier rhythm played at that event.',
    href: '/dancer/starter-kit/milonga-survival-guide/',
  },
  {
    id: 'practica',
    term: 'practica',
    definition:
      'A practice session. You can stop, talk, repeat a movement, and ask your partner what they felt — none of which belongs at a milonga.',
    href: '/dancer/resources/how-to-practice/',
  },
  {
    id: 'vals',
    term: 'vals',
    definition:
      'Tango waltz — the same dance in three-time, played lighter and more continuously. No new steps required.',
    href: '/dancer/starter-kit/milonga-survival-guide/',
  },
  {
    id: 'codigos',
    term: 'códigos',
    definition:
      'The unwritten codes of the milonga — how you invite, where you walk, when you leave the floor. Etiquette, not snobbery.',
    href: '/dancer/starter-kit/milonga-survival-guide/',
  },
  {
    id: 'abrazo',
    term: 'abrazo',
    definition:
      'The embrace — the frame you share with your partner, and the channel every lead and every response travels through.',
    href: '/dancer/connection/embrace/',
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
