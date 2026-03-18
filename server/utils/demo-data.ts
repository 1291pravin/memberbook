import { calculateEndDate } from "./subscription";

interface DemoIds {
  planIds: number[];
  memberIds: number[];
  subscriptionIds: number[];
  paymentIds: number[];
  inquiryIds: number[];
  seatBatchIds: number[];
  seatIds: number[];
  seatAssignmentIds: number[];
}

function today(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const PLANS_BY_TYPE: Record<string, Array<{ name: string; price: number; durationType: string; durationValue: number }>> = {
  gym: [
    { name: "Monthly", price: 150000, durationType: "monthly", durationValue: 1 },
    { name: "Quarterly", price: 400000, durationType: "monthly", durationValue: 3 },
    { name: "Annual", price: 1500000, durationType: "yearly", durationValue: 1 },
  ],
  library: [
    { name: "Monthly", price: 100000, durationType: "monthly", durationValue: 1 },
    { name: "Quarterly", price: 270000, durationType: "monthly", durationValue: 3 },
    { name: "Annual", price: 1000000, durationType: "yearly", durationValue: 1 },
  ],
  tuition: [
    { name: "Monthly", price: 200000, durationType: "monthly", durationValue: 1 },
    { name: "Quarterly", price: 550000, durationType: "monthly", durationValue: 3 },
    { name: "Annual", price: 2000000, durationType: "yearly", durationValue: 1 },
  ],
  other: [
    { name: "Monthly", price: 150000, durationType: "monthly", durationValue: 1 },
    { name: "Quarterly", price: 400000, durationType: "monthly", durationValue: 3 },
    { name: "Annual", price: 1500000, durationType: "yearly", durationValue: 1 },
  ],
};

const INDIAN_NAMES = [
  { name: "Aarav Sharma", gender: "male", phone: "9876543210" },
  { name: "Priya Patel", gender: "female", phone: "9876543211" },
  { name: "Rohan Gupta", gender: "male", phone: "9876543212" },
  { name: "Ananya Singh", gender: "female", phone: "9876543213" },
  { name: "Vikram Reddy", gender: "male", phone: "9876543214" },
  { name: "Sneha Joshi", gender: "female", phone: "9876543215" },
  { name: "Arjun Nair", gender: "male", phone: "9876543216" },
  { name: "Kavita Desai", gender: "female", phone: "9876543217" },
  { name: "Rahul Verma", gender: "male", phone: "9876543218" },
  { name: "Meera Iyer", gender: "female", phone: "9876543219" },
  { name: "Aditya Kumar", gender: "male", phone: "9876543220" },
  { name: "Pooja Mehta", gender: "female", phone: "9876543221" },
  { name: "Karan Malhotra", gender: "male", phone: "9876543222" },
  { name: "Divya Rao", gender: "female", phone: "9876543223" },
  { name: "Siddharth Jain", gender: "male", phone: "9876543224" },
];

const INQUIRY_NAMES = [
  { name: "Neha Kapoor", phone: "9876543230" },
  { name: "Amit Tiwari", phone: "9876543231" },
  { name: "Ritu Saxena", phone: "9876543232" },
  { name: "Varun Bhat", phone: "9876543233" },
  { name: "Swati Chopra", phone: "9876543234" },
];

// Each member gets a subscription config: which plan index, how the dates/status work
interface SubConfig {
  memberIndex: number;
  planIndex: number; // 0=monthly, 1=quarterly, 2=annual
  startDaysAgo: number;
  status: "active" | "expired";
  memberStatus: "active" | "inactive";
  paymentStatus: "paid" | "unpaid" | "partial";
}

// 15 members, varied subscription scenarios
const SUB_CONFIGS: SubConfig[] = [
  // 5 active healthy (ending 30-60 days out) — monthly plans started recently
  { memberIndex: 0, planIndex: 0, startDaysAgo: 5, status: "active", memberStatus: "active", paymentStatus: "paid" },
  { memberIndex: 1, planIndex: 0, startDaysAgo: 10, status: "active", memberStatus: "active", paymentStatus: "paid" },
  { memberIndex: 2, planIndex: 0, startDaysAgo: 7, status: "active", memberStatus: "active", paymentStatus: "paid" },
  { memberIndex: 3, planIndex: 0, startDaysAgo: 3, status: "active", memberStatus: "active", paymentStatus: "paid" },
  { memberIndex: 4, planIndex: 0, startDaysAgo: 12, status: "active", memberStatus: "active", paymentStatus: "paid" },
  // 3 expiring within 7 days (started ~25 days ago for monthly plan)
  { memberIndex: 5, planIndex: 0, startDaysAgo: 26, status: "active", memberStatus: "active", paymentStatus: "paid" },
  { memberIndex: 6, planIndex: 0, startDaysAgo: 28, status: "active", memberStatus: "active", paymentStatus: "paid" },
  { memberIndex: 7, planIndex: 0, startDaysAgo: 27, status: "active", memberStatus: "active", paymentStatus: "unpaid" },
  // 2 already expired
  { memberIndex: 8, planIndex: 0, startDaysAgo: 45, status: "expired", memberStatus: "active", paymentStatus: "paid" },
  { memberIndex: 9, planIndex: 0, startDaysAgo: 40, status: "expired", memberStatus: "active", paymentStatus: "unpaid" },
  // 3 long-term (quarterly/annual)
  { memberIndex: 10, planIndex: 1, startDaysAgo: 30, status: "active", memberStatus: "active", paymentStatus: "paid" },
  { memberIndex: 11, planIndex: 2, startDaysAgo: 60, status: "active", memberStatus: "active", paymentStatus: "partial" },
  // 2 more monthly with partial/unpaid
  { memberIndex: 12, planIndex: 0, startDaysAgo: 8, status: "active", memberStatus: "active", paymentStatus: "partial" },
  // Inactive members (no active subscription)
  { memberIndex: 13, planIndex: 0, startDaysAgo: 90, status: "expired", memberStatus: "inactive", paymentStatus: "paid" },
  { memberIndex: 14, planIndex: 0, startDaysAgo: 120, status: "expired", memberStatus: "inactive", paymentStatus: "paid" },
];

export function generateDemoPlans(orgType: string, orgId: number) {
  const templates = PLANS_BY_TYPE[orgType] || PLANS_BY_TYPE.other!;
  return templates!.map((t) => ({
    orgId,
    name: t.name,
    price: t.price,
    durationType: t.durationType,
    durationValue: t.durationValue,
    active: true,
    createdAt: new Date().toISOString(),
  }));
}

export function generateDemoMembers(orgId: number) {
  const now = new Date().toISOString();
  return INDIAN_NAMES.map((m, i) => ({
    orgId,
    name: m.name,
    phone: m.phone,
    email: null,
    gender: m.gender,
    status: SUB_CONFIGS[i]!.memberStatus,
    notes: null,
    fatherName: null,
    address: null,
    batch: null,
    createdAt: now,
  }));
}

export function generateDemoSubscriptions(
  orgId: number,
  planIds: number[],
  memberIds: number[],
  orgType: string,
) {
  const plans = PLANS_BY_TYPE[orgType] || PLANS_BY_TYPE.other!;
  const now = new Date().toISOString();

  return SUB_CONFIGS.map((cfg) => {
    const plan = plans![cfg.planIndex]!;
    const startDate = daysFromNow(-cfg.startDaysAgo);
    const endDate = calculateEndDate(startDate, plan.durationType, plan.durationValue);

    // Determine actual status based on end date
    const todayStr = today();
    const actualStatus = endDate < todayStr ? "expired" : "active";

    return {
      orgId,
      memberId: memberIds[cfg.memberIndex]!,
      planId: planIds[cfg.planIndex]!,
      startDate,
      endDate,
      amount: plan.price,
      status: actualStatus,
      autoRenew: true,
      paymentStatus: cfg.paymentStatus,
      createdAt: now,
    };
  });
}

export function generateDemoPayments(
  orgId: number,
  memberIds: number[],
  subscriptionIds: number[],
  subscriptions: Array<{ amount: number; startDate: string; paymentStatus: string; memberId: number }>,
) {
  const payments: Array<{
    orgId: number;
    memberId: number;
    subscriptionId: number;
    amount: number;
    method: string;
    date: string;
    notes: string | null;
    createdAt: string;
  }> = [];
  const methods = ["cash", "upi", "card", "bank_transfer"];
  const now = new Date().toISOString();

  subscriptions.forEach((sub, i) => {
    if (sub.paymentStatus === "paid") {
      payments.push({
        orgId,
        memberId: sub.memberId,
        subscriptionId: subscriptionIds[i]!,
        amount: sub.amount,
        method: randomPick(methods),
        date: sub.startDate,
        notes: null,
        createdAt: now,
      });
    } else if (sub.paymentStatus === "partial") {
      payments.push({
        orgId,
        memberId: sub.memberId,
        subscriptionId: subscriptionIds[i]!,
        amount: Math.round(sub.amount * 0.5),
        method: randomPick(methods),
        date: sub.startDate,
        notes: "Partial payment",
        createdAt: now,
      });
    }
    // unpaid = no payment record
  });

  return payments;
}

export function generateDemoInquiries(orgId: number) {
  const statuses = ["new", "new", "contacted", "converted", "lost"];
  const now = new Date().toISOString();

  return INQUIRY_NAMES.map((inq, i) => ({
    orgId,
    name: inq.name,
    phone: inq.phone,
    email: null,
    interest: "General inquiry",
    followUpDate: statuses[i] === "new" ? daysFromNow(3) : null,
    status: statuses[i],
    notes: null,
    createdAt: now,
  }));
}

export function generateDemoSeats(orgId: number) {
  const batches = [
    { orgId, name: "Morning", startTime: "06:00", endTime: "10:00", isActive: true, displayOrder: 1, createdAt: new Date().toISOString() },
    { orgId, name: "Afternoon", startTime: "12:00", endTime: "16:00", isActive: true, displayOrder: 2, createdAt: new Date().toISOString() },
    { orgId, name: "Evening", startTime: "17:00", endTime: "21:00", isActive: true, displayOrder: 3, createdAt: new Date().toISOString() },
  ];

  const seats: Array<{
    orgId: number;
    seatNumber: string;
    seatLabel: string | null;
    timePreference: string | null;
    genderPreference: string | null;
    isActive: boolean;
    displayOrder: number;
    notes: string | null;
    createdAt: string;
  }> = [];
  const now = new Date().toISOString();
  for (let i = 1; i <= 10; i++) {
    seats.push({
      orgId,
      seatNumber: `S${i}`,
      seatLabel: `Seat ${i}`,
      timePreference: "flexible",
      genderPreference: "any",
      isActive: true,
      displayOrder: i,
      notes: null,
      createdAt: now,
    });
  }

  return { batches, seats };
}

export function generateDemoSeatAssignments(
  orgId: number,
  memberIds: number[],
  seatIds: number[],
  batchIds: number[],
  assignedBy: number,
) {
  const now = new Date().toISOString();
  // Assign first 8 active members to seats across batches
  const activeMemberIds = memberIds.slice(0, 8);
  return activeMemberIds.map((memberId, i) => ({
    orgId,
    memberId,
    seatId: seatIds[i % seatIds.length],
    batchId: batchIds[i % batchIds.length],
    assignedAt: now,
    assignedBy,
    notes: null,
    createdAt: now,
  }));
}

export type { DemoIds };
