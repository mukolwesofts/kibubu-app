"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { BudgetItem, Transaction } from "@/db/schema";
import { formatKES } from "@/lib/money";
import { Modal } from "@/components/modal";
import {
    addTransaction,
    deleteTransaction,
    updateTransaction,
    type SpendState,
} from "./actions";

const inputCls =
    "w-full rounded-xl border border-mist bg-transparent px-4 py-3 text-sm outline-none focus:border-navy";

export type ItemOption = Pick<BudgetItem, "id" | "name">;

function Fields({
    items,
    today,
    tx,
    autoFocus = false,
}: {
    items: ItemOption[];
    today: string;
    tx?: Transaction;
    autoFocus?: boolean;
}) {
    return (
        <div className="space-y-3">
            <input
                name="amount"
                required
                inputMode="numeric"
                autoFocus={autoFocus}
                defaultValue={tx?.amount}
                placeholder="Amount (KSh)"
                className={`${inputCls} text-lg font-semibold tabular-nums`}
            />
            <select
                name="budgetItemId"
                defaultValue={tx?.budgetItemId ?? ""}
                className={inputCls}
            >
                <option value="">Uncategorized</option>
                {items.map((i) => (
                    <option key={i.id} value={i.id}>
                        {i.name}
                    </option>
                ))}
            </select>
            <p className="-mt-1 text-xs text-muted">
                <Link
                    href="/budget"
                    className="font-semibold text-navy underline-offset-2 hover:underline"
                >
                    Add categories on the Budget tab
                </Link>
            </p>
            <input
                name="note"
                defaultValue={tx?.note ?? ""}
                placeholder="Note (optional)"
                maxLength={140}
                className={inputCls}
            />
            <input
                name="date"
                type="date"
                required
                max={today}
                defaultValue={tx?.date ?? today}
                className={inputCls}
            />
        </div>
    );
}

function AddForm({
    periodId,
    items,
    today,
    onDone,
}: {
    periodId: string;
    items: ItemOption[];
    today: string;
    onDone: () => void;
}) {
    const [state, action, pending] = useActionState<SpendState, FormData>(
        async (prev, formData) => {
            const res = await addTransaction(prev, formData);
            if (!res.error) onDone();
            return res;
        },
        {},
    );
    return (
        <form action={action} className="space-y-3">
            <input type="hidden" name="periodId" value={periodId} />
            <Fields items={items} today={today} autoFocus />
            {state.error && (
                <p className="text-sm font-medium text-danger">{state.error}</p>
            )}
            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
            >
                {pending ? "Saving…" : "Add expense"}
            </button>
        </form>
    );
}

/** Primary "Log expense" button that opens the add form in a modal. */
export function AddTransactionButton({
    periodId,
    items,
    today,
}: {
    periodId: string;
    items: ItemOption[];
    today: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white"
            >
                Log expense
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Add expense">
                <AddForm
                    periodId={periodId}
                    items={items}
                    today={today}
                    onDone={() => setOpen(false)}
                />
            </Modal>
        </>
    );
}

export function TransactionRow({
    tx,
    items,
    who,
    today,
}: {
    tx: Transaction;
    items: ItemOption[];
    who: string;
    today: string;
}) {
    const [open, setOpen] = useState(false);
    const [, startDelete] = useTransition();
    const [state, action, pending] = useActionState<SpendState, FormData>(
        async (prev, formData) => {
            const res = await updateTransaction(prev, formData);
            if (!res.error) setOpen(false);
            return res;
        },
        {},
    );

    const category = tx.budgetItemId
        ? (items.find((i) => i.id === tx.budgetItemId)?.name ?? "—")
        : "Uncategorized";

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left"
            >
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                        {category}
                        {tx.note && (
                            <span className="font-normal text-muted"> · {tx.note}</span>
                        )}
                    </p>
                    <p className="text-xs text-muted">{who}</p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                    {formatKES(tx.amount)}
                </span>
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="Edit expense">
                <form action={action} className="space-y-3">
                    <input type="hidden" name="id" value={tx.id} />
                    <Fields items={items} today={today} tx={tx} />
                    {state.error && (
                        <p className="text-sm font-medium text-danger">{state.error}</p>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={pending}
                            className="flex-1 rounded-xl bg-navy py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {pending ? "Saving…" : "Save"}
                        </button>
                        <button
                            type="button"
                            className="rounded-xl border border-mist px-4 py-3 text-sm font-semibold text-danger"
                            onClick={() =>
                                startDelete(async () => {
                                    const fd = new FormData();
                                    fd.set("id", tx.id);
                                    await deleteTransaction(fd);
                                    setOpen(false);
                                })
                            }
                        >
                            Delete
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

/** Floating "+" button that opens a bottom sheet with the add form. */
export function QuickAddSheet({
    periodId,
    items,
    today,
}: {
    periodId: string;
    items: ItemOption[];
    today: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Add expense"
                className="fixed bottom-24 right-1/2 z-40 flex h-14 w-14 translate-x-[calc(min(240px,50vw)-4rem)] items-center justify-center rounded-full bg-navy text-3xl font-light text-white shadow-lg"
            >
                +
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Add expense">
                <AddForm
                    periodId={periodId}
                    items={items}
                    today={today}
                    onDone={() => setOpen(false)}
                />
            </Modal>
        </>
    );
}
