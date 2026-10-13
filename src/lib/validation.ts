import { z } from "zod";
import { todayNairobi } from "./dates";

/** Trimmed, lowercased, format-checked email. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

/** Integer KES. Coerces strings; rejects NaN, decimals, ≤0, and absurd values. */
export const amountSchema = z.coerce
  .number()
  .int("Whole shillings only")
  .positive("Amount must be more than 0")
  .max(1_000_000_000, "Amount is too large");

/** YYYY-MM-DD (may be in the future — e.g. a new period's start). */
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");

/** YYYY-MM-DD, not after today (Nairobi). */
export const entryDateSchema = dateOnlySchema.refine(
  (d) => d <= todayNairobi(),
  "Date can't be in the future",
);

/** All entity ids are crypto.randomUUID() — reject anything else up front. */
export const idSchema = z.uuid();

export const noteSchema = z
  .string()
  .trim()
  .max(140)
  .optional()
  .transform((v) => (v ? v : null));

/** Required free-text field. */
export const textSchema = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max);

/** Optional free-text field → null when empty. */
export const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));
