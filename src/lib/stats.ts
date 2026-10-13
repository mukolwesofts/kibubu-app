import type { BudgetItem, Income, Period, Transaction } from "@/db/schema";
import { daysBetween } from "./dates";

export type PeriodStatus = "good" | "watch" | "over" | "ended";

export interface CategoryStat {
  item: BudgetItem;
  spent: number;
}

export interface PeriodStats {
  totalIncome: number;
  totalSpent: number;
  remaining: number;
  daysElapsed: number;
  daysLeft: number;
  totalDays: number;
  dailyAllowance: number | null;
  status: PeriodStatus;
  byItem: CategoryStat[];
  uncategorized: number;
}

export function periodEndForDisplay(period: Period): string {
  if (period.endDate) return period.endDate;
  // An open period is treated as running to the end of its start month.
  const [y, m] = period.startDate.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return last;
}

export function computePeriodStats(
  period: Period,
  incomeRows: Income[],
  items: BudgetItem[],
  txs: Transaction[],
  today: string,
): PeriodStats {
  const totalIncome = incomeRows.reduce((s, r) => s + r.amount, 0);
  const totalSpent = txs.reduce((s, r) => s + r.amount, 0);
  const remaining = totalIncome - totalSpent;

  const end = periodEndForDisplay(period);
  const effectiveToday = today > end ? end : today;
  const totalDays = Math.max(daysBetween(period.startDate, end) + 1, 1);
  const daysElapsed = Math.min(
    Math.max(daysBetween(period.startDate, effectiveToday) + 1, 0),
    totalDays,
  );
  const daysLeft = Math.max(daysBetween(today, end), 0);

  const closed = period.endDate !== null || today > end;
  const dailyAllowance = closed || daysLeft === 0 ? null : Math.floor(remaining / daysLeft);

  const spentPct = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : totalSpent > 0 ? 100 : 0;
  const elapsedPct = (daysElapsed / totalDays) * 100;
  const status: PeriodStatus = closed
    ? "ended"
    : spentPct <= elapsedPct
      ? "good"
      : spentPct <= elapsedPct + 10
        ? "watch"
        : "over";

  const spentByItem = new Map<string, number>();
  let uncategorized = 0;
  for (const t of txs) {
    if (t.budgetItemId) {
      spentByItem.set(t.budgetItemId, (spentByItem.get(t.budgetItemId) ?? 0) + t.amount);
    } else {
      uncategorized += t.amount;
    }
  }
  const byItem = items.map((item) => ({
    item,
    spent: spentByItem.get(item.id) ?? 0,
  }));

  return {
    totalIncome,
    totalSpent,
    remaining,
    daysElapsed,
    daysLeft,
    totalDays,
    dailyAllowance,
    status,
    byItem,
    uncategorized,
  };
}
