function uid() {
  return Math.random().toString(36).slice(2, 8);
}

export function makeUser(overrides: Partial<{ email: string; password: string; name: string }> = {}) {
  const id = uid();
  return {
    email: `testuser${id}@test.com`,
    password: "password123",
    name: `Test User ${id}`,
    ...overrides,
  };
}

export function makeOrg(overrides: Partial<{ name: string; type: string }> = {}) {
  const id = uid();
  return {
    name: `Test Org ${id}`,
    type: "gym",
    ...overrides,
  };
}

export function makeMember(overrides: Partial<{ name: string; phone: string; email: string; notes: string }> = {}) {
  const id = uid();
  return {
    name: `Member ${id}`,
    phone: `98765${String(id).padStart(5, "0")}`,
    email: `member${id}@test.com`,
    ...overrides,
  };
}

export function makePlan(overrides: Partial<{ name: string; price: number; durationDays: number }> = {}) {
  const id = uid();
  return {
    name: `Plan ${id}`,
    price: 100000, // 1000 INR in paise
    durationDays: 30,
    ...overrides,
  };
}

export function makePayment(
  memberId: number,
  overrides: Partial<{ amount: number; date: string; method: string; notes: string; subscriptionId: number }> = {},
) {
  return {
    memberId,
    amount: 100000,
    date: new Date().toISOString().split("T")[0],
    method: "cash",
    ...overrides,
  };
}

export function makeInquiry(overrides: Partial<{ name: string; phone: string; email: string; interest: string; notes: string }> = {}) {
  const id = uid();
  return {
    name: `Inquiry ${id}`,
    phone: `91234${String(id).padStart(5, "0")}`,
    interest: "Gym membership",
    ...overrides,
  };
}
