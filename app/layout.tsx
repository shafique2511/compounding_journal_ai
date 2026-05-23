import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider, ProtectedRoute } from "@/components/auth";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Compounding Journal AI",
  description: "Professional trade-by-trade journal for compounding, reviews, and AI-assisted analysis.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ProtectedRoute>
              {children}
            </ProtectedRoute>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
