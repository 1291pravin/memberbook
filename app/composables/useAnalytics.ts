type AnalyticsValue = string | number | boolean | null | undefined;

type AnalyticsParams = Record<string, AnalyticsValue>;

type GtagWindow = Window & {
  gtag?: (command: "event", eventName: string, params?: AnalyticsParams) => void
};

function cleanParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export function useAnalytics() {
  const route = useRoute();

  function trackEvent(eventName: string, params: AnalyticsParams = {}) {
    if (typeof window === "undefined") return;

    const gtag = (window as GtagWindow).gtag;
    if (!gtag) return;

    gtag("event", eventName, cleanParams({
      page_location: window.location.href,
      page_path: route.path,
      ...params,
    }));
  }

  function trackCtaClick(label: string, params: AnalyticsParams = {}) {
    trackEvent("primary_cta_click", {
      event_category: "Funnel",
      event_label: label,
      cta_label: label,
      ...params,
    });
    // "Send us your register" opens WhatsApp: that is a lead, so also send
    // GA4's recommended generate_lead event (can be marked as a key event).
    if (label.includes("send_register")) {
      trackEvent("generate_lead", { lead_source: "whatsapp", cta_label: label });
    }
  }

  // Our funnel steps that have a GA4 recommended event, sent alongside so GA4's
  // built-in reports (and key events) pick them up.
  const RECOMMENDED: Record<string, string> = {
    registration_success: "sign_up",
    contact_submission_success: "generate_lead",
  };

  function trackFunnelStep(step: string, params: AnalyticsParams = {}) {
    trackEvent(step, {
      event_category: "Funnel",
      funnel_step: step,
      ...params,
    });
    const recommended = RECOMMENDED[step];
    if (recommended) trackEvent(recommended, { ...params, lead_source: step === "contact_submission_success" ? "contact_form" : undefined });
  }

  return {
    trackEvent,
    trackCtaClick,
    trackFunnelStep,
  };
}
