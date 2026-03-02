/**
 * Outreach message template engine
 * Generates personalized WhatsApp, email, and Instagram DM drafts
 * based on lead vertical (gym/library/tuition) and scale.
 */

import { buildWhatsAppLink } from './phone.mjs';

/**
 * Infer business scale from Google review count
 * @param {number} reviewCount
 * @returns {'new' | 'growing' | 'established'}
 */
export function inferScale(reviewCount) {
  if (reviewCount <= 15) return 'new';
  if (reviewCount <= 60) return 'growing';
  return 'established';
}

// ── Pain-Promise-Proof frameworks per vertical ────────────────────────────────

const FRAMEWORKS = {
  gym: {
    new: {
      pain: 'Starting a gym means juggling members, payments, and renewals — all while building your brand',
      promise: 'MemberBook handles your member tracking and payment reminders from day one, so you can focus on training',
      proof: 'Gym owners save 5+ hours/week on admin by switching from registers to MemberBook',
    },
    growing: {
      pain: 'As your gym grows past 50-100 members, spreadsheets and notebooks start falling apart — missed renewals, lost payments, no visibility',
      promise: 'MemberBook gives you a complete dashboard for every member, plan, and payment — with WhatsApp reminders that actually get people to renew',
      proof: 'Gyms using automated WhatsApp reminders see 30% fewer missed payments',
    },
    established: {
      pain: 'Managing multiple batches, staff, and hundreds of members needs a system — not a pile of registers',
      promise: 'MemberBook scales with you — multi-staff access, subscription plan management, and payment tracking all in one place',
      proof: 'Built for gyms managing 200+ members across multiple plans',
    },
  },
  library: {
    new: {
      pain: 'Running a library on paper registers means you are always one step behind — overdue books, expired memberships, no digital trail',
      promise: 'MemberBook digitizes your membership tracking in minutes — no technical skills needed',
      proof: 'Libraries go from zero digital records to full member visibility in under an hour',
    },
    growing: {
      pain: 'More members means more chaos — tracking who renewed, who owes fees, sending individual reminders takes hours',
      promise: 'Automate membership renewals and fee reminders via WhatsApp — members get notified, you get peace of mind',
      proof: 'Stop spending weekends on manual follow-ups — let the system handle it',
    },
    established: {
      pain: 'Large libraries need real data — which plans work, who is active, revenue trends — not guesswork',
      promise: 'MemberBook gives you analytics on your memberships, payments, and growth — all from your phone',
      proof: 'Designed for libraries managing 100+ active subscriptions',
    },
  },
  tuition: {
    new: {
      pain: 'Collecting fees from parents is awkward — you forget who paid, they forget to pay, and you lose track of batches',
      promise: 'MemberBook tracks every student, batch, and payment — and sends fee reminders via WhatsApp so you don not have to',
      proof: 'Tuition centers using payment reminders see parents pay on time, every time',
    },
    growing: {
      pain: 'Multiple batches, different fee structures, parents asking "did I pay?" — your notebook cannot keep up',
      promise: 'One dashboard for all your batches, students, and fee collections — with automatic WhatsApp reminders',
      proof: 'Centers managing 50+ students save 4+ hours/week on fee tracking alone',
    },
    established: {
      pain: 'Running a large tuition center means dealing with staff management, multiple plans, and hundreds of fee transactions monthly',
      promise: 'MemberBook is purpose-built for this — multi-staff, plan management, full payment history, and WhatsApp integration',
      proof: 'Trusted by centers managing 200+ students across multiple batches',
    },
  },
};

// ── Message templates ─────────────────────────────────────────────────────────

function whatsappMessage(lead, framework) {
  const name = lead.name || 'there';
  // Mixed Hindi+English — natural WhatsApp tone
  return [
    `Hi ${name} ji,`,
    ``,
    `I came across your ${lead.category === 'tuition' ? 'tuition center' : lead.category} on Google and wanted to reach out.`,
    ``,
    `${framework.pain}.`,
    ``,
    `We built *MemberBook* — ${framework.promise}.`,
    ``,
    `${framework.proof}.`,
    ``,
    `Kya aap 2 min ka demo dekhna chahenge? It is free to try and works on your phone.`,
    ``,
    `Website: https://memberbook.in`,
    ``,
    `Thanks!`,
  ].join('\n');
}

function emailSubject(lead, framework) {
  const category = lead.category === 'tuition' ? 'tuition center' : lead.category;
  return `Quick question about managing your ${category} members`;
}

function emailBody(lead, framework) {
  const name = lead.name || 'there';
  const category = lead.category === 'tuition' ? 'tuition center' : lead.category;
  return [
    `Hi ${name},`,
    ``,
    `I found your ${category} on Google Maps and noticed you have a well-regarded business (${lead.rating ? lead.rating + ' stars' : 'great reviews'}). Congrats!`,
    ``,
    `I wanted to ask — how do you currently manage member registrations and fee payments? Many ${category} owners I speak with mention that ${framework.pain.toLowerCase()}.`,
    ``,
    `We built MemberBook to solve exactly this. ${framework.promise}.`,
    ``,
    `${framework.proof}.`,
    ``,
    `Would you be open to a quick 5-minute demo? You can also try it free at https://memberbook.in`,
    ``,
    `Best regards`,
  ].join('\n');
}

function instagramDM(lead, framework) {
  const name = lead.name || 'there';
  return [
    `Hey ${name}! Came across your page and love what you are doing.`,
    ``,
    `Quick question — do you track member registrations and payments digitally? We built MemberBook specifically for ${lead.category === 'tuition' ? 'tuition centers' : lead.category + 's'} like yours.`,
    ``,
    `${framework.promise}. Happy to share a quick demo if you are interested!`,
    ``,
    `memberbook.in`,
  ].join('\n');
}

/**
 * Generate outreach messages for a lead
 * @param {object} lead - Lead data { name, category, rating, reviews, phone, ... }
 * @param {object} [options]
 * @param {string} [options.language] - 'mixed' (default), 'en', 'hi'
 * @returns {{ whatsapp: string, email: { subject: string, body: string }, instagram: string, whatsappLink: string }}
 */
export function generateMessages(lead, options = {}) {
  const category = lead.category || 'gym';
  const scale = lead.scale || inferScale(lead.reviews || 0);
  const framework = FRAMEWORKS[category]?.[scale] || FRAMEWORKS.gym.growing;

  const whatsapp = whatsappMessage(lead, framework);
  const waLink = lead.phone ? buildWhatsAppLink(lead.phone, whatsapp) : '';

  return {
    whatsapp,
    email: {
      subject: emailSubject(lead, framework),
      body: emailBody(lead, framework),
    },
    instagram: instagramDM(lead, framework),
    whatsappLink: waLink,
  };
}

/**
 * Format all lead messages into a Markdown document
 * @param {object[]} leads
 * @returns {string}
 */
export function formatMessagesMarkdown(leads) {
  const lines = [
    `# Outreach Messages`,
    ``,
    `> **IMPORTANT:** Review every message before sending. Do NOT send without personal review.`,
    `> Generated on ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `---`,
    ``,
  ];

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const msgs = generateMessages(lead);
    const scale = lead.scale || inferScale(lead.reviews || 0);

    lines.push(`## ${i + 1}. ${lead.name || 'Unknown'}`);
    lines.push(``);
    lines.push(`- **Category:** ${lead.category} | **Scale:** ${scale} | **Rating:** ${lead.rating || 'N/A'} (${lead.reviews || 0} reviews)`);
    lines.push(`- **Phone:** ${lead.phone || 'N/A'} | **Address:** ${lead.address || 'N/A'}`);
    if (lead.website) lines.push(`- **Website:** ${lead.website}`);
    if (msgs.whatsappLink) lines.push(`- **WhatsApp Link:** ${msgs.whatsappLink}`);
    lines.push(``);

    lines.push(`### WhatsApp Message`);
    lines.push('```');
    lines.push(msgs.whatsapp);
    lines.push('```');
    lines.push(``);

    lines.push(`### Email`);
    lines.push(`**Subject:** ${msgs.email.subject}`);
    lines.push('```');
    lines.push(msgs.email.body);
    lines.push('```');
    lines.push(``);

    lines.push(`### Instagram DM`);
    lines.push('```');
    lines.push(msgs.instagram);
    lines.push('```');
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  return lines.join('\n');
}
