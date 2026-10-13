import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { deleteInvite, logout, toggleReminder } from "./actions";
import { InviteForm, NameForm } from "./settings-forms";

export default async function SettingsPage() {
  const user = await requireUser();
  const members = await db.query.users.findMany({
    where: eq(users.householdId, user.householdId),
  });
  const pendingInvites = await db.query.invites.findMany({
    where: eq(invites.householdId, user.householdId),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <section className="rounded-2xl border border-mist bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          You
        </h2>
        <p className="mt-2 text-sm font-medium">{user.email}</p>
        <NameForm defaultName={user.name ?? ""} />
      </section>

      <section className="rounded-2xl border border-mist bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          Household
        </h2>
        <ul className="mt-3 space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{m.name || m.email}</span>
              <span className="text-muted">{m.email}</span>
            </li>
          ))}
          {pendingInvites.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between text-sm">
              <span className="text-muted">{inv.email}</span>
              <form action={deleteInvite}>
                <input type="hidden" name="id" value={inv.id} />
                <button className="text-xs font-semibold text-danger">
                  Invited · Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-mist pt-4">
          <InviteForm />
        </div>
      </section>

      <section className="rounded-2xl border border-mist bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          Daily reminder
        </h2>
        <p className="mt-2 text-sm text-muted">
          Get an email at 6pm if you haven&apos;t logged any spending today.
        </p>
        <form action={toggleReminder} className="mt-3">
          <button className="w-full rounded-xl border border-navy py-3 text-sm font-semibold text-navy">
            {user.reminderEnabled ? "Turn off reminder" : "Turn on reminder"}
          </button>
        </form>
      </section>

      <form action={logout}>
        <button className="w-full rounded-xl border border-mist bg-white py-3.5 text-sm font-semibold text-danger">
          Log out
        </button>
      </form>
    </div>
  );
}
