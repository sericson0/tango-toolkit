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

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsMap(): Record<string, Product> {
  const map: Record<string, Product> = {};
  products.forEach((p) => { map[p.id] = p; });
  return map;
}

export const products: Product[] = [
  {
    id: 'tigertango',
    name: 'TigerTango',
    tagline: 'An interface designed for Tango DJs',
    description: 'A customized Virtual DJ skin specifically designed for tango DJs.',
    price: 'Free',
    downloadLink: 'https://github.com/sericson0/TigerTango/releases',
    image: '/images/TigerTangoLogo.png',
  },
  {
    id: 'hisstory',
    name: 'Hisstory',
    tagline: 'Keep the music, ditch the noise',
    description: 'Real-time spectral gating plugin that removes hiss while keeping music and transients intact.',
    price: '$40',
    stripePriceId: 'price_1TMJvsBGhFYtRptA3axQycOs',
    downloadLink: 'https://github.com/sericson0/hisstory-releases/releases',
    image: '/images/hisstory-logo.png',
    trial: true,
  },
  {
    id: 'tigertag',
    name: 'TigerTag',
    tagline: 'Tag your tango tunes',
    description: 'TigerTag quickly gets you the right metadata for your songs so you can spend less time tagging and more time DJing. ',
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
    description: 'Virtual DJ plugin that helps you quickly find the perfect matches to build out a tanda.',
    price: 'Free',
    downloadLink: 'https://github.com/sericson0/TigerTanda/releases',
    image: '/images/TigerTanda.png',
  },
];
