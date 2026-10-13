import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { loanPayments, loans, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDate, todayNairobi } from "@/lib/dates";
import { formatKES } from "@/lib/money";
import { AddPaymentButton } from "../loan-forms";

export default async function LoanDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await requireUser();
    const { id } = await params;

    const loan = await db.query.loans.findFirst({ where: eq(loans.id, id) });
    if (!loan || loan.householdId !== user.householdId) notFound();

    const [payments, members] = await Promise.all([
        db.query.loanPayments.findMany({
            where: eq(loanPayments.loanId, loan.id),
            orderBy: [desc(loanPayments.date), desc(loanPayments.createdAt)],
        }),
        db.query.users.findMany({ where: eq(users.householdId, user.householdId) }),
    ]);

    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(loan.startingBalance - paid, 0);
    const pct = Math.min((paid / loan.startingBalance) * 100, 100);
    const nameOf = (uid: string) =>
        members.find((m) => m.id === uid)?.name ??
        members.find((m) => m.id === uid)?.email.split("@")[0] ??
        "—";

    return (
        <div className="space-y-5">
            <div>
                <Link href="/loans" className="text-xs font-semibold text-muted">
                    ← Loans
                </Link>
                <h1 className="mt-1 text-2xl font-extrabold">{loan.name}</h1>
                <p className="text-sm text-muted">{loan.lender}</p>
            </div>

            <section className="rounded-2xl border border-mist bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Remaining balance
                </p>
                <p className="mt-1 text-4xl font-extrabold tabular-nums">
                    {formatKES(remaining)}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist/50">
                    <div
                        className="h-full rounded-full bg-navy"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <p className="mt-1.5 text-sm text-muted">
                    {formatKES(paid)} paid of {formatKES(loan.startingBalance)}
                </p>
            </section>

            <AddPaymentButton loanId={loan.id} today={todayNairobi()} />

            <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
                    Payments
                </h2>
                <div className="divide-y divide-mist/60 rounded-2xl border border-mist bg-white px-4">
                    {payments.length === 0 && (
                        <p className="py-4 text-sm text-muted">No payments yet.</p>
                    )}
                    {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                            <div className="min-w-0">
                                <p className="font-semibold">
                                    Payment
                                    {p.note && (
                                        <span className="font-normal text-muted"> · {p.note}</span>
                                    )}
                                </p>
                                <p className="text-xs text-muted">
                                    {formatDate(p.date)} · {nameOf(p.userId)}
                                </p>
                            </div>
                            <span className="shrink-0 font-bold tabular-nums">
                                {formatKES(p.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
