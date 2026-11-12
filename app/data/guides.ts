/**
 * Long-form guides served at /guides/<slug>. Each one opens with a short,
 * quotable answer (for readers, featured snippets and AI answers), then the
 * detail, then real FAQs (rendered as FAQPage schema).
 *
 * Honesty rules (see project memory): no invented stats, ratings or customer
 * counts, and don't claim reminders go out automatically until automatic
 * WhatsApp sending is switched on. Today the owner sends each reminder in one
 * tap, with the amount and a UPI pay link already filled in.
 */

export type GuideCategory = "library" | "coaching" | "gym" | "templates" | "comparison";

export interface GuideFaq {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  category: GuideCategory;
  /** H1 on the page. */
  title: string;
  /** <title>, under ~60 characters where possible. */
  metaTitle: string;
  /** Meta description, ~150 characters, leads with the answer. */
  description: string;
  /** One to three plain sentences that answer the question on their own. */
  answer: string;
  /** HTML body. */
  content: string;
  faqs: GuideFaq[];
  publishedISO: string;
  updatedISO: string;
  related?: string[];
}

export const guideCategories: Record<GuideCategory, { label: string; blurb: string }> = {
  library: {
    label: "Study libraries and reading rooms",
    blurb: "Seats, shifts and monthly fees for self-study libraries, reading rooms and abhyasikas.",
  },
  coaching: {
    label: "Coaching classes and tuition centres",
    blurb: "Batches, fee registers and reminders to parents.",
  },
  gym: {
    label: "Gyms and fitness studios",
    blurb: "Memberships, renewals and forms.",
  },
  templates: {
    label: "Free templates",
    blurb: "Copy-paste messages and formats you can use today, with or without software.",
  },
  comparison: {
    label: "Comparisons",
    blurb: "Honest side-by-side looks at the ways owners keep track of members and fees.",
  },
};

const PUBLISHED = "2026-11-13";

export const guides: Guide[] = [
  // ───────────────────────────── Library ─────────────────────────────
  {
    slug: "library-seat-management-software",
    category: "library",
    title: "Library Seat Management Software for Study Libraries in India",
    metaTitle: "Library Seat Management Software (Free) for India",
    description: "Free seat management software for self-study libraries in India: assign seats by shift, see empty seats, track monthly fees and send WhatsApp reminders with a UPI link.",
    answer: "Library seat management software keeps a live map of every seat in your study library: who sits where, in which shift, and whether their fee for this month is paid. MemberBook does this for free, and will load your existing seat register for you.",
    content: `
<h2>What seat management software should do</h2>
<p>A self-study library sells seats, not books. So the software has to answer three questions every day: which seats are free, who is sitting where, and who has not paid this month. Anything else is extra.</p>
<ul>
  <li><strong>Seat map:</strong> every seat numbered, with the student assigned to it.</li>
  <li><strong>Shifts or batches:</strong> morning, afternoon, evening or full-day, so one seat can be sold twice.</li>
  <li><strong>Due dates:</strong> each student's next fee date, worked out from when they joined.</li>
  <li><strong>Reminders:</strong> a WhatsApp message with the amount and a UPI pay link, sent before the due date.</li>
  <li><strong>Vacancy view:</strong> empty seats per shift, so you can answer an enquiry in seconds.</li>
</ul>

<h2>How it works in MemberBook</h2>
<ol>
  <li>Send us a photo of your seat register or your Excel sheet. We create your seats, shifts and students for you.</li>
  <li>Open <strong>Seats</strong> to see the seat map by shift. Tap a seat to assign or free it.</li>
  <li>Every morning, <strong>Fees due</strong> lists who to collect from today and who is overdue.</li>
  <li>Tap a name to send a WhatsApp reminder. The amount and a UPI link to your own UPI ID are already in the message, so the student can pay in one tap.</li>
</ol>
<p>Students install nothing. Money goes straight to your UPI ID, and MemberBook never holds it.</p>

<h2>Free seat chart template</h2>
<p>Not ready for software yet? Copy this layout into a notebook or Excel. One row per seat, one column per shift:</p>
<table>
  <thead><tr><th>Seat</th><th>Morning (6–12)</th><th>Afternoon (12–6)</th><th>Evening (6–11)</th><th>Fee due on</th></tr></thead>
  <tbody>
    <tr><td>A1</td><td>Riya S. (paid)</td><td>—</td><td>Aman K. (due)</td><td>5th</td></tr>
    <tr><td>A2</td><td>Full day: Neha P.</td><td>Full day</td><td>Full day</td><td>12th</td></tr>
    <tr><td>A3</td><td>—</td><td>Rahul M. (paid)</td><td>—</td><td>20th</td></tr>
  </tbody>
</table>
<p>A dash means the seat is free in that shift. When the sheet gets too big to scan, that is the moment software starts saving you time.</p>
`,
    faqs: [
      { q: "Is MemberBook's library software really free?", a: "Yes. The software and the setup are free forever, with no card and no contract. Only optional add-ons, like your own website, are paid, and each starts with a free month." },
      { q: "Can one seat have different students in different shifts?", a: "Yes. Create your shifts (for example morning, afternoon and evening) and assign a different student to the same seat in each shift. Full-day students hold the seat in every shift." },
      { q: "Do students need to download an app?", a: "No. Students get a WhatsApp message and pay by UPI. The app is only for you and your staff, on any phone or computer." },
      { q: "Can I move my existing register into it?", a: "Yes. Send a photo of the register or your Excel sheet and we load seats, students, shifts and due dates for you, usually within one working day." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["study-room-management-app", "abhyasika-management-software", "self-study-library-fee-collection"],
  },
  {
    slug: "study-room-management-app",
    category: "library",
    title: "Study Room and Reading Room Management App",
    metaTitle: "Study Room & Reading Room Management App (Free)",
    description: "A free app to run a study room or reading room in India: students, seats, shifts, monthly fees and WhatsApp reminders with UPI. We set it up from your register.",
    answer: "A study room management app replaces the paper register at your desk: it keeps every student's seat, shift and fee date, and tells you each morning who has to pay. MemberBook is a free one built for Indian reading rooms, and we set it up from your existing register.",
    content: `
<h2>Why reading rooms outgrow the register</h2>
<p>A reading room with 40 seats and two shifts already has 80 fee dates a month to remember. Students join on different days, some pay quarterly, some ask for a few days' grace. The register shows who joined; it does not tell you who is late today.</p>

<h2>What to look for in an app</h2>
<table>
  <thead><tr><th>Need</th><th>Why it matters</th></tr></thead>
  <tbody>
    <tr><td>Works on your phone</td><td>Most owners run the desk from a phone, not a computer.</td></tr>
    <tr><td>Seats and shifts</td><td>A seat sold in two shifts is two incomes to track.</td></tr>
    <tr><td>Due list every morning</td><td>The one screen that brings money in.</td></tr>
    <tr><td>WhatsApp reminders with UPI</td><td>Students pay from the message instead of at the desk.</td></tr>
    <tr><td>Excel export</td><td>Your data stays yours if you ever switch.</td></tr>
    <tr><td>Free or low cost</td><td>Margins on a seat are thin; software should not eat them.</td></tr>
  </tbody>
</table>

<h2>Running a reading room on MemberBook</h2>
<ul>
  <li><strong>Students and seats:</strong> each student has a seat, shift, plan and next due date.</li>
  <li><strong>Fees due:</strong> today's and overdue fees in one list, with one-tap WhatsApp reminders that carry the amount and your UPI pay link.</li>
  <li><strong>Self check-in:</strong> a free add-on gives you a QR poster; students scan it to mark attendance.</li>
  <li><strong>Enquiries:</strong> note walk-ins and follow up when a seat frees up.</li>
  <li><strong>Staff access:</strong> add a desk manager without sharing your password.</li>
</ul>
`,
    faqs: [
      { q: "What is the best app to manage a study room in India?", a: "Pick one that handles seats and shifts, shows a daily due list, sends WhatsApp reminders with a UPI link and lets you export to Excel. MemberBook does all of this for free and loads your register for you." },
      { q: "Can my students pay online?", a: "Yes, by UPI. Each reminder carries a pay link that opens the student's UPI app with your UPI ID and the amount filled in. The money comes straight to you." },
      { q: "Does it work without internet at the desk?", a: "It needs a connection, but a phone's mobile data is enough. It runs in the browser, so there is nothing to install." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["library-seat-management-software", "self-study-library-fee-collection", "fee-reminder-message-templates"],
  },
  {
    slug: "abhyasika-management-software",
    category: "library",
    title: "Abhyasika Management Software: Seats, Fees and Reminders",
    metaTitle: "Abhyasika Management Software (Free) | MemberBook",
    description: "Free software for abhyasikas and study centres in Maharashtra: seat allotment by shift, monthly fee tracking and WhatsApp fee reminders in Marathi, Hindi or English.",
    answer: "Abhyasika management software tracks each student's seat, shift and monthly fee, and reminds students on WhatsApp before the fee is due. MemberBook is free for abhyasikas, and reminders can be sent in Marathi, Hindi or English.",
    content: `
<h2>What an abhyasika needs</h2>
<p>Abhyasikas in Pune, Mumbai, Nashik, Aurangabad and across Maharashtra run on the same rhythm: students preparing for MPSC, UPSC, banking or college exams book a seat for a month at a time, often in a morning or evening shift. The owner's real job is filling seats and collecting fees on time.</p>
<ul>
  <li>Seat allotment by shift, with a quick view of empty seats</li>
  <li>Monthly or quarterly fees with each student's own due date</li>
  <li>Reminders students actually read, which means WhatsApp, in the language they use</li>
  <li>A record of who paid, when, and how (cash or UPI)</li>
</ul>

<h2>Marathi fee reminder you can copy</h2>
<div class="template">नमस्कार {नाव},
तुमची अभ्यासिकेची फी ₹{रक्कम} दिनांक {तारीख} रोजी देय आहे.
UPI ने भरण्यासाठी: {लिंक}
धन्यवाद, {अभ्यासिकेचे नाव}</div>
<p>More languages are in our <a href="/guides/fee-reminder-message-templates">fee reminder templates</a>.</p>

<h2>Setting up your abhyasika on MemberBook</h2>
<ol>
  <li>Send us photos of your register (Marathi entries are fine).</li>
  <li>We create your seats, shifts, plans and students, usually within one working day.</li>
  <li>Each morning, open <strong>Fees due</strong> and send reminders in one tap, with the amount and your UPI pay link filled in.</li>
</ol>
`,
    faqs: [
      { q: "Can I send fee reminders in Marathi?", a: "Yes. You can write your reminder in Marathi, Hindi or English. MemberBook fills in the student's name, amount, date and your UPI pay link." },
      { q: "My register is handwritten in Marathi. Can you still load it?", a: "Yes. Send clear photos and we type it in for you, free." },
      { q: "How much does it cost?", a: "Nothing. MemberBook and its setup are free forever. Optional add-ons such as your own website are paid after a free month." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["library-seat-management-software", "fee-reminder-message-templates", "self-study-library-fee-collection"],
  },
  {
    slug: "self-study-library-fee-collection",
    category: "library",
    title: "How to Collect Monthly Fees in a Self-Study Library",
    metaTitle: "How to Collect Monthly Fees in a Self-Study Library",
    description: "A simple system for collecting self-study library fees on time: one due date per student, reminders 3 days before and on the day, UPI pay links, and a daily due list.",
    answer: "Give every student one fixed due date, remind them on WhatsApp three days before and on the day with a UPI pay link, and check a due list every morning. Most late fees in study libraries come from forgetting, not refusing, so a steady reminder routine fixes most of it.",
    content: `
<h2>Why library fees run late</h2>
<p>Students join on different dates, so fees fall due on different days. Nobody can hold 60 dates in their head. Students are rarely refusing to pay; they forget, or wait until you ask.</p>

<h2>A routine that works</h2>
<ol>
  <li><strong>One due date per student,</strong> set from their joining date. Write it on the receipt.</li>
  <li><strong>Reminder 3 days before,</strong> friendly, with the amount.</li>
  <li><strong>Reminder on the due date,</strong> with a UPI pay link so paying takes one tap.</li>
  <li><strong>Follow-up 3 days after,</strong> polite but clear about the seat.</li>
  <li><strong>Morning due list:</strong> spend five minutes on it before opening.</li>
</ol>

<h2>Make paying easier than not paying</h2>
<ul>
  <li>Put a UPI link or QR in every reminder. A student on the bus can pay in ten seconds.</li>
  <li>Offer a small discount for quarterly payment. Fewer fee dates means fewer late fees.</li>
  <li>Send a receipt on WhatsApp after payment. It builds trust and saves arguments later.</li>
</ul>

<h2>How MemberBook helps</h2>
<p>MemberBook works out each student's due date, lists who to collect from every morning, and lets you send each reminder in one tap with the amount and your UPI pay link already filled in. It is free, and we load your existing register for you.</p>
`,
    faqs: [
      { q: "When should I send a library fee reminder?", a: "Three days before the due date, on the due date, and three days after if still unpaid. Morning messages, between 9 and 11 AM, tend to get read." },
      { q: "Should I charge a late fee?", a: "A small, clearly stated late fee can help, but a reminder with a UPI link usually works better and keeps students happy. Many owners use the seat itself as the reminder: unpaid seats are released after a grace period." },
      { q: "How do students pay by UPI from a message?", a: "A UPI pay link opens the student's UPI app (GPay, PhonePe, Paytm and others) with your UPI ID and the amount filled in. They confirm with their PIN and the money comes straight to you." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["fee-reminder-message-templates", "library-seat-management-software", "study-room-management-app"],
  },

  // ───────────────────────────── Coaching ─────────────────────────────
  {
    slug: "coaching-class-fee-management-software",
    category: "coaching",
    title: "Coaching Class Fee Management Software",
    metaTitle: "Coaching Class Fee Management Software (Free) India",
    description: "Free fee management software for coaching classes and tuition centres in India: students by batch, monthly or instalment fees, reminders to parents with a UPI pay link.",
    answer: "Coaching class fee management software keeps every student's batch, fee plan and due date in one place and shows you who owes what each morning. MemberBook is free for coaching classes and tuition centres, and we load your student list for you.",
    content: `
<h2>What makes coaching fees hard</h2>
<p>Coaching fees come in every shape: monthly, quarterly, one-time course fees, or instalments. Parents pay, not students. And the person collecting is often also the person teaching, so chasing fees eats into class time.</p>

<h2>What the software should handle</h2>
<table>
  <thead><tr><th>Need</th><th>How MemberBook handles it</th></tr></thead>
  <tbody>
    <tr><td>Students by batch</td><td>Group students by batch, class or subject.</td></tr>
    <tr><td>Different fee plans</td><td>Monthly, quarterly, yearly or custom plans with their own prices.</td></tr>
    <tr><td>Who owes what</td><td>A daily list of fees due today and overdue.</td></tr>
    <tr><td>Reminders to parents</td><td>One-tap WhatsApp reminders to the parent's number with the amount and a UPI pay link.</td></tr>
    <tr><td>Receipts</td><td>Every payment recorded with date and mode; try our free <a href="/tools/tuition-fee-receipt-generator">fee receipt generator</a>.</td></tr>
    <tr><td>Your data</td><td>Export to Excel any time.</td></tr>
  </tbody>
</table>

<h2>Getting started</h2>
<p>Send us your student list in any form: a register photo, an Excel sheet, or even a WhatsApp list of names, phone numbers and fees. We set up your batches, plans and students, usually within one working day, free.</p>
`,
    faqs: [
      { q: "Is there free software for coaching class fee management?", a: "Yes. MemberBook is free forever for coaching classes and tuition centres, including setup. Optional add-ons are paid after a free month." },
      { q: "Can reminders go to parents instead of students?", a: "Yes. Save the parent's WhatsApp number on the student and reminders go to the parent." },
      { q: "Can I handle instalments?", a: "Yes. Record each payment against the student as it comes in, and set the next due date for the next instalment." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["tuition-fee-reminder-message", "monthly-fee-register-format", "fee-reminder-message-templates"],
  },
  {
    slug: "tuition-fee-reminder-message",
    category: "coaching",
    title: "Tuition Fee Reminder Message Format (English and Hindi)",
    metaTitle: "Tuition Fee Reminder Message Format: English & Hindi",
    description: "Copy-paste tuition fee reminder messages for parents in English, Hindi and Hinglish: before the due date, on the day and after. Polite, short and with a UPI pay link.",
    answer: "A good tuition fee reminder is short, polite and specific: the student's name, the month, the amount, the due date and a way to pay. Send one a few days before, one on the day and one gentle follow-up after.",
    content: `
<h2>Before the due date</h2>
<h3>English</h3>
<div class="template">Dear Parent, this is a gentle reminder that {Student}'s tuition fee of ₹{Amount} for {Month} is due on {Date}.
You can pay by UPI here: {Link}
Thank you, {Institute}</div>
<h3>Hindi</h3>
<div class="template">नमस्ते, {छात्र} की {महीना} की ट्यूशन फीस ₹{राशि} {तारीख} को देय है।
UPI से भुगतान करें: {लिंक}
धन्यवाद, {संस्थान}</div>
<h3>Hinglish</h3>
<div class="template">Namaste, {Student} ki {Month} ki tuition fees ₹{Amount} {Date} ko due hai.
UPI se pay karein: {Link}
Dhanyavaad, {Institute}</div>

<h2>On the due date</h2>
<div class="template">Dear Parent, {Student}'s fee of ₹{Amount} for {Month} is due today. Pay in one tap: {Link}. Please ignore if already paid. – {Institute}</div>
<div class="template">नमस्ते, {छात्र} की ₹{राशि} फीस आज देय है। भुगतान करें: {लिंक}। यदि भुगतान हो गया है तो कृपया इस संदेश को अनदेखा करें। – {संस्थान}</div>

<h2>After the due date</h2>
<div class="template">Dear Parent, we haven't yet received {Student}'s fee of ₹{Amount} for {Month}. Kindly pay at your convenience: {Link}. Call us if you'd like to discuss. – {Institute}</div>

<h2>Tips that get fees paid</h2>
<ul>
  <li>Always include the amount and a pay link. "Please pay the fee" gets ignored; "₹1,500, tap to pay" gets paid.</li>
  <li>Add "please ignore if already paid". It keeps the tone friendly.</li>
  <li>Send in the morning, not late at night.</li>
  <li>Thank the parent with a receipt after they pay.</li>
</ul>
<p>MemberBook fills in the name, amount, date and your UPI pay link for every student, so each reminder is one tap. It's free.</p>
`,
    faqs: [
      { q: "How do I politely ask parents for tuition fees?", a: "Keep it short and factual: the student's name, the month, the amount, the due date and a pay link, plus 'please ignore if already paid'. A friendly, regular reminder works better than one stern message." },
      { q: "Should the reminder be in Hindi or English?", a: "Use the language the parent uses with you. Many institutes send Hinglish because it reads naturally on WhatsApp." },
      { q: "How many reminders should I send?", a: "Three is usually enough: a few days before, on the day, and one follow-up a few days after." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["fee-reminder-message-templates", "coaching-class-fee-management-software", "monthly-fee-register-format"],
  },
  {
    slug: "monthly-fee-register-format",
    category: "coaching",
    title: "Monthly Fee Register Format for Coaching and Tuition Classes",
    metaTitle: "Monthly Fee Register Format for Coaching Classes",
    description: "A simple monthly fee register format for coaching and tuition classes: the columns to keep, a filled example, and how to spot unpaid fees at a glance.",
    answer: "A monthly fee register needs one row per student and these columns: serial number, student name, batch, parent's phone, monthly fee, and one column per month showing the date paid and receipt number. Leave unpaid months empty so they stand out.",
    content: `
<h2>Columns to keep</h2>
<ol>
  <li><strong>S. No.</strong></li>
  <li><strong>Student name</strong></li>
  <li><strong>Batch / class</strong></li>
  <li><strong>Parent's phone</strong> (the WhatsApp number)</li>
  <li><strong>Monthly fee (₹)</strong></li>
  <li><strong>Joining date</strong> (sets the due date)</li>
  <li><strong>One column per month:</strong> date paid, mode (cash/UPI) and receipt number</li>
</ol>

<h2>Filled example</h2>
<table>
  <thead><tr><th>S. No.</th><th>Student</th><th>Batch</th><th>Parent phone</th><th>Fee</th><th>April</th><th>May</th><th>June</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Aarav Shah</td><td>Class 10 A</td><td>98XXXXXX10</td><td>₹1,500</td><td>3 Apr · UPI · #101</td><td>5 May · Cash · #126</td><td></td></tr>
    <tr><td>2</td><td>Diya Patel</td><td>Class 10 A</td><td>97XXXXXX22</td><td>₹1,500</td><td>2 Apr · UPI · #102</td><td></td><td></td></tr>
    <tr><td>3</td><td>Kabir Rao</td><td>Class 12 Sci</td><td>99XXXXXX35</td><td>₹2,000</td><td>8 Apr · Cash · #109</td><td>7 May · UPI · #131</td><td>6 Jun · UPI · #158</td></tr>
  </tbody>
</table>
<p>Empty cells are unpaid months. In this example Diya's May and June fees and Aarav's June fee need a reminder.</p>

<h2>When the register stops working</h2>
<p>Past 50 or so students, scanning for empty cells every morning takes real time, and a lost register means lost records. MemberBook turns this exact register into a daily due list with one-tap WhatsApp reminders. Send us a photo of your register and we load it for you, free.</p>
`,
    faqs: [
      { q: "Can I keep the fee register in Excel?", a: "Yes. Use the same columns: one row per student and one column per month. Excel makes it easier to filter unpaid months, but you still have to check it every day." },
      { q: "What should a fee receipt include?", a: "Institute name, receipt number, date, student name and batch, the month paid for, the amount in figures and words, payment mode and a signature. Our free receipt generator makes one in a minute." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["coaching-class-fee-management-software", "tuition-fee-reminder-message", "memberbook-vs-excel-register"],
  },

  // ───────────────────────────── Gym ─────────────────────────────
  {
    slug: "gym-membership-form-format",
    category: "gym",
    title: "Gym Membership Form Format (Free Template)",
    metaTitle: "Gym Membership Form Format: Free Template for India",
    description: "A free gym membership form format for Indian gyms: member details, plan and fee, health declaration, emergency contact and consent. Copy it, print it, or go paperless.",
    answer: "A gym membership form should collect the member's name, phone, date of birth and address, the plan, start date and fee paid, a short health declaration, an emergency contact, and the member's signature agreeing to the gym rules.",
    content: `
<h2>Sections to include</h2>
<h3>1. Member details</h3>
<ul>
  <li>Full name, gender, date of birth</li>
  <li>Mobile number (WhatsApp) and email</li>
  <li>Address</li>
  <li>Photo (optional but useful at the front desk)</li>
</ul>
<h3>2. Membership</h3>
<ul>
  <li>Plan (monthly, quarterly, half-yearly, yearly, personal training)</li>
  <li>Start date and end date</li>
  <li>Fee, amount paid, payment mode and receipt number</li>
  <li>Admission or registration fee, if any</li>
</ul>
<h3>3. Health declaration</h3>
<ul>
  <li>Any heart condition, high blood pressure, diabetes, asthma, recent surgery or injury</li>
  <li>Pregnancy (if applicable)</li>
  <li>"I confirm I am fit to exercise and will tell the trainer about any change."</li>
</ul>
<h3>4. Emergency contact</h3>
<ul><li>Name, relation and phone number</li></ul>
<h3>5. Rules and consent</h3>
<ul>
  <li>Fees are non-refundable and non-transferable (or your own policy)</li>
  <li>Membership pause rules</li>
  <li>Consent to receive fee reminders on WhatsApp</li>
  <li>Member signature and date</li>
</ul>

<h2>Going paperless</h2>
<p>Paper forms get filed and forgotten. In MemberBook, the same details live on the member's profile, with their plan and next due date, so renewals are reminded on time. If you have a pile of old forms, send us photos and we type them in for you, free.</p>
`,
    faqs: [
      { q: "Is a health declaration necessary on a gym form?", a: "It is strongly advised. It makes members think about their health before training and gives trainers information they need. It is not a substitute for a doctor's advice." },
      { q: "Should I ask for consent for WhatsApp messages?", a: "Yes. A line asking the member to agree to fee reminders and updates on WhatsApp keeps you on the right side of WhatsApp's rules and the member's expectations." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["fee-reminder-message-templates", "free-vs-paid-gym-software-india", "memberbook-vs-excel-register"],
  },

  // ───────────────────────────── Templates ─────────────────────────────
  {
    slug: "fee-reminder-message-templates",
    category: "templates",
    title: "Fee Reminder Message Templates in English, Hindi, Hinglish, Marathi, Tamil and Bengali",
    metaTitle: "Fee Reminder Message Templates: Hindi, Marathi & More",
    description: "Free WhatsApp fee reminder messages for gyms, libraries and coaching classes in English, Hindi, Hinglish, Marathi, Tamil and Bengali. Copy, fill in the blanks and send.",
    answer: "A fee reminder that gets paid has five parts: a greeting with the person's name, the amount, the due date, a one-tap way to pay (a UPI link), and your business name. Below are ready-to-send versions in six languages.",
    content: `
<p>Replace the words in curly brackets. Each template works for gyms, libraries, coaching classes and any business with monthly fees.</p>

<h2>English</h2>
<div class="template">Hi {Name}, a friendly reminder that your fee of ₹{Amount} is due on {Date}.
Pay by UPI in one tap: {Link}
Thank you, {Business}</div>

<h2>Hindi (हिंदी)</h2>
<div class="template">नमस्ते {नाम}, आपकी फीस ₹{राशि} {तारीख} को देय है।
UPI से तुरंत भुगतान करें: {लिंक}
धन्यवाद, {व्यवसाय का नाम}</div>

<h2>Hinglish</h2>
<div class="template">Namaste {Name}, aapki fees ₹{Amount} {Date} ko due hai.
UPI se turant pay karein: {Link}
Dhanyavaad, {Business}</div>

<h2>Marathi (मराठी)</h2>
<div class="template">नमस्कार {नाव}, तुमची फी ₹{रक्कम} दिनांक {तारीख} रोजी देय आहे.
UPI ने लगेच भरा: {लिंक}
धन्यवाद, {व्यवसायाचे नाव}</div>

<h2>Tamil (தமிழ்)</h2>
<div class="template">வணக்கம் {பெயர்}, உங்கள் கட்டணம் ₹{தொகை} {தேதி} அன்று செலுத்த வேண்டும்.
UPI மூலம் செலுத்த: {இணைப்பு}
நன்றி, {நிறுவனம்}</div>

<h2>Bengali (বাংলা)</h2>
<div class="template">নমস্কার {নাম}, আপনার ফি ₹{টাকা} {তারিখ}-এর মধ্যে জমা দিতে হবে।
UPI-তে এক ট্যাপে পেমেন্ট করুন: {লিংক}
ধন্যবাদ, {প্রতিষ্ঠান}</div>

<h2>Overdue follow-up (English and Hinglish)</h2>
<div class="template">Hi {Name}, your fee of ₹{Amount} was due on {Date} and is still pending. Please pay here: {Link}. Ignore if already paid. – {Business}</div>
<div class="template">Namaste {Name}, aapki ₹{Amount} fees {Date} se pending hai. Yahan pay karein: {Link}. Agar pay kar diya hai to ignore karein. – {Business}</div>

<h2>Thank-you after payment</h2>
<div class="template">Thank you {Name}! We've received ₹{Amount} for {Month}. Your next due date is {Next date}. – {Business}</div>

<h2>Let MemberBook fill these in</h2>
<p>Typing names and amounts for 100 members is the slow part. MemberBook lists who is due each morning and opens WhatsApp with the name, amount, date and your UPI pay link already filled in, so each reminder is one tap. You can also generate gym-specific messages with our free <a href="/tools/whatsapp-gym-renewal-reminder">WhatsApp renewal reminder tool</a>.</p>
`,
    faqs: [
      { q: "How do I write a fee reminder in Hindi?", a: "Keep it short: नमस्ते {नाम}, आपकी फीस ₹{राशि} {तारीख} को देय है। UPI से भुगतान करें: {लिंक}। धन्यवाद, {व्यवसाय का नाम}. Add the amount and a pay link so the person can pay straight away." },
      { q: "Can I send fee reminders to many people at once on WhatsApp?", a: "WhatsApp Business broadcast lists reach up to 256 contacts who have saved your number, but every message is the same. Personal reminders with each person's own amount and date get paid more often." },
      { q: "What is a UPI pay link?", a: "A link that opens the payer's UPI app (GPay, PhonePe, Paytm and others) with your UPI ID and the amount already filled in. They only enter their PIN." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["tuition-fee-reminder-message", "self-study-library-fee-collection", "whatsapp-business-vs-memberbook"],
  },

  // ───────────────────────────── Comparisons ─────────────────────────────
  {
    slug: "memberbook-vs-excel-register",
    category: "comparison",
    title: "MemberBook vs an Excel Sheet or Paper Register",
    metaTitle: "Excel or Register vs Membership Software: Honest Look",
    description: "When a paper register or Excel sheet is enough for your gym, library or coaching class, when it starts costing you fees, and what software changes. An honest comparison.",
    answer: "A paper register or Excel sheet is fine for a few dozen members if you check it every day. Past roughly 50 members, missed due dates start costing real money, and software that lists who owes you each morning and sends the reminders pays for itself, even when it's free.",
    content: `
<h2>Side by side</h2>
<table>
  <thead><tr><th></th><th>Paper register</th><th>Excel / Google Sheets</th><th>MemberBook</th></tr></thead>
  <tbody>
    <tr><td>Cost</td><td>₹100 a notebook</td><td>Free</td><td>Free</td></tr>
    <tr><td>Setup effort</td><td>None</td><td>You build the sheet</td><td>We load your register for you</td></tr>
    <tr><td>Who is due today</td><td>Scan every page</td><td>Filter or formula</td><td>Ready list every morning</td></tr>
    <tr><td>Reminders</td><td>Type each message</td><td>Type each message</td><td>One tap, amount and UPI link filled in</td></tr>
    <tr><td>Works on phone</td><td>Only at the desk</td><td>Awkward on a phone</td><td>Built for phones</td></tr>
    <tr><td>Staff access</td><td>Share the book</td><td>Share the file</td><td>Each staff member gets a login</td></tr>
    <tr><td>Lost or damaged</td><td>Records gone</td><td>Depends on backups</td><td>Saved online, Excel export any time</td></tr>
  </tbody>
</table>

<h2>When to stay with the register</h2>
<p>If you have under 30 members, check the book every morning and rarely chase fees, a register is honestly fine. Don't add software for its own sake.</p>

<h2>When to switch</h2>
<ul>
  <li>You find out a member stopped paying two months ago.</li>
  <li>You spend more than 15 minutes a day working out who to call.</li>
  <li>Staff collect fees and you're not sure everything got written down.</li>
  <li>You want members to pay by UPI without asking at the desk.</li>
</ul>

<h2>Switching takes one photo</h2>
<p>The hard part of switching is typing everything in. With MemberBook you don't: send a photo of your register or your Excel file and we load members, plans and due dates for you, usually within one working day. Your Excel sheet keeps working too; you can export back to Excel any time.</p>
`,
    faqs: [
      { q: "Can I import my Excel member list?", a: "Yes. Upload it yourself, or send it to us and we clean it up and load it for you, free. Any column layout is fine." },
      { q: "Is my data safe if I stop using MemberBook?", a: "Yes. Export everything to Excel at any time. Only you and the staff you add can see your members." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["monthly-fee-register-format", "free-vs-paid-gym-software-india", "best-free-membership-software-india"],
  },
  {
    slug: "whatsapp-business-vs-memberbook",
    category: "comparison",
    title: "WhatsApp Business vs MemberBook for Fee Reminders",
    metaTitle: "WhatsApp Business vs MemberBook for Fee Reminders",
    description: "Is the free WhatsApp Business app enough to collect fees? What it does well, where it falls short for gyms, libraries and coaching classes, and how MemberBook works with it.",
    answer: "WhatsApp Business is great for talking to members, but it doesn't know who owes you money or when. MemberBook keeps the due dates and amounts, then opens WhatsApp with each personal reminder and UPI link ready. Most owners use both together.",
    content: `
<h2>What WhatsApp Business does well</h2>
<ul>
  <li>Free, and every member already uses WhatsApp.</li>
  <li>Business profile, quick replies and labels.</li>
  <li>Broadcast lists to send one message to many contacts (who have saved your number).</li>
</ul>

<h2>Where it falls short for fee collection</h2>
<ul>
  <li><strong>No due dates.</strong> It can't tell you who is due today; you still need a register or sheet.</li>
  <li><strong>Broadcasts are identical.</strong> Everyone gets the same text, without their own amount or date.</li>
  <li><strong>No payment record.</strong> Who paid, when, and how lives somewhere else.</li>
  <li><strong>Labels get messy.</strong> Moving 150 chats between "due" and "paid" labels every month is real work.</li>
</ul>

<h2>Side by side</h2>
<table>
  <thead><tr><th></th><th>WhatsApp Business alone</th><th>MemberBook + WhatsApp</th></tr></thead>
  <tbody>
    <tr><td>Knows who is due</td><td>No</td><td>Yes, every morning</td></tr>
    <tr><td>Personal amount and date in message</td><td>Typed by hand</td><td>Filled in for you</td></tr>
    <tr><td>UPI pay link</td><td>Paste it yourself</td><td>Included in every reminder</td></tr>
    <tr><td>Payment history</td><td>No</td><td>Yes, with Excel export</td></tr>
    <tr><td>Cost</td><td>Free</td><td>Free</td></tr>
  </tbody>
</table>

<h2>Using them together</h2>
<p>Keep WhatsApp Business for conversations. Let MemberBook decide who needs a reminder and prepare it: you tap, WhatsApp opens with the message, and you hit send.</p>
`,
    faqs: [
      { q: "Can WhatsApp Business send automatic fee reminders?", a: "Not by itself. The app has no idea of due dates. Automatic messages need the WhatsApp Business Platform (Cloud API) connected to software that knows your members' dates." },
      { q: "Will reminders come from my own number?", a: "Today, when you tap a reminder in MemberBook, it opens your own WhatsApp, so it comes from your number." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["fee-reminder-message-templates", "memberbook-vs-excel-register", "best-free-membership-software-india"],
  },
  {
    slug: "free-vs-paid-gym-software-india",
    category: "comparison",
    title: "Free vs Paid Gym Management Software in India",
    metaTitle: "Free vs Paid Gym Management Software in India",
    description: "What paid gym software adds over free tools, which gyms need it, and which don't. A plain guide for Indian gym owners choosing between free and paid membership software.",
    answer: "Most small and mid-size Indian gyms need only four things from software: members, plans, a daily due list and reminders. Free tools like MemberBook cover those. Paid software earns its price when you need biometric access control, multi-branch reports, diet and workout apps for members, or integrated payment gateways.",
    content: `
<h2>What every gym needs</h2>
<ol>
  <li>A list of members with plan, start date and end date</li>
  <li>A daily list of renewals due and overdue</li>
  <li>Reminders on WhatsApp with an easy way to pay</li>
  <li>A record of every payment</li>
</ol>
<p>If you have these, you have most of the value. Everything else is a nice-to-have.</p>

<h2>What paid software usually adds</h2>
<table>
  <thead><tr><th>Feature</th><th>Who really needs it</th></tr></thead>
  <tbody>
    <tr><td>Biometric or turnstile access control</td><td>Large gyms with unmanned entry</td></tr>
    <tr><td>Member mobile app with workouts and diet</td><td>Premium gyms selling a coaching experience</td></tr>
    <tr><td>Multi-branch dashboards</td><td>Chains with 3+ locations</td></tr>
    <tr><td>Integrated payment gateway and auto-debit</td><td>Gyms with many online-only members</td></tr>
    <tr><td>Staff payroll and inventory</td><td>Gyms with a supplement shop or large staff</td></tr>
  </tbody>
</table>

<h2>Questions to ask before you pay</h2>
<ul>
  <li>Will I use this feature every week, or did it just look good in the demo?</li>
  <li>Can I export all my data to Excel if I leave?</li>
  <li>Who loads my existing members, and is that extra?</li>
  <li>Is there a yearly lock-in?</li>
</ul>

<h2>Where MemberBook fits</h2>
<p>MemberBook is free forever for the core: members, plans, the daily due list, one-tap WhatsApp reminders with a UPI link, payment history, staff logins and Excel export. We also load your register for free. Optional paid add-ons, like your own gym website, come with a free first month.</p>
`,
    faqs: [
      { q: "Is free gym software safe to use?", a: "Check who can see your data and whether you can export it. In MemberBook only you and the staff you add can see your members, we never sell or share numbers, and you can export everything to Excel." },
      { q: "How does free software make money?", a: "MemberBook keeps the core free and charges for optional add-ons, such as building a website for your gym or Google review help." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["best-free-membership-software-india", "memberbook-vs-excel-register", "gym-membership-form-format"],
  },
  {
    slug: "best-free-membership-software-india",
    category: "comparison",
    title: "Best Free Software for Gyms, Libraries and Coaching Classes in India (2026): How to Choose",
    metaTitle: "Best Free Gym, Library & Coaching Software in India 2026",
    description: "How to pick free membership and fee software for an Indian gym, study library or coaching class in 2026: the options, what each is good at, and a checklist before you sign up.",
    answer: "For most small businesses in India the realistic free options are a paper register, Excel or Google Sheets, WhatsApp Business, and free membership software such as MemberBook. Choose by one test: does it tell you every morning who owes you money, and make it easy for them to pay?",
    content: `
<p>We make MemberBook, so read this with that in mind. We've tried to be fair about when each option is the right one, including when you don't need us.</p>

<h2>The options</h2>
<table>
  <thead><tr><th>Option</th><th>Best for</th><th>Falls short when</th></tr></thead>
  <tbody>
    <tr><td>Paper register</td><td>Under 30 members, owner at the desk daily</td><td>Fees start slipping or the book is shared</td></tr>
    <tr><td>Excel / Google Sheets</td><td>Owners comfortable with formulas and a laptop</td><td>You run things from a phone or have staff</td></tr>
    <tr><td>WhatsApp Business</td><td>Talking to members, broadcasts</td><td>You need due dates or payment records</td></tr>
    <tr><td>MemberBook (free)</td><td>Gyms, study libraries and coaching classes that want a daily due list, one-tap reminders with UPI, and setup done for them</td><td>You need biometric access control or a member workout app</td></tr>
    <tr><td>Paid gym or institute software</td><td>Large gyms, chains, institutes needing biometrics, apps or payroll</td><td>You're small and paying for features you won't use</td></tr>
  </tbody>
</table>

<h2>Checklist before you choose</h2>
<ol>
  <li><strong>Daily due list:</strong> can you see today's and overdue fees in one screen?</li>
  <li><strong>Reminders with payment:</strong> does each reminder carry the amount and a UPI link?</li>
  <li><strong>Phone first:</strong> can you run it from your phone at the desk?</li>
  <li><strong>Setup:</strong> who enters your existing members, and does it cost extra?</li>
  <li><strong>Exit:</strong> can you export everything to Excel?</li>
  <li><strong>Real price:</strong> is "free" a 14-day trial, or actually free?</li>
</ol>

<h2>For each type of business</h2>
<ul>
  <li><strong>Gyms:</strong> renewals are everything. Prioritise the due list and reminders over fancy dashboards. See <a href="/gym">MemberBook for gyms</a>.</li>
  <li><strong>Study libraries and reading rooms:</strong> you need seats and shifts. See our <a href="/guides/library-seat-management-software">seat management guide</a>.</li>
  <li><strong>Coaching classes:</strong> reminders go to parents and fees vary by batch. See <a href="/guides/coaching-class-fee-management-software">coaching fee management</a>.</li>
</ul>
`,
    faqs: [
      { q: "What is the best free gym management software in India?", a: "The best one is the one that shows you every morning who owes you money and makes paying easy. MemberBook does that for free, with setup included; larger gyms needing biometrics or member apps may need paid software." },
      { q: "Is there free library management software for study rooms?", a: "Yes. MemberBook is free for self-study libraries and reading rooms, with seats, shifts, monthly fees and WhatsApp reminders." },
      { q: "Is MemberBook really free, or a trial?", a: "Really free, forever, including setup. You only pay if you switch on an optional add-on, and each add-on starts with a free month." },
    ],
    publishedISO: PUBLISHED,
    updatedISO: PUBLISHED,
    related: ["free-vs-paid-gym-software-india", "memberbook-vs-excel-register", "whatsapp-business-vs-memberbook"],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find(g => g.slug === slug);
}
