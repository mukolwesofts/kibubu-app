import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireUser();
    return (
        <div className="pb-24">
            <header className="flex items-center justify-between py-4">
                <Link href="/home" aria-label="Kibubu home">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo/kibubu-trim.png"
                        alt="Kibubu"
                        className="h-8 w-auto"
                    />
                </Link>
                <Link
                    href="/settings"
                    aria-label="Settings"
                    className="rounded-full p-2 text-muted"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
                    </svg>
                </Link>
            </header>
            <main>{children}</main>
            <BottomNav />
        </div>
    );
}
