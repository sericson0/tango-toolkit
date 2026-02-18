# Tango Toolkit

Resources for tango dancers, DJs, and organizers. Built with Astro and deployed to Netlify.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm or pnpm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:4321` to view the site.

### Build

```bash
npm run build
```

Output goes to `dist/`.

## Project Structure

```
src/
├── components/     # Reusable components (VideoEmbed, ContentImage)
├── content/       # Content collections
│   ├── dj-courses/   # MD/MDX course overviews
│   └── dj-lessons/   # MD/MDX lessons (can include videos, images)
├── data/          # Data files (products.ts for Stripe)
├── layouts/       # BaseLayout
├── pages/         # Routes
│   ├── index.astro       # Home
│   ├── dance/            # Dance resources (placeholder)
│   ├── dj/               # DJ resources
│   │   ├── courses/      # Course list & individual courses
│   │   ├── materials/    # Reference materials
│   │   └── paid/         # Stripe products
│   └── organizer/        # Organizer resources (placeholder)
└── styles/        # Global CSS
```

## Adding Content

### DJ Courses

1. Create a new file in `src/content/dj-courses/` (e.g. `my-course.md`)
2. Add frontmatter: `title`, `description`, `order`, `published`
3. Write course content in Markdown

### DJ Lessons

1. Create a new file in `src/content/dj-lessons/` (e.g. `my-lesson.mdx`)
2. Add frontmatter: `title`, `description`, `course` (slug of parent course), `order`, `published`
3. Use `.mdx` for lessons that need videos or custom components:

```mdx
---
title: "My Lesson"
description: "Lesson description"
course: beginner-tango-dj
order: 4
published: true
---

import VideoEmbed from '../../../components/VideoEmbed.astro';

# My Lesson

Content here...

<VideoEmbed url="https://www.youtube.com/watch?v=VIDEO_ID" title="Video title" />
```

### Images

Place images in `public/` and reference them. For content images:

```mdx
import ContentImage from '../../../components/ContentImage.astro';

<ContentImage src="/images/my-image.jpg" alt="Description" caption="Optional caption" />
```

## Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Create products in the Stripe Dashboard
3. For each product, create a **Payment Link** (Products → [Product] → Create payment link)
4. Add the payment link to `src/data/products.ts`:

```ts
{
  id: 'my-product',
  name: 'My Product',
  description: 'Description',
  price: '$29',
  paymentLink: 'https://buy.stripe.com/YOUR_LINK',
  featured: true,
}
```

## Deployment (Netlify)

1. Push to GitHub
2. Connect the repo in [Netlify](https://netlify.com)
3. Build settings: `npm run build`, publish directory: `dist`
4. Add your domain (tangotoolkit.com) in Netlify → Domain settings
5. Update DNS at Dreamhost to point to Netlify

## Customization

- **Colors:** Edit `src/styles/global.css` (CSS variables)
- **Fonts:** Outfit + DM Serif Display (change in global.css)
- **Products:** Edit `src/data/products.ts`
