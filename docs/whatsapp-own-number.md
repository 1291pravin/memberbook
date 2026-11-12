# Reminders from the business's own WhatsApp (embedded signup)

Add-on `own_number` ("Reminders from your own WhatsApp"). A business connects its own
WhatsApp Business number with Meta's embedded signup ("Connect with WhatsApp") on
`/dashboard/add-ons/whatsapp`. MemberBook becomes a Tech Provider on the business's
WhatsApp Business account (WABA): the business keeps owning the account and number,
and we store a business token (encrypted) that can send from it.

The add-on is `ready: false`, so only businesses an admin switches it on for (on
`/admin/services`) can use it. MemberBook's own number (+91 91378 49812) is not touched.

## How it works

1. The owner taps **Connect my WhatsApp Business app** (coexistence: the number stays on
   the WhatsApp Business app) or **Connect a new number**.
2. Meta's JS SDK opens the signup popup (`FB.login` with our configuration id,
   `response_type: code`, `featureType: whatsapp_business_app_onboarding` for the app path).
3. The popup posts `WA_EMBEDDED_SIGNUP` with the WABA id and phone number id; the login
   callback returns a one-time code.
4. `POST /api/orgs/:orgId/add-ons/whatsapp/connect` (`server/utils/whatsapp-own.ts`):
   - swaps the code for a business token (`/oauth/access_token`, app id + app secret),
   - checks with `debug_token` that the token really covers that WABA,
   - checks the phone number belongs to the WABA,
   - subscribes our app to the WABA's webhooks,
   - registers a new number for the Cloud API with a random PIN (not needed for coexistence),
   - creates the `fee_reminder` template on the business's WABA (same text and Pay button
     as ours),
   - saves everything in `org_whatsapp_accounts` (token and PIN AES-GCM encrypted).
5. When the template is APPROVED (webhook `message_template_status_update`, or the owner
   taps **Check again**), and the owner switched on automatic reminders on the Fees due
   page, reminders go out from the business's number: manual Cloud sends and the daily
   09:00 IST job (`reminderSending()` picks the sender per business).
6. Messages sent to a business's own number are not saved in MemberBook's admin inbox.
   `account_update` / `PARTNER_REMOVED` (the business removed us in Meta) disconnects.

## Settings

| Variable | What |
| --- | --- |
| `NUXT_PUBLIC_WHATSAPP_SIGNUP_APP_ID` | Meta app id (in `wrangler.jsonc`, 2076715572848640) |
| `NUXT_PUBLIC_WHATSAPP_SIGNUP_CONFIG_ID` | Facebook Login for Business configuration id (see below) |
| `NUXT_WHATSAPP_CLOUD_APP_SECRET` | Already set (webhook signatures); also used for the code exchange |
| `NUXT_WHATSAPP_CLOUD_TOKEN_KEY` | Optional key for encrypting stored tokens. Defaults to the session password. If you set it later, businesses must connect again. |

Until the config id is set, the page says "Almost ready" and the connect endpoint refuses.

## Meta setup (one time, in the MB Front Desk app)

1. App dashboard → Add product → **Facebook Login for Business**.
2. Facebook Login for Business → Settings: add `memberbook.in` to Allowed domains for the
   JavaScript SDK, and turn on "Login with the JavaScript SDK".
3. Facebook Login for Business → **Configurations** → Create → template
   "WhatsApp Embedded Signup" (login variation: WhatsApp Embedded Signup), assets: WhatsApp
   accounts, permissions `whatsapp_business_management` and `whatsapp_business_messaging`.
   Copy the configuration id into `NUXT_PUBLIC_WHATSAPP_SIGNUP_CONFIG_ID` (Cloudflare var).
4. WhatsApp → Configuration → Webhook fields: subscribe to `messages`,
   `message_template_status_update` and `account_update`.
5. **Tech Provider**: business verification is done (2026-11-12). Then App Review for
   advanced access to `whatsapp_business_management` and `whatsapp_business_messaging`
   (screencast of this signup flow + sending a template), and Access Verification
   (WhatsApp → Quickstart / "Become a Tech Provider"). Until approved, only people with a
   role on the app (admins/testers) can complete the signup, which is enough to test.

## Testing

Test orgs only (42, 46). Switch the add-on on for the org on `/admin/services`, open
`/dashboard/add-ons/whatsapp` as its owner and connect a test number. A coexistence test
needs a WhatsApp Business app number with recent activity; a "new number" test needs a SIM
that is not on WhatsApp.
