// Seed script: creates a demo household with one sample period.
// Usage: npm run seed   (loads .env.local via util.parseEnv)
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    Object.assign(process.env, parseEnv(readFileSync(file, "utf8")));
  }
}

const { db } = await import("../src/db");
const { schema } = await import("../src/db");
const {
  households,
  users,
  periods,
  income,
  budgetItems,
  transactions,
  savingsGoals,
  savingsEntries,
  loans,
  loanPayments,
} = schema;

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

function monthLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });
}

async function main() {
  const householdId = crypto.randomUUID();
  await db.insert(households).values({ id: householdId, name: "Demo Household" });

  const userA = crypto.randomUUID();
  const userB = crypto.randomUUID();
  await db.insert(users).values([
    { id: userA, email: "you@example.com", name: "You", householdId },
    { id: userB, email: "spouse@example.com", name: "Spouse", householdId },
  ]);

  // Period starts on the 1st of this month, no end date (active).
  const start = todayISO();
  const periodStart = `${start.slice(0, 8)}01`;
  const periodId = crypto.randomUUID();
  await db.insert(periods).values({
    id: periodId,
    householdId,
    startDate: periodStart,
    label: monthLabel(periodStart),
  });

  await db.insert(income).values([
    { periodId, userId: userA, source: "Salary", amount: 120_000, date: periodStart },
    { periodId, userId: userB, source: "Salary", amount: 85_000, date: periodStart },
    { periodId, userId: userA, source: "Freelance gig", amount: 15_000, date: todayISO() },
  ]);

  const cats = [
    ["Rent", 45_000],
    ["Groceries", 24_000],
    ["Transport", 8_000],
    ["Utilities", 6_000],
    ["Eating out", 10_000],
    ["Misc", 5_000],
  ] as const;
  const itemIds: string[] = [];
  for (const [i, [name, planned]] of cats.entries()) {
    const itemId = crypto.randomUUID();
    itemIds.push(itemId);
    await db.insert(budgetItems).values({
      id: itemId,
      periodId,
      name,
      plannedAmount: planned,
      sort: i,
    });
  }

  await db.insert(transactions).values([
    { periodId, userId: userA, budgetItemId: itemIds[0], amount: 45_000, note: "Monthly rent", date: todayISO(-2) },
    { periodId, userId: userB, budgetItemId: itemIds[1], amount: 6_400, note: "Naivas run", date: todayISO(-2) },
    { periodId, userId: userA, budgetItemId: itemIds[2], amount: 1_500, note: "Fuel", date: todayISO(-1) },
    { periodId, userId: userB, budgetItemId: itemIds[4], amount: 2_800, note: "Lunch date", date: todayISO() },
  ]);

  const goalId = crypto.randomUUID();
  await db.insert(savingsGoals).values({
    id: goalId,
    householdId,
    name: "Emergency fund",
    target: 300_000,
  });
  await db.insert(savingsEntries).values([
    { goalId, userId: userA, type: "deposit", amount: 50_000, note: "Initial", date: todayISO(-10) },
    { goalId, userId: userB, type: "deposit", amount: 20_000, note: null, date: todayISO(-5) },
  ]);

  const loanId = crypto.randomUUID();
  await db.insert(loans).values({
    id: loanId,
    householdId,
    name: "Car loan",
    lender: "ABC Bank",
    startingBalance: 450_000,
  });
  await db.insert(loanPayments).values([
    { loanId, userId: userA, amount: 30_000, note: "Oct installment", date: todayISO(-8) },
  ]);

  console.log("Seeded demo household with sample period:", monthLabel(periodStart));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
