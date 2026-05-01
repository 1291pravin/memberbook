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
  }

  function trackFunnelStep(step: string, params: AnalyticsParams = {}) {
    trackEvent(step, {
      event_category: "Funnel",
      funnel_step: step,
      ...params,
    });
  }

  return {
    trackEvent,
    trackCtaClick,
    trackFunnelStep,
  };
}
