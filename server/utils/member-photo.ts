import { blob } from "@nuxthub/blob";

/** Photo keys are always created under the member's own org/member prefix (see photo.post.ts). */
export function isMemberPhotoKey(key: string, orgId: number, memberId: number): boolean {
  return key.startsWith(`members/${orgId}/${memberId}-`) && !key.includes("..");
}

/** Delete a photo and its thumbnail, ignoring objects that are already gone. */
export async function deleteMemberPhoto(photoKey: string): Promise<void> {
  try {
    await blob.del([photoKey, memberThumbKey(photoKey)]);
  }
  catch {
    // Already gone, ignore
  }
}
