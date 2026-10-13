import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { todayNairobi } from "@/lib/dates";
import { sendReminderEmail } from "@/lib/email";

export const runtime = "nodejs";

// Vercel Cron calls this daily at 15:00 UTC (18:00 Nairobi).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayNairobi();
  const subscribed = await db.query.users.findMany({
    where: eq(users.reminderEnabled, true),
  });

  let sent = 0;
  for (const user of subscribed) {
    const logged = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.userId, user.id),
        eq(transactions.date, today),
      ),
      columns: { id: true },
    });
    if (logged) continue;
    try {
      await sendReminderEmail(user.email, user.name);
      sent++;
    } catch {
      // Don't fail the whole run over one bad address.
    }
  }

  return NextResponse.json({ ok: true, sent });
}
