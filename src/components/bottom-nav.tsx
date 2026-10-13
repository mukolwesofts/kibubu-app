"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
    { href: "/home", label: "Home", icon: HomeIcon },
    { href: "/budget", label: "Budget", icon: BudgetIcon },
    { href: "/spend", label: "Spend", icon: SpendIcon },
    { href: "/savings", label: "Savings", icon: SavingsIcon },
    { href: "/loans", label: "Loans", icon: LoansIcon },
];

export function BottomNav() {
    const pathname = usePathname();
    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-cream">
            <div className="mx-auto flex w-full max-w-[480px]">
                {items.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? "text-navy" : "text-muted"
                                }`}
                        >
                            <Icon active={active} />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

function IconBase({
    active,
    children,
}: {
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? 2.4 : 1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {children}
        </svg>
    );
}

function HomeIcon({ active }: { active: boolean }) {
    return (
        <IconBase active={active}>
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
        </IconBase>
    );
}

function SpendIcon({ active }: { active: boolean }) {
    return (
        <IconBase active={active}>
            <rect x="3" y="6" width="18" height="14" rx="2" />
            <path d="M3 10h18" />
            <path d="M7 15h4" />
        </IconBase>
    );
}

function BudgetIcon({ active }: { active: boolean }) {
    return (
        <IconBase active={active}>
            <path d="M4 20V10" />
            <path d="M10 20V4" />
            <path d="M16 20v-8" />
            <path d="M22 20H2" />
        </IconBase>
    );
}

function SavingsIcon({ active }: { active: boolean }) {
    return (
        <IconBase active={active}>
            <path d="M19 5c-1.5-1.5-4.5-2-7-2-4.5 0-8 2.5-8 6.5 0 1.5.5 2.8 1.3 3.8L4 16l3 .8c1.1.7 2.4 1.2 4 1.2 4.5 0 9-2.7 9-7 0-2.4-1-4.5-1-6z" />
            <path d="M12 7.5v5" />
            <path d="M9.5 9.5h5" />
        </IconBase>
    );
}

function LoansIcon({ active }: { active: boolean }) {
    return (
        <IconBase active={active}>
            <path d="M12 3v18" />
            <path d="M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 1.8 2.7 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3" />
        </IconBase>
    );
}
