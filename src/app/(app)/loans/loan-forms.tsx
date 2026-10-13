"use client";

import { useActionState, useRef } from "react";
import { addLoan, addPayment, type LoanState } from "./actions";

const inputCls =
  "w-full rounded-xl border border-mist bg-transparent px-4 py-3 text-sm outline-none focus:border-navy";

export function AddLoanForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<LoanState, FormData>(
    async (prev, formData) => {
      const res = await addLoan(prev, formData);
      if (!res.error) formRef.current?.reset();
      return res;
    },
    {},
  );
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input name="name" required placeholder="e.g. Car loan" className={inputCls} />
      <input name="lender" required placeholder="Lender (e.g. ABC Bank)" className={inputCls} />
      <input
        name="startingBalance"
        required
        inputMode="numeric"
        placeholder="Amount borrowed (KSh)"
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
        {pending ? "Saving…" : "Add loan"}
      </button>
    </form>
  );
}

export function AddPaymentForm({
  loanId,
  today,
}: {
  loanId: string;
  today: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<LoanState, FormData>(
    async (prev, formData) => {
      const res = await addPayment(prev, formData);
      if (!res.error) formRef.current?.reset();
      return res;
    },
    {},
  );
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="loanId" value={loanId} />
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
        {pending ? "Saving…" : "Add payment"}
      </button>
    </form>
  );
}
