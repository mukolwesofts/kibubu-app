"use client";

import { useActionState, useState } from "react";
import { requestOtp, verifyOtp, type LoginState } from "./actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");

  const [sendState, sendAction, sendPending] = useActionState(
    async (prev: LoginState, formData: FormData) => {
      const res = await requestOtp(prev, formData);
      if (res.sent) setStep("code");
      return res;
    },
    {},
  );

  const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtp, {});

  if (step === "code") {
    return (
      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <div>
          <p className="text-sm text-muted">
            We sent a 6-digit code to <span className="font-semibold text-navy">{email}</span>
          </p>
          <label htmlFor="code" className="mt-4 block text-sm font-semibold">
            Code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="123456"
            className="mt-1 w-full rounded-xl border border-mist px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-navy"
          />
        </div>
        {verifyState.error && (
          <p className="text-sm font-medium text-danger">{verifyState.error}</p>
        )}
        <button
          type="submit"
          disabled={verifyPending}
          className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {verifyPending ? "Verifying…" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => setStep("email")}
          className="w-full py-1 text-sm font-medium text-muted"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form action={sendAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-xl border border-mist px-4 py-3 outline-none focus:border-navy"
        />
      </div>
      {sendState.error && (
        <p className="text-sm font-medium text-danger">{sendState.error}</p>
      )}
      <button
        type="submit"
        disabled={sendPending}
        className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
      >
        {sendPending ? "Sending…" : "Send login code"}
      </button>
    </form>
  );
}
