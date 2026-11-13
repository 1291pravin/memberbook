// Member photos are stored once at up to 800px (the original) plus a small
// thumbnail next to it. Lists and the member page only ever show a 40-64px
// circle, so they ask for the thumbnail.

/** Longest side of the stored thumbnail, in px (64px avatar x 3 for sharp phone screens). */
export const MEMBER_THUMB_SIZE = 192;

/** Where the thumbnail of a stored photo lives. */
export function memberThumbKey(photoKey: string): string {
  return `${photoKey}-thumb`;
}

/** URL of a member's photo. The key in the URL makes it safe to cache for good. */
export function memberPhotoUrl(orgId: number | string, memberId: number | string, photoKey: string, size: "thumb" | "full" = "thumb"): string {
  const q = new URLSearchParams({ v: photoKey });
  if (size === "thumb") q.set("size", "thumb");
  return `/api/orgs/${orgId}/members/${memberId}/photo?${q}`;
}
