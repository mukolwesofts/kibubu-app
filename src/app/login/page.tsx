import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
    if (await getSessionUser()) redirect("/home");

    return (
        <div className="flex min-h-dvh flex-col justify-center py-12">
            <div className="mb-8 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/logo/kibubu-trim.png"
                    alt="Kibubu"
                    className="mx-auto h-16 w-auto"
                />
                <p className="mt-1 text-sm text-muted">Your shared household budget</p>
            </div>
            <div className="rounded-2xl border border-mist bg-white p-6">
                <LoginForm />
            </div>
        </div>
    );
}
