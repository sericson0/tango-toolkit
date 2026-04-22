# Music Starter Package on Registration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When someone submits the tango registration form, send them a welcome email containing a link to the Music Starter Package Google Drive folder, and show the same link on the post-registration success page.

**Architecture:** A new Netlify function `/api/register` adds the contact to the Resend audience and sends a tailored welcome email. The register form keeps its `data-netlify="true"` attribute (so Netlify Forms still captures every submission) but a JS submit-interceptor calls `/api/register` first, then submits the form natively. The success page gains a prominent hyperlink to the same Google Drive folder.

**Tech Stack:** Astro, Netlify Functions (`.mts`, Web-standard `Request`/`Response`), Resend API. Existing helpers: `netlify/lib/resend.mts` (fetch wrapper), `netlify/lib/rate-limit.mts` (in-memory limiter). No test framework in repo — verification is via `npm run check` (Astro typecheck) plus manual browser + Resend dashboard checks.

**Reference spec:** [docs/superpowers/specs/2026-04-21-register-music-starter-pack-design.md](../specs/2026-04-21-register-music-starter-pack-design.md)

---

## Task 1: Create `/api/register` Netlify function

**Files:**
- Create: `netlify/functions/register.mts`

**Pattern note:** This function mirrors the structure of `netlify/functions/capture-email.mts` (same rate-limit / audience-add / email-send flow with loud-logging failure philosophy). Use it as a reference if you need extra context on any pattern.

- [ ] **Step 1: Create the function file with full implementation**

Create `netlify/functions/register.mts` with exactly this content:

```typescript
import type { Context } from "@netlify/functions";
import { resendFetch } from "../lib/resend.mts";
import { checkRateLimit } from "../lib/rate-limit.mts";

/**
 * Captures a registration from /dj/register/, adds the contact to the
 * Resend audience, and sends a welcome email containing the Music Starter
 * Package link. Called from JS on form submit (the Netlify Forms submission
 * still happens natively — this function only handles email/audience).
 *
 * Required environment variables:
 *   RESEND_API_KEY     - Resend API key
 *   RESEND_AUDIENCE_ID - Resend Audience ID
 */

const STARTER_PACK_URL =
  "https://drive.google.com/drive/folders/1HtXmrbAP4PekJs3BjziY8KDDL8BQzTs0?usp=sharing";

interface RegisterBody {
  email?: string;
  name?: string;
  focus?: string;
}

function firstName(name: string | undefined): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}

async function sendWelcomeEmail(
  email: string,
  name: string | undefined,
  focus: string | undefined,
  apiKey: string
): Promise<void> {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "The Tango Toolkit <noreply@tangotoolkit.com>";

  const greetingName = firstName(name) || "there";

  const tags: Array<{ name: string; value: string }> = [
    { name: "type", value: "register" },
    { name: "product", value: "starter-pack" },
  ];
  if (focus) {
    tags.push({ name: "focus", value: focus });
  }

  const response = await resendFetch("/emails", apiKey, {
    from: fromEmail,
    to: [email],
    subject: "Welcome to the Tango Toolkit — your Music Starter Package",
    tags,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h1 style="color: #f97316; margin-bottom: 0.5rem;">Hi ${greetingName},</h1>
        <p style="color: #475569; line-height: 1.7;">Thanks for registering with the Tango Toolkit! As promised, here's your Music Starter Package &mdash; a curated folder of music to help you get started on your tango DJ journey.</p>

        <div style="background: #fff7ed; border: 2px solid #fdba74; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; text-align: center;">
          <h2 style="margin-top: 0; color: #ea580c;">Your Music Starter Package</h2>
          <p style="color: #475569; margin: 0.5rem 0 1rem;">A curated Google Drive folder to get you started.</p>
          <a href="${STARTER_PACK_URL}" style="color: #f97316; font-weight: 600; text-decoration: underline;">Open Music Starter Package &rarr;</a>
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
          <h3 style="margin-top: 0; color: #334155;">More from the Tango Toolkit</h3>
          <ul style="color: #475569; line-height: 1.8; padding-left: 1.25rem;">
            <li><a href="https://tangotoolkit.com/dj/starter-kit/" style="color: #f97316;">DJ Starter Kit</a> &mdash; everything you need to start tango DJing</li>
            <li><a href="https://tangotoolkit.com/dj/software/" style="color: #f97316;">DJ Tools</a> &mdash; software built for tango DJs</li>
            <li><a href="https://tangotoolkit.com/dj/resources/" style="color: #f97316;">Discographies</a> &mdash; nearly 15,000 tangos from 40+ artists</li>
            <li><a href="https://tangotoolkit.com/dj/tanda-builder/" style="color: #f97316;">Tanda Builder</a> &mdash; find the perfect tracks for your tandas</li>
          </ul>
        </div>

        <p style="color: #475569; line-height: 1.7;">If you have any questions or feedback, reply to this email or reach out at <a href="mailto:tangotoolkit@gmail.com" style="color: #f97316; text-decoration: underline;">tangotoolkit@gmail.com</a>.</p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0;" />
        <p style="color: #94a3b8; font-size: 0.85rem;">&mdash; Sean Ericson, creator of the Tango Toolkit</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;" />
        <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">
          Don't want these emails? <a href="https://tangotoolkit.com/unsubscribe/?email=${encodeURIComponent(email)}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>.
        </p>
      </div>
    `,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend send failed: ${response.status} ${error}`);
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rateLimited = checkRateLimit(req, "register", {
    max: 5,
    windowSeconds: 60,
  });
  if (rateLimited) return rateLimited;

  const resendApiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!resendApiKey || !audienceId) {
    console.error("Missing RESEND_API_KEY or RESEND_AUDIENCE_ID");
    return new Response("Server configuration error", { status: 500 });
  }

  let body: RegisterBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { email, name, focus } = body;

  if (!email) {
    return new Response("Missing email", { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("Invalid email address", { status: 400 });
  }

  // Add to audience. Resend treats existing contacts as a 200, so re-subscribes
  // are fine. last_name is overridden to "register" as a tracking marker so
  // registrants can be sorted in the audience UI; the user's actual surname
  // lives in Netlify Forms.
  try {
    const audienceRes = await resendFetch(
      `/audiences/${audienceId}/contacts`,
      resendApiKey,
      {
        email,
        first_name: firstName(name),
        last_name: "register",
        unsubscribed: false,
      }
    );
    if (!audienceRes.ok) {
      const errBody = await audienceRes.text();
      console.error(
        `[register] Resend audience add failed for ${email}: ${audienceRes.status} ${errBody}`
      );
    }
  } catch (err) {
    console.error(`[register] Resend audience add threw for ${email}:`, err);
  }

  // Send welcome email. Log failures loudly but still return 200 — the client
  // only calls this as a best-effort before the native form submit, and we
  // don't want a Resend outage to cause browser-side retry loops.
  try {
    await sendWelcomeEmail(email, name, focus, resendApiKey);
  } catch (emailErr) {
    console.error(`[register] Welcome email failed for ${email}:`, emailErr);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/register",
};
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`

Expected: `0 errors`. If it reports errors about the `Context` import or `.mts` extensions, confirm `package.json` has `"type": "module"` and that the same imports in `netlify/functions/capture-email.mts` resolve — the pattern is identical.

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/register.mts
git commit -m "Add /api/register function for registration welcome email"
```

---

## Task 2: Wire the register form to `/api/register`

**Files:**
- Modify: `src/pages/dj/register/index.astro` — replace the existing submit handler (lines 104-107) so it calls `/api/register` before the native submit

**Context:** The current script sets `disabled` + "Registering…" label on submit, then lets the browser do the native Netlify Forms submit. We'll replace that handler with one that *first* fetches `/api/register`, *then* submits the form programmatically. `form.submit()` bypasses the submit event handler so there's no infinite loop.

- [ ] **Step 1: Replace the submit handler**

In `src/pages/dj/register/index.astro`, find this block (around lines 101-107):

```astro
  const registerForm = document.querySelector('form[name="tango-registration"]') as HTMLFormElement;
  const registerBtn = document.getElementById('register-btn') as HTMLButtonElement;

  registerForm?.addEventListener('submit', () => {
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering…';
  });
```

Replace with:

```astro
  const registerForm = document.querySelector('form[name="tango-registration"]') as HTMLFormElement;
  const registerBtn = document.getElementById('register-btn') as HTMLButtonElement;

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering…';

    const email = (document.getElementById('email') as HTMLInputElement).value;
    const name = (document.getElementById('name') as HTMLInputElement).value;
    const focus = (document.getElementById('focus') as HTMLSelectElement).value;

    // Fire the welcome-email endpoint best-effort. Failures must not block
    // the Netlify Forms submission — the registration itself is the source
    // of truth. Cap the wait at 5s so a slow Resend doesn't leave the user
    // staring at a disabled button.
    try {
      await Promise.race([
        fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, focus }),
        }),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
    } catch {
      // swallow — see comment above
    }

    // Programmatic submit bypasses this handler (no recursion) and lets
    // Netlify Forms intercept normally, redirecting to the form's action.
    registerForm.submit();
  });
```

Nothing else in the file changes. The `focusSelect` / experience-field logic above this block is untouched.

- [ ] **Step 2: Typecheck**

Run: `npm run check`

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/dj/register/index.astro
git commit -m "Call /api/register from register form submit to send welcome email"
```

---

## Task 3: Add Music Starter Package link to success page

**Files:**
- Modify: `src/pages/dj/register/success/index.astro`

**Context:** The current success page ([src/pages/dj/register/success/index.astro](../../../src/pages/dj/register/success/index.astro)) shows a centered card with a checkmark, heading, message, and two buttons (DJ Starter Kit / Home). We're adding a highlighted section with the Music Starter Package link above the existing buttons, while keeping the visual style consistent with the rest of the page.

- [ ] **Step 1: Add starter-pack section to the success card**

In `src/pages/dj/register/success/index.astro`, find this block (around lines 6-18):

```astro
<BaseLayout title="Registration Complete" description="Thank you for registering for Tango Toolkit resources.">
  <section class="success-page">
    <div class="container narrow-sm">
      <div class="success-card">
        <div class="checkmark">&#10003;</div>
        <h1>You're registered!</h1>
        <p>Thank you for signing up. We'll keep you posted on new resources and tools for the tango community.</p>
        <div class="success-links">
          <a href="/dj/starter-kit/" class="btn btn-primary">DJ Starter Kit &rarr;</a>
          <a href="/" class="btn btn-secondary">Home</a>
        </div>
      </div>
    </div>
  </section>
</BaseLayout>
```

Replace with:

```astro
<BaseLayout title="Registration Complete" description="Thank you for registering for Tango Toolkit resources.">
  <section class="success-page">
    <div class="container narrow-sm">
      <div class="success-card">
        <div class="checkmark">&#10003;</div>
        <h1>You're registered!</h1>
        <p>Thank you for signing up. We'll keep you posted on new resources and tools for the tango community.</p>

        <div class="starter-pack-card">
          <h2>Your Music Starter Package</h2>
          <p>A curated Google Drive folder of music to help you get started on your tango DJ journey.</p>
          <p class="starter-pack-link">
            <a href="https://drive.google.com/drive/folders/1HtXmrbAP4PekJs3BjziY8KDDL8BQzTs0?usp=sharing" target="_blank" rel="noopener noreferrer">Open Music Starter Package &rarr;</a>
          </p>
          <p class="starter-pack-note">We&rsquo;ve also sent this link to your email.</p>
        </div>

        <div class="success-links">
          <a href="/dj/starter-kit/" class="btn btn-primary">DJ Starter Kit &rarr;</a>
          <a href="/" class="btn btn-secondary">Home</a>
        </div>
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Add the corresponding CSS**

In the same file, find the existing `<style>` block. Add these rules after the `.success-card p` rule (the existing style for the intro paragraph), before the `.success-links` rule:

```css
  .starter-pack-card {
    background: linear-gradient(135deg, var(--color-orange-50) 0%, white 100%);
    border: 2px solid var(--color-orange-300);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    margin: 0 auto 2rem;
    max-width: 480px;
    text-align: left;
  }

  .starter-pack-card h2 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    color: var(--color-orange-700);
  }

  .starter-pack-card p {
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
    color: var(--color-slate-600);
    max-width: none;
  }

  .starter-pack-link {
    margin: 1rem 0 0.5rem;
    font-size: 1rem;
  }

  .starter-pack-link a {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: underline;
  }

  .starter-pack-link a:hover {
    color: var(--color-primary-hover);
  }

  .starter-pack-note {
    font-size: 0.85rem;
    color: var(--color-slate-500);
    font-style: italic;
    margin: 0.5rem 0 0;
  }
```

Note: `.success-card p` has `max-width: 40ch` set on it (which would cause wrapping inside the starter-pack card). The `max-width: none` override inside `.starter-pack-card p` defeats that inheritance.

- [ ] **Step 3: Typecheck**

Run: `npm run check`

Expected: `0 errors`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/dj/register/success/index.astro
git commit -m "Show Music Starter Package link on register success page"
```

---

## Task 4: Manual end-to-end verification

**No code changes.** This task confirms the feature works once the previous three tasks are deployed (or running under `netlify dev` locally).

**Local dev setup (if verifying before pushing):**

Prerequisite env vars must be set in your local `.env` — at minimum `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, and optionally `RESEND_FROM_EMAIL`. See `.env.example`.

Run: `npx netlify dev`

This boots both the Astro dev server and the Netlify Functions runtime on a single port (usually `http://localhost:8888`), so the `/api/register` path resolves correctly. Plain `npm run dev` does NOT run functions — use `netlify dev`.

- [ ] **Step 1: Submit the register form**

In the browser, open `http://localhost:8888/dj/register/` (or the deployed URL). Fill out:
- Name: a name you'll recognize
- Email: an inbox you can check
- Primary Interest: any option
- (optional fields as you like)

Click **Register**.

Expected: brief "Registering…" label on the button, then redirect to `/dj/register/success/`.

- [ ] **Step 2: Verify success page**

On the success page, confirm:
- The highlighted "Your Music Starter Package" card is visible between the greeting and the DJ Starter Kit / Home buttons.
- Clicking **Open Music Starter Package →** opens the Google Drive folder in a new tab.
- The "We've also sent this link to your email." note is visible.

- [ ] **Step 3: Verify welcome email**

Within ~1 minute, check the inbox of the email you used. You should receive a message:
- Subject: `Welcome to the Tango Toolkit — your Music Starter Package`
- From: whatever `RESEND_FROM_EMAIL` is set to (default: `The Tango Toolkit <noreply@tangotoolkit.com>`)
- Greeting uses your first name
- Body contains the orange-bordered Music Starter Package section with a working link to the Google Drive folder
- "More from the Tango Toolkit" section has four working links (Starter Kit, DJ Tools, Discographies, Tanda Builder)
- Unsubscribe link at the bottom points to `/unsubscribe/?email=...`

- [ ] **Step 4: Verify Resend dashboard tracking**

Log in to Resend (resend.com → your account).

Under **Audiences** → your audience: find the new contact. Confirm `last_name` is `register`.

Under **Emails** (the send log): find the newly-sent email. Click it and confirm the tags include:
- `type = register`
- `product = starter-pack`
- `focus = <whatever you selected>` (only if you picked something)

- [ ] **Step 5: Verify Netlify Forms still captures**

Netlify dashboard → your site → **Forms** → `tango-registration`. Confirm a new submission appears with all the fields you filled in. This proves the JS-interceptor still lets the native Netlify Forms flow complete.

- [ ] **Step 6: Failure-path smoke test (optional but recommended)**

In Netlify env vars (or your local `.env`), temporarily rename `RESEND_API_KEY` to `RESEND_API_KEY_BROKEN`. Redeploy (or restart `netlify dev`).

Submit the form again.

Expected:
- Success page still displays (registration not blocked).
- No email arrives.
- Netlify function logs show `[register] Missing RESEND_API_KEY or RESEND_AUDIENCE_ID` or a 500 response.
- Netlify Forms dashboard still shows the new submission.

Restore the env var name afterwards.

- [ ] **Step 7: Final smoke**

Pick a second test email and run through Step 1 again to confirm the rate limit (5/min) doesn't break a user who comes back shortly after. No commit needed — this is purely verification.

---

## Rollout notes

- **No new env vars** — the function reuses `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, and optionally `RESEND_FROM_EMAIL`, all of which are already provisioned (same ones `capture-email.mts` uses).
- **Deploy flow:** push the three commits; Netlify's next deploy picks up the new function automatically. No manual function registration needed — Netlify auto-discovers files in `netlify/functions/`.
- **Rollback:** reverting all three commits (or just the register-form commit in Task 2) immediately returns the form to its pre-change behavior. The `/api/register` endpoint existing without callers is harmless.
