import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
    title: "Kibubu",
    description: "A shared household budget",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${manrope.variable} font-sans antialiased`}>
                <div className="mx-auto min-h-dvh w-full max-w-[480px] px-4">
                    {children}
                </div>
            </body>
        </html>
    );
}
