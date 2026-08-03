import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/auth-provider";
import { PageHelp } from "../components/page-help";

export const metadata: Metadata = {
  title: "AutoStock",
  description: "Р•РґРёРЅР°СЏ Р±Р°Р·Р° Р°РІС‚РѕР·Р°РїС‡Р°СЃС‚РµР№",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          {children}
          <PageHelp />
        </AuthProvider>
      </body>
    </html>
  );
}
