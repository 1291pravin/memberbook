import { sql } from "drizzle-orm";

/**
 * Admin Analytics: where website visitors come from and where they are, the
 * signup funnel, and how signed-up businesses are doing (churn), split by
 * signup month and by traffic source.
 */
type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0) || 0;
const str = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);

  const days = readPositiveInteger(getQuery(event).days, 28, 365);
  const sinceDay = dateIST(-(days - 1));
  // users/orgs store UTC ISO times; IST midnight of sinceDay in UTC.
  const sinceIso = new Date(`${sinceDay}T00:00:00+05:30`).toISOString();

  const [totalsRows, daily, sources, campaigns, cities, countries, pages, devices, registerVisitors, signupRows, firstVisit, businesses] = await Promise.all([
    db.all(sql`
      SELECT COUNT(DISTINCT visitor_id) AS visitors, COUNT(*) AS page_views,
        SUM(CASE WHEN is_landing = 1 THEN 1 ELSE 0 END) AS visits
      FROM site_visits WHERE day >= ${sinceDay}`),
    db.all(sql`
      SELECT day, COUNT(DISTINCT visitor_id) AS visitors, COUNT(*) AS page_views
      FROM site_visits WHERE day >= ${sinceDay} GROUP BY day ORDER BY day`),
    db.all(sql`
      SELECT COALESCE(source, 'Direct') AS source, COALESCE(medium, 'direct') AS medium,
        COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS visitors
      FROM site_visits WHERE day >= ${sinceDay} AND is_landing = 1
      GROUP BY 1, 2 ORDER BY visitors DESC LIMIT 25`),
    db.all(sql`
      SELECT campaign, COALESCE(source, '') AS source, COUNT(DISTINCT visitor_id) AS visitors
      FROM site_visits WHERE day >= ${sinceDay} AND is_landing = 1 AND campaign IS NOT NULL
      GROUP BY 1, 2 ORDER BY visitors DESC LIMIT 15`),
    db.all(sql`
      SELECT COALESCE(city, 'Unknown') AS city, COALESCE(region, '') AS region, COALESCE(country, '') AS country,
        COUNT(DISTINCT visitor_id) AS visitors
      FROM site_visits WHERE day >= ${sinceDay}
      GROUP BY 1, 2, 3 ORDER BY visitors DESC LIMIT 25`),
    db.all(sql`
      SELECT COALESCE(country, 'Unknown') AS country, COUNT(DISTINCT visitor_id) AS visitors
      FROM site_visits WHERE day >= ${sinceDay}
      GROUP BY 1 ORDER BY visitors DESC LIMIT 10`),
    db.all(sql`
      SELECT path, COUNT(*) AS page_views, COUNT(DISTINCT visitor_id) AS visitors,
        SUM(CASE WHEN is_landing = 1 THEN 1 ELSE 0 END) AS landings
      FROM site_visits WHERE day >= ${sinceDay}
      GROUP BY path ORDER BY visitors DESC LIMIT 20`),
    db.all(sql`
      SELECT COALESCE(device, 'unknown') AS device, COUNT(DISTINCT visitor_id) AS visitors
      FROM site_visits WHERE day >= ${sinceDay} GROUP BY 1 ORDER BY visitors DESC`),
    db.all(sql`
      SELECT COUNT(DISTINCT visitor_id) AS visitors FROM site_visits
      WHERE day >= ${sinceDay} AND path IN ('/register', '/login', '/onboarding')`),
    // Every owner-type user (invited staff are left out), with attribution.
    db.all(sql`
      SELECT u.id, u.created_at, u.visitor_id, u.signup_source, u.signup_medium, u.signup_campaign,
        u.signup_landing, u.signup_city, u.signup_region, u.signup_country
      FROM users u
      WHERE NOT EXISTS (SELECT 1 FROM org_memberships m WHERE m.user_id = u.id AND m.role = 'staff')
      ORDER BY u.created_at DESC`),
    db.all(sql`SELECT MIN(day) AS first_day FROM site_visits`),
    getBusinessRows(),
  ]);

  const totals = (totalsRows as Row[])[0] ?? {};
  const signups = (signupRows as Row[]).map(r => ({
    id: num(r.id),
    createdAt: String(r.created_at),
    tracked: Boolean(r.visitor_id),
    source: str(r.signup_source) ?? (r.visitor_id ? "Direct" : null),
    medium: str(r.signup_medium),
    campaign: str(r.signup_campaign),
    landing: str(r.signup_landing),
    city: str(r.signup_city),
    region: str(r.signup_region),
    country: str(r.signup_country),
  }));
  const signupsById = new Map(signups.map(s => [s.id, s]));
  const periodSignups = signups.filter(s => s.createdAt >= sinceIso);

  const real = businesses.filter(b => !b.isTest);
  const istDay = (iso: string) => new Date(new Date(iso).getTime() + 330 * 60000).toISOString().slice(0, 10);
  const cameBack = (b: typeof real[number]) => Boolean(b.lastVisitDay && b.lastVisitDay > istDay(b.createdAt));

  // Funnel for the chosen period.
  const periodBusinesses = real.filter(b => b.createdAt >= sinceIso);
  const funnel = [
    { key: "visitors", label: "Visited the website", value: num(totals.visitors) },
    { key: "signup_page", label: "Opened sign up or login", value: num((registerVisitors as Row[])[0]?.visitors) },
    { key: "signed_up", label: "Created an account", value: periodSignups.length },
    { key: "business", label: "Created a business", value: periodBusinesses.length },
    { key: "members", label: "Added real members", value: periodBusinesses.filter(b => b.realMembers > 0).length },
    { key: "came_back", label: "Came back another day", value: periodBusinesses.filter(cameBack).length },
    { key: "active", label: "Active in the last 7 days", value: periodBusinesses.filter(b => b.health === "active").length },
  ];

  // Signups per day for the chart.
  const signupsByDay = new Map<string, number>();
  for (const s of periodSignups) {
    const d = istDay(s.createdAt);
    signupsByDay.set(d, (signupsByDay.get(d) ?? 0) + 1);
  }
  const dailyRows = new Map((daily as Row[]).map(r => [String(r.day), { visitors: num(r.visitors), pageViews: num(r.page_views) }]));
  const series: Array<{ day: string; visitors: number; pageViews: number; signups: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = dateIST(-i);
    const v = dailyRows.get(day);
    series.push({ day, visitors: v?.visitors ?? 0, pageViews: v?.pageViews ?? 0, signups: signupsByDay.get(day) ?? 0 });
  }

  // Signups in the period by source and by city.
  const count = <T>(items: T[], key: (t: T) => string) => {
    const m = new Map<string, number>();
    for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
    return m;
  };
  const signupsBySource = count(periodSignups, s => s.source ?? "Before tracking");
  const signupsByCity = count(periodSignups, s => s.city ?? (s.tracked || s.country ? "Unknown" : "Before tracking"));

  // Churn: every real business, all time.
  const health = { active: 0, slipping: 0, churned: 0, setting_up: 0, new: 0, never_started: 0 } as Record<string, number>;
  for (const b of real) health[b.health] = (health[b.health] ?? 0) + 1;

  type Bucket = { label: string; businesses: number; withMembers: number; cameBack: number; active: number; slipping: number; churned: number; neverStarted: number; settingUp: number };
  const emptyBucket = (label: string): Bucket => ({ label, businesses: 0, withMembers: 0, cameBack: 0, active: 0, slipping: 0, churned: 0, neverStarted: 0, settingUp: 0 });
  const add = (bucket: Bucket, b: typeof real[number]) => {
    bucket.businesses++;
    if (b.realMembers > 0) bucket.withMembers++;
    if (cameBack(b)) bucket.cameBack++;
    if (b.health === "active") bucket.active++;
    else if (b.health === "slipping") bucket.slipping++;
    else if (b.health === "churned") bucket.churned++;
    else if (b.health === "setting_up") bucket.settingUp++;
    else bucket.neverStarted++; // new + never_started: no real members yet
  };
  const cohorts = new Map<string, Bucket>();
  const bySource = new Map<string, Bucket>();
  for (const b of real) {
    const month = istDay(b.createdAt).slice(0, 7);
    if (!cohorts.has(month)) cohorts.set(month, emptyBucket(month));
    add(cohorts.get(month)!, b);
    const owner = b.ownerId ? signupsById.get(b.ownerId) : undefined;
    const src = owner?.source ?? "Before tracking";
    if (!bySource.has(src)) bySource.set(src, emptyBucket(src));
    add(bySource.get(src)!, b);
  }

  return {
    days,
    sinceDay,
    trackingSince: str((firstVisit as Row[])[0]?.first_day),
    totals: {
      visitors: num(totals.visitors),
      visits: num(totals.visits),
      pageViews: num(totals.page_views),
      signups: periodSignups.length,
      businesses: periodBusinesses.length,
    },
    series,
    funnel,
    sources: (sources as Row[]).map(r => ({
      source: String(r.source), medium: String(r.medium), visits: num(r.visits), visitors: num(r.visitors),
      signups: signupsBySource.get(String(r.source)) ?? 0,
    })),
    signupsBySource: [...signupsBySource.entries()].map(([source, n]) => ({ source, signups: n })).sort((a, b) => b.signups - a.signups),
    campaigns: (campaigns as Row[]).map(r => ({ campaign: String(r.campaign), source: String(r.source), visitors: num(r.visitors) })),
    cities: (cities as Row[]).map(r => ({
      city: String(r.city), region: String(r.region), country: String(r.country), visitors: num(r.visitors),
      signups: signupsByCity.get(String(r.city)) ?? 0,
    })),
    signupsByCity: [...signupsByCity.entries()].map(([city, n]) => ({ city, signups: n })).sort((a, b) => b.signups - a.signups),
    countries: (countries as Row[]).map(r => ({ country: String(r.country), visitors: num(r.visitors) })),
    pages: (pages as Row[]).map(r => ({ path: String(r.path), pageViews: num(r.page_views), visitors: num(r.visitors), landings: num(r.landings) })),
    devices: (devices as Row[]).map(r => ({ device: String(r.device), visitors: num(r.visitors) })),
    churn: {
      total: real.length,
      health,
      dayOneDropoff: real.filter(b => !cameBack(b)).length,
      cohorts: [...cohorts.values()].sort((a, b) => b.label.localeCompare(a.label)),
      bySource: [...bySource.values()].sort((a, b) => b.businesses - a.businesses),
    },
  };
});
