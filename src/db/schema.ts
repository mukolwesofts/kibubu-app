import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

// Tenant Based System
export const households = sqliteTable("households", {
  id: id(),
  name: text("name").notNull(),
});

// User Management
export const users = sqliteTable(
  "users",
  {
    id: id(),
    email: text("email").notNull().unique(),
    name: text("name"),
    reminderEnabled: integer("reminder_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id),
  },
  (t) => [index("users_household_idx").on(t.householdId)],
);

export const invites = sqliteTable(
  "invites",
  {
    id: id(),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id),
    email: text("email").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("invites_email_idx").on(t.email)],
);

// OTP Management
export const otpCodes = sqliteTable(
  "otp_codes",
  {
    id: id(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("otp_email_idx").on(t.email)],
);

// Period Management
export const periods = sqliteTable(
  "periods",
  {
    id: id(),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id),
    startDate: text("start_date").notNull(), // YYYY-MM-DD
    endDate: text("end_date"), // null = active period
    label: text("label").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("periods_household_idx").on(t.householdId)],
);

// Income Management
export const income = sqliteTable(
  "income",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    source: text("source").notNull(),
    amount: integer("amount").notNull(), // integer KES shillings
    date: text("date").notNull(), // YYYY-MM-DD
  },
  (t) => [index("income_period_idx").on(t.periodId)],
);

// Budget Items Management
export const budgetItems = sqliteTable(
  "budget_items",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    name: text("name").notNull(),
    plannedAmount: integer("planned_amount").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("budget_items_period_idx").on(t.periodId)],
);

// Transaction Management
export const transactions = sqliteTable(
  "transactions",
  {
    id: id(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    budgetItemId: text("budget_item_id").references(() => budgetItems.id),
    amount: integer("amount").notNull(), // integer KES shillings
    note: text("note"),
    date: text("date").notNull(), // YYYY-MM-DD
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("transactions_period_idx").on(t.periodId),
    index("transactions_user_date_idx").on(t.userId, t.date),
  ],
);

// Savings Goals Management
export const savingsGoals = sqliteTable(
  "savings_goals",
  {
    id: id(),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id),
    name: text("name").notNull(),
    target: integer("target"), // nullable; integer KES
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("savings_goals_household_idx").on(t.householdId)],
);

// Savings Entries Management
export const savingsEntries = sqliteTable(
  "savings_entries",
  {
    id: id(),
    goalId: text("goal_id")
      .notNull()
      .references(() => savingsGoals.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type", { enum: ["deposit", "withdrawal"] }).notNull(),
    amount: integer("amount").notNull(),
    note: text("note"),
    date: text("date").notNull(), // YYYY-MM-DD
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("savings_entries_goal_idx").on(t.goalId)],
);

// Loans Management
export const loans = sqliteTable(
  "loans",
  {
    id: id(),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id),
    name: text("name").notNull(),
    lender: text("lender").notNull(),
    startingBalance: integer("starting_balance").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("loans_household_idx").on(t.householdId)],
);

// Loan Payments Management
export const loanPayments = sqliteTable(
  "loan_payments",
  {
    id: id(),
    loanId: text("loan_id")
      .notNull()
      .references(() => loans.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(),
    note: text("note"),
    date: text("date").notNull(), // YYYY-MM-DD
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("loan_payments_loan_idx").on(t.loanId)],
);

// Type Exports
export type User = typeof users.$inferSelect;
export type Household = typeof households.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type Period = typeof periods.$inferSelect;
export type Income = typeof income.$inferSelect;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type SavingsEntry = typeof savingsEntries.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type LoanPayment = typeof loanPayments.$inferSelect;
