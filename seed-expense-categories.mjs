import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { organizations, expenseCategories } from "./server/db/schema.ts";

const DEFAULT_EXPENSE_CATEGORIES = {
  gym: [
    { name: "Staff Salaries", description: "Trainer and staff salaries", color: "blue", displayOrder: 1 },
    { name: "Rent & Utilities", description: "Rent, electricity, water", color: "purple", displayOrder: 2 },
    { name: "Equipment", description: "Gym equipment purchases", color: "green", displayOrder: 3 },
    { name: "Maintenance & Repairs", description: "Equipment maintenance and facility repairs", color: "orange", displayOrder: 4 },
    { name: "Marketing", description: "Advertising and promotions", color: "pink", displayOrder: 5 },
    { name: "Supplies", description: "Cleaning supplies, toiletries", color: "yellow", displayOrder: 6 },
    { name: "Insurance", description: "Business and liability insurance", color: "red", displayOrder: 7 },
    { name: "Licenses", description: "Business licenses and certifications", color: "indigo", displayOrder: 8 },
    { name: "Software", description: "Software subscriptions and tools", color: "cyan", displayOrder: 9 },
    { name: "Miscellaneous", description: "Other expenses", color: "slate", displayOrder: 10 },
  ],
  library: [
    { name: "Staff Salaries", description: "Librarian and staff salaries", color: "blue", displayOrder: 1 },
    { name: "Rent & Utilities", description: "Rent, electricity, water", color: "purple", displayOrder: 2 },
    { name: "Furniture", description: "Tables, chairs, shelves", color: "green", displayOrder: 3 },
    { name: "Books & Materials", description: "New books and study materials", color: "orange", displayOrder: 4 },
    { name: "Maintenance", description: "Facility maintenance and repairs", color: "pink", displayOrder: 5 },
    { name: "Marketing", description: "Advertising and promotions", color: "yellow", displayOrder: 6 },
    { name: "Cleaning & Security", description: "Cleaning and security services", color: "red", displayOrder: 7 },
    { name: "Software", description: "Software subscriptions and tools", color: "cyan", displayOrder: 8 },
    { name: "Stationery", description: "Stationery and office supplies", color: "indigo", displayOrder: 9 },
    { name: "Miscellaneous", description: "Other expenses", color: "slate", displayOrder: 10 },
  ],
  tuition: [
    { name: "Teacher Salaries", description: "Teacher salaries and incentives", color: "blue", displayOrder: 1 },
    { name: "Rent & Utilities", description: "Rent, electricity, water", color: "purple", displayOrder: 2 },
    { name: "Teaching Materials", description: "Books, worksheets, stationery", color: "green", displayOrder: 3 },
    { name: "Furniture & Equipment", description: "Desks, chairs, boards, projectors", color: "orange", displayOrder: 4 },
    { name: "Marketing", description: "Advertising and promotions", color: "pink", displayOrder: 5 },
    { name: "Software", description: "Educational software and tools", color: "cyan", displayOrder: 6 },
    { name: "Licenses & Certifications", description: "Business licenses and teacher certifications", color: "red", displayOrder: 7 },
    { name: "Administrative Expenses", description: "Office supplies and admin costs", color: "yellow", displayOrder: 8 },
    { name: "Miscellaneous", description: "Other expenses", color: "slate", displayOrder: 9 },
  ],
  other: [
    { name: "Salaries", description: "Employee salaries", color: "blue", displayOrder: 1 },
    { name: "Rent & Utilities", description: "Rent, electricity, water", color: "purple", displayOrder: 2 },
    { name: "Equipment", description: "Equipment and furniture", color: "green", displayOrder: 3 },
    { name: "Maintenance", description: "Maintenance and repairs", color: "orange", displayOrder: 4 },
    { name: "Marketing", description: "Marketing and advertising", color: "pink", displayOrder: 5 },
    { name: "Supplies", description: "Supplies and materials", color: "yellow", displayOrder: 6 },
    { name: "Software", description: "Software and subscriptions", color: "cyan", displayOrder: 7 },
    { name: "Miscellaneous", description: "Other expenses", color: "slate", displayOrder: 8 },
  ],
};

const sqlite = new Database(".data/db.sqlite");
const db = drizzle(sqlite, { schema: { organizations, expenseCategories } });

// Get all orgs
const orgs = db.select().from(organizations).all();

for (const org of orgs) {
  const existing = db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.orgId, org.id))
    .all();

  if (existing.length === 0) {
    console.log(`Seeding expense categories for org ${org.id} (${org.name}, type: ${org.type})...`);
    const defaultCategories = DEFAULT_EXPENSE_CATEGORIES[org.type] || DEFAULT_EXPENSE_CATEGORIES.other;

    db.insert(expenseCategories).values(
      defaultCategories.map((cat) => ({
        orgId: org.id,
        name: cat.name,
        description: cat.description,
        color: cat.color,
        isSystem: true,
        isActive: true,
        displayOrder: cat.displayOrder,
      }))
    ).run();

    console.log(`✓ Seeded ${defaultCategories.length} categories for ${org.name}`);
  } else {
    console.log(`✓ Org ${org.id} (${org.name}) already has ${existing.length} categories - skipping`);
  }
}

sqlite.close();
console.log("\n✅ Done!");
