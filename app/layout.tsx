import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yakındaki Market Fiyatları | En İyi Fiyat",
  description: "Konumunuza göre yakındaki marketlerin fiyatlarını karşılaştırın ve en uygun fiyatları bulun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800`}>
        {children}
      </body>
    </html>
  );
}
