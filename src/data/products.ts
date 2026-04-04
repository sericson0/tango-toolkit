/**
 * Paid products configuration.
 * Add your Stripe Payment Links here after creating products in the Stripe Dashboard.
 * Get Payment Links from: Stripe Dashboard → Products → [Product] → Create payment link
 */

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: string;
  paymentLink: string;
  downloadLink?: string;
  image?: string;
  featured?: boolean;
  free?: boolean;
}

export const products: Product[] = [
  {
    id: 'tigertango',
    name: 'TigerTango',
    tagline: 'An interface designed for Tango DJs',
    description: 'A customized Virtual DJ skin specifically designed for tango DJs. Provides tanda-focused layout, warning lights for settings, and streamlined controls.',
    price: 'Free',
    paymentLink: '',
    downloadLink: 'https://github.com/sericson0/TigerTango',
    featured: true,
    free: true,
  },
  {
    id: 'hisstory',
    name: 'Hisstory',
    tagline: 'Keep the music, ditch the noise',
    description: 'Audio restoration tool for tango DJs. Remove hiss, clicks, and noise from vintage tango recordings while preserving the music.',
    price: '$40',
    paymentLink: 'https://buy.stripe.com/EXAMPLE', // Replace with your Stripe Payment Link
    image: '/images/hisstory-logo.png',
  },
  {
    id: 'tigertag',
    name: 'TigerTag',
    tagline: 'Tag your tango tunes',
    description: 'Batch-tag your tango music library with orchestra, singer, year, genre, and more. Save hours of manual metadata work.',
    price: '$TBD',
    paymentLink: 'https://buy.stripe.com/EXAMPLE', // Replace with your Stripe Payment Link
  },
  {
    id: 'tigertanda',
    name: 'TigerTanda',
    tagline: 'Find the tracks for the perfect tanda',
    description: 'Intelligent tanda builder that suggests complementary tracks based on orchestra, era, energy, and style.',
    price: '$TBD',
    paymentLink: 'https://buy.stripe.com/EXAMPLE', // Replace with your Stripe Payment Link
  },
];
