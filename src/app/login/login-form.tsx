"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { requestOtp, verifyOtp, type LoginState } from "./actions";

export function LoginForm() {
    const [email, setEmail] = useState("");
    const [step, setStep] = useState<"email" | "code">("email");
    const [resendMsg, setResendMsg] = useState<string | null>(null);
    const [resendErr, setResendErr] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [resendPending, startResend] = useTransition();
    const [devCode, setDevCode] = useState<string | null>(null);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const resend = () =>
        startResend(async () => {
            const fd = new FormData();
            fd.set("email", email);
            const res = await requestOtp({}, fd);
            setResendErr(!!res.error);
            setResendMsg(res.error ?? "New code sent — check your inbox");
            if (res.sent) {
                setCooldown(60);
                if (res.devCode) setDevCode(res.devCode);
            }
        });

    const [sendState, sendAction, sendPending] = useActionState(
        async (prev: LoginState, formData: FormData) => {
            const res = await requestOtp(prev, formData);
            if (res.sent) {
                setStep("code");
                setCooldown(60);
                if (res.devCode) setDevCode(res.devCode);
            }
            return res;
        },
        {},
    );

    const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtp, {});

    if (step === "code") {
        return (
            <form action={verifyAction} className="space-y-4">
                <input type="hidden" name="email" value={email} />
                {devCode && (
                    <p className="rounded-xl border border-dashed border-muted bg-cream px-4 py-3 text-center text-sm">
                        Dev mode (no Resend key) — your code is{" "}
                        <span className="text-lg font-extrabold tracking-[0.3em]">{devCode}</span>
                    </p>
                )}
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
                {resendMsg && (
                    <p
                        className={`text-sm font-medium ${resendErr ? "text-danger" : "text-navy"}`}
                    >
                        {resendMsg}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={verifyPending}
                    className="w-full rounded-xl bg-navy py-3.5 font-semibold text-white disabled:opacity-50"
                >
                    {verifyPending ? "Verifying…" : "Sign in"}
                </button>
                <div className="flex items-center justify-between text-sm">
                    <button
                        type="button"
                        onClick={resend}
                        disabled={resendPending || cooldown > 0}
                        className="py-1 font-medium text-navy disabled:text-muted"
                    >
                        {cooldown > 0
                            ? `Resend code (${cooldown}s)`
                            : resendPending
                                ? "Sending…"
                                : "Resend code"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="py-1 font-medium text-muted"
                    >
                        Use a different email
                    </button>
                </div>
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
                {sendPending ? "Sending…" : "SEND CODE"}
            </button>
        </form>
    );
}
