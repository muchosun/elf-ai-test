# Google sign-in for Elf

Server integration uses lib/social-auth.js and Auth.js. The UI now shows Google as the only
social provider on signup and login; email remains as a fallback.

## Google Cloud

OAuth client **Elf Web** belongs to Google Cloud project **elf-pink** and has type **Web application**.
Set the authorized redirect URI exactly to:

    https://elf.pink/api/auth/callback/google

Only basic sign-in scopes are needed: openid, email, profile. Do not reuse the
OAuth credentials of an unrelated product. Configure the consent screen and its
allowed audience in Google Cloud before testing with the intended account.

## Vercel / elf-mavs-checkout / Production

Configure these as server-side Vercel Production variables through the authenticated API; never put their values in chat, Git or VITE_* variables:

- AUTH_URL = https://elf.pink
- AUTH_SECRET = a stable cryptographically random session secret
- AUTH_GOOGLE_ID = the OAuth client ID
- AUTH_GOOGLE_SECRET = the OAuth client secret

A personal Google access token or an API key cannot replace these credentials.
Redeploy after saving environment variables.

## Acceptance

1. /api/auth/status reports google enabled; client secrets never appear there.
2. Google button opens the actual Google account selection/consent flow.
3. Callback returns to Elf; /api/auth/session returns the signed-in identity.
4. Reload preserves the session; logout clears it; repeat login restores the
   same user ID. Cancelled login returns safely and does not create a session.
5. Check signup and login at mobile and desktop widths.

Automated tests currently cover encrypted sessions, CSRF, origin/redirect
restrictions and Google-only social controls. Real Google OAuth is not verified
until the OAuth client and production environment variables are configured.
