/**
 * Paid products configuration.
 * Add your Stripe Payment Links here after creating products in the Stripe Dashboard.
 * Get Payment Links from: Stripe Dashboard → Products → [Product] → Create payment link
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  paymentLink: string;
  image?: string;
  featured?: boolean;
}

export const products: Product[] = [
  {
    id: 'dj-app',
    name: 'Tango DJ Practice App',
    description: 'An app to practice building tandas and track your music library. Perfect for aspiring DJs.',
    price: '$29',
    paymentLink: 'https://buy.stripe.com/EXAMPLE', // Replace with your Stripe Payment Link
    featured: true,
  },
  {
    id: 'dj-guide',
    name: 'Advanced DJ Guide (PDF)',
    description: 'In-depth guide covering orchestra eras, building sets, and handling different crowd energies.',
    price: '$15',
    paymentLink: 'https://buy.stripe.com/EXAMPLE', // Replace with your Stripe Payment Link
  },
];
