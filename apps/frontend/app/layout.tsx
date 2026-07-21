import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/auth-provider";

export const metadata: Metadata = {
  title: "AutoStock",
  description: "Единая база автозапчастей",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-slate-900 text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
