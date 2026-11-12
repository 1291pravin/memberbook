import { eq } from "drizzle-orm";

/** One upload with everything needed to read it: pasted text, file list and the business's current plans. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const upload = await getUploadOr404(event);

  const [org] = await db.select({
    id: schema.organizations.id,
    name: schema.organizations.name,
    type: schema.organizations.type,
    upiId: schema.organizations.upiId,
  }).from(schema.organizations).where(eq(schema.organizations.id, upload.orgId)).limit(1);

  const plans = await db.select({
    name: schema.subscriptionPlans.name,
    price: schema.subscriptionPlans.price,
    durationType: schema.subscriptionPlans.durationType,
    durationValue: schema.subscriptionPlans.durationValue,
  }).from(schema.subscriptionPlans).where(eq(schema.subscriptionPlans.orgId, upload.orgId));

  return {
    id: upload.id,
    status: upload.status,
    source: upload.source,
    org,
    existingPlans: plans.map(p => ({ ...p, price: p.price / 100 })),
    files: parseUploadFiles(upload.files).map(({ name, type, size }, index) => ({ index, name, type, size })),
    text: upload.text,
    note: upload.note,
    result: parseUploadResult(upload.result),
    message: upload.message,
    createdAt: upload.createdAt,
    today: todayIST(),
  };
});
