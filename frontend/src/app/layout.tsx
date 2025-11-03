"use client";
import { ReactNode } from "react";
import "./globals.css"; // Các styles toàn cục

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="en">
        <body>
            <main>
                {children}
            </main>
        </body>
        </html>
    );
}

