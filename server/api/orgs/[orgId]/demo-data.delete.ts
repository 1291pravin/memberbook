import { eq, inArray } from "drizzle-orm";
import type { DemoIds } from "~~/server/utils/demo-data";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const [org] = await db
    .select({ demoDataIds: schema.organizations.demoDataIds })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  if (!org?.demoDataIds) {
    throw createError({
      statusCode: 400,
      statusMessage: "No sample data to clear.",
    });
  }

  const ids: DemoIds = JSON.parse(org.demoDataIds);

  // Delete in reverse FK order

  // Seat assignments
  if (ids.seatAssignmentIds?.length) {
    await db.delete(schema.memberSeatAssignments).where(inArray(schema.memberSeatAssignments.id, ids.seatAssignmentIds));
  }

  // Seats
  if (ids.seatIds?.length) {
    await db.delete(schema.librarySeats).where(inArray(schema.librarySeats.id, ids.seatIds));
  }

  // Seat batches
  if (ids.seatBatchIds?.length) {
    await db.delete(schema.seatBatches).where(inArray(schema.seatBatches.id, ids.seatBatchIds));
  }

  // Payments — delete demo payments AND any user-created payments referencing demo subscriptions
  if (ids.subscriptionIds?.length) {
    await db.delete(schema.payments).where(inArray(schema.payments.subscriptionId, ids.subscriptionIds));
  }
  // Also delete any payments referencing demo members (payments without subscription link)
  if (ids.memberIds?.length) {
    await db.delete(schema.payments).where(inArray(schema.payments.memberId, ids.memberIds));
  }

  // Subscriptions — delete demo subs AND any user-created subs referencing demo plans/members
  if (ids.subscriptionIds?.length) {
    await db.delete(schema.memberSubscriptions).where(inArray(schema.memberSubscriptions.id, ids.subscriptionIds));
  }
  // Also clean up any user-created subscriptions that reference demo members
  if (ids.memberIds?.length) {
    await db.delete(schema.memberSubscriptions).where(inArray(schema.memberSubscriptions.memberId, ids.memberIds));
  }

  // Check-ins referencing demo members
  if (ids.memberIds?.length) {
    await db.delete(schema.checkIns).where(inArray(schema.checkIns.memberId, ids.memberIds));
  }

  // Members
  if (ids.memberIds?.length) {
    await db.delete(schema.members).where(inArray(schema.members.id, ids.memberIds));
  }

  // Inquiries
  if (ids.inquiryIds?.length) {
    await db.delete(schema.inquiries).where(inArray(schema.inquiries.id, ids.inquiryIds));
  }

  // Plans — delete any user-created subscriptions referencing demo plans first
  if (ids.planIds?.length) {
    await db.delete(schema.memberSubscriptions).where(inArray(schema.memberSubscriptions.planId, ids.planIds));
    await db.delete(schema.subscriptionPlans).where(inArray(schema.subscriptionPlans.id, ids.planIds));
  }

  // Clear the demoDataIds flag
  await db
    .update(schema.organizations)
    .set({ demoDataIds: null })
    .where(eq(schema.organizations.id, access.orgId));


  return { success: true };
});
