/** Set on browsers used by the MemberBook team (see app/plugins/internal-traffic.client.ts). */
export const INTERNAL_KEY = "mb_internal";

export function isInternalBrowser(): boolean {
  try {
    return localStorage.getItem(INTERNAL_KEY) === "1";
  }
  catch {
    return false;
  }
}
