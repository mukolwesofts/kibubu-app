"use client";

import { useActionState, useState, useTransition } from "react";
import type { BudgetItem, Income } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { formatKES } from "@/lib/money";
import { Modal } from "@/components/modal";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
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
    "w-full rounded-xl border border-mist bg-transparent px-4 py-3 text-sm outline-none focus:border-navy";
const iconBtn =
    "shrink-0 rounded-full p-2 text-muted transition-colors hover:bg-mist/40 hover:text-navy";

// ---------- Income ----------

function IncomeFields({ entry, today }: { entry?: Income; today: string }) {
    return (
        <div className="space-y-3">
            <input
                name="source"
                required
                autoFocus
                defaultValue={entry?.source}
                placeholder="Salary, gig…"
                maxLength={80}
                className={inputCls}
            />
            <input
                name="amount"
                required
                inputMode="numeric"
                defaultValue={entry?.amount}
                placeholder="Amount (KSh)"
                className={`${inputCls} text-lg font-semibold tabular-nums`}
            />
            <input
                name="date"
                type="date"
                required
                max={today}
                defaultValue={entry?.date ?? today}
                className={inputCls}
            />
        </div>
    );
}

export function IncomeList({
    entries,
    periodId,
    today,
}: {
    entries: Income[];
    periodId: string;
    today: string;
}) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<Income | null>(null);
    const [, startDelete] = useTransition();

    const [addState, addAction, addPending] = useActionState<
        BudgetState,
        FormData
    >(
        async (prev, fd) => {
            const res = await addIncome(prev, fd);
            if (!res.error) setAddOpen(false);
            return res;
        },
        {},
    );

    const [editState, editAction, editPending] = useActionState<
        BudgetState,
        FormData
    >(
        async (prev, fd) => {
            const res = await updateIncome(prev, fd);
            if (!res.error) setEditing(null);
            return res;
        },
        {},
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
                    Income
                </h2>
                <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    aria-label="Add income"
                    className={iconBtn}
                >
                    <PlusIcon />
                </button>
            </div>

            <div className="mt-2 max-h-[30rem] divide-y divide-mist/60 overflow-y-auto rounded-2xl border border-mist bg-white px-4">
                {entries.length === 0 && (
                    <p className="py-4 text-sm text-muted">No income yet.</p>
                )}
                {entries.map((e) => (
                    <div key={e.id} className="flex items-center gap-1 py-2.5">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{e.source}</p>
                            <p className="text-xs text-muted">{formatDate(e.date)}</p>
                        </div>
                        <span className="shrink-0 text-sm font-bold tabular-nums">
                            {formatKES(e.amount)}
                        </span>
                        <button
                            type="button"
                            onClick={() => setEditing(e)}
                            aria-label={`Edit ${e.source}`}
                            className={iconBtn}
                        >
                            <PencilIcon size={15} />
                        </button>
                        <button
                            type="button"
                            aria-label={`Delete ${e.source}`}
                            className={`${iconBtn} hover:text-danger`}
                            onClick={() =>
                                startDelete(async () => {
                                    const fd = new FormData();
                                    fd.set("id", e.id);
                                    await deleteIncome(fd);
                                })
                            }
                        >
                            <TrashIcon size={15} />
                        </button>
                    </div>
                ))}
            </div>

            <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add income">
                <form action={addAction} className="space-y-3">
                    <input type="hidden" name="periodId" value={periodId} />
                    <IncomeFields today={today} />
                    {addState.error && (
                        <p className="text-sm font-medium text-danger">{addState.error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={addPending}
                        className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
                    >
                        {addPending ? "Saving…" : "Add income"}
                    </button>
                </form>
            </Modal>

            <Modal
                open={!!editing}
                onClose={() => setEditing(null)}
                title="Edit income"
            >
                {editing && (
                    <form action={editAction} className="space-y-3">
                        <input type="hidden" name="id" value={editing.id} />
                        <IncomeFields entry={editing} today={today} />
                        {editState.error && (
                            <p className="text-sm font-medium text-danger">
                                {editState.error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={editPending}
                            className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
                        >
                            {editPending ? "Saving…" : "Save changes"}
                        </button>
                    </form>
                )}
            </Modal>
        </>
    );
}

// ---------- Budget lines ----------

function ItemFields({ item }: { item?: BudgetItem }) {
    return (
        <div className="space-y-3">
            <input
                name="name"
                required
                autoFocus
                defaultValue={item?.name}
                placeholder="Category name"
                maxLength={60}
                className={inputCls}
            />
            <input
                name="plannedAmount"
                required
                inputMode="numeric"
                defaultValue={item?.plannedAmount}
                placeholder="Planned amount (KSh)"
                className={`${inputCls} text-lg font-semibold tabular-nums`}
            />
        </div>
    );
}

export function BudgetItemList({
    items,
    periodId,
}: {
    items: BudgetItem[];
    periodId: string;
}) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<BudgetItem | null>(null);
    const [, startDelete] = useTransition();

    const [addState, addAction, addPending] = useActionState<
        BudgetState,
        FormData
    >(
        async (prev, fd) => {
            const res = await addBudgetItem(prev, fd);
            if (!res.error) setAddOpen(false);
            return res;
        },
        {},
    );

    const [editState, editAction, editPending] = useActionState<
        BudgetState,
        FormData
    >(
        async (prev, fd) => {
            const res = await updateBudgetItem(prev, fd);
            if (!res.error) setEditing(null);
            return res;
        },
        {},
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
                    Budget lines
                </h2>
                <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    aria-label="Add budget line"
                    className={iconBtn}
                >
                    <PlusIcon />
                </button>
            </div>

            <div className="mt-2 max-h-[30rem] divide-y divide-mist/60 overflow-y-auto rounded-2xl border border-mist bg-white px-4">
                {items.length === 0 && (
                    <p className="py-4 text-sm text-muted">No categories yet.</p>
                )}
                {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-1 py-2.5">
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {item.name}
                        </p>
                        <span className="shrink-0 text-sm font-bold tabular-nums">
                            {formatKES(item.plannedAmount)}
                        </span>
                        <button
                            type="button"
                            onClick={() => setEditing(item)}
                            aria-label={`Edit ${item.name}`}
                            className={iconBtn}
                        >
                            <PencilIcon size={15} />
                        </button>
                        <button
                            type="button"
                            aria-label={`Delete ${item.name}`}
                            className={`${iconBtn} hover:text-danger`}
                            onClick={() =>
                                startDelete(async () => {
                                    const fd = new FormData();
                                    fd.set("id", item.id);
                                    await deleteBudgetItem(fd);
                                })
                            }
                        >
                            <TrashIcon size={15} />
                        </button>
                    </div>
                ))}
            </div>

            <Modal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title="Add budget line"
            >
                <form action={addAction} className="space-y-3">
                    <input type="hidden" name="periodId" value={periodId} />
                    <ItemFields />
                    {addState.error && (
                        <p className="text-sm font-medium text-danger">{addState.error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={addPending}
                        className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
                    >
                        {addPending ? "Saving…" : "Add category"}
                    </button>
                </form>
            </Modal>

            <Modal
                open={!!editing}
                onClose={() => setEditing(null)}
                title="Edit budget line"
            >
                {editing && (
                    <form action={editAction} className="space-y-3">
                        <input type="hidden" name="id" value={editing.id} />
                        <ItemFields item={editing} />
                        {editState.error && (
                            <p className="text-sm font-medium text-danger">
                                {editState.error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={editPending}
                            className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
                        >
                            {editPending ? "Saving…" : "Save changes"}
                        </button>
                    </form>
                )}
            </Modal>
        </>
    );
}
