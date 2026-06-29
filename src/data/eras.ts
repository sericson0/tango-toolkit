/**
 * Era presets for the "Learn an Era" module of the Name That Tango game.
 * Each `bandleaders` entry must match a `Bandleader` value in
 * public/data/metadata.csv exactly (matching is accent/case-insensitive at
 * runtime, but copy the canonical spelling from the CSV to avoid typos).
 *
 * Fill in real eras/orchestra groupings here.
 */

export interface Era {
  id: string;
  label: string;
  bandleaders: string[];
}

export const eras: Era[] = [
  {
    id: 'golden-age',
    label: 'Golden Age (placeholder — replace with real eras)',
    bandleaders: ['Aníbal Troilo', 'Carlos Di Sarli', "Juan D'Arienzo"],
  },
];
