import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./server/db/schema.ts";
import { DEFAULT_EXPENSE_CATEGORIES } from "./server/utils/expense-categories.ts";

const sqlite = new Database(".data/db.sqlite");
const db = drizzle(sqlite, { schema });

// Get all orgs without expense categories
const orgs = db.select().from(schema.organizations).all();

for (const org of orgs) {
  const existing = db
    .select()
    .from(schema.expenseCategories)
    .where(eq(schema.expenseCategories.orgId, org.id))
    .all();

  if (existing.length === 0) {
    console.log(`Seeding expense categories for org ${org.id} (${org.name})...`);
    const defaultCategories = DEFAULT_EXPENSE_CATEGORIES[org.type] || DEFAULT_EXPENSE_CATEGORIES.other;
    
    db.insert(schema.expenseCategories).values(
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
    console.log(`Org ${org.id} (${org.name}) already has ${existing.length} categories`);
  }
}

sqlite.close();
console.log("Done!");
