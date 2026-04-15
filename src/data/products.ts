/**
 * Paid products configuration.
 * Add your Stripe Price IDs here after creating products in the Stripe Dashboard.
 * Get Price IDs from: Stripe Dashboard → Products → [Product] → Pricing → Copy Price ID
 * Price IDs are used to create Checkout Sessions via the API.
 */

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: string;
  stripePriceId?: string;
  downloadLink: string;
  image?: string;
  featured?: boolean;
  /** true if download is a trial that requires a purchased key to unlock */
  trial?: boolean;
}

export const products: Product[] = [
  {
    id: 'tigertango',
    name: 'TigerTango',
    tagline: 'An interface designed for Tango DJs',
    description: 'A customized Virtual DJ skin specifically designed for tango DJs. Provides tanda-focused layout, warning lights for settings, and streamlined controls.',
    price: 'Free',
    downloadLink: 'https://github.com/sericson0/TigerTango/releases',
    image: '/images/TigerTangoLogo.png',
  },
  {
    id: 'hisstory',
    name: 'Hisstory',
    tagline: 'Keep the music, ditch the noise',
    description: 'Audio restoration tool for tango DJs. Remove hiss, clicks, and noise from vintage tango recordings while preserving the music.',
    price: '$40',
    stripePriceId: 'price_1TKTJtBKuwpZhxG13l8OSjvy',
    downloadLink: 'https://github.com/sericson0/hisstory-releases/releases',
    image: '/images/hisstory-logo.png',
    trial: true,
  },
  {
    id: 'tigertag',
    name: 'TigerTag',
    tagline: 'Tag your tango tunes',
    description: 'Batch-tag your tango music library with orchestra, singer, year, genre, and more. Save hours of manual metadata work.',
    price: '$40',
    stripePriceId: 'price_1TML8VBGhFYtRptAguU7QGWV',
    downloadLink: 'https://github.com/sericson0/tigertag-releases/releases',
    image: '/images/TigerTag.png',
    trial: true,
  },
  {
    id: 'tigertanda',
    name: 'TigerTanda',
    tagline: 'Find the tracks for the perfect tanda',
    description: 'Intelligent tanda builder that suggests complementary tracks based on orchestra, era, energy, and style.',
    price: 'Free',
    downloadLink: 'https://github.com/sericson0/TigerTanda/releases',
    image: '/images/TigerTanda.png',
  },
];
