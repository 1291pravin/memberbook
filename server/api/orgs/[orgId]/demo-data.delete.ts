import { and, eq, inArray, or } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { DemoIds } from "~~/server/utils/demo-data";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const orgId = access.orgId;

  const [org] = await db
    .select({ demoDataIds: schema.organizations.demoDataIds })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1);

  if (!org?.demoDataIds) {
    throw createError({
      statusCode: 400,
      statusMessage: "No sample data to clear.",
    });
  }

  const ids: DemoIds = JSON.parse(org.demoDataIds);
  const memberIds = ids.memberIds ?? [];
  const subscriptionIds = ids.subscriptionIds ?? [];
  const planIds = ids.planIds ?? [];
  const seatIds = ids.seatIds ?? [];
  const seatBatchIds = ids.seatBatchIds ?? [];
  const seatAssignmentIds = ids.seatAssignmentIds ?? [];
  const inquiryIds = ids.inquiryIds ?? [];

  // D1 enforces foreign keys, so rows that point at sample records (including
  // real check-ins on sample seats, or real members put on sample plans) must
  // be removed or detached before the sample records themselves. Everything
  // runs in one batch, which D1 executes as a single transaction: either all
  // sample data is cleared, or nothing changes.
  const stmts: BatchItem<"sqlite">[] = [];

  if (memberIds.length) {
    stmts.push(db.delete(schema.checkIns).where(and(
      eq(schema.checkIns.orgId, orgId),
      inArray(schema.checkIns.memberId, memberIds),
    )));
  }
  // Real members' check-ins keep their history but lose the link to the sample
  // seat/batch (the seat number and batch name are stored as text as well).
  if (seatIds.length) {
    stmts.push(db.update(schema.checkIns).set({ seatId: null }).where(and(
      eq(schema.checkIns.orgId, orgId),
      inArray(schema.checkIns.seatId, seatIds),
    )));
  }
  if (seatBatchIds.length) {
    stmts.push(db.update(schema.checkIns).set({ batchId: null }).where(and(
      eq(schema.checkIns.orgId, orgId),
      inArray(schema.checkIns.batchId, seatBatchIds),
    )));
  }

  const assignmentConditions = [
    seatAssignmentIds.length ? inArray(schema.memberSeatAssignments.id, seatAssignmentIds) : undefined,
    memberIds.length ? inArray(schema.memberSeatAssignments.memberId, memberIds) : undefined,
    seatIds.length ? inArray(schema.memberSeatAssignments.seatId, seatIds) : undefined,
    seatBatchIds.length ? inArray(schema.memberSeatAssignments.batchId, seatBatchIds) : undefined,
  ].filter(Boolean);
  if (assignmentConditions.length) {
    stmts.push(db.delete(schema.memberSeatAssignments).where(and(
      eq(schema.memberSeatAssignments.orgId, orgId),
      or(...assignmentConditions),
    )));
  }

  // Payments by sample members go away with them.
  if (memberIds.length) {
    stmts.push(db.delete(schema.payments).where(and(
      eq(schema.payments.orgId, orgId),
      inArray(schema.payments.memberId, memberIds),
    )));
  }
  // Real members' payments are kept, unlinked from any subscription that is
  // about to be deleted (sample subscriptions, or real ones on a sample plan).
  const doomedSubscriptions = [
    subscriptionIds.length ? inArray(schema.memberSubscriptions.id, subscriptionIds) : undefined,
    planIds.length ? inArray(schema.memberSubscriptions.planId, planIds) : undefined,
    memberIds.length ? inArray(schema.memberSubscriptions.memberId, memberIds) : undefined,
  ].filter(Boolean);
  if (doomedSubscriptions.length) {
    const doomedIds = db
      .select({ id: schema.memberSubscriptions.id })
      .from(schema.memberSubscriptions)
      .where(and(eq(schema.memberSubscriptions.orgId, orgId), or(...doomedSubscriptions)));
    stmts.push(db.update(schema.payments).set({ subscriptionId: null }).where(and(
      eq(schema.payments.orgId, orgId),
      inArray(schema.payments.subscriptionId, doomedIds),
    )));
    stmts.push(db.delete(schema.memberSubscriptions).where(and(
      eq(schema.memberSubscriptions.orgId, orgId),
      or(...doomedSubscriptions),
    )));
  }

  if (memberIds.length) {
    stmts.push(db.delete(schema.members).where(and(
      eq(schema.members.orgId, orgId),
      inArray(schema.members.id, memberIds),
    )));
  }
  if (inquiryIds.length) {
    stmts.push(db.delete(schema.inquiries).where(and(
      eq(schema.inquiries.orgId, orgId),
      inArray(schema.inquiries.id, inquiryIds),
    )));
  }
  if (seatIds.length) {
    stmts.push(db.delete(schema.librarySeats).where(and(
      eq(schema.librarySeats.orgId, orgId),
      inArray(schema.librarySeats.id, seatIds),
    )));
  }
  if (seatBatchIds.length) {
    stmts.push(db.delete(schema.seatBatches).where(and(
      eq(schema.seatBatches.orgId, orgId),
      inArray(schema.seatBatches.id, seatBatchIds),
    )));
  }
  if (planIds.length) {
    stmts.push(db.delete(schema.subscriptionPlans).where(and(
      eq(schema.subscriptionPlans.orgId, orgId),
      inArray(schema.subscriptionPlans.id, planIds),
    )));
  }

  stmts.push(db
    .update(schema.organizations)
    .set({ demoDataIds: null })
    .where(eq(schema.organizations.id, orgId)));

  await db.batch(stmts as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);

  return { success: true };
});
