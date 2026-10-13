"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/modal";
import { PlusIcon } from "@/components/icons";
import { addEntry, addGoal, type SavingsState } from "./actions";

const inputCls =
    "w-full rounded-xl border border-mist bg-transparent px-4 py-3 text-sm outline-none focus:border-navy";

export function NewGoalButton() {
    const [open, setOpen] = useState(false);
    const [state, action, pending] = useActionState<SavingsState, FormData>(
        async (prev, formData) => {
            const res = await addGoal(prev, formData);
            if (!res.error) setOpen(false);
            return res;
        },
        {},
    );
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3.5 font-semibold text-white"
            >
                <PlusIcon size={16} /> New goal
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="New savings goal">
                <form action={action} className="space-y-3">
                    <input
                        name="name"
                        required
                        autoFocus
                        placeholder="e.g. Emergency fund"
                        className={inputCls}
                    />
                    <input
                        name="target"
                        inputMode="numeric"
                        placeholder="Target amount (optional)"
                        className={`${inputCls} tabular-nums`}
                    />
                    {state.error && (
                        <p className="text-sm font-medium text-danger">{state.error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
                    >
                        {pending ? "Saving…" : "Add goal"}
                    </button>
                </form>
            </Modal>
        </>
    );
}

function EntryForm({
    goalId,
    today,
    initialType,
    onDone,
}: {
    goalId: string;
    today: string;
    initialType: "deposit" | "withdrawal";
    onDone: () => void;
}) {
    const [type, setType] = useState(initialType);
    const [state, action, pending] = useActionState<SavingsState, FormData>(
        async (prev, formData) => {
            const res = await addEntry(prev, formData);
            if (!res.error) onDone();
            return res;
        },
        {},
    );
    return (
        <form action={action} className="space-y-3">
            <input type="hidden" name="goalId" value={goalId} />
            <input type="hidden" name="type" value={type} />
            <div className="grid grid-cols-2 gap-2">
                {(["deposit", "withdrawal"] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`rounded-xl border py-2.5 text-sm font-semibold capitalize ${type === t
                            ? "border-navy bg-navy text-white"
                            : "border-mist bg-white text-muted"
                            }`}
                    >
                        {t === "deposit" ? "Deposit" : "Withdraw"}
                    </button>
                ))}
            </div>
            <input
                name="amount"
                required
                autoFocus
                inputMode="numeric"
                placeholder="Amount (KSh)"
                className={`${inputCls} text-lg font-semibold tabular-nums`}
            />
            <input
                name="note"
                placeholder="Note (optional)"
                maxLength={140}
                className={inputCls}
            />
            <input
                name="date"
                type="date"
                required
                max={today}
                defaultValue={today}
                className={inputCls}
            />
            {state.error && (
                <p className="text-sm font-medium text-danger">{state.error}</p>
            )}
            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
            >
                {pending ? "Saving…" : type === "deposit" ? "Add deposit" : "Withdraw"}
            </button>
        </form>
    );
}

export function EntryButtons({
    goalId,
    today,
}: {
    goalId: string;
    today: string;
}) {
    const [open, setOpen] = useState<"deposit" | "withdrawal" | null>(null);
    return (
        <>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setOpen("deposit")}
                    className="rounded-xl bg-navy py-3.5 font-semibold text-white"
                >
                    Deposit
                </button>
                <button
                    type="button"
                    onClick={() => setOpen("withdrawal")}
                    className="rounded-xl border border-navy py-3.5 font-semibold text-navy"
                >
                    Withdraw
                </button>
            </div>
            <Modal
                open={open !== null}
                onClose={() => setOpen(null)}
                title={open === "withdrawal" ? "Withdraw" : "Deposit"}
            >
                {open && (
                    <EntryForm
                        goalId={goalId}
                        today={today}
                        initialType={open}
                        onDone={() => setOpen(null)}
                    />
                )}
            </Modal>
        </>
    );
}
