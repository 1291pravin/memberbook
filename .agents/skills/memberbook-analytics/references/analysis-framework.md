# MemberBook Analytics Analysis Framework

Metric thresholds and analysis patterns calibrated for MemberBook's scale (early-stage B2B SaaS, Indian market).

---

## GA4 Metric Thresholds

### Bounce Rate
| Band | Range | Interpretation |
|------|-------|----------------|
| Excellent | < 40% | Users are engaged, landing pages working well |
| Normal | 40-60% | Typical for SaaS marketing sites |
| High | 60-75% | Landing page or targeting issues |
| Critical | > 75% | Serious UX or traffic quality problem |

### Average Session Duration
| Band | Range | Interpretation |
|------|-------|----------------|
| Strong | > 3 min | Users exploring product/features deeply |
| Healthy | 1-3 min | Normal browsing behavior |
| Weak | 30s-1 min | Shallow engagement, content not resonating |
| Alarm | < 30s | Likely bot traffic or severe UX issues |

### Week-over-Week Growth
| Band | Range | Interpretation |
|------|-------|----------------|
| Strong growth | > +15% | Likely a campaign or viral content driving traffic |
| Healthy growth | +5% to +15% | Sustainable organic growth |
| Flat | -5% to +5% | Stable but no momentum |
| Declining | < -5% | Investigate traffic sources and content |

### New User Ratio (new users / active users)
| Band | Range | Interpretation |
|------|-------|----------------|
| Discovery phase | > 70% | Lots of new visitors, low retention — early stage normal |
| Balanced | 40-70% | Healthy mix of new and returning |
| Retention-heavy | < 40% | Good retention but acquisition stalling |

---

## Search Console Metric Thresholds

### Click-Through Rate (CTR)
| Band | Range | Interpretation |
|------|-------|----------------|
| Strong | > 5% | Good title/description optimization |
| Average | 2-5% | Room for meta tag improvement |
| Low | < 2% | Titles and descriptions need attention |

### Average Position
| Band | Range | Interpretation |
|------|-------|----------------|
| Page 1 | 1-10 | Competitive, defend these rankings |
| Striking distance | 11-20 | Quick wins — small improvements yield page 1 |
| Building | 21-50 | Content gaining traction, needs strengthening |
| Invisible | > 50 | Content not competitive yet |

### Keyword Opportunity Criteria
A keyword is an "opportunity" when:
- Position: 5-20 (close to or just off page 1)
- Impressions: > 30 in 28 days (enough volume to matter)
- CTR: < 5% (room for title/description improvement)

---

## Cloudflare Workers Metric Thresholds

### Error Rate
| Band | Range | Interpretation |
|------|-------|----------------|
| Healthy | < 0.1% | Normal operation |
| Elevated | 0.1-1% | Investigate error patterns |
| High | 1-5% | Some users are experiencing failures |
| Critical | > 5% | Significant reliability issue |

### CPU Time (p99)
| Band | Range | Interpretation |
|------|-------|----------------|
| Fast | < 10ms | Well-optimized worker |
| Normal | 10-30ms | Acceptable for SSR workloads |
| Slow | 30-50ms | Consider optimization |
| Very slow | > 50ms | Approaching Worker CPU limits, optimize urgently |

### Request-to-Session Correlation
Compare CF total requests with GA4 sessions to understand:
- Ratio > 10:1 — Heavy asset loading or API calls per session
- Ratio 3-10:1 — Normal for SSR app with some API calls
- Ratio < 3:1 — Unusually low, possible caching or measurement issue

---

## Analysis Patterns

### 1. Traffic Source Diversification
- Check if any single channel provides > 60% of traffic (risky dependency)
- Organic search < 30% for a SaaS → SEO needs investment
- Direct > 50% → Brand awareness is strong but growth channels underutilized

### 2. Bounce Rate / Session Duration Mismatch
- High bounce + long duration → Users find what they need on page 1 (not always bad)
- High bounce + short duration → Page doesn't meet user intent (bad)
- Low bounce + short duration → Users clicking around but not finding value

### 3. Error-Traffic Correlation
- Rising errors + rising traffic → Scaling issue
- Rising errors + flat traffic → Code regression or dependency issue
- Errors spike on specific dates → Correlate with deployments

### 4. Keyword Clustering
Group Search Console queries by intent:
- **Brand:** "memberbook", "member book" → Brand awareness metric
- **Problem:** "gym management", "membership tracking" → Top-of-funnel opportunity
- **Solution:** "gym management software", "membership app" → High-intent, conversion opportunity
- **Comparison:** "memberbook vs", "alternative to" → Decision-stage content opportunity

### 5. Dashboard Stickiness (if measurable)
- `/dashboard` page views / total sessions → What % of traffic is logged-in users
- High ratio → Product is sticky, growth is product-led
- Low ratio → Most traffic is top-of-funnel, need conversion optimization

---

## Questions Claude Must Answer

1. **Is organic growth trending up, flat, or down?** Look at sessions, new users, and search impressions together.

2. **Which pages are underperforming?** High impressions + low CTR, or high traffic + high bounce rate.

3. **Are errors correlated with anything?** Check CF error rate vs traffic patterns, look for date-specific spikes.

4. **What is the single highest-leverage action?** Considering effort vs impact, what one thing would most improve MemberBook's growth or reliability?

5. **What should be monitored next period?** Flag any metric approaching a threshold boundary or showing a new trend.
