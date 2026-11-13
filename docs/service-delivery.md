# Delivering add-on services (AI routine)

Owners switch on add-ons from **Add-ons** (`/dashboard/add-ons`). Some of them create work for us: a website to build, a change to a website, a reply to a Google review, or a monthly review summary. A scheduled Claude Code routine runs every hour and works through that queue with `scripts/services.mjs`, which needs `MEMBERBOOK_SERVICES_TOKEN` (the production `NUXT_AI_WORKER_SERVICES_TOKEN`) in the environment. That token only opens the service-request endpoints; never give the task the master admin token.

Websites are never shown to the owner straight away. The routine hands in a draft, the admin checks it on `/admin/services` and approves it or sends it back with a note, and only then can the owner preview and publish it. Review replies and summaries go to the owner directly.

## Each run

1. `node scripts/services.mjs list` lists new requests. If there are none, stop.
2. For each request, oldest first:
   1. `node scripts/services.mjs claim <id>`. If the claim fails, another run has it, so skip it.
   2. `node scripts/services.mjs show <id>` prints the business, the owner's input and, for websites, the details, photos and plans.
   3. Do the work as described below for the request's `type`.
   4. If the request can't be done (for example a website with no usable photos, or a "review" that is empty or abusive), run `node scripts/services.mjs fail <id> "<message for the owner>"`. Write it in simple English and say what to send instead.

## Websites (`website_build`, `website_change`)

1. `node scripts/services.mjs download <id> /tmp/site-<id>` saves the logo and photos and, for a change, the current page as `current.html`. Look at every photo before you choose where it goes.
2. If `adminNote` is set, the admin sent an earlier draft back. Fix every point in it.
3. For `website_change`, start from `current.html` and change only what `input.change` asks for (plus anything in `adminNote`).
4. For `website_build`, research before you write:
   - Open the owner's `googleMapsUrl` and `instagram` if they gave them, and search the web for the business name and area. Use them to understand the style, what the place is known for and what members praise. Do **not** copy photos, review text or anything else from Google or Instagram onto the page. Only the owner's own details and uploaded photos go on the site.
5. Write the whole page to `/tmp/site-<id>/index.html` and check it at phone width (390 px) and desktop width (1280 px) with Playwright screenshots before handing it in.
6. `node scripts/services.mjs deliver-site <id> /tmp/site-<id>/index.html "<one or two lines for the admin: what you made or changed>"`.

### What the page must be

It should look like a local agency charged ₹6,000 to ₹10,000 for it, made for this business, not a template.

- **One self-contained HTML file.** Inline CSS in a `<style>` tag. Google Fonts via `<link>` are fine. **No JavaScript at all**: no `<script>` tags (except the JSON-LD block below), no `onclick=` style attributes and no `javascript:` links. The server refuses pages that have them, and the site is served with a policy that blocks scripts anyway. Use CSS for anything interactive (`<details>` for FAQs, anchor links for the menu).
- **Phone first.** Most visitors are on a phone. Big tap targets, readable text (16 px or more), no horizontal scrolling.
- **Real content only.** Use the owner's details, the plans and prices from `plans` (prices are in rupees), their photos, their hours and their address. Never invent reviews, testimonials, member counts, awards, years in business, trainer certificates or prices. If something is missing, leave that section out.
- **Photos:** use the `src` paths that `show` prints (`/s/<slug>/img/<n>`), with good `alt` text. Use the logo in the header if there is one; if not, set the business name in a strong typeface. Put the best, brightest photo at the top.
- **Sections** (leave out any without real content): header with name and a call button; hero with one clear line about the business and two buttons (WhatsApp and call); about; facilities or classes; plans and prices; trainers; photo gallery; timings; location with a Google Maps embed; enquiry form; footer.
- **Buttons:** WhatsApp `https://wa.me/91<10 digits>?text=<url-encoded hello message>`, call `tel:+91<10 digits>`.
- **Map:** `<iframe src="https://www.google.com/maps?q=<url-encoded name and address>&output=embed" loading="lazy" ...>`.
- **Enquiry form** (enquiries land in the owner's MemberBook):

  ```html
  <form method="post" action="/s/<slug>/enquiry">
    <input name="name" required> <input name="phone" type="tel" required>
    <select name="interest">…their plans or classes…</select>
    <textarea name="message"></textarea>
    <input name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
    <button>Send</button>
  </form>
  ```

  Keep the hidden `company` field exactly as shown. It catches spam bots.
- **Install as an app:** in `<head>` add `<link rel="manifest" href="/s/<slug>/manifest.webmanifest">`, `<meta name="theme-color" content="<main colour>">`, and an `apple-touch-icon` pointing at the logo if there is one. Add a short line near the footer: "Add this site to your home screen to open it like an app."
- **Footer credit:** end the footer with a small, quiet line: `Website by <a href="https://memberbook.in/?utm_source=customer_site&utm_medium=footer">MemberBook</a>`. Keep it to one line, in the footer text colour, never in the header or hero.
- **SEO:** a `<title>` like "Iron Temple Gym in Kharghar, Navi Mumbai | Plans and timings", a meta description, Open Graph tags with the hero photo, and `LocalBusiness` (or `ExerciseGym`) JSON-LD in `<script type="application/ld+json">`. That is the only `<script>` tag the server accepts, and it must use exactly that `type` attribute.
- **Design:** pick colours from the logo or the owner's `colours` note. One display font for headings and one clean text font. Generous spacing, strong contrast (text at least 4.5:1), no stock-photo clichés, no lorem ipsum, no emoji as icons. Keep the file under 300 KB.
- **Language:** simple English. If the owner wrote in Hindi or Hinglish, you may add a short Hindi line in the hero, but keep the main text in English unless the owner asked otherwise.

## Review replies (`review_reply`)

`input.text` is the review, with optional `reviewer`, `rating` (1 to 5) and `tone` (something the owner wants mentioned, for example "AC was fixed last week").

Write one reply the owner can paste under the review on Google:

- 2 to 4 short sentences, in the language of the review (English, Hindi or Hinglish).
- Thank them by first name if given. Mention one specific thing they said.
- For a complaint: apologise without arguing, say what has been or will be done (only what the owner told you in `tone`; never promise anything else), and invite them to talk to the owner directly.
- Sign off with the business name. No emoji walls, no hashtags, no offers or discounts unless the owner asked.

Save it to a file and run `node scripts/services.mjs deliver-text <id> <file>`.

## Review summaries (`review_summary`)

`input.text` is a pile of reviews the owner pasted. Write a short report in simple English:

1. **In one line:** the overall picture.
2. **What members love** (3 to 5 points, each with how often it comes up).
3. **What to fix** (the complaints, most frequent first, each with one practical suggestion).
4. **Reviews that still need a reply**, if you can tell.
5. **One thing to do this month.**

Keep it under 300 words. Don't quote reviewers by full name. Deliver it with `deliver-text`.
