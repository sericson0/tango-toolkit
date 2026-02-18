# Domain Setup: tangotoolkit.com → Netlify

Your code is now at **https://github.com/sericson0/tango-toolkit**

Follow these steps to deploy and connect your domain.

---

## Step 1: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in (or create an account)
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** and authorize Netlify
4. Select the **sericson0/tango-toolkit** repository
5. Netlify will auto-detect the build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy site**

Your site will be live at `something-random.netlify.app` in a few minutes.

---

## Step 2: Add Custom Domain in Netlify

1. In your Netlify site dashboard, go to **Domain management** (or **Domain settings**)
2. Click **Add custom domain** or **Add domain alias**
3. Enter **tangotoolkit.com**
4. Netlify will also prompt you to add **www.tangotoolkit.com** — add it
5. Netlify will show you the DNS records you need (see Step 3)

---

## Step 3: Update DNS at Dreamhost

You keep your domain registered at Dreamhost — you're only changing where it points.

1. Log in to [Dreamhost](https://panel.dreamhost.com)
2. Go to **Domains** → **Manage Domains**
3. Find **tangotoolkit.com** and click **DNS** (or **Edit**)

### Option A: Use Netlify DNS (Recommended)

1. In Netlify Domain settings, click **Verify** next to your domain
2. Netlify will show instructions to **Change nameservers**
3. In Dreamhost, change the nameservers for tangotoolkit.com to:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```
   (Netlify will show the exact nameservers — they may vary)

### Option B: Keep Dreamhost DNS (A/CNAME Records)

If you prefer to keep DNS at Dreamhost, add these records. **Netlify will show the exact values** when you add your domain:

| Type  | Name | Value                    |
|-------|------|--------------------------|
| A     | @    | (Netlify provides this — check Domain settings) |
| CNAME | www  | [your-site].netlify.app  |

Replace `[your-site]` with your actual Netlify subdomain (e.g. `serene-tulip-abc123.netlify.app`).

---

## Step 4: SSL (HTTPS)

Netlify provides free SSL. Once DNS propagates (usually 5–60 minutes):

1. Netlify will automatically issue an SSL certificate
2. HTTPS will work for both tangotoolkit.com and www.tangotoolkit.com

---

## Step 5: Redirect www (Optional)

In Netlify Domain settings, you can set:
- **Primary domain:** tangotoolkit.com (so www redirects to non-www)
- Or **Primary domain:** www.tangotoolkit.com (so non-www redirects to www)

---

## Summary

| Step | Action |
|------|--------|
| 1 | Deploy repo to Netlify |
| 2 | Add tangotoolkit.com as custom domain |
| 3 | Update DNS at Dreamhost (nameservers or A/CNAME) |
| 4 | Wait for DNS propagation (up to 48 hours, often faster) |
| 5 | SSL activates automatically |

---

## Troubleshooting

- **"Domain not verified"** — DNS can take up to 48 hours to propagate. Check status at [dnschecker.org](https://dnschecker.org)
- **"Site not found"** — Ensure the publish directory is `dist` and the build succeeds
- **Dreamhost DNS** — Dreamhost’s DNS panel is under Domains → Manage → DNS
