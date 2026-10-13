"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { loanPayments, loans } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import {
  amountSchema,
  entryDateSchema,
  idSchema,
  noteSchema,
  textSchema,
} from "@/lib/validation";

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
      name: textSchema(60, "Name the loan"),
      lender: textSchema(80, "Who's the lender?"),
      startingBalance: amountSchema,
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
      loanId: idSchema,
      amount: amountSchema,
      note: noteSchema,
      date: entryDateSchema,
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
