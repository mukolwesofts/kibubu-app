"use client";

import { useActionState } from "react";
import { startNewPeriod, type PeriodState } from "@/app/(app)/actions/periods";

export function NewPeriodForm({
  defaultDate,
  first = false,
}: {
  defaultDate: string;
  first?: boolean;
}) {
  const [state, action, pending] = useActionState<PeriodState, FormData>(
    startNewPeriod,
    {},
  );
  return (
    <form
      action={action}
      className="rounded-2xl border border-mist bg-white p-5"
    >
      <h2 className="font-bold">
        {first ? "Start your first budget period" : "Start a new period"}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {first
          ? "Pick the date this budget starts."
          : "The current period will close and your budget categories will carry over."}
      </p>
      <label htmlFor="startDate" className="mt-4 block text-sm font-semibold">
        Start date
      </label>
      <input
        id="startDate"
        name="startDate"
        type="date"
        required
        defaultValue={defaultDate}
        className="mt-1 w-full rounded-xl border border-mist px-4 py-3 outline-none focus:border-navy"
      />
      {state.error && (
        <p className="mt-2 text-sm font-medium text-danger">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Starting…" : "Start period"}
      </button>
    </form>
  );
}
