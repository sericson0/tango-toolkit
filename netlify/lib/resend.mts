/**
 * Shared Resend API utility.
 *
 * Provides a thin fetch wrapper that injects the Authorization header
 * and Content-Type so callers don't duplicate boilerplate.
 */

const RESEND_BASE_URL = "https://api.resend.com";

export async function resendFetch(
  path: string,
  apiKey: string,
  body: Record<string, unknown>,
  method: "POST" | "PATCH" = "POST"
): Promise<Response> {
  return fetch(`${RESEND_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
