/**
 * The printable Quick Reference Sheet — /dancer/starter-kit/cheat-sheet/.
 *
 * Everything on the sheet comes from here, so editing it never means touching
 * layout. It is designed to fit on two sides of A4 / Letter; if you add a lot,
 * check the print preview before shipping.
 *
 * Blocks flow into two columns in print order. `span: 'full'` makes a block
 * run the full width instead.
 */

export interface SummaryBlock {
  id: string;
  title: string;
  /** Optional one-liner under the heading. */
  intro?: string;
  /**
   * Bullets. Anything before a " — " is bolded as a label, so
   * "Balance — can you stand on one foot?" renders with "Balance" in bold.
   */
  items: string[];
  /** Small print under the list. */
  note?: string;
  /** Full-width instead of one column. */
  span?: 'full';
  /** Forces this block to start the second printed page. */
  pageBreak?: boolean;
}

export const summaryIntro =
  'Everything in the Tango Toolkit starter kit, compressed. Nothing here replaces dancing — but it is a good thing to read on the way to a milonga.';

export const summaryBlocks: SummaryBlock[] = [
  {
    id: 'pillars',
    title: 'The four pillars',
    intro: 'Every tango problem belongs to one of these. Naming the right one is most of the fix.',
    items: [
      'Your own body — balance, posture, moving your own weight. Can you stand on one foot for a minute?',
      'Connection — the embrace, and the two-way conversation through it. Comfortable for both, held not clamped.',
      'The music — the beat, the phrase, the orchestra. Can you stay on it for a whole track?',
      'The floor — navigation and social craft. Can you dance a tanda without overtaking anyone?',
    ],
    note: 'Figures and sequences are the fifth pillar that is not one. They do not compound; the four above do.',
  },
  {
    id: 'do-nothing-else',
    title: 'If you do nothing else',
    items: [
      'Go regularly — once a week beats an intensive weekend every three months.',
      'Work on your walk and your balance, not on figures.',
      'Dance with people better than you, and with people worse than you.',
      'Listen to tango music when you are not dancing.',
      'Go to the second class. That is the one where it starts making sense.',
      'Add a practica before you add a second class.',
    ],
  },
  {
    id: 'vocabulary',
    title: 'The whole vocabulary',
    intro: 'Everything with a fancy name is a combination of these five.',
    items: [
      'Walk — forwards, backwards, or to the side. The backbone.',
      'Pause — stand still, in time, on purpose. Where weight changes happen.',
      'Pivot — turns a walk into an ocho. Powered by disassociation.',
      'Cross — one foot passes the other and takes the weight.',
      'Turn — the giro, around a shared centre.',
    ],
    note: 'A walk, a pause, a weight change, the cross, and an ocho cortado is a complete dance.',
  },
  {
    id: 'milonga',
    title: 'How a milonga runs',
    items: [
      'Tanda — three or four songs by one orchestra. You dance the whole set with one person.',
      'Cortina — non-tango music between tandas. It means: thank your partner, clear the floor.',
      'Cabeceo — invite with eye contact and a nod, from your seat. Stand up only after the nod back.',
      'Declining — look away. That is the whole refusal, and it is invisible to the room.',
      'Rotation — the night usually cycles tango, tango, vals, tango, tango, milonga.',
    ],
  },
  {
    id: 'floorcraft',
    title: 'Floor craft',
    items: [
      'Travel counter-clockwise in the line of dance. Everybody, always.',
      'Do not overtake. If the couple ahead is slow, dance smaller.',
      'Do not back up into the person behind you.',
      'Leaders are responsible for what is behind their partner.',
      'Small and low when crowded. Save big movements for an empty floor.',
      'Bumped someone? Make eye contact, acknowledge it, carry on.',
      'Enter the floor by catching the eye of an oncoming leader. Leave through the middle.',
    ],
  },
  {
    id: 'when-wrong',
    title: 'When it goes wrong',
    items: [
      'Forgot everything — walk. On the beat. A calm walking tanda is a genuinely good dance.',
      'Nobody is asking you — sit where you can be seen, and look up during cortinas.',
      'Collision — eye contact, nod, carry on. Do not stop to discuss it.',
      'Need to stop mid-tanda — "thank you, I need to sit down" is complete and needs no reason.',
      'Invited by someone much better — accept. Dance simply and stay on the beat.',
      'Being held too tightly — adjust, then say it plainly, then end the dance. You never owe anyone a tanda.',
    ],
  },
  {
    id: 'before-you-go',
    title: 'Before you go',
    items: [
      'Smooth-soled shoes that stay on your feet. Carry them; change there.',
      'A spare shirt if you sweat, and go easy on strong scent.',
      'Water, cash for the door, mints.',
      'Arrive early — quieter floor, easier invitations, gentler tandas.',
      'Sit where you can see and be seen. This is the most common reason a beginner does not dance.',
    ],
  },
  {
    id: 'words',
    title: 'Words you will hear',
    items: [
      'Práctica — a practice session. You can stop, talk, and try things.',
      'Milonga — a social dance. Also the name of a faster, bouncier rhythm.',
      'Vals — tango waltz, in three-time. No new steps required.',
      'Cruzada — the cross.',
      'Ocho — step, pivot, step, tracing a figure eight.',
      'Ocho cortado — an ocho cut short and sent back, landing in the cross. Best crowded-floor move there is.',
      'Giro — a turn around the leader.',
      'Adorno — a decoration, taken in your own time, never at the cost of the beat.',
      'Códigos — the unwritten codes of the milonga.',
    ],
  },
  {
    id: 'checklist',
    title: 'Your first month',
    intro: 'No rush on any of these. Tick them off as you go.',
    span: 'full',
    items: [
      'Go to a beginner class.',
      'Go back to the same class a second time.',
      'Stand on one foot for a minute, each side, unaided.',
      'Listen to a full tanda without doing anything else.',
      'Go to a practica.',
      'Dance with someone you have never danced with.',
      'Go to a milonga and stay an hour — you do not have to dance.',
      'Cabeceo someone successfully from across the room.',
      'Decline a cabeceo by looking away.',
      'Dance one tanda without overtaking anyone.',
      'Walk a whole tanda with no figures at all.',
      'Name the orchestra of a tanda before it finishes.',
    ],
  },
];
