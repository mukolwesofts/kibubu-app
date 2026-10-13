"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/modal";
import { startNewPeriod, type PeriodState } from "@/app/(app)/actions/periods";

function PeriodForm({
    defaultDate,
    min,
    onDone,
}: {
    defaultDate: string;
    min?: string;
    onDone?: () => void;
}) {
    const [state, action, pending] = useActionState<PeriodState, FormData>(
        async (prev, fd) => {
            const res = await startNewPeriod(prev, fd);
            if (!res.error) onDone?.();
            return res;
        },
        {},
    );
    return (
        <form action={action} className="space-y-3">
            <label htmlFor="startDate" className="block text-sm font-semibold">
                Start date
            </label>
            <input
                id="startDate"
                name="startDate"
                type="date"
                required
                min={min}
                defaultValue={defaultDate}
                className="w-full rounded-xl border border-mist px-4 py-3 outline-none focus:border-navy"
            />
            {state.error && (
                <p className="text-sm font-medium text-danger">{state.error}</p>
            )}
            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
            >
                {pending ? "Starting…" : "Start period"}
            </button>
        </form>
    );
}

/** Full card version — used for the "first period" empty state. */
export function NewPeriodForm({
    defaultDate,
    min,
    first = false,
}: {
    defaultDate: string;
    min?: string;
    first?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-mist bg-white p-5">
            <h2 className="font-bold">
                {first ? "Start your first budget period" : "Start a new period"}
            </h2>
            <p className="mt-1 text-sm text-muted">
                {first
                    ? "Pick the date this budget starts."
                    : "The current period will close and your budget categories will carry over."}
            </p>
            <div className="mt-4">
                <PeriodForm defaultDate={defaultDate} min={min} />
            </div>
        </div>
    );
}

/** Chip-sized button that opens the start-period form in a modal. */
export function NewPeriodButton({
    defaultDate,
    min,
}: {
    defaultDate: string;
    min?: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="shrink-0 rounded-full border border-dashed border-muted px-3.5 py-1.5 text-xs font-semibold text-muted"
            >
                + New period
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Start a new period">
                <p className="mb-4 text-sm text-muted">
                    The current period will close and your budget categories will carry
                    over.
                </p>
                <PeriodForm
                    defaultDate={defaultDate}
                    min={min}
                    onDone={() => setOpen(false)}
                />
            </Modal>
        </>
    );
}
