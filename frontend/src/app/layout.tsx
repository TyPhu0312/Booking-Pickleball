// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "Pickleball Sao Mai",
//   description: "",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//       <html lang="en">
//       <body>
//           <main>
//               {children}
//           </main>
//       </body>
//       </html>
//   );
// }

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

