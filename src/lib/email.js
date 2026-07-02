import emailjs from '@emailjs/browser'

// Client-side email via EmailJS (works on the free Firebase plan — no Cloud
// Function needed). Configure these in .env; if any is missing, sending is a
// no-op so the app keeps working without email set up.
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const APPROVAL_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_APPROVAL_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export const isEmailConfigured = () =>
  Boolean(SERVICE_ID && APPROVAL_TEMPLATE_ID && PUBLIC_KEY)

/**
 * Notify a user that their account was approved.
 * Returns { ok } on success, { skipped } if EmailJS isn't configured.
 * Template variables available: to_email, to_name, app_name, login_url.
 */
export async function sendApprovalEmail({ toEmail, toName }) {
  if (!isEmailConfigured()) return { ok: false, skipped: true }
  await emailjs.send(
    SERVICE_ID,
    APPROVAL_TEMPLATE_ID,
    {
      to_email: toEmail,
      to_name: toName || toEmail,
      app_name: 'Dalevision',
      login_url: window.location.origin + '/login',
    },
    { publicKey: PUBLIC_KEY },
  )
  return { ok: true }
}
