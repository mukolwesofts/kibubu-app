"use client";

import { useActionState, useRef, useState } from "react";
import { addEntry, addGoal, type SavingsState } from "./actions";

const inputCls =
  "w-full rounded-xl border border-mist bg-transparent px-4 py-3 text-sm outline-none focus:border-navy";

export function AddGoalForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<SavingsState, FormData>(
    async (prev, formData) => {
      const res = await addGoal(prev, formData);
      if (!res.error) formRef.current?.reset();
      return res;
    },
    {},
  );
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input name="name" required placeholder="e.g. Emergency fund" className={inputCls} />
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
        className="w-full rounded-xl bg-navy py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add goal"}
      </button>
    </form>
  );
}

export function AddEntryForm({
  goalId,
  today,
}: {
  goalId: string;
  today: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [state, action, pending] = useActionState<SavingsState, FormData>(
    async (prev, formData) => {
      const res = await addEntry(prev, formData);
      if (!res.error) formRef.current?.reset();
      return res;
    },
    {},
  );
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="goalId" value={goalId} />
      <input type="hidden" name="type" value={type} />
      <div className="grid grid-cols-2 gap-2">
        {(["deposit", "withdrawal"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-xl border py-2.5 text-sm font-semibold capitalize ${
              type === t
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
        inputMode="numeric"
        placeholder="Amount (KSh)"
        className={`${inputCls} text-lg font-semibold tabular-nums`}
      />
      <input name="note" placeholder="Note (optional)" maxLength={140} className={inputCls} />
      <input name="date" type="date" required defaultValue={today} className={inputCls} />
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
