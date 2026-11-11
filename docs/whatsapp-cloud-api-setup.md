# WhatsApp Cloud API setup (automatic fee reminders)

Until this is done, Collections uses **tap-to-send**: the owner taps Remind and WhatsApp opens on their phone with the message and UPI pay link ready. Nothing below is needed for that.

Once this is done, MemberBook sends reminders itself every morning at 9 AM IST from **one MemberBook business number**, with the gym's name in each message.

## 1. Meta Business account
1. Go to business.facebook.com and create a business portfolio named "MemberBook" (use the business's legal name and address).
2. Business settings → Business info: add the website `https://memberbook.in` and a business email on that domain (support@memberbook.in works).

## 2. A dedicated phone number
- Get a new SIM or virtual number that is **not** registered on the WhatsApp or WhatsApp Business app (or delete the WhatsApp account on it first). It must be able to receive an SMS or call once for the code.
- Do not use your personal number (+91 91378 49812): moving it to the Cloud API takes it off the phone app.

## 3. App and WhatsApp product
1. developers.facebook.com → My Apps → Create app → type "Business" → link the MemberBook business portfolio.
2. Add the **WhatsApp** product. In WhatsApp → API Setup, click "Add phone number", enter the dedicated number, set the display name **MemberBook**, verify with the code.
3. Copy the **Phone number ID** (not the phone number itself).
4. Add a payment method in WhatsApp Manager → Payment settings (Meta bills per message; utility messages to India are roughly ₹0.12 to ₹0.15 each).

## 4. Permanent access token
1. Business settings → Users → System users → Add → name "memberbook-server", role Admin.
2. Assign assets: the app (full control) and the WhatsApp account (full control).
3. Generate token → choose the app → expiry **Never** → permissions `whatsapp_business_messaging` and `whatsapp_business_management`. Copy it.
4. App settings → Basic: copy the **App secret**.

## 5. Business verification and display name
- Business settings → Security centre → Start verification (GST certificate, Udyam, or a utility bill in the business name). Takes 1 to 5 working days.
- Until verified, you can message only 250 unique people per day, which is fine for the pilot.
- The display name "MemberBook" is reviewed after verification; it must match the website.

## 6. Message template (needs Meta approval)
WhatsApp Manager → Message templates → Create:
- **Category:** Utility
- **Name:** `fee_reminder`
- **Language:** English (`en`)
- **Body:**
  ```
  Hi {{1}}, this is a reminder from {{2}}. Your {{3}} is due {{4}}. Amount: {{5}}. Tap the button below to pay by UPI. Please ignore this if you have already paid.
  ```
  Sample values: `Rahul`, `Iron Temple Gym`, `Monthly membership renewal`, `on 14 Nov`, `₹1,500`
- **Button:** Call to action → Visit website → "Pay now" → Dynamic URL `https://memberbook.in/pay/{{1}}` (sample `abc123`)

Approval usually takes minutes to a day. If you pick another name or language, set `NUXT_WHATSAPP_CLOUD_TEMPLATE_NAME` / `NUXT_WHATSAPP_CLOUD_TEMPLATE_LANGUAGE`.

## 7. Webhook (delivery ticks)
WhatsApp → Configuration → Webhook:
- Callback URL: `https://memberbook.in/api/webhooks/whatsapp`
- Verify token: any random string; use the same one in `NUXT_WHATSAPP_CLOUD_WEBHOOK_VERIFY_TOKEN`
- Subscribe to the `messages` field.

## 7b. Inbox for incoming messages
Messages to the business number (owners asking for help, members replying to reminders) are saved by the webhook and shown at **/admin/inbox**. You can reply with free text for 24 hours after the person's last message.

- The Meta app must be **published** (App dashboard → Publish) or Meta only sends test webhooks.
- Email alerts: set the secret `NUXT_INBOX_ALERT_EMAIL` to an address that is a verified destination in Cloudflare Email Routing for memberbook.in. Alerts go through the `ALERT_EMAIL` send_email binding in `wrangler.jsonc`, from alerts@memberbook.in.
- Replies need the access token and phone number ID, but not `NUXT_WHATSAPP_CLOUD_ENABLED` (that switch only controls automatic reminders).

## 8. Turn it on (Cloudflare)
Workers & Pages → memberbook → Settings → Variables and secrets. Add as **secrets**:

| Name | Value |
|---|---|
| `NUXT_WHATSAPP_CLOUD_ACCESS_TOKEN` | system user token |
| `NUXT_WHATSAPP_CLOUD_PHONE_NUMBER_ID` | phone number ID |
| `NUXT_WHATSAPP_CLOUD_APP_SECRET` | app secret |
| `NUXT_WHATSAPP_CLOUD_WEBHOOK_VERIFY_TOKEN` | your verify token |

Then add the plain variable `NUXT_WHATSAPP_CLOUD_ENABLED=true` and redeploy. Do this last: it is the switch.

Each gym still has to opt in: Collections → Payment settings → "Send reminders automatically" (needs a UPI ID). Test on your own gym first.

## How automatic reminders behave
- Runs daily at 03:30 UTC (9:00 AM IST), via the cron in `wrangler.jsonc`.
- First reminder `reminder_days_before` days before a renewal (default 3), or as soon as a balance is due.
- Then at most every 3 days, up to 3 reminders per payment. After that the member stays on the Overdue list for the owner to call.
- Skips members who tapped "I have paid" on the pay page, until the owner confirms.
- Renewals lapsed more than 30 days ago are not chased.
