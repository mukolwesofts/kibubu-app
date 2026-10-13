"use client";

import { useActionState } from "react";
import type { BudgetItem, Income } from "@/db/schema";
import {
  addBudgetItem,
  addIncome,
  deleteBudgetItem,
  deleteIncome,
  updateBudgetItem,
  updateIncome,
  type BudgetState,
} from "./actions";

const inputCls =
  "w-full min-w-0 rounded-lg border border-mist bg-transparent px-3 py-2 text-sm outline-none focus:border-navy";
const amountCls = `${inputCls} text-right tabular-nums`;
const saveCls =
  "rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-50";
const delCls = "rounded-lg px-2 py-2 text-xs font-semibold text-muted";

export function AddIncomeForm({
  periodId,
  today,
}: {
  periodId: string;
  today: string;
}) {
  const [state, action, pending] = useActionState<BudgetState, FormData>(
    addIncome,
    {},
  );
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="periodId" value={periodId} />
      <div className="flex gap-2">
        <input
          name="source"
          required
          placeholder="Salary, gig…"
          className={inputCls}
        />
        <input
          name="amount"
          required
          inputMode="numeric"
          placeholder="0"
          className={`${amountCls} w-28`}
        />
      </div>
      <div className="flex gap-2">
        <input name="date" type="date" required defaultValue={today} className={inputCls} />
        <button type="submit" disabled={pending} className="shrink-0 rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Add income
        </button>
      </div>
      {state.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
    </form>
  );
}

export function IncomeRow({ entry }: { entry: Income }) {
  const [state, action, pending] = useActionState<BudgetState, FormData>(
    updateIncome,
    {},
  );
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={entry.id} />
      <div className="flex items-center gap-2">
        <input name="source" required defaultValue={entry.source} className={inputCls} />
        <input
          name="amount"
          required
          inputMode="numeric"
          defaultValue={entry.amount}
          className={`${amountCls} w-28`}
        />
        <input name="date" type="date" required defaultValue={entry.date} className={`${inputCls} w-[9.5rem]`} />
        <button type="submit" disabled={pending} className={saveCls}>
          Save
        </button>
        <button formAction={deleteIncome} className={delCls} aria-label="Delete income">
          ✕
        </button>
      </div>
      {state.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
    </form>
  );
}

export function AddBudgetItemForm({ periodId }: { periodId: string }) {
  const [state, action, pending] = useActionState<BudgetState, FormData>(
    addBudgetItem,
    {},
  );
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="periodId" value={periodId} />
      <div className="flex gap-2">
        <input name="name" required placeholder="Category name" className={inputCls} />
        <input
          name="plannedAmount"
          required
          inputMode="numeric"
          placeholder="0"
          className={`${amountCls} w-28`}
        />
        <button type="submit" disabled={pending} className="shrink-0 rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Add
        </button>
      </div>
      {state.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
    </form>
  );
}

export function BudgetItemRow({ item }: { item: BudgetItem }) {
  const [state, action, pending] = useActionState<BudgetState, FormData>(
    updateBudgetItem,
    {},
  );
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={item.id} />
      <div className="flex items-center gap-2">
        <input name="name" required defaultValue={item.name} className={inputCls} />
        <input
          name="plannedAmount"
          required
          inputMode="numeric"
          defaultValue={item.plannedAmount}
          className={`${amountCls} w-28`}
        />
        <button type="submit" disabled={pending} className={saveCls}>
          Save
        </button>
        <button formAction={deleteBudgetItem} className={delCls} aria-label="Delete category">
          ✕
        </button>
      </div>
      {state.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
    </form>
  );
}
