import type { ReactNode } from "react";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";

export const metadata = {
  title: "Exchange Core Admin",
  description: "Admin panel for exchange-core",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
