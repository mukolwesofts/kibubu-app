"use client";

import { useRouter } from "next/navigation";

export function PeriodSelect({
    periods,
    currentId,
}: {
    periods: { id: string; label: string }[];
    currentId: string;
}) {
    const router = useRouter();
    return (
        <select
            value={currentId}
            onChange={(e) => router.push(`/home?period=${e.target.value}`)}
            aria-label="Switch period"
            className="min-w-0 flex-1 rounded-full border border-mist bg-white px-3.5 py-1.5 text-xs font-semibold text-navy outline-none"
        >
            {periods.map((p) => (
                <option key={p.id} value={p.id}>
                    {p.label}
                </option>
            ))}
        </select>
    );
}
