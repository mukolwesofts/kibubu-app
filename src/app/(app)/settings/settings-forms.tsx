"use client";

import { useActionState } from "react";
import { inviteByEmail, updateName, type SettingsState } from "./actions";

export function InviteForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    inviteByEmail,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="invite-email" className="block text-sm font-semibold">
        Invite your spouse
      </label>
      <div className="flex gap-2">
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="spouse@example.com"
          className="min-w-0 flex-1 rounded-xl border border-mist px-4 py-3 text-sm outline-none focus:border-navy"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Invite
        </button>
      </div>
      {state.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
      {state.sent && <p className="text-sm font-medium text-navy">Invite saved. They&apos;ll join your household when they sign in.</p>}
    </form>
  );
}

export function NameForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateName,
    {},
  );
  return (
    <form action={action} className="mt-3 flex gap-2">
      <input
        name="name"
        defaultValue={defaultName}
        placeholder="Your name"
        maxLength={60}
        className="min-w-0 flex-1 rounded-xl border border-mist px-4 py-2.5 text-sm outline-none focus:border-navy"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-navy px-4 py-2.5 text-sm font-semibold text-navy disabled:opacity-50"
      >
        Save
      </button>
      {state.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
    </form>
  );
}
