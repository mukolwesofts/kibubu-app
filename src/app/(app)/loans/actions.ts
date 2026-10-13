"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { loanPayments, loans } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type LoanState = { error?: string };

async function getOwnedLoan(householdId: string, loanId: string) {
  const loan = await db.query.loans.findFirst({ where: eq(loans.id, loanId) });
  return loan?.householdId === householdId ? loan : null;
}

export async function addLoan(
  _prev: LoanState,
  formData: FormData,
): Promise<LoanState> {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Name the loan").max(60),
      lender: z.string().trim().min(1, "Who's the lender?").max(80),
      startingBalance: z.coerce
        .number()
        .int("Whole shillings only")
        .positive("Amount must be more than 0"),
    })
    .safeParse({
      name: formData.get("name"),
      lender: formData.get("lender"),
      startingBalance: formData.get("startingBalance"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.insert(loans).values({
    householdId: user.householdId,
    ...parsed.data,
  });
  revalidatePath("/loans");
  return {};
}

export async function addPayment(
  _prev: LoanState,
  formData: FormData,
): Promise<LoanState> {
  const user = await requireUser();
  const parsed = z
    .object({
      loanId: z.string().min(1),
      amount: z.coerce
        .number()
        .int("Whole shillings only")
        .positive("Amount must be more than 0"),
      note: z
        .string()
        .trim()
        .max(140)
        .optional()
        .transform((v) => (v ? v : null)),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
    })
    .safeParse({
      loanId: formData.get("loanId"),
      amount: formData.get("amount"),
      note: formData.get("note") || undefined,
      date: formData.get("date"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const loan = await getOwnedLoan(user.householdId, parsed.data.loanId);
  if (!loan) return { error: "Loan not found" };

  await db.insert(loanPayments).values({
    loanId: loan.id,
    userId: user.id,
    amount: parsed.data.amount,
    note: parsed.data.note,
    date: parsed.data.date,
  });
  revalidatePath("/loans");
  revalidatePath(`/loans/${loan.id}`);
  return {};
}
