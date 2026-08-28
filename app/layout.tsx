import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MZ Apps",
  description: "Mizoram Bazar & Jobs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">{children}</body>
    </html>
  );
}
