"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    // Lock body scroll while the sheet is open.
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open || typeof document === "undefined") return null;

    // Portal to <body> so the sheet always paints above the bottom nav.
    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/40"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="max-h-[80dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl border-t border-mist bg-cream px-5 pt-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-full p-1.5 text-muted"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body,
    );
}
