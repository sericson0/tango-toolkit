/**
 * The drill library.
 *
 * Every drill on /dancer/drills/ lives here. Add an entry to `dancerDrills`
 * and it appears in the library, in its pillar, with the right filter chips —
 * nothing else to touch.
 *
 * Drills are sorted by pillar (in `drillPillars` order), then by `order`, then
 * by title. Give related drills the same `order` and they stay grouped.
 *
 * Template:
 * {
 *   id: 'unique-slug',              // used as the checklist storage key
 *   title: 'One-foot balance',
 *   goal: 'One line: what this drill is actually for.',
 *   pillar: 'body',                 // body | connection | music | floor
 *   mode: 'solo',                   // solo | partner | either
 *   level: 'new',                   // new | developing | all
 *   minutes: 5,
 *   music: false,                   // true if it needs music playing
 *   steps: ['Do this.', 'Then this.'],
 *   watchFor: 'The mistake this drill usually surfaces.',
 *   progression: 'How to make it harder once it is easy.',
 *   related: { label: 'The Walk', href: '/dancer/steps/walk/' },
 *   order: 10,
 * },
 */

export type DrillPillarId = 'body' | 'connection' | 'music' | 'floor';
export type DrillMode = 'solo' | 'partner' | 'either';
export type DrillLevel = 'new' | 'developing' | 'all';

export interface DrillPillar {
  id: DrillPillarId;
  label: string;
  /** Shown under the pillar heading in the library. */
  blurb: string;
  /** Icon name from ToolIcon. */
  tool: string;
}

/**
 * The four pillars from the starter kit, in the same order.
 * See /dancer/starter-kit/where-to-start/.
 */
export const drillPillars: DrillPillar[] = [
  {
    id: 'body',
    label: 'Your own body',
    blurb: 'Balance, posture, and moving your own weight with control. Nearly all of this can be done alone.',
    tool: 'ruler',
  },
  {
    id: 'connection',
    label: 'Connection',
    blurb: 'The embrace, and the two-way conversation running through it. Bring a partner and a practica.',
    tool: 'gears',
  },
  {
    id: 'music',
    label: 'The music',
    blurb: 'Hearing the beat, the phrase, and the orchestra — then putting your feet where you hear them.',
    tool: 'sliders',
  },
  {
    id: 'floor',
    label: 'The floor',
    blurb: 'Navigation and social craft. Practised at a milonga, mostly by dancing smaller than you want to.',
    tool: 'compass',
  },
];

export const DRILL_MODE_LABELS: Record<DrillMode, string> = {
  solo: 'On your own',
  partner: 'With a partner',
  either: 'Either',
};

export const DRILL_LEVEL_LABELS: Record<DrillLevel, string> = {
  new: 'New dancers',
  developing: 'Once you have the basics',
  all: 'Any level',
};

export interface Drill {
  id: string;
  title: string;
  /** One line — what the drill is for. Shown on the collapsed card. */
  goal: string;
  pillar: DrillPillarId;
  mode: DrillMode;
  level: DrillLevel;
  /** Rough time to spend on one go. Used for the "quick drills" filter. */
  minutes: number;
  /** Needs music playing. */
  music?: boolean;
  /** What to actually do, in order. */
  steps: string[];
  /** The mistake this drill tends to expose. */
  watchFor?: string;
  /** How to make it harder once it stops being interesting. */
  progression?: string;
  /** Where to read the technique behind it. */
  related?: { label: string; href: string };
  /** Sort order within the pillar. Lower comes first. */
  order?: number;
}

export const dancerDrills: Drill[] = [
  // ===== Your own body =====================================================
  {
    id: 'one-foot-balance',
    title: 'Stand on one foot',
    goal: 'The single most useful minute you can spend on tango, and you can do it while the kettle boils.',
    pillar: 'body',
    mode: 'solo',
    level: 'new',
    minutes: 3,
    order: 10,
    steps: [
      'Stand tall, feet together, weight even.',
      'Move all your weight onto one foot without leaning. Let the other foot rest lightly on the floor, taking nothing.',
      'Lift the free foot a centimetre off the floor. Hold for a minute.',
      'Change sides. Repeat twice each.',
    ],
    watchFor:
      'Sticking your hip out to the standing side. The transfer should happen underneath you, not by tipping.',
    progression: 'Close your eyes. Then slowly extend the free leg forward, side, and back while balancing.',
    related: { label: 'Posture & Axis', href: '/dancer/steps/posture/' },
  },
  {
    id: 'slow-weight-changes',
    title: 'Slow weight changes',
    goal: 'Teaches your body what a complete transfer feels like — the thing every partner can feel you doing or not doing.',
    pillar: 'body',
    mode: 'solo',
    level: 'new',
    minutes: 5,
    order: 20,
    steps: [
      'Stand with feet hip-width apart, weight even.',
      'Over a slow count of four, move all your weight to the right foot.',
      'Pause for four counts. The left foot should be able to leave the floor without anything else moving.',
      'Move it back over four counts. Repeat for a whole song.',
    ],
    watchFor: 'Arriving early and then adjusting. The transfer should be continuous, not a step followed by a settle.',
    progression: 'Do it to music, arriving exactly on the beat. Then halve the count.',
    related: { label: 'The Walk', href: '/dancer/steps/walk/' },
  },
  {
    id: 'wall-posture',
    title: 'The wall check',
    goal: 'Finds a tango posture without a mirror, and shows you how far off your default standing position is.',
    pillar: 'body',
    mode: 'solo',
    level: 'new',
    minutes: 4,
    order: 30,
    steps: [
      'Stand with your back to a wall, heels a few centimetres away from it.',
      'Let your shoulder blades and the back of your head touch the wall. Do not force the small of your back flat.',
      'Grow upwards through the crown of your head, and let the shoulders drop.',
      'Step away keeping that shape, and walk four steps. Return to the wall and check what changed.',
    ],
    watchFor: 'Lifting your chin to get your head back. The lift comes from the back of the neck, not the jaw.',
    related: { label: 'Posture & Axis', href: '/dancer/steps/posture/' },
  },
  {
    id: 'slow-walk-length',
    title: 'The slowest walk in the room',
    goal: 'The whole dance in one exercise. If you only ever do one drill, make it this one.',
    pillar: 'body',
    mode: 'solo',
    level: 'new',
    minutes: 10,
    music: true,
    order: 40,
    steps: [
      'Put on a walking tango — D\'Arienzo or D\'Agostino work well.',
      'Walk the length of the room forwards, one step per beat, arriving fully on each beat.',
      'Walk back backwards, same speed, same completeness.',
      'Now halve the speed: one step every two beats. Stay standing the whole way.',
    ],
    watchFor:
      'Reaching with the foot and then falling onto it. The chest travels first and the foot arrives underneath you.',
    progression: 'One step every four beats. At this speed there is nowhere to hide a balance problem.',
    related: { label: 'The Walk', href: '/dancer/steps/walk/' },
  },
  {
    id: 'collection',
    title: 'Collect every time',
    goal: 'Builds the habit of passing through feet-together, which is what makes a walk look calm and a pivot possible.',
    pillar: 'body',
    mode: 'solo',
    level: 'new',
    minutes: 5,
    order: 50,
    steps: [
      'Walk slowly forwards, but stop each step at the moment your feet are together, ankles touching.',
      'Hold there for a beat, balanced on the standing foot.',
      'Continue the step. Repeat the length of the room.',
      'Do the same walking backwards.',
    ],
    watchFor: 'Swinging the free leg past your standing foot without it ever arriving. Collection is a place, not a blur.',
    related: { label: 'The Walk', href: '/dancer/steps/walk/' },
  },
  {
    id: 'dissociation-hands-hips',
    title: 'Chest against hips',
    goal: 'Isolates the twist that powers every pivot, ocho, and turn you will ever do.',
    pillar: 'body',
    mode: 'solo',
    level: 'developing',
    minutes: 6,
    order: 60,
    steps: [
      'Stand with your weight on one foot, hands on your hip bones.',
      'Keep your hips absolutely still under your hands and turn your chest to the right as far as it will go without them moving.',
      'Return to centre, then turn left. Both shoulders stay level — no dipping.',
      'Repeat ten times each side, slowly.',
    ],
    watchFor: 'The hips going along for the ride. If your hands move, you are turning, not disassociating.',
    progression: 'Turn the chest first, then let it pull the hips round and the standing foot pivot underneath you.',
    related: { label: 'Pivots & Disassociation', href: '/dancer/steps/pivots/' },
  },
  {
    id: 'solo-pivots',
    title: 'Pivot on the spot',
    goal: 'Gets pivots out of the "it stalls halfway" phase without a partner to blame.',
    pillar: 'body',
    mode: 'solo',
    level: 'developing',
    minutes: 8,
    order: 70,
    steps: [
      'Balance on one foot, free foot collected.',
      'Wind the chest up away from the hips, then release and let the standing foot pivot 90 degrees underneath you.',
      'Arrive, rebalance, and repeat until you have made a full turn.',
      'Change feet and go the other way.',
    ],
    watchFor: 'Hopping. If the foot leaves the floor to turn, you are jumping the pivot rather than pivoting.',
    progression: 'Pivot 180 degrees in one go. Then do it with the free leg extended.',
    related: { label: 'Pivots & Disassociation', href: '/dancer/steps/pivots/' },
  },
  {
    id: 'solo-ochos',
    title: 'Ochos on your own',
    goal: 'Step, pivot, step — separated out so you can feel which half is failing.',
    pillar: 'body',
    mode: 'solo',
    level: 'developing',
    minutes: 8,
    music: true,
    order: 80,
    steps: [
      'Step to the side onto your right foot and pivot to face the new direction. Collect.',
      'Step to the side onto your left foot, pivot, collect. That is a back ocho.',
      'Do eight, slowly, keeping the chest facing an imaginary partner throughout.',
      'Repeat with forward ochos.',
    ],
    watchFor:
      'Doing the step and the pivot as one merged action. Separate them completely at first — step, stop, pivot, stop.',
    related: { label: 'Ochos', href: '/dancer/steps/ochos/' },
  },
  {
    id: 'free-leg-control',
    title: 'The quiet free leg',
    goal: 'Stops the free leg from announcing every step before it happens, and is the basis of every adorno.',
    pillar: 'body',
    mode: 'solo',
    level: 'developing',
    minutes: 5,
    order: 90,
    steps: [
      'Stand on one foot, free foot collected, toe brushing the floor.',
      'Slide the free foot forward until the leg is extended, keeping the toe in contact with the floor the whole way.',
      'Bring it back through collection, and out to the side. Then behind.',
      'Ten of each, without the standing leg wobbling.',
    ],
    watchFor: 'Lifting the free foot off the floor to move it. Keep it heavy and in contact.',
    progression: 'Do it with your eyes closed, then while slowly rising onto the ball of the standing foot.',
  },

  // ===== Connection ========================================================
  {
    id: 'embrace-audit',
    title: 'The embrace audit',
    goal: 'Five minutes that will do more for how people feel about dancing with you than a term of figures.',
    pillar: 'connection',
    mode: 'partner',
    level: 'new',
    minutes: 6,
    order: 10,
    steps: [
      'Take an embrace and stand still in it for a full minute. Do not dance.',
      'Each of you says one thing you can feel: pressure, height, tension, where the weight is.',
      'Adjust one thing. Stand for another minute.',
      'Now walk four steps and stop. Has the embrace survived, or did it change shape the moment you moved?',
    ],
    watchFor: 'Gripping. Arms hold a shape; they do not clamp. If your partner cannot breathe easily, it is too much.',
    related: { label: 'The Embrace', href: '/dancer/connection/embrace/' },
  },
  {
    id: 'mirror-no-embrace',
    title: 'Mirror stepping, no embrace',
    goal: 'Strips leading back to what it actually is — a shared intention — by removing the arms entirely.',
    pillar: 'connection',
    mode: 'partner',
    level: 'new',
    minutes: 8,
    order: 20,
    steps: [
      'Stand facing your partner, a hand-width apart, hands resting on each other\'s shoulders.',
      'Leader moves the chest slowly in one direction. Follower moves to stay the same distance away.',
      'Forwards, backwards, side to side. No steps announced, no counting.',
      'Swap roles and repeat.',
    ],
    watchFor:
      'The leader using their arms to move the follower. Take the arms out of it — if it only works with a push, it is not a lead yet.',
  },
  {
    id: 'lead-the-pause',
    title: 'Lead a pause',
    goal: 'Pauses are the hardest thing to lead clearly and the fastest way to make a dance feel intentional.',
    pillar: 'connection',
    mode: 'partner',
    level: 'new',
    minutes: 8,
    music: true,
    order: 30,
    steps: [
      'Walk together on the beat.',
      'At some point, stop — and stay in the embrace, upright, both on your own axes.',
      'Hold for four beats. Neither of you shifts, fidgets, or asks a question.',
      'Walk on. Do this at least six times in one song.',
    ],
    watchFor:
      'The follower taking one more step because they expected one. A pause is only clear if the leader\'s chest genuinely stops.',
  },
  {
    id: 'weight-change-no-move',
    title: 'Change their weight without moving them',
    goal: 'The invisible skill behind cross system, and the thing that lets you start a dance without lurching.',
    pillar: 'connection',
    mode: 'partner',
    level: 'developing',
    minutes: 6,
    order: 40,
    steps: [
      'Stand in the embrace, both settled on one foot.',
      'Leader: shift your own weight from one foot to the other, slowly, and let the follower feel it and match.',
      'Nobody travels anywhere. The feet stay where they are.',
      'Do ten. Then have the follower say out loud each time they feel it, so you find out whether you are as clear as you think.',
    ],
    watchFor: 'Making it big enough to be a lurch. It should be the smallest legible signal you can manage.',
  },
  {
    id: 'eyes-closed-walk',
    title: 'Walk with your eyes closed',
    goal: 'Followers: proves how much information is actually arriving. Leaders: exposes exactly how clear you are not.',
    pillar: 'connection',
    mode: 'partner',
    level: 'developing',
    minutes: 6,
    order: 50,
    steps: [
      'Follower closes their eyes. Leader keeps theirs open and takes full responsibility for the space.',
      'Walk slowly, in a straight line, with plenty of room around you.',
      'Add pauses and weight changes. Nothing else.',
      'Swap after a few minutes.',
    ],
    watchFor:
      'Leaders steering with the arms once the follower cannot see. Do it with the chest or the drill is pointless.',
    progression: 'Add side steps, then a cross. Stop the moment it stops feeling safe.',
  },
  {
    id: 'palm-to-palm',
    title: 'Palm to palm',
    goal: 'Rebuilds the lead from a single point of contact, which makes vagueness impossible to hide.',
    pillar: 'connection',
    mode: 'partner',
    level: 'developing',
    minutes: 8,
    order: 60,
    steps: [
      'Face each other with one palm lightly against your partner\'s, arms relaxed. No embrace.',
      'Lead a walk, side steps, and a pause using only the movement of your own body.',
      'The contact stays light throughout — if either of you presses, stop and start again.',
      'Add ochos once walking is reliable.',
    ],
    watchFor: 'Pushing and pulling. The palm is a place to feel each other, not a handle.',
  },
  {
    id: 'follower-wait',
    title: 'The follower\'s wait',
    goal: 'Cures anticipation — the single most common thing standing between a follower and being lovely to dance with.',
    pillar: 'connection',
    mode: 'partner',
    level: 'developing',
    minutes: 8,
    order: 70,
    steps: [
      'Leader: walk a simple pattern, then repeat it three times so the follower learns it.',
      'On the fourth, change it without warning.',
      'Follower: your job is to be genuinely surprised — to arrive where you were led, not where you expected.',
      'Swap roles and find out how it feels from the other side.',
    ],
    watchFor:
      'Followers moving on the count rather than on the lead. If you would have stepped with your eyes closed and no partner, you anticipated.',
  },
  {
    id: 'swap-roles-tanda',
    title: 'Dance one tanda in the other role',
    goal: 'The fastest diagnostic tool in tango. Everything unclear about your own role becomes obvious from the other side.',
    pillar: 'connection',
    mode: 'partner',
    level: 'all',
    minutes: 12,
    music: true,
    order: 80,
    steps: [
      'At a practica, ask someone to swap roles with you for a tanda.',
      'Keep it to walking, pauses, and the cross. Do not attempt your usual repertoire.',
      'Afterwards, name one thing you now understand about your own role.',
      'Do this once a month, not once ever.',
    ],
    watchFor: 'Apologising the whole way through. You are supposed to be bad at it; that is the point.',
    related: { label: 'Where Should I Start?', href: '/dancer/starter-kit/where-to-start/' },
  },

  // ===== The music =========================================================
  {
    id: 'walk-the-beat',
    title: 'Walk the beat',
    goal: 'Connects hearing the pulse to putting a foot down on it, which is not the same skill as clapping along.',
    pillar: 'music',
    mode: 'either',
    level: 'new',
    minutes: 5,
    music: true,
    order: 10,
    steps: [
      'Put on a strongly rhythmic tango — early D\'Arienzo is the easiest in the world to find the beat in.',
      'Clap the beat for the first thirty seconds until you are sure of it.',
      'Now walk it, one step per beat, arriving exactly on the beat rather than just after it.',
      'Do a whole song without losing it.',
    ],
    watchFor: 'Drifting into your own tempo once you stop thinking about it. Check yourself every twenty seconds.',
    progression: 'Try it with Pugliese, where the pulse stretches and contracts on purpose.',
    related: { label: 'The Beat', href: '/dancer/musicality/the-beat/' },
  },
  {
    id: 'find-the-phrase',
    title: 'Find the phrase ending',
    goal: 'Once you hear where phrases end, you always know where a pause belongs — and the dance stops feeling arbitrary.',
    pillar: 'music',
    mode: 'either',
    level: 'new',
    minutes: 8,
    music: true,
    order: 20,
    steps: [
      'Sit and listen to one song. Raise a hand every time you think a musical sentence finishes.',
      'Most tangos group into eight-beat phrases and sixteen-beat sentences. Count if it helps at first.',
      'Play the song again and walk it, stopping at every phrase ending.',
      'Then dance it, putting something deliberate — a pause, a cross — on each ending.',
    ],
    watchFor: 'Counting so hard you stop listening. The counting is scaffolding; take it away once you hear it.',
    related: { label: 'Phrasing', href: '/dancer/musicality/phrasing/' },
  },
  {
    id: 'double-and-half-time',
    title: 'Double time, half time',
    goal: 'Gives you three speeds instead of one, which is most of what "musical" means in practice.',
    pillar: 'music',
    mode: 'either',
    level: 'developing',
    minutes: 8,
    music: true,
    order: 30,
    steps: [
      'Walk one song entirely on the beat.',
      'Walk the next taking one step every two beats — half time. Notice how much more time you have.',
      'Now mix: half time for a phrase, on the beat for a phrase.',
      'Add a few double-time steps, but only where the music is doing something quick.',
    ],
    watchFor:
      'Using double time because you can rather than because the music does. If the orchestra is not running, do not run.',
    related: { label: 'The Beat', href: '/dancer/musicality/the-beat/' },
  },
  {
    id: 'strong-weak-beats',
    title: 'Strong beats only',
    goal: 'Teaches you that you are choosing which beats to use, rather than obediently stepping on all of them.',
    pillar: 'music',
    mode: 'either',
    level: 'developing',
    minutes: 8,
    music: true,
    order: 40,
    steps: [
      'Find the beat, then find the stronger of every pair — the one that feels like the downbeat.',
      'Walk a song stepping only on those. Stand still on the others.',
      'Then walk a song stepping only on the weak ones. It will feel wrong, which is the lesson.',
      'Finish by mixing the two deliberately.',
    ],
    watchFor: 'Losing the pulse entirely during the standing-still beats. The beat keeps going whether you step or not.',
    related: { label: 'The Beat', href: '/dancer/musicality/the-beat/' },
  },
  {
    id: 'orchestra-spotting',
    title: 'Name the orchestra',
    goal: 'The skill that separates a two-year dancer from a ten-year dancer, and you can practise it on the bus.',
    pillar: 'music',
    mode: 'solo',
    level: 'developing',
    minutes: 10,
    music: true,
    order: 50,
    steps: [
      'Pick four orchestras to start: D\'Arienzo, Di Sarli, Troilo, Pugliese. They sound nothing like each other.',
      'Listen to three tracks of each back to back, and write down one word for what makes each recognisable.',
      'Shuffle them and guess. Check.',
      'Add two more orchestras once you get four right in a row.',
    ],
    watchFor: 'Trying to learn twelve at once. Four solidly beats twelve vaguely.',
    progression: 'Guess the decade, then the singer.',
    related: { label: 'Knowing the Orchestras', href: '/dancer/musicality/orchestras/' },
  },
  {
    id: 'listen-without-dancing',
    title: 'Listen to a whole tanda doing nothing',
    goal: 'Builds the ear that everything else in this pillar depends on, and costs you no practice time at all.',
    pillar: 'music',
    mode: 'solo',
    level: 'new',
    minutes: 12,
    music: true,
    order: 60,
    steps: [
      'Put on four tracks by one orchestra.',
      'Do not dance, do not check your phone, do not do the washing up.',
      'Listen for one thing only: where each song gets heavier and where it gets lighter.',
      'Repeat with a different orchestra tomorrow.',
    ],
    watchFor: 'Treating it as background. Twelve minutes of actual attention is worth an hour of having it on.',
  },

  // ===== The floor =========================================================
  {
    id: 'square-metre',
    title: 'Dance in a square metre',
    goal: 'The skill that makes you welcome at a busy milonga, and it is a constraint rather than a technique.',
    pillar: 'floor',
    mode: 'partner',
    level: 'developing',
    minutes: 10,
    music: true,
    order: 10,
    steps: [
      'Mark out roughly a square metre — a rug, two chairs, anything.',
      'Dance a whole song without leaving it.',
      'You will run out of walking almost immediately. Use weight changes, crosses, ocho cortado, and pauses.',
      'Repeat with a second song before you decide it is boring.',
    ],
    watchFor:
      'Getting tense and small. Small movements should still be complete movements — compact, not cramped.',
    related: { label: 'The Basics', href: '/dancer/starter-kit/the-basics/' },
  },
  {
    id: 'follow-the-couple-ahead',
    title: 'Follow the couple ahead',
    goal: 'Turns navigation from reacting into planning, which is the whole difference on a crowded floor.',
    pillar: 'floor',
    mode: 'partner',
    level: 'developing',
    minutes: 10,
    music: true,
    order: 20,
    steps: [
      'At a milonga, pick the couple in front of you and keep a constant distance from them for a whole tanda.',
      'When they slow down, you dance smaller. When they move, you travel.',
      'Never close the gap to less than about a metre, and never let it open to more than two.',
      'Do not overtake, even when there is space.',
    ],
    watchFor: 'Staring at them. Use peripheral vision — the point is to sense the gap, not to watch it.',
    related: { label: 'Your Milonga Survival Guide', href: '/dancer/starter-kit/milonga-survival-guide/' },
  },
  {
    id: 'enter-and-exit',
    title: 'Enter and exit the ronda',
    goal: 'Two small moments that mark you out immediately as someone who knows what they are doing.',
    pillar: 'floor',
    mode: 'partner',
    level: 'new',
    minutes: 6,
    order: 30,
    steps: [
      'Stand at the edge of the floor with your partner in an embrace, ready.',
      'Catch the eye of the leader approaching in the outer lane and wait to be waved in.',
      'Enter behind them, matching their speed rather than cutting in front.',
      'At the cortina, leave through the middle of the floor, not against the traffic.',
    ],
    watchFor:
      'Stepping in during a gap without looking. The gap belongs to the couple behind it, not to whoever gets there first.',
    related: { label: 'Your Milonga Survival Guide', href: '/dancer/starter-kit/milonga-survival-guide/' },
  },
  {
    id: 'peripheral-vision',
    title: 'Navigate with peripheral vision',
    goal: 'Lets leaders see the floor without turning their head, which keeps the embrace intact while they look.',
    pillar: 'floor',
    mode: 'partner',
    level: 'developing',
    minutes: 8,
    music: true,
    order: 40,
    steps: [
      'Dance a tanda keeping your head still and level, facing over your partner\'s shoulder.',
      'Without turning your head, keep track of the couple ahead and the couple behind.',
      'Notice how much of the room you can actually see. It is more than you assume.',
      'Only turn your head when you genuinely need to, and turn it slowly.',
    ],
    watchFor:
      'Craning round to check behind you mid-step. It disturbs the embrace and tells your partner you are not with them.',
  },
  {
    id: 'cabeceo-practice',
    title: 'Cabeceo across the room',
    goal: 'The invitation itself is a skill, and the only way to get comfortable with it is repetition.',
    pillar: 'floor',
    mode: 'either',
    level: 'new',
    minutes: 10,
    order: 50,
    steps: [
      'Arrive early, when the room is quiet and eye lines are clear.',
      'During a cortina, look around the room deliberately. Make eye contact with three people, whether or not you invite them.',
      'Invite someone from your seat with a nod, and wait for the nod back before standing.',
      'Decline one invitation by looking away. It is a normal, polite thing and worth having done on purpose.',
    ],
    watchFor:
      'Looking at your phone or the floor between tandas. The invitation window is short and you have to be visible in it.',
    related: { label: 'Your Milonga Survival Guide', href: '/dancer/starter-kit/milonga-survival-guide/' },
  },
];

/** Pillar order, then `order`, then title. */
export const sortedDrills: Drill[] = [...dancerDrills].sort((a, b) => {
  const pa = drillPillars.findIndex((p) => p.id === a.pillar);
  const pb = drillPillars.findIndex((p) => p.id === b.pillar);
  return pa - pb || (a.order ?? 100) - (b.order ?? 100) || a.title.localeCompare(b.title);
});

export function getDrillPillar(id: DrillPillarId): DrillPillar | undefined {
  return drillPillars.find((p) => p.id === id);
}

/** Drills belonging to one pillar, in order. */
export function drillsByPillar(id: DrillPillarId): Drill[] {
  return sortedDrills.filter((d) => d.pillar === id);
}
