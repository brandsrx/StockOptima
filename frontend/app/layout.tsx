import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StockOptima — Optimización Inteligente de Inventarios",
  description:
    "Sistema inteligente de optimización de inventarios y precios para mercados emergentes. Modelos de Investigación Operativa aplicados a MIPYMES.",
  keywords: ["inventarios", "EOQ", "investigación operativa", "MIPYMES", "optimización"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex transition-theme">
        <Sidebar />
        <main className="flex-1 ml-64 max-sm:ml-0 min-h-screen">
          <ErrorBoundary>
            <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">{children}</div>
          </ErrorBoundary>
        </main>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
            },
          }}
        />
      </body>
    </html>
  );
}
