export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readBody(event);
  const { name, type } = body;

  if (!name || !type) {
    throw createError({ statusCode: 400, statusMessage: "Name and type are required" });
  }

  const validTypes = ["gym", "library", "tuition", "other"];
  if (!validTypes.includes(type)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid organization type" });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36);

  const orgResult = await db.insert(schema.organizations).values({
    name: name.trim(),
    slug,
    type,
  }).returning();

  const org = orgResult[0];

  await db.insert(schema.orgMemberships).values({
    userId: user.id,
    orgId: org.id,
    role: "owner",
  });

  // Seed default expense categories for the organization
  const { DEFAULT_EXPENSE_CATEGORIES } = await import("../../utils/expense-categories");
  const defaultCategories = DEFAULT_EXPENSE_CATEGORIES[type] || DEFAULT_EXPENSE_CATEGORIES.other;

  await db.insert(schema.expenseCategories).values(
    defaultCategories.map((cat) => ({
      orgId: org.id,
      name: cat.name,
      description: cat.description,
      color: cat.color,
      isSystem: true,
      isActive: true,
      displayOrder: cat.displayOrder,
    }))
  );

  // Create onboarding progress record
  await db.insert(schema.onboardingProgress).values({
    orgId: org.id,
    orgSetupCompleted: true,
    staffOnboardingCompleted: false,
    plansSetupCompleted: false,
    businessSetupCompleted: type === 'library' ? false : true, // Auto-complete for non-libraries
    dashboardTourCompleted: true, // Auto-complete since tour is not implemented yet
  });

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
    currentOrg: { orgId: org.id, name: org.name, slug: org.slug, type: org.type, role: "owner" },
  });

  return { org };
});
