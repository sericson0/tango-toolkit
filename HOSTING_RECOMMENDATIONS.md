# Tango Toolkit Website — Hosting & Platform Recommendations

For **tango-toolkit.com** with support for videos, images, payments, and full editing in Cursor.

---

## Summary: Recommended Approach

**Best fit for your needs:** Build a **static or Jamstack site** in Cursor (e.g. Astro or Next.js) and deploy to **Netlify** or **Vercel**. Point your Dreamhost domain to the hosting provider.

| Requirement | Solution |
|-------------|----------|
| Edit in Cursor | ✅ Full codebase in your repo |
| Videos | ✅ Embed YouTube/Vimeo or self-host |
| Images | ✅ Standard image hosting/CDN |
| Payments | ✅ Stripe Checkout (hosted or embedded) |
| Custom domain | ✅ Point tangotoolkit.com via DNS |

---

## Platform Comparison

### 1. **Netlify** or **Vercel** (Recommended)

**Why these work well:**
- **Cursor-friendly:** Entire site is code in a Git repo; edit locally in Cursor and deploy via Git push
- **Free tier:** Generous for personal/small projects
- **Stripe:** Easy integration with Stripe Checkout (no backend required for basic payments)
- **Media:** Embed videos (YouTube, Vimeo) or use their CDN for images
- **Custom domain:** Simple DNS setup; keep domain at Dreamhost and point A/CNAME records

**Netlify vs Vercel:**
- **Netlify:** Free tier allows commercial use; built-in forms; good for Astro, Eleventy, Hugo
- **Vercel:** Strong for Next.js; excellent DX; free tier is for non-commercial/hobby use

**Domain setup:** In Dreamhost DNS, add:
- `A` record: `@` → Netlify/Vercel IP, or  
- `CNAME` record: `www` → `yoursite.netlify.app` / `yoursite.vercel.app`

---

### 2. **Dreamhost** (Static Hosting)

**Why consider it:**
- Domain is already there
- Supports static sites via FTP/SFTP or Git
- GZIP, caching, SSL included

**Limitations:**
- Manual or scripted deployment (no built-in Git deploy like Netlify/Vercel)
- You still build in Cursor and upload the built files
- Stripe integration works the same (client-side Checkout)

**Use case:** Good if you want everything under one provider and are fine with FTP/Git-based deploys.

---

### 3. **Google Sites**

**Pros:**
- No-code, quick to set up
- Free
- Built-in Google integration

**Cons:**
- **Cannot edit in Cursor** — it’s a visual builder only
- Limited design and layout control
- Payments require workarounds (e.g. links to external payment pages)
- Not ideal for a resource-heavy site with custom structure

**Verdict:** Not a good fit if editing in Cursor is a priority.

---

### 4. **WordPress on Dreamhost**

**Pros:**
- Dreamhost often includes WordPress
- WooCommerce for payments
- Many themes and plugins

**Cons:**
- Editing in Cursor is limited to theme/plugin files, not the full site
- PHP-based; more moving parts
- Slower and more maintenance than a static site

**Verdict:** Only if you strongly prefer a CMS and don’t need full Cursor control.

---

## Recommended Tech Stack

### Option A: Astro + Netlify (Simpler)

- **Astro:** Fast, content-focused, easy to learn
- **Netlify:** Free tier, Git deploy, forms
- **Stripe:** Checkout links or embedded checkout
- **Videos:** YouTube/Vimeo embeds
- **Images:** Local assets or Netlify CDN

### Option B: Next.js + Vercel (More Features)

- **Next.js:** React-based, API routes, strong ecosystem
- **Vercel:** Native Next.js support
- **Stripe:** Full integration with API routes for webhooks
- **Videos/Images:** Same as above

---

## Payment Integration (Stripe)

For a static/Jamstack site:

1. **Stripe Payment Links** — Easiest: create links in Stripe Dashboard, add to your site
2. **Stripe Checkout** — Redirect to Stripe-hosted page; minimal code
3. **Stripe + Netlify/Vercel Functions** — For webhooks, receipts, and more advanced flows

No backend server is required for basic payments.

---

## Next Steps

1. **Choose stack:** Astro + Netlify (simpler) or Next.js + Vercel (more flexible)
2. **Scaffold project** in this repo and edit in Cursor
3. **Connect repo** to Netlify or Vercel for automatic deploys
4. **Configure DNS** in Dreamhost to point tangotoolkit.com to the host
5. **Add Stripe** when you’re ready for payments

If you tell me which stack you prefer (Astro or Next.js), I can outline or generate the initial project structure for tangotoolkit.com.
