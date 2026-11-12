import { sql } from "drizzle-orm";

/**
 * The owner's morning email (09:00 IST): yesterday in numbers, what needs a
 * reply today, and which businesses are slipping. Plain text so it reads well
 * on a phone.
 */
export async function buildAdminDigest(appUrl: string) {
  const base = (appUrl || "https://memberbook.in").replace(/\/$/, "");
  const data = await getAdminToday();
  const s = data.summary;
  const yesterday = dateIST(-1);

  const [y] = await db.all(sql`
    SELECT
      (SELECT COUNT(*) FROM organizations
        WHERE date(created_at, '+330 minutes') = ${yesterday}
          AND lower(name) NOT LIKE '%test%' AND lower(name) NOT LIKE '%demo%' AND lower(name) NOT LIKE '%sample%') AS signups,
      (SELECT COUNT(DISTINCT org_id) FROM user_activity_days WHERE day = ${yesterday}) AS businesses_used,
      (SELECT COUNT(*) FROM payments WHERE date(created_at, '+330 minutes') = ${yesterday}) AS payments,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE date(created_at, '+330 minutes') = ${yesterday}) AS collected,
      (SELECT COUNT(*) FROM members WHERE date(created_at, '+330 minutes') = ${yesterday}) AS members_added,
      (SELECT COUNT(*) FROM reminder_logs WHERE date(created_at, '+330 minutes') = ${yesterday}) AS reminders,
      (SELECT COUNT(*) FROM data_uploads WHERE date(created_at, '+330 minutes') = ${yesterday}) AS uploads
  `) as Array<Record<string, unknown>>;
  const n = (k: string) => Number(y?.[k] ?? 0);

  const lines: string[] = [];
  lines.push(`Good morning. Here's MemberBook for ${formatDay(yesterday)}.`, "");
  lines.push("YESTERDAY");
  lines.push(`- ${n("signups")} new ${n("signups") === 1 ? "signup" : "signups"}`);
  lines.push(`- ${n("businesses_used")} ${n("businesses_used") === 1 ? "business" : "businesses"} opened the app`);
  lines.push(`- ${n("payments")} payments recorded (${formatRupeesShort(n("collected"))})`);
  lines.push(`- ${n("members_added")} members added, ${n("uploads")} data uploads, ${n("reminders")} fee reminders`);
  lines.push("");

  lines.push("THIS WEEK");
  lines.push(`- ${s.activeBusinesses} active businesses (${s.usedThisWeek} opened the app in the last 7 days)`);
  lines.push(`- ${s.slipping} slipping, ${s.churned} churned, ${s.settingUp} being set up`);
  lines.push(`- ${formatRupeesShort(s.collected7)} recorded across ${s.payments7} payments`);
  lines.push(`- ${s.newSignups7} new signups`);
  lines.push("");

  if (data.todos.length) {
    lines.push(`TO DO TODAY (${data.todos.length})`);
    for (const t of data.todos.slice(0, 15)) {
      lines.push(`- ${t.title}`);
      lines.push(`  ${t.detail}`);
    }
    if (data.todos.length > 15) lines.push(`- and ${data.todos.length - 15} more`);
  }
  else {
    lines.push("TO DO TODAY", "- Nothing waiting. Inbox, help requests and uploads are all clear.");
  }
  lines.push("", `Open the Today page: ${base}/admin/today`, "");

  const subject = data.todos.length
    ? `MemberBook today: ${data.todos.length} to do, ${n("payments")} payments yesterday`
    : `MemberBook today: all clear, ${n("payments")} payments yesterday`;

  return { subject, text: lines.join("\n"), todoCount: data.todos.length };
}

function formatDay(date: string) {
  return new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata",
  });
}
