import { eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { loanPayments, loans } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatKES } from "@/lib/money";
import { AddLoanForm } from "./loan-forms";

export default async function LoansPage() {
    const user = await requireUser();
    const loanRows = await db.query.loans.findMany({
        where: eq(loans.householdId, user.householdId),
    });
    const payments = loanRows.length
        ? await db.query.loanPayments.findMany({
            where: inArray(
                loanPayments.loanId,
                loanRows.map((l) => l.id),
            ),
        })
        : [];

    const paidByLoan = new Map<string, number>();
    for (const p of payments) {
        paidByLoan.set(p.loanId, (paidByLoan.get(p.loanId) ?? 0) + p.amount);
    }

    return (
        <div className="space-y-5">
            <h1 className="text-2xl font-extrabold">Loans</h1>

            <div className="divide-y divide-mist/60 rounded-2xl border border-mist bg-white px-4">
                {loanRows.length === 0 && (
                    <p className="py-4 text-sm text-muted">No loans yet.</p>
                )}
                {loanRows.map((l) => {
                    const paid = paidByLoan.get(l.id) ?? 0;
                    const remaining = Math.max(l.startingBalance - paid, 0);
                    const pct = Math.min((paid / l.startingBalance) * 100, 100);
                    return (
                        <Link key={l.id} href={`/loans/${l.id}`} className="block py-3.5">
                            <div className="flex items-baseline justify-between text-sm">
                                <span className="font-semibold">
                                    {l.name}
                                    <span className="ml-1 font-normal text-muted">
                                        · {l.lender}
                                    </span>
                                </span>
                                <span className="font-bold tabular-nums">
                                    {formatKES(remaining)}{" "}
                                    <span className="font-normal text-muted">left</span>
                                </span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist/50">
                                <div
                                    className="h-full rounded-full bg-navy"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>

            <section className="rounded-2xl border border-mist bg-white p-4">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
                    New loan
                </h2>
                <AddLoanForm />
            </section>
        </div>
    );
}
