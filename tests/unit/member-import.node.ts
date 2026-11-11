// Run with: npx jiti tests/unit/member-import.node.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMemberImport, parseFlexibleDate, splitRows, matchHeader } from "../../shared/utils/member-import";

const plans = { planNames: ["Monthly", "Quarterly Plan"] };

test("reads Indian dates day-first and common formats", () => {
  assert.equal(parseFlexibleDate("05/01/2025"), "2025-01-05");
  assert.equal(parseFlexibleDate("5-1-25"), "2025-01-05");
  assert.equal(parseFlexibleDate("5.1.2025"), "2025-01-05");
  assert.equal(parseFlexibleDate("2025-01-05"), "2025-01-05");
  assert.equal(parseFlexibleDate("5 Jan 2025"), "2025-01-05");
  assert.equal(parseFlexibleDate("5th September, 2025"), "2025-09-05");
  assert.equal(parseFlexibleDate("Jan 5 2025"), "2025-01-05");
  assert.equal(parseFlexibleDate("45658"), "2025-01-01");
  assert.equal(parseFlexibleDate("31/02/2025"), null);
  assert.equal(parseFlexibleDate("hello"), null);
});

test("matches header spellings from registers", () => {
  assert.equal(matchHeader("Mobile No."), "phone");
  assert.equal(matchHeader("Member's Name"), "name");
  assert.equal(matchHeader("Fees (₹)"), "amountPaid");
  assert.equal(matchHeader("DOJ"), "startDate");
  assert.equal(matchHeader("Father Name"), "fatherName");
  assert.equal(matchHeader("Shift"), "batch");
  assert.equal(matchHeader("xyz"), null);
});

test("parses rows pasted from Excel with headers", () => {
  const text = "Name\tMobile No\tPackage\tJoining Date\tFees\tMode\tLocker\nAmit Sharma\t98765 43210\tmonthly\t05/01/2025\t₹1,000\tGPay\t12\nPriya\t+91 8765432109\tYoga\t\t500\tcash\t";
  const { rows, hasHeader, columns } = parseMemberImport(text, plans);
  assert.equal(hasHeader, true);
  assert.equal(columns.phone, "Mobile No");
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0]!.member, {
    name: "Amit Sharma", phone: "9876543210", plan: "Monthly", startDate: "2025-01-05",
    amountPaid: 1000, paymentMethod: "upi", notes: "Locker: 12",
  });
  assert.equal(rows[0]!.error, null);
  // Unknown plan: imported without it, with a warning and the plan kept in notes.
  assert.equal(rows[1]!.error, null);
  assert.equal(rows[1]!.member.plan, undefined);
  assert.equal(rows[1]!.member.phone, "8765432109");
  assert.match(rows[1]!.warnings[0]!, /No plan called "Yoga"/);
  assert.match(rows[1]!.member.notes!, /Plan: Yoga/);
});

test("parses a plain list typed or copied from WhatsApp", () => {
  const text = "1. Amit Sharma - 98765 43210\n2) Priya Kumar 8765432109 (morning batch)\nRahul\n";
  const { rows, hasHeader } = parseMemberImport(text, plans);
  assert.equal(hasHeader, false);
  assert.equal(rows.length, 3);
  assert.equal(rows[0]!.member.name, "Amit Sharma");
  assert.equal(rows[0]!.member.phone, "9876543210");
  assert.equal(rows[1]!.member.name, "Priya Kumar");
  assert.equal(rows[1]!.member.phone, "8765432109");
  assert.equal(rows[1]!.member.notes, "morning batch");
  assert.equal(rows[2]!.member.name, "Rahul");
  assert.equal(rows[2]!.error, null);
});

test("guesses columns in a CSV without headers", () => {
  const text = "Amit,9876543210,05/01/2025\nPriya,8765432109,06/01/2025\n";
  const { rows, hasHeader } = parseMemberImport(text, plans);
  assert.equal(hasHeader, false);
  assert.equal(rows[0]!.member.name, "Amit");
  assert.equal(rows[0]!.member.phone, "9876543210");
  assert.equal(rows[0]!.member.notes, "Joined: 2025-01-05");
});

test("keeps the old template columns working and flags missing names", () => {
  const text = "name,phone,email,status,notes,fatherName,address,batch,plan,startDate,amountPaid,paymentMethod\n\"Doe, John\",9876543210,john@example.com,active,New,Robert,\"1 Main St, City\",Morning,Quarterly Plan,2025-01-01,500,upi\n,9876543211,,,,,,,,,,\n";
  const { rows } = parseMemberImport(text, plans);
  assert.equal(rows[0]!.member.name, "Doe, John");
  assert.equal(rows[0]!.member.address, "1 Main St, City");
  assert.equal(rows[0]!.member.plan, "Quarterly Plan");
  assert.equal(rows[0]!.member.paymentMethod, "upi");
  assert.equal(rows[1]!.error, "Name is missing");
});

test("bad phone numbers don't block the row", () => {
  const { rows } = parseMemberImport("Name,Phone\nAmit,12345\n", plans);
  assert.equal(rows[0]!.error, null);
  assert.equal(rows[0]!.member.phone, undefined);
  assert.match(rows[0]!.member.notes!, /Phone: 12345/);
});

test("detects semicolon CSVs", () => {
  assert.deepEqual(splitRows("a;b\nc;d"), [["a", "b"], ["c", "d"]]);
});

test("amounts above the plan price go to notes instead of failing", () => {
  const { rows } = parseMemberImport("Name,Plan,Start,Paid\nAmit,Monthly,01/01/2025,3000\n", { planNames: ["Monthly"], planPrices: { monthly: 100000 } });
  assert.equal(rows[0]!.member.plan, "Monthly");
  assert.equal(rows[0]!.member.amountPaid, undefined);
  assert.match(rows[0]!.member.notes!, /Paid: ₹3000/);
});
