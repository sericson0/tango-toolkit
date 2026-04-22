# Music Starter Package delivery on registration

**Date:** 2026-04-21
**Status:** Approved for implementation

## Motivation

The Starter Kit page already tells users they'll get a "music starter pack" for registering ([src/pages/dj/starter-kit/index.astro:17](../../../src/pages/dj/starter-kit/index.astro)), but nothing currently delivers on that promise. The register form ([src/pages/dj/register/index.astro](../../../src/pages/dj/register/index.astro)) collects submissions via Netlify Forms and redirects to a generic success page — no email is sent, no asset is shared.

This project closes that loop by delivering a link to the Music Starter Package Google Drive folder (`https://drive.google.com/drive/folders/1HtXmrbAP4PekJs3BjziY8KDDL8BQzTs0?usp=sharing`) both on the success page and in a welcome email. Every registrant — regardless of their selected focus (dance / DJ / organizer / everything) — receives the package.

## Scope

In scope:
- New Netlify function to send a registration welcome email via Resend
- Updates to the register form to trigger the email while preserving Netlify Forms dashboard capture
- Updates to the success page to show the starter-package link
- Tagging email + audience contact so registrations are distinguishable from product-download signups

Out of scope:
- Replacing or removing Netlify Forms capture
- Gating the starter-package link by focus/experience (everyone gets it)
- Restricting Google Drive access — the existing `?usp=sharing` link is acceptable as-is
- Changes to the Starter Kit page — its existing call-to-action now delivers

## Architecture

Three changes:

1. **New function** `netlify/functions/register.mts` mounted at `/api/register`
2. **Modified form** `src/pages/dj/register/index.astro` intercepts submit to call `/api/register` before Netlify Forms handles the submission
3. **Modified success page** `src/pages/dj/register/success/index.astro` shows a hyperlink to the Google Drive folder

No new environment variables — reuses the existing Resend config (`RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_FROM_EMAIL`).

### Data flow

```
User fills register form
  |
  v
Form submit intercepted (JS)
  |
  +--> POST /api/register (fire-and-catch)
  |      |
  |      +--> Add contact to Resend audience (last_name="register")
  |      +--> Send welcome email (tags: type=register, product=starter-pack)
  |
  v
Native form.submit() -> Netlify Forms captures submission
  |
  v
Netlify 303 -> /dj/register/success/ (shows starter-pack hyperlink)
```

The `/api/register` call runs *before* the native submit. If it fails (network error, Resend outage, rate-limited), the native submit still fires, so the user's registration is never blocked by an email-side failure.

## Component: `netlify/functions/register.mts`

**Path:** `/api/register`
**Method:** POST only (returns 405 otherwise)
**Rate limit:** 5 requests per 60 seconds per IP (reuse `checkRateLimit` helper, same config as `capture-email.mts`)

**Request body:**
```json
{
  "email": "user@example.com",
  "name": "optional display name",
  "focus": "dj|dance|organizer|everything"
}
```

Only `email` is required. When present:
- `name` is used in the email greeting (e.g. "Hi Sean,") and split into `first_name` / `last_name` for the Resend audience contact — but note `last_name` is *overridden* to the string `"register"` (see tracking markers below), so the user's actual surname is not stored in that slot. The Resend contact is intentionally a tracking record, not a source of truth for identity; names of record live in the Netlify Forms dashboard.
- `focus` is included as an email tag (`{ name: "focus", value: focus }`) alongside the other tags, so you can filter registration emails by interest area in the Resend dashboard.

If `name` is absent, the email greeting falls back to "Hi there,".

**Behaviour:**

1. Validate method → 405 if not POST
2. Rate-limit check → 429 if exceeded
3. Verify `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` are set → 500 with `Server configuration error` if missing
4. Parse JSON body → 400 if invalid
5. Validate email with same regex as `capture-email.mts` → 400 if invalid
6. Add contact to Resend audience with `last_name: "register"` (logs and swallows failures — same pattern as [capture-email.mts:141-163](../../../netlify/functions/capture-email.mts))
7. Send welcome email via Resend (logs and swallows failures)
8. Return `200 { "ok": true }`

The function never blocks on Resend failures — the audience-add and email-send are both wrapped in try/catch with loud logging. This matches the project's established philosophy.

**Welcome email:**

- **From:** `process.env.RESEND_FROM_EMAIL` (fallback: `"The Tango Toolkit <noreply@tangotoolkit.com>"`)
- **Subject:** `"Welcome to the Tango Toolkit — your Music Starter Package"`
- **Tags:** `[{ name: "type", value: "register" }, { name: "product", value: "starter-pack" }]`, plus `{ name: "focus", value: focus }` if `focus` was provided
- **Content (HTML):** matches the visual style of the existing welcome email in [capture-email.mts:63-87](../../../netlify/functions/capture-email.mts). Structure:
  1. Greeting
  2. Prominent Music Starter Package section with the Google Drive link as a plain hyperlink
  3. "More from the Tango Toolkit" section with the same four links the existing welcome uses (Starter Kit, DJ Tools, Discographies, Tanda Builder)
  4. Contact / unsubscribe footer (same as existing welcome)

The Google Drive URL is a module-level constant in `register.mts` so updating the folder in the future is a one-line change.

## Component: register form update

File: [src/pages/dj/register/index.astro](../../../src/pages/dj/register/index.astro)

Add a submit interceptor to the existing script block. Pseudocode:

```ts
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerBtn.disabled = true;
  registerBtn.textContent = 'Registering…';

  const email = (document.getElementById('email') as HTMLInputElement).value;
  const name = (document.getElementById('name') as HTMLInputElement).value;
  const focus = (document.getElementById('focus') as HTMLSelectElement).value;

  try {
    await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, focus }),
    });
  } catch {
    // swallow — do not block Netlify Forms submission on email failure
  }

  registerForm.submit();
});
```

Note: `form.submit()` bypasses the submit event listener (no infinite loop). The existing `focusSelect` / experience-field toggle logic is unaffected.

Retain `data-netlify="true"` and the `netlify-honeypot` field — Netlify Forms continues to capture all submissions.

## Component: success page update

File: [src/pages/dj/register/success/index.astro](../../../src/pages/dj/register/success/index.astro)

Add a highlighted section above the existing success-links buttons containing:

- Heading: "Your Music Starter Package"
- One-sentence description (e.g. "A curated Google Drive folder of music to help you get started.")
- A plain hyperlink reading "Open Music Starter Package →" pointing to the Google Drive URL, opening in a new tab (`target="_blank" rel="noopener noreferrer"`)
- A note that the same link was also sent to their email

The existing `.success-links` row (DJ Starter Kit, Home) remains.

The Google Drive URL is hardcoded in the success page (same URL as in `register.mts`). If this URL needs to change in the future, both files must be updated — acceptable given the rarity of changes.

## Distinctness / tracking

Two markers, each queryable without code changes:

- **Audience:** contact `last_name: "register"` in the Resend audience. Matches the convention in `capture-email.mts` which writes `last_name: product.id` for product-download signups. Sortable in the Resend audience UI.
- **Email:** tags `type=register` and `product=starter-pack`. Filterable in the Resend emails log.

These two are independent: a registrant who later downloads TigerTanda will have one audience contact (last updated by the latest signup) but two separate email records in the Resend log, each tagged distinctly.

## Error handling

| Failure mode | User impact | Observability |
|---|---|---|
| Rate limit exceeded on `/api/register` | Email not sent; registration still goes through Netlify Forms; success page still shows starter-pack link | 429 in Netlify function logs |
| `RESEND_API_KEY` or `RESEND_AUDIENCE_ID` missing | Same as above — registration goes through; no email | `console.error` in function logs |
| Resend audience add fails | Registration and email still succeed if email-send works | `console.error` with email + error details |
| Resend email send fails | Registration goes through; user sees starter-pack link on success page but no email | `console.error` with email + error details |
| `/api/register` unreachable (network) | Native form submit still fires; registration captured by Netlify Forms; no email | Browser console (silently caught) |

The common thread: registration is always captured in Netlify Forms, and the starter-pack link is always visible on the success page. The email is a nice-to-have that degrades gracefully.

## Testing / verification

Manual checks after deploy:

1. Submit the register form with a real email address
2. Confirm redirect to `/dj/register/success/`
3. Confirm the Music Starter Package hyperlink is visible and clicks through to Google Drive
4. Check inbox for the welcome email; verify:
   - Subject includes "Music Starter Package"
   - The Google Drive link in the email works
   - "More from Tango Toolkit" links are present
5. In Resend dashboard:
   - **Audience:** new contact exists with `last_name: "register"`
   - **Emails:** new email has tags `type=register` and `product=starter-pack`
6. In Netlify Forms dashboard: submission appears with name, email, focus, and other fields
7. Failure check: temporarily break `RESEND_API_KEY` in Netlify env, register again, verify registration still captured by Netlify Forms and success page still shows the link

## Open questions

None. The design above reflects approved decisions from brainstorming.
