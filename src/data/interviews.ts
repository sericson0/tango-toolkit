/**
 * Dancer interview library.
 * Powers /dancer/interviews/ — a searchable directory of tango interviews that
 * can be browsed three ways: by resource (series), by category, or by artist.
 *
 * Three layers:
 *   1. `interviewCategories` — the topic tags used for "browse by category".
 *   2. `interviewGroups` — the series/podcasts/channels ("resources") doing the
 *      interviews. Each owns its section branding: logo, blurb, a "visit site"
 *      link, and (if they have one) donate/support buttons.
 *   3. `interviews` — the individual conversations. Each links to a group, names
 *      its guest/subject (the "artist"), and carries one or more categories.
 *
 * To add an interview, copy this template into the `interviews` array:
 * {
 *   id: 'unique-slug',
 *   guest: 'Person or duo interviewed',   // drives "browse by artist"
 *   title: 'Optional episode title',       // falls back to `guest` if omitted
 *   description: 'Optional blurb',          // falls back to a generated line
 *   groupId: 'tengo-una-pregunta',          // must match an interviewGroups id
 *   url: yt('VIDEOID'),                      // or a full https URL
 *   format: 'video',                         // 'video' | 'podcast'
 *   categories: ['dancers'],                 // one or more InterviewCategoryId
 *   source: 'YouTube',                       // optional — auto-derived from URL host
 *   dateAdded: '2026-07-17',
 * },
 */

/** Build a YouTube watch URL from a video id. */
export const yt = (id: string): string => `https://www.youtube.com/watch?v=${id}`;

export type InterviewFormat = 'video' | 'podcast';

export type InterviewCategoryId = 'music' | 'dancers' | 'milonguero-viejo' | 'history' | 'community';

export interface InterviewCategory {
  id: InterviewCategoryId;
  label: string;
  blurb: string;
}

/** The 5 topic tags, in display order. */
export const interviewCategories: InterviewCategory[] = [
  { id: 'music', label: 'Music', blurb: 'Musicians, orchestras, singers, and composers.' },
  { id: 'dancers', label: 'Dancers & Maestros', blurb: 'Performers and teachers of the dance.' },
  { id: 'milonguero-viejo', label: 'Milonguero viejo', blurb: 'The old guard — keepers of the social-dance tradition.' },
  { id: 'history', label: 'History', blurb: 'Historians, researchers, poets, and documentaries.' },
  { id: 'community', label: 'Community', blurb: 'Organizers, DJs, and reflections on tango life.' },
];

export interface DonateLink {
  label: string;
  url: string;
}

export interface InterviewGroup {
  id: string;
  /** Series/podcast/channel name. */
  name: string;
  /** Host, producer, or channel behind the series. */
  host?: string;
  /** Short description shown in the section header. */
  description: string;
  /** Home for this content (playlist, podcast page, site). Adds a "Visit site" link. */
  website?: string;
  /** Small logo (URL or /public path). Shown on the section header and cards. */
  logo?: string;
  /** Donation/support links, if the group has any. Each renders a button. */
  donateLinks?: DonateLink[];
}

export interface Interview {
  id: string;
  /** The person, duo, or subject featured — drives "browse by artist". */
  guest: string;
  /** Episode/interview title. Falls back to `guest` when omitted. */
  title?: string;
  /** Card blurb. Falls back to a generated line when omitted. */
  description?: string;
  /** Which group/series produced it — must match an InterviewGroup id. */
  groupId: string;
  /** Link to watch or listen. */
  url: string;
  format: InterviewFormat;
  /** One or more topic tags. */
  categories: InterviewCategoryId[];
  /** Where it was accessed from (e.g. 'YouTube', '030tango.com'). Auto-derived from the URL host if omitted. */
  source?: string;
  /** Thumbnail image URL. Auto-derived for YouTube links; falls back to the group logo. */
  thumbnail?: string;
  /** true → this card points at a whole series/feed, not one episode (shown only in the Series view). */
  seriesCard?: boolean;
  /** ISO date (YYYY-MM-DD) added to the site. */
  dateAdded?: string;
}

/** The interview groups ("resources"), in the order their sections appear. */
export const interviewGroups: InterviewGroup[] = [
  {
    id: 'tengo-una-pregunta',
    name: 'Tengo una Pregunta para Vos',
    host: 'Pepa Palazón',
    description:
      'A long-running interview series in which Pepa Palazón puts her questions to the great dancers, milongueros, and musicians of tango — most episodes carry subtitles in several languages.',
    website: 'https://www.youtube.com/playlist?list=PL4uWiPclZR3PHIIXJszQ_VBuKD8zLp78R',
    logo: '/images/interviews/tengo-una-pregunta.png',
    donateLinks: [
      { label: 'Patreon', url: 'https://www.patreon.com/tengounapregunta' },
      { label: 'PayPal', url: 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=S3VJKGEMVTWWL&source=url&ssrt=1784317391574' },
    ],
  },
  {
    id: 'cual-es-tu-tango',
    name: '¿Cuál es tu tango?',
    host: 'Ignacio Varchausky',
    description:
      'A video series by bandleader and researcher Ignacio Varchausky, asking musicians, dancers, and thinkers how they relate to tango and its music.',
    website: 'https://www.ignaciovarchausky.com/home-english',
    // logo: '/images/interviews/cual-es-tu-tango.png', // TODO: add logo asset
  },
  {
    id: '030tango',
    name: '030tango Podcast',
    host: 'Jonas · 030tango (Berlin)',
    description:
      'A Berlin-based, English-language podcast journeying through the world of Argentine tango — intimate conversations with dancers, organizers, musicians, and the people who make the scene tick.',
    website: 'https://030tango.com/podcast/',
    logo: '/images/interviews/030tango.png',
    donateLinks: [
      { label: 'Support 030tango', url: 'https://030tango.com/support/' }, // TODO(sean): confirm link
    ],
  },
  {
    id: 'humans-of-tango',
    name: 'Humans of Tango',
    host: 'Liz Sabatiuk',
    description:
      'A podcast exploring what tango has to teach through the experiences of the people who dance it — an authentic glimpse into who dances tango, and why.',
    website: 'https://www.humansoftango.com/',
    logo: '/images/interviews/humans-of-tango.jpg',
  },
  {
    id: 'discovering-troilo',
    name: 'Discovering Troilo',
    host: 'Heyni Solera',
    description:
      'A documentary miniseries by bandoneonist Heyni Solera, taking apart the music of Aníbal Troilo one landmark recording at a time.',
    website: 'https://heynisolera.com/',
    logo: '/images/interviews/discovering-troilo.png',
  },
  {
    id: 'tango-time-machine',
    name: 'Tango Time Machine',
    description:
      'Conversations and documentaries digging into tango history and the living artists who carry it forward.',
    // website: '', // no site provided
    // logo: '/images/interviews/tango-time-machine.png', // TODO: add logo asset
  },
  {
    id: 'vienna-tango-school',
    name: 'Vienna Tango School',
    description:
      'Interviews with visiting maestros — including the "Staying Grounded" series — produced by the Vienna Tango School.',
    website: 'https://viennatango.com/',
    logo: '/images/interviews/vienna-tango-school.webp',
  },
];

export const interviews: Interview[] = [
  // ============================================================
  // Tengo una Pregunta para Vos  (Pepa Palazón) — YouTube
  // ============================================================
  { id: 'tengo-PyKypwQ1pgM', guest: 'Aoniken Quiroga', groupId: 'tengo-una-pregunta', url: yt('PyKypwQ1pgM'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-GiMg_edzw4I', guest: 'Javier Rodríguez', groupId: 'tengo-una-pregunta', url: yt('GiMg_edzw4I'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-GujuSjd5aLg', guest: 'Moira Castellano', groupId: 'tengo-una-pregunta', url: yt('GujuSjd5aLg'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-RArqzsO1FKE', guest: 'Omar Viola', groupId: 'tengo-una-pregunta', url: yt('RArqzsO1FKE'), format: 'video', categories: ['community'], dateAdded: '2026-07-17' },
  { id: 'tengo-EAbQCF5L3-g', guest: 'José "Pepe" Colangelo', groupId: 'tengo-una-pregunta', url: yt('EAbQCF5L3-g'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'tengo-JAnwAa3O5fg', guest: 'Eduardo "Parejita" Pareja', groupId: 'tengo-una-pregunta', url: yt('JAnwAa3O5fg'), format: 'video', categories: ['milonguero-viejo'], dateAdded: '2026-07-17' },
  { id: 'tengo-tjAA8aXTppc', guest: 'Clarisa Aragón y Jonathan Saavedra', groupId: 'tengo-una-pregunta', url: yt('tjAA8aXTppc'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-RlYq6ZDv9Jw', guest: 'Pancho Martínez Pey', groupId: 'tengo-una-pregunta', url: yt('RlYq6ZDv9Jw'), format: 'video', categories: ['community'], dateAdded: '2026-07-17' },
  { id: 'tengo-R9gL6bYE1eM', guest: 'Sabrina y Rubén Véliz', groupId: 'tengo-una-pregunta', url: yt('R9gL6bYE1eM'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-g4ihDfpK_JE', guest: 'Dana Frigoli', groupId: 'tengo-una-pregunta', url: yt('g4ihDfpK_JE'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-gSJjs0vDKxo', guest: 'Mariano "Chicho" Frumboli', groupId: 'tengo-una-pregunta', url: yt('gSJjs0vDKxo'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-AwK3jBBAhWA', guest: 'Eduardo Capussi y Mariana Flores', groupId: 'tengo-una-pregunta', url: yt('AwK3jBBAhWA'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-HDwAVXI0zWs', guest: 'Toto Faraldo', groupId: 'tengo-una-pregunta', url: yt('HDwAVXI0zWs'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-uc8bLmoMyXA', guest: 'Lorena Ermocida', groupId: 'tengo-una-pregunta', url: yt('uc8bLmoMyXA'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-mSb-aG6Uzjs', guest: 'Julio Balmaceda', groupId: 'tengo-una-pregunta', url: yt('mSb-aG6Uzjs'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-liSCq_7L10s', guest: 'Roxana Suárez y Sebastián Achával', groupId: 'tengo-una-pregunta', url: yt('liSCq_7L10s'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-BoOApAeI-VU', guest: 'Sabrina Véliz, Milena Plebs & Noelia Hurtado', groupId: 'tengo-una-pregunta', url: yt('BoOApAeI-VU'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-uxxRGd0whW0', guest: 'Vanesa Villalba y Facundo Piñero', groupId: 'tengo-una-pregunta', url: yt('uxxRGd0whW0'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-ZSoOwVD54bU', guest: 'Cecilia García y Serkan Gökçesu', groupId: 'tengo-una-pregunta', url: yt('ZSoOwVD54bU'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-De9cuYYplc4', guest: 'Horacio "El Pebete" Godoy', groupId: 'tengo-una-pregunta', url: yt('De9cuYYplc4'), format: 'video', categories: ['milonguero-viejo'], dateAdded: '2026-07-17' },
  { id: 'tengo-RI-IwmeVAno', guest: 'Fabián Peralta', groupId: 'tengo-una-pregunta', url: yt('RI-IwmeVAno'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-JioMUPm9iF4', guest: 'El Chino Perico', groupId: 'tengo-una-pregunta', url: yt('JioMUPm9iF4'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-6cWISgU-HbQ', guest: 'Raúl Bravo', groupId: 'tengo-una-pregunta', url: yt('6cWISgU-HbQ'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-ReOHf_h-cVc', guest: 'Los Totis', groupId: 'tengo-una-pregunta', url: yt('ReOHf_h-cVc'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-eT-RwaHb6FA', guest: 'Alejandra Mantiñán', groupId: 'tengo-una-pregunta', url: yt('eT-RwaHb6FA'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-VOar8W0e1jQ', guest: 'Mariano "Chicho" Frumboli y Fabián Salas', groupId: 'tengo-una-pregunta', url: yt('VOar8W0e1jQ'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-WHajO2jYxMw', guest: 'Olga Besio', groupId: 'tengo-una-pregunta', url: yt('WHajO2jYxMw'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-JA7q8LpPzbY', guest: 'Miguel Ángel Zotto', groupId: 'tengo-una-pregunta', url: yt('JA7q8LpPzbY'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-7zk3ZZKCEi0', guest: 'Los Hermanos Macana', groupId: 'tengo-una-pregunta', url: yt('7zk3ZZKCEi0'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-aSHCkTm2TCU', guest: 'Nito y Elba', groupId: 'tengo-una-pregunta', url: yt('aSHCkTm2TCU'), format: 'video', categories: ['milonguero-viejo'], dateAdded: '2026-07-17' },
  { id: 'tengo-29OArYnyaD8', guest: 'Gabriel Angió', groupId: 'tengo-una-pregunta', url: yt('29OArYnyaD8'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'tengo-tDhyu5jadTo', guest: 'Carlos Copello', groupId: 'tengo-una-pregunta', url: yt('tDhyu5jadTo'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-HoDtaIYI9zE', guest: 'Gloria y Rodolfo Dinzel', groupId: 'tengo-una-pregunta', url: yt('HoDtaIYI9zE'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-Ju2LRV3BymI', guest: 'Vanina Bilous', groupId: 'tengo-una-pregunta', url: yt('Ju2LRV3BymI'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-ZXlAziV8yFo', guest: 'Félix Picherna', groupId: 'tengo-una-pregunta', url: yt('ZXlAziV8yFo'), format: 'video', categories: ['milonguero-viejo'], dateAdded: '2026-07-17' },
  { id: 'tengo-63ff2PXt7l0', guest: 'Susana Rinaldi', groupId: 'tengo-una-pregunta', url: yt('63ff2PXt7l0'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'tengo-Aphw2EmiQTU', guest: 'Guillermina Quiroga', groupId: 'tengo-una-pregunta', url: yt('Aphw2EmiQTU'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-SVt7ckZs1lM', guest: 'Horacio Ferrer', groupId: 'tengo-una-pregunta', url: yt('SVt7ckZs1lM'), format: 'video', categories: ['history'], dateAdded: '2026-07-17' },
  { id: 'tengo-HoNXRgs7YR8', guest: 'Fabián Salas', groupId: 'tengo-una-pregunta', url: yt('HoNXRgs7YR8'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-7wqwUNQbstI', guest: 'Guillermo Fernández', groupId: 'tengo-una-pregunta', url: yt('7wqwUNQbstI'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'tengo-0ObhSicfVng', guest: 'Gloria y Eduardo Arquimbau', groupId: 'tengo-una-pregunta', url: yt('0ObhSicfVng'), format: 'video', categories: ['milonguero-viejo'], dateAdded: '2026-07-17' },
  { id: 'tengo-ewlTss5oMQU', guest: 'Juan Carlos Copes', groupId: 'tengo-una-pregunta', url: yt('ewlTss5oMQU'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-bWgc5HbglrU', guest: 'Roberto Álvarez', groupId: 'tengo-una-pregunta', url: yt('bWgc5HbglrU'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'tengo-odI8t4XhURk', guest: 'Leopoldo Federico', groupId: 'tengo-una-pregunta', url: yt('odI8t4XhURk'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'tengo-SUFGTEO0ubY', guest: 'Alberto Podestá', groupId: 'tengo-una-pregunta', url: yt('SUFGTEO0ubY'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'tengo-EW33y6WcpyU', guest: 'Osvaldo y Coca Cartery', groupId: 'tengo-una-pregunta', url: yt('EW33y6WcpyU'), format: 'video', categories: ['milonguero-viejo'], dateAdded: '2026-07-17' },
  { id: 'tengo-G1dpV2UTiJc', guest: 'Milena Plebs', groupId: 'tengo-una-pregunta', url: yt('G1dpV2UTiJc'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'tengo-szsqKKoX9-0', guest: 'María Nieves Rego', groupId: 'tengo-una-pregunta', url: yt('szsqKKoX9-0'), format: 'video', categories: ['milonguero-viejo'], dateAdded: '2026-07-17' },
  { id: 'tengo-yzKdqFMX8FY', guest: 'Carlos Pérez y Rosa Forte', groupId: 'tengo-una-pregunta', url: yt('yzKdqFMX8FY'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },

  // ============================================================
  // ¿Cuál es tu tango?  (Ignacio Varchausky) — YouTube
  // ============================================================
  { id: 'cual-abJVi0yqPfk', guest: 'Pablo Estigarribia', title: '¿Cuál es tu tango? Ep. 19 — Pablo Estigarribia', groupId: 'cual-es-tu-tango', url: yt('abJVi0yqPfk'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'cual-mBppNNQN1b4', guest: 'Otilia Da Veiga', title: '¿Cuál es tu tango? Ep. 18 — Otilia Da Veiga', groupId: 'cual-es-tu-tango', url: yt('mBppNNQN1b4'), format: 'video', categories: ['milonguero-viejo', 'history'], dateAdded: '2026-07-17' },
  { id: 'cual-DDpYf4xiUmg', guest: 'Horacio Avilano', title: '¿Cuál es tu tango? Ep. 17 — Horacio Avilano', groupId: 'cual-es-tu-tango', url: yt('DDpYf4xiUmg'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'cual-a_JB3y0kf60', guest: 'Lidia Borda y Daniel Godfrid', title: '¿Cuál es tu tango? Ep. 16 — Lidia Borda y Daniel Godfrid', groupId: 'cual-es-tu-tango', url: yt('a_JB3y0kf60'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'cual-jPFnExc2c7Q', guest: 'Graciela González', title: '¿Cuál es tu tango? Ep. 15 — Graciela González', groupId: 'cual-es-tu-tango', url: yt('jPFnExc2c7Q'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'cual-m4pg2Z7Vt3k', guest: 'Sergio Pujol', title: '¿Cuál es tu tango? Ep. 14 — Sergio Pujol', groupId: 'cual-es-tu-tango', url: yt('m4pg2Z7Vt3k'), format: 'video', categories: ['history'], dateAdded: '2026-07-17' },
  { id: 'cual-EV0IkWjJot4', guest: 'Tango Bardo', title: '¿Cuál es tu tango? Ep. 13 — Tango Bardo', groupId: 'cual-es-tu-tango', url: yt('EV0IkWjJot4'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'cual-O07GXOq2aPk', guest: 'Inés Muzzopappa y Corina Herrera', title: '¿Cuál es tu tango? Ep. 12 — Inés Muzzopappa y Corina Herrera', groupId: 'cual-es-tu-tango', url: yt('O07GXOq2aPk'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'cual-RC-L_gs1F4U', guest: 'Víctor Lavallén', title: '¿Cuál es tu tango? Ep. 11 — Víctor Lavallén', groupId: 'cual-es-tu-tango', url: yt('RC-L_gs1F4U'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'cual-tpYW7CBsDhw', guest: 'Juan Villarreal y Patricio Crom', title: '¿Cuál es tu tango? Ep. 10 — Dúo Juan Villarreal & Patricio Crom', groupId: 'cual-es-tu-tango', url: yt('tpYW7CBsDhw'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'cual-che94MvnHZ0', guest: 'Claudia Codega y Esteban Moreno', title: '¿Cuál es tu tango? Ep. 9 — Claudia Codega y Esteban Moreno', groupId: 'cual-es-tu-tango', url: yt('che94MvnHZ0'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'cual-fU9hoKaS1Bw', guest: 'Oscar Del Priore', title: '¿Cuál es tu tango? Ep. 8 — Oscar Del Priore', groupId: 'cual-es-tu-tango', url: yt('fU9hoKaS1Bw'), format: 'video', categories: ['history'], dateAdded: '2026-07-17' },
  { id: 'cual-nDm1tutSlGw', guest: 'Hugo Rivas', title: '¿Cuál es tu tango? Ep. 7 — Hugo Rivas', groupId: 'cual-es-tu-tango', url: yt('nDm1tutSlGw'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'cual-eFVjYHLpcuk', guest: 'Corina de la Rosa', title: '¿Cuál es tu tango? Ep. 6 — Corina de la Rosa', groupId: 'cual-es-tu-tango', url: yt('eFVjYHLpcuk'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17' },
  { id: 'cual--C3_sdLcxTc', guest: 'El Tata Cedrón', title: '¿Cuál es tu tango? Ep. 5 — El Tata Cedrón', groupId: 'cual-es-tu-tango', url: yt('-C3_sdLcxTc'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'cual-BpcO_pbBOGU', guest: 'Rafael Spregelburd', title: '¿Cuál es tu tango? Ep. 4 — Rafael Spregelburd', groupId: 'cual-es-tu-tango', url: yt('BpcO_pbBOGU'), format: 'video', categories: ['community'], dateAdded: '2026-07-17' },
  { id: 'cual-4EX-ANHxijw', guest: 'Nito y Elba', title: '¿Cuál es tu tango? Ep. 3 — Nito y Elba', groupId: 'cual-es-tu-tango', url: yt('4EX-ANHxijw'), format: 'video', categories: ['milonguero-viejo', 'dancers'], dateAdded: '2026-07-17' },
  { id: 'cual-RWOmeoMVHco', guest: 'Color Tango', title: '¿Cuál es tu tango? Ep. 2 — Color Tango', groupId: 'cual-es-tu-tango', url: yt('RWOmeoMVHco'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },
  { id: 'cual-F6V3Bahmvew', guest: 'Horacio Cabarcos', title: '¿Cuál es tu tango? Ep. 1 — Horacio Cabarcos', groupId: 'cual-es-tu-tango', url: yt('F6V3Bahmvew'), format: 'video', categories: ['music'], dateAdded: '2026-07-17' },

  // ============================================================
  // 030tango Podcast  — podcast (partial listing + full-series card)
  // ============================================================
  {
    id: '030tango-series', guest: '', title: '030tango Podcast — the full series', seriesCard: true,
    description: 'The complete run: dozens of conversations with tango dancers, DJs, teachers, and organizers from Berlin and beyond.',
    groupId: '030tango', url: 'https://030tango.com/podcast/', format: 'podcast', categories: [], dateAdded: '2026-07-17',
  },
  {
    id: '030tango-piaggio-espinoza', guest: 'Agustina Piaggio & Carlitos Espinoza',
    title: 'Agustina Piaggio & Carlitos Espinoza · 030tango #02',
    description: 'A conversation with celebrated social dancers and performers Agustina Piaggio and Carlitos Espinoza.',
    groupId: '030tango', url: yt('p1x5oyqximg'), format: 'podcast', categories: ['dancers'], dateAdded: '2026-07-17',
  },

  // ============================================================
  // Humans of Tango  (Liz Sabatiuk) — podcast (partial + full-series card)
  // ============================================================
  {
    id: 'humans-series', guest: '', title: 'Humans of Tango — the full series', seriesCard: true,
    description: 'The complete Humans of Tango feed: intimate conversations about what tango teaches us.',
    groupId: 'humans-of-tango', url: 'https://www.humansoftango.com/', format: 'podcast', categories: [], dateAdded: '2026-07-17',
  },
  {
    id: 'humans-pepa-palazon', guest: 'Pepa Palazón', title: 'Maneras de vivir, con Pepa Palazón',
    description: 'Teacher and performer Pepa Palazón on the many ways of living — and living through — tango.',
    groupId: 'humans-of-tango', url: 'https://www.humansoftango.com/e/maneras-de-vivir-con-pepa-palazon/', format: 'podcast', categories: ['dancers'], dateAdded: '2026-07-17',
  },
  {
    id: 'humans-astrid-weiske', guest: 'Astrid Weiske', title: 'Creating spaces to grow, with Astrid Weiske',
    description: 'Organizer Astrid Weiske on building the spaces and communities where tango dancers grow.',
    groupId: 'humans-of-tango', url: 'https://www.humansoftango.com/e/creating-spaces-to-grow-with-astrid-weiske/', format: 'podcast', categories: ['community'], dateAdded: '2026-07-17',
  },
  {
    id: 'humans-emmanuel-trifilio', guest: 'Emmanuel Trifilio', title: 'Viviendo sueños, con Emmanuel Trifilio',
    description: 'Bandoneonist Emmanuel Trifilio on living tango as a musician and a dreamer.',
    groupId: 'humans-of-tango', url: 'https://www.humansoftango.com/e/viviendo-suenos-con-emmanuel-trifilio/', format: 'podcast', categories: ['music'], dateAdded: '2026-07-17',
  },
  {
    id: 'humans-brigitta-winkler', guest: 'Brigitta Winkler', title: 'Roles and evolution — body and mind, with Brigitta Winkler',
    description: 'Pioneering teacher Brigitta Winkler on tango roles, and how body and mind evolve over a dancing life.',
    groupId: 'humans-of-tango', url: 'https://www.humansoftango.com/e/roles-and-evolution-body-and-mind-with-brigitta-winkler/', format: 'podcast', categories: ['dancers'], dateAdded: '2026-07-17',
  },

  // ============================================================
  // Discovering Troilo  (Heyni Solera) — YouTube miniseries
  // ============================================================
  { id: 'troilo-n5QMEXEYl5E', guest: 'Aníbal Troilo', title: 'Discovering Troilo — Ep. 1: An Idea Is Born', description: 'Heyni Solera opens the series and lays out the journey into Aníbal Troilo\'s music.', groupId: 'discovering-troilo', url: yt('n5QMEXEYl5E'), format: 'video', categories: ['history', 'music'], dateAdded: '2026-07-17' },
  { id: 'troilo-M_GCfKF1pu8', guest: 'Aníbal Troilo', title: 'Discovering Troilo — Ep. 2: "El Africano"', description: 'A close listen to Troilo\'s recording of "El Africano".', groupId: 'discovering-troilo', url: yt('M_GCfKF1pu8'), format: 'video', categories: ['history', 'music'], dateAdded: '2026-07-17' },
  { id: 'troilo-_LGzKFqA2Lg', guest: 'Aníbal Troilo', title: 'Discovering Troilo — Ep. 3: "El Entrerriano"', description: 'A close listen to Troilo\'s recording of "El Entrerriano".', groupId: 'discovering-troilo', url: yt('_LGzKFqA2Lg'), format: 'video', categories: ['history', 'music'], dateAdded: '2026-07-17' },
  { id: 'troilo-F86M06f-y5g', guest: 'Aníbal Troilo', title: 'Discovering Troilo — Ep. 4: "Don Juan"', description: 'A close listen to Troilo\'s recording of "Don Juan".', groupId: 'discovering-troilo', url: yt('F86M06f-y5g'), format: 'video', categories: ['history', 'music'], dateAdded: '2026-07-17' },
  { id: 'troilo-Ullox5fVw9A', guest: 'Aníbal Troilo', title: 'Discovering Troilo — Ep. 5: "El Irresistible"', description: 'A close listen to Troilo\'s recording of "El Irresistible".', groupId: 'discovering-troilo', url: yt('Ullox5fVw9A'), format: 'video', categories: ['history', 'music'], dateAdded: '2026-07-17' },
  { id: 'troilo-K5DpYMSSIrk', guest: 'Aníbal Troilo', title: 'Discovering Troilo — Ep. 6: "La Bordona"', description: 'A close listen to Troilo\'s recording of "La Bordona".', groupId: 'discovering-troilo', url: yt('K5DpYMSSIrk'), format: 'video', categories: ['history', 'music'], dateAdded: '2026-07-17' },
  { id: 'troilo-motMT0ONj78', guest: 'Aníbal Troilo', title: 'Discovering Troilo — Ep. 7: "Nostálgico"', description: 'A close listen to Troilo\'s recording of "Nostálgico".', groupId: 'discovering-troilo', url: yt('motMT0ONj78'), format: 'video', categories: ['history', 'music'], dateAdded: '2026-07-17' },
  { id: 'troilo-fI2PpOLAWvY', guest: 'Aníbal Troilo', title: 'Discovering Troilo — Ep. 8: "Che, Buenos Aires"', description: 'A close listen to Troilo\'s recording of "Che, Buenos Aires".', groupId: 'discovering-troilo', url: yt('fI2PpOLAWvY'), format: 'video', categories: ['history', 'music'], dateAdded: '2026-07-17' },

  // ============================================================
  // Tango Time Machine — YouTube
  // ============================================================
  {
    id: 'ttm-virginia-pandolfi', guest: 'Virginia Pandolfi', title: 'Virginia Pandolfi, a conversation',
    description: 'A wide-ranging conversation with Virginia Pandolfi about tango and her life in it.',
    groupId: 'tango-time-machine', url: yt('Pjco3N9-CrA'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17',
  },
  {
    id: 'ttm-chicho-frumboli', guest: 'Mariano "Chicho" Frumboli', title: 'Mariano "Chicho" Frumboli — Documentary',
    description: 'A documentary portrait of one of the most influential figures of contemporary tango.',
    groupId: 'tango-time-machine', url: yt('2iYehErZ_yE'), format: 'video', categories: ['dancers', 'history'], dateAdded: '2026-07-17',
  },

  // ============================================================
  // Vienna Tango School — YouTube
  // ============================================================
  {
    id: 'vts-staying-grounded-12', guest: 'Lorena & Gianpiero', title: 'Staying Grounded #12 — Lorena & Gianpiero',
    description: 'Episode 12 of the "Staying Grounded" series, in conversation with Lorena and Gianpiero.',
    groupId: 'vienna-tango-school', url: yt('yydeAeWALoE'), format: 'video', categories: ['dancers'], dateAdded: '2026-07-17',
  },
];

// ============================================================
// Helpers
// ============================================================

/** A group by id (undefined if not found). */
export function getInterviewGroup(id: string): InterviewGroup | undefined {
  return interviewGroups.find((g) => g.id === id);
}

/** A category by id (undefined if not found). */
export function getInterviewCategory(id: InterviewCategoryId): InterviewCategory | undefined {
  return interviewCategories.find((c) => c.id === id);
}

/** YouTube video id from a watch/youtu.be URL (null for playlists or non-YouTube URLs). */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null;
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    return null;
  } catch {
    return null;
  }
}

/** Best thumbnail for a card: explicit → derived YouTube frame → group logo → none. */
export function interviewThumbnail(interview: Interview, group?: InterviewGroup): string | undefined {
  if (interview.thumbnail) return interview.thumbnail;
  const id = youtubeId(interview.url);
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return group?.logo;
}

/** Where a card was accessed from — explicit `source`, else the URL host (youtu.be → YouTube). */
export function interviewSource(interview: Interview): string {
  if (interview.source) return interview.source;
  try {
    const host = new URL(interview.url).hostname.replace(/^www\./, '');
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube';
    return host;
  } catch {
    return '';
  }
}

/** Display title for a card. */
export function interviewTitle(interview: Interview): string {
  return interview.title ?? interview.guest;
}

/** Card blurb — explicit description, else a generated line from host + guest. */
export function interviewBlurb(interview: Interview, group?: InterviewGroup): string {
  if (interview.description) return interview.description;
  if (interview.guest) {
    return group?.host
      ? `${group.host} in conversation with ${interview.guest}.`
      : `A conversation with ${interview.guest}.`;
  }
  return group?.description ?? '';
}

/** Split a "X y Y, Z & W" guest string into individual names (for search + artist facets). */
export function guestNames(guest: string): string[] {
  return guest
    .split(/\s*(?:,|&| y | e )\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Interviews for a group, series cards first, then newest-added first. */
export function interviewsByGroup(groupId: string): Interview[] {
  return interviews
    .filter((i) => i.groupId === groupId)
    .sort((a, b) => {
      if (!!a.seriesCard !== !!b.seriesCard) return a.seriesCard ? -1 : 1;
      return (b.dateAdded ?? '').localeCompare(a.dateAdded ?? '');
    });
}
