---
name: send-wa
description: Send a WhatsApp message to any phone number in the MemberBook project. Use this skill whenever the user wants to send a WhatsApp message, text someone on WhatsApp, message a customer/lead/member, or send a file/document over WhatsApp. Triggers on phrases like "send WhatsApp to", "message X on WhatsApp", "WhatsApp this to", "send a WA message", "send onboarding message", "message this number".
---

# Send WhatsApp Message

Send a WhatsApp message (text and/or file) to any number using `scripts/send-wa.mjs`.

## Gather required info (ask if not provided)

- **Phone** — Indian mobile number (10 digits or with +91)
- **Message** — full text to send (supports multi-line, WhatsApp bold with `*text*`, etc.)
- **File** (optional) — file path to attach

## Run the script

**Text only:**
```
node scripts/send-wa.mjs --to <phone> --message "<text>"
```

**With file attachment:**
```
node scripts/send-wa.mjs --to <phone> --message "<text>" --file <path>
```

**Long/multi-line message** — write the message to a `.txt` file first, then:
```
node scripts/send-wa.mjs --to <phone> --message-file <path-to-txt>
```

## Examples

```
node scripts/send-wa.mjs --to 9820657515 --message "Hi! Your account is ready."

node scripts/send-wa.mjs --to 9820657515 --message "See the report attached." --file reports/june.pdf

node scripts/send-wa.mjs --to 9137849812 --message-file scripts/onboarding-msg.txt --file bhagat-fitness-members-sample.csv
```

## Session / QR code

- First run: a QR code appears in the terminal — scan it with WhatsApp on Pravin's phone (9137849812)
- Session is saved to `outreach/.wa-session/` — subsequent runs connect automatically
- If logged out or session broken: delete `outreach/.wa-session/` and run again

## Troubleshooting

| Problem | Fix |
|---------|-----|
| QR code doesn't scan | Make sure WhatsApp → Linked Devices → Link a Device |
| "Logged out" error | Delete `outreach/.wa-session/` and rerun |
| Message not delivered | Check number is on WhatsApp; verify no typo in phone |
| Connection closes | Wait a minute and retry |
