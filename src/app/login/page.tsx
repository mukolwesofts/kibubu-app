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
            <footer className="mt-8 space-y-2 text-center text-xs text-muted">
                <p>
                    Beta software — data may change or be lost. Don't store
                    anything sensitive; your information is only used to run
                    this app.
                </p>
                <p>
                    © {new Date().getFullYear()}{" "}
                    <a
                        href="https://mukolwesofts.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-navy underline-offset-2 hover:underline"
                    >
                        Mukolwe Softs
                    </a>
                </p>
            </footer>
        </div>
    );
}
